-- BDTECH Gestão — recebimentos (parcelas a receber, pagamentos e cobranças)
-- Rode isto DEPOIS das migrations anteriores (0001 a 0012).
--
-- Cada contrato gera uma parcela por linha: a entrada (numero 0) e as
-- parcelas restantes (1..N). Uma parcela só conta como recebida pela soma dos
-- pagamentos registrados nela — gerar a parcela não é receber. Pagamento
-- parcial fica com saldo em aberto. Pagamento lançado por engano é desfeito
-- (desfeito_em), nunca apagado, para manter o histórico.

create table if not exists receivables (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id),
  client_id uuid references clients(id),
  numero integer not null check (numero >= 0),
  total_parcelas integer not null check (total_parcelas >= 0),
  valor numeric(12,2) not null check (valor > 0),
  vencimento date not null,
  cancelado_em timestamptz,
  cancelado_motivo text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Gerar as parcelas duas vezes não duplica nada.
  unique (contract_id, numero)
);
create index if not exists receivables_vencimento_idx on receivables (vencimento);
create index if not exists receivables_client_idx on receivables (client_id);

create table if not exists receivable_payments (
  id uuid primary key default gen_random_uuid(),
  receivable_id uuid not null references receivables(id),
  valor numeric(12,2) not null check (valor > 0),
  data_pagamento date not null,
  forma text not null default 'pix' check (forma in ('pix','transferencia','boleto','dinheiro','cartao','outro')),
  observacao text,
  desfeito_em timestamptz,
  desfeito_motivo text,
  desfeito_por uuid references auth.users(id),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists receivable_payments_receivable_idx on receivable_payments (receivable_id);

-- "Já cobrei": registra que alguém cobrou o cliente (não que ele recebeu ou leu).
create table if not exists collection_contacts (
  id uuid primary key default gen_random_uuid(),
  receivable_id uuid not null references receivables(id),
  canal text not null default 'whatsapp' check (canal in ('whatsapp','telefone','email','outro')),
  observacao text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists collection_contacts_receivable_idx on collection_contacts (receivable_id);

alter table company_settings
  add column if not exists chave_pix text default 'bdtechelevadores@gmail.com',
  add column if not exists mensagem_cobranca text;

-- ============================================================
-- Permissões: toda a equipe ativa pode ver, gerar parcelas, cobrar e
-- confirmar pagamento (decisão da BDTECH em 12/11/2026).
-- ============================================================
alter table receivables enable row level security;
alter table receivable_payments enable row level security;
alter table collection_contacts enable row level security;

drop policy if exists "staff select" on receivables;
create policy "staff select" on receivables for select using (is_active_staff());
drop policy if exists "staff insert" on receivables;
create policy "staff insert" on receivables for insert with check (is_active_staff());
drop policy if exists "staff update" on receivables;
create policy "staff update" on receivables for update using (is_active_staff()) with check (is_active_staff());

drop policy if exists "staff select" on receivable_payments;
create policy "staff select" on receivable_payments for select using (is_active_staff());
drop policy if exists "staff insert" on receivable_payments;
create policy "staff insert" on receivable_payments for insert with check (is_active_staff());
drop policy if exists "staff update" on receivable_payments;
create policy "staff update" on receivable_payments for update using (is_active_staff()) with check (is_active_staff());

drop policy if exists "staff select" on collection_contacts;
create policy "staff select" on collection_contacts for select using (is_active_staff());
drop policy if exists "staff insert" on collection_contacts;
create policy "staff insert" on collection_contacts for insert with check (is_active_staff());

drop trigger if exists trg_receivables_touch on receivables;
create trigger trg_receivables_touch before update on receivables
  for each row execute function touch_updated_at();

-- ============================================================
-- Regras que o banco garante mesmo se a tela falhar
-- ============================================================
create or replace function fmt_brl(v numeric) returns text as $$
  select 'R$ ' || translate(to_char(v, 'FM999,999,990.00'), ',.', '.,');
$$ language sql immutable;

-- Nome curto da parcela para a linha do tempo: "Entrada · CONT-2026-0004".
create or replace function receivable_label(r receivables) returns text as $$
  select case when r.numero = 0 then 'Entrada' else 'Parcela ' || r.numero || '/' || r.total_parcelas end
    || ' · CONT-' || coalesce(to_char(c.data_inicio, 'YYYY'), '') || '-' || lpad(c.numero::text, 4, '0')
  from contracts c where c.id = r.contract_id;
$$ language sql stable;

-- Não aceita pagamento acima do saldo nem em parcela cancelada.
create or replace function check_receivable_payment() returns trigger as $$
declare
  r receivables;
  pago numeric;
begin
  if new.desfeito_em is not null then return new; end if;
  select * into r from receivables where id = new.receivable_id for update;
  if r.cancelado_em is not null then
    raise exception 'Esta parcela foi cancelada e não pode receber pagamento.';
  end if;
  select coalesce(sum(valor), 0) into pago from receivable_payments
    where receivable_id = new.receivable_id and desfeito_em is null and id <> new.id;
  if pago + new.valor > r.valor then
    raise exception 'O pagamento (%) passa do saldo desta parcela (%).', fmt_brl(new.valor), fmt_brl(r.valor - pago);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_receivable_payment_check on receivable_payments;
create trigger trg_receivable_payment_check before insert or update on receivable_payments
  for each row execute function check_receivable_payment();

-- Parcela com pagamento não pode ter o valor reduzido abaixo do já recebido
-- nem ser cancelada (desfaça o pagamento antes).
create or replace function check_receivable_change() returns trigger as $$
declare
  pago numeric;
begin
  select coalesce(sum(valor), 0) into pago from receivable_payments
    where receivable_id = new.id and desfeito_em is null;
  if new.cancelado_em is not null and old.cancelado_em is null and pago > 0 then
    raise exception 'Esta parcela já tem pagamento registrado. Desfaça o pagamento antes de cancelar.';
  end if;
  if new.valor < pago then
    raise exception 'O valor não pode ficar abaixo do que já foi recebido (%).', fmt_brl(pago);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_receivable_change_check on receivables;
create trigger trg_receivable_change_check before update on receivables
  for each row execute function check_receivable_change();

-- ============================================================
-- Linha do tempo: pagamentos, cobranças e mudanças de parcela ficam no
-- histórico do cliente (ou do contrato, se ele não tiver cliente).
-- ============================================================
alter table activity_log drop constraint if exists activity_log_activity_type_check;
alter table activity_log add constraint activity_log_activity_type_check check (activity_type in (
  'note','call','message','meeting_logged','stage_change','status_change','file',
  'proposal_created','proposal_sent','contract_created','task_created','email',
  'conversion','system','receipt_created',
  'payment_received','payment_undone','collection_contact','receivable_changed'
));

create or replace function log_receivable_event(r receivables, tipo text, corpo text) returns void as $$
  insert into activity_log (entity_type, entity_id, activity_type, title, body, user_id)
  values (case when r.client_id is null then 'contract' else 'client' end,
          coalesce(r.client_id, r.contract_id), tipo, receivable_label(r), corpo, auth.uid());
$$ language sql;

create or replace function log_receivable_payment() returns trigger as $$
declare
  r receivables;
begin
  select * into r from receivables where id = new.receivable_id;
  if tg_op = 'INSERT' and new.desfeito_em is null then
    perform log_receivable_event(r, 'payment_received',
      fmt_brl(new.valor) || ' recebidos em ' || to_char(new.data_pagamento, 'DD/MM/YYYY'));
  elsif tg_op = 'UPDATE' and new.desfeito_em is not null and old.desfeito_em is null then
    perform log_receivable_event(r, 'payment_undone',
      'Pagamento de ' || fmt_brl(new.valor) || ' desfeito' || coalesce(': ' || nullif(new.desfeito_motivo, ''), ''));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_receivable_payment_log on receivable_payments;
create trigger trg_receivable_payment_log after insert or update on receivable_payments
  for each row execute function log_receivable_payment();

create or replace function log_collection_contact() returns trigger as $$
declare
  r receivables;
begin
  select * into r from receivables where id = new.receivable_id;
  perform log_receivable_event(r, 'collection_contact',
    'Cliente cobrado por ' || new.canal || coalesce(': ' || nullif(new.observacao, ''), ''));
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_collection_contact_log on collection_contacts;
create trigger trg_collection_contact_log after insert on collection_contacts
  for each row execute function log_collection_contact();

create or replace function log_receivable_change() returns trigger as $$
begin
  if new.cancelado_em is not null and old.cancelado_em is null then
    perform log_receivable_event(new, 'receivable_changed',
      'Parcela cancelada' || coalesce(': ' || nullif(new.cancelado_motivo, ''), ''));
  end if;
  if new.vencimento is distinct from old.vencimento then
    perform log_receivable_event(new, 'receivable_changed',
      'Vencimento alterado de ' || to_char(old.vencimento, 'DD/MM/YYYY') || ' para ' || to_char(new.vencimento, 'DD/MM/YYYY'));
  end if;
  if new.valor is distinct from old.valor then
    perform log_receivable_event(new, 'receivable_changed',
      'Valor alterado de ' || fmt_brl(old.valor) || ' para ' || fmt_brl(new.valor));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_receivable_change_log on receivables;
create trigger trg_receivable_change_log after update on receivables
  for each row execute function log_receivable_change();
