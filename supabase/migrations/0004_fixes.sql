-- BDTECH Gestão — correções pós-lançamento
-- Rode isto DEPOIS de 0001_init.sql e 0002_expansion.sql.
--
-- Corrige dois bugs reais encontrados em produção:
--
-- 1) company_settings foi desenhada em 0001 como "uma linha por usuário"
--    (unique(user_id)), mas o app inteiro sempre tratou como uma única
--    linha compartilhada da empresa (.maybeSingle() sem filtro em
--    ConfiguracoesEmpresa/PropostaForm/ContratoForm). Um fix anterior de
--    RLS criou uma linha por conta, e com mais de uma linha o
--    .maybeSingle() falha silenciosamente — página de Configurações em
--    branco e "Contratada" nunca preenchida sozinha nas Propostas/Contratos.
--
-- 2) Os triggers de histórico de status/etapa (proposals, contracts,
--    opportunities) eram BEFORE INSERT e tentavam gravar uma linha na
--    tabela de histórico referenciando new.id — mas em um BEFORE INSERT
--    a linha ainda não existe na tabela principal, então a FK falha
--    ("violates foreign key constraint ..._fkey") na primeira vez que
--    qualquer proposta/contrato/oportunidade é criado. A correção separa
--    cada trigger em um BEFORE (só ajusta a própria linha) e um AFTER
--    (grava histórico/activity_log/tarefas, com a linha já existindo).

-- ============================================================
-- 1. company_settings — singleton de verdade
-- ============================================================
delete from company_settings
where id not in (select id from company_settings order by updated_at desc limit 1);
alter table company_settings drop constraint if exists company_settings_user_id_key;

-- ============================================================
-- 2. Propostas
-- ============================================================
create or replace function log_proposal_status_change_before() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    new.status_changed_at = now();
    if new.status = 'enviada' and new.sent_at is null then
      new.sent_at = now();
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function log_proposal_status_change_after() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into proposal_status_history (proposal_id, status) values (new.id, new.status);
    insert into activity_log (entity_type, entity_id, activity_type, title, old_value, new_value, user_id)
      values ('proposal', new.id, 'status_change', 'Status da proposta alterado',
        case when tg_op = 'UPDATE' then to_jsonb(old.status) else null end, to_jsonb(new.status), auth.uid());
    if new.status = 'enviada' and (
      (tg_op = 'INSERT' and new.sent_at is not null) or
      (tg_op = 'UPDATE' and old.sent_at is null and new.sent_at is not null)
    ) then
      insert into tasks (titulo, prazo, proposal_id, responsavel_user_id, created_by, origem_automacao)
        values ('Fazer follow-up: proposta enviada',
          now() + make_interval(days => coalesce((select dias_prazo from automation_rules where key = 'proposta_followup_dias'), 3)),
          new.id, new.responsavel_user_id, auth.uid(), 'proposta_enviada_followup');
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_proposal_status_insert on proposals;
drop trigger if exists trg_proposal_status_update on proposals;
create trigger trg_proposal_status_before before insert or update on proposals for each row execute function log_proposal_status_change_before();
create trigger trg_proposal_status_after after insert or update on proposals for each row execute function log_proposal_status_change_after();

-- ============================================================
-- 3. Contratos
-- ============================================================
create or replace function log_contract_status_change_before() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    new.status_changed_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function log_contract_status_change_after() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into contract_status_history (contract_id, status) values (new.id, new.status);
    insert into activity_log (entity_type, entity_id, activity_type, title, old_value, new_value, user_id)
      values ('contract', new.id, 'status_change', 'Status do contrato alterado',
        case when tg_op = 'UPDATE' then to_jsonb(old.status) else null end, to_jsonb(new.status), auth.uid());
    if new.status = 'aguardando_assinatura' then
      insert into tasks (titulo, prazo, contract_id, responsavel_user_id, created_by, origem_automacao)
        values ('Cobrar assinatura do contrato',
          now() + make_interval(days => coalesce((select dias_prazo from automation_rules where key = 'contrato_assinatura_followup_dias'), 5)),
          new.id, new.responsavel_user_id, auth.uid(), 'contrato_aguardando_assinatura');
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_contract_status_insert on contracts;
drop trigger if exists trg_contract_status_update on contracts;
create trigger trg_contract_status_before before insert or update on contracts for each row execute function log_contract_status_change_before();
create trigger trg_contract_status_after after insert or update on contracts for each row execute function log_contract_status_change_after();

-- ============================================================
-- 4. Oportunidades
-- ============================================================
create or replace function log_opportunity_stage_change_before() returns trigger as $$
declare
  v_is_won boolean;
  v_is_lost boolean;
begin
  if (tg_op = 'INSERT') or (new.stage_id is distinct from old.stage_id) then
    new.stage_changed_at = now();
    select is_won, is_lost into v_is_won, v_is_lost from pipeline_stages where id = new.stage_id;
    if v_is_won and new.ganha_em is null then
      new.status = 'ganha';
      new.ganha_em = now();
    elsif v_is_lost and new.perdida_em is null then
      new.status = 'perdida';
      new.perdida_em = now();
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function log_opportunity_stage_change_after() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.stage_id is distinct from old.stage_id) then
    insert into opportunity_stage_history (opportunity_id, from_stage_id, to_stage_id, changed_by)
      values (new.id, case when tg_op = 'UPDATE' then old.stage_id else null end, new.stage_id, auth.uid());
    insert into activity_log (entity_type, entity_id, activity_type, title, old_value, new_value, user_id)
      values ('opportunity', new.id, 'stage_change', 'Etapa da oportunidade alterada',
        case when tg_op = 'UPDATE' then to_jsonb(old.stage_id) else null end, to_jsonb(new.stage_id), auth.uid());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_opportunity_stage_insert on opportunities;
drop trigger if exists trg_opportunity_stage_update on opportunities;
create trigger trg_opportunity_stage_before before insert or update on opportunities for each row execute function log_opportunity_stage_change_before();
create trigger trg_opportunity_stage_after after insert or update on opportunities for each row execute function log_opportunity_stage_change_after();
