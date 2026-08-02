import React from 'react';

const CSS = `
.bdstep{display:flex;font-family:var(--bd-font-text);gap:0;}
.bdstep--vertical{flex-direction:column;}
.bdstep__item{display:flex;align-items:flex-start;gap:14px;flex:1;position:relative;}
.bdstep--horizontal .bdstep__item{flex-direction:column;align-items:center;text-align:center;}
.bdstep__node{flex:0 0 auto;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:var(--bd-font-display);font-weight:var(--bd-weight-bold);font-size:var(--bd-text-h5);
  background:var(--bd-surface-card);border:2px solid var(--bd-border-strong);color:var(--bd-text-muted);
  transition:var(--bd-transition-colors);z-index:1;}
.bdstep__item[data-state="active"] .bdstep__node{background:var(--bd-gradient-cta);border-color:transparent;color:#fff;box-shadow:var(--bd-glow-soft);}
.bdstep__item[data-state="done"] .bdstep__node{background:var(--bd-navy-900);border-color:transparent;color:#fff;}
.bdstep__line{flex:1;height:2px;background:var(--bd-border-default);margin:21px 8px 0;}
.bdstep--vertical .bdstep__line{width:2px;height:auto;min-height:28px;margin:6px 0 6px 21px;}
.bdstep__item[data-state="done"] ~ .bdstep__sep,.bdstep__item[data-state="done"] .bdstep__line{background:var(--bd-navy-900);}
.bdstep__label{font-weight:var(--bd-weight-semibold);color:var(--bd-text-strong);font-size:var(--bd-text-body);}
.bdstep__desc{font-size:var(--bd-text-body-sm);color:var(--bd-text-muted);margin-top:2px;}
.bdstep--horizontal .bdstep__body{margin-top:10px;}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-step-css')) {
  const s = document.createElement('style'); s.id = 'bd-step-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

const Check = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;

/** Numbered progress steps ("Passo a passo"). `steps` = [{label, description}]. */
export function Stepper({ steps = [], current = 0, orientation = 'horizontal', className = '' }) {
  return (
    <div className={`bdstep bdstep--${orientation} ${className}`}>
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo';
        return (
          <React.Fragment key={i}>
            <div className="bdstep__item" data-state={state}>
              <div className="bdstep__node">{state === 'done' ? <Check/> : i + 1}</div>
              <div className="bdstep__body">
                <div className="bdstep__label">{s.label}</div>
                {s.description && <div className="bdstep__desc">{s.description}</div>}
              </div>
            </div>
            {i < steps.length - 1 && <div className="bdstep__line" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
