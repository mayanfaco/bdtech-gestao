import React from 'react';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { injectDashboardTechCss } from './dashboardTechCss.js';

injectDashboardTechCss();

const SIZE = 148;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Anel de progresso (gauge) para uma métrica percentual — o "toque tecnológico"
    ao lado dos gráficos de barra, com legenda de apoio abaixo. */
export function ConversionGauge({ title, percent, caption, stats = [] }) {
  const pct = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  return (
    <Card padding="lg" className="bd-dash-panel">
      <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-4)', color: 'var(--bd-text-strong)' }}>{title}</h3>
      <div className="bd-u-flex bd-u-items-center bd-u-gap-5" style={{ flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flex: '0 0 auto' }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="rgba(255,255,255,.10)" strokeWidth={STROKE} />
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--bd-accent-400)" strokeWidth={STROKE}
              strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset var(--bd-duration-slow, .6s) var(--bd-ease-out)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 26, color: '#fff' }}>{pct}%</span>
            {caption && <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{caption}</span>}
          </div>
        </div>
        <div className="bd-u-flex-col bd-u-gap-3" style={{ flex: 1, minWidth: 140 }}>
          {stats.map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
