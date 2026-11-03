import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { compare1000 as gen } from './compare1000';

describeGenerator('2.compare-1000', gen, ['compare', 'multiple-choice'] as const);
const ops = (d: 1 | 2 | 3 | 4 | 5) =>
  sample(gen, d).map((p) => p.operands as { a: number; b: number });
const unequal = (d: 1 | 2 | 3 | 4 | 5) => ops(d).filter((o) => o.a !== o.b);

describe('2.compare-1000', () => {
  it('uses three-digit numbers only', () => {
    for (const p of sampleAll(gen)) {
      const { a, b } = p.operands as { a: number; b: number };
      for (const n of [a, b]) {
        expect(n).toBeGreaterThanOrEqual(100);
        expect(n).toBeLessThanOrEqual(999);
      }
    }
  });
  it('level 2 shares the hundreds', () => {
    for (const { a, b } of unequal(2)) {
      if (Math.floor(a / 100) !== Math.floor(b / 100)) expect(a).toBe(-1);
    }
  });
  it('level 3 shares hundreds and tens', () => {
    for (const { a, b } of unequal(3)) expect(Math.floor(a / 10)).toBe(Math.floor(b / 10));
  });
  it('level 4 swaps the outer digits', () => {
    for (const { a, b } of unequal(4)) {
      expect(a % 10).toBe(Math.floor(b / 100));
      expect(b % 10).toBe(Math.floor(a / 100));
    }
  });
  it('every level includes equal numbers', () => {
    for (const d of [1, 2, 3, 4, 5] as const) expect(ops(d).some((o) => o.a === o.b)).toBe(true);
  });
  it('tap answers are left, right or same', () => {
    for (const p of sampleAll(gen)) {
      if (p.questionType === 'compare') expect(['left', 'right', 'same']).toContain(p.answer);
    }
  });
  it('symbol answers are signs', () => {
    for (const p of sampleAll(gen)) {
      if (p.questionType === 'multiple-choice') expect(['>', '<', '=']).toContain(p.answer);
    }
  });
  it('hint shows both numbers', () => {
    for (const p of sample(gen, 3, 40))
      expect(p.hint.params).toMatchObject(
        p.operands.kind === 'compare' ? { a: p.operands.a, b: p.operands.b } : {},
      );
  });
});
