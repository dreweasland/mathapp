import { describe, expect, it } from 'vitest';
import { describeGenerator, sample, sampleAll } from '../testing/harness';
import { money as gen } from './money';
import type { Problem } from '../types';

describeGenerator('2.money', gen, ['number-pad', 'multiple-choice'] as const);
const all = sampleAll(gen, 500);
const kinds = (list: Problem[], kind: string) => list.filter((p) => p.operands.kind === kind);

describe('2.money', () => {
  it('level 1 uses only pennies and nickels', () => {
    for (const p of sample(gen, 1)) {
      for (const c of (p.operands as { items: number[] }).items) expect([1, 5]).toContain(c);
    }
  });
  it('coins total under a dollar', () => {
    for (const p of all) {
      const o = p.operands;
      if (o.kind === 'money' && o.unit === 'cents') expect(Number(p.answer)).toBeLessThan(100);
    }
  });
  it('coins are shown biggest first', () => {
    for (const p of all) {
      if (p.operands.kind !== 'money') continue;
      const { items } = p.operands;
      expect(items).toEqual([...items].sort((a, b) => b - a));
    }
  });
  it('bills count whole dollars', () => {
    const bills = all.filter((p) => p.operands.kind === 'money' && p.operands.unit === 'dollars');
    expect(bills.length).toBeGreaterThan(0);
    for (const p of bills) expect(Number.isInteger(Number(p.answer))).toBe(true);
  });
  it('change is always from one dollar, in fives', () => {
    const list = kinds(all, 'change');
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) {
      const o = p.operands as { paid: number; cost: number };
      expect(o.paid).toBe(100);
      expect(o.cost % 5).toBe(0);
      expect(o.cost).toBeLessThan(100);
    }
  });
  it('change only appears at the top level', () => {
    expect(kinds([...sample(gen, 1), ...sample(gen, 3), ...sample(gen, 4)], 'change')).toEqual([]);
  });
  it('exactly one coin choice makes the amount', () => {
    const list = kinds(all, 'make-amount');
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) {
      const { target } = p.operands as { target: number };
      const sums = (p.choices ?? []).map((c) =>
        c.value.split('+').reduce((s, x) => s + Number(x), 0),
      );
      expect(sums.filter((s) => s === target)).toHaveLength(1);
      expect(new Set(sums).size).toBe(sums.length);
    }
  });
  it('every coin is a real coin', () => {
    for (const p of all) {
      if (p.operands.kind === 'money' && p.operands.unit === 'cents') {
        for (const c of p.operands.items) expect([1, 5, 10, 25]).toContain(c);
      }
    }
  });
});
