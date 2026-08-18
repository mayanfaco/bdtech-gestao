-- BDTECH Gestão — parcelamento do Modelo 1 na proposta
-- Rode isto DEPOIS das migrations anteriores.
--
-- O Modelo 1 (Serviço Técnico Pontual) passou a poder ser parcelado, igual ao
-- Modelo 2. Guarda o número de parcelas do restante (após a entrada). Quando
-- for 1 (ou nulo), o documento mantém o texto padrão "% na assinatura + % na
-- entrega do laudo"; acima de 1, mostra "entrada + Nx de R$ ...".

alter table proposals
  add column if not exists modelo1_parcelas_restante integer;
