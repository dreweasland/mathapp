import { BLITZ_MS } from '@mathapp/engine';
import { useGame } from '../game/GameProvider';
import { ProblemView } from '../question/ProblemView';
import { IconButton } from '../ui/BigButton';
import { Icon } from '../ui/icons';

/** A bar that fills, with no numbers and no ticking: a game against nothing but yourself. */
export function Blitz() {
  const { actions, use, audioOk, sayDigit } = useGame();
  const blitz = use((s) => s.blitz);
  if (!blitz) return null;
  return (
    <main className="screen" data-testid="blitz">
      <h1 className="sr-only">Fact Blitz</h1>
      <header className="flex items-center gap-2">
        <IconButton icon="home" label="Home" aria-label="home" onClick={actions.goHome} />
        <Icon name="bolt" size={30} />
        <div
          className="h-6 flex-1 overflow-hidden rounded-full border-3 border-ink bg-white"
          role="img"
          aria-label="time bar"
        >
          <div
            data-testid="blitz-bar"
            className="blitz-fill h-full bg-sun"
            style={{ animationDuration: `${BLITZ_MS}ms` }}
          />
        </div>
        <span
          className="flex items-center gap-1 text-3xl font-extrabold tabular-nums"
          data-testid="blitz-live"
        >
          <Icon name="check" size={26} /> {blitz.score}
        </span>
      </header>
      <ProblemView
        key={blitz.problem.factId}
        problem={blitz.problem}
        audioOk={audioOk}
        onAnswer={actions.answerBlitz}
        onDigit={sayDigit}
      />
    </main>
  );
}
