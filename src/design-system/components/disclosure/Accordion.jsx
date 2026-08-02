import React from 'react';

const CSS = `
.bdacc{font-family:var(--bd-font-text);display:flex;flex-direction:column;gap:12px;}
.bdacc__item{background:var(--bd-surface-card);border:1px solid var(--bd-border-default);
  border-radius:var(--bd-radius-md);overflow:hidden;transition:border-color var(--bd-duration-fast),box-shadow var(--bd-duration-fast);}
.bdacc__item[data-open="true"]{border-color:var(--bd-primary-300);box-shadow:var(--bd-shadow-sm);}
.bdacc__trigger{all:unset;display:flex;align-items:center;justify-content:space-between;gap:16px;
  width:100%;box-sizing:border-box;cursor:pointer;padding:var(--bd-space-5) var(--bd-space-6);
  font-weight:var(--bd-weight-semibold);color:var(--bd-text-strong);font-size:var(--bd-text-body-lg);}
.bdacc__trigger:focus-visible{outline:2px solid var(--bd-focus-ring);outline-offset:-2px;}
.bdacc__chev{flex:0 0 auto;color:var(--bd-primary-600);transition:transform var(--bd-duration-base) var(--bd-ease-out);}
.bdacc__item[data-open="true"] .bdacc__chev{transform:rotate(180deg);}
.bdacc__panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--bd-duration-base) var(--bd-ease-standard);}
.bdacc__item[data-open="true"] .bdacc__panel{grid-template-rows:1fr;}
.bdacc__panel-inner{overflow:hidden;}
.bdacc__content{padding:0 var(--bd-space-6) var(--bd-space-5);color:var(--bd-text-body);line-height:var(--bd-leading-relaxed);}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-acc-css')) {
  const s = document.createElement('style'); s.id = 'bd-acc-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/** FAQ-style disclosure list. `items` = [{question, answer}]. Single-open by default. */
export function Accordion({ items = [], allowMultiple = false, defaultOpen = [], className = '' }) {
  const [open, setOpen] = React.useState(() => new Set(defaultOpen));
  const toggle = (i) => setOpen((prev) => {
    const next = new Set(allowMultiple ? prev : []);
    if (prev.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  return (
    <div className={`bdacc ${className}`}>
      {items.map((it, i) => {
        const isOpen = open.has(i);
        return (
          <div className="bdacc__item" data-open={isOpen} key={i}>
            <button className="bdacc__trigger" aria-expanded={isOpen} onClick={() => toggle(i)}>
              <span>{it.question}</span>
              <svg className="bdacc__chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div className="bdacc__panel"><div className="bdacc__panel-inner">
              <div className="bdacc__content">{it.answer}</div>
            </div></div>
          </div>
        );
      })}
    </div>
  );
}
