import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from '../../lib/statusLabels.js';
import { proposalNumberLabel, formatCurrency } from '../../lib/proposalCalculations.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { IconButton } from '../../design-system/components/buttons/IconButton.jsx';
import { I } from '../../components/layout/icons.jsx';

export default function PropostasList() {
  const [proposals, setProposals] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [searchParams] = useSearchParams();

  const urlStatuses = (searchParams.get('status') || '').split(',').filter(Boolean);
  const urlDesde = searchParams.get('desde');
  const urlResponsavel = searchParams.get('responsavel');
  const vindoDaDash = urlStatuses.length > 0 || urlDesde || urlResponsavel;

  const load = React.useCallback(() => {
    supabase.from('proposals').select('*, clients(nome)').is('deleted_at', null).order('created_at', { ascending: false })
      .then(({ data }) => setProposals(data ?? []));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(e, p) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Excluir a proposta ${proposalNumberLabel(p)}? Ela deixa de aparecer nas listas.`)) return;
    const { error } = await supabase.from('proposals').update({ deleted_at: new Date().toISOString() }).eq('id', p.id);
    if (error) { alert(error.message); return; }
    load();
  }

  if (proposals === null) return null;

  let filtered = proposals;
  if (statusFilter) filtered = filtered.filter((p) => p.status === statusFilter);
  else if (urlStatuses.length) filtered = filtered.filter((p) => urlStatuses.includes(p.status));
  if (urlDesde) filtered = filtered.filter((p) => new Date(p.status_changed_at || p.created_at) >= new Date(urlDesde));
  if (urlResponsavel) filtered = filtered.filter((p) => p.responsavel_user_id === urlResponsavel);

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      {vindoDaDash && (
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
          Filtro vindo do painel executivo · {filtered.length} proposta(s)
          <Link to="/propostas" style={{ color: 'var(--bd-primary-600)' }}>Limpar filtro</Link>
        </div>
      )}
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div style={{ maxWidth: 240 }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="Todos os status" options={Object.entries(PROPOSAL_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        </div>
        <Button as={Link} to="/propostas/nova">Nova proposta</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma proposta emitida ainda"
          text="Cadastre um cliente e emita a primeira proposta para começar a acompanhar aqui."
          action={<Button as={Link} to="/propostas/nova">Nova proposta</Button>} />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/propostas/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <Card interactive>
                <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-5) var(--bd-space-6)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)', fontFamily: 'var(--bd-font-display)' }}>
                      {proposalNumberLabel(p)} · {p.clients?.nome ?? 'Sem cliente'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 2 }}>
                      {p.titulo || p.servico_tipo || 'Consultoria Técnica em Elevadores'} · {formatCurrency(p.valor_total ?? p.modelo1_valor_com_desconto)}
                    </div>
                  </div>
                  <div className="bd-u-flex bd-u-items-center bd-u-gap-3">
                    <Badge tone={PROPOSAL_STATUS_TONE[p.status]}>{PROPOSAL_STATUS_LABEL[p.status]}</Badge>
                    <IconButton label="Excluir proposta" size="sm" onClick={(e) => handleDelete(e, p)}>
                      <span style={{ color: 'var(--bd-danger-500)', display: 'flex' }}>{I.trash}</span>
                    </IconButton>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
