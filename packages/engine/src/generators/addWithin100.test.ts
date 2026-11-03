import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { addWithin100 as gen } from './addWithin100';

describeGenerator('2.add-within-100', gen, ['number-pad', 'multiple-choice'] as const);
const ops = (d: 1 | 2 | 3 | 4 | 5) =>
  sample(gen, d).map((p) => p.operands as { a: number; b: number });

describe('2.add-within-100', () => {
  it('never passes 100', () => {
    for (const p of sampleAll(gen)) expect(Number(p.answer)).toBeLessThanOrEqual(100);
  });
  it('level 1 never regroups', () => {
    for (const { a, b } of ops(1)) expect((a % 10) + (b % 10)).toBeLessThan(10);
  });
  it('level 2 is two digits plus one, crossing ten', () => {
    for (const { a, b } of ops(2)) {
      expect(b).toBeLessThan(10);
      expect((a % 10) + b).toBeGreaterThanOrEqual(10);
    }
  });
  it('level 3 always regroups', () => {
    for (const { a, b } of ops(3)) expect((a % 10) + (b % 10)).toBeGreaterThanOrEqual(10);
  });
  it('level 4 makes exactly ten in the ones', () => {
    for (const { a, b } of ops(4)) expect((a % 10) + (b % 10)).toBe(10);
  });
  it('can land exactly on 100', () => {
    expect(sample(gen, 4, 2000).some((p) => p.answer === '100')).toBe(true);
  });
  it('is not a fact card', () => {
    for (const p of sampleAll(gen)) expect(p.factId).toBeUndefined();
  });
  it('wrong choices include the forgot-to-regroup answer', () => {
    const tags = sample(gen, 3, 400)
      .flatMap((p) => p.choices ?? [])
      .map((c) => c.errorType);
    expect(tags).toContain('didnt-regroup');
  });
});
