import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { mulberry32 } from './rng';
import type { Streak } from './state';
import {
  completeQuest,
  grantShield,
  MAX_SHIELDS,
  newStreak,
  reconcileStreak,
  type StreakEvent,
} from './streak';

const MONDAY = '2026-11-02';
const days = (s: Streak, from: string, n: number): Streak => {
  let out = s;
  for (let i = 0; i < n; i++) out = completeQuest(out, addDays(from, i), i).streak;
  return out;
};
const types = (events: StreakEvent[]) => events.map((e) => e.type);
const run = (n: number) => days(newStreak('c'), MONDAY, n);

describe('completeQuest', () => {
  it('starts at 1 with a first-day event', () => {
    const { streak, events } = completeQuest(newStreak('c'), MONDAY, 1);
    expect(streak).toMatchObject({ current: 1, best: 1, lastCountedDate: MONDAY });
    expect(types(events)).toEqual(['first-day']);
  });
  it('adds a day for each consecutive quest', () => {
    expect(run(5)).toMatchObject({ current: 5, best: 5 });
  });
  it('a second quest the same day changes nothing', () => {
    const s = run(1);
    expect(completeQuest(s, MONDAY, 9)).toEqual({ streak: s, events: [] });
  });
  it('a clock set backward changes nothing', () => {
    const s = run(3);
    expect(completeQuest(s, '2026-01-01', 9)).toEqual({ streak: s, events: [] });
  });
  it('carries across month and year ends', () => {
    expect(days(newStreak('c'), '2026-12-30', 4).current).toBe(4);
  });
  it('carries across a leap day', () => {
    expect(days(newStreak('c'), '2028-02-28', 3).current).toBe(3);
  });
  it('carries across both daylight-saving changes', () => {
    expect(days(newStreak('c'), '2026-03-07', 3).current).toBe(3);
    expect(days(newStreak('c'), '2026-10-31', 3).current).toBe(3);
  });
  it.each([3, 7, 14, 30, 60, 100])('celebrates the %i-day milestone', (n) => {
    const s = run(n - 1);
    const { events } = completeQuest(s, addDays(MONDAY, n - 1), 1);
    expect(events).toContainEqual({ type: 'milestone', days: n, isNewBest: true });
  });
  it('has no milestone on ordinary days', () => {
    const { events } = completeQuest(run(3), addDays(MONDAY, 3), 1);
    expect(types(events)).toEqual(['grew']);
  });
  it('marks a repeat milestone as not a new best', () => {
    const broken = reconcileStreak(run(10), '2026-12-01', 1).streak;
    const second = days(broken, '2026-12-01', 2);
    const { events } = completeQuest(second, '2026-12-03', 2);
    expect(events).toContainEqual({ type: 'milestone', days: 3, isNewBest: false });
  });
});

describe('shields', () => {
  it('the first shield arrives on day 7', () => {
    expect(run(6).shields).toBe(0);
    expect(run(7).shields).toBe(1);
  });
  it('earns one more at 14', () => {
    expect(run(14).shields).toBe(2);
  });
  it('banks at most 2, with no message past the cap', () => {
    const s = run(20);
    const { streak, events } = completeQuest(s, addDays(MONDAY, 20), 1);
    expect(run(21).shields).toBe(2);
    expect(streak.shields).toBe(2);
    expect(types(events)).not.toContain('shield-earned');
  });
  it('one missed day uses one shield automatically and keeps the streak', () => {
    const { streak, events } = reconcileStreak(run(7), addDays(MONDAY, 8), 1);
    expect(streak).toMatchObject({ current: 7, shields: 0 });
    expect(events).toEqual([{ type: 'shielded', days: 1 }]);
  });
  it('a shielded day preserves the streak but does not add to it', () => {
    const s = run(7);
    const { streak } = completeQuest(s, addDays(MONDAY, 8), 1);
    expect(streak.current).toBe(8);
  });
  it('two missed days use two shields', () => {
    const { streak } = reconcileStreak(run(14), addDays(MONDAY, 16), 1);
    expect(streak).toMatchObject({ current: 14, shields: 0 });
  });
  it('a gap too long to save keeps the shields', () => {
    const { streak, events } = reconcileStreak(run(14), addDays(MONDAY, 17), 1);
    expect(streak).toMatchObject({ current: 0, shields: 2, best: 14 });
    expect(events).toEqual([{ type: 'new-streak', best: 14 }]);
  });
  it('reopening the app the same day cannot use a shield twice', () => {
    const once = reconcileStreak(run(14), addDays(MONDAY, 15), 1).streak;
    const twice = reconcileStreak(once, addDays(MONDAY, 15), 2);
    expect(twice.streak).toBe(once);
    expect(twice.events).toEqual([]);
  });
  it('a shielded gap followed by another gap is measured from the covered day', () => {
    const covered = reconcileStreak(run(14), addDays(MONDAY, 15), 1).streak;
    const { streak } = reconcileStreak(covered, addDays(MONDAY, 16), 2);
    expect(streak).toMatchObject({ current: 14, shields: 0 });
    const tooLong = reconcileStreak(covered, addDays(MONDAY, 17), 2);
    expect(tooLong.streak).toMatchObject({ current: 0, shields: 1 });
  });
  it('opening the day after a quest settles nothing', () => {
    const s = run(7);
    expect(reconcileStreak(s, addDays(MONDAY, 7), 1)).toEqual({ streak: s, events: [] });
  });
  it('a parent can grant a shield, within the cap', () => {
    const one = grantShield(newStreak('c'), 1);
    expect(one).toMatchObject({ shields: 1, parentShields: 1 });
    const full = grantShield(one, 2);
    expect(full.shields).toBe(MAX_SHIELDS);
    expect(grantShield(full, 3)).toBe(full);
  });
});

describe('a missed day with no shield', () => {
  it('starts a new streak with the warm event and keeps the best', () => {
    const { streak, events } = reconcileStreak(run(5), addDays(MONDAY, 6), 1);
    expect(streak).toMatchObject({ current: 0, best: 5 });
    expect(events).toEqual([{ type: 'new-streak', best: 5 }]);
  });
  it('fires the message once', () => {
    const { streak } = reconcileStreak(run(5), addDays(MONDAY, 6), 1);
    expect(reconcileStreak(streak, addDays(MONDAY, 7), 2).events).toEqual([]);
  });
  it('the next quest makes the streak 1', () => {
    const { streak, events } = completeQuest(run(5), addDays(MONDAY, 6), 1);
    expect(streak).toMatchObject({ current: 1, best: 5 });
    expect(types(events)).toEqual(['new-streak', 'grew']);
  });
  it('restarting after a one-day best is not announced as a first day', () => {
    const { events } = completeQuest(run(1), addDays(MONDAY, 3), 1);
    expect(types(events)).toEqual(['new-streak', 'grew']);
  });
  it('keeps earned Perfect Weeks', () => {
    const s = reconcileStreak(run(7), '2027-01-01', 1).streak;
    expect(s.perfectWeeks).toEqual([MONDAY]);
  });
  it('a brand-new streak record has nothing to settle', () => {
    const s = newStreak('c');
    expect(reconcileStreak(s, MONDAY, 1)).toEqual({ streak: s, events: [] });
  });
});

describe('Perfect Week', () => {
  it('needs all seven days, Monday to Sunday', () => {
    expect(run(6).perfectWeeks).toEqual([]);
    const { streak, events } = completeQuest(run(6), addDays(MONDAY, 6), 1);
    expect(streak.perfectWeeks).toEqual([MONDAY]);
    expect(events).toContainEqual({ type: 'perfect-week', weekOf: MONDAY });
  });
  it('seven days across two calendar weeks is not perfect', () => {
    const s = days(newStreak('c'), addDays(MONDAY, 3), 7);
    expect(s.perfectWeeks).toEqual([]);
  });
  it('awards each week once, then the next', () => {
    expect(run(14).perfectWeeks).toEqual([MONDAY, addDays(MONDAY, 7)]);
  });
  it('an automatic shield day does not count', () => {
    let s = run(7); // Mon–Sun, one earned shield
    s = days(s, addDays(MONDAY, 7), 2); // Mon, Tue
    s = days(s, addDays(MONDAY, 10), 4); // Thu–Sun, after a shielded Wed
    expect(s.current).toBe(13);
    expect(s.perfectWeeks).toEqual([MONDAY]);
  });
  it('a parent-granted day does count', () => {
    let s = grantShield(days(newStreak('c'), MONDAY, 2), 1); // Mon, Tue
    s = days(s, addDays(MONDAY, 3), 4); // Thu–Sun, after an excused Wed
    expect(s.excusedDates).toEqual([addDays(MONDAY, 2)]);
    expect(s.perfectWeeks).toEqual([MONDAY]);
  });
  it('a parent-granted Sunday completes the week when settled on Monday', () => {
    const six = grantShield(run(6), 1);
    const { streak, events } = reconcileStreak(six, addDays(MONDAY, 7), 2);
    expect(streak.perfectWeeks).toEqual([MONDAY]);
    expect(types(events)).toContain('perfect-week');
  });
  it('parent shields are used before earned ones', () => {
    const s = grantShield(run(7), 1); // 1 earned + 1 parent
    const { streak } = reconcileStreak(s, addDays(MONDAY, 8), 2);
    expect(streak).toMatchObject({ shields: 1, parentShields: 0 });
    expect(streak.excusedDates).toHaveLength(1);
  });
  it('keeps date lists small', () => {
    expect(run(100).countedDates.length).toBeLessThanOrEqual(14);
  });
});

describe('invariants over long random histories', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('seed %i: nothing earned ever shrinks', (seed) => {
    const rng = mulberry32(seed);
    let s = newStreak('c');
    let date = MONDAY;
    let best = 0;
    let weeks = 0;
    for (let i = 0; i < 2000; i++) {
      date = addDays(date, 1);
      const roll = rng.next();
      if (roll < 0.05) s = grantShield(s, i);
      if (roll < 0.15) continue; // skips the day
      s = reconcileStreak(s, date, i).streak;
      if (roll < 0.9) s = completeQuest(s, date, i).streak;
      expect(s.best).toBeGreaterThanOrEqual(best);
      expect(s.perfectWeeks.length).toBeGreaterThanOrEqual(weeks);
      expect(s.current).toBeLessThanOrEqual(s.best);
      expect(s.shields).toBeLessThanOrEqual(MAX_SHIELDS);
      expect(s.shields).toBeGreaterThanOrEqual(0);
      expect(s.parentShields).toBeLessThanOrEqual(s.shields);
      best = s.best;
      weeks = s.perfectWeeks.length;
    }
  });
});
