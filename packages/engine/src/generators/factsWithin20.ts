import { addFactId, allFacts, subFactId, type Fact } from '../facts';
import { pickType } from '../problem';
import type { Difficulty, Generator } from '../types';
import { arithProblem } from './arith';

const whole = (f: Fact) => (f.op === 'add' ? f.a + f.b : f.a);
const LIMITS: Record<Difficulty, [number, number]> = {
  1: [0, 10],
  2: [8, 14],
  3: [11, 14],
  4: [15, 20],
  5: [0, 20],
};
const FACTS = allFacts().filter((f) => f.op === 'add' || f.op === 'sub');

/** From memory now: the same cards as Grade 1, with no number line to lean on. */
export const factsWithin20: Generator = (rng, difficulty) => {
  const [low, high] = LIMITS[difficulty];
  const fact = rng.pick(FACTS.filter((f) => whole(f) >= low && whole(f) <= high));
  const op = fact.op as 'add' | 'sub';
  return arithProblem(rng, {
    skillId: '2.facts-within-20',
    difficulty,
    op,
    a: fact.a,
    b: fact.b,
    type: pickType(rng, ['number-pad', 'multiple-choice']),
    max: 20,
    factId: op === 'add' ? addFactId(fact.a, fact.b) : subFactId(fact.a, fact.b),
    hint: {
      visual: op === 'add' ? 'double-ten-frame' : 'number-line',
      params: { a: fact.a, b: fact.b },
    },
  });
};
