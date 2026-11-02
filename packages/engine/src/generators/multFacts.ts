import { FACTOR_ORDER, mulFactId } from '../facts';
import { numberProblem, pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator, Problem } from '../types';
import { multCandidates } from './multCandidates';

/** How far along the brief's order (2, 5, 10, 3, 4, 6, 7, 8, 9) each level reaches. */
export const FACTORS_BY_LEVEL: Record<Difficulty, readonly number[]> = {
  1: FACTOR_ORDER.slice(0, 2),
  2: FACTOR_ORDER.slice(0, 3),
  3: FACTOR_ORDER.slice(0, 5),
  4: FACTOR_ORDER.slice(0, 7),
  5: FACTOR_ORDER,
};

export function multFactProblem(rng: Rng, difficulty: Difficulty, x: number, y: number): Problem {
  return numberProblem(rng, {
    skillId: '3.mult-facts',
    difficulty,
    operands: { kind: 'mult', a: x, b: y },
    answer: x * y,
    speech: { key: 'q.mult', params: { a: x, b: y } },
    hint: { visual: 'groups', params: { groups: x, each: y } },
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 100,
    candidates: multCandidates(x, y),
    factId: mulFactId(x, y),
  });
}

export const multFacts: Generator = (rng, difficulty) => {
  const factor = rng.pick(FACTORS_BY_LEVEL[difficulty]);
  const other = rng.int(1, 10);
  const [x, y] = rng.int(0, 1) === 0 ? [factor, other] : [other, factor];
  return multFactProblem(rng, difficulty, x, y);
};
