import { arithCandidates, type Candidate } from '../distractors';
import { numericChoices } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Hint, Problem, QuestionType, Speech } from '../types';

interface ArithInput {
  skillId: string;
  difficulty: Difficulty;
  op: 'add' | 'sub';
  a: number;
  b: number;
  type: QuestionType;
  hint: Hint;
  max: number;
  factId?: string | undefined;
  speech?: Speech;
  extraCandidates?: Candidate[];
  lineMax?: number;
}

/** Shared builder for plain `a ± b` problems. */
export function arithProblem(rng: Rng, input: ArithInput): Problem {
  const { op, a, b, type, max } = input;
  const answer = op === 'add' ? a + b : a - b;
  const problem: Problem = {
    skillId: input.skillId,
    questionType: type,
    difficulty: input.difficulty,
    operands: { kind: 'arith', op, a, b },
    answer: String(answer),
    speech: input.speech ?? { key: op === 'add' ? 'q.add' : 'q.sub', params: { a, b } },
    hint: input.hint,
  };
  if (input.factId) problem.factId = input.factId;
  if (type === 'multiple-choice') {
    const candidates = [...(input.extraCandidates ?? []), ...arithCandidates(op, a, b)];
    problem.choices = numericChoices(rng, answer, candidates, { max });
  }
  if (type === 'number-line') problem.numberLine = { min: 0, max: input.lineMax ?? max };
  return problem;
}

/** All (a, b) pairs in a range that pass a filter. */
export function pairs(
  max: number,
  keep: (a: number, b: number) => boolean,
): { a: number; b: number }[] {
  const out: { a: number; b: number }[] = [];
  for (let a = 0; a <= max; a++) {
    for (let b = 0; b <= max; b++) if (keep(a, b)) out.push({ a, b });
  }
  return out;
}
