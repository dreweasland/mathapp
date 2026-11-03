import { pickType, tagged } from '../problem';
import type { Rng } from '../rng';
import type { Choice, Difficulty, Generator, Problem } from '../types';

const SKILL = '2.compare-1000';

function numbers(rng: Rng, difficulty: Difficulty): [number, number] {
  if (rng.int(1, 6) === 1) {
    const n = rng.int(100, 999);
    return [n, n];
  }
  const hundreds = rng.int(1, 9) * 100;
  switch (difficulty) {
    case 1:
      return [hundreds + rng.int(0, 99), rng.int(1, 9) * 100 + rng.int(0, 99)];
    case 2:
      return [hundreds + rng.int(0, 99), hundreds + rng.int(0, 99)];
    case 3: {
      const tens = rng.int(0, 9) * 10;
      return [hundreds + tens + rng.int(0, 9), hundreds + tens + rng.int(0, 9)];
    }
    case 4: {
      // The bigger digit in the wrong place: 312 and 213.
      const x = rng.int(1, 8);
      const y = rng.int(x + 1, 9);
      const t = rng.int(0, 9);
      return rng.pick([
        [x * 100 + t * 10 + y, y * 100 + t * 10 + x],
        [y * 100 + t * 10 + x, x * 100 + t * 10 + y],
      ]) as [number, number];
    }
    case 5:
      return [rng.int(100, 999), rng.int(100, 999)];
  }
}

export const compare1000: Generator = (rng, difficulty) => {
  const [a, b] = numbers(rng, difficulty);
  const type = pickType(rng, ['compare', 'multiple-choice']);
  const base = {
    skillId: SKILL,
    difficulty,
    hint: { visual: 'place-chart', params: { a, b } },
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
