import React from 'react';

/**
 * Circular / square icon-only button. Reuses the brand button CSS.
 */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  shape = 'circle',
  label,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const dim = { sm: 36, md: 44, lg: 54 }[size] || 44;
  const cls = ['bdbtn', `bdbtn--${variant}`, className].filter(Boolean).join(' ');
  return (
    <button
      className={cls}
      aria-label={label}
      title={label}
      disabled={disabled}
      style={{
        width: dim, height: dim, minHeight: dim, padding: 0,
        borderRadius: shape === 'circle' ? 'var(--bd-radius-circle)' : 'var(--bd-radius-md)',
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
