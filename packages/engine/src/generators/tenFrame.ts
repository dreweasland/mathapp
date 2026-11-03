import { numericChoices } from '../problem';
import type { Generator, Problem, QuestionType } from '../types';

const SKILL = '1.ten-frame';
const TYPES: QuestionType[] = ['ten-frame', 'multiple-choice', 'number-pad'];

const subitize: Generator = (rng, difficulty) => {
  const value = rng.int(0, difficulty === 1 ? 5 : 10);
  const type = rng.pick(TYPES);
  const problem: Problem = {
    skillId: SKILL,
    questionType: type,
    difficulty,
    operands: { kind: 'count', value },
    answer: String(value),
    // In the tap version the child fills an empty frame; otherwise they read a filled one.
    tenFrame: { filled: type === 'ten-frame' ? 0 : value },
    speech:
      type === 'ten-frame'
        ? { key: 'q.fill-frame', params: { n: value } }
        : { key: 'q.count-dots' },
    hint: { visual: 'ten-frame', params: { filled: value } },
  };
  if (type === 'multiple-choice') {
    problem.choices = numericChoices(rng, value, [], { max: 10 });
  }
  return problem;
};

const makeTen: Generator = (rng, difficulty) => {
  const known = difficulty === 3 ? rng.int(5, 9) : rng.int(0, 10);
  const answer = 10 - known;
  const type = rng.pick(TYPES);
  const problem: Problem = {
    skillId: SKILL,
    questionType: type,
    difficulty,
    operands: { kind: 'missing-addend', whole: 10, known },
    answer: String(answer),
    tenFrame: { filled: known },
    speech: { key: 'q.make-ten', params: { n: known } },
    hint: { visual: 'ten-frame', params: { filled: known } },
  };
  if (type === 'multiple-choice') {
    problem.choices = numericChoices(rng, answer, [{ value: known, errorType: 'other' }], {
      max: 10,
    });
  }
  return problem;
};

export const tenFrame: Generator = (rng, difficulty) => {
  if (difficulty <= 2) return subitize(rng, difficulty);
  if (difficulty === 4) return rng.pick([subitize, makeTen])(rng, difficulty);
  return makeTen(rng, difficulty);
};
