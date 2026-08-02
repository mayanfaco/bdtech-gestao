import React from 'react';
import { injectFormCss } from './formCss.js';

/** Field wrapper: label + control slot + hint/error. Used by all form controls. */
export function Field({ label, htmlFor, required, hint, error, children, className = '' }) {
  injectFormCss();
  return (
    <div className={`bdfield ${className}`}>
      {label && (
        <label className="bdfield__label" htmlFor={htmlFor}>
          {label}{required && <span className="bdfield__req">*</span>}
        </label>
      )}
      {children}
      {error
        ? <span className="bdfield__error">{error}</span>
        : hint ? <span className="bdfield__hint">{hint}</span> : null}
    </div>
  );
}

/** Text input with optional leading/trailing icon. Handles text, email, tel, password, etc. */
export function Input({
  label, hint, error, required, id,
  leadingIcon, trailingIcon, className = '', ...rest
}) {
  injectFormCss();
  const control = (
    <input
      id={id}
      className={`bdctrl ${error ? 'bdctrl--error' : ''}`}
      aria-invalid={!!error}
      required={required}
      {...rest}
    />
  );
  const wrapped = (leadingIcon || trailingIcon) ? (
    <div className={`bdinput-wrap ${leadingIcon ? 'bdinput-wrap--lead' : ''} ${trailingIcon ? 'bdinput-wrap--trail' : ''}`}>
      {leadingIcon && <span className="bdinput-icon bdinput-icon--lead">{leadingIcon}</span>}
      {control}
      {trailingIcon && <span className="bdinput-icon bdinput-icon--trail">{trailingIcon}</span>}
    </div>
  ) : control;

  if (!label && !hint && !error) return wrapped;
  return <Field label={label} htmlFor={id} required={required} hint={hint} error={error} className={className}>{wrapped}</Field>;
}
