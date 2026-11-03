import { numberProblem, pickType } from '../problem';
import type { Difficulty, Generator } from '../types';

const SKILL = '3.div-concept';
const TYPES = ['number-pad', 'multiple-choice'] as const;
const TOP: Record<Difficulty, number> = { 1: 4, 2: 5, 3: 6, 4: 8, 5: 10 };

export const divConcept: Generator = (rng, difficulty) => {
  const top = TOP[difficulty];
  const parts = rng.int(2, top);
  const each = rng.int(1, top);
  const total = parts * each;
  const form = rng.pick(['each', 'groups', 'unknown'] as const);
  const candidates = [
    { value: total - parts, errorType: 'reversed-operation' as const },
    { value: parts, errorType: 'other' as const },
    { value: each + 1, errorType: 'off-by-one' as const },
  ];
  const hint = { visual: 'groups', params: { groups: parts, each } } as const;
  if (form === 'unknown') {
    return numberProblem(rng, {
      skillId: SKILL,
      difficulty,
      operands: { kind: 'unknown-factor', known: parts, product: total },
      answer: each,
      speech: { key: 'q.unknown-factor', params: { known: parts, product: total } },
      hint,
      type: pickType(rng, TYPES),
      max: 100,
      candidates,
    });
  }
  return numberProblem(rng, {
    skillId: SKILL,
    difficulty,
    operands: { kind: 'share', total, parts, ask: form },
    answer: each,
    speech:
      form === 'each'
        ? { key: 'q.share-each', params: { total, parts } }
        : { key: 'q.share-groups', params: { total, each: parts } },
    hint,
    type: pickType(rng, TYPES),
    max: 100,
    candidates,
  });
};
