import { pickType } from '../problem';
import type { Rng } from '../rng';
import type { Difficulty, Generator } from '../types';
import { arithProblem } from './arith';

export type WordForm = 'add-to' | 'take-from' | 'put-together';

/** Scenes per story type. Each has a speech key and picture in the animal theme. */
export const WORD_SCENES: Record<WordForm, string[]> = {
  'add-to': ['ducks', 'bunnies', 'birds'],
  'take-from': ['frogs', 'fish', 'squirrels'],
  'put-together': ['cats-dogs', 'hens-chicks', 'red-blue-butterflies'],
};

const LIMIT: Record<Difficulty, number> = { 1: 5, 2: 10, 3: 10, 4: 20, 5: 20 };

function numbers(rng: Rng, form: WordForm, difficulty: Difficulty): { a: number; b: number } {
  const limit = LIMIT[difficulty];
  if (form === 'take-from') {
    const a = rng.int(difficulty >= 4 ? 11 : 2, limit);
    return { a, b: rng.int(1, a - 1) };
  }
  if (difficulty === 4) {
    // Crosses 10.
    const a = rng.int(5, 10);
    return { a, b: rng.int(11 - a, 10) };
  }
  const a = rng.int(1, limit - 1);
  return { a, b: rng.int(1, limit - a) };
}

export const wordProblems: Generator = (rng, difficulty) => {
  const form = rng.pick(['add-to', 'take-from', 'put-together'] as const);
  const scene = rng.pick(WORD_SCENES[form]);
  const { a, b } = numbers(rng, form, difficulty);
  const problem = arithProblem(rng, {
    skillId: '1.word-problems',
    difficulty,
    op: form === 'take-from' ? 'sub' : 'add',
    a,
    b,
    type: pickType(rng, ['multiple-choice', 'number-pad']),
    max: 20,
    hint: { visual: 'counters', params: { a, b } },
    speech: { key: `q.word.${form}.${scene}`, params: { a, b } },
  });
  return { ...problem, picture: { scene, counts: [a, b] } };
};
