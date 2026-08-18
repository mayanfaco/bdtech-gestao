import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

// Etapas visíveis do andamento da proposta. Cada etapa "casa" com um ou mais
// status internos (ex.: "Enviada" cobre enviada + visualizada).
const STEPS = [
  { key: 'rascunho', label: 'Criada', match: ['rascunho', 'pronta_para_envio'] },
  { key: 'enviada', label: 'Enviada ao cliente', match: ['enviada', 'visualizada'] },
  { key: 'em_negociacao', label: 'Em negociação', match: ['em_negociacao'] },
  { key: 'aprovada', label: 'Aprovada', match: ['aprovada'] },
];
const NEGATIVOS = { recusada: 'Recusada', cancelada: 'Cancelada', expirada: 'Expirada', arquivada: 'Arquivada' };

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

  const dateOf = {};
  hist.forEach((h) => { if (!dateOf[h.status]) dateOf[h.status] = h.changed_at; });
  const negativo = NEGATIVOS[currentStatus];
  const currentStepIndex = STEPS.findIndex((s) => s.match.includes(currentStatus));

  return (
    <Card padding="lg">
      <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-4)' }}>Andamento da proposta</h3>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 480 }}>
          {STEPS.map((step, i) => {
            const date = step.match.map((s) => dateOf[s]).find(Boolean);
            const done = !!date || (currentStepIndex >= 0 && i < currentStepIndex);
            const isCurrent = i === currentStepIndex && !negativo;
            const ringColor = done ? 'var(--bd-success-500)' : isCurrent ? 'var(--bd-primary-500)' : 'var(--bd-border-strong)';
            const fill = done ? 'var(--bd-success-500)' : isCurrent ? 'var(--bd-primary-500)' : 'var(--bd-surface-card)';
            return (
              <React.Fragment key={step.key}>
                {i > 0 && (
                  <div style={{ flex: 1, height: 2, background: done || i <= currentStepIndex ? 'var(--bd-success-500)' : 'var(--bd-border-default)', marginTop: 15 }} />
                )}
                <div style={{ flex: '0 0 auto', width: 108, textAlign: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${ringColor}`, background: fill, color: (done || isCurrent) ? '#fff' : 'var(--bd-text-muted)',
                    fontWeight: 800, fontSize: 14,
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: (done || isCurrent) ? 'var(--bd-text-strong)' : 'var(--bd-text-muted)', marginTop: 6, lineHeight: 1.3 }}>
                    {step.label}
                  </div>
                  {date && <div style={{ fontSize: 11, color: 'var(--bd-text-subtle)', marginTop: 2 }}>{fmt(date)}</div>}
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
          Proposta {negativo}{dateOf[currentStatus] ? ` em ${fmt(dateOf[currentStatus])}` : ''}.
        </div>
      )}
    </Card>
  );
}
