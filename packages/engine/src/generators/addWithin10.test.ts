import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { addWithin10 } from './addWithin10';

const TYPES = ['number-pad', 'multiple-choice', 'number-line'] as const;
describeGenerator('1.add-within-10', addWithin10, TYPES);

const ops = (d: 1 | 2 | 3 | 4 | 5) =>
  sample(addWithin10, d).map((p) => p.operands as { a: number; b: number });

describe('1.add-within-10', () => {
  it('sum never exceeds 10', () => {
    for (const p of sampleAll(addWithin10)) expect(Number(p.answer)).toBeLessThanOrEqual(10);
  });
  it('difficulty 1 has small sums', () => {
    for (const { a, b } of ops(1)) expect(a + b).toBeLessThanOrEqual(5);
  });
  it('difficulty 2 adds 0, 1 or 2 on one side', () => {
    for (const { a, b } of ops(2)) expect(Math.min(a, b)).toBeLessThanOrEqual(2);
  });
  it('difficulty 3 is doubles or make-10', () => {
    for (const { a, b } of ops(3)) expect(a === b || a + b === 10).toBe(true);
  });
  it('difficulty 4 has sums 6–10 with no trivial addend', () => {
    for (const { a, b } of ops(4)) {
      expect(a + b).toBeGreaterThanOrEqual(6);
      expect(Math.min(a, b)).toBeGreaterThanOrEqual(2);
    }
  });
  it('difficulty 5 covers every one of the 66 facts', () => {
    const seen = new Set(sample(addWithin10, 5, 3000).map((p) => p.factId));
    expect(seen.size).toBe(66);
  });
  it('includes the 0 + 0 edge', () => {
    expect(ops(5).length).toBeGreaterThan(0);
    expect(sample(addWithin10, 5, 3000).some((p) => p.factId === 'add:0+0')).toBe(true);
  });
  it('includes the 10 + 0 and 0 + 10 edges', () => {
    const seen = new Set(sample(addWithin10, 5, 3000).map((p) => p.factId));
    expect(seen).toContain('add:10+0');
    expect(seen).toContain('add:0+10');
  });
  it('every problem is a fact card matching its operands', () => {
    for (const p of sampleAll(addWithin10)) {
      const o = p.operands as { a: number; b: number };
      expect(p.factId).toBe(`add:${o.a}+${o.b}`);
    }
  });
  it('number line runs 0–10', () => {
    for (const p of sampleAll(addWithin10)) {
      if (p.numberLine) expect(p.numberLine).toEqual({ min: 0, max: 10 });
    }
  });
});
