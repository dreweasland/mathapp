import { addFactId } from '../facts';
import type { Difficulty, Generator, QuestionType } from '../types';
import { arithProblem, pairs } from './arith';

const TYPES: QuestionType[] = ['number-pad', 'multiple-choice', 'number-line'];

const POOLS: Record<Difficulty, { a: number; b: number }[]> = {
  // Count on by 1 or 2.
  1: pairs(18, (a, b) => a >= 5 && (b === 1 || b === 2)),
  // Count on by 3.
  2: pairs(17, (a, b) => a >= 6 && b === 3),
  // Make-10 pairs: 8 + 5 is 8 + 2 + 3.
  3: pairs(9, (a, b) => a >= 7 && a + b > 10),
  // Doubles and near doubles that cross 10.
  4: pairs(10, (a, b) => Math.abs(a - b) <= 1 && a + b > 10),
  5: pairs(19, (a, b) => a >= 1 && b >= 1 && a + b <= 20),
};

export const addWithin20: Generator = (rng, difficulty) => {
  const { a, b } = rng.pick(POOLS[difficulty]);
  return arithProblem(rng, {
    skillId: '1.add-within-20',
    difficulty,
    op: 'add',
    a,
    b,
    type: rng.pick(TYPES),
    max: 20,
    factId: addFactId(a, b),
    hint: { visual: 'double-ten-frame', params: { a, b } },
  });
};
