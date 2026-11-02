import { divFactId } from '../facts';
import { numberProblem, pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator, Problem } from '../types';
import { FACTORS_BY_LEVEL } from './multFacts';

/** Tied to the multiplication order: divide by what's been learned. */
export const divFacts: Generator = (rng, difficulty) => {
  const b = rng.pick(FACTORS_BY_LEVEL[difficulty]);
  return divFactProblem(rng, difficulty, b * rng.int(1, 10), b);
};

export function divFactProblem(rng: Rng, difficulty: Difficulty, a: number, b: number): Problem {
  const quotient = a / b;
  return numberProblem(rng, {
    skillId: '3.div-facts',
    difficulty,
    operands: { kind: 'div', a, b },
    answer: quotient,
    speech: { key: 'q.div', params: { a, b } },
    hint: { visual: 'groups', params: { groups: b, each: quotient } },
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 100,
    min: 1,
    candidates: [
      { value: a - b, errorType: 'reversed-operation' },
      { value: quotient + 1, errorType: 'off-by-one' },
      { value: quotient - 1, errorType: 'off-by-one' },
      { value: b, errorType: 'other' },
    ],
    factId: divFactId(a, b),
  });
}
