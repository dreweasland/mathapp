import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { isTrueEquation } from '../testing/solver';
import type { Problem } from '../types';
import { factFamilies } from './factFamilies';

describeGenerator('1.fact-families', factFamilies, ['number-pad', 'multiple-choice']);

const ops = (p: Problem) =>
  p.operands as { a: number; b: number; ask: 'flip' | 'sub-a' | 'sub-b' | 'belongs' };

describe('1.fact-families', () => {
  it.each([
    [1, 5],
    [2, 10],
    [3, 10],
    [4, 15],
    [5, 20],
  ] as const)('difficulty %i keeps the whole at or below %i', (d, limit) => {
    for (const p of sample(factFamilies, d)) expect(ops(p).a + ops(p).b).toBeLessThanOrEqual(limit);
  });
  it('never uses a double, whose family has only two facts', () => {
    for (const p of sampleAll(factFamilies)) expect(ops(p).a).not.toBe(ops(p).b);
  });
  it('never uses 0', () => {
    for (const p of sampleAll(factFamilies)) {
      expect(ops(p).a).toBeGreaterThan(0);
      expect(ops(p).b).toBeGreaterThan(0);
    }
  });
  it('difficulty 3 has addends of at least 2', () => {
    for (const p of sample(factFamilies, 3)) {
      expect(Math.min(ops(p).a, ops(p).b)).toBeGreaterThanOrEqual(2);
    }
  });
  it('asks all four kinds', () => {
    expect(new Set(sampleAll(factFamilies).map((p) => ops(p).ask))).toEqual(
      new Set(['flip', 'sub-a', 'sub-b', 'belongs']),
    );
  });
  it('flip answers the whole', () => {
    for (const p of sampleAll(factFamilies)) {
      if (ops(p).ask === 'flip') expect(Number(p.answer)).toBe(ops(p).a + ops(p).b);
    }
  });
  it('subtraction asks answer the other addend', () => {
    for (const p of sampleAll(factFamilies)) {
      if (ops(p).ask === 'sub-a') expect(Number(p.answer)).toBe(ops(p).b);
      if (ops(p).ask === 'sub-b') expect(Number(p.answer)).toBe(ops(p).a);
    }
  });
  it('"belongs": the right choice is true and uses the family numbers', () => {
    for (const p of sampleAll(factFamilies)) {
      if (ops(p).ask !== 'belongs') continue;
      expect(isTrueEquation(p.answer)).toBe(true);
      expect(p.answer).toBe(`${ops(p).a + ops(p).b}-${ops(p).a}=${ops(p).b}`);
    }
  });
  it('"belongs": every wrong choice is a false equation', () => {
    for (const p of sampleAll(factFamilies)) {
      if (ops(p).ask !== 'belongs') continue;
      for (const c of p.choices ?? []) {
        if (c.value !== p.answer) expect(isTrueEquation(c.value), c.value).toBe(false);
      }
    }
  });
});
