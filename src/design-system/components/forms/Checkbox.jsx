import React from 'react';
import { injectFormCss } from './formCss.js';

const Tick = () => (
  <svg className="bdcheck__tick" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
);

/** Checkbox with label. */
export function Checkbox({ label, id, className = '', ...rest }) {
  injectFormCss();
  return (
    <label className={`bdcheck ${className}`} htmlFor={id}>
      <input type="checkbox" id={id} {...rest} />
      <span className="bdcheck__box bdcheck__box--cb"><Tick/></span>
      {label && <span>{label}</span>}
    </label>
  );
}

/** Radio with label. Group with a shared `name`. */
export function Radio({ label, id, className = '', ...rest }) {
  injectFormCss();
  return (
    <label className={`bdcheck ${className}`} htmlFor={id}>
      <input type="radio" id={id} {...rest} />
      <span className="bdcheck__box bdcheck__box--rb"></span>
      {label && <span>{label}</span>}
    </label>
  );
}
