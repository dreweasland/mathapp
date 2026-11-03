import { ALL_SKILLS, render } from '@mathapp/content';
import { blitzSkills, practiceSkills } from '@mathapp/engine';
import { SkillIcon } from '../game/art';
import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { BearSays } from '../ui/BearSays';
import { Icon } from '../ui/icons';
import { PlaceFrame } from '../ui/PlaceFrame';

/** Two games, one screen: tap a picture and it starts. Lightning tiles are the timed game. */
export function Free() {
  const { actions, use } = useGame();
  const states = use((s) => s.progress?.states) ?? {};
  const blitz = blitzSkills(ALL_SKILLS, states);
  const practice = practiceSkills(ALL_SKILLS, states);
  return (
    <PlaceFrame
      title="Play more"
      icon="balloon"
      hint="Just for fun, at half coins. Your plant already grew today."
    >
      <div className="mx-auto flex max-w-md flex-col gap-3" data-testid="free">
        {blitz.length > 0 && (
          <h2 className="section-label flex items-center gap-1">
            <Icon name="bolt" size={18} /> Fact Blitz · as many as you can in a minute
          </h2>
        )}
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
                className="tap tap-blitz aspect-square flex-col gap-1 px-1"
                onClick={() => actions.startBlitz(skill.id)}
              >
                <span className="flex items-center" aria-hidden="true">
                  <Icon name="bolt" size={26} />
                  <SkillIcon id={skill.id} size={36} />
                </span>
                <span aria-hidden="true" className="text-[11px] leading-tight font-extrabold">
                  {skill.kidName}
                </span>
                {(states[skill.id]?.blitzBest ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-sm font-extrabold">
                    <Icon name="star" size={16} /> {states[skill.id]?.blitzBest}
                  </span>
                )}
              </button>
            ))}
          </section>
        )}
        <h2 className="section-label mt-2">Practice · 8 problems</h2>
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
              className="tap aspect-square flex-col gap-1 px-1"
              onClick={() => actions.startPractice(skill.id)}
            >
              <SkillIcon id={skill.id} size={40} />
              <span aria-hidden="true" className="text-[11px] leading-tight font-extrabold">
                {skill.kidName}
              </span>
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
      <h1 className="text-4xl font-black">Nice practice!</h1>
      <BearSays mood="cheer" size={100} />
      <section className="card flex w-full max-w-md flex-col gap-2 text-xl font-extrabold">
        {result?.score !== undefined && (
          <p className="flex items-center gap-3" data-testid="blitz-score">
            <Icon name={result.isBest ? 'star' : 'done'} size={34} />
            <span className="flex-1 text-left">
              {result.isBest ? 'New best!' : 'Right answers'}
            </span>
            <span className="font-black">{result.score}</span>
          </p>
        )}
        {result?.best !== undefined && !result.isBest && (
          <p className="flex items-center gap-3" data-testid="blitz-best">
            <Icon name="star" size={34} />
            <span className="flex-1 text-left">Your best</span>
            <span className="font-black">{result.best}</span>
          </p>
        )}
        <p className="flex items-center gap-3" data-testid="free-coins">
          <Icon name="coin" size={34} />
          <span className="flex-1 text-left">Coins</span>
          <span className="font-black">+{result?.coins ?? 0}</span>
        </p>
      </section>
      <BigButton
        label="Home"
        aria-label="home"
        icon="home"
        className="w-full max-w-md"
        onClick={actions.goHome}
      />
    </main>
  );
}
