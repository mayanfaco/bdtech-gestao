-- BDTECH Gestão — schema inicial
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase (supabase.com).

-- ============================================================
-- company_settings — uma linha por usuário: dados fixos da Contratada
-- + textos-base (boilerplate) da proposta, editáveis em Configurações.
-- ============================================================
create table company_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  razao_social text not null default 'BDTECH Engenharia e Consultoria em Elevadores',
  cnpj text not null default '63.861.190/0001-51',
  endereco text not null default 'Rua Vicente Linhares, 651, sala 01, Aldeota, Fortaleza/CE',
  representante_legal text not null default 'Cristóbulo Campêlo Bedê e Silva',
  representante_cpf text not null default '293.436.233-72',
  crea text not null default 'CREA-CE 18881',
  texto_objeto text,
  texto_modelos text,
  texto_vigencia text,
  texto_responsabilidade text,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================
-- clients — condomínio / empreendimento
-- ============================================================
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  nome text not null,
  cnpj text,
  endereco text,
  sindico_nome text,
  sindico_cpf text,
  contato_nome text,
  contato_cargo text,
  contato_email text,
  contato_telefone text,
  qtd_elevadores integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- proposals
-- ============================================================
create table proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  client_id uuid not null references clients(id),
  numero serial,
  data_proposta date not null default current_date,
  qtd_elevadores integer not null,
  desconto_percentual numeric(5,2) not null default 0,
  modelo1_valor_com_desconto numeric(12,2),
  modelo1_entrada_percentual numeric(5,2),
  modelo2_valor_com_desconto_mensal numeric(12,2),
  modelo2_entrada_percentual numeric(5,2),
  modelo2_parcelas_restante integer,
  texto_overrides jsonb,
  status text not null default 'rascunho'
    check (status in ('rascunho','emitida','enviada','em_negociacao','convertida','recusada','expirada')),
  status_changed_at timestamptz not null default now(),
  sent_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table proposal_status_history (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  status text not null,
  note text,
  changed_at timestamptz not null default now()
);

-- ============================================================
-- contracts
-- ============================================================
create table contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  client_id uuid not null references clients(id),
  proposal_id uuid references proposals(id),
  modelo text not null check (modelo in ('modelo1', 'modelo2')),

  -- contratante (snapshot editável, pré-preenchido a partir de clients)
  contratante_nome text not null,
  contratante_cnpj text,
  contratante_endereco text,
  contratante_sindico_nome text,
  contratante_sindico_cpf text,

  -- contratada (snapshot congelado a partir de company_settings na criação —
  -- um documento legal já emitido não deve mudar se as configs mudarem depois)
  contratada_razao_social text not null,
  contratada_cnpj text not null,
  contratada_endereco text not null,
  contratada_representante text not null,
  contratada_cpf text not null,

  -- objeto e prazo
  escopo_servico text not null,
  data_inicio date not null,
  data_termino date not null,
  vigencia_renovacao_data date generated always as (data_inicio + interval '1 year') stored,

  -- pagamento
  valor_total numeric(12,2) not null,
  valor_total_extenso text not null,
  parcela1_valor numeric(12,2),
  parcela1_data date,
  parcela2_valor numeric(12,2),
  parcela2_data date,
  parcelas_mensais_valor numeric(12,2),
  parcelas_mensais_inicio date,

  -- foro e assinatura
  comarca_foro text,
  cidade_assinatura text,
  data_assinatura date,

  status text not null default 'rascunho'
    check (status in ('rascunho','emitido','enviado_assinatura','assinado','ativo','encerrado','renovado')),
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contract_status_history (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  status text not null,
  note text,
  changed_at timestamptz not null default now()
);

-- ============================================================
-- calendar_events — reuniões e vistorias marcadas
-- ============================================================
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  titulo text not null,
  tipo text not null default 'reuniao' check (tipo in ('reuniao', 'vistoria', 'outro')),
  data_inicio timestamptz not null,
  data_fim timestamptz,
  all_day boolean not null default false,
  local text,
  descricao text,
  client_id uuid references clients(id),
  proposal_id uuid references proposals(id),
  contract_id uuid references contracts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Triggers de auditoria de status — toda mudança de status vira uma
-- linha no histórico correspondente. Métricas de "tempo até decisão"
-- consultam essas tabelas diretamente.
-- ============================================================
create function log_proposal_status_change() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into proposal_status_history (proposal_id, status) values (new.id, new.status);
    new.status_changed_at = now();
    if new.status = 'enviada' and new.sent_at is null then
      new.sent_at = now();
    elsif new.status = 'convertida' and new.converted_at is null then
      new.converted_at = now();
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_proposal_status_insert
  before insert on proposals
  for each row execute function log_proposal_status_change();

create trigger trg_proposal_status_update
  before update on proposals
  for each row execute function log_proposal_status_change();

create function log_contract_status_change() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into contract_status_history (contract_id, status) values (new.id, new.status);
    new.status_changed_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_contract_status_insert
  before insert on contracts
  for each row execute function log_contract_status_change();

create trigger trg_contract_status_update
  before update on contracts
  for each row execute function log_contract_status_change();

create function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clients_touch before update on clients
  for each row execute function touch_updated_at();
create trigger trg_calendar_events_touch before update on calendar_events
  for each row execute function touch_updated_at();
create trigger trg_company_settings_touch before update on company_settings
  for each row execute function touch_updated_at();

-- ============================================================
-- Atividade recente — combina os dois históricos de status + eventos
-- recentes, para o feed de atividades da dashboard.
-- ============================================================
create view recent_activity as
  select 'proposal_status'::text as kind, psh.changed_at as at, psh.proposal_id as ref_id,
         p.user_id, psh.status
    from proposal_status_history psh join proposals p on p.id = psh.proposal_id
  union all
  select 'contract_status'::text as kind, csh.changed_at as at, csh.contract_id as ref_id,
         c.user_id, csh.status
    from contract_status_history csh join contracts c on c.id = csh.contract_id
  union all
  select 'calendar_event'::text as kind, ce.created_at as at, ce.id as ref_id,
         ce.user_id, ce.tipo as status
    from calendar_events ce;

-- ============================================================
-- Row Level Security — cada usuário só vê/edita suas próprias linhas.
-- ============================================================
alter table company_settings enable row level security;
alter table clients enable row level security;
alter table proposals enable row level security;
alter table proposal_status_history enable row level security;
alter table contracts enable row level security;
alter table contract_status_history enable row level security;
alter table calendar_events enable row level security;

create policy "own rows" on company_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on proposals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on contracts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on calendar_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows via proposal" on proposal_status_history
  for all using (exists (
    select 1 from proposals p where p.id = proposal_id and p.user_id = auth.uid()
  ));
create policy "own rows via contract" on contract_status_history
  for all using (exists (
    select 1 from contracts c where c.id = contract_id and c.user_id = auth.uid()
  ));

-- ============================================================
-- Seed — cria a linha de configurações da empresa para o usuário logado.
-- Rode isto UMA VEZ, autenticado como o usuário que você criou no
-- Supabase Auth (ex.: via "Run as" no SQL Editor, ou pelo app depois
-- de logar, chamando um insert simples a partir de Configurações).
-- ============================================================
-- insert into company_settings (user_id) values (auth.uid());
