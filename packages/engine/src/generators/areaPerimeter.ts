import { numberProblem, pickType } from '../problem';
import type { Difficulty, Generator } from '../types';

const TOP: Record<Difficulty, number> = { 1: 4, 2: 5, 3: 6, 4: 8, 5: 10 };

export const areaPerimeter: Generator = (rng, difficulty) => {
  const w = rng.int(2, TOP[difficulty]);
  const h = rng.int(2, Math.min(TOP[difficulty], 7));
  const ask = difficulty === 1 ? 'area' : rng.pick(['area', 'perimeter'] as const);
  const area = w * h;
  const perimeter = 2 * (w + h);
  return numberProblem(rng, {
    skillId: '3.area-perimeter',
    difficulty,
    operands: { kind: 'area', w, h, ask },
    answer: ask === 'area' ? area : perimeter,
    speech: { key: ask === 'area' ? 'q.area' : 'q.perimeter', params: { w, h } },
    hint: { visual: 'area-grid', params: { w, h, ask } },
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 100,
    min: 1,
    candidates: [
      // Mixing up the two measures is the mistake that matters.
      { value: ask === 'area' ? perimeter : area, errorType: 'reversed-operation' },
      { value: w + h, errorType: 'other' },
    ],
  });
};
