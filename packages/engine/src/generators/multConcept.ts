import { numberProblem, pickType } from '../problem';
import type { Difficulty, Generator } from '../types';
import { multCandidates } from './multCandidates';

const TOP: Record<Difficulty, number> = { 1: 3, 2: 5, 3: 6, 4: 8, 5: 10 };

/** The same product seen three ways: groups, rows, and squares in a rectangle. */
export const multConcept: Generator = (rng, difficulty) => {
  const top = TOP[difficulty];
  const rows = rng.int(2, Math.min(top, 6));
  const cols = rng.int(2, top);
  const form = rng.pick(['groups', 'array', 'area'] as const);
  return numberProblem(rng, {
    skillId: '3.mult-concept',
    difficulty,
    operands: { kind: 'array', rows, cols, form },
    answer: rows * cols,
    speech: { key: `q.mult-${form}`, params: { rows, cols } },
    hint: { visual: 'groups', params: { groups: rows, each: cols } },
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 100,
    candidates: multCandidates(rows, cols),
  });
};
