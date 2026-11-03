import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'primary' | 'quiet';
}

/** Icons over words: `label` is for screen readers, and the screen speaks what to do. */
export function BigButton({ label, tone = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`tap ${tone === 'primary' ? 'tap-primary' : ''} min-h-20 px-8 text-4xl ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
