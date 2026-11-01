import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import type { Problem } from '../types';
import { tenFrame } from './tenFrame';

describeGenerator('1.ten-frame', tenFrame, ['ten-frame', 'multiple-choice', 'number-pad']);

const kinds = (ps: Problem[]) => new Set(ps.map((p) => p.operands.kind));

describe('1.ten-frame', () => {
  it('difficulty 1 only subitizes 0–5', () => {
    for (const p of sample(tenFrame, 1)) {
      expect(p.operands.kind).toBe('count');
      expect(Number(p.answer)).toBeLessThanOrEqual(5);
    }
  });
  it('difficulty 2 subitizes up to exactly 10', () => {
    const values = sample(tenFrame, 2, 800).map((p) => Number(p.answer));
    expect(Math.max(...values)).toBe(10);
  });
  it('includes an empty frame (0)', () => {
    expect(sample(tenFrame, 2, 800).some((p) => p.answer === '0')).toBe(true);
  });
  it('difficulty 3 makes 10 from 5–9', () => {
    for (const p of sample(tenFrame, 3)) {
      expect(p.operands.kind).toBe('missing-addend');
      expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
      expect(Number(p.answer)).toBeLessThanOrEqual(5);
    }
  });
  it('difficulty 4 mixes both tasks', () => {
    expect(kinds(sample(tenFrame, 4))).toEqual(new Set(['count', 'missing-addend']));
  });
  it('difficulty 5 includes 0 + 10 and 10 + 0 edges', () => {
    const answers = new Set(sample(tenFrame, 5, 800).map((p) => p.answer));
    expect(answers).toContain('0');
    expect(answers).toContain('10');
  });
  it('known + answer always makes 10', () => {
    for (const p of sampleAll(tenFrame)) {
      if (p.operands.kind === 'missing-addend') {
        expect(p.operands.known + Number(p.answer)).toBe(10);
      }
    }
  });
  it('the frame shown matches the task', () => {
    for (const p of sampleAll(tenFrame)) {
      const o = p.operands;
      if (o.kind === 'missing-addend') expect(p.tenFrame?.filled).toBe(o.known);
      else if (o.kind === 'count' && p.questionType !== 'ten-frame') {
        expect(p.tenFrame?.filled).toBe(o.value);
      }
    }
  });
  it('a tap-to-fill subitize starts with an empty frame', () => {
    for (const p of sample(tenFrame, 1)) {
      if (p.questionType === 'ten-frame') expect(p.tenFrame?.filled).toBe(0);
    }
  });
  it('choices stay within 0–10', () => {
    for (const p of sampleAll(tenFrame)) {
      for (const c of p.choices ?? []) expect(Number(c.value)).toBeLessThanOrEqual(10);
    }
  });
});
