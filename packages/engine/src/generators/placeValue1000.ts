import { numberProblem, pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator, Problem } from '../types';

const SKILL = '2.place-value-1000';
const TYPES = ['number-pad', 'multiple-choice'] as const;

function digits(rng: Rng, difficulty: Difficulty) {
  const hundreds = rng.int(1, 9);
  // Zeros are where place value really gets tested: 405 is not 45.
  const tens = difficulty >= 3 && rng.int(1, 3) === 1 ? 0 : rng.int(0, 9);
  const ones = difficulty >= 3 && rng.int(1, 3) === 1 ? 0 : rng.int(0, 9);
  return { hundreds, tens, ones };
}

function placeProblem(rng: Rng, difficulty: Difficulty): Problem {
  const { hundreds, tens, ones } = digits(rng, difficulty);
  const n = 100 * hundreds + 10 * tens + ones;
  const ask =
    difficulty === 1
      ? rng.pick(['hundreds', 'tens', 'ones'] as const)
      : rng.pick(['value', 'value', 'hundreds', 'tens', 'ones'] as const);
  const answer = ask === 'value' ? n : { hundreds, tens, ones }[ask];
  const swapped = 100 * ones + 10 * tens + hundreds;
  return numberProblem(rng, {
    skillId: SKILL,
    difficulty,
    operands: { kind: 'place-value-3', hundreds, tens, ones, ask },
    answer,
    max: ask === 'value' ? 999 : 9,
    speech:
      ask === 'value'
        ? { key: 'q.pv3-value', params: { hundreds, tens, ones } }
        : { key: `q.pv3-${ask}`, params: { n } },
    hint: { visual: 'place-chart', params: { a: n } },
    type: pickType(rng, TYPES),
    candidates:
      ask === 'value'
        ? [
            { value: swapped, errorType: 'digit-swap' },
            { value: hundreds * 100 + ones * 10 + tens, errorType: 'place-value' },
            { value: 10 * hundreds + tens + ones, errorType: 'place-value' },
          ]
        : [hundreds, tens, ones].map((value) => ({ value, errorType: 'place-value' as const })),
  });
}

function skipProblem(rng: Rng, difficulty: Difficulty): Problem {
  const size = difficulty <= 2 ? 10 : difficulty === 3 ? 5 : rng.pick([5, 10, 100]);
  const back = difficulty >= 4 && rng.int(1, 3) === 1;
  const multiples = Math.floor(1000 / size);
  const from = size * (back ? rng.int(1, multiples) : rng.int(0, multiples - 1));
  const step = back ? -size : size;
  return numberProblem(rng, {
    skillId: SKILL,
    difficulty,
    operands: { kind: 'skip', from, step },
    answer: from + step,
    speech: { key: back ? 'q.skip-back' : 'q.skip', params: { from, size } },
    hint: { visual: 'place-chart', params: { a: from } },
    type: pickType(rng, TYPES),
    candidates: [
      { value: from - step, errorType: 'reversed-operation' },
      { value: from + 1, errorType: 'off-by-one' },
    ],
  });
}

export const placeValue1000: Generator = (rng, difficulty) =>
  rng.int(1, 3) === 1 ? skipProblem(rng, difficulty) : placeProblem(rng, difficulty);
