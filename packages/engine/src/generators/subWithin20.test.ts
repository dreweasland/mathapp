import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import type { Problem } from '../types';
import { subWithin20 } from './subWithin20';

const TYPES = ['number-pad', 'multiple-choice', 'number-line'] as const;
describeGenerator('1.sub-within-20', subWithin20, TYPES);

const arith = (ps: Problem[]) =>
  ps.flatMap((p) => (p.operands.kind === 'arith' ? [p.operands] : []));

describe('1.sub-within-20', () => {
  it('never produces a negative result', () => {
    for (const p of sampleAll(subWithin20)) expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
  });
  it('difficulty 1 never crosses 10', () => {
    for (const { a, b } of arith(sample(subWithin20, 1))) {
      expect(a - b).toBeGreaterThanOrEqual(10);
    }
  });
  it('difficulty 1 starts with a teen', () => {
    for (const { a } of arith(sample(subWithin20, 1))) {
      expect(a).toBeGreaterThanOrEqual(11);
      expect(a).toBeLessThanOrEqual(19);
    }
  });
  it('difficulty 2 lands on a ten or takes away 10', () => {
    for (const { a, b } of arith(sample(subWithin20, 2))) {
      expect(b === 10 || (a - b) % 10 === 0).toBe(true);
    }
  });
  it('difficulty 3 always decomposes through 10', () => {
    for (const { a, b } of arith(sample(subWithin20, 3))) {
      expect(a).toBeGreaterThan(10);
      expect(a - b).toBeLessThan(10);
    }
  });
  it('difficulty 4 is unknown addend', () => {
    for (const p of sample(subWithin20, 4)) expect(p.operands.kind).toBe('missing-addend');
  });
  it('unknown addend: known + answer = whole', () => {
    for (const p of sampleAll(subWithin20)) {
      if (p.operands.kind === 'missing-addend') {
        expect(p.operands.known + Number(p.answer)).toBe(p.operands.whole);
      }
    }
  });
  it('unknown addend keeps both addends at 10 or less, so it is always a fact', () => {
    for (const p of sample(subWithin20, 4)) {
      expect(p.factId).toBeDefined();
      expect(Number(p.answer)).toBeLessThanOrEqual(10);
    }
  });
  it('difficulty 5 mixes subtraction and unknown addend', () => {
    expect(new Set(sample(subWithin20, 5).map((p) => p.operands.kind))).toEqual(
      new Set(['arith', 'missing-addend']),
    );
  });
  it('covers the 20 - 20 and 20 - 0 edges', () => {
    const facts = sample(subWithin20, 5, 4000).map((p) => (p.operands as { a: number }).a);
    expect(facts).toContain(20);
    expect(sample(subWithin20, 5, 4000).some((p) => p.answer === '0')).toBe(true);
    expect(sample(subWithin20, 5, 4000).some((p) => p.answer === '20')).toBe(true);
  });
  it('20 - 3 is not a fact because 17 is above 10', () => {
    const big = sample(subWithin20, 5, 4000).find(
      (p) => p.operands.kind === 'arith' && Number(p.answer) > 10,
    );
    expect(big?.factId).toBeUndefined();
  });
});
