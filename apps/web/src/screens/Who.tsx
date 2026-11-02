import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { Mascot } from '../ui/Mascot';

/** Siblings tap their own picture. No passwords: this is a family device. */
export function Who() {
  const { actions, use } = useGame();
  const everyone = use((s) => s.everyone);
  const current = use((s) => s.child);
  const canReturn = use((s) => s.progress !== undefined) && current !== undefined;
  return (
    <main className="screen items-center justify-between text-center">
      <h1 className="sr-only">Who is playing?</h1>
      <header className="flex w-full items-center justify-between">
        {canReturn ? (
          <BigButton
            label="home"
            tone="quiet"
            className="!min-h-16 !px-3"
            onClick={() => void actions.pick(current)}
          >
            🏠
          </BigButton>
        ) : (
          <span />
        )}
        <BigButton
          label="grown-ups"
          tone="quiet"
          className="!min-h-16 !px-3 text-3xl"
          onClick={() => void actions.openParent()}
        >
          ⚙️
        </BigButton>
      </header>
      <Mascot size={110} />
      <div className="flex w-full max-w-md flex-wrap justify-center gap-3" data-testid="who">
        {everyone.map((child) => (
          <button
            key={child.id}
            type="button"
            aria-label={child.name}
            className="tap min-h-28 w-40 flex-col gap-1 text-6xl"
            onClick={() => void actions.pick(child)}
          >
            <span aria-hidden="true">{child.avatar}</span>
            <span className="text-lg font-bold">{child.name}</span>
          </button>
        ))}
      </div>
      <span />
    </main>
  );
}
