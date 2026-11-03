import type { ReactNode } from 'react';
import { useGame } from '../game/GameProvider';
import { IconButton } from './BigButton';
import { Icon, type IconName } from './icons';

/** Every place off Home: one way back, a title, and a scrolling page. Nothing goes deeper. */
export function PlaceFrame({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon: IconName;
  /** One short line saying what this place is for. */
  hint?: string;
  children: ReactNode;
}) {
  const { actions } = useGame();
  return (
    <main className="screen">
      <header className="flex items-center gap-3 print:hidden">
        <IconButton icon="home" label="Home" aria-label="home" onClick={actions.goHome} />
        <Icon name={icon} size={40} />
        <div className="min-w-0">
          <h1 className="text-3xl leading-tight font-black">{title}</h1>
          {hint && <p className="text-sm leading-tight font-bold text-ink-soft">{hint}</p>}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>
    </main>
  );
}
