import { addFactId } from '../facts';
import type { Difficulty, Generator, QuestionType } from '../types';
import { arithProblem, pairs } from './arith';

const TYPES: QuestionType[] = ['number-pad', 'multiple-choice', 'number-line'];

const POOLS: Record<Difficulty, { a: number; b: number }[]> = {
  1: pairs(5, (a, b) => a + b <= 5 && Math.min(a, b) <= 2),
  2: pairs(10, (a, b) => a + b <= 10 && Math.min(a, b) <= 2),
  3: pairs(10, (a, b) => a + b <= 10 && (a === b || a + b === 10)),
  4: pairs(10, (a, b) => a + b >= 6 && a + b <= 10 && Math.min(a, b) >= 2),
  5: pairs(10, (a, b) => a + b <= 10),
};

export const addWithin10: Generator = (rng, difficulty) => {
  const { a, b } = rng.pick(POOLS[difficulty]);
  return arithProblem(rng, {
    skillId: '1.add-within-10',
    difficulty,
    op: 'add',
    a,
    b,
    type: rng.pick(TYPES),
    max: 10,
    factId: addFactId(a, b),
    hint: { visual: 'ten-frame', params: { a, b } },
  });
};
