import { ALL_SKILLS, render, skillsInGrade } from '@mathapp/content';
import { activeGrade, mapStatus, type MapStatus } from '@mathapp/engine';
import { useEffect, useRef } from 'react';
import { SKILL_ICON } from '../game/art';
import { useGame } from '../game/GameProvider';
import { MyMascot } from '../ui/MyMascot';
import { PlaceFrame } from '../ui/PlaceFrame';

const NODE: Record<MapStatus, string> = {
  mastered: 'bg-sun map-glow',
  passed: 'bg-leaf',
  current: 'bg-white',
  open: 'bg-white',
  locked: 'bg-[#eef0f3]',
};

const LINE: Record<MapStatus, string> = {
  mastered: 'map.earned',
  passed: 'map.earned',
  current: 'map.here',
  open: 'map.open',
  locked: 'map.next',
};

/** The skill graph as a winding path, with the bear standing on today's spot. */
export function SkillMap() {
  const { actions, use } = useGame();
  const states = use((s) => s.progress?.states) ?? {};
  const here = useRef<HTMLButtonElement>(null);
  // Open on where the child is, not at the very first skill.
  useEffect(() => here.current?.scrollIntoView?.({ block: 'center' }), []);
  return (
    <PlaceFrame title="Map">
      <ol className="relative mx-auto flex max-w-72 flex-col gap-1.5" data-testid="map">
        <span
          aria-hidden="true"
          className="absolute inset-y-8 left-1/2 -ml-1 border-l-8 border-dotted border-sun"
        />
        {skillsInGrade(activeGrade(ALL_SKILLS, states)).map((skill, i) => {
          const status = mapStatus(skill, ALL_SKILLS, states);
          return (
            <li
              key={skill.id}
              className={`relative flex items-center gap-2 ${i % 2 === 0 ? 'justify-start' : 'flex-row-reverse justify-start'}`}
            >
              <button
                type="button"
                ref={status === 'current' ? here : undefined}
                aria-label={skill.kidName}
                data-skill={skill.id}
                data-status={status}
                onClick={() =>
                  actions.say({
                    key: LINE[status],
                    params: { skill: render(skill.speechKey) },
                  })
                }
                className={`tap min-h-20 min-w-20 text-4xl ${NODE[status]}`}
              >
                <span className={status === 'locked' ? 'opacity-40 grayscale' : ''}>
                  {SKILL_ICON[skill.id]}
                </span>
                {status === 'locked' && (
                  <span aria-hidden="true" className="absolute text-xl">
                    🔒
                  </span>
                )}
              </button>
              {status === 'current' && <MyMascot size={64} />}
            </li>
          );
        })}
      </ol>
    </PlaceFrame>
  );
}
