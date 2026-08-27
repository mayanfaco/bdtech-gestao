-- BDTECH Gestão — propostas avulsas (texto livre)
-- Rode isto DEPOIS das migrations anteriores (0001 a 0008).
--
-- Para serviços fora dos dois modelos padrão (laudos pontuais, avaliações,
-- pareceres): o usuário cola o texto pronto e o sistema o renderiza com a
-- identidade visual da BDTECH, sem precisar de cliente/precificação
-- estruturados. Guarda só o texto e um título derivado dele para a listagem.

create table if not exists standalone_proposals (
  id uuid primary key default gen_random_uuid(),
  numero integer generated always as identity,
  titulo text,
  corpo text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists standalone_proposals_created_at_idx
  on standalone_proposals (created_at desc);

alter table standalone_proposals enable row level security;

-- Mesmo padrão das outras tabelas de dado da empresa: a equipe ativa vê e
-- edita; a exclusão é lógica (deleted_at), filtrada no app.
drop policy if exists "staff select" on standalone_proposals;
create policy "staff select" on standalone_proposals for select using (is_active_staff());

drop policy if exists "staff insert" on standalone_proposals;
create policy "staff insert" on standalone_proposals for insert with check (is_active_staff());

drop policy if exists "staff update" on standalone_proposals;
create policy "staff update" on standalone_proposals for update using (is_active_staff()) with check (is_active_staff());

drop trigger if exists trg_standalone_proposals_touch on standalone_proposals;
create trigger trg_standalone_proposals_touch before update on standalone_proposals
  for each row execute function touch_updated_at();
