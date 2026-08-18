-- BDTECH Gestão — corrige "new row violates row-level security policy for
-- table proposal_versions" ao excluir uma proposta já enviada.
--
-- Causa raiz (dois problemas juntos):
-- 1) A tabela proposal_versions nunca teve política de INSERT — só de SELECT.
--    Sem política de insert, toda tentativa de gravar uma versão é negada.
-- 2) O gatilho log_proposal_version() compara os campos da proposta ignorando
--    status/timestamps de controle, mas não ignorava "deleted_at" — então
--    excluir (soft-delete) uma proposta já enviada era tratado como "edição
--    de conteúdo" e tentava gravar uma versão, batendo no problema (1).
--
-- Rode isto no SQL Editor do Supabase.

-- 1) Política de insert para staff ativo (mesma regra usada nas outras tabelas).
create policy "staff insert" on proposal_versions for insert with check (is_active_staff());

-- 2) Recria o gatilho ignorando também deleted_at na comparação de conteúdo.
create or replace function log_proposal_version() returns trigger as $$
declare
  v_ignore text[] := array[
    'status','status_changed_at','sent_at','viewed_at','converted_at',
    'cancelled_at','archived_at','deleted_at','updated_at','version_atual','texto_overrides'
  ];
  v_old jsonb := to_jsonb(old) - v_ignore;
  v_new jsonb := to_jsonb(new) - v_ignore;
begin
  if old.sent_at is not null and tg_op = 'UPDATE' and v_old is distinct from v_new then
    new.version_atual = old.version_atual + 1;
    insert into proposal_versions (proposal_id, numero_versao, created_by, motivo, snapshot, changed_fields)
      values (new.id, new.version_atual, auth.uid(), 'Edição após envio', to_jsonb(old), v_new);
  end if;
  return new;
end;
$$ language plpgsql;
