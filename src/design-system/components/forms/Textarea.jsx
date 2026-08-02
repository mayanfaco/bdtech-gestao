import React from 'react';
import { Field } from './Input.jsx';
import { injectFormCss } from './formCss.js';

/** Multi-line text input. */
export function Textarea({ label, hint, error, required, id, className = '', ...rest }) {
  injectFormCss();
  const control = (
    <textarea id={id} className={`bdctrl ${error ? 'bdctrl--error' : ''}`} aria-invalid={!!error} required={required} {...rest} />
  );
  if (!label && !hint && !error) return control;
  return <Field label={label} htmlFor={id} required={required} hint={hint} error={error} className={className}>{control}</Field>;
}
