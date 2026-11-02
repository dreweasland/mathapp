import { numberProblem, tagged } from '../problem';
import type { Difficulty, Generator, Problem } from '../types';

const SKILL = '3.fractions-unit';
const DENOMINATORS: Record<Difficulty, number[]> = {
  1: [2, 4],
  2: [2, 3, 4],
  3: [3, 4, 6],
  4: [3, 4, 6, 8],
  5: [2, 3, 4, 6, 8],
};

export const fractionsUnit: Generator = (rng, difficulty) => {
  const d = rng.pick(DENOMINATORS[difficulty]);
  const form = difficulty <= 2 ? 'shape' : rng.pick(['shape', 'line'] as const);
  const hint = { visual: 'fraction-bars', params: { n: 1, d } } as const;
  if (rng.int(1, 3) === 1) {
    return numberProblem(rng, {
      skillId: SKILL,
      difficulty,
      operands: { kind: 'fraction', n: 1, d, form, ask: 'parts' },
      answer: d,
      speech: { key: form === 'line' ? 'q.fraction-line-parts' : 'q.fraction-parts' },
      hint,
      type: 'number-pad',
    });
  }
  const answer = `1/${d}`;
  const others = [2, 3, 4, 6, 8].filter((x) => x !== d);
  const wrong = rng
    .shuffle(others)
    .slice(0, 2)
    .map((x) => ({ value: `1/${x}`, errorType: 'other' as const }));
  // Counting the parts left over instead of the whole: 1/3 for a thing cut in four.
  const problem: Problem = {
    skillId: SKILL,
    questionType: 'multiple-choice',
    difficulty,
    operands: { kind: 'fraction', n: 1, d, form, ask: 'name' },
    answer,
    choices: tagged(rng, answer, wrong),
    speech: { key: form === 'line' ? 'q.fraction-line' : 'q.fraction-shape' },
    hint,
  };
  return problem;
};
