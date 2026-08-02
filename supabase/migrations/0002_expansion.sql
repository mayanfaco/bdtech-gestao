-- BDTECH Gestão — expansão para o MVP completo (CRM, Tarefas, papéis/permissões,
-- timeline unificada, automações, Google Calendar, stub de assinatura eletrônica).
-- Rode isto DEPOIS de 0001_init.sql, no SQL Editor do Supabase. Como ainda não
-- existe nenhum dado real em nenhuma tabela, esta migration pode alterar/renomear
-- colunas e regras livremente, sem risco de perda de dado.

create extension if not exists pg_trgm;

-- ============================================================
-- 0. Papéis e perfis de usuário (precisam existir antes de tudo
--    que referencia responsavel_user_id/created_by e antes das
--    funções de RLS mais abaixo).
-- ============================================================
create table roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in ('administrador','comercial','tecnico','financeiro','consulta')),
  label text not null
);

create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id) on delete cascade,
  module text not null check (module in (
    'dashboard','crm_leads','crm_oportunidades','clientes','propostas',
    'contratos','agenda','tarefas','configuracoes','usuarios'
  )),
  action text not null check (action in ('visualizar','criar','editar','excluir','exportar','administrar')),
  allowed boolean not null default false,
  unique (role_id, module, action)
);

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role_id uuid references roles(id),
  phone text,
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 1. Funções auxiliares de RLS (security definer — evitam
--    recursão de RLS ao ler user_profiles/role_permissions
--    de dentro da policy de outra tabela).
-- ============================================================
create function is_active_staff() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from user_profiles where id = auth.uid() and active);
$$;

create function has_permission(p_module text, p_action text) returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((
    select rp.allowed
    from user_profiles up
    join role_permissions rp on rp.role_id = up.role_id
    where up.id = auth.uid() and rp.module = p_module and rp.action = p_action
  ), false);
$$;

revoke execute on function is_active_staff() from public;
revoke execute on function has_permission(text, text) from public;
grant execute on function is_active_staff() to authenticated;
grant execute on function has_permission(text, text) to authenticated;

-- ============================================================
-- 2. Alterações nas tabelas existentes (0001_init.sql)
-- ============================================================

-- ---- clients ----
alter table clients rename column user_id to created_by;
alter table clients
  add column tipo_pessoa text not null default 'PJ' check (tipo_pessoa in ('PF','PJ')),
  add column razao_social text,
  add column nome_fantasia text,
  add column cpf_cnpj text,
  add column inscricao_estadual text,
  add column inscricao_municipal text,
  add column cidade text,
  add column estado text,
  add column cep text,
  add column whatsapp text,
  add column site text,
  add column segmento text,
  add column responsavel_user_id uuid references user_profiles(id),
  add column status_relacionamento text not null default 'ativo' check (status_relacionamento in ('prospect','ativo','inativo')),
  add column deleted_at timestamptz,
  add column is_demo boolean not null default false;
create index clients_nome_trgm on clients using gin (nome gin_trgm_ops);

-- ---- proposals ----
alter table proposals rename column user_id to created_by;
alter table proposals
  add column contact_id uuid,
  add column opportunity_id uuid,
  add column lead_id uuid,
  add column servico_tipo text,
  add column titulo text,
  add column descricao text,
  add column escopo text,
  add column condicoes_pagamento text,
  add column prazo_execucao text,
  add column data_validade date,
  add column responsavel_user_id uuid references user_profiles(id),
  add column tipo_precificacao text not null default 'modelo_fixo' check (tipo_precificacao in ('modelo_fixo','itemizado')),
  add column valor_total numeric(12,2),
  add column viewed_at timestamptz,
  add column version_atual integer not null default 1,
  add column motivo_recusa text,
  add column cancelled_at timestamptz,
  add column archived_at timestamptz,
  add column deleted_at timestamptz,
  add column is_demo boolean not null default false;

alter table proposals drop constraint proposals_status_check;
alter table proposals alter column status set default 'rascunho';
alter table proposals add constraint proposals_status_check check (status in (
  'rascunho','aguardando_revisao','pronta_para_envio','enviada','visualizada',
  'em_negociacao','aprovada','recusada','expirada','cancelada','arquivada'
));
-- "convertida" deixa de ser status: convertida = existe uma linha em contracts.proposal_id
-- apontando para esta proposta, e o status dela some fica em 'aprovada'.
update proposals set status = 'aprovada' where status = 'convertida';

-- ---- contracts ----
alter table contracts rename column user_id to created_by;
alter table contracts
  add column numero serial,
  add column opportunity_id uuid,
  add column responsavel_user_id uuid references user_profiles(id),
  add column renewal_of_contract_id uuid references contracts(id),
  add column renewed_by_contract_id uuid references contracts(id),
  add column encerramento_motivo text,
  add column deleted_at timestamptz,
  add column is_demo boolean not null default false;

alter table contracts drop constraint contracts_status_check;
alter table contracts alter column status set default 'rascunho';
alter table contracts add constraint contracts_status_check check (status in (
  'rascunho','aguardando_dados','aguardando_revisao','aguardando_assinatura',
  'assinado','ativo','proximo_vencimento','encerrado','cancelado','renovado'
));
update contracts set status = 'aguardando_revisao' where status = 'emitido';

-- ---- calendar_events ----
alter table calendar_events rename column user_id to created_by;
alter table calendar_events
  add column responsavel_user_id uuid references user_profiles(id),
  add column lead_id uuid,
  add column opportunity_id uuid,
  add column link_reuniao text,
  add column lembrete_minutos integer,
  add column status text not null default 'agendado' check (status in (
    'agendado','confirmado','realizado','reagendado','cancelado','nao_compareceu'
  )),
  add column google_event_id text unique,
  add column google_calendar_id text,
  add column synced_at timestamptz,
  add column participantes jsonb,
  add column is_demo boolean not null default false;

alter table calendar_events drop constraint calendar_events_tipo_check;
alter table calendar_events alter column tipo set default 'reuniao_comercial';
alter table calendar_events add constraint calendar_events_tipo_check check (tipo in (
  'reuniao_comercial','reuniao_tecnica','apresentacao_proposta','follow_up','vistoria',
  'visita_cliente','reuniao_interna','vencimento_proposta','vencimento_contrato',
  'compromisso_administrativo','outro'
));
update calendar_events set tipo = 'reuniao_comercial' where tipo = 'reuniao';

-- ============================================================
-- 3. CRM — leads, pipeline, oportunidades
-- ============================================================
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) default auth.uid(),
  nome text not null,
  empresa text,
  telefone text,
  whatsapp text,
  email text,
  cargo text,
  cidade text,
  estado text,
  origem text,
  servico_interesse text,
  responsavel_user_id uuid references user_profiles(id),
  observacoes text,
  etiquetas text[] not null default '{}',
  proxima_acao text,
  data_proximo_contato date,
  status text not null default 'novo' check (status in ('novo','em_contato','qualificado','convertido','descartado')),
  converted_client_id uuid references clients(id),
  converted_at timestamptz,
  deleted_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_etiquetas_gin on leads using gin (etiquetas);
create index leads_nome_trgm on leads using gin (nome gin_trgm_ops);

create table pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  order_index integer not null,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  color text,
  active boolean not null default true
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) default auth.uid(),
  lead_id uuid references leads(id),
  client_id uuid references clients(id),
  contact_id uuid,
  servico_tipo text,
  titulo text not null,
  descricao text,
  valor_estimado numeric(12,2),
  probabilidade_percentual numeric(5,2),
  previsao_fechamento date,
  responsavel_user_id uuid references user_profiles(id),
  origem text,
  stage_id uuid not null references pipeline_stages(id),
  stage_changed_at timestamptz not null default now(),
  status text not null default 'aberta' check (status in ('aberta','ganha','perdida')),
  motivo_perda text,
  proxima_acao text,
  proxima_acao_data date,
  ganha_em timestamptz,
  perdida_em timestamptz,
  deleted_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table opportunity_stage_history (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  from_stage_id uuid references pipeline_stages(id),
  to_stage_id uuid references pipeline_stages(id),
  changed_by uuid,
  changed_at timestamptz not null default now()
);

-- agora que opportunities e client_contacts existem, completar os FKs adiados
alter table proposals add constraint proposals_opportunity_id_fkey foreign key (opportunity_id) references opportunities(id);
alter table proposals add constraint proposals_lead_id_fkey foreign key (lead_id) references leads(id);
alter table contracts add constraint contracts_opportunity_id_fkey foreign key (opportunity_id) references opportunities(id);
alter table calendar_events add constraint calendar_events_lead_id_fkey foreign key (lead_id) references leads(id);
alter table calendar_events add constraint calendar_events_opportunity_id_fkey foreign key (opportunity_id) references opportunities(id);

-- ============================================================
-- 4. Clientes — múltiplos contatos
-- ============================================================
create table client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  nome text not null,
  cargo text,
  telefone text,
  whatsapp text,
  email text,
  departamento text,
  principal boolean not null default false,
  observacoes text,
  deleted_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table proposals add constraint proposals_contact_id_fkey foreign key (contact_id) references client_contacts(id);
alter table opportunities add constraint opportunities_contact_id_fkey foreign key (contact_id) references client_contacts(id);

-- ============================================================
-- 5. Propostas — itens, versões
-- ============================================================
create table proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  descricao text not null,
  quantidade numeric(10,2) not null default 1,
  valor_unitario numeric(12,2) not null default 0,
  valor_total numeric(12,2) generated always as (quantidade * valor_unitario) stored,
  ordem integer not null default 0
);

create table proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  numero_versao integer not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  motivo text,
  snapshot jsonb,
  changed_fields jsonb,
  pdf_storage_path text
);

-- ============================================================
-- 6. Contratos — stub de assinatura eletrônica
-- ============================================================
create table contract_signature_requests (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  provider text not null default 'none' check (provider in ('clicksign','d4sign','docusign','none')),
  status text not null default 'nao_configurado' check (status in (
    'nao_configurado','pendente','enviado','assinado_parcial','assinado','cancelado','erro'
  )),
  external_id text,
  requested_at timestamptz,
  completed_at timestamptz,
  signers jsonb,
  document_storage_path text,
  error_message text
);

-- ============================================================
-- 7. Anexos, timeline/auditoria unificada, notificações
-- ============================================================
create table attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'lead','opportunity','client','proposal','contract','task','calendar_event'
  )),
  entity_id uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index attachments_entity_idx on attachments (entity_type, entity_id);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'lead','opportunity','client','proposal','contract','task','calendar_event'
  )),
  entity_id uuid not null,
  activity_type text not null check (activity_type in (
    'note','call','message','meeting_logged','stage_change','status_change','file',
    'proposal_created','proposal_sent','contract_created','task_created','email',
    'conversion','system'
  )),
  title text,
  body text,
  metadata jsonb,
  old_value jsonb,
  new_value jsonb,
  user_id uuid,
  created_at timestamptz not null default now(),
  is_demo boolean not null default false
);
create index activity_log_entity_idx on activity_log (entity_type, entity_id, created_at desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  type text not null check (type in (
    'tarefa_atrasada','tarefa_proxima','reuniao_proxima','proposta_sem_resposta',
    'proposta_vencendo','proposta_vencida','proposta_estagnada',
    'contrato_aguardando_assinatura','contrato_vencendo','oportunidade_parada',
    'google_sync_error'
  )),
  entity_type text,
  entity_id uuid,
  title text not null,
  body text,
  severity text not null default 'info' check (severity in ('info','atencao','urgente')),
  route text,
  is_read boolean not null default false,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  is_demo boolean not null default false
);

-- ============================================================
-- 8. Tarefas
-- ============================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  responsavel_user_id uuid references user_profiles(id),
  participantes uuid[] not null default '{}',
  prioridade text not null default 'media' check (prioridade in ('baixa','media','alta','urgente')),
  prazo timestamptz,
  status text not null default 'pendente' check (status in (
    'pendente','em_andamento','aguardando_terceiros','concluida','cancelada'
  )),
  concluida_em timestamptz,
  lembrete_minutos integer,
  recorrencia jsonb,
  origem_automacao text,
  lead_id uuid references leads(id),
  opportunity_id uuid references opportunities(id),
  client_id uuid references clients(id),
  proposal_id uuid references proposals(id),
  contract_id uuid references contracts(id),
  calendar_event_id uuid references calendar_events(id),
  created_by uuid not null references auth.users(id) default auth.uid(),
  deleted_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  descricao text not null,
  concluido boolean not null default false,
  ordem integer not null default 0
);

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid,
  body text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9. Google Calendar, automações, idempotência de alertas
-- ============================================================
create table google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  connected_calendars jsonb,
  primary_calendar_id text,
  last_synced_at timestamptz,
  last_sync_error text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table automation_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  dias_prazo integer not null,
  ativo boolean not null default true
);

create table contract_expiry_alerts_sent (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  threshold_days integer not null,
  sent_at timestamptz not null default now(),
  unique (contract_id, threshold_days)
);

-- ============================================================
-- 10. Triggers
-- ============================================================

-- 10.1 Estender os triggers de status já existentes (0001) para
--      também gravarem na timeline unificada activity_log.
create or replace function log_proposal_status_change() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into proposal_status_history (proposal_id, status) values (new.id, new.status);
    insert into activity_log (entity_type, entity_id, activity_type, title, old_value, new_value, user_id)
      values ('proposal', new.id, 'status_change', 'Status da proposta alterado',
        case when tg_op = 'UPDATE' then to_jsonb(old.status) else null end, to_jsonb(new.status), auth.uid());
    new.status_changed_at = now();
    if new.status = 'enviada' and new.sent_at is null then
      new.sent_at = now();
      insert into tasks (titulo, prazo, proposal_id, responsavel_user_id, created_by, origem_automacao)
        values ('Fazer follow-up: proposta enviada',
          now() + make_interval(days => coalesce((select dias_prazo from automation_rules where key = 'proposta_followup_dias'), 3)),
          new.id, new.responsavel_user_id, auth.uid(), 'proposta_enviada_followup');
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function log_contract_status_change() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into contract_status_history (contract_id, status) values (new.id, new.status);
    insert into activity_log (entity_type, entity_id, activity_type, title, old_value, new_value, user_id)
      values ('contract', new.id, 'status_change', 'Status do contrato alterado',
        case when tg_op = 'UPDATE' then to_jsonb(old.status) else null end, to_jsonb(new.status), auth.uid());
    new.status_changed_at = now();
    if new.status = 'aguardando_assinatura' then
      insert into tasks (titulo, prazo, contract_id, responsavel_user_id, created_by, origem_automacao)
        values ('Cobrar assinatura do contrato',
          now() + make_interval(days => coalesce((select dias_prazo from automation_rules where key = 'contrato_assinatura_followup_dias'), 5)),
          new.id, new.responsavel_user_id, auth.uid(), 'contrato_aguardando_assinatura');
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 10.1b "Convertida" é um evento, não um status: dispara quando um contrato
--       passa a referenciar a proposta, não quando o status vira 'aprovada'.
create function mark_proposal_converted() returns trigger as $$
begin
  if new.proposal_id is not null then
    update proposals set converted_at = now()
      where id = new.proposal_id and converted_at is null;
    insert into activity_log (entity_type, entity_id, activity_type, title, user_id)
      values ('proposal', new.proposal_id, 'conversion', 'Proposta convertida em contrato', auth.uid());
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_mark_proposal_converted
  after insert on contracts
  for each row execute function mark_proposal_converted();

-- 10.2 Oportunidades — histórico de etapa + exigência de motivo de perda
create function enforce_opportunity_loss_reason() returns trigger as $$
declare
  v_is_lost boolean;
begin
  select is_lost into v_is_lost from pipeline_stages where id = new.stage_id;
  if v_is_lost and (new.motivo_perda is null or length(trim(new.motivo_perda)) = 0) then
    raise exception 'Motivo de perda é obrigatório para marcar a oportunidade como perdida.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_opportunity_loss_reason
  before insert or update on opportunities
  for each row execute function enforce_opportunity_loss_reason();

create function log_opportunity_stage_change() returns trigger as $$
declare
  v_is_won boolean;
  v_is_lost boolean;
begin
  if (tg_op = 'INSERT') or (new.stage_id is distinct from old.stage_id) then
    insert into opportunity_stage_history (opportunity_id, from_stage_id, to_stage_id, changed_by)
      values (new.id, case when tg_op = 'UPDATE' then old.stage_id else null end, new.stage_id, auth.uid());
    insert into activity_log (entity_type, entity_id, activity_type, title, old_value, new_value, user_id)
      values ('opportunity', new.id, 'stage_change', 'Etapa da oportunidade alterada',
        case when tg_op = 'UPDATE' then to_jsonb(old.stage_id) else null end, to_jsonb(new.stage_id), auth.uid());
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

create trigger trg_opportunity_stage_insert
  before insert on opportunities
  for each row execute function log_opportunity_stage_change();
create trigger trg_opportunity_stage_update
  before update on opportunities
  for each row execute function log_opportunity_stage_change();

-- 10.3 Propostas — versionamento obrigatório após o primeiro envio.
--      Compara só os campos de CONTEÚDO (ignora status/timestamps de
--      controle, que já têm sua própria auditoria em proposal_status_history)
--      — assim uma simples mudança de status não gera uma "versão" falsa.
create function log_proposal_version() returns trigger as $$
declare
  v_ignore text[] := array[
    'status','status_changed_at','sent_at','viewed_at','converted_at',
    'cancelled_at','archived_at','updated_at','version_atual','texto_overrides'
  ];
  v_old jsonb := to_jsonb(old) - v_ignore;
  v_new jsonb := to_jsonb(new) - v_ignore;
begin
  if old.sent_at is not null and tg_op = 'UPDATE' and v_old is distinct from v_new then
    new.version_atual = old.version_atual + 1;
    insert into proposal_versions (proposal_id, numero_versao, created_by, motivo, snapshot, changed_fields)
      values (new.id, new.version_atual, auth.uid(), 'Edição após envio', to_jsonb(old), v_new);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_proposal_version
  before update on proposals
  for each row execute function log_proposal_version();

-- 10.4 touch_updated_at (já existe desde 0001) para as tabelas novas que têm updated_at
create trigger trg_leads_touch before update on leads
  for each row execute function touch_updated_at();
create trigger trg_opportunities_touch before update on opportunities
  for each row execute function touch_updated_at();
create trigger trg_client_contacts_touch before update on client_contacts
  for each row execute function touch_updated_at();
create trigger trg_tasks_touch before update on tasks
  for each row execute function touch_updated_at();
create trigger trg_google_calendar_connections_touch before update on google_calendar_connections
  for each row execute function touch_updated_at();

-- ============================================================
-- 11. RLS — reescrita: empresa toda vê os dados, ação é
--     restrita por papel/permissão. Ver plano para justificativa.
-- ============================================================

-- 11.1 Derrubar as policies antigas de "só o dono vê" (0001)
drop policy "own rows" on clients;
drop policy "own rows" on proposals;
drop policy "own rows" on contracts;
drop policy "own rows" on calendar_events;
drop policy "own rows via proposal" on proposal_status_history;
drop policy "own rows via contract" on contract_status_history;
drop policy "own rows" on company_settings;

-- 11.2 company_settings — segue por dono único (é a config global da BDTECH,
--      mas toda a equipe precisa poder ler; só admin edita).
create policy "staff read" on company_settings for select using (is_active_staff());
create policy "admin write" on company_settings for insert with check (has_permission('configuracoes','administrar'));
create policy "admin update" on company_settings for update using (has_permission('configuracoes','administrar'));

-- 11.3 Tabelas "dado da empresa toda" — mesmo padrão em todas
do $$
declare
  t record;
begin
  for t in select unnest(array[
    'clients','leads','opportunities','proposals','contracts','calendar_events',
    'tasks','client_contacts','attachments','activity_log'
  ]) as tbl
  loop
    execute format('alter table %I enable row level security', t.tbl);
  end loop;
end $$;

create policy "staff select" on clients for select using (is_active_staff() and deleted_at is null);
create policy "staff insert" on clients for insert with check (is_active_staff() and has_permission('clientes','criar'));
create policy "staff update" on clients for update using (is_active_staff()) with check (has_permission('clientes','editar'));

create policy "staff select" on leads for select using (is_active_staff() and deleted_at is null);
create policy "staff insert" on leads for insert with check (is_active_staff() and has_permission('crm_leads','criar'));
create policy "staff update" on leads for update using (is_active_staff()) with check (has_permission('crm_leads','editar'));

create policy "staff select" on opportunities for select using (is_active_staff() and deleted_at is null);
create policy "staff insert" on opportunities for insert with check (is_active_staff() and has_permission('crm_oportunidades','criar'));
create policy "staff update" on opportunities for update using (is_active_staff()) with check (has_permission('crm_oportunidades','editar'));

create policy "staff select" on proposals for select using (is_active_staff() and deleted_at is null);
create policy "staff insert" on proposals for insert with check (is_active_staff() and has_permission('propostas','criar'));
create policy "staff update" on proposals for update using (is_active_staff()) with check (has_permission('propostas','editar'));

create policy "staff select" on contracts for select using (is_active_staff() and deleted_at is null);
create policy "staff insert" on contracts for insert with check (is_active_staff() and has_permission('contratos','criar'));
create policy "staff update" on contracts for update using (is_active_staff()) with check (has_permission('contratos','editar'));

create policy "staff select" on calendar_events for select using (is_active_staff());
create policy "staff insert" on calendar_events for insert with check (is_active_staff() and has_permission('agenda','criar'));
create policy "staff update" on calendar_events for update using (is_active_staff()) with check (has_permission('agenda','editar'));

create policy "staff select" on tasks for select using (is_active_staff() and deleted_at is null);
create policy "staff insert" on tasks for insert with check (is_active_staff() and has_permission('tarefas','criar'));
create policy "staff update" on tasks for update using (is_active_staff()) with check (has_permission('tarefas','editar'));

create policy "staff select" on client_contacts for select using (is_active_staff() and deleted_at is null);
create policy "staff insert" on client_contacts for insert with check (is_active_staff() and has_permission('clientes','criar'));
create policy "staff update" on client_contacts for update using (is_active_staff()) with check (has_permission('clientes','editar'));

create policy "staff select" on attachments for select using (is_active_staff());
create policy "staff insert" on attachments for insert with check (is_active_staff());

create policy "staff select" on activity_log for select using (is_active_staff());
create policy "staff insert" on activity_log for insert with check (is_active_staff());

-- 11.4 Tabelas filhas de histórico/config — leitura via join na tabela pai,
--      ou leitura livre para todo o staff quando são catálogo/config.
alter table proposal_status_history enable row level security;
alter table contract_status_history enable row level security;
alter table opportunity_stage_history enable row level security;
alter table proposal_versions enable row level security;
alter table proposal_items enable row level security;
alter table contract_signature_requests enable row level security;
alter table task_checklist_items enable row level security;
alter table task_comments enable row level security;
alter table pipeline_stages enable row level security;
alter table automation_rules enable row level security;
alter table roles enable row level security;
alter table role_permissions enable row level security;
alter table user_profiles enable row level security;
alter table contract_expiry_alerts_sent enable row level security;

create policy "staff select" on proposal_status_history for select using (is_active_staff());
create policy "staff select" on contract_status_history for select using (is_active_staff());
create policy "staff select" on opportunity_stage_history for select using (is_active_staff());
create policy "staff select" on proposal_versions for select using (is_active_staff());
create policy "staff all" on proposal_items for all using (is_active_staff()) with check (is_active_staff());
create policy "staff all" on contract_signature_requests for all using (is_active_staff()) with check (is_active_staff());
create policy "staff all" on task_checklist_items for all using (is_active_staff()) with check (is_active_staff());
create policy "staff all" on task_comments for all using (is_active_staff()) with check (is_active_staff());
create policy "staff select" on contract_expiry_alerts_sent for select using (is_active_staff());

create policy "staff select" on pipeline_stages for select using (is_active_staff());
create policy "admin write" on pipeline_stages for insert with check (has_permission('configuracoes','administrar'));
create policy "admin update" on pipeline_stages for update using (has_permission('configuracoes','administrar'));

create policy "staff select" on automation_rules for select using (is_active_staff());
create policy "admin update" on automation_rules for update using (has_permission('configuracoes','administrar'));

create policy "staff select" on roles for select using (is_active_staff());
create policy "staff select" on role_permissions for select using (is_active_staff());
create policy "admin write role_permissions" on role_permissions for update using (has_permission('usuarios','administrar'));

create policy "staff select" on user_profiles for select using (is_active_staff());
create policy "self update" on user_profiles for update using (id = auth.uid() or has_permission('usuarios','administrar'));
create policy "admin insert" on user_profiles for insert with check (has_permission('usuarios','administrar') or id = auth.uid());

-- 11.5 Exceções "por dono" — nunca viram dado compartilhado da empresa
alter table notifications enable row level security;
alter table google_calendar_connections enable row level security;

create policy "own notifications" on notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own google connection" on google_calendar_connections for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- 12. Busca global
-- ============================================================
create function global_search(q text)
returns table(entity_type text, id uuid, label text, subtitle text, route text)
language sql stable as $$
  select 'lead', l.id, l.nome, coalesce(l.empresa, ''), '/leads/' || l.id
    from leads l
    where l.deleted_at is null and (l.nome ilike '%'||q||'%' or l.empresa ilike '%'||q||'%'
      or l.telefone ilike '%'||q||'%' or l.email ilike '%'||q||'%')
  union all
  select 'opportunity', o.id, o.titulo, coalesce(o.servico_tipo, ''), '/oportunidades/' || o.id
    from opportunities o
    where o.deleted_at is null and o.titulo ilike '%'||q||'%'
  union all
  select 'client', c.id, c.nome, coalesce(c.cpf_cnpj, c.cnpj, ''), '/clientes/' || c.id
    from clients c
    where c.deleted_at is null and (c.nome ilike '%'||q||'%' or c.cpf_cnpj ilike '%'||q||'%'
      or c.cnpj ilike '%'||q||'%' or c.contato_nome ilike '%'||q||'%')
  union all
  select 'client_contact', cc.id, cc.nome, coalesce(cc.telefone, ''), '/clientes/' || cc.client_id
    from client_contacts cc
    where cc.deleted_at is null and (cc.nome ilike '%'||q||'%' or cc.telefone ilike '%'||q||'%' or cc.email ilike '%'||q||'%')
  union all
  select 'proposal', p.id, 'PROP-' || extract(year from p.data_proposta)::text || '-' || lpad(p.numero::text, 4, '0'),
    p.status, '/propostas/' || p.id
    from proposals p
    where p.deleted_at is null and (p.numero::text ilike '%'||q||'%' or p.titulo ilike '%'||q||'%')
  union all
  select 'contract', ct.id, 'CONT-' || extract(year from ct.data_inicio)::text || '-' || lpad(ct.numero::text, 4, '0'),
    ct.status, '/contratos/' || ct.id
    from contracts ct
    where ct.deleted_at is null and ct.escopo_servico ilike '%'||q||'%'
  union all
  select 'calendar_event', ce.id, ce.titulo, ce.tipo, '/calendario/' || ce.id
    from calendar_events ce
    where ce.titulo ilike '%'||q||'%'
  union all
  select 'task', tk.id, tk.titulo, tk.status, '/tarefas/' || tk.id
    from tasks tk
    where tk.deleted_at is null and tk.titulo ilike '%'||q||'%'
  limit 50;
$$;

-- ============================================================
-- 13. Seeds — papéis, permissões, 11 etapas do funil, prazos de automação
-- ============================================================
insert into roles (key, label) values
  ('administrador', 'Administrador'),
  ('comercial', 'Comercial'),
  ('tecnico', 'Técnico'),
  ('financeiro', 'Financeiro'),
  ('consulta', 'Consulta');

-- Administrador: acesso total
insert into role_permissions (role_id, module, action, allowed)
  select r.id, m.module, a.action, true
  from roles r,
    unnest(array['dashboard','crm_leads','crm_oportunidades','clientes','propostas','contratos','agenda','tarefas','configuracoes','usuarios']) as m(module),
    unnest(array['visualizar','criar','editar','excluir','exportar','administrar']) as a(action)
  where r.key = 'administrador';

-- Comercial: visualizar/criar/editar em CRM/Clientes/Propostas/Contratos/Agenda/Tarefas
insert into role_permissions (role_id, module, action, allowed)
  select r.id, m.module, a.action, true
  from roles r,
    unnest(array['dashboard','crm_leads','crm_oportunidades','clientes','propostas','contratos','agenda','tarefas']) as m(module),
    unnest(array['visualizar','criar','editar']) as a(action)
  where r.key = 'comercial';

-- Técnico: visualizar clientes/propostas/contratos; criar/editar agenda/tarefas
insert into role_permissions (role_id, module, action, allowed)
  select r.id, m.module, 'visualizar', true
  from roles r, unnest(array['dashboard','clientes','propostas','contratos','agenda','tarefas']) as m(module)
  where r.key = 'tecnico';
insert into role_permissions (role_id, module, action, allowed)
  select r.id, m.module, a.action, true
  from roles r, unnest(array['agenda','tarefas']) as m(module), unnest(array['criar','editar']) as a(action)
  where r.key = 'tecnico';

-- Financeiro: visualizar tudo; criar/editar contratos
insert into role_permissions (role_id, module, action, allowed)
  select r.id, m.module, 'visualizar', true
  from roles r,
    unnest(array['dashboard','crm_leads','crm_oportunidades','clientes','propostas','contratos','agenda','tarefas']) as m(module)
  where r.key = 'financeiro';
insert into role_permissions (role_id, module, action, allowed)
  select r.id, 'contratos', a.action, true
  from roles r, unnest(array['criar','editar']) as a(action)
  where r.key = 'financeiro';

-- Consulta: só visualizar
insert into role_permissions (role_id, module, action, allowed)
  select r.id, m.module, 'visualizar', true
  from roles r,
    unnest(array['dashboard','crm_leads','crm_oportunidades','clientes','propostas','contratos','agenda','tarefas']) as m(module)
  where r.key = 'consulta';

insert into pipeline_stages (key, label, order_index, is_won, is_lost) values
  ('novo_lead', 'Novo lead', 0, false, false),
  ('contato_iniciado', 'Contato iniciado', 1, false, false),
  ('qualificacao', 'Qualificação', 2, false, false),
  ('reuniao_agendada', 'Reunião agendada', 3, false, false),
  ('levantamento_necessario', 'Levantamento necessário', 4, false, false),
  ('proposta_em_elaboracao', 'Proposta em elaboração', 5, false, false),
  ('proposta_enviada', 'Proposta enviada', 6, false, false),
  ('negociacao', 'Negociação', 7, false, false),
  ('aguardando_decisao', 'Aguardando decisão', 8, false, false),
  ('ganho', 'Ganho', 9, true, false),
  ('perdido', 'Perdido', 10, false, true);

insert into automation_rules (key, label, dias_prazo) values
  ('proposta_followup_dias', 'Follow-up após envio de proposta', 3),
  ('contrato_assinatura_followup_dias', 'Cobrança de assinatura de contrato', 5),
  ('proposta_sem_resposta_dias', 'Proposta sem resposta', 7),
  ('proposta_vencendo_dias_antes', 'Aviso de proposta vencendo', 3),
  ('oportunidade_parada_dias', 'Oportunidade sem movimentação', 10);

-- ============================================================
-- Depois de rodar esta migration:
-- 1) Crie seu usuário em Authentication → Users (se ainda não criou).
-- 2) Rode, substituindo o e-mail:
--    insert into user_profiles (id, display_name, role_id)
--      select id, 'Seu Nome', (select id from roles where key = 'administrador')
--      from auth.users where email = 'voce@bdtech.com.br';
-- 3) Rode (uma vez): insert into company_settings (user_id) select id from auth.users where email = 'voce@bdtech.com.br';
--    (nota: company_settings usa a coluna user_id original de 0001 — não renomeada, pois já é lida por "staff read"/editada só por admin.)
-- ============================================================
