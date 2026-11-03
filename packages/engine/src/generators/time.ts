import { tagged } from '../problem';
import type { Choice, Generator, Problem } from '../types';

const SKILL = '1.time';
const wrapHour = (h: number) => ((h + 11) % 12) + 1;
const label = (hour: number, minute: number) => `${hour}:${minute === 0 ? '00' : minute}`;

export const time: Generator = (rng, difficulty) => {
  const hour = rng.int(1, 12);
  const minute = difficulty <= 2 ? 0 : difficulty === 3 ? 30 : rng.pick([0, 30]);
  const answer = label(hour, minute);
  const nearbyHours: Choice[] = [
    { value: label(wrapHour(hour + 1), minute), errorType: 'off-by-one' },
    { value: label(wrapHour(hour - 1), minute), errorType: 'off-by-one' },
  ];
  const otherHalf: Choice = { value: label(hour, minute === 0 ? 30 : 0), errorType: 'other' };
  // Levels 1–2 are hours only, so a half-hour clock would be a skill the child hasn't met.
  const wrong = difficulty <= 2 ? nearbyHours : [otherHalf, ...nearbyHours];
  const type = rng.pick(['clock-face', 'multiple-choice'] as const);
  const base = {
    skillId: SKILL,
    difficulty,
    operands: { kind: 'clock', hour, minute },
    answer,
    hint: { visual: 'clock', params: { hour, minute } },
  } as const;
  const said = minute === 0 ? 'q.time-hour' : 'q.time-half';
  const problem: Problem =
    type === 'clock-face'
      ? {
          ...base,
          questionType: 'clock-face',
          // Three clocks for MVP, per the brief.
          choices: tagged(rng, answer, wrong.slice(0, 2)),
          speech: { key: said, params: { hour } },
        }
      : {
          ...base,
          questionType: 'multiple-choice',
          choices: tagged(rng, answer, wrong),
          speech: { key: 'q.time-read' },
        };
  return problem;
};
