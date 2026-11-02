import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { arrays as gen } from './arrays';

describeGenerator('2.arrays', gen, ['number-pad', 'multiple-choice'] as const);
const ops = (d: 1 | 2 | 3 | 4 | 5) =>
  sample(gen, d).map((p) => p.operands as { rows: number; cols: number });

describe('2.arrays', () => {
  it('stays within 5 by 5, the Grade 2 limit', () => {
    for (const d of [1, 2, 3, 4, 5] as const) {
      for (const { rows, cols } of ops(d)) {
        expect(rows).toBeLessThanOrEqual(5);
        expect(cols).toBeLessThanOrEqual(5);
      }
    }
  });
  it('always has at least 2 rows and columns', () => {
    for (const { rows, cols } of ops(3)) {
      expect(rows).toBeGreaterThanOrEqual(2);
      expect(cols).toBeGreaterThanOrEqual(2);
    }
  });
  it('level 1 stays small', () => {
    for (const { rows, cols } of ops(1)) expect(rows * cols).toBeLessThanOrEqual(9);
  });
  it('reaches 5 by 5', () => {
    expect(sample(gen, 5, 500).some((p) => p.answer === '25')).toBe(true);
  });
  it('always shows the array form', () => {
    for (const p of sampleAll(gen)) expect((p.operands as { form: string }).form).toBe('array');
  });
  it('wrong choices include adding rows and columns', () => {
    const tags = sampleAll(gen)
      .flatMap((p) => p.choices ?? [])
      .map((c) => c.errorType);
    expect(tags).toContain('reversed-operation');
  });
  it('hint groups match the array', () => {
    for (const p of sample(gen, 3, 50)) {
      const o = p.operands as { rows: number; cols: number };
      expect(p.hint.params).toEqual({ groups: o.rows, each: o.cols });
    }
  });
  it('speech gives rows and columns', () => {
    for (const p of sample(gen, 3, 50)) expect(p.speech.params).toHaveProperty('rows');
  });
});
