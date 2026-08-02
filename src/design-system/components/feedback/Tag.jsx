import React from 'react';

const CSS = `
.bdtag{display:inline-flex;align-items:center;gap:.4em;font-family:var(--bd-font-text);
  font-weight:var(--bd-weight-medium);font-size:var(--bd-text-body-sm);line-height:1;
  padding:.45em .85em;border-radius:var(--bd-radius-sm);
  background:var(--bd-neutral-100);color:var(--bd-neutral-700);border:1px solid transparent;}
.bdtag--outline{background:transparent;border-color:var(--bd-border-default);}
.bdtag--brand{background:var(--bd-primary-50);color:var(--bd-primary-700);}
.bdtag__close{display:inline-flex;cursor:pointer;border:none;background:none;padding:0;margin-left:2px;
  color:currentColor;opacity:.6;border-radius:4px;}
.bdtag__close:hover{opacity:1;}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-tag-css')) {
  const s = document.createElement('style'); s.id = 'bd-tag-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/** Removable / selectable chip for filters and metadata. */
export function Tag({ tone = 'neutral', outline = false, onRemove, className = '', children, ...rest }) {
  const cls = ['bdtag', tone === 'brand' ? 'bdtag--brand' : '', outline ? 'bdtag--outline' : '', className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {children}
      {onRemove && (
        <button className="bdtag__close" aria-label="Remover" onClick={onRemove}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      )}
    </span>
  );
}
