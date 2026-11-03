import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { divFacts as gen } from './divFacts';

describeGenerator('3.div-facts', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
const ops = (list = all) => list.map((p) => p.operands as { a: number; b: number });

describe('3.div-facts', () => {
  it('always comes out even', () => {
    for (const { a, b } of ops()) expect(a % b).toBe(0);
  });
  it('every problem is a card with a matching id', () => {
    for (const p of all) {
      const o = p.operands as { a: number; b: number };
      expect(p.factId).toBe(`div:${o.a}/${o.b}`);
    }
  });
  it('level 1 divides by 2 or 5', () => {
    for (const { b } of ops(sample(gen, 1))) expect([2, 5]).toContain(b);
  });
  it('quotients run 1 to 10', () => {
    for (const p of all) {
      expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
      expect(Number(p.answer)).toBeLessThanOrEqual(10);
    }
  });
  it('stays within 100', () => {
    for (const { a } of ops()) expect(a).toBeLessThanOrEqual(100);
  });
  it('reaches 100 ÷ 10 and 81 ÷ 9', () => {
    const ids = new Set(sample(gen, 5, 5000).map((p) => p.factId));
    expect(ids).toContain('div:100/10');
    expect(ids).toContain('div:81/9');
  });
  it('wrong choices include subtracting', () => {
    const tags = all.flatMap((p) => p.choices ?? []).map((c) => c.errorType);
    expect(tags).toContain('reversed-operation');
  });
  it('never divides by zero', () => {
    for (const { b } of ops()) expect(b).toBeGreaterThan(0);
  });
});
