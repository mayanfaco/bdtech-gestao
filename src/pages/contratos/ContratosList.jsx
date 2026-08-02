import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { CONTRACT_STATUS_LABEL, CONTRACT_STATUS_TONE } from '../../lib/statusLabels.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';

export default function ContratosList() {
  const [contracts, setContracts] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('');

  React.useEffect(() => {
    supabase.from('contracts').select('*, clients(nome)').is('deleted_at', null).order('created_at', { ascending: false })
      .then(({ data }) => setContracts(data ?? []));
  }, []);

  if (contracts === null) return null;
  const filtered = statusFilter ? contracts.filter((c) => c.status === statusFilter) : contracts;

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
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
                  <Badge tone={CONTRACT_STATUS_TONE[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
