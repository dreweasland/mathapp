import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { placeValue1000 as gen } from './placeValue1000';
import type { Problem } from '../types';

describeGenerator('2.place-value-1000', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen);
type Pv = { kind: 'place-value-3'; hundreds: number; tens: number; ones: number; ask: string };
type Skip = { kind: 'skip'; from: number; step: number };
const pv = (list: Problem[]) =>
  list.map((p) => p.operands).filter((o) => o.kind === 'place-value-3') as Pv[];
const skips = (list: Problem[]) =>
  list.map((p) => p.operands).filter((o) => o.kind === 'skip') as Skip[];

describe('2.place-value-1000', () => {
  it('uses three-digit numbers with digits 0–9', () => {
    for (const o of pv(all)) {
      expect(o.hundreds).toBeGreaterThanOrEqual(1);
      expect(o.hundreds).toBeLessThanOrEqual(9);
      expect(o.tens).toBeLessThanOrEqual(9);
      expect(o.ones).toBeLessThanOrEqual(9);
    }
  });
  it('level 1 only asks about digits', () => {
    for (const o of pv(sample(gen, 1))) expect(o.ask).not.toBe('value');
  });
  it('level 3 up tests zero in the tens place', () => {
    expect(pv(sample(gen, 3, 800)).some((o) => o.tens === 0 && o.ask === 'value')).toBe(true);
  });
  it('tests zero ones', () => {
    expect(pv(sample(gen, 4, 800)).some((o) => o.ones === 0)).toBe(true);
  });
  it('skip counts by 5, 10 and 100', () => {
    const sizes = new Set(skips(sampleAll(gen, 800)).map((o) => Math.abs(o.step)));
    expect(sizes).toEqual(new Set([5, 10, 100]));
  });
  it('skip counting stays between 0 and 1000', () => {
    for (const o of skips(sampleAll(gen, 800))) {
      expect(o.from + o.step).toBeGreaterThanOrEqual(0);
      expect(o.from + o.step).toBeLessThanOrEqual(1000);
    }
  });
  it('always starts on a multiple of the step', () => {
    for (const o of skips(all)) expect(o.from % Math.abs(o.step)).toBe(0);
  });
  it('counts back only at level 4 up', () => {
    for (const o of skips([...sample(gen, 1), ...sample(gen, 3)]))
      expect(o.step).toBeGreaterThan(0);
    expect(skips(sample(gen, 5, 800)).some((o) => o.step < 0)).toBe(true);
  });
});
