import type { Rng } from '../rng';
import { tagged } from '../problem';
import type { Choice, Difficulty, Generator, Problem, ShapeName } from '../types';

const SKILL = '1.shapes';

/** Sides by shape. `circle` has none and never appears in a sides question. */
export const SIDES: Partial<Record<ShapeName, number>> = {
  triangle: 3,
  square: 4,
  rectangle: 4,
  rhombus: 4,
  trapezoid: 4,
  hexagon: 6,
};

/**
 * A square IS a rectangle and a rhombus, and with the inclusive definition those are all
 * trapezoids. So a wrong option must not be something that also fits the name asked for.
 */
const ALSO_FITS: Partial<Record<ShapeName, ShapeName[]>> = {
  rectangle: ['square'],
  rhombus: ['square'],
  trapezoid: ['square', 'rectangle', 'rhombus'],
};

const SHAPES_BY_LEVEL: Record<Difficulty, ShapeName[]> = {
  1: ['circle', 'square', 'triangle'],
  2: ['circle', 'square', 'triangle', 'rectangle'],
  3: ['circle', 'square', 'triangle', 'rectangle', 'hexagon', 'trapezoid', 'rhombus'],
  4: ['circle', 'square', 'triangle', 'rectangle', 'hexagon', 'trapezoid', 'rhombus'],
  5: ['circle', 'square', 'triangle', 'rectangle', 'hexagon', 'trapezoid', 'rhombus'],
};

function nameIt(rng: Rng, difficulty: Difficulty): Problem {
  const pool = SHAPES_BY_LEVEL[difficulty];
  const shape = rng.pick(pool);
  const excluded = new Set<ShapeName>([shape, ...(ALSO_FITS[shape] ?? [])]);
  const wrong = rng
    .shuffle(pool.filter((s) => !excluded.has(s)))
    .slice(0, 3)
    .map((value): Choice => ({ value, errorType: 'other' }));
  return {
    skillId: SKILL,
    questionType: 'multiple-choice',
    difficulty,
    operands: { kind: 'shape-name', shape },
    answer: shape,
    choices: tagged(rng, shape, wrong),
    speech: { key: 'q.shape-name', params: { shape } },
    hint: { visual: 'shape', params: { shape } },
  };
}

function sides(rng: Rng, difficulty: Difficulty): Problem {
  const shape = rng.pick(SHAPES_BY_LEVEL[difficulty].filter((s) => s !== 'circle'));
  return {
    skillId: SKILL,
    questionType: 'number-pad',
    difficulty,
    operands: { kind: 'shape-sides', shape },
    answer: String(SIDES[shape]),
    speech: { key: 'q.shape-sides', params: { shape } },
    hint: { visual: 'shape', params: { shape, trace: 1 } },
  };
}

function shares(rng: Rng, difficulty: Difficulty): Problem {
  const parts = difficulty === 4 ? 2 : rng.pick([2, 4] as const);
  const shape = rng.pick(['circle', 'square', 'rectangle'] as const);
  const answer = `${shape}:${parts}:equal`;
  const otherParts = parts === 2 ? 4 : 2;
  return {
    skillId: SKILL,
    questionType: 'multiple-choice',
    difficulty,
    operands: { kind: 'shares', shape, parts },
    answer,
    choices: tagged(rng, answer, [
      { value: `${shape}:${parts}:unequal`, errorType: 'other' },
      { value: `${shape}:${otherParts}:equal`, errorType: 'other' },
    ]),
    speech: { key: parts === 2 ? 'q.shares-halves' : 'q.shares-quarters' },
    hint: { visual: 'shape', params: { shape, parts } },
  };
}

export const shapes: Generator = (rng, difficulty) => {
  if (difficulty >= 4 && rng.int(1, 2) === 1) return shares(rng, difficulty);
  return rng.int(1, 3) === 1 ? sides(rng, difficulty) : nameIt(rng, difficulty);
};
