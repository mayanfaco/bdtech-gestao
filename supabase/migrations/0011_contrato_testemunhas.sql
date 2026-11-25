-- BDTECH Gestão — testemunhas do contrato
-- Rode isto DEPOIS das migrations anteriores.
--
-- Nome e CPF das duas testemunhas passam a ser preenchidos no formulário do
-- contrato (em vez de linhas em branco para escrever à mão na impressão).
-- A assinatura em si continua sendo física (linha em branco no documento).

alter table contracts
  add column if not exists testemunha1_nome text,
  add column if not exists testemunha1_cpf text,
  add column if not exists testemunha2_nome text,
  add column if not exists testemunha2_cpf text;
