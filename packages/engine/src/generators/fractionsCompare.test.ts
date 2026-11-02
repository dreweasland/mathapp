import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { fractionsCompare as gen } from './fractionsCompare';

describeGenerator('3.fractions-compare', gen, [
  'compare',
  'multiple-choice',
  'number-pad',
] as const);
const all = sampleAll(gen, 400);
const compares = all.filter((p) => p.operands.kind === 'fraction-compare');
type C = { an: number; ad: number; bn: number; bd: number };

describe('3.fractions-compare', () => {
  it('level 1 shares a denominator', () => {
    for (const p of sample(gen, 1)) {
      const o = p.operands as C;
      expect(o.ad).toBe(o.bd);
    }
  });
  it('level 2 shares a numerator', () => {
    for (const p of sample(gen, 2)) {
      const o = p.operands as C;
      expect(o.an).toBe(o.bn);
    }
  });
  it('compared fractions are comparable by Grade 3 rules, or equal', () => {
    for (const p of compares) {
      const o = p.operands as C;
      const equal = o.an * o.bd === o.bn * o.ad;
      expect(o.ad === o.bd || o.an === o.bn || equal).toBe(true);
    }
  });
  it('a bigger bottom with the same top is smaller', () => {
    for (const p of compares) {
      const o = p.operands as C & { form: string };
      if (o.form !== 'tap' || o.an !== o.bn || o.ad === o.bd) continue;
      expect(p.answer).toBe(o.ad < o.bd ? 'left' : 'right');
    }
  });
  it('recognizes equal fractions as the same', () => {
    expect(compares.some((p) => p.answer === 'same' || p.answer === '=')).toBe(true);
    for (const p of compares) {
      const o = p.operands as C;
      if (o.an * 2 === o.ad && o.bn * 2 === o.bd) expect(['same', '=']).toContain(p.answer);
    }
  });
  it('all fractions are proper', () => {
    for (const p of compares) {
      const o = p.operands as C;
      expect(o.an).toBeLessThan(o.ad);
      expect(o.bn).toBeLessThan(o.bd);
    }
  });
  it('equivalents scale top and bottom', () => {
    for (const p of all) {
      if (p.operands.kind !== 'fraction-equal') continue;
      const { n, d, scale } = p.operands;
      expect(Number(p.answer) * d).toBe(n * (d * scale));
    }
  });
  it('equivalents appear from level 3', () => {
    for (const p of [...sample(gen, 1), ...sample(gen, 2)])
      expect(p.operands.kind).toBe('fraction-compare');
    expect(sample(gen, 4).some((p) => p.operands.kind === 'fraction-equal')).toBe(true);
  });
});
