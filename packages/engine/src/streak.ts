import { addDays, daysBetween, weekDays, weekStart } from './dates';
import type { LocalDate, Streak } from './state';

export const MAX_SHIELDS = 2;
export const SHIELD_EVERY = 7;
export const MILESTONES = [3, 7, 14, 30, 60, 100];

export type StreakEvent =
  | { type: 'new-streak'; best: number }
  | { type: 'shielded'; days: number }
  | { type: 'grew'; current: number }
  | { type: 'first-day' }
  | { type: 'milestone'; days: number; isNewBest: boolean }
  | { type: 'shield-earned' }
  | { type: 'perfect-week'; weekOf: LocalDate };

export interface StreakUpdate {
  streak: Streak;
  events: StreakEvent[];
}

export const newStreak = (childId: string): Streak => ({
  childId,
  current: 0,
  best: 0,
  shields: 0,
  parentShields: 0,
  countedDates: [],
  excusedDates: [],
  perfectWeeks: [],
  updatedAt: 0,
});

const settledThrough = (s: Streak): LocalDate | undefined => {
  const { lastCountedDate: counted, coveredThrough: covered } = s;
  if (!counted) return covered;
  return covered && covered > counted ? covered : counted;
};

function perfectWeekCheck(streak: Streak, date: LocalDate, at: number): StreakUpdate {
  const weekOf = weekStart(date);
  const done = new Set([...streak.countedDates, ...streak.excusedDates]);
  if (streak.perfectWeeks.includes(weekOf) || !weekDays(date).every((d) => done.has(d))) {
    return { streak, events: [] };
  }
  return {
    streak: { ...streak, perfectWeeks: [...streak.perfectWeeks, weekOf], updatedAt: at },
    events: [{ type: 'perfect-week', weekOf }],
  };
}

/**
 * Settles missed days. Call on app open. Shields apply automatically, but only if they can
 * save the streak: a gap too long for them starts a new streak and keeps the shields.
 */
export function reconcileStreak(streak: Streak, today: LocalDate, at: number): StreakUpdate {
  const settled = settledThrough(streak);
  if (!settled || streak.current === 0) return { streak, events: [] };
  const missed = daysBetween(settled, today) - 1;
  if (missed <= 0) return { streak, events: [] };

  if (missed > streak.shields) {
    return {
      streak: { ...streak, current: 0, updatedAt: at },
      events: [{ type: 'new-streak', best: streak.best }],
    };
  }

  // Parent-granted shields go first, so those days count toward a Perfect Week.
  const fromParent = Math.min(streak.parentShields, missed);
  const excused = Array.from({ length: fromParent }, (_, i) => addDays(settled, i + 1));
  const shielded: Streak = {
    ...streak,
    shields: streak.shields - missed,
    parentShields: streak.parentShields - fromParent,
    coveredThrough: addDays(today, -1),
    excusedDates: [...streak.excusedDates, ...excused],
    updatedAt: at,
  };
  const events: StreakEvent[] = [{ type: 'shielded', days: missed }];
  let result = shielded;
  // A parent-covered last day of a week can be what completes it.
  for (const date of excused) {
    const check = perfectWeekCheck(result, date, at);
    result = check.streak;
    events.push(...check.events);
  }
  return { streak: result, events };
}

/** Counts today. Only a finished Daily Quest calls this; opening the app never does. */
export function completeQuest(streak: Streak, today: LocalDate, at: number): StreakUpdate {
  const last = streak.lastCountedDate;
  // Second quest today, or the device clock moved backward: nothing to count.
  if (last && last >= today) return { streak, events: [] };

  const { streak: settled, events } = reconcileStreak(streak, today, at);
  const current = settled.current + 1;
  const best = Math.max(settled.best, current);
  const earnsShield = current % SHIELD_EVERY === 0 && settled.shields < MAX_SHIELDS;
  const keepFrom = addDays(weekStart(today), -7);

  const next: Streak = {
    ...settled,
    current,
    best,
    shields: settled.shields + (earnsShield ? 1 : 0),
    lastCountedDate: today,
    countedDates: [...settled.countedDates, today].filter((d) => d >= keepFrom),
    excusedDates: settled.excusedDates.filter((d) => d >= keepFrom),
    updatedAt: at,
  };

  events.push(last === undefined ? { type: 'first-day' } : { type: 'grew', current });
  if (MILESTONES.includes(current)) {
    events.push({ type: 'milestone', days: current, isNewBest: current > settled.best });
  }
  if (earnsShield) events.push({ type: 'shield-earned' });

  const week = perfectWeekCheck(next, today, at);
  return { streak: week.streak, events: [...events, ...week.events] };
}

/** A shield the child earned, from a chest or the first week. Stays within the cap. */
export function earnShield(streak: Streak, at: number): Streak {
  if (streak.shields >= MAX_SHIELDS) return streak;
  return { ...streak, shields: streak.shields + 1, updatedAt: at };
}

/** Sick day or vacation. Stays within the cap. */
export function grantShield(streak: Streak, at: number): Streak {
  if (streak.shields >= MAX_SHIELDS) return streak;
  return {
    ...streak,
    shields: streak.shields + 1,
    parentShields: streak.parentShields + 1,
    updatedAt: at,
  };
}
