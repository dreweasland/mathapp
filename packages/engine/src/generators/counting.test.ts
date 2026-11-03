import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, describeGenerator, sample, sampleAll } from '../testing/harness';
import { counting } from './counting';

describeGenerator('1.counting', counting, ['number-pad', 'multiple-choice', 'number-line']);

const numbers = (p: ReturnType<typeof counting>) => {
  const o = p.operands;
  return o.kind === 'sequence' ? [o.from, o.from + o.step] : o.kind === 'numeral' ? [o.value] : [];
};

describe('1.counting', () => {
  it.each([
    [1, 20],
    [2, 40],
    [3, 80],
    [4, 100],
    [5, 120],
  ] as const)('difficulty %i stays at or below %i', (d, top) => {
    expect(Math.max(...sample(counting, d, 500).flatMap(numbers))).toBeLessThanOrEqual(top);
  });
  it('never asks what comes after 120', () => {
    for (const p of sample(counting, 5, 3000)) expect(Number(p.answer)).toBeLessThanOrEqual(120);
  });
  it('reaches exactly 120 at the top difficulty', () => {
    expect(sample(counting, 5, 3000).some((p) => p.answer === '120')).toBe(true);
  });
  it('never asks what comes before 0', () => {
    for (const p of sampleAll(counting, 500)) expect(Number(p.answer)).toBeGreaterThanOrEqual(0);
  });
  it('can ask what comes before 1, whose answer is 0', () => {
    expect(sampleAll(counting, 1000).some((p) => p.answer === '0')).toBe(true);
  });
  it('asks both next and previous', () => {
    const keys = new Set(sampleAll(counting).map((p) => p.speech.key));
    expect(keys).toEqual(new Set(['q.next', 'q.previous', 'q.find-number']));
  });
  it('number lines span 10 and fit within 0–120', () => {
    for (const p of sampleAll(counting, 500)) {
      if (!p.numberLine) continue;
      expect(p.numberLine.max - p.numberLine.min).toBe(10);
      expect(p.numberLine.min).toBeGreaterThanOrEqual(0);
      expect(p.numberLine.max).toBeLessThanOrEqual(120);
    }
  });
  it('choices stay within 0–120', () => {
    for (const d of DIFFICULTIES) {
      for (const p of sample(counting, d, 500)) {
        for (const c of p.choices ?? []) {
          expect(Number(c.value)).toBeGreaterThanOrEqual(0);
          expect(Number(c.value)).toBeLessThanOrEqual(120);
        }
      }
    }
  });
  it('tags the reversed direction as a reversed-operation choice', () => {
    const tagged = sampleAll(counting).filter((p) =>
      p.choices?.some((c) => c.errorType === 'reversed-operation'),
    );
    expect(tagged.length).toBeGreaterThan(0);
  });
});
