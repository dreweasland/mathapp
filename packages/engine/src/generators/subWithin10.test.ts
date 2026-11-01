import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { subWithin10 } from './subWithin10';

const TYPES = ['number-pad', 'multiple-choice', 'number-line'] as const;
describeGenerator('1.sub-within-10', subWithin10, TYPES);

const ops = (d: 1 | 2 | 3 | 4 | 5) =>
  sample(subWithin10, d).map((p) => p.operands as { a: number; b: number });

describe('1.sub-within-10', () => {
  it('never produces a negative result', () => {
    for (const p of sampleAll(subWithin10)) expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
  });
  it('never starts above 10', () => {
    for (const p of sampleAll(subWithin10)) {
      expect((p.operands as { a: number }).a).toBeLessThanOrEqual(10);
    }
  });
  it('difficulty 1 starts at 5 or below', () => {
    for (const { a } of ops(1)) expect(a).toBeLessThanOrEqual(5);
  });
  it('difficulty 2 takes away 0, 1 or 2', () => {
    for (const { b } of ops(2)) expect(b).toBeLessThanOrEqual(2);
  });
  it('difficulty 3 is from-10 or halving', () => {
    for (const { a, b } of ops(3)) expect(a === 10 || a === 2 * b).toBe(true);
  });
  it('difficulty 4 takes away at least 3 from 6 or more', () => {
    for (const { a, b } of ops(4)) {
      expect(a).toBeGreaterThanOrEqual(6);
      expect(b).toBeGreaterThanOrEqual(3);
    }
  });
  it('difficulty 5 covers all 66 facts', () => {
    expect(new Set(sample(subWithin10, 5, 3000).map((p) => p.factId)).size).toBe(66);
  });
  it('includes a - a = 0', () => {
    expect(sample(subWithin10, 5, 3000).some((p) => p.answer === '0')).toBe(true);
  });
  it('includes the 0 - 0 and 10 - 10 edges', () => {
    const seen = new Set(sample(subWithin10, 5, 3000).map((p) => p.factId));
    expect(seen).toContain('sub:0-0');
    expect(seen).toContain('sub:10-10');
  });
  it('every problem is a fact card matching its operands', () => {
    for (const p of sampleAll(subWithin10)) {
      const o = p.operands as { a: number; b: number };
      expect(p.factId).toBe(`sub:${o.a}-${o.b}`);
    }
  });
});
