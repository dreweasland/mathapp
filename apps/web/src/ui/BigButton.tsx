import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './icons';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Shown on the button, so grown-ups and early readers can see what it does. */
  label: string;
  icon?: IconName;
  /** Icon after the words, for "next"-style buttons. */
  iconAfter?: boolean;
  tone?: 'primary' | 'quiet' | 'go';
}

const TONE = { primary: 'tap-primary', quiet: '', go: 'tap-answer' } as const;

/** Every big action: a drawn icon plus a short word. The screen also speaks what to do. */
export function BigButton({
  label,
  icon,
  iconAfter = false,
  tone = 'primary',
  className = '',
  ...rest
}: Props) {
  const picture = icon ? <Icon name={icon} size={30} /> : null;
  return (
    <button
      type="button"
      className={`tap ${TONE[tone]} min-h-18 gap-2.5 px-6 text-2xl font-black ${className}`}
      {...rest}
    >
      {!iconAfter && picture}
      <span>{label}</span>
      {iconAfter && picture}
    </button>
  );
}

/** A square header button: icon on top, one small word under it. */
export function IconButton({
  icon,
  label,
  className = '',
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`tap h-16 w-16 shrink-0 flex-col gap-0 !rounded-2xl text-[11px] leading-none font-extrabold ${className}`}
      {...rest}
    >
      <Icon name={icon} size={30} />
      <span>{label}</span>
    </button>
  );
}
