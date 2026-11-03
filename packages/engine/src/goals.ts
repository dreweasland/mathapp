import type { Goal, LocalDate } from './state';

export const isReached = (goal: Goal): boolean => goal.progress >= goal.target;

/** 0–1 for the child's progress bar. */
export const goalProgress = (goal: Goal): number =>
  goal.target <= 0 ? 1 : Math.min(1, goal.progress / goal.target);

const inWindow = (goal: Goal, date: LocalDate): boolean =>
  date >= goal.startDate && (goal.endDate === undefined || date <= goal.endDate);

/** Progress only ever rises, and stops at the target. Out-of-window events don't count. */
export function addGoalProgress(
  goal: Goal,
  unit: Goal['unit'],
  amount: number,
  date: LocalDate,
  at: number,
): Goal {
  if (unit !== goal.unit || amount <= 0 || !inWindow(goal, date) || isReached(goal)) return goal;
  return { ...goal, progress: Math.min(goal.target, goal.progress + amount), updatedAt: at };
}

/** The parent gave the real-world reward. */
export const markDelivered = (goal: Goal, at: number): Goal => ({
  ...goal,
  delivered: true,
  updatedAt: at,
});
