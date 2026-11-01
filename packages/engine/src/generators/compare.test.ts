import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import type { Problem } from '../types';
import { compare } from './compare';

describeGenerator('1.compare', compare, ['compare', 'multiple-choice']);

const ops = (p: Problem) => p.operands as { a: number; b: number; form: string };

describe('1.compare', () => {
  it('uses two-digit numbers only', () => {
    for (const p of sampleAll(compare)) {
      for (const n of [ops(p).a, ops(p).b]) {
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThanOrEqual(99);
      }
    }
  });
  it('tap answer points at the bigger number', () => {
    for (const p of sampleAll(compare)) {
      if (ops(p).form !== 'tap') continue;
      const { a, b } = ops(p);
      expect(p.answer).toBe(a === b ? 'same' : a > b ? 'left' : 'right');
    }
  });
  it('symbol answer makes a true statement', () => {
    for (const p of sampleAll(compare)) {
      if (ops(p).form !== 'symbol') continue;
      const { a, b } = ops(p);
      const truth = p.answer === '>' ? a > b : p.answer === '<' ? a < b : a === b;
      expect(truth).toBe(true);
    }
  });
  it('tap always offers left, right and same', () => {
    for (const p of sampleAll(compare)) {
      if (p.questionType === 'compare') {
        expect(p.choices?.map((c) => c.value).sort()).toEqual(['left', 'right', 'same']);
      }
    }
  });
  it('symbol always offers >, < and =', () => {
    for (const p of sampleAll(compare)) {
      if (p.questionType === 'multiple-choice') {
        expect(p.choices?.map((c) => c.value).sort()).toEqual(['<', '=', '>']);
      }
    }
  });
  it.each([1, 2, 3, 4, 5] as const)('difficulty %i includes equal pairs', (d) => {
    expect(sample(compare, d).some((p) => ops(p).a === ops(p).b)).toBe(true);
  });
  it('difficulty 1 has a clear gap unless equal', () => {
    for (const p of sample(compare, 1)) {
      const gap = Math.abs(ops(p).a - ops(p).b);
      expect(gap === 0 || gap >= 5).toBe(true);
    }
  });
  it('difficulty 3 shares a tens digit unless equal', () => {
    for (const p of sample(compare, 3)) {
      expect(Math.floor(ops(p).a / 10)).toBe(Math.floor(ops(p).b / 10));
    }
  });
  it('difficulty 4 uses reversed digits unless equal', () => {
    for (const p of sample(compare, 4)) {
      const { a, b } = ops(p);
      if (a !== b) expect((b % 10) * 10 + Math.floor(b / 10)).toBe(a);
    }
  });
  it('bigger number appears on both sides', () => {
    expect(new Set(sampleAll(compare).map((p) => p.answer))).toEqual(
      new Set(['left', 'right', 'same', '>', '<', '=']),
    );
  });
});
