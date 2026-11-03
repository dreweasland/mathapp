import { describe, expect, it } from 'vitest';
import { describeGenerator, sampleAll } from '../testing/harness';
import { DAY_SCENES, clockChoices, time5Min as gen } from './time5Min';

describeGenerator('2.time-5min', gen, ['clock-face', 'multiple-choice'] as const);
const all = sampleAll(gen, 400);
const clocks = all.filter((p) => p.operands.kind === 'clock');

describe('2.time-5min', () => {
  it('minutes are multiples of 5', () => {
    for (const p of clocks) expect((p.operands as { minute: number }).minute % 5).toBe(0);
  });
  it('writes minutes with two digits, as 3:05', () => {
    for (const p of clocks) expect(p.answer).toMatch(/^\d{1,2}:\d{2}$/);
    expect(clocks.some((p) => p.answer.endsWith(':05'))).toBe(true);
  });
  it('wrong clocks are valid times', () => {
    for (const p of clocks) {
      for (const c of p.choices ?? []) {
        const [h, m] = c.value.split(':').map(Number) as [number, number];
        expect(h).toBeGreaterThanOrEqual(1);
        expect(h).toBeLessThanOrEqual(12);
        expect(m).toBeLessThan(60);
      }
    }
  });
  it('clock-face questions offer three clocks', () => {
    for (const p of clocks) if (p.questionType === 'clock-face') expect(p.choices).toHaveLength(3);
  });
  it('wraps around 12 cleanly', () => {
    expect(clockChoices(12, 0, 5).map((c) => c.value)).toContain('1:00');
    expect(clockChoices(1, 0, 5).map((c) => c.value)).toContain('12:00');
  });
  it('catches reading the number the hand points to', () => {
    const swap = clockChoices(3, 20, 5).find((c) => c.errorType === 'place-value');
    expect(swap?.value).toBe('3:04');
  });
  it('never offers the right answer as a wrong one', () => {
    for (const m of [0, 5, 30, 55]) {
      expect(clockChoices(12, m, 5).map((c) => c.value)).not.toContain(
        `12:${String(m).padStart(2, '0')}`,
      );
    }
  });
  it('a.m. and p.m. questions cover both, each with a picture', () => {
    const scenes = all.filter((p) => p.operands.kind === 'am-pm');
    expect(new Set(scenes.map((p) => p.answer))).toEqual(new Set(['a.m.', 'p.m.']));
    for (const p of scenes) expect(p.picture?.scene).toBeTruthy();
  });
  it('morning scenes are a.m. and evening scenes p.m.', () => {
    const part = Object.fromEntries(DAY_SCENES.map((s) => [s.scene, s.part]));
    expect(part['breakfast']).toBe('a.m.');
    expect(part['bedtime']).toBe('p.m.');
  });
});
