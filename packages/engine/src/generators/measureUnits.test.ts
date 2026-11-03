import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { OBJECT_SIZES, measureUnits as gen } from './measureUnits';

describeGenerator('2.measure-units', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen, 400);

describe('2.measure-units', () => {
  it('uses inches and centimeters', () => {
    const units = new Set(all.map((p) => (p.operands as { unit: string }).unit));
    expect(units).toEqual(new Set(['in', 'cm']));
  });
  it('rulers show at least 1 unit', () => {
    for (const p of all) expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
  });
  it('inches stay short enough for a phone screen', () => {
    for (const p of all) {
      if (p.operands.kind === 'ruler' && p.operands.unit === 'in') {
        expect(p.operands.length).toBeLessThanOrEqual(9);
      }
    }
  });
  it('levels 1 and 2 only measure', () => {
    for (const p of [...sample(gen, 1), ...sample(gen, 2)]) expect(p.operands.kind).toBe('ruler');
  });
  it('estimates match the size table', () => {
    for (const p of all) {
      if (p.operands.kind !== 'estimate') continue;
      const { object, unit, actual } = p.operands;
      expect(actual).toBe((OBJECT_SIZES[object] as Record<string, number>)[unit]);
    }
  });
  it('estimate choices are far apart', () => {
    for (const p of all.filter((x) => x.operands.kind === 'estimate')) {
      const values = (p.choices ?? []).map((c) => Number(c.value)).sort((a, b) => a - b);
      expect((values[1] as number) / (values[0] as number)).toBeGreaterThanOrEqual(3);
    }
  });
  it('a centimeter measure is larger than the same thing in inches', () => {
    for (const size of Object.values(OBJECT_SIZES)) expect(size.cm).toBeGreaterThan(size.in);
  });
  it('estimates always have a picture', () => {
    for (const p of all.filter((x) => x.operands.kind === 'estimate'))
      expect(p.picture).toBeDefined();
  });
});
