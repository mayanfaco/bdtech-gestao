-- BDTECH Gestão — correção da política de leitura para exclusão lógica
-- Rode isto DEPOIS de 0001_init.sql, 0002_expansion.sql, 0003_automations.sql e 0004_fixes.sql.
--
-- Bug: as políticas de SELECT em clients/leads/opportunities/proposals/
-- contracts/tasks/client_contacts exigiam "deleted_at is null". O Postgres
-- também aplica a política de SELECT sobre a linha retornada por um UPDATE
-- (RETURNING) — então, ao marcar deleted_at = now() (exclusão lógica), a
-- própria linha que acabou de ser atualizada deixa de satisfazer
-- "deleted_at is null" e o Postgres recusa a operação como se fosse uma
-- violação de RLS ("new row violates row-level security policy"), mesmo
-- com a permissão de edição correta.
--
-- Correção: a política de SELECT passa a exigir só is_active_staff() — o
-- filtro de "não excluído" continua sendo aplicado nas telas (todas as
-- listagens do app já usam .is('deleted_at', null) nas consultas), então
-- nada muda visualmente, só deixa de conflitar com a exclusão lógica.

drop policy if exists "staff select" on clients;
create policy "staff select" on clients for select using (is_active_staff());

drop policy if exists "staff select" on leads;
create policy "staff select" on leads for select using (is_active_staff());

drop policy if exists "staff select" on opportunities;
create policy "staff select" on opportunities for select using (is_active_staff());

drop policy if exists "staff select" on proposals;
create policy "staff select" on proposals for select using (is_active_staff());

drop policy if exists "staff select" on contracts;
create policy "staff select" on contracts for select using (is_active_staff());

drop policy if exists "staff select" on tasks;
create policy "staff select" on tasks for select using (is_active_staff());

drop policy if exists "staff select" on client_contacts;
create policy "staff select" on client_contacts for select using (is_active_staff());
