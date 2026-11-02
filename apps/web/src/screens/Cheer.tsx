import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { MyMascot } from '../ui/MyMascot';

/** A grown-up's message, before the next quest. Tap the picture to hear it again. */
export function Cheer() {
  const { actions, use } = useGame();
  const cheer = use((s) => s.cheer);
  return (
    <main
      className="screen items-center justify-center gap-6 text-center"
      data-testid="cheer"
      data-kind={cheer?.audio ? 'voice' : 'emoji'}
    >
      <MyMascot mood="cheer" size={120} />
      <button
        type="button"
        aria-label="hear it again"
        className="tap min-h-40 w-full max-w-md text-8xl"
        onClick={actions.playCheer}
      >
        <span className="pop">{cheer?.emoji ?? '💬'}</span>
      </button>
      <BigButton label="next" className="w-full max-w-md" onClick={actions.finishCheer}>
        ➜
      </BigButton>
    </main>
  );
}
