/* eslint-disable no-restricted-globals -- Date is used here only for calendar math, never to read the clock. */
import type { LocalDate } from './state';

/**
 * Calendar arithmetic on `YYYY-MM-DD` strings. Everything runs in UTC on purpose: a
 * calendar day has no timezone here, so daylight saving can't shift a date by one.
 */
const MS_PER_DAY = 86_400_000;

const toUtc = (date: LocalDate): number => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
};

const fromUtc = (ms: number): LocalDate => new Date(ms).toISOString().slice(0, 10);

export const addDays = (date: LocalDate, days: number): LocalDate =>
  fromUtc(toUtc(date) + days * MS_PER_DAY);

/** Whole days from `a` to `b`; negative if `b` is earlier. */
export const daysBetween = (a: LocalDate, b: LocalDate): number =>
  Math.round((toUtc(b) - toUtc(a)) / MS_PER_DAY);

/** The Monday of the week containing `date`. */
export function weekStart(date: LocalDate): LocalDate {
  const weekday = new Date(toUtc(date)).getUTCDay(); // 0 is Sunday
  return addDays(date, -((weekday + 6) % 7));
}

export const weekDays = (date: LocalDate): LocalDate[] => {
  const monday = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};
