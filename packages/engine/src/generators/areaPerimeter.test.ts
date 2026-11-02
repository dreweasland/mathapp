import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { areaPerimeter as gen } from './areaPerimeter';

describeGenerator('3.area-perimeter', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
type A = { w: number; h: number; ask: string };

describe('3.area-perimeter', () => {
  it('area is length times width', () => {
    for (const p of all) {
      const o = p.operands as A;
      if (o.ask === 'area') expect(Number(p.answer)).toBe(o.w * o.h);
    }
  });
  it('perimeter goes all the way around', () => {
    for (const p of all) {
      const o = p.operands as A;
      if (o.ask === 'perimeter') expect(Number(p.answer)).toBe(o.w + o.h + o.w + o.h);
    }
  });
  it('level 1 is area only', () => {
    for (const p of sample(gen, 1)) expect((p.operands as A).ask).toBe('area');
  });
  it('asks both from level 2', () => {
    expect(new Set(sample(gen, 2).map((p) => (p.operands as A).ask))).toEqual(
      new Set(['area', 'perimeter']),
    );
  });
  it('sides are 2 to 10', () => {
    for (const p of all) {
      const o = p.operands as A;
      expect(o.w).toBeGreaterThanOrEqual(2);
      expect(o.w).toBeLessThanOrEqual(10);
      expect(o.h).toBeLessThanOrEqual(7);
    }
  });
  it('a square where area equals perimeter stays valid', () => {
    const fours = all.filter((p) => {
      const o = p.operands as A;
      return o.w === 4 && o.h === 4;
    });
    for (const p of fours) expect(p.answer).toBe('16');
  });
  it('wrong choices include the other measure', () => {
    const tags = all.flatMap((p) => p.choices ?? []).map((c) => c.errorType);
    expect(tags).toContain('reversed-operation');
  });
  it('hint has both sides', () => {
    for (const p of sample(gen, 3, 40)) expect(p.hint.params).toHaveProperty('w');
  });
});
