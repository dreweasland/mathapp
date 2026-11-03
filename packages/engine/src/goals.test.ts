import { describe, expect, it } from 'vitest';
import {
  activeGoal,
  addGoalProgress,
  advanceGoals,
  dailyGoalMet,
  goalEnded,
  goalProgress,
  isReached,
  justReached,
  markDelivered,
} from './goals';
import type { Goal } from './state';

const goal: Goal = {
  id: 'g',
  childId: 'c',
  title: 'Movie night',
  imageKey: 'movie',
  target: 5,
  unit: 'quests',
  progress: 0,
  rewardText: 'Movie night!',
  startDate: '2026-11-02',
  endDate: '2026-11-08',
  delivered: false,
  updatedAt: 0,
};
const add = (g: Goal, date = '2026-11-03', unit: Goal['unit'] = 'quests', n = 1) =>
  addGoalProgress(g, unit, n, date, 1);

describe('goals', () => {
  it('counts progress in its unit', () => expect(add(goal).progress).toBe(1));
  it('ignores other units', () => expect(add(goal, '2026-11-03', 'skills')).toBe(goal));
  it('ignores dates before the window', () => expect(add(goal, '2026-11-01')).toBe(goal));
  it('ignores dates after the window', () => expect(add(goal, '2026-11-09')).toBe(goal));
  it('counts on both window edges', () => {
    expect(add(goal, '2026-11-02').progress).toBe(1);
    expect(add(goal, '2026-11-08').progress).toBe(1);
  });
  it('an open-ended goal has no end', () => {
    expect(add({ ...goal, endDate: undefined }, '2030-01-01').progress).toBe(1);
  });
  it('stops at the target', () => {
    expect(add({ ...goal, progress: 4 }, '2026-11-03', 'quests', 9).progress).toBe(5);
  });
  it('ignores zero or negative amounts, so progress never falls', () => {
    const g = { ...goal, progress: 3 };
    expect(add(g, '2026-11-03', 'quests', -2)).toBe(g);
    expect(add(g, '2026-11-03', 'quests', 0)).toBe(g);
  });
  it('reports reaching the goal', () => {
    expect(isReached({ ...goal, progress: 4 })).toBe(false);
    expect(isReached({ ...goal, progress: 5 })).toBe(true);
  });
  it('gives a bar value from 0 to 1', () => {
    expect(goalProgress(goal)).toBe(0);
    expect(goalProgress({ ...goal, progress: 2 })).toBeCloseTo(0.4);
    expect(goalProgress({ ...goal, progress: 5 })).toBe(1);
    expect(goalProgress({ ...goal, target: 0 })).toBe(1);
  });
  it('the parent marks it delivered', () => {
    expect(markDelivered(goal, 2)).toMatchObject({ delivered: true, updatedAt: 2 });
  });
});

describe('the goal on Home', () => {
  const later = { ...goal, id: 'later', startDate: '2026-12-01', endDate: undefined };
  const reached = { ...goal, id: 'reached', progress: 5 };

  it('shows a reward still owed ahead of anything else, even after its window', () => {
    expect(activeGoal([goal, reached], '2026-11-04')?.id).toBe('reached');
    expect(activeGoal([reached], '2027-01-01')?.id).toBe('reached');
  });
  it('shows the goal in its window, and nothing before or after', () => {
    expect(activeGoal([goal], '2026-11-04')?.id).toBe('g');
    expect(activeGoal([goal], '2026-11-01')).toBeUndefined();
    expect(activeGoal([goal], '2026-11-09')).toBeUndefined();
    expect(activeGoal([later], '2026-11-04')).toBeUndefined();
  });
  it('drops a goal once the reward is delivered', () => {
    expect(activeGoal([markDelivered(reached, 2)], '2026-11-04')).toBeUndefined();
  });
  it('calls a window that closed short "ended", never a reached goal', () => {
    expect(goalEnded(goal, '2026-11-08')).toBe(false);
    expect(goalEnded(goal, '2026-11-09')).toBe(true);
    expect(goalEnded(reached, '2026-11-09')).toBe(false);
    expect(goalEnded(later, '2030-01-01')).toBe(false);
  });
});

describe('advanceGoals', () => {
  it('moves every matching goal and reports the ones just finished', () => {
    const almost = { ...goal, id: 'almost', progress: 4 };
    const next = advanceGoals([goal, almost], 'quests', 1, '2026-11-03', 9);
    expect(next.map((g) => g.progress)).toEqual([1, 5]);
    expect(justReached([goal, almost], next).map((g) => g.id)).toEqual(['almost']);
  });
  it('keeps the same array when nothing moved, so nothing is saved', () => {
    const goals = [goal];
    expect(advanceGoals(goals, 'skills', 1, '2026-11-03', 9)).toBe(goals);
    expect(advanceGoals(goals, 'quests', 1, '2026-12-25', 9)).toBe(goals);
  });
  it('does not report a goal finished earlier', () => {
    const done = { ...goal, progress: 5 };
    expect(justReached([done], [done])).toEqual([]);
  });
});

describe('dailyGoalMet', () => {
  it('needs the quest either way, and the challenge only when chosen', () => {
    expect(dailyGoalMet('quest', true, false)).toBe(true);
    expect(dailyGoalMet('quest', false, true)).toBe(false);
    expect(dailyGoalMet('quest+challenge', true, false)).toBe(false);
    expect(dailyGoalMet('quest+challenge', true, true)).toBe(true);
  });
});
