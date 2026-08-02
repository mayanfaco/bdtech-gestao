import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';

const ENTITY_LABEL = {
  lead: 'Lead', opportunity: 'Oportunidade', client: 'Cliente', client_contact: 'Contato',
  proposal: 'Proposta', contract: 'Contrato', calendar_event: 'Evento', task: 'Tarefa',
};

export default function BuscaResultados() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [results, setResults] = React.useState(null);

  React.useEffect(() => {
    if (!q) { setResults([]); return; }
    supabase.rpc('global_search', { q }).then(({ data, error }) => setResults(error ? [] : (data ?? [])));
  }, [q]);

  return (
    <div className="bd-u-flex-col bd-u-gap-4">
      <h1 style={{ fontSize: 22 }}>Resultados para "{q}"</h1>
      {results === null ? null : results.length === 0 ? (
        <EmptyState title="Nenhum resultado encontrado" text="Tente buscar por nome, e-mail, telefone, CPF/CNPJ ou código da proposta/contrato." />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-2">
          {results.map((r) => (
            <Link key={`${r.entity_type}-${r.id}`} to={r.route} style={{ textDecoration: 'none', display: 'block' }}>
              <Card interactive>
                <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-4) var(--bd-space-5)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)' }}>{r.label}</div>
                    {r.subtitle && <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>{r.subtitle}</div>}
                  </div>
                  <Badge tone="neutral">{ENTITY_LABEL[r.entity_type] ?? r.entity_type}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
