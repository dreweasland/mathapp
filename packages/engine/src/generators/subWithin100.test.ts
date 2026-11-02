import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { subWithin100 as gen } from './subWithin100';

describeGenerator('2.sub-within-100', gen, ['number-pad', 'multiple-choice'] as const);
const ops = (d: 1 | 2 | 3 | 4 | 5) =>
  sample(gen, d).map((p) => p.operands as { a: number; b: number });

describe('2.sub-within-100', () => {
  it('never goes below zero or starts above 100', () => {
    for (const p of sampleAll(gen)) {
      expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
      expect((p.operands as { a: number }).a).toBeLessThanOrEqual(100);
    }
  });
  it('level 1 never regroups', () => {
    for (const { a, b } of ops(1)) expect(a % 10).toBeGreaterThanOrEqual(b % 10);
  });
  it('level 2 takes one digit, crossing ten', () => {
    for (const { a, b } of ops(2)) {
      expect(b).toBeLessThan(10);
      expect(a % 10).toBeLessThan(b);
    }
  });
  it('level 3 always regroups', () => {
    for (const { a, b } of ops(3)) expect(a % 10).toBeLessThan(b % 10);
  });
  it('level 4 takes from a whole ten', () => {
    for (const { a } of ops(4)) expect(a % 10).toBe(0);
  });
  it('can land on zero at the top level', () => {
    expect(sample(gen, 5, 5000).some((p) => p.answer === '0')).toBe(true);
  });
  it('can start from exactly 100', () => {
    expect(
      ops(5)
        .concat(sample(gen, 5, 3000).map((p) => p.operands as { a: number; b: number }))
        .some((o) => o.a === 100),
    ).toBe(true);
  });
  it('wrong choices include the smaller-from-bigger slip', () => {
    const tags = sample(gen, 3, 400)
      .flatMap((p) => p.choices ?? [])
      .map((c) => c.errorType);
    expect(tags).toContain('didnt-regroup');
  });
});
