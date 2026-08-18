import React from 'react';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { injectDashboardTechCss } from './dashboardTechCss.js';

injectDashboardTechCss();

/** Gráfico de barras horizontal para contagem por status — cor = tom semântico
    do próprio status (reservado, nunca usado pra "série 4"), sempre com o
    rótulo do status ao lado (a cor nunca carrega identidade sozinha). */
export function StatusBarChart({ title, data, toneColor }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <Card padding="lg" className="bd-dash-panel">
      <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-4)' }}>{title}</h3>
      <div className="bd-u-flex-col bd-u-gap-2">
        {data.map((d) => (
          <div key={d.label} className="bd-u-flex bd-u-items-center bd-u-gap-3">
            <span style={{ width: 120, fontSize: 12, color: 'var(--bd-text-muted)', flex: '0 0 auto' }}>{d.label}</span>
            <div style={{ flex: 1, background: 'var(--bd-surface-sunken)', borderRadius: 4, height: 14, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, height: '100%', background: toneColor(d.key), borderRadius: 4 }} />
            </div>
            <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--bd-text-strong)', flex: '0 0 auto' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
