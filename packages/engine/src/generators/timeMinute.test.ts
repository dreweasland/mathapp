import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { timeMinute as gen } from './timeMinute';

describeGenerator('3.time-minute', gen, ['clock-face', 'multiple-choice', 'number-pad'] as const);
const all = sampleAll(gen, 400);
const elapsed = all.filter((p) => p.operands.kind === 'elapsed');

describe('3.time-minute', () => {
  it('level 3 up reads to the single minute', () => {
    expect(
      sample(gen, 4, 400).some((p) => p.operands.kind === 'clock' && p.operands.minute % 5 !== 0),
    ).toBe(true);
  });
  it('levels 1 and 2 stay on fives', () => {
    for (const p of [...sample(gen, 1), ...sample(gen, 2)]) {
      if (p.operands.kind === 'clock') expect(p.operands.minute % 5).toBe(0);
    }
  });
  it('asks for the end time and the minutes passed', () => {
    const asks = new Set(elapsed.map((p) => (p.operands as { ask: string }).ask));
    expect(asks).toEqual(new Set(['end', 'minutes']));
  });
  it('end times are valid clock times', () => {
    for (const p of elapsed) {
      if ((p.operands as { ask: string }).ask !== 'end') continue;
      const [h, m] = p.answer.split(':').map(Number) as [number, number];
      expect(h).toBeGreaterThanOrEqual(1);
      expect(h).toBeLessThanOrEqual(12);
      expect(m).toBeLessThan(60);
    }
  });
  it('crosses the hour', () => {
    expect(
      elapsed.some((p) => {
        const o = p.operands as { minute: number; passed: number };
        return o.minute + o.passed >= 60;
      }),
    ).toBe(true);
  });
  it('wraps from 12 to 1', () => {
    expect(
      elapsed.some((p) => {
        const o = p.operands as { hour: number; minute: number; passed: number; ask: string };
        return (
          o.ask === 'end' && o.hour === 12 && o.minute + o.passed >= 60 && p.answer.startsWith('1:')
        );
      }),
    ).toBe(true);
  });
  it('minutes-passed speech gives both times', () => {
    for (const p of elapsed) {
      if ((p.operands as { ask: string }).ask === 'minutes') {
        expect(Object.keys(p.speech.params ?? {})).toEqual(['start', 'end']);
      }
    }
  });
  it('the hint clock shows the end time', () => {
    for (const p of elapsed) {
      const { hour, minute } = p.hint.params as { hour: number; minute: number };
      if ((p.operands as { ask: string }).ask === 'end') {
        expect(`${hour}:${String(minute).padStart(2, '0')}`).toBe(p.answer);
      }
    }
  });
});
