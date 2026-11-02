import { numberProblem, pickType, tagged } from '../problem';
import type { Rng } from '../rng';
import type { Choice, Difficulty, Generator, Problem } from '../types';

const SKILL = '2.money';
const TYPES = ['number-pad', 'multiple-choice'] as const;

const COIN_SETS: Record<Difficulty, number[]> = {
  1: [1, 5],
  2: [1, 5, 10],
  3: [5, 10, 25],
  4: [1, 5, 10, 25],
  5: [1, 5, 10, 25],
};

function coins(rng: Rng, difficulty: Difficulty): number[] {
  const set = COIN_SETS[difficulty];
  const items: number[] = [];
  const count = rng.int(2, 3 + difficulty);
  for (let i = 0; i < count; i++) {
    const coin = rng.pick(set);
    if (items.reduce((s, c) => s + c, 0) + coin < 100) items.push(coin);
  }
  // Biggest first: how a person lays out coins to count them.
  return items.sort((a, b) => b - a);
}

function countCoins(rng: Rng, difficulty: Difficulty): Problem {
  const items = coins(rng, difficulty);
  const total = items.reduce((s, c) => s + c, 0);
  return numberProblem(rng, {
    skillId: SKILL,
    difficulty,
    operands: { kind: 'money', items, unit: 'cents' },
    answer: total,
    max: 120,
    speech: { key: 'q.money-cents' },
    hint: { visual: 'coins', params: { running: 1 } },
    type: pickType(rng, TYPES),
    candidates: [
      { value: items.length, errorType: 'other' },
      { value: total + 5, errorType: 'other' },
      { value: total - 5, errorType: 'other' },
    ],
  });
}

function countBills(rng: Rng, difficulty: Difficulty): Problem {
  const count = rng.int(2, 4);
  const items = Array.from({ length: count }, () => rng.pick([100, 500, 1000])).sort(
    (a, b) => b - a,
  );
  const dollars = items.reduce((s, c) => s + c, 0) / 100;
  return numberProblem(rng, {
    skillId: SKILL,
    difficulty,
    operands: { kind: 'money', items, unit: 'dollars' },
    answer: dollars,
    max: 60,
    speech: { key: 'q.money-dollars' },
    hint: { visual: 'coins', params: { running: 1 } },
    type: pickType(rng, TYPES),
    candidates: [{ value: count, errorType: 'other' }],
  });
}

function makeChange(rng: Rng, difficulty: Difficulty): Problem {
  const cost = 5 * rng.int(4, 19);
  return numberProblem(rng, {
    skillId: SKILL,
    difficulty,
    operands: { kind: 'change', paid: 100, cost },
    answer: 100 - cost,
    max: 100,
    speech: { key: 'q.money-change', params: { cost } },
    hint: { visual: 'coins' },
    type: pickType(rng, TYPES),
    candidates: [
      { value: cost, errorType: 'reversed-operation' },
      { value: 100 - cost + 10, errorType: 'place-value' },
      { value: Math.max(0, 100 - cost - 10), errorType: 'place-value' },
    ],
  });
}

function makeAmount(rng: Rng, difficulty: Difficulty): Problem {
  const pick = (): number[] => {
    const list = Array.from({ length: rng.int(2, 3) }, () => rng.pick([1, 5, 10, 25]));
    return list.sort((a, b) => b - a);
  };
  const sum = (list: number[]) => list.reduce((s, c) => s + c, 0);
  const right = pick();
  const target = sum(right);
  const wrong: Choice[] = [];
  const seen = new Set([target]);
  while (wrong.length < 2) {
    const list = pick();
    if (seen.has(sum(list))) continue;
    seen.add(sum(list));
    wrong.push({ value: list.join('+'), errorType: 'other' });
  }
  const answer = right.join('+');
  return {
    skillId: SKILL,
    questionType: 'multiple-choice',
    difficulty,
    operands: { kind: 'make-amount', target },
    answer,
    choices: tagged(rng, answer, wrong),
    speech: { key: 'q.money-make', params: { target } },
    hint: { visual: 'coins', params: { running: 1 } },
  };
}

export const money: Generator = (rng, difficulty) => {
  if (difficulty <= 2) return countCoins(rng, difficulty);
  if (difficulty === 3)
    return rng.int(1, 3) === 1 ? makeAmount(rng, difficulty) : countCoins(rng, difficulty);
  const form = rng.pick([
    countCoins,
    countBills,
    makeAmount,
    ...(difficulty === 5 ? [makeChange, makeChange] : []),
  ]);
  return form(rng, difficulty);
};
