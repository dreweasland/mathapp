import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import type { Problem } from '../types';
import { placeValue } from './placeValue';

describeGenerator('1.place-value', placeValue, ['number-pad', 'multiple-choice']);

const ops = (p: Problem) => p.operands as { tens: number; ones: number; ask: string };
const valueOf = (p: Problem) => ops(p).tens * 10 + ops(p).ones;

describe('1.place-value', () => {
  it('stays below 100', () => {
    for (const p of sampleAll(placeValue)) expect(valueOf(p)).toBeLessThan(100);
  });
  it('difficulty 1 stays in the teens and exactly 10', () => {
    for (const p of sample(placeValue, 1)) {
      expect(valueOf(p)).toBeGreaterThanOrEqual(10);
      expect(valueOf(p)).toBeLessThanOrEqual(19);
    }
  });
  it('difficulty 2 stays in 21–49', () => {
    for (const p of sample(placeValue, 2)) {
      expect(valueOf(p)).toBeGreaterThanOrEqual(21);
      expect(valueOf(p)).toBeLessThanOrEqual(49);
    }
  });
  it('difficulty 4 includes multiples of ten', () => {
    expect(sample(placeValue, 4).some((p) => ops(p).ones === 0)).toBe(true);
  });
  it('asking the ones of 40 answers 0', () => {
    const p = sample(placeValue, 4, 800).find((x) => ops(x).ask === 'ones' && ops(x).ones === 0);
    expect(p?.answer).toBe('0');
  });
  it('difficulty 5 always renames, with more than 9 ones', () => {
    for (const p of sample(placeValue, 5)) {
      expect(ops(p).ones).toBeGreaterThanOrEqual(10);
      expect(ops(p).ask).toBe('value');
    }
  });
  it('2 tens and 14 ones is 34, not 214', () => {
    for (const p of sample(placeValue, 5)) expect(Number(p.answer)).toBe(valueOf(p));
  });
  it('only difficulty 5 can have more than 9 ones', () => {
    for (const d of [1, 2, 3, 4] as const) {
      for (const p of sample(placeValue, d)) expect(ops(p).ones).toBeLessThanOrEqual(9);
    }
  });
  it('tags adding the digits as a place-value error', () => {
    const ps = sample(placeValue, 3, 800).filter(
      (p) => ops(p).ask === 'value' && p.questionType === 'multiple-choice',
    );
    const hit = ps.find((p) =>
      p.choices?.some((c) => Number(c.value) === ops(p).tens + ops(p).ones),
    );
    const c = hit?.choices?.find((x) => Number(x.value) === ops(hit).tens + ops(hit).ones);
    expect(c?.errorType).toBe('place-value');
  });
  it('asks value, tens and ones', () => {
    expect(new Set(sampleAll(placeValue).map((p) => ops(p).ask))).toEqual(
      new Set(['value', 'tens', 'ones']),
    );
  });
});
