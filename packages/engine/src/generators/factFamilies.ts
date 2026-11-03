import { numericChoices, tagged } from '../problem';
import type { Difficulty, Generator, Problem, QuestionType } from '../types';
import { pairs } from './arith';

const SKILL = '1.fact-families';
const TYPES: QuestionType[] = ['number-pad', 'multiple-choice'];

const SUM_LIMIT: Record<Difficulty, number> = { 1: 5, 2: 10, 3: 10, 4: 15, 5: 20 };
const MIN_ADDEND: Record<Difficulty, number> = { 1: 1, 2: 1, 3: 2, 4: 1, 5: 1 };
const ASKS = ['flip', 'sub-a', 'sub-b'] as const;

export const factFamilies: Generator = (rng, difficulty) => {
  const pool = pairs(19, (a, b) => {
    const least = MIN_ADDEND[difficulty];
    return a !== b && a >= least && b >= least && a + b <= SUM_LIMIT[difficulty];
  });
  const { a, b } = rng.pick(pool);
  const whole = a + b;
  const base = {
    skillId: SKILL,
    difficulty,
    hint: { visual: 'bars', params: { a, b, whole } },
  } as const;

  if (rng.int(1, 4) === 1) {
    const problem: Problem = {
      ...base,
      questionType: 'multiple-choice',
      operands: { kind: 'family', a, b, ask: 'belongs' },
      answer: `${whole}-${a}=${b}`,
      speech: { key: 'q.family-belongs', params: { a, b, whole } },
      choices: tagged(rng, `${whole}-${a}=${b}`, [
        { value: `${whole}-${a}=${b + 1}`, errorType: 'off-by-one' },
        { value: `${whole}+${a}=${b}`, errorType: 'reversed-operation' },
        { value: `${whole + 1}-${b}=${a}`, errorType: 'off-by-one' },
      ]),
    };
    return problem;
  }

  const ask = rng.pick(ASKS);
  const answer = ask === 'flip' ? whole : ask === 'sub-a' ? b : a;
  const type = rng.pick(TYPES);
  const problem: Problem = {
    ...base,
    questionType: type,
    operands: { kind: 'family', a, b, ask },
    answer: String(answer),
    speech: { key: `q.family-${ask}`, params: { a, b, whole } },
  };
  if (type === 'multiple-choice') {
    const other = ask === 'flip' ? a : ask === 'sub-a' ? a : b;
    problem.choices = numericChoices(
      rng,
      answer,
      [
        { value: other, errorType: 'other' },
        { value: answer + 1, errorType: 'off-by-one' },
      ],
      { max: 20 },
    );
  }
  return problem;
};
