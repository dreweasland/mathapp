import { useEffect } from 'react';
import { useGame } from '../game/GameProvider';
import { ProblemView } from '../question/ProblemView';
import { BigButton } from '../ui/BigButton';
import { Mascot } from '../ui/Mascot';

export function Placement() {
  const { actions, use, audioOk, sayDigit } = useGame();
  const placement = use((s) => s.placement);
  const mood = use((s) => s.mood);

  useEffect(() => actions.sayPlacementIntro(), [actions]);

  if (!placement) {
    return (
      <main className="screen items-center justify-center gap-8 text-center">
        <Mascot mood="happy" size={170} />
        <BigButton
          label="start warm-up"
          className="min-h-28 w-full max-w-md text-6xl"
          onClick={actions.startPlacement}
        >
          ▶
        </BigButton>
      </main>
    );
  }
  return (
    <main className="screen">
      <header className="flex items-center justify-between">
        <Mascot mood={mood} size={64} />
        <BigButton label="say it again" tone="quiet" onClick={actions.replay}>
          🔊
        </BigButton>
      </header>
      <ProblemView
        key={placement.asked}
        problem={placement.problem}
        audioOk={audioOk}
        onAnswer={actions.answerPlacement}
        onDigit={sayDigit}
        locked={mood === 'happy'}
      />
    </main>
  );
}
