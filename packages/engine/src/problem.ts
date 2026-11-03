import type { Candidate } from './distractors';
import type { Rng } from './rng';
import type { Choice, Difficulty, QuestionType } from './types';

export const clampDifficulty = (d: number): Difficulty =>
  Math.min(5, Math.max(1, Math.round(d))) as Difficulty;

interface NumericChoiceOptions {
  min?: number;
  max?: number;
  count?: number;
}

/**
 * Tagged candidates first, then nearby numbers until there are enough. Always includes
 * the answer exactly once, with every other choice distinct and in range.
 */
export function numericChoices(
  rng: Rng,
  answer: number,
  candidates: Candidate[],
  { min = 0, max = 1000, count = 4 }: NumericChoiceOptions = {},
): Choice[] {
  const used = new Set([answer]);
  const wrong: Choice[] = [];
  const add = (value: number, errorType?: Choice['errorType']) => {
    if (wrong.length >= count - 1 || used.has(value) || value < min || value > max) return;
    used.add(value);
    wrong.push(errorType ? { value: String(value), errorType } : { value: String(value) });
  };
  for (const c of candidates) add(c.value, c.errorType);
  for (let gap = 1; wrong.length < count - 1 && gap <= max - min; gap++) {
    add(answer + gap, gap === 1 ? 'off-by-one' : 'other');
    add(answer - gap, gap === 1 ? 'off-by-one' : 'other');
  }
  return rng.shuffle([{ value: String(answer) }, ...wrong]);
}

/** Choices made of non-numeric values (clocks, shapes, expressions). */
export function tagged(rng: Rng, answer: string, wrong: Choice[]): Choice[] {
  return rng.shuffle([{ value: answer }, ...wrong]);
}

export const pickType = (rng: Rng, types: readonly QuestionType[]): QuestionType => rng.pick(types);
