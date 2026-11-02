import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { multConcept as gen } from './multConcept';

describeGenerator('3.mult-concept', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
const ops = (list = all) =>
  list.map((p) => p.operands as { rows: number; cols: number; form: string });

describe('3.mult-concept', () => {
  it('shows groups, arrays and area', () => {
    expect(new Set(ops().map((o) => o.form))).toEqual(new Set(['groups', 'array', 'area']));
  });
  it('speech matches the form', () => {
    for (const p of all)
      expect(p.speech.key).toBe(`q.mult-${(p.operands as { form: string }).form}`);
  });
  it('level 1 stays within 3 by 3', () => {
    for (const o of ops(sample(gen, 1))) expect(o.rows * o.cols).toBeLessThanOrEqual(9);
  });
  it('no factor of 1, since this is about real groups', () => {
    for (const o of ops()) {
      expect(o.rows).toBeGreaterThanOrEqual(2);
      expect(o.cols).toBeGreaterThanOrEqual(2);
    }
  });
  it('rows fit on a phone', () => {
    for (const o of ops()) expect(o.rows).toBeLessThanOrEqual(6);
  });
  it('factors stay at 10 or under', () => {
    for (const o of ops()) expect(o.cols).toBeLessThanOrEqual(10);
  });
  it('wrong choices include adding instead', () => {
    const tags = all.flatMap((p) => p.choices ?? []).map((c) => c.errorType);
    expect(tags).toContain('reversed-operation');
  });
  it('is not a fact card', () => {
    for (const p of all) expect(p.factId).toBeUndefined();
  });
});
