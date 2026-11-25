-- BDTECH Gestão — recibos sempre salvos e ligados a tudo
-- Rode DEPOIS das migrations anteriores (0001 a 0016). SEGURO: só adiciona
-- colunas, funções e gatilhos; nada é apagado. Pode rodar mais de uma vez.
--
-- 1. Todo recibo fica ligado ao cliente, ao contrato e à proposta.
-- 2. Todo pagamento registrado em Recebimentos gera o recibo sozinho, no
--    banco — não depende de ninguém lembrar de clicar em "Gerar recibo".
-- 3. Pagamentos já registrados que ainda não tinham recibo ganham o seu.

-- ============================================================
-- 1. Ligações
-- ============================================================
alter table receipts
  add column if not exists contract_id uuid references contracts(id),
  add column if not exists proposal_id uuid references proposals(id);

create index if not exists receipts_contract_idx on receipts (contract_id) where deleted_at is null;
create index if not exists receipts_proposal_idx on receipts (proposal_id) where deleted_at is null;

-- Preenche as ligações que faltarem: pagamento → parcela → contrato →
-- proposta/cliente. Vale para recibos novos e editados.
create or replace function receipts_completa_vinculos() returns trigger as $$
begin
  if new.contract_id is null and new.payment_id is not null then
    select r.contract_id into new.contract_id
      from receivable_payments p join receivables r on r.id = p.receivable_id
      where p.id = new.payment_id;
  end if;
  if new.contract_id is not null then
    if new.proposal_id is null then
      select c.proposal_id into new.proposal_id from contracts c where c.id = new.contract_id;
    end if;
    if new.client_id is null then
      select c.client_id into new.client_id from contracts c where c.id = new.contract_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_receipts_vinculos on receipts;
create trigger trg_receipts_vinculos before insert or update on receipts
  for each row execute function receipts_completa_vinculos();

-- Recibos que já existam (se houver) ganham as ligações.
update receipts set contract_id = contract_id where contract_id is null and payment_id is not null;

-- ============================================================
-- 2. Recibo automático para cada pagamento
--    Mesma regra da tela (src/lib/recebimentos.js → dadosReciboDoPagamento):
--    referente "entrada" ou "parcela N/T" (+ "pagamento parcial"); o saldo
--    conta só os pagamentos feitos até este; "N parcelas" só quando todas as
--    que faltam têm o mesmo valor.
-- ============================================================
create or replace function gerar_recibo_do_pagamento(p_payment uuid) returns uuid as $$
declare
  v_pag receivable_payments%rowtype;
  v_parc receivables%rowtype;
  v_ctr contracts%rowtype;
  v_cli clients%rowtype;
  v_saldos numeric[];
  v_saldo numeric;
  v_iguais boolean;
  v_nome text;
  v_id uuid;
begin
  select * into v_pag from receivable_payments where id = p_payment;
  if not found or v_pag.desfeito_em is not null then return null; end if;

  select id into v_id from receipts where payment_id = p_payment and deleted_at is null limit 1;
  if v_id is not null then return v_id; end if;

  select * into v_parc from receivables where id = v_pag.receivable_id;
  select * into v_ctr from contracts where id = v_parc.contract_id;
  select * into v_cli from clients where id = coalesce(v_parc.client_id, v_ctr.client_id);

  -- saldo em aberto de cada parcela, contando só pagamentos até este
  select array_agg(s) into v_saldos from (
    select greatest(0, r.valor - coalesce((
      select sum(x.valor) from receivable_payments x
      where x.receivable_id = r.id and x.desfeito_em is null
        and (x.data_pagamento < v_pag.data_pagamento
             or (x.data_pagamento = v_pag.data_pagamento and x.created_at <= v_pag.created_at))
    ), 0)) as s
    from receivables r
    where r.contract_id = v_parc.contract_id and r.cancelado_em is null
  ) t where s > 0;

  v_saldo := coalesce((select sum(s) from unnest(v_saldos) s), 0);
  v_iguais := coalesce(array_length(v_saldos, 1), 0) > 0
    and (select count(distinct s) from unnest(v_saldos) s) = 1;
  v_nome := case when v_parc.numero = 0 then 'entrada' else 'parcela ' || v_parc.numero || '/' || v_parc.total_parcelas end;

  insert into receipts (
    client_id, contract_id, proposal_id, payment_id, pagador_nome, pagador_documento,
    data_recibo, data_inicio_servicos, valor_total, valor_recebido,
    referente, saldo_restante, parcelas_restantes, created_by
  ) values (
    coalesce(v_cli.id, v_ctr.client_id), v_ctr.id, v_ctr.proposal_id, v_pag.id,
    coalesce(nullif(v_cli.nome, ''), v_ctr.contratante_nome, 'Cliente'),
    coalesce(nullif(v_cli.cpf_cnpj, ''), nullif(v_cli.cnpj, ''), v_ctr.contratante_cnpj),
    v_pag.data_pagamento, coalesce(v_ctr.data_inicio, v_pag.data_pagamento),
    coalesce(v_ctr.valor_total, 0), v_pag.valor,
    case when v_pag.valor < v_parc.valor then v_nome || ' (pagamento parcial)' else v_nome end,
    v_saldo,
    case when v_iguais then array_length(v_saldos, 1) else null end,
    v_pag.created_by
  ) returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function gerar_recibo_do_pagamento(uuid) from public;
grant execute on function gerar_recibo_do_pagamento(uuid) to authenticated;

create or replace function receivable_payments_gera_recibo() returns trigger as $$
begin
  perform gerar_recibo_do_pagamento(new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_payments_recibo on receivable_payments;
create trigger trg_payments_recibo after insert on receivable_payments
  for each row execute function receivable_payments_gera_recibo();

-- ============================================================
-- 3. Pagamentos antigos sem recibo ganham o seu (em ordem, para a numeração
--    seguir a data dos pagamentos)
-- ============================================================
do $$
declare r record;
begin
  for r in
    select p.id from receivable_payments p
    where p.desfeito_em is null
      and not exists (select 1 from receipts x where x.payment_id = p.id and x.deleted_at is null)
    order by p.data_pagamento, p.created_at
  loop
    perform gerar_recibo_do_pagamento(r.id);
  end loop;
end $$;
