import { numericChoices, pickType } from '../problem';
import type { Candidate } from '../distractors';
import type { Generator, Problem } from '../types';

const SKILL = '1.place-value';

export const placeValue: Generator = (rng, difficulty) => {
  let tens: number;
  let ones: number;
  let ask: 'value' | 'tens' | 'ones' = rng.pick(['value', 'tens', 'ones']);
  switch (difficulty) {
    case 1:
      [tens, ones] = [1, rng.int(0, 9)];
      break;
    case 2:
      [tens, ones] = [rng.int(2, 4), rng.int(1, 9)];
      break;
    case 3:
      [tens, ones] = [rng.int(1, 9), rng.int(1, 9)];
      break;
    case 4:
      // Zero in the ones place, the classic trap: 40 is 4 tens and 0 ones.
      [tens, ones] = [rng.int(1, 9), rng.int(1, 3) === 1 ? rng.int(1, 9) : 0];
      break;
    case 5:
      // Renaming: 2 tens and 14 ones is 34.
      [tens, ones, ask] = [rng.int(1, 8), rng.int(10, 19), 'value'];
      break;
  }
  const value = tens * 10 + ones;
  const answer = ask === 'value' ? value : ask === 'tens' ? tens : ones;
  const type = pickType(rng, ['number-pad', 'multiple-choice']);
  const problem: Problem = {
    skillId: SKILL,
    questionType: type,
    difficulty,
    operands: { kind: 'place-value', tens, ones, ask },
    answer: String(answer),
    speech:
      ask === 'value'
        ? { key: 'q.pv-value', params: { tens, ones } }
        : { key: `q.pv-${ask}`, params: { n: value } },
    hint: { visual: 'base-ten', params: { tens, ones } },
  };
  if (type === 'multiple-choice') {
    const candidates: Candidate[] =
      ask === 'value'
        ? [
            { value: tens + ones, errorType: 'place-value' },
            { value: ones * 10 + tens, errorType: 'digit-swap' },
            { value: value + 10, errorType: 'place-value' },
            { value: value - 10, errorType: 'place-value' },
          ]
        : [{ value: ask === 'tens' ? ones : tens, errorType: 'place-value' }];
    problem.choices = numericChoices(rng, answer, candidates, { max: 99 });
  }
  return problem;
};
