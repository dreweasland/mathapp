import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import type { Problem } from '../types';
import { addSub10s } from './addSub10s';

describeGenerator('1.add-sub-10s', addSub10s, ['number-pad', 'multiple-choice']);

const ops = (p: Problem) => p.operands as { op: string; a: number; b: number };

describe('1.add-sub-10s', () => {
  it('results stay within 0–100', () => {
    for (const p of sampleAll(addSub10s)) {
      expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
      expect(Number(p.answer)).toBeLessThanOrEqual(100);
    }
  });
  it('the second number is always a multiple of 10', () => {
    for (const p of sampleAll(addSub10s)) expect(ops(p).b % 10).toBe(0);
  });
  it('the second number is never 0', () => {
    for (const p of sampleAll(addSub10s)) expect(ops(p).b).toBeGreaterThan(0);
  });
  it('difficulty 1 is add 10', () => {
    for (const p of sample(addSub10s, 1)) expect(ops(p)).toMatchObject({ op: 'add', b: 10 });
  });
  it('difficulty 2 adds two multiples of 10', () => {
    for (const p of sample(addSub10s, 2)) {
      expect(ops(p).op).toBe('add');
      expect(ops(p).a % 10).toBe(0);
    }
  });
  it('difficulty 3 subtracts two multiples of 10', () => {
    for (const p of sample(addSub10s, 3)) {
      expect(ops(p).op).toBe('sub');
      expect(ops(p).a % 10).toBe(0);
    }
  });
  it('reaches the 100 boundary', () => {
    expect(sample(addSub10s, 2, 1000).some((p) => p.answer === '100')).toBe(true);
  });
  it('includes 100 - 100 = 0', () => {
    expect(sample(addSub10s, 3, 2000).some((p) => p.answer === '0')).toBe(true);
  });
  it('difficulty 4 mixes add and subtract', () => {
    expect(new Set(sample(addSub10s, 4).map((p) => ops(p).op))).toEqual(new Set(['add', 'sub']));
  });
  it('difficulty 5 keeps the ones digit unchanged', () => {
    for (const p of sample(addSub10s, 5)) {
      expect(ops(p).a % 10).toBeGreaterThan(0);
      expect(Number(p.answer) % 10).toBe(ops(p).a % 10);
    }
  });
  it('answers at difficulty 1–4 are always multiples of 10', () => {
    for (const d of [1, 2, 3, 4] as const) {
      for (const p of sample(addSub10s, d)) expect(Number(p.answer) % 10).toBe(0);
    }
  });
});
