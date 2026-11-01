import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import type { Problem } from '../types';
import { measure } from './measure';

describeGenerator('1.measure', measure, ['compare', 'multiple-choice']);

const ops = (p: Problem) => p.operands as { lengths: number[]; ask: string };

describe('1.measure', () => {
  it('lengths in a problem are always different', () => {
    for (const p of sampleAll(measure)) {
      expect(new Set(ops(p).lengths).size).toBe(ops(p).lengths.length);
    }
  });
  it('lengths are positive', () => {
    for (const p of sampleAll(measure)) {
      for (const n of ops(p).lengths) expect(n).toBeGreaterThan(0);
    }
  });
  it.each([
    [1, 5],
    [2, 4],
    [3, 3],
    [4, 2],
    [5, 1],
  ] as const)('difficulty %i keeps a gap of at least %i', (d, gap) => {
    for (const p of sample(measure, d)) {
      const sorted = [...ops(p).lengths].sort((x, y) => x - y);
      for (let i = 1; i < sorted.length; i++) {
        expect((sorted[i] as number) - (sorted[i - 1] as number)).toBeGreaterThanOrEqual(gap);
      }
    }
  });
  it('compare has two objects; multiple choice has three', () => {
    for (const p of sampleAll(measure)) {
      expect(ops(p).lengths).toHaveLength(p.questionType === 'compare' ? 2 : 3);
    }
  });
  it('compare tap has only left and right, since lengths are never equal', () => {
    for (const p of sampleAll(measure)) {
      if (p.questionType === 'compare') {
        expect(p.choices?.map((c) => c.value).sort()).toEqual(['left', 'right']);
      }
    }
  });
  it('"longest" points to the biggest length', () => {
    for (const p of sampleAll(measure)) {
      if (p.questionType !== 'multiple-choice' || ops(p).ask !== 'longest') continue;
      expect(ops(p).lengths[Number(p.answer)]).toBe(Math.max(...ops(p).lengths));
    }
  });
  it('"shortest" points to the smallest length', () => {
    for (const p of sampleAll(measure)) {
      if (p.questionType !== 'multiple-choice' || ops(p).ask !== 'shortest') continue;
      expect(ops(p).lengths[Number(p.answer)]).toBe(Math.min(...ops(p).lengths));
    }
  });
  it('"middle" only appears from difficulty 4 and has the middle length', () => {
    for (const p of sampleAll(measure)) {
      if (ops(p).ask !== 'middle') continue;
      expect(p.difficulty).toBeGreaterThanOrEqual(4);
      const sorted = [...ops(p).lengths].sort((x, y) => x - y);
      expect(ops(p).lengths[Number(p.answer)]).toBe(sorted[1]);
    }
  });
  it('every problem is visual, with a picture of the lengths', () => {
    for (const p of sampleAll(measure)) {
      expect(p.picture?.counts).toEqual(ops(p).lengths);
      expect(p.picture?.scene).toMatch(/^lengths:/);
    }
  });
  it('the picture names one object per length, with no repeats', () => {
    for (const p of sampleAll(measure)) {
      const names = p.picture?.scene.replace('lengths:', '').split(',') ?? [];
      expect(names).toHaveLength(ops(p).lengths.length);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
