import React from 'react';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

export function StatCard({ label, value, hint, tone }) {
  return (
    <Card padding="lg">
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--bd-text-muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 30, color: tone ?? 'var(--bd-navy-900)', marginTop: 6, lineHeight: 1 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: 'var(--bd-text-subtle)', marginTop: 6 }}>{hint}</div>}
    </Card>
  );
}
