import type { DailyGoal, Goal, LocalDate } from './state';

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

/** A window that closed short of the target. The child just stops seeing it. */
export const goalEnded = (goal: Goal, today: LocalDate): boolean =>
  !isReached(goal) && goal.endDate !== undefined && today > goal.endDate;

/** Applies an event to every goal, keeping the same array when nothing moved. */
export function advanceGoals(
  goals: Goal[],
  unit: Goal['unit'],
  amount: number,
  date: LocalDate,
  at: number,
): Goal[] {
  const next = goals.map((g) => addGoalProgress(g, unit, amount, date, at));
  return next.some((g, i) => g !== goals[i]) ? next : goals;
}

/** The one goal on the child's Home: a promise still owed comes first. */
export function activeGoal(goals: Goal[], today: LocalDate): Goal | undefined {
  const live = goals.filter((g) => !g.delivered);
  return live.find(isReached) ?? live.find((g) => inWindow(g, today));
}

/** Goals that an event at this moment finished. */
export const justReached = (before: Goal[], after: Goal[]): Goal[] =>
  after.filter((g, i) => isReached(g) && !(before[i] && isReached(before[i])));

export const dailyGoalMet = (
  goal: DailyGoal,
  questDone: boolean,
  challengeDone: boolean,
): boolean => questDone && (goal === 'quest' || challengeDone);
