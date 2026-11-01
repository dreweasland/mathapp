import { subFactId } from '../facts';
import type { Difficulty, Generator, QuestionType } from '../types';
import { arithProblem, pairs } from './arith';

const TYPES: QuestionType[] = ['number-pad', 'multiple-choice', 'number-line'];
const valid = (a: number, b: number) => b <= a;

const POOLS: Record<Difficulty, { a: number; b: number }[]> = {
  1: pairs(5, (a, b) => valid(a, b) && b <= 2),
  2: pairs(10, (a, b) => valid(a, b) && b <= 2),
  3: pairs(10, (a, b) => valid(a, b) && (a === 10 || a === 2 * b)),
  4: pairs(10, (a, b) => valid(a, b) && a >= 6 && b >= 3),
  5: pairs(10, valid),
};

export const subWithin10: Generator = (rng, difficulty) => {
  const { a, b } = rng.pick(POOLS[difficulty]);
  return arithProblem(rng, {
    skillId: '1.sub-within-10',
    difficulty,
    op: 'sub',
    a,
    b,
    type: rng.pick(TYPES),
    max: 10,
    factId: subFactId(a, b),
    hint: { visual: 'number-line', params: { from: a, back: b } },
  });
};
