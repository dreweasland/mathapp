import { useEffect } from 'react';
import { useGame } from '../game/GameProvider';
import { ProblemView } from '../question/ProblemView';
import { BearSays } from '../ui/BearSays';
import { BigButton, IconButton } from '../ui/BigButton';
import { MyMascot } from '../ui/MyMascot';

export function Placement() {
  const { actions, use, audioOk, sayDigit } = useGame();
  const placement = use((s) => s.placement);
  const mood = use((s) => s.mood);

  useEffect(() => actions.sayPlacementIntro(), [actions]);

  if (!placement) {
    return (
      <main className="screen items-center justify-center gap-6 text-center">
        <h1 className="text-3xl font-black">First, a quick warm-up</h1>
        <p className="max-w-sm text-lg font-bold text-ink-soft">
          A few questions so Bo knows where to start. It's fine to not know some!
        </p>
        <BearSays mood="happy" size={120} line={{ key: 'placement.intro' }} />
        <BigButton
          label="Start"
          aria-label="start warm-up"
          icon="play"
          className="min-h-24 w-full max-w-md text-3xl"
          onClick={actions.startPlacement}
        />
      </main>
    );
  }
  return (
    <main className="screen">
      <header className="flex items-center gap-2">
        <MyMascot mood={mood} size={56} />
        <p className="section-label flex-1">Warm-up · question {placement.asked + 1}</p>
        <IconButton
          icon="speaker"
          label="Again"
          aria-label="say it again"
          onClick={actions.replay}
        />
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
