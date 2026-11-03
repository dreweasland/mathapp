import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { wordProblems2Step as gen } from './wordProblems2Step';

describeGenerator('2.word-problems-2step', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
const twoStep = all.filter((p) => p.operands.kind === 'two-step');
type Two = { a: number; b: number; c: number; first: string; second: string };

describe('2.word-problems-2step', () => {
  it('always has a picture', () => {
    for (const p of all) expect(p.picture).toBeDefined();
  });
  it('levels 1 and 2 are one step', () => {
    for (const p of [...sample(gen, 1), ...sample(gen, 2)]) expect(p.operands.kind).toBe('arith');
  });
  it('level 3 up has two steps', () => {
    for (const p of sample(gen, 3)) expect(p.operands.kind).toBe('two-step');
  });
  it('never goes below zero or past 100 at any step', () => {
    for (const p of twoStep) {
      const o = p.operands as Two;
      const middle = o.first === 'add' ? o.a + o.b : o.a - o.b;
      const end = o.second === 'add' ? middle + o.c : middle - o.c;
      for (const n of [o.a, middle, end]) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(100);
      }
    }
  });
  it('one-step answers stay within 100', () => {
    for (const p of [...sample(gen, 1), ...sample(gen, 2)]) {
      expect(Number(p.answer)).toBeLessThanOrEqual(100);
    }
  });
  it('wrong choices include stopping after step one', () => {
    let found = 0;
    for (const p of twoStep) {
      const o = p.operands as Two;
      const middle = o.first === 'add' ? o.a + o.b : o.a - o.b;
      if (p.choices?.some((c) => c.value === String(middle))) found++;
    }
    expect(found).toBeGreaterThan(0);
  });
  it('story numbers reach the speech', () => {
    for (const p of twoStep) expect(Object.keys(p.speech.params ?? {})).toEqual(['a', 'b', 'c']);
  });
  it('picture counts match the numbers', () => {
    for (const p of twoStep) {
      const o = p.operands as Two;
      expect(p.picture?.counts).toEqual([o.a, o.b, o.c]);
    }
  });
});
