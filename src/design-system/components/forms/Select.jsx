import React from 'react';
import { Field } from './Input.jsx';
import { injectFormCss } from './formCss.js';

/** Native select styled to the system, with custom chevron. */
export function Select({ label, hint, error, required, id, placeholder, options = [], className = '', children, ...rest }) {
  injectFormCss();
  const control = (
    <div className="bdselect-wrap">
      <select id={id} className={`bdctrl ${error ? 'bdctrl--error' : ''}`} aria-invalid={!!error} required={required} defaultValue={rest.value === undefined && rest.defaultValue === undefined ? '' : undefined} {...rest}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
        {children}
      </select>
    </div>
  );
  if (!label && !hint && !error) return control;
  return <Field label={label} htmlFor={id} required={required} hint={hint} error={error} className={className}>{control}</Field>;
}
