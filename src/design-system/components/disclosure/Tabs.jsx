import React from 'react';

const CSS = `
.bdtabs{font-family:var(--bd-font-text);}
.bdtabs__list{display:flex;gap:4px;border-bottom:1px solid var(--bd-border-default);position:relative;}
.bdtabs__tab{all:unset;cursor:pointer;padding:12px 18px;font-weight:var(--bd-weight-semibold);
  color:var(--bd-text-muted);font-size:var(--bd-text-body);position:relative;
  border-radius:var(--bd-radius-sm) var(--bd-radius-sm) 0 0;transition:color var(--bd-duration-fast);}
.bdtabs__tab:hover{color:var(--bd-text-strong);}
.bdtabs__tab:focus-visible{outline:2px solid var(--bd-focus-ring);outline-offset:-2px;}
.bdtabs__tab[aria-selected="true"]{color:var(--bd-primary-600);}
.bdtabs__tab[aria-selected="true"]::after{content:"";position:absolute;left:12px;right:12px;bottom:-1px;height:3px;
  background:var(--bd-gradient-accent-line);border-radius:3px 3px 0 0;}
.bdtabs__panel{padding-top:var(--bd-space-5);color:var(--bd-text-body);}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-tabs-css')) {
  const s = document.createElement('style'); s.id = 'bd-tabs-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/** Tabbed panels. `tabs` = [{label, content}]. */
export function Tabs({ tabs = [], defaultIndex = 0, className = '' }) {
  const [active, setActive] = React.useState(defaultIndex);
  return (
    <div className={`bdtabs ${className}`}>
      <div className="bdtabs__list" role="tablist">
        {tabs.map((t, i) => (
          <button key={i} role="tab" aria-selected={active === i}
            className="bdtabs__tab" onClick={() => setActive(i)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bdtabs__panel" role="tabpanel">
        {tabs[active] && tabs[active].content}
      </div>
    </div>
  );
}
