import { numberProblem, pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator, Operands, StepOp } from '../types';

const TOP: Record<Difficulty, number> = { 1: 4, 2: 5, 3: 6, 4: 8, 5: 10 };

interface Story {
  story: string;
  first: StepOp;
  second: StepOp;
  numbers: (rng: Rng, top: number) => { a: number; b: number; c: number };
}

export const FOUR_OP_STORIES: Story[] = [
  {
    story: 'apple-bags',
    first: 'mul',
    second: 'sub',
    numbers: (rng, top) => {
      const a = rng.int(2, top);
      const b = rng.int(2, top);
      return { a, b, c: rng.int(1, a * b - 1) };
    },
  },
  {
    story: 'egg-boxes',
    first: 'mul',
    second: 'add',
    numbers: (rng, top) => ({ a: rng.int(2, top), b: rng.int(2, top), c: rng.int(1, 9) }),
  },
  {
    story: 'share-cookies',
    first: 'add',
    second: 'div',
    numbers: (rng, top) => {
      const c = rng.int(2, top);
      const total = c * rng.int(2, top);
      const a = rng.int(1, total - 1);
      return { a, b: total - a, c };
    },
  },
  {
    story: 'team-seats',
    first: 'sub',
    second: 'div',
    numbers: (rng, top) => {
      const c = rng.int(2, top);
      const left = c * rng.int(2, top);
      const b = rng.int(1, 9);
      return { a: left + b, b, c };
    },
  },
];

const apply = (x: number, op: StepOp, y: number) =>
  op === 'add' ? x + y : op === 'sub' ? x - y : op === 'mul' ? x * y : x / y;

export const wordProblems4Ops: Generator = (rng, difficulty) => {
  const { story, first, second, numbers } = rng.pick(FOUR_OP_STORIES);
  const { a, b, c } = numbers(rng, TOP[difficulty]);
  const middle = apply(a, first, b);
  const answer = apply(middle, second, c);
  const operands: Operands = { kind: 'two-step', a, b, c, first, second };
  return numberProblem(rng, {
    skillId: '3.word-problems-4ops',
    difficulty,
    operands,
    answer,
    max: 120,
    speech: { key: `q.word4.${story}`, params: { a, b, c } },
    hint: { visual: 'steps' },
    picture: { scene: story, counts: [a, b, c] },
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    candidates: [
      { value: middle, errorType: 'other' },
      { value: answer + c, errorType: 'other' },
      { value: answer + 1, errorType: 'off-by-one' },
    ],
  });
};
