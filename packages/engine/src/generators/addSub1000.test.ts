import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { addSub1000 as gen, addSub1000Fluent as fluent } from './addSub1000';

describeGenerator('2.add-sub-1000', gen, ['number-pad', 'multiple-choice'] as const);
describeGenerator('3.add-sub-1000', fluent, ['number-pad', 'multiple-choice'] as const);
const ops = (d: 1 | 2 | 3 | 4 | 5) =>
  sample(gen, d).map((p) => p.operands as { a: number; b: number; op: string });

describe('add and subtract within 1000', () => {
  it('stays between 0 and 1000', () => {
    for (const p of [...sampleAll(gen), ...sampleAll(fluent)]) {
      expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
      expect(Number(p.answer)).toBeLessThanOrEqual(1000);
    }
  });
  it('level 1 is whole hundreds', () => {
    for (const { a, b } of ops(1)) {
      expect(a % 100).toBe(0);
      expect(b % 100).toBe(0);
    }
  });
  it('level 2 moves only the tens', () => {
    for (const { b, op } of ops(2)) if (op === 'sub') expect(b % 10).toBe(0);
  });
  it('level 3 never regroups', () => {
    for (const { a, b, op } of ops(3)) {
      if (op === 'add') expect((a % 10) + (b % 10)).toBeLessThan(10);
    }
  });
  it('level 4 adds across a ten', () => {
    for (const { a, b, op } of ops(4)) {
      if (op === 'add') expect((a % 10) + (b % 10)).toBeGreaterThanOrEqual(10);
    }
  });
  it('can reach exactly 1000', () => {
    expect(
      sample(gen, 5, 8000).some(
        (p) => p.answer === '1000' || (p.operands as { a: number }).a === 1000,
      ),
    ).toBe(true);
  });
  it('uses both operations', () => {
    expect(new Set(ops(5).map((o) => o.op))).toEqual(new Set(['add', 'sub']));
  });
  it('Grade 3 starts past the easy levels but keeps the requested difficulty', () => {
    const p = sample(fluent, 1, 200);
    expect(p.every((x) => x.difficulty === 1)).toBe(true);
    expect(p.every((x) => x.skillId === '3.add-sub-1000')).toBe(true);
    expect(p.some((x) => (x.operands as { b: number }).b % 100 !== 0)).toBe(true);
  });
});
