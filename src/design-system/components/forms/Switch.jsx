import React from 'react';
import { injectFormCss } from './formCss.js';

/** Toggle switch for binary settings. */
export function Switch({ label, id, className = '', ...rest }) {
  injectFormCss();
  return (
    <label className={`bdswitch ${className}`} htmlFor={id}>
      <input type="checkbox" role="switch" id={id} {...rest} />
      <span className="bdswitch__track"><span className="bdswitch__thumb"></span></span>
      {label && <span>{label}</span>}
    </label>
  );
}
