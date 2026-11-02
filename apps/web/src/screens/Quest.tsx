import { currentItem, currentSection } from '@mathapp/engine';
import { useGame } from '../game/GameProvider';
import { ProblemView } from '../question/ProblemView';
import { BigButton } from '../ui/BigButton';
import { MyMascot } from '../ui/MyMascot';

const ICON = { warmup: '⛽', skill: '🗺️', challenge: '⭐' } as const;

function Gauge({ done, total, icon }: { done: number; total: number; icon: string }) {
  return (
    <div
      role="progressbar"
      aria-label="progress"
      aria-valuenow={done}
      aria-valuemax={total}
      className="flex min-w-0 flex-1 items-center gap-2"
    >
      <span className="text-3xl" aria-hidden="true">
        {icon}
      </span>
      <div className="h-6 min-w-0 flex-1 overflow-hidden rounded-full border-3 border-ink bg-white">
        <div
          className="h-full rounded-full bg-sun transition-[width] duration-300"
          style={{ width: `${(done / Math.max(1, total)) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="screen items-center justify-center gap-8 text-center">{children}</main>;
}

export function Quest() {
  const { actions, use, audioOk, sayDigit } = useGame();
  const run = use((s) => s.run);
  const feedback = use((s) => s.feedback);
  const tried = use((s) => s.triedValues);
  const mood = use((s) => s.mood);
  if (!run) return null;
  const section = currentSection(run);
  const item = currentItem(run);
  const icon = section ? ICON[section.kind] : '⭐';

  if (run.stage === 'section-intro') {
    return (
      <Centered>
        <span className="pop text-8xl" aria-hidden="true">
          {icon}
        </span>
        <MyMascot mood="happy" size={130} />
        <BigButton
          label="go"
          className="min-h-28 w-full max-w-md text-6xl"
          onClick={actions.beginSection}
        >
          ▶
        </BigButton>
      </Centered>
    );
  }

  if (run.stage === 'offer-challenge') {
    return (
      <Centered>
        <span className="pop text-8xl" aria-hidden="true">
          ⭐
        </span>
        <MyMascot mood="happy" size={130} />
        <div className="flex w-full max-w-md gap-4">
          <BigButton label="yes" className="flex-1" onClick={actions.acceptChallenge}>
            ⭐ ✓
          </BigButton>
          <BigButton label="skip" tone="quiet" className="flex-1" onClick={actions.skipChallenge}>
            ⏭
          </BigButton>
        </div>
      </Centered>
    );
  }

  if (!item || !section) return null;
  const worked = run.stage === 'worked-example';
  const showAnswer = worked || feedback?.kind === 'reveal';
  const help = showAnswer ? 'reveal' : run.misses > 0 ? 'hint' : 'none';
  const correct = feedback?.kind === 'correct';

  return (
    <main className="screen" data-section={run.section} data-item={run.item} data-stage={run.stage}>
      <h1 className="sr-only">Daily quest</h1>
      <header className="flex items-center gap-2">
        <BigButton label="home" tone="quiet" className="!px-3" onClick={actions.goHome}>
          🏠
        </BigButton>
        <Gauge
          done={run.item + (run.stage === 'feedback' ? 1 : 0)}
          total={section.items.length}
          icon={icon}
        />
        <MyMascot mood={mood} size={56} />
        <BigButton label="say it again" tone="quiet" className="!px-3" onClick={actions.replay}>
          🔊
        </BigButton>
      </header>
      {correct && (
        <div data-testid="correct" className="pop text-center text-3xl font-extrabold">
          ✓ 🪙 +{feedback.coins}
        </div>
      )}
      {run.misses > 0 && !showAnswer && (
        <div data-testid="not-yet" className="sr-only">
          not yet
        </div>
      )}
      <ProblemView
        key={`${run.section}.${run.item}.${run.finalReplayed}`}
        problem={item.problem}
        audioOk={audioOk}
        onAnswer={actions.answer}
        onDigit={sayDigit}
        tried={tried}
        help={help}
        locked={run.stage !== 'answering'}
        footer={
          showAnswer ? (
            <BigButton
              label="next"
              onClick={worked ? actions.finishWorked : actions.next}
              className="w-full"
            >
              ➜
            </BigButton>
          ) : undefined
        }
      />
    </main>
  );
}
