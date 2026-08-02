import React from 'react';

const CSS = `
.bdcard{background:var(--bd-surface-card);border:1px solid var(--bd-border-subtle);
  border-radius:var(--bd-radius-card);box-shadow:var(--bd-shadow-card);overflow:hidden;
  font-family:var(--bd-font-text);color:var(--bd-text-body);
  transition:box-shadow var(--bd-duration-base) var(--bd-ease-standard),transform var(--bd-duration-base) var(--bd-ease-out),border-color var(--bd-duration-base) var(--bd-ease-standard);}
.bdcard--interactive{cursor:pointer;}
.bdcard--interactive:hover{box-shadow:var(--bd-shadow-card-hover);transform:translateY(-4px);border-color:var(--bd-border-default);}
.bdcard--flat{box-shadow:none;}
.bdcard--navy{background:var(--bd-gradient-hero);color:var(--bd-text-inverse);border-color:transparent;}
.bdcard--azure{background:var(--bd-gradient-azure);color:var(--bd-text-inverse);border-color:transparent;}
.bdcard__media{display:block;width:100%;object-fit:cover;}
.bdcard__body{padding:var(--bd-space-6);}
.bdcard__pad-lg .bdcard__body{padding:var(--bd-space-8);}
.bdcard__eyebrow{font-size:var(--bd-text-overline);letter-spacing:var(--bd-tracking-wider);text-transform:uppercase;font-weight:var(--bd-weight-semibold);color:var(--bd-primary-600);margin-bottom:var(--bd-space-2);}
.bdcard--navy .bdcard__eyebrow,.bdcard--azure .bdcard__eyebrow{color:var(--bd-accent-300);}
.bdcard__title{font-family:var(--bd-font-display);font-weight:var(--bd-weight-bold);font-size:var(--bd-text-h4);line-height:var(--bd-leading-snug);color:inherit;margin:0 0 var(--bd-space-2);}
.bdcard--navy .bdcard__title,.bdcard--azure .bdcard__title{color:#fff;}
.bdcard__text{font-size:var(--bd-text-body);color:inherit;opacity:.92;margin:0;}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-card-css')) {
  const s = document.createElement('style'); s.id = 'bd-card-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Surface container. Slot anything into children, or use the
 * eyebrow/title/text/media convenience props for the common feature card.
 */
export function Card({
  variant = 'default',   // default | navy | azure
  interactive = false,
  flat = false,
  padding = 'md',        // md | lg
  media,                 // image src
  mediaAlt = '',
  eyebrow, title, text,
  footer,
  className = '', children, ...rest
}) {
  const cls = [
    'bdcard', `bdcard--${variant}`,
    interactive ? 'bdcard--interactive' : '',
    flat ? 'bdcard--flat' : '',
    padding === 'lg' ? 'bdcard__pad-lg' : '',
    className,
  ].filter(Boolean).join(' ');
  const hasConvenience = eyebrow || title || text || footer;
  return (
    <div className={cls} {...rest}>
      {media && <img className="bdcard__media" src={media} alt={mediaAlt} />}
      {hasConvenience ? (
        <div className="bdcard__body">
          {eyebrow && <div className="bdcard__eyebrow">{eyebrow}</div>}
          {title && <h3 className="bdcard__title">{title}</h3>}
          {text && <p className="bdcard__text">{text}</p>}
          {children}
          {footer && <div style={{ marginTop: 'var(--bd-space-5)' }}>{footer}</div>}
        </div>
      ) : children}
    </div>
  );
}
