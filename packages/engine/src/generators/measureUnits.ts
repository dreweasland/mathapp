import { numberProblem, pickType, tagged } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator, Problem } from '../types';

const SKILL = '2.measure-units';

/** Typical real sizes, rounded. These stand in for a ruler the child can't hold. */
export const OBJECT_SIZES: Record<string, { in: number; cm: number }> = {
  paperclip: { in: 1, cm: 3 },
  crayon: { in: 4, cm: 9 },
  pencil: { in: 7, cm: 18 },
  book: { in: 11, cm: 28 },
};

function measure(rng: Rng, difficulty: Difficulty): Problem {
  const unit = rng.pick(['in', 'cm'] as const);
  const length = rng.int(1, unit === 'in' ? 4 + difficulty : 5 + 2 * difficulty);
  return numberProblem(rng, {
    skillId: SKILL,
    difficulty,
    operands: { kind: 'ruler', length, unit },
    answer: length,
    max: 20,
    min: 1,
    speech: { key: unit === 'in' ? 'q.ruler-in' : 'q.ruler-cm' },
    hint: { visual: 'ruler', params: { length } },
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    candidates: [
      { value: length + 1, errorType: 'off-by-one' },
      { value: length - 1, errorType: 'off-by-one' },
    ],
  });
}

function estimate(rng: Rng, difficulty: Difficulty): Problem {
  const object = rng.pick(Object.keys(OBJECT_SIZES));
  const unit = rng.pick(['in', 'cm'] as const);
  const actual = (OBJECT_SIZES[object] as { in: number; cm: number })[unit];
  const answer = String(actual);
  // Far enough apart that this is a sense of size, not a guess between neighbors.
  const wrong = [actual * 5, actual * 20].map((value) => ({
    value: String(value),
    errorType: 'place-value' as const,
  }));
  return {
    skillId: SKILL,
    questionType: 'multiple-choice',
    difficulty,
    operands: { kind: 'estimate', object, unit, actual },
    answer,
    choices: tagged(rng, answer, wrong),
    speech: { key: unit === 'in' ? 'q.estimate-in' : 'q.estimate-cm', params: { object } },
    hint: { visual: 'ruler', params: { length: Math.min(actual, 15) } },
    picture: { scene: object, counts: [] },
  };
}

export const measureUnits: Generator = (rng: Rng, difficulty) =>
  difficulty >= 3 && rng.int(1, 3) === 1 ? estimate(rng, difficulty) : measure(rng, difficulty);
