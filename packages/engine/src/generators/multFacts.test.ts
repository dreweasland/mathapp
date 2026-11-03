import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { FACTORS_BY_LEVEL, multFacts as gen } from './multFacts';

describeGenerator('3.mult-facts', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
const ops = (d: 1 | 2 | 3 | 4 | 5) =>
  sample(gen, d).map((p) => p.operands as { a: number; b: number });
const usesFactor = (o: { a: number; b: number }, list: readonly number[]) =>
  list.includes(o.a) || list.includes(o.b);

describe('3.mult-facts', () => {
  it('follows the order 2, 5, 10, 3, 4, 6, 7, 8, 9', () => {
    expect(FACTORS_BY_LEVEL[5]).toEqual([2, 5, 10, 3, 4, 6, 7, 8, 9]);
  });
  it('level 1 always includes a 2 or a 5', () => {
    for (const o of ops(1)) expect(usesFactor(o, [2, 5])).toBe(true);
  });
  it('level 2 adds tens', () => {
    expect(ops(2).some((o) => usesFactor(o, [10]))).toBe(true);
  });
  it('level 1 has no 7s unless paired with a 2 or 5', () => {
    for (const o of ops(1)) if (usesFactor(o, [7])) expect(usesFactor(o, [2, 5])).toBe(true);
  });
  it('every problem is a card with a matching id', () => {
    for (const p of all) {
      const o = p.operands as { a: number; b: number };
      expect(p.factId).toBe(`mul:${o.a}x${o.b}`);
    }
  });
  it('stays within 100', () => {
    for (const p of all) expect(Number(p.answer)).toBeLessThanOrEqual(100);
  });
  it('includes both orders of a pair', () => {
    const ids = new Set(sample(gen, 5, 3000).map((p) => p.factId));
    expect(ids).toContain('mul:3x7');
    expect(ids).toContain('mul:7x3');
  });
  it('reaches 9 × 9 and 10 × 10 at the top', () => {
    const ids = new Set(sample(gen, 5, 5000).map((p) => p.factId));
    expect(ids).toContain('mul:9x9');
    expect(ids).toContain('mul:10x10');
  });
});
