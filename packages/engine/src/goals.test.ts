import { describe, expect, it } from 'vitest';
import { addGoalProgress, goalProgress, isReached, markDelivered } from './goals';
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
