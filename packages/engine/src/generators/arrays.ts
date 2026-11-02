import { numberProblem, pickType } from '../problem';
import type { Difficulty, Generator } from '../types';

const TOP: Record<Difficulty, [number, number]> = {
  1: [2, 3],
  2: [3, 3],
  3: [3, 4],
  4: [4, 5],
  5: [5, 5],
};

/** Rows of dots counted by repeated addition: the bridge to multiplication. */
export const arrays: Generator = (rng, difficulty) => {
  const [maxRows, maxCols] = TOP[difficulty];
  const rows = rng.int(2, maxRows);
  const cols = rng.int(2, maxCols);
  return numberProblem(rng, {
    skillId: '2.arrays',
    difficulty,
    operands: { kind: 'array', rows, cols, form: 'array' },
    answer: rows * cols,
    speech: { key: 'q.array', params: { rows, cols } },
    hint: { visual: 'groups', params: { groups: rows, each: cols } },
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 30,
    candidates: [
      { value: rows + cols, errorType: 'reversed-operation' },
      { value: rows * cols + cols, errorType: 'other' },
      { value: rows * cols - cols, errorType: 'other' },
    ],
  });
};
