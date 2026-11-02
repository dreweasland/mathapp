import { useEffect } from 'react';
import { APP_NAME } from '../config';
import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { Mascot } from '../ui/Mascot';
import { needsInstall } from './Setup';

export function Home() {
  const { actions, use } = useGame();
  const child = use((s) => s.child);
  const coins = use((s) => s.progress?.wallet.coins ?? 0);
  const streak = use((s) => s.progress?.streak.current ?? 0);
  const best = use((s) => s.progress?.streak.best ?? 0);
  const todayDone = use((s) => s.todayDone);
  const resuming = use((s) => s.run !== undefined);

  useEffect(() => actions.sayHome(), [actions]);

  return (
    <main className="screen items-center justify-between text-center">
      <header className="flex w-full items-center justify-between text-3xl font-extrabold">
        <span aria-label={child?.name}>{child?.avatar}</span>
        <span className="flex gap-4">
          <span aria-label="streak" data-testid="streak">
            🌱 {streak}
          </span>
          <span aria-label="coins" data-testid="coins">
            🪙 {coins}
          </span>
        </span>
      </header>
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-4xl font-extrabold">{APP_NAME}</h1>
        <Mascot mood={todayDone ? 'happy' : 'idle'} size={150} />
        {best > 0 && (
          <p aria-label="best streak" className="text-2xl font-bold">
            ⭐ {best}
          </p>
        )}
      </div>
      {todayDone ? (
        <div data-testid="see-you" className="pb-8 text-4xl font-extrabold">
          🌙 ✓
        </div>
      ) : (
        <BigButton
          label={resuming ? 'keep going' : 'start quest'}
          className="min-h-28 w-full max-w-md text-6xl"
          onClick={actions.startQuest}
        >
          ▶
        </BigButton>
      )}
      {needsInstall() && (
        <p className="text-sm">
          Grown-ups: add this app to the Home Screen so progress stays safe.
        </p>
      )}
    </main>
  );
}
