import React from 'react';

const CSS = `
.bdavatar{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;
  font-family:var(--bd-font-display);font-weight:var(--bd-weight-bold);color:#fff;
  background:var(--bd-gradient-cta);flex:0 0 auto;user-select:none;}
.bdavatar img{width:100%;height:100%;object-fit:cover;}
.bdavatar--sm{width:32px;height:32px;font-size:13px;}
.bdavatar--md{width:44px;height:44px;font-size:16px;}
.bdavatar--lg{width:64px;height:64px;font-size:22px;}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-avatar-css')) {
  const s = document.createElement('style'); s.id = 'bd-avatar-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase();
}

/** Circular user avatar — image or initials fallback. */
export function Avatar({ name = '', src, size = 'md', className = '', ...rest }) {
  return (
    <span className={`bdavatar bdavatar--${size} ${className}`} title={name} {...rest}>
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  );
}
