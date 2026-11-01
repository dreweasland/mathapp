import { pickType, tagged } from '../problem';
import type { Choice, Difficulty, Generator, Problem } from '../types';

const SKILL = '1.compare';

function numbers(rng: import('../rng').Rng, difficulty: Difficulty): [number, number] {
  // Equal pairs in every level: "=" needs regular practice too.
  if (rng.int(1, 6) === 1) {
    const n = rng.int(10, difficulty === 1 ? 30 : 99);
    return [n, n];
  }
  switch (difficulty) {
    case 1: {
      const a = rng.int(10, 25);
      return rng.pick([
        [a, a + 5 + rng.int(0, 5)],
        [a + 5 + rng.int(0, 5), a],
      ]) as [number, number];
    }
    case 2:
      return [rng.int(10, 50), rng.int(10, 50)];
    case 3: {
      const tens = rng.int(1, 9) * 10;
      return [tens + rng.int(0, 9), tens + rng.int(0, 9)];
    }
    case 4: {
      const x = rng.int(1, 8);
      const y = rng.int(x + 1, 9);
      return rng.pick([
        [x * 10 + y, y * 10 + x],
        [y * 10 + x, x * 10 + y],
      ]) as [number, number];
    }
    case 5:
      return [rng.int(10, 99), rng.int(10, 99)];
  }
}

export const compare: Generator = (rng, difficulty) => {
  const [a, b] = numbers(rng, difficulty);
  const type = pickType(rng, ['compare', 'multiple-choice']);
  const base = {
    skillId: SKILL,
    difficulty,
    hint: { visual: 'alligator', params: { a, b } },
  } as const;

  const options = (values: string[], answer: string): Choice[] =>
    tagged(
      rng,
      answer,
      values.filter((v) => v !== answer).map((value) => ({ value, errorType: 'place-value' })),
    );

  if (type === 'compare') {
    const answer = a > b ? 'left' : a < b ? 'right' : 'same';
    const problem: Problem = {
      ...base,
      questionType: 'compare',
      operands: { kind: 'compare', a, b, form: 'tap' },
      answer,
      choices: options(['left', 'right', 'same'], answer),
      speech: { key: 'q.compare-tap', params: { a, b } },
    };
    return problem;
  }
  const answer = a > b ? '>' : a < b ? '<' : '=';
  const problem: Problem = {
    ...base,
    questionType: 'multiple-choice',
    operands: { kind: 'compare', a, b, form: 'symbol' },
    answer,
    choices: options(['>', '<', '='], answer),
    speech: { key: 'q.compare-symbol', params: { a, b } },
  };
  return problem;
};
