import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { factFamiliesMd as gen } from './factFamiliesMd';

describeGenerator('3.fact-families-md', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
type Fam = { a: number; b: number; ask: string };

describe('3.fact-families-md', () => {
  it('asks all three related facts', () => {
    expect(new Set(all.map((p) => (p.operands as Fam).ask))).toEqual(
      new Set(['flip', 'div-a', 'div-b']),
    );
  });
  it('a flip gives the same product', () => {
    for (const p of all) {
      const o = p.operands as Fam;
      if (o.ask === 'flip') expect(Number(p.answer)).toBe(o.a * o.b);
    }
  });
  it('dividing by a gives b', () => {
    for (const p of all) {
      const o = p.operands as Fam;
      if (o.ask === 'div-a') expect(Number(p.answer)).toBe(o.b);
    }
  });
  it('dividing by b gives a', () => {
    for (const p of all) {
      const o = p.operands as Fam;
      if (o.ask === 'div-b') expect(Number(p.answer)).toBe(o.a);
    }
  });
  it('speech says the product', () => {
    for (const p of all) {
      const o = p.operands as Fam;
      expect(p.speech.params?.['product']).toBe(o.a * o.b);
    }
  });
  it('level 1 stays within 5 by 5', () => {
    for (const p of sample(gen, 1)) {
      const o = p.operands as Fam;
      expect(Math.max(o.a, o.b)).toBeLessThanOrEqual(5);
    }
  });
  it('stays within 100', () => {
    for (const p of all) {
      const o = p.operands as Fam;
      expect(o.a * o.b).toBeLessThanOrEqual(100);
    }
  });
  it('is not a fact card', () => {
    for (const p of all) expect(p.factId).toBeUndefined();
  });
});
