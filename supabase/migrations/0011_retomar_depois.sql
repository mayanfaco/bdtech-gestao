-- BDTECH Gestão — "Retomar depois": cliente que pediu para conversar mais
-- tarde (próximo mês, próximo ano...). O cartão sai dos funis, fica guardado
-- e volta sozinho para a atenção na data combinada.
-- Rode DEPOIS da 0010. SEGURO: só adiciona colunas e atualiza a função de
-- automação. Nada é apagado. Pode ser rodada mais de uma vez.

-- 1. Colunas novas (contatos e propostas)
alter table leads add column if not exists retomar_em date;
alter table leads add column if not exists retomar_obs text;
alter table leads add column if not exists retomado_em timestamptz;
alter table proposals add column if not exists retomar_em date;
alter table proposals add column if not exists retomar_obs text;
alter table proposals add column if not exists retomado_em timestamptz;

create index if not exists leads_retomar_em_idx on leads (retomar_em) where retomar_em is not null;
create index if not exists proposals_retomar_em_idx on proposals (retomar_em) where retomar_em is not null;

-- 2. Novo tipo de aviso
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in (
  'tarefa_atrasada','tarefa_proxima','reuniao_proxima','proposta_sem_resposta',
  'proposta_vencendo','proposta_vencida','proposta_estagnada',
  'contrato_aguardando_assinatura','contrato_vencendo','oportunidade_parada',
  'google_sync_error',
  'followup_hoje','lead_sem_resposta','lead_reativado','retomar_cliente'
));

-- 3. Automação: quem está "para retomar depois" não recebe cobrança; na data
--    combinada volta para a atenção (retomado_em) e gera um aviso.
create or replace function run_funnel_automations() returns integer as $$
declare
  r record;
  v_sem_resposta integer := coalesce((select dias_prazo from automation_rules where key = 'prospeccao_sem_resposta_dias' and ativo), 1);
  v_prop_inicio integer := coalesce((select dias_prazo from automation_rules where key = 'followup_proposta_inicio_dias' and ativo), 2);
  v_movidos integer := 0;
begin
  -- 6.0 Chegou a data combinada → volta para a atenção
  for r in
    select l.* from leads l
    where l.deleted_at is null and l.retomar_em is not null and l.retomar_em <= current_date
  loop
    update leads set retomar_em = null, retomado_em = now(), followup_passo = null, followup_inicio = null,
        funil_etapa = case when funil_etapa in ('follow_up','geladeira','sem_interesse') then 'respondeu' else funil_etapa end
      where id = r.id;
    insert into activity_log (entity_type, entity_id, activity_type, title, body)
      values ('lead', r.id, 'system', 'Hora de retomar', coalesce(r.retomar_obs, 'Data combinada com o cliente chegou.'));
    insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
      values (coalesce(r.responsavel_user_id, r.created_by), 'retomar_cliente', 'lead', r.id,
        'Hora de retomar: ' || coalesce(nullif(r.empresa, ''), r.nome),
        coalesce(r.retomar_obs, 'Chegou a data combinada para voltar a conversar.'), 'atencao', '/funis/followup');
    v_movidos := v_movidos + 1;
  end loop;

  for r in
    select p.*, c.nome as cliente_nome from proposals p left join clients c on c.id = p.client_id
    where p.deleted_at is null and p.retomar_em is not null and p.retomar_em <= current_date
  loop
    update proposals set retomar_em = null, retomado_em = now(), followup_passo = null, followup_inicio = null,
        ultimo_contato_em = now()
      where id = r.id;
    insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
      values (coalesce(r.responsavel_user_id, r.created_by), 'retomar_cliente', 'proposal', r.id,
        'Hora de retomar: ' || coalesce(r.cliente_nome, r.titulo, 'proposta'),
        coalesce(r.retomar_obs, 'Chegou a data combinada para voltar a conversar.'), 'atencao', '/funis/followup');
    v_movidos := v_movidos + 1;
  end loop;

  -- 6.1 Lead abordado sem resposta → follow-up (1º toque)
  for r in
    select l.* from leads l
    where l.deleted_at is null and l.retomar_em is null and l.retomado_em is null
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
    where l.deleted_at is null and l.funil_etapa = 'geladeira' and l.retomar_em is null
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
    where p.deleted_at is null and p.retomar_em is null and p.retomado_em is null
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
        where l.deleted_at is null and l.retomar_em is null and l.funil_etapa = 'follow_up' and l.followup_passo between 1 and 6
          and l.followup_inicio + funil_dia_toque(l.followup_passo) <= current_date
      union all
      select coalesce(p.responsavel_user_id, p.created_by)
        from proposals p
        where p.deleted_at is null and p.retomar_em is null and p.status in ('enviada','visualizada','em_negociacao')
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
