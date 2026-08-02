import React from 'react';

const CSS = `
.bdcrumb{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:var(--bd-font-text);
  font-size:var(--bd-text-body-sm);color:var(--bd-text-muted);}
.bdcrumb a{color:var(--bd-text-muted);text-decoration:none;border-radius:4px;}
.bdcrumb a:hover{color:var(--bd-primary-600);text-decoration:underline;}
.bdcrumb__sep{color:var(--bd-text-subtle);display:flex;}
.bdcrumb__current{color:var(--bd-text-strong);font-weight:var(--bd-weight-semibold);}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-crumb-css')) {
  const s = document.createElement('style'); s.id = 'bd-crumb-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/** Breadcrumb trail. `items` = [{label, href}]; last item is the current page. */
export function Breadcrumb({ items = [], className = '' }) {
  return (
    <nav className={`bdcrumb ${className}`} aria-label="Breadcrumb">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {last
              ? <span className="bdcrumb__current" aria-current="page">{it.label}</span>
              : <a href={it.href || '#'}>{it.label}</a>}
            {!last && (
              <span className="bdcrumb__sep">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
