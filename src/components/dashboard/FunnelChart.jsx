import React from 'react';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

// Rampa sequencial validada (node scripts/validate_palette.js --ordinal): um
// hue só, do mais claro ao mais escuro — todas as checagens da skill de
// dataviz passaram (banda de luminosidade, ΔL entre passos, contraste na
// ponta clara, hue único).
const RAMP = ['#2EB2E8', '#0081BD', '#014E75', '#011933'];

export function FunnelChart({ stages }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <Card padding="lg">
      <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-4)' }}>Funil comercial</h3>
      <div className="bd-u-flex-col bd-u-gap-3">
        {stages.map((s, i) => (
          <div key={s.label}>
            <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--bd-text-body)' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--bd-text-strong)' }}>{s.value}</span>
            </div>
            <div style={{ background: 'var(--bd-surface-sunken)', borderRadius: 4, height: 16, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max(4, (s.value / max) * 100)}%`, height: '100%',
                background: RAMP[i % RAMP.length], borderRadius: 4, transition: 'width var(--bd-duration-base)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
