import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, weekDays, weekStart } from './dates';

describe('dates', () => {
  it.each([
    ['2026-01-31', 1, '2026-02-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2027-02-28', 1, '2027-03-01'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2026-03-07', 2, '2026-03-09'], // across US daylight saving
    ['2026-10-31', 2, '2026-11-02'],
  ])('addDays(%s, %i) is %s', (from, n, to) => {
    expect(addDays(from, n)).toBe(to);
  });
  it('counts whole days across daylight saving and years', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-01-02', '2026-01-01')).toBe(-1);
  });
  it('weeks start on Monday', () => {
    expect(weekStart('2026-11-02')).toBe('2026-11-02'); // a Monday
    expect(weekStart('2026-11-08')).toBe('2026-11-02'); // a Sunday
    expect(weekStart('2026-11-01')).toBe('2026-10-26'); // a Sunday
  });
  it('lists seven days across a year boundary', () => {
    const days = weekDays('2027-01-01');
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-12-28');
    expect(days[6]).toBe('2027-01-03');
  });
});
