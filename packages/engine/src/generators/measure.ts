import { tagged } from '../problem';
import type { Choice, Difficulty, Generator, Problem } from '../types';
import type { Rng } from '../rng';

const SKILL = '1.measure';
const GAP: Record<Difficulty, number> = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };
const OBJECTS = ['pencil', 'crayon', 'worm', 'snake', 'ribbon'];

/** Distinct lengths, shuffled, each at least `gap` apart. */
function lengths(rng: Rng, count: number, gap: number): number[] {
  const start = rng.int(1, 3);
  const steps = Array.from({ length: count }, (_, i) => start + i * gap + rng.int(0, 1));
  return rng.shuffle(steps.map((n, i) => n + i));
}

export const measure: Generator = (rng, difficulty) => {
  const gap = GAP[difficulty];
  const objects = rng.shuffle(OBJECTS);
  const base = { skillId: SKILL, difficulty, hint: { visual: 'bars' } } as const;

  if (rng.int(1, 2) === 1) {
    const pair = lengths(rng, 2, gap);
    const [first, second] = pair as [number, number];
    const ask = rng.pick(['longest', 'shortest'] as const);
    const firstWins = ask === 'longest' ? first > second : first < second;
    const answer = firstWins ? 'left' : 'right';
    const problem: Problem = {
      ...base,
      questionType: 'compare',
      operands: { kind: 'lengths', lengths: pair, ask },
      answer,
      choices: tagged(rng, answer, [
        { value: firstWins ? 'right' : 'left', errorType: 'reversed-operation' },
      ]),
      picture: { scene: `lengths:${objects.slice(0, 2).join(',')}`, counts: pair },
      speech: { key: `q.measure-${ask}` },
    };
    return problem;
  }

  const trio = lengths(rng, 3, gap);
  // "Middle" is the ordering step, the hardest of the three; it only appears late.
  const ask = rng.pick(
    difficulty >= 4
      ? (['longest', 'shortest', 'middle'] as const)
      : (['longest', 'shortest'] as const),
  );
  const sorted = [...trio].sort((x, y) => x - y);
  const target = ask === 'longest' ? sorted[2] : ask === 'shortest' ? sorted[0] : sorted[1];
  const index = trio.indexOf(target as number);
  const wrong = [0, 1, 2]
    .filter((i) => i !== index)
    .map((i): Choice => ({ value: String(i), errorType: 'reversed-operation' }));
  const problem: Problem = {
    ...base,
    questionType: 'multiple-choice',
    operands: { kind: 'lengths', lengths: trio, ask },
    answer: String(index),
    choices: tagged(rng, String(index), wrong),
    picture: { scene: `lengths:${objects.slice(0, 3).join(',')}`, counts: trio },
    speech: { key: `q.measure-${ask}` },
  };
  return problem;
};
