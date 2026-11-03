import { pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator } from '../types';
import { arithProblem } from './arith';

function numbers(rng: Rng, difficulty: Difficulty): { a: number; b: number } {
  const tensA = rng.int(1, 8);
  switch (difficulty) {
    case 1: {
      // No regrouping yet.
      const oa = rng.int(0, 8);
      return { a: tensA * 10 + oa, b: rng.int(1, 9 - tensA) * 10 + rng.int(0, 9 - oa) };
    }
    case 2: {
      // Two digits plus one, crossing a ten.
      const oa = rng.int(2, 9);
      return { a: tensA * 10 + oa, b: rng.int(10 - oa, 9) };
    }
    case 3: {
      // The carried ten counts too, so the tens may only reach 80.
      const low = rng.int(1, 7);
      const oa = rng.int(2, 9);
      return { a: low * 10 + oa, b: rng.int(1, 8 - low) * 10 + rng.int(10 - oa, 9) };
    }
    case 4: {
      // Ones that make exactly ten, the boundary case.
      const oa = rng.int(1, 9);
      return { a: tensA * 10 + oa, b: rng.int(1, 9 - tensA) * 10 + (10 - oa) };
    }
    case 5: {
      const a = rng.int(10, 90);
      return { a, b: rng.int(10, 100 - a) };
    }
  }
}

export const addWithin100: Generator = (rng, difficulty) => {
  const { a, b } = numbers(rng, difficulty);
  return arithProblem(rng, {
    skillId: '2.add-within-100',
    difficulty,
    op: 'add',
    a,
    b,
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 100,
    hint: { visual: 'place-chart', params: { a, b, op: 'add' } },
  });
};
