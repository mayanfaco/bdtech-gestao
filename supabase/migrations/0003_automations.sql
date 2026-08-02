-- BDTECH Gestão — automações periódicas (pg_cron) e utilitário de dados de
-- demonstração. Rode DEPOIS de 0001_init.sql e 0002_expansion.sql.
--
-- Pré-requisito: habilite a extensão "pg_cron" em Database → Extensions no
-- painel do Supabase antes de rodar este arquivo (se ela não existir ainda,
-- o "create extension" abaixo já resolve, mas em alguns projetos precisa
-- ser feito primeiro pela interface).

create extension if not exists pg_cron;

-- ============================================================
-- 1. Automação diária — propostas sem resposta/vencendo/vencidas/
--    estagnadas, alertas de vencimento de contrato (90/60/30/15/7 dias),
--    oportunidades paradas, tarefas atrasadas.
-- ============================================================
create function run_daily_automations() returns void as $$
declare
  r record;
  v_threshold integer;
begin
  -- Propostas sem resposta (enviada/visualizada há mais dias que o prazo configurado)
  for r in
    select p.* from proposals p
    where p.status in ('enviada', 'visualizada')
      and p.sent_at is not null
      and p.sent_at < now() - (coalesce((select dias_prazo from automation_rules where key = 'proposta_sem_resposta_dias'), 7) || ' days')::interval
      and not exists (
        select 1 from notifications n
        where n.entity_type = 'proposal' and n.entity_id = p.id and n.type = 'proposta_sem_resposta'
          and n.created_at > now() - interval '3 days'
      )
  loop
    insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
      values (coalesce(r.responsavel_user_id, r.created_by), 'proposta_sem_resposta', 'proposal', r.id,
        'Proposta sem resposta', 'Nenhuma resposta do cliente desde o envio.', 'atencao', '/propostas/' || r.id);
  end loop;

  -- Propostas vencendo (dentro do prazo de aviso) ou já vencidas (expira automaticamente)
  for r in
    select p.* from proposals p
    where p.data_validade is not null
      and p.status not in ('aprovada', 'recusada', 'expirada', 'cancelada', 'arquivada')
  loop
    if r.data_validade < current_date then
      update proposals set status = 'expirada' where id = r.id;
      insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
        values (coalesce(r.responsavel_user_id, r.created_by), 'proposta_vencida', 'proposal', r.id,
          'Proposta expirada', 'A validade desta proposta já passou.', 'atencao', '/propostas/' || r.id);
    elsif r.data_validade <= current_date + (coalesce((select dias_prazo from automation_rules where key = 'proposta_vencendo_dias_antes'), 3) || ' days')::interval
      and not exists (select 1 from notifications n where n.entity_type = 'proposal' and n.entity_id = r.id and n.type = 'proposta_vencendo' and n.created_at > now() - interval '3 days')
    then
      insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
        values (coalesce(r.responsavel_user_id, r.created_by), 'proposta_vencendo', 'proposal', r.id,
          'Proposta vencendo', 'A validade termina em breve.', 'atencao', '/propostas/' || r.id);
    end if;
  end loop;

  -- Propostas estagnadas em negociação
  for r in
    select p.* from proposals p
    where p.status = 'em_negociacao'
      and p.status_changed_at < now() - (coalesce((select dias_prazo from automation_rules where key = 'oportunidade_parada_dias'), 10) || ' days')::interval
      and not exists (select 1 from notifications n where n.entity_type = 'proposal' and n.entity_id = p.id and n.type = 'proposta_estagnada' and n.created_at > now() - interval '5 days')
  loop
    insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
      values (coalesce(r.responsavel_user_id, r.created_by), 'proposta_estagnada', 'proposal', r.id,
        'Proposta estagnada em negociação', 'Sem mudança de status há vários dias.', 'atencao', '/propostas/' || r.id);
  end loop;

  -- Contratos: alertas de vencimento em 90/60/30/15/7 dias (idempotente por contract_expiry_alerts_sent)
  for v_threshold in select unnest(array[90, 60, 30, 15, 7]) loop
    for r in
      select c.* from contracts c
      where c.status in ('assinado', 'ativo', 'proximo_vencimento')
        and c.data_termino = current_date + (v_threshold || ' days')::interval
        and not exists (select 1 from contract_expiry_alerts_sent a where a.contract_id = c.id and a.threshold_days = v_threshold)
    loop
      insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
        values (coalesce(r.responsavel_user_id, r.created_by), 'contrato_vencendo', 'contract', r.id,
          'Contrato vencendo em ' || v_threshold::text || ' dias', 'Vigência até ' || r.data_termino::text,
          case when v_threshold <= 30 then 'urgente' else 'atencao' end, '/contratos/' || r.id);
      insert into contract_expiry_alerts_sent (contract_id, threshold_days) values (r.id, v_threshold);
    end loop;
  end loop;

  -- Contratos a <=30 dias do vencimento viram "próximo do vencimento"; a 90 dias, cria tarefa de renovação
  update contracts set status = 'proximo_vencimento'
    where status in ('assinado', 'ativo') and data_termino <= current_date + interval '30 days';

  for r in
    select c.* from contracts c
    where c.status in ('assinado', 'ativo', 'proximo_vencimento')
      and c.data_termino = current_date + interval '90 days'
      and not exists (select 1 from tasks t where t.contract_id = c.id and t.origem_automacao = 'contrato_renovacao_90d')
  loop
    insert into tasks (titulo, prazo, contract_id, responsavel_user_id, created_by, origem_automacao)
      values ('Iniciar renovação do contrato', now() + interval '3 days', r.id, r.responsavel_user_id, r.created_by, 'contrato_renovacao_90d');
  end loop;

  -- Oportunidades sem movimentação recente
  for r in
    select o.* from opportunities o
    where o.status = 'aberta'
      and o.stage_changed_at < now() - (coalesce((select dias_prazo from automation_rules where key = 'oportunidade_parada_dias'), 10) || ' days')::interval
      and not exists (select 1 from notifications n where n.entity_type = 'opportunity' and n.entity_id = o.id and n.type = 'oportunidade_parada' and n.created_at > now() - interval '5 days')
  loop
    insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
      values (coalesce(r.responsavel_user_id, r.created_by), 'oportunidade_parada', 'opportunity', r.id,
        'Oportunidade sem movimentação', 'Nenhuma mudança de etapa há vários dias.', 'atencao', '/oportunidades/' || r.id);
  end loop;

  -- Tarefas atrasadas (uma notificação por dia, não por execução)
  for r in
    select t.* from tasks t
    where t.status not in ('concluida', 'cancelada') and t.prazo is not null and t.prazo < now()
      and not exists (select 1 from notifications n where n.entity_type = 'task' and n.entity_id = t.id and n.type = 'tarefa_atrasada' and n.created_at > now() - interval '20 hours')
  loop
    insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
      values (coalesce(r.responsavel_user_id, r.created_by), 'tarefa_atrasada', 'task', r.id,
        'Tarefa atrasada', r.titulo, 'urgente', '/tarefas/' || r.id);
  end loop;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- 2. Lembretes de reunião — granularidade mais fina (de hora em hora)
-- ============================================================
create function run_meeting_reminders() returns void as $$
declare
  r record;
begin
  for r in
    select e.* from calendar_events e
    where e.status in ('agendado', 'confirmado')
      and e.data_inicio between now() and now() + interval '2 hours'
      and not exists (select 1 from notifications n where n.entity_type = 'calendar_event' and n.entity_id = e.id and n.type = 'reuniao_proxima')
  loop
    insert into notifications (user_id, type, entity_type, entity_id, title, body, severity, route)
      values (coalesce(r.responsavel_user_id, r.created_by), 'reuniao_proxima', 'calendar_event', r.id,
        'Reunião em breve', r.titulo || ' às ' || to_char(r.data_inicio, 'HH24:MI'), 'info', '/calendario/' || r.id);
  end loop;
end;
$$ language plpgsql security definer set search_path = public;

-- Agendamento: 11:00 UTC = 08:00 em Fortaleza (sem horário de verão)
select cron.schedule('bdtech-daily-automations', '0 11 * * *', $$select run_daily_automations();$$);
select cron.schedule('bdtech-hourly-meetings', '0 * * * *', $$select run_meeting_reminders();$$);

-- ============================================================
-- 3. Wipe de dados de demonstração — admin-only, apaga em ordem segura de FK
-- ============================================================
create function wipe_demo_data() returns void as $$
begin
  if not has_permission('configuracoes', 'administrar') then
    raise exception 'Apenas administradores podem remover dados de demonstração.';
  end if;
  delete from task_comments where task_id in (select id from tasks where is_demo);
  delete from task_checklist_items where task_id in (select id from tasks where is_demo);
  delete from tasks where is_demo;
  delete from proposal_versions where proposal_id in (select id from proposals where is_demo);
  delete from proposal_items where proposal_id in (select id from proposals where is_demo);
  delete from contract_signature_requests where contract_id in (select id from contracts where is_demo);
  delete from contracts where is_demo;
  delete from proposals where is_demo;
  delete from calendar_events where is_demo;
  delete from opportunity_stage_history where opportunity_id in (select id from opportunities where is_demo);
  delete from opportunities where is_demo;
  delete from client_contacts where is_demo;
  delete from clients where is_demo;
  delete from leads where is_demo;
  delete from activity_log where is_demo;
  delete from attachments where is_demo;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function wipe_demo_data() from public;
grant execute on function wipe_demo_data() to authenticated;
