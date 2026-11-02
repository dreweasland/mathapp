import { pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator } from '../types';
import { arithProblem } from './arith';

function numbers(rng: Rng, difficulty: Difficulty): { a: number; b: number } {
  switch (difficulty) {
    case 1: {
      // No regrouping yet.
      const ta = rng.int(2, 9);
      const oa = rng.int(0, 9);
      return { a: ta * 10 + oa, b: rng.int(1, ta - 1) * 10 + rng.int(0, oa) };
    }
    case 2: {
      // Minus one digit, crossing a ten.
      const oa = rng.int(0, 8);
      return { a: rng.int(2, 9) * 10 + oa, b: rng.int(oa + 1, 9) };
    }
    case 3: {
      const ta = rng.int(3, 9);
      const oa = rng.int(0, 8);
      return { a: ta * 10 + oa, b: rng.int(1, ta - 2) * 10 + rng.int(oa + 1, 9) };
    }
    case 4: {
      // Taking from a whole ten: 40 − 17.
      const ta = rng.int(3, 9);
      return { a: ta * 10, b: rng.int(1, ta - 1) * 10 + rng.int(1, 9) };
    }
    case 5: {
      const a = rng.int(20, 100);
      return { a, b: rng.int(10, a) };
    }
  }
}

export const subWithin100: Generator = (rng, difficulty) => {
  const { a, b } = numbers(rng, difficulty);
  return arithProblem(rng, {
    skillId: '2.sub-within-100',
    difficulty,
    op: 'sub',
    a,
    b,
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 100,
    hint: { visual: 'place-chart', params: { a, b, op: 'sub' } },
  });
};
