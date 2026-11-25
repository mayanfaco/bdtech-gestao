-- BDTECH Gestão — recibo gerado a partir de um pagamento
-- Rode isto DEPOIS das migrations anteriores (0001 a 0013).
--
-- O recibo passa a poder nascer de um pagamento confirmado em Recebimentos:
-- guarda de qual pagamento veio, a que se refere ("entrada", "parcela 3/11")
-- e o saldo do contrato naquele momento. Recibos antigos (sem pagamento)
-- continuam valendo como estão.

alter table receipts
  add column if not exists payment_id uuid references receivable_payments(id),
  add column if not exists referente text,
  add column if not exists saldo_restante numeric(12,2);

-- Um pagamento gera no máximo um recibo (excluído não conta).
create unique index if not exists receipts_payment_unico
  on receipts (payment_id) where payment_id is not null and deleted_at is null;
