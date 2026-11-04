import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';
import { newInventory } from './rewards';
import type { ChildProfile, Cheer, Goal, Mission, Session, SkillState } from './state';
import { newStreak } from './streak';
import {
  KEY_FIELDS,
  SYNC_TABLES,
  isSyncTable,
  mergeRow,
  rowChild,
  rowKey,
  sameRow,
  stableJson,
  type SyncRows,
  type SyncTable,
} from './sync';
import { earnCoins, newWallet } from './wallet';

const child = (over: Partial<ChildProfile> = {}): ChildProfile => ({
  id: 'kid',
  name: 'Sam',
  avatar: '🐻',
  theme: 'animals',
  grade: 1,
  dailyGoal: 'quest',
  settings: { handedness: 'right', reduceMotion: false, colorBlindSafe: false },
  questsCompleted: 3,
  createdAt: 1,
  updatedAt: 10,
  ...over,
});

const skill = (over: Partial<SkillState> = {}): SkillState => ({
  childId: 'kid',
  skillId: '1.counting',
  mastery: 50,
  attempts: 10,
  difficulty: 2,
  errorCounts: {},
  fastStreak: 0,
  wrongStreak: 0,
  questsOnSkill: 1,
  updatedAt: 10,
  ...over,
});

const both = <K extends SyncTable>(table: K, a: SyncRows[K], b: SyncRows[K]) => {
  const ab = mergeRow(table, a, b);
  expect(stableJson(mergeRow(table, b, a))).toBe(stableJson(ab));
  return ab;
};

describe('keys', () => {
  it('names every table and its key', () => {
    expect(SYNC_TABLES).toHaveLength(11);
    for (const t of SYNC_TABLES) expect(KEY_FIELDS[t].length).toBeGreaterThan(0);
    expect(isSyncTable('wallets')).toBe(true);
    expect(isSyncTable('family')).toBe(false);
  });

  it('builds the same key for the same row', () => {
    const mission = { childId: 'kid', date: '2026-11-03', slot: 2 };
    expect(rowKey('missions', mission)).toBe('["kid","2026-11-03",2]');
    expect(rowKey('children', child())).toBe('["kid"]');
    expect(rowChild('children', child())).toBe('kid');
    expect(rowChild('wallets', newWallet('kid'))).toBe('kid');
  });

  it('compares rows ignoring key order and undefined fields', () => {
    expect(sameRow({ a: 1, b: [1, { c: 2, d: undefined }] }, { b: [1, { c: 2 }], a: 1 })).toBe(
      true,
    );
    expect(sameRow({ a: 1 }, { a: 2 })).toBe(false);
    expect(stableJson(new Uint8Array([1, 2]).buffer)).toBe('"bytes:1.2"');
    expect(stableJson(new Uint8Array([1, 2]))).toBe('"bytes:1.2"');
  });
});

describe('mergeRow', () => {
  it('starts from the newer copy and keeps the later time', () => {
    const merged = both(
      'children',
      child({ name: 'Sam' }),
      child({ name: 'Sammy', updatedAt: 20 }),
    );
    expect(merged.name).toBe('Sammy');
    expect(merged.updatedAt).toBe(20);
  });

  it('breaks a tie the same way in either order', () => {
    const merged = both('children', child({ name: 'A' }), child({ name: 'B' }));
    expect(['A', 'B']).toContain(merged.name);
  });

  it('keeps a child placed, toured, and the most quests', () => {
    const merged = both(
      'children',
      child({ placedAt: 5, questsCompleted: 9 }),
      child({ touredAt: 7, updatedAt: 30 }),
    );
    expect(merged).toMatchObject({ placedAt: 5, touredAt: 7, questsCompleted: 9 });
    expect(both('children', child(), child({ updatedAt: 30 }))).not.toHaveProperty('placedAt');
  });

  it('never loses a badge, an unlock, a placement, or a blitz best', () => {
    const merged = both(
      'skillStates',
      skill({ masteredAt: 8, placedOut: true, blitzBest: 12, attempts: 40 }),
      skill({ unlockedAt: 3, mastery: 20, blitzBest: 9, updatedAt: 50 }),
    );
    expect(merged).toMatchObject({
      masteredAt: 8,
      unlockedAt: 3,
      placedOut: true,
      blitzBest: 12,
      attempts: 40,
      mastery: 20,
    });
    expect(both('skillStates', skill(), skill({ updatedAt: 11 }))).not.toHaveProperty('placedOut');
  });

  it('keeps every coin earned and every purchase made', () => {
    const start = earnCoins(newWallet('kid'), 100, 1);
    const earned = earnCoins(start, 20, 5); // 120 / 120 on the phone
    const spent = { ...start, coins: 70, updatedAt: 6 }; // spent 30 on the tablet
    const merged = both('wallets', earned, spent);
    expect(merged.lifetimeCoins).toBe(120);
    expect(merged.coins).toBe(90);
  });

  it('never shows fewer coins than either device without a purchase', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 300; i++) {
      const base = earnCoins(newWallet('kid'), rng.int(0, 200), 1);
      const a = earnCoins(base, rng.int(0, 50), rng.int(2, 6));
      const b = earnCoins(base, rng.int(0, 50), rng.int(2, 6));
      const merged = both('wallets', a, b);
      expect(merged.coins).toBeGreaterThanOrEqual(Math.max(a.coins, b.coins));
      expect(merged.lifetimeCoins).toBe(Math.max(a.lifetimeCoins, b.lifetimeCoins));
    }
  });

  it('keeps items from both devices and the later chest dates', () => {
    const a = { ...newInventory('kid'), items: ['fox', 'hat'], dailyChestDate: '2026-11-02' };
    const b = {
      ...newInventory('kid'),
      items: ['owl'],
      bonusChestDate: '2026-11-03',
      dailyChestDate: '2026-11-03',
      updatedAt: 9,
    };
    const merged = both('inventories', a, b);
    expect(merged.items).toEqual(['owl', 'fox', 'hat']);
    expect(merged.dailyChestDate).toBe('2026-11-03');
    expect(merged.bonusChestDate).toBe('2026-11-03');
  });

  it('keeps streak bests and every counted day', () => {
    const a = { ...newStreak('kid'), current: 4, best: 4, countedDates: ['2026-11-01'] };
    const b = {
      ...newStreak('kid'),
      current: 1,
      best: 2,
      countedDates: ['2026-11-03'],
      perfectWeeks: ['2026-10-26'],
      updatedAt: 5,
    };
    const merged = both('streaks', a, b);
    expect(merged.current).toBe(1);
    expect(merged.best).toBe(4);
    expect(merged.countedDates).toEqual(['2026-11-01', '2026-11-03']);
    expect(merged.perfectWeeks).toEqual(['2026-10-26']);
  });

  it('keeps a finished quest finished', () => {
    const base: Session = {
      id: 's',
      childId: 'kid',
      startedAt: 1,
      date: '2026-11-03',
      type: 'quest',
      problemsCount: 5,
      correctCount: 5,
      coinsEarned: 10,
      completedQuest: false,
      updatedAt: 10,
    };
    const running = { ...base, run: {} as Session['run'], updatedAt: 20 };
    const done = { ...base, completedQuest: true, challengeDone: true, endedAt: 9 };
    const merged = both('sessions', running, done);
    expect(merged.completedQuest).toBe(true);
    expect(merged.challengeDone).toBe(true);
    expect(merged.endedAt).toBe(9);
    expect(merged).not.toHaveProperty('run');
    expect(both('sessions', base, { ...base, updatedAt: 11 })).not.toHaveProperty('challengeDone');
  });

  it('keeps mission and goal progress, and done and delivered', () => {
    const mission: Mission = {
      childId: 'kid',
      date: '2026-11-03',
      slot: 1,
      kind: 'in-a-row',
      target: 5,
      progress: 5,
      done: true,
      updatedAt: 1,
    };
    expect(
      both('missions', mission, { ...mission, progress: 2, done: false, updatedAt: 4 }),
    ).toMatchObject({ progress: 5, done: true });
    const goal: Goal = {
      id: 'g',
      childId: 'kid',
      title: 'Movie',
      imageKey: '🎬',
      target: 5,
      unit: 'quests',
      progress: 5,
      rewardText: 'Movie night',
      startDate: '2026-11-02',
      delivered: true,
      updatedAt: 1,
    };
    expect(
      both('goals', goal, { ...goal, progress: 3, delivered: false, updatedAt: 2 }),
    ).toMatchObject({ progress: 5, delivered: true });
  });

  it('plays a cheer only once across devices', () => {
    const cheer: Cheer = { id: 'c', childId: 'kid', emoji: '🌟', createdAt: 1, updatedAt: 1 };
    expect(both('cheers', cheer, { ...cheer, playedAt: 4, updatedAt: 4 }).playedAt).toBe(4);
    expect(both('cheers', cheer, { ...cheer, updatedAt: 2 })).not.toHaveProperty('playedAt');
  });

  it('takes fact cards and attempts whole', () => {
    const card = {
      childId: 'kid',
      factId: '3+4',
      box: 2 as const,
      dueDate: '2026-11-04',
      history: [],
      updatedAt: 2,
    };
    expect(both('factCards', card, { ...card, box: 0, updatedAt: 3 }).box).toBe(0);
  });
});
