import type { ReactNode } from 'react';
import { useGame } from '../game/GameProvider';
import { BigButton } from './BigButton';

/** Every place off Home: one way back, and a scrolling page. Nothing goes deeper than this. */
export function PlaceFrame({ title, children }: { title: string; children: ReactNode }) {
  const { actions } = useGame();
  return (
    <main className="screen">
      <header className="flex items-center justify-between print:hidden">
        <BigButton label="home" tone="quiet" className="!px-3" onClick={actions.goHome}>
          🏠
        </BigButton>
        <h1 className="sr-only">{title}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>
    </main>
  );
}
