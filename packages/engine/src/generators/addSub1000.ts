import { pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator } from '../types';
import { arithProblem } from './arith';

function numbers(rng: Rng, difficulty: Difficulty): { sum: number; b: number } {
  // Worked as whole + part, so subtraction can never go below zero.
  switch (difficulty) {
    case 1: {
      const x = rng.int(1, 8);
      return { sum: 100 * rng.int(x + 1, 9), b: 100 * x };
    }
    case 2: {
      const hundreds = rng.int(1, 9) * 100;
      const ones = rng.int(0, 9);
      const low = rng.int(1, 8);
      return { sum: hundreds + rng.int(low + 1, 9) * 10 + ones, b: low * 10 };
    }
    case 3: {
      const b = rng.int(1, 4) * 100 + rng.int(0, 4) * 10 + rng.int(0, 4);
      return { sum: b + rng.int(1, 4) * 100 + rng.int(0, 5) * 10 + rng.int(0, 5), b };
    }
    case 4: {
      // One regroup: the ones cross ten.
      const b = rng.int(1, 3) * 100 + rng.int(1, 3) * 10 + rng.int(5, 9);
      return { sum: b + rng.int(1, 3) * 100 + rng.int(1, 3) * 10 + rng.int(5, 9), b };
    }
    case 5: {
      const sum = rng.int(200, 1000);
      return { sum, b: rng.int(100, sum - 1) };
    }
  }
}

function build(rng: Rng, difficulty: Difficulty, skillId: string) {
  const { sum, b } = numbers(rng, difficulty);
  const op = rng.pick(['add', 'sub'] as const);
  const [x, y] = op === 'add' ? [sum - b, b] : [sum, b];
  return arithProblem(rng, {
    skillId,
    difficulty,
    op,
    a: x,
    b: y,
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 1000,
    hint: { visual: 'place-chart', params: { a: x, b: y, op } },
  });
}

export const addSub1000: Generator = (rng, difficulty) => build(rng, difficulty, '2.add-sub-1000');

/** Grade 3 is the same math held to a faster bar, starting further along. */
export const addSub1000Fluent: Generator = (rng, difficulty) => ({
  ...build(rng, Math.max(difficulty, 3) as Difficulty, '3.add-sub-1000'),
  difficulty,
});
