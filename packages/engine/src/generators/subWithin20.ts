import { arithCandidates } from '../distractors';
import { subFactId } from '../facts';
import { numericChoices } from '../problem';
import type { Difficulty, Generator, Problem, QuestionType } from '../types';
import { arithProblem, pairs } from './arith';

const SKILL = '1.sub-within-20';
const TYPES: QuestionType[] = ['number-pad', 'multiple-choice', 'number-line'];
const HINT = { visual: 'double-ten-frame' } as const;

const POOLS: Record<1 | 2 | 3 | 5, { a: number; b: number }[]> = {
  // No crossing: 15 - 2.
  1: pairs(19, (a, b) => a >= 11 && b >= 1 && b <= a % 10),
  // Down to the tens or takes away 10: 14 - 4, 14 - 10.
  2: pairs(19, (a, b) => a >= 11 && (b === 10 || b === a % 10)),
  // Decompose through 10: 13 - 4 is 13 - 3 - 1.
  3: pairs(18, (a, b) => a >= 11 && b <= 9 && b > a % 10),
  5: pairs(20, (a, b) => b <= a),
};

const unknownAddend: Generator = (rng, difficulty) => {
  const whole = rng.int(11, 20);
  const known = rng.int(whole - 10, 10);
  const answer = whole - known;
  const type: QuestionType = rng.pick(['number-pad', 'multiple-choice']);
  const problem: Problem = {
    skillId: SKILL,
    questionType: type,
    difficulty,
    operands: { kind: 'missing-addend', whole, known },
    answer: String(answer),
    speech: { key: 'q.unknown-addend', params: { known, whole } },
    hint: HINT,
  };
  const factId = subFactId(whole, known);
  if (factId) problem.factId = factId;
  if (type === 'multiple-choice') {
    problem.choices = numericChoices(rng, answer, arithCandidates('sub', whole, known), {
      max: 20,
    });
  }
  return problem;
};

const subtraction: Generator = (rng, difficulty) => {
  const { a, b } = rng.pick(POOLS[difficulty === 4 ? 3 : (difficulty as 1 | 2 | 3 | 5)]);
  return arithProblem(rng, {
    skillId: SKILL,
    difficulty,
    op: 'sub',
    a,
    b,
    type: rng.pick(TYPES),
    max: 20,
    factId: subFactId(a, b),
    hint: HINT,
  });
};

export const subWithin20: Generator = (rng, difficulty) => {
  if (difficulty === 4) return unknownAddend(rng, difficulty);
  if (difficulty === 5 && rng.int(1, 3) === 1) return unknownAddend(rng, difficulty);
  return subtraction(rng, difficulty);
};
