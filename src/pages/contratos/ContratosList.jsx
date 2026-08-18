import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { CONTRACT_STATUS_LABEL, CONTRACT_STATUS_TONE } from '../../lib/statusLabels.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { IconButton } from '../../design-system/components/buttons/IconButton.jsx';
import { I } from '../../components/layout/icons.jsx';

function diasParaVencer(iso) {
  return iso ? Math.ceil((new Date(iso) - new Date()) / 86400000) : null;
}

export default function ContratosList() {
  const [contracts, setContracts] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [searchParams] = useSearchParams();

  const urlStatuses = (searchParams.get('status') || '').split(',').filter(Boolean);
  const urlVencendo = searchParams.get('vencendo');
  const urlResponsavel = searchParams.get('responsavel');
  const vindoDaDash = urlStatuses.length > 0 || urlVencendo || urlResponsavel;

  const load = React.useCallback(() => {
    supabase.from('contracts').select('*, clients(nome)').is('deleted_at', null).order('created_at', { ascending: false })
      .then(({ data }) => setContracts(data ?? []));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(e, c) {
    e.preventDefault();
    e.stopPropagation();
    const label = `CONT-${new Date(c.data_inicio).getFullYear()}-${String(c.numero).padStart(4, '0')}`;
    if (!window.confirm(`Excluir o contrato ${label}? Ele deixa de aparecer nas listas.`)) return;
    const { error } = await supabase.from('contracts').update({ deleted_at: new Date().toISOString() }).eq('id', c.id);
    if (error) { alert(error.message); return; }
    load();
  }

  if (contracts === null) return null;

  let filtered = contracts;
  if (statusFilter) filtered = filtered.filter((c) => c.status === statusFilter);
  else if (urlStatuses.length) filtered = filtered.filter((c) => urlStatuses.includes(c.status));
  if (urlVencendo) {
    const dias = Number(urlVencendo);
    filtered = filtered.filter((c) => {
      const d = diasParaVencer(c.data_termino);
      return ['ativo', 'assinado', 'proximo_vencimento'].includes(c.status) && d != null && d >= 0 && d <= dias;
    });
  }
  if (urlResponsavel) filtered = filtered.filter((c) => c.responsavel_user_id === urlResponsavel);

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      {vindoDaDash && (
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
          Filtro vindo do painel executivo · {filtered.length} contrato(s)
          <Link to="/contratos" style={{ color: 'var(--bd-primary-600)' }}>Limpar filtro</Link>
        </div>
      )}
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div style={{ maxWidth: 240 }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="Todos os status" options={Object.entries(CONTRACT_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        </div>
        <Button as={Link} to="/contratos/novo">Novo contrato</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum contrato registrado ainda"
          text="Contratos podem ser criados a partir de uma proposta aprovada ou diretamente aqui."
          action={<Button as={Link} to="/contratos/novo">Novo contrato</Button>} />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-3">
          {filtered.map((c) => (
            <Link key={c.id} to={`/contratos/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <Card interactive>
                <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-5) var(--bd-space-6)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)', fontFamily: 'var(--bd-font-display)' }}>
                      CONT-{new Date(c.data_inicio).getFullYear()}-{String(c.numero).padStart(4, '0')} · {c.clients?.nome ?? c.contratante_nome}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 2 }}>
                      {c.data_inicio} a {c.data_termino} · {formatCurrency(c.valor_total)}
                    </div>
                  </div>
                  <div className="bd-u-flex bd-u-items-center bd-u-gap-3">
                    <Badge tone={CONTRACT_STATUS_TONE[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</Badge>
                    <IconButton label="Excluir contrato" size="sm" onClick={(e) => handleDelete(e, c)}>
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
