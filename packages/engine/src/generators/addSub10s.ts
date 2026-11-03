import { pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator } from '../types';
import { arithProblem } from './arith';

const tens = (rng: Rng, low: number, high: number) => rng.int(low, high) * 10;

function operands(rng: Rng, difficulty: Difficulty): { op: 'add' | 'sub'; a: number; b: number } {
  const sub = () => {
    const a = tens(rng, 1, 10);
    return { op: 'sub' as const, a, b: tens(rng, 1, a / 10) };
  };
  const add = () => {
    const a = tens(rng, 1, 9);
    return { op: 'add' as const, a, b: tens(rng, 1, (100 - a) / 10) };
  };
  switch (difficulty) {
    case 1:
      return { op: 'add', a: tens(rng, 1, 9), b: 10 };
    case 2:
      return add();
    case 3:
      return sub();
    case 4:
      return rng.pick([add, sub])();
    case 5: {
      // A two-digit number and a multiple of 10: 34 + 20 only moves the tens digit.
      const ones = rng.int(1, 9);
      const a = tens(rng, 1, 8) + ones;
      if (rng.int(0, 1) === 0) return { op: 'add', a, b: tens(rng, 1, 9 - Math.floor(a / 10)) };
      return { op: 'sub', a, b: tens(rng, 1, Math.floor(a / 10)) };
    }
  }
}

export const addSub10s: Generator = (rng, difficulty) => {
  const { op, a, b } = operands(rng, difficulty);
  return arithProblem(rng, {
    skillId: '1.add-sub-10s',
    difficulty,
    op,
    a,
    b,
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 100,
    hint: { visual: 'base-ten', params: { a, b } },
    // Treating 30 + 20 as 30 + 2 is the common slip here.
    extraCandidates: [
      { value: op === 'add' ? a + b / 10 : a - b / 10, errorType: 'place-value' },
      { value: op === 'add' ? a + b + 10 : a - b + 10, errorType: 'place-value' },
    ],
  });
};
