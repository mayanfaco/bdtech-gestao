import React from 'react';

const CSS = `
.bdalert{display:flex;gap:12px;align-items:flex-start;font-family:var(--bd-font-text);
  padding:var(--bd-space-4) var(--bd-space-5);border-radius:var(--bd-radius-md);
  border:1px solid transparent;font-size:var(--bd-text-body-sm);color:var(--bd-text-body);}
.bdalert__icon{flex:0 0 auto;margin-top:1px;}
.bdalert__title{font-weight:var(--bd-weight-semibold);color:var(--bd-text-strong);margin:0 0 2px;font-size:var(--bd-text-body);}
.bdalert__body{margin:0;}
.bdalert--info{background:var(--bd-primary-50);border-color:var(--bd-primary-100);}
.bdalert--info .bdalert__icon{color:var(--bd-primary-600);}
.bdalert--success{background:var(--bd-success-50);border-color:#BCE6CC;}
.bdalert--success .bdalert__icon{color:var(--bd-success-500);}
.bdalert--warning{background:var(--bd-warning-50);border-color:#F8DCA6;}
.bdalert--warning .bdalert__icon{color:var(--bd-warning-700);}
.bdalert--danger{background:var(--bd-danger-50);border-color:#F3C2C4;}
.bdalert--danger .bdalert__icon{color:var(--bd-danger-500);}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-alert-css')) {
  const s = document.createElement('style'); s.id = 'bd-alert-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

const ICONS = {
  info:    <path d="M12 16v-4M12 8h.01M12 22a10 10 0 100-20 10 10 0 000 20z"/>,
  success: <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"/>,
  warning: <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>,
  danger:  <path d="M12 8v4M12 16h.01M12 22a10 10 0 100-20 10 10 0 000 20z"/>,
};

/** Inline contextual message. */
export function Alert({ tone = 'info', title, className = '', children, ...rest }) {
  return (
    <div className={`bdalert bdalert--${tone} ${className}`} role="status" {...rest}>
      <svg className="bdalert__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[tone]}</svg>
      <div>
        {title && <p className="bdalert__title">{title}</p>}
        <p className="bdalert__body">{children}</p>
      </div>
    </div>
  );
}
