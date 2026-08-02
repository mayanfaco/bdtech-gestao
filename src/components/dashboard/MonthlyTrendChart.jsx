import React from 'react';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

// Par categórico validado (node scripts/validate_palette.js): mesmo hue da
// marca em duas luminosidades distintas — passou luminosidade/croma/CVD.
const SERIES_COLOR = { propostas: '#2EB2E8', contratos: '#006699' };

/** Barras agrupadas por mês — duas séries (propostas x contratos), com legenda
    (obrigatória a partir de 2 séries) e rótulo direto só no total do mês. */
export function MonthlyTrendChart({ months }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.propostas, m.contratos]));
  return (
    <Card padding="lg">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ marginBottom: 'var(--bd-space-4)' }}>
        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, margin: 0 }}>Evolução mensal</h3>
        <div className="bd-u-flex bd-u-gap-4">
          <span style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: SERIES_COLOR.propostas, marginRight: 6 }} />Propostas</span>
          <span style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: SERIES_COLOR.contratos, marginRight: 6 }} />Contratos</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
        {months.map((m) => (
          <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
              <div title={`Propostas: ${m.propostas}`} style={{ width: 12, height: `${Math.max(2, (m.propostas / max) * 120)}px`, background: SERIES_COLOR.propostas, borderRadius: '3px 3px 0 0' }} />
              <div title={`Contratos: ${m.contratos}`} style={{ width: 12, height: `${Math.max(2, (m.contratos / max) * 120)}px`, background: SERIES_COLOR.contratos, borderRadius: '3px 3px 0 0' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--bd-text-subtle)' }}>{m.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
