import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { divConcept as gen } from './divConcept';

describeGenerator('3.div-concept', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);

describe('3.div-concept', () => {
  it('uses sharing, grouping and unknown factors', () => {
    const forms = new Set(
      all.map((p) => (p.operands.kind === 'share' ? p.operands.ask : p.operands.kind)),
    );
    expect(forms).toEqual(new Set(['each', 'groups', 'unknown-factor']));
  });
  it('always divides evenly', () => {
    for (const p of all) {
      const o = p.operands;
      if (o.kind === 'share') expect(o.total % o.parts).toBe(0);
      if (o.kind === 'unknown-factor') expect(o.product % o.known).toBe(0);
    }
  });
  it('answers are whole and at least 1', () => {
    for (const p of all) {
      expect(Number.isInteger(Number(p.answer))).toBe(true);
      expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
    }
  });
  it('never divides by 0 or 1', () => {
    for (const p of all) {
      const o = p.operands;
      if (o.kind === 'share') expect(o.parts).toBeGreaterThanOrEqual(2);
      if (o.kind === 'unknown-factor') expect(o.known).toBeGreaterThanOrEqual(2);
    }
  });
  it('level 1 stays small', () => {
    for (const p of sample(gen, 1)) {
      const o = p.operands;
      expect(o.kind === 'share' ? o.total : (o as { product: number }).product).toBeLessThanOrEqual(
        16,
      );
    }
  });
  it('the grouping story names the group size', () => {
    for (const p of all) {
      if (p.operands.kind === 'share' && p.operands.ask === 'groups') {
        expect(p.speech.params?.['each']).toBe(p.operands.parts);
      }
    }
  });
  it('stays within 100', () => {
    for (const p of all) {
      const o = p.operands;
      expect(o.kind === 'share' ? o.total : (o as { product: number }).product).toBeLessThanOrEqual(
        100,
      );
    }
  });
  it('hint draws the groups', () => {
    for (const p of sample(gen, 3, 40)) expect(p.hint.visual).toBe('groups');
  });
});
