import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { addWithin20 } from './addWithin20';

const TYPES = ['number-pad', 'multiple-choice', 'number-line'] as const;
describeGenerator('1.add-within-20', addWithin20, TYPES);

const ops = (d: 1 | 2 | 3 | 4 | 5, n = 300) =>
  sample(addWithin20, d, n).map((p) => p.operands as { a: number; b: number });

describe('1.add-within-20', () => {
  it('sum never exceeds 20', () => {
    for (const p of sampleAll(addWithin20)) expect(Number(p.answer)).toBeLessThanOrEqual(20);
  });
  it('difficulty 1 is +1 or +2', () => {
    for (const { b } of ops(1)) expect([1, 2]).toContain(b);
  });
  it('difficulty 2 is +3', () => {
    for (const { b } of ops(2)) expect(b).toBe(3);
  });
  it('difficulty 3 starts from 7, 8 or 9 and crosses 10', () => {
    for (const { a, b } of ops(3)) {
      expect([7, 8, 9]).toContain(a);
      expect(a + b).toBeGreaterThan(10);
    }
  });
  it('difficulty 4 is doubles or near doubles past 10', () => {
    for (const { a, b } of ops(4)) {
      expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
      expect(a + b).toBeGreaterThan(10);
    }
  });
  it('reaches exactly 20', () => {
    expect(sample(addWithin20, 5, 3000).some((p) => p.answer === '20')).toBe(true);
  });
  it('includes the 10 + 10 double', () => {
    expect(sample(addWithin20, 4, 1000).some((p) => p.factId === 'add:10+10')).toBe(true);
  });
  it('facts only appear when both addends are 10 or less', () => {
    for (const p of sampleAll(addWithin20)) {
      const { a, b } = p.operands as { a: number; b: number };
      expect(p.factId !== undefined).toBe(a <= 10 && b <= 10);
    }
  });
  it('a teen addend like 13 + 4 is practice, not a fact card', () => {
    const teen = sample(addWithin20, 5, 2000).find((p) => (p.operands as { a: number }).a > 10);
    expect(teen?.factId).toBeUndefined();
  });
  it('number line runs 0–20', () => {
    for (const p of sampleAll(addWithin20)) {
      if (p.numberLine) expect(p.numberLine).toEqual({ min: 0, max: 20 });
    }
  });
});
