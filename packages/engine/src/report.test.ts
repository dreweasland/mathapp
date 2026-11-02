import { describe, expect, it } from 'vitest';
import { newFactCard } from './factDeck';
import {
  MAX_ACTIVE_GAP_MS,
  activityBetween,
  dailyActivity,
  factGrid,
  skillRows,
  skillSummary,
  skillTrend,
} from './report';
import type { Attempt, FactCard, Session, SkillState } from './state';
import { SKILLS as TEST_SKILLS } from './testing/skills';

const SEC = 1000;

const session = (id: string, date: string, over: Partial<Session> = {}): Session => ({
  id,
  childId: 'c',
  startedAt: 0,
  date,
  type: 'quest',
  problemsCount: 0,
  correctCount: 0,
  coinsEarned: 0,
  completedQuest: true,
  updatedAt: 0,
  ...over,
});

const attempt = (sessionId: string, at: number, over: Partial<Attempt> = {}): Attempt => ({
  id: `${sessionId}-${at}`,
  childId: 'c',
  sessionId,
  skillId: '1.counting',
  questionType: 'number-pad',
  difficulty: 1,
  prompt: '',
  answer: '1',
  given: '1',
  correct: true,
  tryNumber: 1,
  responseMs: 2 * SEC,
  at,
  updatedAt: at,
  ...over,
});

describe('activity', () => {
  it('counts each problem once, and accuracy from first tries', () => {
    const attempts = [
      attempt('a', 0, { correct: false }),
      attempt('a', 1, { tryNumber: 2, correct: true }),
      attempt('a', 2),
      attempt('a', 3),
      attempt('a', 4),
    ];
    const week = activityBetween(
      '2026-11-02',
      '2026-11-08',
      [session('a', '2026-11-03')],
      attempts,
    );
    expect(week.quests).toBe(1);
    expect(week.problems).toBe(4);
    expect(week.accuracy).toBe(0.75);
  });
  it('uses answer times, so a quest paused for hours is not hours of math', () => {
    const start = 0;
    const attempts = [
      attempt('a', start),
      attempt('a', start + 30 * SEC),
      attempt('a', start + 3 * 3600 * SEC),
      attempt('a', start + 3 * 3600 * SEC + 28 * SEC),
    ];
    const { minutes } = activityBetween(
      '2026-11-03',
      '2026-11-03',
      [session('a', '2026-11-03')],
      attempts,
    );
    expect(minutes).toBe(Math.round((2 + 30 + MAX_ACTIVE_GAP_MS / SEC + 28) / 60));
  });
  it('leaves placement out of every total', () => {
    const sessions = [session('p', '2026-11-03', { type: 'placement', completedQuest: false })];
    const week = activityBetween('2026-11-02', '2026-11-08', sessions, [attempt('p', 1)]);
    expect(week).toEqual({ quests: 0, minutes: 0, problems: 0 });
  });
  it('counts an unfinished quest as practice but not as a quest', () => {
    const sessions = [session('a', '2026-11-03', { completedQuest: false })];
    const week = activityBetween('2026-11-03', '2026-11-03', sessions, [attempt('a', 1)]);
    expect(week.quests).toBe(0);
    expect(week.problems).toBe(1);
  });
  it('stays inside the dates asked for', () => {
    const sessions = [session('a', '2026-11-01'), session('b', '2026-11-09')];
    expect(activityBetween('2026-11-02', '2026-11-08', sessions, []).quests).toBe(0);
  });
  it('gives one entry per day, oldest first, across a month end', () => {
    const days = dailyActivity('2026-11-02', 30, [session('a', '2026-10-31')], [attempt('a', 1)]);
    expect(days).toHaveLength(30);
    expect(days[0]?.date).toBe('2026-10-04');
    expect(days[29]?.date).toBe('2026-11-02');
    expect(days[27]).toMatchObject({ date: '2026-10-31', quests: 1, problems: 1 });
    expect(days[28]).toMatchObject({ quests: 0, problems: 0 });
  });
});

describe('skillTrend', () => {
  const run = (results: boolean[]) => results.map((correct, i) => attempt('a', i, { correct }));
  const yes = (n: number) => Array<boolean>(n).fill(true);
  const no = (n: number) => Array<boolean>(n).fill(false);

  it('stays quiet until there is enough to compare', () => {
    expect(skillTrend(run(yes(9)))).toBeUndefined();
    expect(skillTrend(run(yes(10)))).toBe('steady');
  });
  it('sees improvement and slipping', () => {
    expect(skillTrend(run([...no(6), ...yes(4), ...yes(10)]))).toBe('up');
    expect(skillTrend(run([...yes(10), ...yes(4), ...no(6)]))).toBe('down');
  });
  it('treats small changes as steady', () => {
    expect(skillTrend(run([...no(2), ...yes(8), ...no(1), ...yes(9)]))).toBe('steady');
  });
  it('only uses first tries, and goes by time rather than row order', () => {
    const retries = run(no(20)).map((a) => ({ ...a, tryNumber: 2 as const }));
    expect(skillTrend(retries)).toBeUndefined();
    const shuffled = run([...no(10), ...yes(10)]).reverse();
    expect(skillTrend(shuffled)).toBe('up');
  });
});

describe('skillRows', () => {
  const state = (skillId: string, over: Partial<SkillState>): SkillState => ({
    childId: 'c',
    skillId,
    mastery: 0,
    attempts: 0,
    difficulty: 1,
    errorCounts: {},
    fastStreak: 0,
    wrongStreak: 0,
    questsOnSkill: 0,
    updatedAt: 0,
    ...over,
  });
  const id = (i: number) => (TEST_SKILLS[i] as { id: string }).id;

  it('has a row for every skill, practiced or not', () => {
    const rows = skillRows(TEST_SKILLS, {}, []);
    expect(rows).toHaveLength(TEST_SKILLS.length);
    expect(rows[0]).toMatchObject({ mastery: 0, attempts: 0 });
    expect(rows[0]?.trend).toBeUndefined();
    expect(rows[0]?.topError).toBeUndefined();
  });
  it('fills in what is known', () => {
    const states = {
      [id(0)]: state(id(0), {
        mastery: 72.6,
        attempts: 20,
        lastPracticedAt: 5,
        errorCounts: { 'off-by-one': 3, other: 9 },
      }),
    };
    const attempts = Array.from({ length: 12 }, (_, i) => attempt('a', i, { skillId: id(0) }));
    const [row] = skillRows(TEST_SKILLS, states, attempts);
    expect(row).toMatchObject({
      mastery: 73,
      attempts: 20,
      lastPracticedAt: 5,
      topError: 'off-by-one',
      trend: 'steady',
    });
  });
  it('summarizes mastered, placed-out and struggling skills', () => {
    const states = {
      [id(0)]: state(id(0), { mastery: 90, attempts: 20, masteredAt: 1 }),
      [id(1)]: state(id(1), { mastery: 70, placedOut: true }),
      [id(2)]: state(id(2), { mastery: 40, attempts: 14, errorCounts: { 'off-by-one': 2 } }),
      [id(3)]: state(id(3), { mastery: 20, attempts: 12, errorCounts: { 'place-value': 5 } }),
      [id(4)]: state(id(4), { mastery: 20, attempts: 3 }),
    };
    const rows = skillRows(TEST_SKILLS, states, []);
    const summary = skillSummary(rows, TEST_SKILLS, states);
    expect(summary.mastered).toBe(1);
    expect(summary.passed).toBe(1);
    expect(summary.needsHelp.map((r) => r.skill.id)).toEqual([id(3), id(2)]);
    expect(summary.commonError).toBe('place-value');
    expect(summary.focus).toBeDefined();
  });
  it('never lists a mastered skill as needing help, even after a dip', () => {
    const states = { [id(0)]: state(id(0), { mastery: 30, attempts: 40, masteredAt: 1 }) };
    const summary = skillSummary(skillRows(TEST_SKILLS, states, []), TEST_SKILLS, states);
    expect(summary.needsHelp).toEqual([]);
  });
});

describe('factGrid', () => {
  const seen = (id: string, responseMs: number): [string, FactCard] => [
    id,
    {
      ...newFactCard('c', id, '2026-11-01'),
      history: Array.from({ length: 10 }, (_, at) => ({ at, correct: true, responseMs })),
    },
  ];

  it('lays out all 121 facts of each operation, with no id repeated', () => {
    for (const op of ['add', 'sub'] as const) {
      const grid = factGrid(op, new Map());
      expect(grid.rows.flat()).toHaveLength(121);
      expect(new Set(grid.rows.flat().map((c) => c.id)).size).toBe(121);
      expect(grid.counts.unseen).toBe(121);
    }
  });
  it('puts each fact at its row and column', () => {
    const add = factGrid('add', new Map());
    expect(add.rows[3]?.[4]).toMatchObject({ id: 'add:3+4', label: '3+4' });
    const sub = factGrid('sub', new Map());
    expect(sub.rows[3]?.[4]).toMatchObject({ id: 'sub:7-3', label: '7−3' });
    expect(sub.rows[10]?.[10]).toMatchObject({ id: 'sub:20-10' });
  });
  it('lays out 100 multiplication and 100 division facts', () => {
    for (const op of ['mul', 'div'] as const) {
      const grid = factGrid(op, new Map());
      expect(grid.rows.flat()).toHaveLength(100);
      expect(new Set(grid.rows.flat().map((c) => c.id)).size).toBe(100);
      expect(grid.side).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
  });
  it('puts × and ÷ facts at the right row and column', () => {
    expect(factGrid('mul', new Map()).rows[2]?.[3]).toMatchObject({ id: 'mul:3x4', label: '3×4' });
    expect(factGrid('div', new Map()).rows[2]?.[3]).toMatchObject({
      id: 'div:12/3',
      label: '12÷3',
    });
  });
  it('counts each level', () => {
    const grid = factGrid('add', new Map([seen('add:1+1', 1000), seen('add:1+2', 6000)]));
    expect(grid.counts).toEqual({ automatic: 1, quick: 0, working: 1, unseen: 119 });
    expect(grid.rows[1]?.[1]?.heat).toBe('automatic');
  });
});
