import React from 'react';

/* Inject component CSS once. Hover/active/focus need real CSS, so the
   design system ships these as scoped rules keyed off data-attributes. */
const CSS = `
.bdbtn{font-family:var(--bd-font-text);font-weight:var(--bd-weight-semibold);
  display:inline-flex;align-items:center;justify-content:center;gap:.5em;
  border:1px solid transparent;border-radius:var(--bd-radius-pill);cursor:pointer;
  white-space:nowrap;text-decoration:none;line-height:1;
  transition:var(--bd-transition-colors),transform var(--bd-duration-fast) var(--bd-ease-out),box-shadow var(--bd-duration-fast) var(--bd-ease-standard);}
.bdbtn:focus-visible{outline:none;box-shadow:var(--bd-ring);}
.bdbtn:active{transform:translateY(1px) scale(.99);}
.bdbtn[disabled],.bdbtn[aria-disabled="true"]{cursor:not-allowed;opacity:var(--bd-opacity-disabled);transform:none;box-shadow:none;}
/* sizes */
.bdbtn--sm{font-size:var(--bd-text-body-sm);padding:.5rem 1rem;min-height:36px;}
.bdbtn--md{font-size:var(--bd-text-button);padding:.75rem 1.5rem;min-height:44px;}
.bdbtn--lg{font-size:var(--bd-text-body-lg);padding:1rem 2rem;min-height:54px;}
/* primary */
.bdbtn--primary{background:var(--bd-gradient-cta);color:var(--bd-text-on-brand);box-shadow:var(--bd-shadow-sm);}
.bdbtn--primary:hover:not([disabled]){background:var(--bd-primary-600);box-shadow:var(--bd-glow-soft);}
/* secondary (navy) */
.bdbtn--secondary{background:var(--bd-navy-900);color:var(--bd-text-inverse);}
.bdbtn--secondary:hover:not([disabled]){background:var(--bd-navy-700);}
/* outline */
.bdbtn--outline{background:transparent;color:var(--bd-primary-600);border-color:var(--bd-primary-500);}
.bdbtn--outline:hover:not([disabled]){background:var(--bd-primary-50);}
/* ghost */
.bdbtn--ghost{background:transparent;color:var(--bd-text-strong);}
.bdbtn--ghost:hover:not([disabled]){background:var(--bd-state-hover);}
/* link */
.bdbtn--link{background:transparent;color:var(--bd-text-link);padding-left:.25rem;padding-right:.25rem;min-height:auto;border-radius:var(--bd-radius-xs);}
.bdbtn--link:hover:not([disabled]){text-decoration:underline;}
.bdbtn--block{width:100%;}
.bdbtn__spin{width:1em;height:1em;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:bdspin .6s linear infinite;}
@keyframes bdspin{to{transform:rotate(360deg)}}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-button-css')) {
  const s = document.createElement('style'); s.id = 'bd-button-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * BDTECH primary action component. Pill-shaped, azure-gradient by default.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  leadingIcon = null,
  trailingIcon = null,
  as = 'button',
  className = '',
  children,
  ...rest
}) {
  const Tag = as;
  const cls = [
    'bdbtn', `bdbtn--${variant}`, `bdbtn--${size}`,
    block ? 'bdbtn--block' : '', className,
  ].filter(Boolean).join(' ');
  const isDisabled = disabled || loading;
  return (
    <Tag
      className={cls}
      disabled={Tag === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="bdbtn__spin" aria-hidden="true" />}
      {!loading && leadingIcon}
      {children && <span>{children}</span>}
      {!loading && trailingIcon}
    </Tag>
  );
}
