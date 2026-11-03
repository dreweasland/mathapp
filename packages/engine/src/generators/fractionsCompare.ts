import { numberProblem, tagged } from '../problem';
import type { Rng } from '../rng';
import type { Choice, Difficulty, Generator, Problem } from '../types';

const SKILL = '3.fractions-compare';
const DENOMINATORS = [2, 3, 4, 6, 8];

function sameDenominator(rng: Rng) {
  const d = rng.pick([3, 4, 6, 8]);
  return { an: rng.int(1, d - 1), ad: d, bn: rng.int(1, d - 1), bd: d };
}

function sameNumerator(rng: Rng) {
  const n = rng.int(1, 2);
  const options = DENOMINATORS.filter((d) => d > n);
  return { an: n, ad: rng.pick(options), bn: n, bd: rng.pick(options) };
}

function equal(rng: Rng) {
  const d = rng.pick([2, 3, 4]);
  const n = rng.int(1, d - 1);
  const scale = rng.pick([2, 3].filter((s) => d * s <= 8));
  return rng.pick([
    { an: n, ad: d, bn: n * scale, bd: d * scale },
    { an: n * scale, ad: d * scale, bn: n, bd: d },
  ]);
}

function pair(rng: Rng, difficulty: Difficulty) {
  if (difficulty === 1) return sameDenominator(rng);
  if (difficulty === 2) return sameNumerator(rng);
  return rng.pick([sameDenominator, sameNumerator, equal])(rng);
}

export const fractionsCompare: Generator = (rng, difficulty) => {
  const skip = difficulty <= 2 ? false : rng.int(1, 3) === 1;
  if (skip) {
    const { d, n, scale } = (() => {
      const base = rng.pick([2, 3, 4]);
      return {
        d: base,
        n: rng.int(1, base - 1),
        scale: rng.pick([2, 3].filter((s) => base * s <= 12)),
      };
    })();
    return numberProblem(rng, {
      skillId: SKILL,
      difficulty,
      operands: { kind: 'fraction-equal', n, d, scale },
      answer: n * scale,
      speech: { key: 'q.fraction-equal', params: { n, d, bottom: d * scale } },
      hint: { visual: 'fraction-bars', params: { n, d, scale } },
      type: 'number-pad',
    });
  }
  const { an, ad, bn, bd } = pair(rng, difficulty);
  const left = an * bd;
  const right = bn * ad;
  const form = rng.pick(['tap', 'symbol'] as const);
  const hint = { visual: 'fraction-bars', params: { an, ad, bn, bd } } as const;
  const options = (values: string[], answer: string): Choice[] =>
    tagged(
      rng,
      answer,
      values.filter((v) => v !== answer).map((value) => ({ value, errorType: 'other' })),
    );
  const speech = {
    key: form === 'tap' ? 'q.fraction-bigger' : 'q.compare-symbol-fraction',
    params: { an, ad, bn, bd },
  };
  const operands = { kind: 'fraction-compare', an, ad, bn, bd, form } as const;
  const base = { skillId: SKILL, difficulty, operands, speech, hint };
  if (form === 'tap') {
    const answer = left > right ? 'left' : left < right ? 'right' : 'same';
    const problem: Problem = {
      ...base,
      questionType: 'compare',
      answer,
      choices: options(['left', 'right', 'same'], answer),
    };
    return problem;
  }
  const answer = left > right ? '>' : left < right ? '<' : '=';
  const problem: Problem = {
    ...base,
    questionType: 'multiple-choice',
    answer,
    choices: options(['>', '<', '='], answer),
  };
  return problem;
};
