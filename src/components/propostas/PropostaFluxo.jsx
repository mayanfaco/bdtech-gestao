import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { estadoDoFluxo } from '../../lib/propostaFluxo.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
}

export function PropostaFluxo({ proposalId, currentStatus, refreshKey }) {
  const [hist, setHist] = React.useState(null);

  React.useEffect(() => {
    supabase.from('proposal_status_history').select('status, changed_at').eq('proposal_id', proposalId)
      .order('changed_at', { ascending: true }).then(({ data }) => setHist(data ?? []));
  }, [proposalId, refreshKey]);

  if (hist === null) return null;

  // O estado das etapas vem do status atual (ver estadoDoFluxo) — o histórico
  // guarda a passagem por cada etapa, mas não o estado de hoje.
  const { etapas, negativo, dataNegativo } = estadoDoFluxo(currentStatus, hist);

  return (
    <Card padding="lg">
      <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-4)' }}>Andamento da proposta</h3>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 480 }}>
          {etapas.map((etapa, i) => {
            const { concluida, atual, alcancada, data } = etapa;
            const ringColor = concluida ? 'var(--bd-success-500)' : atual ? 'var(--bd-primary-500)' : 'var(--bd-border-strong)';
            const fill = concluida ? 'var(--bd-success-500)' : atual ? 'var(--bd-primary-500)' : 'var(--bd-surface-card)';
            return (
              <React.Fragment key={etapa.key}>
                {i > 0 && (
                  <div style={{ flex: 1, height: 2, background: alcancada ? 'var(--bd-success-500)' : 'var(--bd-border-default)', marginTop: 15 }} />
                )}
                <div style={{ flex: '0 0 auto', width: 108, textAlign: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${ringColor}`, background: fill, color: (concluida || atual) ? '#fff' : 'var(--bd-text-muted)',
                    fontWeight: 800, fontSize: 14,
                  }}>
                    {concluida ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: (concluida || atual) ? 'var(--bd-text-strong)' : 'var(--bd-text-muted)', marginTop: 6, lineHeight: 1.3 }}>
                    {etapa.label}
                  </div>
                  {data && <div style={{ fontSize: 11, color: 'var(--bd-text-subtle)', marginTop: 2 }}>{fmt(data)}</div>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      {negativo && (
        <div style={{
          marginTop: 'var(--bd-space-4)', padding: '10px 14px', borderRadius: 'var(--bd-radius-md)',
          background: 'var(--bd-danger-50)', color: 'var(--bd-danger-700)', fontSize: 13, fontWeight: 600,
        }}>
          Proposta {negativo}{dataNegativo ? ` em ${fmt(dataNegativo)}` : ''}.
        </div>
      )}
    </Card>
  );
}
