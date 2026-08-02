import React from 'react';

const CSS = `
.bdglass{position:relative;border-radius:var(--bd-radius-lg);padding:var(--bd-space-6);
  font-family:var(--bd-font-text);overflow:hidden;
  -webkit-backdrop-filter:blur(var(--bd-glass-blur));backdrop-filter:blur(var(--bd-glass-blur));}
.bdglass--light{background:var(--bd-glass-bg);border:1px solid var(--bd-glass-border);
  box-shadow:var(--bd-glass-shadow);color:var(--bd-text-inverse);}
.bdglass--dark{background:var(--bd-glass-dark-bg);border:1px solid var(--bd-glass-dark-border);
  color:var(--bd-text-inverse);box-shadow:0 8px 32px rgba(1,25,51,.35);}
/* top highlight edge */
.bdglass::before{content:"";position:absolute;inset:0 0 auto 0;height:1px;
  background:linear-gradient(90deg,transparent,var(--bd-glass-highlight),transparent);opacity:.7;}
.bdglass__title{font-family:var(--bd-font-display);font-weight:var(--bd-weight-bold);font-size:var(--bd-text-h5);color:#fff;margin:0 0 6px;}
.bdglass__text{font-size:var(--bd-text-body-sm);color:rgba(255,255,255,.86);margin:0;line-height:var(--bd-leading-normal);}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-glass-css')) {
  const s = document.createElement('style'); s.id = 'bd-glass-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Frosted glassmorphism panel — the floating "Imparcial" / "RIA elaborado"
 * chips from the reference. Place over a photo or gradient. Two tones.
 */
export function GlassCard({ tone = 'light', title, text, className = '', children, ...rest }) {
  const cls = ['bdglass', `bdglass--${tone}`, className].filter(Boolean).join(' ');
  return (
    <div className={cls} {...rest}>
      {title && <h4 className="bdglass__title">{title}</h4>}
      {text && <p className="bdglass__text">{text}</p>}
      {children}
    </div>
  );
}
