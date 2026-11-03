import { numberProblem, tagged } from '../problem';
import type { Difficulty, Generator, Problem } from '../types';

const SKILL = '2.even-odd';
const TOP: Record<Difficulty, number> = { 1: 10, 2: 20, 3: 50, 4: 100, 5: 998 };

export const evenOdd: Generator = (rng, difficulty) => {
  const n = rng.int(1, TOP[difficulty]);
  if (rng.int(1, 3) === 1) {
    // The next even or odd number is two away: a pair at a time.
    return numberProblem(rng, {
      skillId: SKILL,
      difficulty,
      operands: { kind: 'skip', from: n, step: 2 },
      answer: n + 2,
      speech: { key: n % 2 === 0 ? 'q.next-even' : 'q.next-odd', params: { n } },
      hint: { visual: 'pairs', params: { n: Math.min(n, 30) } },
      type: 'number-pad',
    });
  }
  const answer = n % 2 === 0 ? 'even' : 'odd';
  const problem: Problem = {
    skillId: SKILL,
    questionType: 'multiple-choice',
    difficulty,
    operands: { kind: 'even-odd', n },
    answer,
    choices: tagged(rng, answer, [
      { value: answer === 'even' ? 'odd' : 'even', errorType: 'other' },
    ]),
    speech: { key: 'q.even-odd', params: { n } },
    hint: { visual: 'pairs', params: { n: Math.min(n, 30) } },
  };
  return problem;
};
