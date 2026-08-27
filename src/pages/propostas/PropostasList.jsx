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

const TONE_HEX = { brand: 'var(--bd-primary-500)', success: 'var(--bd-success-500)', warning: 'var(--bd-warning-500)', neutral: 'var(--bd-text-muted)' };

const GROUPS = [
  { key: 'rascunhos', label: 'Rascunhos', statuses: ['rascunho', 'aguardando_revisao', 'pronta_para_envio'], tone: 'neutral' },
  { key: 'enviadas', label: 'Enviadas', statuses: ['enviada', 'visualizada'], tone: 'brand' },
  { key: 'negociacao', label: 'Em negociação', statuses: ['em_negociacao'], tone: 'warning' },
  { key: 'aprovadas', label: 'Aprovadas', statuses: ['aprovada'], tone: 'success' },
];
const OUTRAS_STATUSES = ['recusada', 'expirada', 'cancelada', 'arquivada'];

function BigStat({ label, value, hint, tone, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', flex: '1 1 160px', minWidth: 150,
      background: 'var(--bd-surface-card)', border: `1px solid ${active ? TONE_HEX[tone] : 'var(--bd-border-subtle)'}`,
      borderRadius: 'var(--bd-radius-lg)', padding: 'var(--bd-space-5)', boxShadow: active ? `0 0 0 3px ${TONE_HEX[tone]}22` : 'var(--bd-shadow-card)',
      transition: 'border-color .15s, box-shadow .15s',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-text-muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 30, color: 'var(--bd-navy-900)', marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: 'var(--bd-text-subtle)', marginTop: 4 }}>{hint}</div>}
      <div style={{ height: 3, borderRadius: 3, background: TONE_HEX[tone], marginTop: 10, opacity: active ? 1 : 0.35 }} />
    </button>
  );
}

function ProposalRow({ p, onDelete }) {
  return (
    <Link to={`/propostas/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
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
            <IconButton label="Excluir proposta" size="sm" onClick={(e) => onDelete(e, p)}>
              <span style={{ color: 'var(--bd-danger-500)', display: 'flex' }}>{I.trash}</span>
            </IconButton>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function PropostasList() {
  const [proposals, setProposals] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [activeGroup, setActiveGroup] = React.useState(null);
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

  let base = proposals;
  if (urlStatuses.length) base = base.filter((p) => urlStatuses.includes(p.status));
  if (urlDesde) base = base.filter((p) => new Date(p.status_changed_at || p.created_at) >= new Date(urlDesde));
  if (urlResponsavel) base = base.filter((p) => p.responsavel_user_id === urlResponsavel);

  const valorDe = (p) => Number(p.valor_total) || Number(p.modelo1_valor_com_desconto) || 0;
  const groupsWithData = GROUPS.map((g) => {
    const items = base.filter((p) => g.statuses.includes(p.status));
    return { ...g, items, total: items.reduce((sum, p) => sum + valorDe(p), 0) };
  });
  const outras = base.filter((p) => OUTRAS_STATUSES.includes(p.status));

  // Modo "filtro manual" (dropdown de status específico) continua disponível
  // e sobrepõe a visão em big numbers com uma lista simples filtrada.
  const modoDropdown = Boolean(statusFilter);
  const listaDropdown = modoDropdown ? base.filter((p) => p.status === statusFilter) : [];

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      {vindoDaDash && (
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
          Filtro vindo do painel executivo · {base.length} proposta(s)
          <Link to="/propostas" style={{ color: 'var(--bd-primary-600)' }}>Limpar filtro</Link>
        </div>
      )}
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div style={{ maxWidth: 240 }}>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setActiveGroup(null); }}
            placeholder="Todos os status" options={Object.entries(PROPOSAL_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        </div>
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3">
          <Button variant="outline" as={Link} to="/propostas/avulsas">Propostas avulsas</Button>
          <Button as={Link} to="/propostas/nova">Nova proposta</Button>
        </div>
      </div>

      {!modoDropdown && (
        <div className="bd-u-flex bd-u-gap-4" style={{ flexWrap: 'wrap' }}>
          {groupsWithData.map((g) => (
            <BigStat key={g.key} label={g.label} value={g.items.length}
              hint={g.total > 0 ? formatCurrency(g.total) : undefined}
              tone={g.tone} active={activeGroup === g.key}
              onClick={() => setActiveGroup((cur) => (cur === g.key ? null : g.key))} />
          ))}
        </div>
      )}

      {!modoDropdown && activeGroup && (
        <div className="bd-u-flex bd-u-items-center bd-u-gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveGroup(null)}>← Ver todas as propostas</Button>
        </div>
      )}

      {proposals.length === 0 ? (
        <EmptyState title="Nenhuma proposta emitida ainda"
          text="Cadastre um cliente e emita a primeira proposta para começar a acompanhar aqui."
          action={<Button as={Link} to="/propostas/nova">Nova proposta</Button>} />
      ) : modoDropdown ? (
        listaDropdown.length === 0 ? (
          <EmptyState title="Nenhuma proposta com esse status" />
        ) : (
          <div className="bd-u-flex-col bd-u-gap-3">
            {listaDropdown.map((p) => <ProposalRow key={p.id} p={p} onDelete={handleDelete} />)}
          </div>
        )
      ) : (
        <div className="bd-u-flex-col bd-u-gap-6">
          {groupsWithData.filter((g) => !activeGroup || activeGroup === g.key).map((g) => (
            <div key={g.key}>
              <div className="bd-u-flex bd-u-items-center bd-u-gap-2" style={{ marginBottom: 'var(--bd-space-3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TONE_HEX[g.tone] }} />
                <h2 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, fontWeight: 700, color: 'var(--bd-text-strong)' }}>
                  {g.label} <span style={{ color: 'var(--bd-text-muted)', fontWeight: 500 }}>({g.items.length})</span>
                </h2>
              </div>
              {g.items.length === 0 ? (
                <EmptyState title={`Nenhuma proposta em "${g.label}"`} />
              ) : (
                <div className="bd-u-flex-col bd-u-gap-3">
                  {g.items.map((p) => <ProposalRow key={p.id} p={p} onDelete={handleDelete} />)}
                </div>
              )}
            </div>
          ))}

          {!activeGroup && outras.length > 0 && (
            <div>
              <div className="bd-u-flex bd-u-items-center bd-u-gap-2" style={{ marginBottom: 'var(--bd-space-3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bd-danger-500)' }} />
                <h2 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, fontWeight: 700, color: 'var(--bd-text-strong)' }}>
                  Outras <span style={{ color: 'var(--bd-text-muted)', fontWeight: 500 }}>({outras.length})</span>
                </h2>
              </div>
              <div className="bd-u-flex-col bd-u-gap-3">
                {outras.map((p) => <ProposalRow key={p.id} p={p} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
