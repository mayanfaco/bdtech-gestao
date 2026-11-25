-- BDTECH Gestão — parcelas restantes no contrato
-- Rode isto DEPOIS das migrations anteriores.
--
-- A 2ª parcela avulsa do contrato foi substituída por um número de parcelas
-- restantes: após o sinal (1ª parcela), o valor que falta do contrato é
-- dividido pela quantidade informada aqui, gerando o valor de cada parcela
-- mensal (mesmo padrão já usado em modelo1_parcelas_restante nas propostas).

alter table contracts
  add column if not exists parcelas_mensais_quantidade integer;
