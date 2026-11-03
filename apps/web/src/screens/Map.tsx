import { ALL_SKILLS, render, skillsInGrade } from '@mathapp/content';
import { activeGrade, mapStatus, type MapStatus } from '@mathapp/engine';
import { useEffect, useRef } from 'react';
import { SkillIcon } from '../game/art';
import { useGame } from '../game/GameProvider';
import { MyMascot } from '../ui/MyMascot';
import { Icon } from '../ui/icons';
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

/** The skill graph as a path down the page, named, with the bear standing on today's spot. */
export function SkillMap() {
  const { actions, use } = useGame();
  const states = use((s) => s.progress?.states) ?? {};
  const here = useRef<HTMLButtonElement>(null);
  // Open on where the child is, not at the very first skill.
  useEffect(() => here.current?.scrollIntoView?.({ block: 'center' }), []);
  return (
    <PlaceFrame title="Map" icon="map" hint="Every skill on your path. Bo shows where you are.">
      <ol className="relative mx-auto flex max-w-md flex-col gap-2" data-testid="map">
        <span
          aria-hidden="true"
          className="absolute inset-y-8 left-10 -ml-1 border-l-8 border-dotted border-sun"
        />
        {skillsInGrade(activeGrade(ALL_SKILLS, states)).map((skill) => {
          const status = mapStatus(skill, ALL_SKILLS, states);
          return (
            <li key={skill.id} className="relative flex items-center gap-3">
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
                className={`tap min-h-20 min-w-20 shrink-0 ${NODE[status]}`}
              >
                <span className={status === 'locked' ? 'opacity-35 grayscale' : ''}>
                  <SkillIcon id={skill.id} size={48} />
                </span>
                {status === 'locked' && (
                  <span aria-hidden="true" className="absolute -right-2 -bottom-2">
                    <Icon name="lock" size={28} />
                  </span>
                )}
              </button>
              <span
                aria-hidden="true"
                className={`min-w-0 flex-1 text-lg leading-tight font-extrabold ${status === 'locked' ? 'text-ink-soft' : ''}`}
              >
                {skill.kidName}
                {status === 'current' && (
                  <span className="block text-sm text-ink-soft">You are here</span>
                )}
                {(status === 'mastered' || status === 'passed') && (
                  <span className="block text-sm text-ink-soft">Done!</span>
                )}
              </span>
              {status === 'current' && <MyMascot size={56} />}
            </li>
          );
        })}
      </ol>
    </PlaceFrame>
  );
}
