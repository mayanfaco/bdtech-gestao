import React from 'react';

const CSS = `
.bdbadge{display:inline-flex;align-items:center;gap:.4em;font-family:var(--bd-font-text);
  font-weight:var(--bd-weight-semibold);font-size:var(--bd-text-caption);line-height:1;
  padding:.35em .7em;border-radius:var(--bd-radius-pill);white-space:nowrap;}
.bdbadge--dot::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;}
.bdbadge--brand{background:var(--bd-primary-50);color:var(--bd-primary-700);}
.bdbadge--navy{background:var(--bd-navy-900);color:#fff;}
.bdbadge--success{background:var(--bd-success-50);color:var(--bd-success-700);}
.bdbadge--warning{background:var(--bd-warning-50);color:var(--bd-warning-700);}
.bdbadge--danger{background:var(--bd-danger-50);color:var(--bd-danger-700);}
.bdbadge--neutral{background:var(--bd-neutral-100);color:var(--bd-neutral-700);}
.bdbadge--solid.bdbadge--brand{background:var(--bd-primary-500);color:#fff;}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-badge-css')) {
  const s = document.createElement('style'); s.id = 'bd-badge-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/** Small status label. */
export function Badge({ tone = 'brand', solid = false, dot = false, className = '', children, ...rest }) {
  const cls = ['bdbadge', `bdbadge--${tone}`, solid ? 'bdbadge--solid' : '', dot ? 'bdbadge--dot' : '', className].filter(Boolean).join(' ');
  return <span className={cls} {...rest}>{children}</span>;
}
