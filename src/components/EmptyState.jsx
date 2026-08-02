import React from 'react';

export function EmptyState({ title, text, action }) {
  return (
    <div className="bd-u-flex-col bd-u-items-center bd-u-gap-3" style={{
      padding: 'var(--bd-space-16) var(--bd-space-6)',
      textAlign: 'center',
      color: 'var(--bd-text-muted)',
    }}>
      <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 18, color: 'var(--bd-text-strong)' }}>{title}</div>
      {text && <p style={{ maxWidth: 420, margin: 0 }}>{text}</p>}
      {action}
    </div>
  );
}
