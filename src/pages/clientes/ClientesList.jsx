import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { IconButton } from '../../design-system/components/buttons/IconButton.jsx';
import { I } from '../../components/layout/icons.jsx';

const RELACIONAMENTO_LABEL = { prospect: 'Prospect', ativo: 'Ativo', inativo: 'Inativo' };
const RELACIONAMENTO_TONE = { prospect: 'warning', ativo: 'success', inativo: 'neutral' };

// Cor do avatar derivada do nome — dá variedade sem precisar de dado extra.
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, var(--bd-navy-800), var(--bd-primary-600))',
  'linear-gradient(135deg, var(--bd-primary-600), var(--bd-accent-400))',
  'linear-gradient(135deg, var(--bd-navy-900), var(--bd-navy-600))',
];
function avatarGradient(nome) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}
function initials(nome) {
  const words = nome.replace(/\[.*?\]/g, '').trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '·';
}

function MetaRow({ icon, children }) {
  return (
    <div className="bd-u-flex bd-u-items-center bd-u-gap-2" style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
      <span style={{ display: 'flex', color: 'var(--bd-text-subtle)', flex: '0 0 auto' }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
    </div>
  );
}

export default function ClientesList() {
  const [clients, setClients] = React.useState(null);
  const [counts, setCounts] = React.useState({});
  const [search, setSearch] = React.useState('');
  const [searchParams] = useSearchParams();
  const urlDesde = searchParams.get('desde');

  const load = React.useCallback(() => {
    supabase.from('clients').select('*').is('deleted_at', null).order('nome').then(({ data }) => setClients(data ?? []));
    supabase.from('proposals').select('client_id').is('deleted_at', null).then(({ data }) => {
      const byClient = {};
      (data ?? []).forEach((p) => { if (p.client_id) byClient[p.client_id] = (byClient[p.client_id] ?? 0) + 1; });
      setCounts((c) => ({ ...c, propostas: byClient }));
    });
    supabase.from('contracts').select('client_id, status').is('deleted_at', null).in('status', ['ativo', 'assinado']).then(({ data }) => {
      const byClient = {};
      (data ?? []).forEach((c) => { if (c.client_id) byClient[c.client_id] = (byClient[c.client_id] ?? 0) + 1; });
      setCounts((c) => ({ ...c, contratos: byClient }));
    });
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(e, id, nome) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Excluir o cliente "${nome}"? Propostas, contratos e outros registros vinculados a ele continuam existindo, mas ele deixa de aparecer nas listas.`)) return;
    const { error } = await supabase.from('clients').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) { alert(error.message); return; }
    load();
  }

  if (clients === null) return null;

  let filtered = clients.filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()));
  if (urlDesde) filtered = filtered.filter((c) => new Date(c.created_at) >= new Date(urlDesde));

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      {urlDesde && (
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
          Filtro vindo do painel executivo · {filtered.length} cliente(s)
          <Link to="/clientes" style={{ color: 'var(--bd-primary-600)' }}>Limpar filtro</Link>
        </div>
      )}
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-4">
        <div style={{ maxWidth: 320, flex: 1 }}>
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button as={Link} to="/clientes/novo">Novo cliente</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado ainda"
          text="Cadastre o primeiro condomínio ou empreendimento para começar a emitir propostas."
          action={<Button as={Link} to="/clientes/novo">Novo cliente</Button>}
        />
      ) : (
        <div className="bd-u-grid-2 bd-u-gap-4">
          {filtered.map((c) => {
            const localizacao = [c.cidade, c.estado].filter(Boolean).join('/');
            const contratosAtivos = counts.contratos?.[c.id] ?? 0;
            const propostasCount = counts.propostas?.[c.id] ?? 0;
            return (
              <Link key={c.id} to={`/clientes/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <Card interactive padding="lg" style={{ height: '100%' }}>
                  <div className="bd-u-flex bd-u-gap-4" style={{ alignItems: 'flex-start' }}>
                    <div style={{
                      flex: '0 0 auto', width: 44, height: 44, borderRadius: 'var(--bd-radius-md)',
                      background: avatarGradient(c.nome), color: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 800, fontSize: 15, fontFamily: 'var(--bd-font-display)',
                    }}>
                      {initials(c.nome)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-2">
                        <div style={{
                          fontWeight: 700, color: 'var(--bd-text-strong)', fontFamily: 'var(--bd-font-display)',
                          fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.nome}
                        </div>
                        <IconButton label="Excluir cliente" size="sm" onClick={(e) => handleDelete(e, c.id, c.nome)} style={{ flex: '0 0 auto' }}>
                          <span style={{ color: 'var(--bd-danger-500)', display: 'flex' }}>{I.trash}</span>
                        </IconButton>
                      </div>
                      {c.status_relacionamento && (
                        <Badge tone={RELACIONAMENTO_TONE[c.status_relacionamento]} style={{ marginTop: 4 }}>
                          {RELACIONAMENTO_LABEL[c.status_relacionamento]}
                        </Badge>
                      )}

                      <div className="bd-u-flex-col bd-u-gap-2" style={{ marginTop: 'var(--bd-space-4)' }}>
                        {localizacao && <MetaRow icon={I.pin}>{localizacao}</MetaRow>}
                        {c.qtd_elevadores != null && <MetaRow icon={I.building}>{c.qtd_elevadores} elevador(es)</MetaRow>}
                        {c.contato_nome && <MetaRow icon={I.users}>{c.contato_nome}{c.contato_cargo ? ` — ${c.contato_cargo}` : ''}</MetaRow>}
                        {c.whatsapp && <MetaRow icon={I.phone}>{c.whatsapp}</MetaRow>}
                      </div>

                      <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{
                        marginTop: 'var(--bd-space-4)', paddingTop: 'var(--bd-space-3)',
                        borderTop: '1px solid var(--bd-border-subtle)', fontSize: 12, color: 'var(--bd-text-subtle)',
                      }}>
                        <span className="bd-u-flex bd-u-items-center bd-u-gap-1">
                          <span style={{ display: 'flex' }}>{I.proposal}</span>
                          {propostasCount} proposta(s)
                        </span>
                        <span className="bd-u-flex bd-u-items-center bd-u-gap-1" style={contratosAtivos ? { color: 'var(--bd-success-600)', fontWeight: 600 } : undefined}>
                          <span style={{ display: 'flex' }}>{I.contract}</span>
                          {contratosAtivos} contrato(s) ativo(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
