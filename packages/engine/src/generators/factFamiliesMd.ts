import { numberProblem, pickType } from '../problem';
import type { Difficulty, Generator } from '../types';

const TOP: Record<Difficulty, number> = { 1: 5, 2: 6, 3: 7, 4: 9, 5: 10 };

export const factFamiliesMd: Generator = (rng, difficulty) => {
  const a = rng.int(2, TOP[difficulty]);
  const b = rng.int(2, TOP[difficulty]);
  const ask = rng.pick(['flip', 'div-a', 'div-b'] as const);
  const product = a * b;
  const answer = ask === 'flip' ? product : ask === 'div-a' ? b : a;
  return numberProblem(rng, {
    skillId: '3.fact-families-md',
    difficulty,
    operands: { kind: 'family-md', a, b, ask },
    answer,
    speech: { key: `q.family-md-${ask}`, params: { a, b, product } },
    hint: { visual: 'groups', params: { groups: a, each: b } },
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 100,
    min: 1,
    candidates: [
      { value: ask === 'flip' ? a + b : ask === 'div-a' ? a : b, errorType: 'other' },
      { value: answer + 1, errorType: 'off-by-one' },
    ],
  });
};
