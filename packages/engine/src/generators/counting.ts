import { numericChoices } from '../problem';
import type { Candidate } from '../distractors';
import type { Difficulty, Generator, Problem, QuestionType } from '../types';

const SKILL = '1.counting';
const TOP: Record<Difficulty, number> = { 1: 20, 2: 40, 3: 80, 4: 100, 5: 120 };
const SEQUENCE_TYPES: QuestionType[] = ['number-pad', 'multiple-choice', 'number-line'];

export const counting: Generator = (rng, difficulty) => {
  const top = TOP[difficulty];
  if (rng.int(1, 4) === 1) {
    const value = rng.int(1, top);
    const swapped = (value % 10) * 10 + Math.floor(value / 10);
    const candidates: Candidate[] = [
      { value: swapped, errorType: 'digit-swap' },
      { value: value + 10, errorType: 'place-value' },
      { value: value - 10, errorType: 'place-value' },
    ];
    return {
      skillId: SKILL,
      questionType: 'multiple-choice',
      difficulty,
      operands: { kind: 'numeral', value },
      answer: String(value),
      choices: numericChoices(rng, value, candidates, { max: 120, min: 0 }),
      speech: { key: 'q.find-number', params: { n: value } },
      hint: { visual: 'number-line', params: { n: value } },
    };
  }

  const step = rng.pick([1, -1] as const);
  // Stay inside 0–120 at both ends: no "after 120" and no "before 0".
  const from = step === 1 ? rng.int(0, top - 1) : rng.int(1, top);
  const answer = from + step;
  const type = rng.pick(SEQUENCE_TYPES);
  const problem: Problem = {
    skillId: SKILL,
    questionType: type,
    difficulty,
    operands: { kind: 'sequence', from, step },
    answer: String(answer),
    speech: { key: step === 1 ? 'q.next' : 'q.previous', params: { n: from } },
    hint: { visual: 'number-line', params: { n: from } },
  };
  if (type === 'multiple-choice') {
    problem.choices = numericChoices(
      rng,
      answer,
      [
        { value: from, errorType: 'off-by-one' },
        { value: from - step, errorType: 'reversed-operation' },
        { value: answer + step, errorType: 'off-by-one' },
      ],
      { max: 120 },
    );
  }
  if (type === 'number-line') {
    const min = Math.min(Math.max(0, answer - rng.int(2, 8)), 110);
    problem.numberLine = { min, max: min + 10 };
  }
  return problem;
};
