import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { Icon } from '../ui/icons';
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
      <h1 className="text-3xl font-black">A message for you!</h1>
      <MyMascot mood="cheer" size={120} />
      <button
        type="button"
        aria-label="hear it again"
        className="tap min-h-40 w-full max-w-md text-8xl"
        onClick={actions.playCheer}
      >
        {cheer?.emoji ? (
          <span className="pop">{cheer.emoji}</span>
        ) : (
          <span className="pop flex flex-col items-center gap-1 text-lg font-extrabold">
            <Icon name="speaker" size={72} />
            Hear it again
          </span>
        )}
      </button>
      <BigButton
        label="Next"
        aria-label="next"
        icon="arrow"
        iconAfter
        className="w-full max-w-md"
        onClick={actions.finishCheer}
      />
    </main>
  );
}
