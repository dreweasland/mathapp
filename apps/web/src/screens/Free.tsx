import { ALL_SKILLS, render } from '@mathapp/content';
import { blitzSkills, practiceSkills } from '@mathapp/engine';
import { SKILL_ICON } from '../game/art';
import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { MyMascot } from '../ui/MyMascot';
import { PlaceFrame } from '../ui/PlaceFrame';

/** Two games, one screen: tap a picture and it starts. Lightning tiles are the timed game. */
export function Free() {
  const { actions, use } = useGame();
  const states = use((s) => s.progress?.states) ?? {};
  const blitz = blitzSkills(ALL_SKILLS, states);
  const practice = practiceSkills(ALL_SKILLS, states);
  return (
    <PlaceFrame title="Free play">
      <div className="mx-auto flex max-w-md flex-col gap-3" data-testid="free">
        {blitz.length > 0 && (
          <section
            className="grid grid-cols-3 gap-2"
            aria-label="Fact Blitz"
            data-testid="blitz-tiles"
          >
            {blitz.map((skill) => (
              <button
                key={skill.id}
                type="button"
                aria-label={`blitz ${render(skill.speechKey)}`}
                className="tap tap-primary aspect-square flex-col text-3xl"
                onClick={() => actions.startBlitz(skill.id)}
              >
                <span aria-hidden="true">⚡{SKILL_ICON[skill.id]}</span>
                {(states[skill.id]?.blitzBest ?? 0) > 0 && (
                  <span className="text-base font-extrabold">⭐ {states[skill.id]?.blitzBest}</span>
                )}
              </button>
            ))}
          </section>
        )}
        <section
          className="grid grid-cols-3 gap-2"
          aria-label="Practice"
          data-testid="practice-tiles"
        >
          {practice.map((skill) => (
            <button
              key={skill.id}
              type="button"
              aria-label={`practice ${render(skill.speechKey)}`}
              className="tap aspect-square text-4xl"
              onClick={() => actions.startPractice(skill.id)}
            >
              <span aria-hidden="true">{SKILL_ICON[skill.id]}</span>
            </button>
          ))}
        </section>
      </div>
    </PlaceFrame>
  );
}

/** Free play ends quietly. The big moments stay with the Daily Quest. */
export function FreeDone() {
  const { actions, use } = useGame();
  const result = use((s) => s.freeResult);
  return (
    <main className="screen items-center justify-center gap-5 text-center" data-testid="free-done">
      <h1 className="sr-only">Free play finished</h1>
      <MyMascot mood="cheer" size={120} />
      {result?.score !== undefined && (
        <p className="text-5xl font-extrabold" data-testid="blitz-score">
          {result.isBest ? '⭐' : '✓'} {result.score}
        </p>
      )}
      {result?.best !== undefined && !result.isBest && (
        <p className="text-2xl font-extrabold" data-testid="blitz-best">
          ⭐ {result.best}
        </p>
      )}
      <p className="text-4xl font-extrabold" data-testid="free-coins">
        🪙 +{result?.coins ?? 0}
      </p>
      <BigButton label="home" className="w-full max-w-md text-6xl" onClick={actions.goHome}>
        🏠
      </BigButton>
    </main>
  );
}
