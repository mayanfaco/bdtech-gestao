import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';

const STATUS_LABEL = { novo: 'Novo', em_contato: 'Em contato', qualificado: 'Qualificado', convertido: 'Convertido', descartado: 'Descartado' };
const STATUS_TONE = { novo: 'brand', em_contato: 'warning', qualificado: 'success', convertido: 'navy', descartado: 'neutral' };

export default function LeadsList() {
  const [leads, setLeads] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  React.useEffect(() => {
    supabase.from('leads').select('*').is('deleted_at', null).order('created_at', { ascending: false })
      .then(({ data }) => setLeads(data ?? []));
  }, []);

  if (leads === null) return null;

  const filtered = leads.filter((l) =>
    (!statusFilter || l.status === statusFilter) &&
    (l.nome.toLowerCase().includes(search.toLowerCase()) || (l.empresa ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-4">
        <div className="bd-u-flex bd-u-gap-3" style={{ flex: 1 }}>
          <div style={{ maxWidth: 280, flex: 1 }}>
            <Input placeholder="Buscar lead..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ maxWidth: 200 }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Todos os status" options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
          </div>
        </div>
        <Button as={Link} to="/leads/novo">Novo lead</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum lead cadastrado ainda" text="Cadastre o primeiro contato comercial recebido."
          action={<Button as={Link} to="/leads/novo">Novo lead</Button>} />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-3">
          {filtered.map((l) => (
            <Link key={l.id} to={`/leads/${l.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <Card interactive>
                <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-5) var(--bd-space-6)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)', fontFamily: 'var(--bd-font-display)' }}>{l.nome}</div>
                    <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 2 }}>
                      {l.empresa || 'Sem empresa'}{l.origem ? ` · ${l.origem}` : ''}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
