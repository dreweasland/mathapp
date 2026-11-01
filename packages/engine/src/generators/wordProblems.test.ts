import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import type { Problem } from '../types';
import { WORD_SCENES, wordProblems } from './wordProblems';

describeGenerator('1.word-problems', wordProblems, ['multiple-choice', 'number-pad']);

const ops = (p: Problem) => p.operands as { op: string; a: number; b: number };
const form = (p: Problem) => p.speech.key.split('.')[2];

describe('1.word-problems', () => {
  it('always has a picture', () => {
    for (const p of sampleAll(wordProblems)) expect(p.picture).toBeDefined();
  });
  it('the picture counts match the numbers', () => {
    for (const p of sampleAll(wordProblems)) {
      expect(p.picture?.counts).toEqual([ops(p).a, ops(p).b]);
    }
  });
  it('the scene belongs to the story type', () => {
    for (const p of sampleAll(wordProblems)) {
      expect(WORD_SCENES[form(p) as keyof typeof WORD_SCENES]).toContain(p.picture?.scene);
    }
  });
  it('take-from stories subtract; the others add', () => {
    for (const p of sampleAll(wordProblems)) {
      expect(ops(p).op).toBe(form(p) === 'take-from' ? 'sub' : 'add');
    }
  });
  it('uses all three story types', () => {
    expect(new Set(sampleAll(wordProblems).map(form))).toEqual(
      new Set(['add-to', 'take-from', 'put-together']),
    );
  });
  it('take-from never takes away more than there are', () => {
    for (const p of sampleAll(wordProblems)) {
      if (ops(p).op === 'sub') expect(ops(p).b).toBeLessThan(ops(p).a);
    }
  });
  it('take-from always leaves at least one', () => {
    for (const p of sampleAll(wordProblems)) expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
  });
  it('every story has at least one of each thing', () => {
    for (const p of sampleAll(wordProblems)) {
      expect(ops(p).a).toBeGreaterThan(0);
      expect(ops(p).b).toBeGreaterThan(0);
    }
  });
  it.each([
    [1, 5],
    [2, 10],
    [3, 10],
    [4, 20],
    [5, 20],
  ] as const)('difficulty %i keeps totals at or below %i', (d, limit) => {
    for (const p of sample(wordProblems, d)) {
      expect(Math.max(ops(p).a, Number(p.answer))).toBeLessThanOrEqual(limit);
    }
  });
  it('difficulty 4 addition crosses 10', () => {
    for (const p of sample(wordProblems, 4)) {
      if (ops(p).op === 'add') expect(Number(p.answer)).toBeGreaterThan(10);
    }
  });
});
