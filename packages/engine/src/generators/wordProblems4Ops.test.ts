import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { wordProblems4Ops as gen } from './wordProblems4Ops';

describeGenerator('3.word-problems-4ops', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
type T = { a: number; b: number; c: number; first: string; second: string };
const ops = all.map((p) => p.operands as T);

describe('3.word-problems-4ops', () => {
  it('always has a picture', () => {
    for (const p of all) expect(p.picture).toBeDefined();
  });
  it('uses all four operations across stories', () => {
    expect(new Set(ops.flatMap((o) => [o.first, o.second]))).toEqual(
      new Set(['add', 'sub', 'mul', 'div']),
    );
  });
  it('division always comes out even', () => {
    for (const o of ops) {
      if (o.second !== 'div') continue;
      const middle = o.first === 'add' ? o.a + o.b : o.a - o.b;
      expect(middle % o.c).toBe(0);
    }
  });
  it('answers are whole and not negative', () => {
    for (const p of all) {
      expect(Number.isInteger(Number(p.answer))).toBe(true);
      expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
    }
  });
  it('multiplying first stays at 100 or under', () => {
    for (const o of ops) if (o.first === 'mul') expect(o.a * o.b).toBeLessThanOrEqual(100);
  });
  it('apple stories leave at least one', () => {
    for (const p of all)
      if (p.speech.key.endsWith('apple-bags')) expect(Number(p.answer)).toBeGreaterThan(0);
  });
  it('wrong choices include stopping after step one', () => {
    const tagged = all.filter((p) => p.choices?.some((c) => c.errorType === 'other'));
    expect(tagged.length).toBeGreaterThan(0);
  });
  it('level 1 keeps the numbers small', () => {
    for (const p of sample(gen, 1)) expect(Number(p.answer)).toBeLessThanOrEqual(30);
  });
});
