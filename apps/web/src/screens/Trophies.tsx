import { ALL_SKILLS } from '@mathapp/content';
import { activeGrade, MILESTONES } from '@mathapp/engine';
import { useState } from 'react';
import { SKILL_ICON } from '../game/art';
import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { MyMascot } from '../ui/MyMascot';
import { PlaceFrame } from '../ui/PlaceFrame';
import { Plant } from '../visuals/Plant';

function Certificate({ days, onClose }: { days: number; onClose: () => void }) {
  const { use } = useGame();
  const name = use((s) => s.child?.name);
  return (
    <main
      className="screen items-center justify-center gap-4 text-center"
      data-testid="certificate"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border-8 border-double border-ink bg-white p-6">
        <Plant days={days} size={110} />
        <p className="text-3xl font-extrabold">{name}</p>
        <p className="text-5xl font-extrabold">{days} days</p>
        <p className="text-2xl font-bold">in a row!</p>
        <MyMascot mood="cheer" size={90} />
      </div>
      <div className="flex w-full max-w-md gap-3 print:hidden">
        <BigButton label="print" className="flex-1" onClick={() => window.print()}>
          🖨️
        </BigButton>
        <BigButton label="back" tone="quiet" className="flex-1" onClick={onClose}>
          ➜
        </BigButton>
      </div>
    </main>
  );
}

/** Badges are the real achievements, so they're drawn bigger than anything in the collection. */
export function Trophies() {
  const { actions, use } = useGame();
  const states = use((s) => s.progress?.states) ?? {};
  const best = use((s) => s.progress?.streak.best ?? 0);
  const [certificate, setCertificate] = useState<number>();
  // Earlier grades stay on the wall; later ones wait until the child gets there.
  const grade = activeGrade(ALL_SKILLS, states);
  const skills = ALL_SKILLS.filter((s) => s.grade <= grade);
  if (certificate) {
    return <Certificate days={certificate} onClose={() => setCertificate(undefined)} />;
  }
  return (
    <PlaceFrame title="Trophies">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-3" data-testid="trophies">
        {skills.map((skill) => {
          const earned = states[skill.id]?.masteredAt !== undefined;
          return (
            <button
              key={skill.id}
              type="button"
              aria-label={earned ? skill.badgeName : 'badge to earn'}
              data-earned={earned}
              onClick={() =>
                actions.say(
                  earned
                    ? { key: `badge.${skill.id}` }
                    : { key: 'badge.waiting', params: { badge: skill.badgeName } },
                )
              }
              className={`tap aspect-square text-5xl ${earned ? 'tap-primary map-glow' : 'tap-used'}`}
            >
              <span className={earned ? '' : 'opacity-40 grayscale'}>{SKILL_ICON[skill.id]}</span>
            </button>
          );
        })}
      </div>
      <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2" data-testid="milestones">
        {MILESTONES.map((days) => {
          const reached = best >= days;
          return (
            <button
              key={days}
              type="button"
              aria-label={`${days} days`}
              disabled={!reached}
              onClick={() => {
                actions.say({ key: 'certificate.days', params: { days } });
                setCertificate(days);
              }}
              className={`tap text-2xl font-extrabold ${reached ? 'tap-answer' : 'tap-used'}`}
            >
              🌱 {days}
            </button>
          );
        })}
      </div>
    </PlaceFrame>
  );
}
