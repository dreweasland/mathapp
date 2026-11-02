import { formatTime, tagged } from '../problem';
import type { Rng } from '../rng';
import type { Choice, Difficulty, Generator, Problem, Speech } from '../types';

const SKILL = '2.time-5min';
const wrapHour = (h: number) => ((h + 11) % 12) + 1;

/** Things a child does at a known time of day, so a.m. and p.m. have meaning. */
export const DAY_SCENES: { scene: string; part: 'a.m.' | 'p.m.' }[] = [
  { scene: 'breakfast', part: 'a.m.' },
  { scene: 'school-bus', part: 'a.m.' },
  { scene: 'sunrise', part: 'a.m.' },
  { scene: 'dinner', part: 'p.m.' },
  { scene: 'bedtime', part: 'p.m.' },
  { scene: 'stars', part: 'p.m.' },
];

function minutes(rng: Rng, difficulty: Difficulty): number {
  if (difficulty === 1) return rng.pick([0, 30]);
  if (difficulty === 2) return rng.pick([15, 30, 45]);
  return 5 * rng.int(0, 11);
}

export function clockChoices(hour: number, minute: number, step: number): Choice[] {
  const out: Choice[] = [
    { value: formatTime(hour, (minute + step) % 60), errorType: 'off-by-one' },
    { value: formatTime(wrapHour(hour + 1), minute), errorType: 'off-by-one' },
    { value: formatTime(wrapHour(hour - 1), minute), errorType: 'off-by-one' },
  ];
  // Reading the number the hand points at: 20 past as "3:04".
  if (minute > 0 && minute % 5 === 0) {
    out.unshift({ value: formatTime(hour, minute / 5), errorType: 'place-value' });
  }
  const answer = formatTime(hour, minute);
  return out.filter(
    (c, i) => c.value !== answer && out.findIndex((x) => x.value === c.value) === i,
  );
}

export function clockProblem(
  rng: Rng,
  skillId: string,
  difficulty: Difficulty,
  hour: number,
  minute: number,
  step: number,
): Problem {
  const answer = formatTime(hour, minute);
  const wrong = clockChoices(hour, minute, step);
  const base = {
    skillId,
    difficulty,
    operands: { kind: 'clock', hour, minute },
    answer,
    hint: { visual: 'clock', params: { hour, minute } },
  } as const;
  const said: Speech =
    minute === 0
      ? { key: 'q.time-hour', params: { hour } }
      : { key: 'q.time-past', params: { hour, minute } };
  if (rng.int(0, 1) === 0) {
    return {
      ...base,
      questionType: 'clock-face',
      choices: tagged(rng, answer, wrong.slice(0, 2)),
      speech: said,
    };
  }
  return {
    ...base,
    questionType: 'multiple-choice',
    choices: tagged(rng, answer, wrong.slice(0, 3)),
    speech: { key: 'q.time-read' },
  };
}

export const time5Min: Generator = (rng, difficulty) => {
  if (rng.int(1, 5) === 1) {
    const { scene, part } = rng.pick(DAY_SCENES);
    const problem: Problem = {
      skillId: SKILL,
      questionType: 'multiple-choice',
      difficulty,
      operands: { kind: 'am-pm', scene, part },
      answer: part,
      choices: tagged(rng, part, [
        { value: part === 'a.m.' ? 'p.m.' : 'a.m.', errorType: 'other' },
      ]),
      speech: { key: `q.ampm.${scene}` },
      hint: { visual: 'clock', params: { part } },
      picture: { scene, counts: [] },
    };
    return problem;
  }
  return clockProblem(rng, SKILL, difficulty, rng.int(1, 12), minutes(rng, difficulty), 5);
};
