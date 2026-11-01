import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import type { Problem } from '../types';
import { time } from './time';

describeGenerator('1.time', time, ['clock-face', 'multiple-choice']);

const ops = (p: Problem) => p.operands as { hour: number; minute: number };

describe('1.time', () => {
  it('hours are always 1–12', () => {
    for (const p of sampleAll(time)) {
      expect(ops(p).hour).toBeGreaterThanOrEqual(1);
      expect(ops(p).hour).toBeLessThanOrEqual(12);
    }
  });
  it('minutes are only :00 or :30', () => {
    for (const p of sampleAll(time)) expect([0, 30]).toContain(ops(p).minute);
  });
  it('covers every hour', () => {
    expect(new Set(sampleAll(time).map((p) => ops(p).hour)).size).toBe(12);
  });
  it('difficulties 1 and 2 are on the hour', () => {
    for (const d of [1, 2] as const) {
      for (const p of sample(time, d)) expect(ops(p).minute).toBe(0);
    }
  });
  it('difficulties 1 and 2 show no half-hour options', () => {
    for (const d of [1, 2] as const) {
      for (const p of sample(time, d)) {
        for (const c of p.choices ?? []) expect(c.value).toMatch(/:00$/);
      }
    }
  });
  it('difficulty 3 is half hours', () => {
    for (const p of sample(time, 3)) expect(ops(p).minute).toBe(30);
  });
  it('difficulty 4 mixes both', () => {
    expect(new Set(sample(time, 4).map((p) => ops(p).minute))).toEqual(new Set([0, 30]));
  });
  it('clock-face offers exactly 3 clocks', () => {
    for (const p of sampleAll(time)) {
      if (p.questionType === 'clock-face') expect(p.choices).toHaveLength(3);
    }
  });
  it('wraps 12 + 1 to 1 and 1 - 1 to 12, never 13 or 0', () => {
    for (const p of sampleAll(time)) {
      for (const c of p.choices ?? []) expect(c.value).toMatch(/^([1-9]|1[0-2]):(00|30)$/);
    }
  });
  it('formats on-the-hour with two zeros', () => {
    const p = sample(time, 1)[0] as Problem;
    expect(p.answer).toMatch(/^\d+:00$/);
  });
  it('speaks the hour and half-hour differently when tapping a clock', () => {
    const keys = new Set(
      sampleAll(time)
        .filter((p) => p.questionType === 'clock-face')
        .map((p) => p.speech.key),
    );
    expect(keys).toEqual(new Set(['q.time-hour', 'q.time-half']));
  });
});
