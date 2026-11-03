import { arithCandidates } from '../distractors';
import { numberProblem, pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator, Problem, StepOp } from '../types';
import { arithProblem } from './arith';
import { WORD_SCENES } from './wordProblems';

const SKILL = '2.word-problems-2step';
const TYPES = ['number-pad', 'multiple-choice'] as const;
const TOP: Record<Difficulty, number> = { 1: 30, 2: 60, 3: 40, 4: 70, 5: 100 };

export const TWO_STEP_STORIES: { story: string; first: StepOp; second: StepOp }[] = [
  { story: 'stickers', first: 'add', second: 'sub' },
  { story: 'marbles', first: 'sub', second: 'sub' },
  { story: 'books', first: 'add', second: 'add' },
  { story: 'bus', first: 'sub', second: 'add' },
];

function oneStep(rng: Rng, difficulty: Difficulty): Problem {
  const form = rng.pick(['add-to', 'take-from', 'put-together'] as const);
  const scene = rng.pick(WORD_SCENES[form]);
  const top = TOP[difficulty];
  const whole = rng.int(12, top);
  const b = rng.int(2, whole - 2);
  const take = form === 'take-from';
  const a = take ? whole : whole - b;
  const problem = arithProblem(rng, {
    skillId: SKILL,
    difficulty,
    op: take ? 'sub' : 'add',
    a,
    b,
    type: pickType(rng, TYPES),
    max: 100,
    hint: { visual: 'place-chart', params: { a, b, op: take ? 'sub' : 'add' } },
    speech: { key: `q.word.${form}.${scene}`, params: { a, b } },
  });
  return { ...problem, picture: { scene, counts: [a, b] } };
}

function twoStep(rng: Rng, difficulty: Difficulty): Problem {
  const { story, first, second } = rng.pick(TWO_STEP_STORIES);
  const top = TOP[difficulty];
  // Chosen so both steps stay between 0 and the top.
  const start = rng.int(10, top - 4);
  const b = first === 'add' ? rng.int(2, Math.max(2, top - start - 2)) : rng.int(2, start - 2);
  const middle = first === 'add' ? start + b : start - b;
  const c =
    second === 'add' ? rng.int(1, Math.max(1, top - middle)) : rng.int(1, Math.max(1, middle - 1));
  const answer = second === 'add' ? middle + c : middle - c;
  return numberProblem(rng, {
    skillId: SKILL,
    difficulty,
    operands: { kind: 'two-step', a: start, b, c, first, second },
    answer,
    max: 110,
    speech: { key: `q.word2.${story}`, params: { a: start, b, c } },
    hint: { visual: 'steps' },
    picture: { scene: story, counts: [start, b, c] },
    type: pickType(rng, TYPES),
    candidates: [
      // Stopping after the first step is the classic two-step mistake.
      { value: middle, errorType: 'other' },
      ...arithCandidates(second === 'add' ? 'add' : 'sub', middle, c),
    ],
  });
}

export const wordProblems2Step: Generator = (rng, difficulty) =>
  difficulty <= 2 ? oneStep(rng, difficulty) : twoStep(rng, difficulty);
