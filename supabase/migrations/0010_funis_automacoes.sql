-- BDTECH Gestão — Funis (Prospecção, Follow-up, Vendas) com automações,
-- progresso do tutorial. Rode isto DEPOIS das migrations anteriores (0001 a 0009),
-- no SQL Editor do Supabase.
--
-- SEGURO PARA DADOS EXISTENTES: esta migration só ADICIONA colunas, tabelas,
-- regras e funções. Nada é apagado nem renomeado. Pode ser rodada mais de uma
-- vez sem efeito colateral (tudo usa "if not exists" / "on conflict do nothing").

-- ============================================================
-- 1. Leads ganham posição no funil de prospecção/follow-up
-- ============================================================
alter table leads add column if not exists funil_etapa text;
alter table leads add column if not exists tipo_local text;
alter table leads add column if not exists abordado_em timestamptz;
alter table leads add column if not exists ultimo_contato_em timestamptz;
alter table leads add column if not exists followup_passo integer;
alter table leads add column if not exists followup_inicio date;
alter table leads add column if not exists reativar_em date;
alter table leads add column if not exists reuniao_em timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_funil_etapa_check') then
    alter table leads add constraint leads_funil_etapa_check check (funil_etapa is null or funil_etapa in (
      'para_abordar','mensagem_enviada','follow_up','respondeu','reuniao',
      'virou_cliente','sem_interesse','geladeira'
    ));
  end if;
end $$;

alter table leads alter column funil_etapa set default 'para_abordar';

-- Leads antigos: só ganham uma etapa coerente com o status que já tinham.
-- Os convertidos (hoje: todos) ficam como "virou_cliente" e não aparecem nos
-- quadros de prospecção — continuam intactos em Clientes.
update leads set funil_etapa = case
    when status = 'convertido' then 'virou_cliente'
    when status = 'descartado' then 'sem_interesse'
    when status = 'em_contato' then 'mensagem_enviada'
    when status = 'qualificado' then 'respondeu'
    else 'para_abordar'
  end
  where funil_etapa is null;

create index if not exists leads_funil_etapa_idx on leads (funil_etapa) where deleted_at is null;

-- ============================================================
-- 2. Propostas ganham controle de follow-up (o funil de vendas
--    usa o status que a proposta já tem)
-- ============================================================
alter table proposals add column if not exists followup_passo integer;
alter table proposals add column if not exists followup_inicio date;
alter table proposals add column if not exists ultimo_contato_em timestamptz;

-- ============================================================
-- 3. Regras configuráveis (aparecem em Configurações → Automações)
-- ============================================================
insert into automation_rules (key, label, dias_prazo, ativo) values
  ('prospeccao_sem_resposta_dias', 'Prospecção: sem resposta vai para o follow-up depois de (dias)', 1, true),
  ('followup_toque_1', 'Follow-up: 1º toque (dias após a primeira mensagem)', 1, true),
  ('followup_toque_2', 'Follow-up: 2º toque (dias após a primeira mensagem)', 2, true),
  ('followup_toque_3', 'Follow-up: 3º toque (dias após a primeira mensagem)', 4, true),
  ('followup_toque_4', 'Follow-up: 4º toque (dias após a primeira mensagem)', 7, true),
  ('followup_toque_5', 'Follow-up: 5º toque (dias após a primeira mensagem)', 10, true),
  ('followup_toque_6', 'Follow-up: último toque / despedida (dias após a primeira mensagem)', 14, true),
  ('followup_proposta_inicio_dias', 'Proposta parada entra no follow-up depois de (dias)', 2, true),
  ('geladeira_reativar_dias', 'Contato sem resposta volta para a prospecção depois de (dias)', 60, true)
on conflict (key) do nothing;

-- ============================================================
-- 4. Novos tipos de aviso
-- ============================================================
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in (
  'tarefa_atrasada','tarefa_proxima','reuniao_proxima','proposta_sem_resposta',
  'proposta_vencendo','proposta_vencida','proposta_estagnada',
  'contrato_aguardando_assinatura','contrato_vencendo','oportunidade_parada',
  'google_sync_error',
  'followup_hoje','lead_sem_resposta','lead_reativado'
));

-- ============================================================
-- 5. Progresso do tutorial (uma linha por usuário)
-- ============================================================
-- Administrador pode desligar a exigência do tutorial em Configurações.
alter table company_settings add column if not exists exigir_tutorial boolean not null default true;

create table if not exists user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  tutorial jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table user_progress enable row level security;
drop policy if exists "own select" on user_progress;
create policy "own select" on user_progress for select using (user_id = auth.uid());
drop policy if exists "own insert" on user_progress;
create policy "own insert" on user_progress for insert with check (user_id = auth.uid());
drop policy if exists "own update" on user_progress;
create policy "own update" on user_progress for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- 6. Automação dos funis
--    - Mensagem enviada e nada mudou no cartão → cai no follow-up
--    - Proposta enviada/em negociação parada → entra no follow-up
--    - Contato "na geladeira" volta para a prospecção na data marcada
--    - Um aviso por dia com o total de follow-ups do dia
--    Roda de hora em hora (pg_cron) e também toda vez que alguém abre os
--    funis, então funciona mesmo se o pg_cron estiver desligado.
-- ============================================================
create or replace function funil_dia_toque(p_passo integer) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select dias_prazo from automation_rules where key = 'followup_toque_' || p_passo),
    (array[1,2,4,7,10,14])[least(greatest(p_passo,1),6)]
  );
$$;

create or replace function run_funnel_automations() returns integer as $$
declare
  r record;
  v_sem_resposta integer := coalesce((select dias_prazo from automation_rules where key = 'prospeccao_sem_resposta_dias' and ativo), 1);
  v_prop_inicio integer := coalesce((select dias_prazo from automation_rules where key = 'followup_proposta_inicio_dias' and ativo), 2);
  v_movidos integer := 0;
begin
  -- 6.1 Lead abordado sem resposta → follow-up (1º toque)
  for r in
    select l.* from leads l
    where l.deleted_at is null
      and l.funil_etapa = 'mensagem_enviada'
      and coalesce(l.ultimo_contato_em, l.abordado_em, l.updated_at) < now() - make_interval(days => v_sem_resposta)
  loop
    update leads set funil_etapa = 'follow_up', followup_passo = 1,
        followup_inicio = coalesce(r.abordado_em, r.ultimo_contato_em, r.updated_at)::date
      where id = r.id;
    insert into activity_log (entity_type, entity_id, activity_type, title, body)
      values ('lead', r.id, 'system', 'Foi para o follow-up', 'Sem resposta depois da primeira mensagem.');
    v_movidos := v_movidos + 1;
  end loop;

  -- 6.2 Geladeira → volta para "Para abordar" na data marcada
  for r in
    select l.* from leads l
    where l.deleted_at is null and l.funil_etapa = 'geladeira'
      and l.reativar_em is not null and l.reativar_em <= current_date
  loop
    update leads set funil_etapa = 'para_abordar', followup_passo = null, followup_inicio = null,
        reativar_em = null, abordado_em = null
      where id = r.id;
    insert into activity_log (entity_type, entity_id, activity_type, title, body)
      values ('lead', r.id, 'system', 'Voltou para a prospecção', 'Hora de tentar de novo.');
    insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
      values (coalesce(r.responsavel_user_id, r.created_by), 'lead_reativado', 'lead', r.id,
        'Contato voltou para a prospecção', r.nome || ' — hora de tentar de novo.', 'info', '/funis/prospeccao');
    v_movidos := v_movidos + 1;
  end loop;

  -- 6.3 Proposta enviada/em negociação parada → follow-up (1º toque hoje)
  for r in
    select p.* from proposals p
    where p.deleted_at is null
      and p.status in ('enviada','visualizada','em_negociacao')
      and p.followup_passo is null
      and greatest(p.status_changed_at, coalesce(p.ultimo_contato_em, p.status_changed_at))
          < now() - make_interval(days => v_prop_inicio)
  loop
    update proposals set followup_passo = 1, followup_inicio = current_date - funil_dia_toque(1)
      where id = r.id;
    v_movidos := v_movidos + 1;
  end loop;

  -- 6.4 Um aviso por dia por pessoa: "Você tem N follow-ups hoje"
  for r in
    with devidos as (
      select coalesce(l.responsavel_user_id, l.created_by) as uid
        from leads l
        where l.deleted_at is null and l.funil_etapa = 'follow_up' and l.followup_passo between 1 and 6
          and l.followup_inicio + funil_dia_toque(l.followup_passo) <= current_date
      union all
      select coalesce(p.responsavel_user_id, p.created_by)
        from proposals p
        where p.deleted_at is null and p.status in ('enviada','visualizada','em_negociacao')
          and p.followup_passo between 1 and 6
          and p.followup_inicio + funil_dia_toque(p.followup_passo) <= current_date
    )
    select uid, count(*) as total from devidos where uid is not null group by uid
  loop
    if not exists (
      select 1 from notifications n
      where n.user_id = r.uid and n.type = 'followup_hoje' and n.created_at::date = current_date
    ) then
      insert into notifications (user_id, type, title, body, severity, route)
        values (r.uid, 'followup_hoje', 'Follow-ups de hoje',
          'Você tem ' || r.total || ' mensagem(ns) para mandar hoje.', 'atencao', '/funis/followup');
    end if;
  end loop;

  return v_movidos;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function run_funnel_automations() from public;
grant execute on function run_funnel_automations() to authenticated;
revoke execute on function funil_dia_toque(integer) from public;
grant execute on function funil_dia_toque(integer) to authenticated;

-- Agendamento de hora em hora (só se o pg_cron existir; se não existir, a
-- automação roda quando alguém abre os funis).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('bdtech-funis') where exists (select 1 from cron.job where jobname = 'bdtech-funis');
    perform cron.schedule('bdtech-funis', '15 * * * *', 'select run_funnel_automations();');
  end if;
end $$;
