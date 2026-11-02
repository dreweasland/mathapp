import { numberProblem, pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator } from '../types';

function number(rng: Rng, difficulty: Difficulty, to: 10 | 100): number {
  if (to === 10) {
    const top = difficulty === 1 ? 99 : 999;
    const n = rng.int(11, top);
    // The 5 boundary is the part that needs teaching, so it comes up often.
    return rng.int(1, 3) === 1 ? n - (n % 10) + 5 : n;
  }
  const n = rng.int(101, 999);
  return rng.int(1, 3) === 1 ? Math.min(n - (n % 100) + 50, 950) : n;
}

export const rounding: Generator = (rng, difficulty) => {
  const to = difficulty <= 2 ? 10 : difficulty === 3 ? 100 : rng.pick([10, 100] as const);
  const n = number(rng, difficulty, to);
  const low = n - (n % to);
  const high = low + to;
  const answer = n - low >= to / 2 ? high : low;
  return numberProblem(rng, {
    skillId: '3.round',
    difficulty,
    operands: { kind: 'round', n, to },
    answer,
    speech: { key: 'q.round', params: { n, to } },
    hint: { visual: 'round-line', params: { low, high, n } },
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    candidates: [
      { value: answer === low ? high : low, errorType: 'other' },
      { value: n, errorType: 'other' },
      { value: answer + to, errorType: 'place-value' },
    ],
  });
};
