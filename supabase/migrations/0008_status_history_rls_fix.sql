-- BDTECH Gestão — reconcilia RLS das tabelas de histórico de status/etapa
-- Rode isto DEPOIS de 0001 a 0007.
--
-- Achado em auditoria: proposal_status_history, contract_status_history e
-- opportunity_stage_history têm RLS habilitado só com política de SELECT
-- (0002_expansion.sql). As funções de gatilho que gravam nelas
-- (log_proposal_status_change_after, log_contract_status_change_after,
-- log_opportunity_stage_change_after, definidas em 0004_fixes.sql) não são
-- SECURITY DEFINER — então, pela regra normal de RLS do Postgres, todo
-- INSERT feito por elas deveria ser bloqueado por falta de política de
-- insert, com o mesmo erro que já apareceu (e foi corrigido) para
-- proposal_versions em 0007_fix_proposal_delete.sql.
--
-- Como mudanças de status funcionam normalmente em produção, é provável que
-- o banco real já tenha uma política de insert aplicada manualmente (fora
-- de migration) — este arquivo só garante que ela exista e fique
-- registrada nas migrations versionadas, para que o ambiente possa ser
-- recriado do zero sem quebrar.

drop policy if exists "staff insert" on proposal_status_history;
create policy "staff insert" on proposal_status_history for insert with check (is_active_staff());

drop policy if exists "staff insert" on contract_status_history;
create policy "staff insert" on contract_status_history for insert with check (is_active_staff());

drop policy if exists "staff insert" on opportunity_stage_history;
create policy "staff insert" on opportunity_stage_history for insert with check (is_active_staff());
