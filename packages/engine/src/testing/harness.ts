import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../rng';
import type { Difficulty, Generator, Problem, QuestionType } from '../types';
import { isTrueEquation, solve } from './solver';

export const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5];

export function sample(generate: Generator, difficulty: Difficulty, n = 300): Problem[] {
  const out: Problem[] = [];
  for (let seed = 0; seed < n; seed++) out.push(generate(mulberry32(seed * 7919), difficulty));
  return out;
}

export function sampleAll(generate: Generator, n = 300): Problem[] {
  return DIFFICULTIES.flatMap((d) => sample(generate, d, n));
}

/** Every check that any valid problem must pass. */
export function assertValid(p: Problem, skillId: string, allowed: readonly QuestionType[]): void {
  const where = JSON.stringify(p);
  expect(p.skillId, where).toBe(skillId);
  expect(allowed, where).toContain(p.questionType);
  expect(p.speech.key.length, where).toBeGreaterThan(0);
  expect(p.hint.visual, where).toBeTruthy();
  if (p.operands.kind === 'family' && p.operands.ask === 'belongs') {
    expect(isTrueEquation(p.answer), where).toBe(true);
  } else {
    expect(p.answer, where).toBe(solve(p));
  }
  if (p.questionType === 'multiple-choice' || p.questionType === 'clock-face') {
    const values = p.choices?.map((c) => c.value) ?? [];
    expect(values.length, where).toBeGreaterThanOrEqual(2);
    expect(values.length, where).toBeLessThanOrEqual(4);
    expect(new Set(values).size, where).toBe(values.length);
    expect(values.filter((v) => v === p.answer), where).toHaveLength(1);
  }
  if (p.questionType === 'number-line') {
    const line = p.numberLine;
    expect(line, where).toBeDefined();
    const answer = Number(p.answer);
    expect(answer, where).toBeGreaterThanOrEqual(line?.min ?? Infinity);
    expect(answer, where).toBeLessThanOrEqual(line?.max ?? -Infinity);
  }
  if (p.questionType === 'ten-frame') {
    expect(p.tenFrame, where).toBeDefined();
    expect(Number(p.answer), where).toBeGreaterThanOrEqual(0);
    expect(Number(p.answer), where).toBeLessThanOrEqual(10);
  }
}

/** The shared suite: 12 tests every generator must pass. */
export function describeGenerator(
  skillId: string,
  generate: Generator,
  allowed: readonly QuestionType[],
): void {
  describe(`${skillId} shared checks`, () => {
    it.each(DIFFICULTIES)('difficulty %i: all problems are valid', (d) => {
      for (const p of sample(generate, d)) assertValid(p, skillId, allowed);
    });
    it('records the requested difficulty', () => {
      for (const d of DIFFICULTIES) {
        expect(sample(generate, d, 20).every((p) => p.difficulty === d)).toBe(true);
      }
    });
    it('is reproducible from a seed', () => {
      expect(generate(mulberry32(123), 3)).toEqual(generate(mulberry32(123), 3));
    });
    it('varies across seeds', () => {
      const unique = new Set(sample(generate, 3, 100).map((p) => JSON.stringify(p.operands)));
      expect(unique.size).toBeGreaterThan(1);
    });
    it('uses at least 2 question types', () => {
      expect(new Set(sampleAll(generate, 60).map((p) => p.questionType)).size).toBeGreaterThan(1);
    });
    it('uses only the listed question types, and every one of them', () => {
      expect(new Set(sampleAll(generate, 200).map((p) => p.questionType))).toEqual(
        new Set(allowed),
      );
    });
    it('every wrong multiple-choice option differs from the answer', () => {
      for (const p of sampleAll(generate, 60)) {
        for (const c of p.choices ?? []) {
          if (c.value !== p.answer) expect(c.value).not.toBe(solve(p));
        }
      }
    });
    it('never produces NaN, undefined, or a negative number in the answer', () => {
      for (const p of sampleAll(generate, 60)) {
        expect(p.answer).not.toMatch(/NaN|undefined|^-/);
      }
    });
  });
}
