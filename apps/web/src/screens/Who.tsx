import { useGame } from '../game/GameProvider';
import { Avatar } from '../ui/Avatar';
import { BearSays } from '../ui/BearSays';
import { IconButton } from '../ui/BigButton';

/** Siblings tap their own picture. No passwords: this is a family device. */
export function Who() {
  const { actions, use } = useGame();
  const everyone = use((s) => s.everyone);
  const current = use((s) => s.child);
  const canReturn = use((s) => s.progress !== undefined) && current !== undefined;
  return (
    <main className="screen items-center justify-between text-center">
      <header className="flex w-full items-center justify-between">
        {canReturn ? (
          <IconButton
            icon="home"
            label="Home"
            aria-label="home"
            onClick={() => void actions.pick(current)}
          />
        ) : (
          <span />
        )}
        <IconButton
          icon="gear"
          label="Grown-ups"
          aria-label="grown-ups"
          className="!w-24"
          onClick={() => void actions.openParent()}
        />
      </header>
      <h1 className="text-3xl font-black">Who is playing?</h1>
      <BearSays size={90} line={{ key: 'who.pick' }} />
      <div className="flex w-full max-w-md flex-wrap justify-center gap-3" data-testid="who">
        {everyone.map((child) => (
          <button
            key={child.id}
            type="button"
            aria-label={child.name}
            className="tap min-h-28 w-40 flex-col gap-1"
            onClick={() => void actions.pick(child)}
          >
            <Avatar value={child.avatar} size={64} />
            <span className="text-lg font-extrabold">{child.name}</span>
          </button>
        ))}
      </div>
      <span />
    </main>
  );
}
