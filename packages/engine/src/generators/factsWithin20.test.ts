import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { factsWithin20 as gen } from './factsWithin20';

describeGenerator('2.facts-within-20', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
const whole = (p: (typeof all)[number]) => {
  const o = p.operands as { op: string; a: number; b: number };
  return o.op === 'add' ? o.a + o.b : o.a;
};

describe('2.facts-within-20', () => {
  it('every problem is a tracked fact card', () => {
    for (const p of all) expect(p.factId).toMatch(/^(add|sub):/);
  });
  it('fact ids match the numbers on screen', () => {
    for (const p of all) {
      const o = p.operands as { op: string; a: number; b: number };
      expect(p.factId).toBe(o.op === 'add' ? `add:${o.a}+${o.b}` : `sub:${o.a}-${o.b}`);
    }
  });
  it('stays within 20', () => {
    for (const p of all) expect(whole(p)).toBeLessThanOrEqual(20);
  });
  it('level 1 stays within 10', () => {
    for (const p of sample(gen, 1)) expect(whole(p)).toBeLessThanOrEqual(10);
  });
  it('level 4 is the hard end, 15 to 20', () => {
    for (const p of sample(gen, 4)) expect(whole(p)).toBeGreaterThanOrEqual(15);
  });
  it('includes both operations', () => {
    const ops = new Set(all.map((p) => (p.operands as { op: string }).op));
    expect(ops).toEqual(new Set(['add', 'sub']));
  });
  it('reaches 10 + 10 and 20 − 10', () => {
    const ids = new Set(sample(gen, 4, 3000).map((p) => p.factId));
    expect(ids).toContain('add:10+10');
    expect(ids).toContain('sub:20-10');
  });
  it('handles zero facts', () => {
    expect(sample(gen, 1, 3000).some((p) => p.answer === '0')).toBe(true);
  });
});
