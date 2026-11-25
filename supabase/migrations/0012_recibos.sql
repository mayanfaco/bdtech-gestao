-- BDTECH Gestão — recibos de prestação de serviços
-- Rode isto DEPOIS das migrations anteriores (0001 a 0011).
--
-- Cada recibo pertence a um cliente e aparece no histórico dele. Nome e
-- documento do pagador são copiados na emissão, para um recibo já entregue não
-- mudar se o cadastro do cliente for alterado depois. Percentual, saldo, valor
-- da parcela e valor por extenso são calculados na tela, não gravados.

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  numero integer generated always as identity,
  client_id uuid not null references clients(id),
  pagador_nome text not null,
  pagador_documento text,
  data_recibo date not null default current_date,
  data_inicio_servicos date not null default current_date,
  valor_total numeric(12,2) not null,
  valor_recebido numeric(12,2) not null,
  parcelas_restantes integer,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists receipts_client_id_idx on receipts (client_id, data_recibo desc);

alter table receipts enable row level security;

-- Recibo segue as permissões de Contratos: quem cria/edita contrato emite
-- recibo. A exclusão é lógica (deleted_at), filtrada nas telas; por isso a
-- leitura não exige "deleted_at is null" (ver 0005_soft_delete_rls_fix.sql).
drop policy if exists "staff select" on receipts;
create policy "staff select" on receipts for select using (is_active_staff());

drop policy if exists "staff insert" on receipts;
create policy "staff insert" on receipts for insert
  with check (is_active_staff() and has_permission('contratos','criar'));

drop policy if exists "staff update" on receipts;
create policy "staff update" on receipts for update
  using (is_active_staff()) with check (has_permission('contratos','editar'));

drop trigger if exists trg_receipts_touch on receipts;
create trigger trg_receipts_touch before update on receipts
  for each row execute function touch_updated_at();

-- A emissão entra na linha do tempo do cliente.
alter table activity_log drop constraint if exists activity_log_activity_type_check;
alter table activity_log add constraint activity_log_activity_type_check check (activity_type in (
  'note','call','message','meeting_logged','stage_change','status_change','file',
  'proposal_created','proposal_sent','contract_created','task_created','email',
  'conversion','system','receipt_created'
));

create or replace function log_receipt_created() returns trigger as $$
begin
  insert into activity_log (entity_type, entity_id, activity_type, title, body, user_id)
    values ('client', new.client_id, 'receipt_created',
      'REC-' || to_char(new.data_recibo, 'YYYY') || '-' || lpad(new.numero::text, 4, '0'),
      'R$ ' || translate(to_char(new.valor_recebido, 'FM999,999,990.00'), ',.', '.,')
        || ' recebidos em ' || to_char(new.data_recibo, 'DD/MM/YYYY'),
      auth.uid());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_receipts_log on receipts;
create trigger trg_receipts_log after insert on receipts
  for each row execute function log_receipt_created();
