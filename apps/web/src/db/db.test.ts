import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Mission, SkillState } from '@mathapp/engine';
import { AppDb } from './db';
import { requestPersistentStorage } from './persist';
import { childrenRepository } from './repositories/children';

let db: AppDb;
beforeEach(() => {
  db = new AppDb(`test-${crypto.randomUUID()}`);
});
afterEach(async () => {
  await db.delete();
});

describe('schema v1', () => {
  it('has all 11 tables at version 1', async () => {
    await db.open();
    expect(db.verno).toBe(1);
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      [
        'attempts',
        'cheers',
        'children',
        'factCards',
        'goals',
        'inventories',
        'missions',
        'sessions',
        'skillStates',
        'streaks',
        'wallets',
      ].sort(),
    );
  });

  it('every table indexes updatedAt for the later sync layer', async () => {
    await db.open();
    for (const table of db.tables) {
      expect(
        table.schema.indexes.map((i) => i.name),
        table.name,
      ).toContain('updatedAt');
    }
  });

  it('keeps one SkillState per child and skill', async () => {
    const row: SkillState = {
      childId: 'a',
      skillId: '1.counting',
      mastery: 10,
      attempts: 1,
      difficulty: 1,
      errorCounts: {},
      fastStreak: 0,
      wrongStreak: 0,
      questsOnSkill: 0,
      updatedAt: 1,
    };
    await db.skillStates.put(row);
    await db.skillStates.put({ ...row, mastery: 20 });
    await db.skillStates.put({ ...row, childId: 'b' });
    expect(await db.skillStates.count()).toBe(2);
    expect((await db.skillStates.get(['a', '1.counting']))?.mastery).toBe(20);
  });

  it('finds missions by child and date', async () => {
    const m: Mission = {
      childId: 'a',
      date: '2026-11-01',
      slot: 1,
      kind: 'in-a-row',
      target: 5,
      progress: 0,
      done: false,
      updatedAt: 1,
    };
    await db.missions.bulkPut([m, { ...m, slot: 2 }, { ...m, date: '2026-11-02' }]);
    const today = await db.missions.where('[childId+date]').equals(['a', '2026-11-01']).toArray();
    expect(today).toHaveLength(2);
  });
});

describe('children repository', () => {
  it('creates a grade 1 profile with safe defaults', async () => {
    const repo = childrenRepository(db, () => 1000);
    const child = await repo.create({ name: 'Sam', avatar: 'fox' });
    expect(child).toMatchObject({
      grade: 1,
      dailyGoal: 'quest',
      theme: 'animals',
      questsCompleted: 0,
      createdAt: 1000,
      updatedAt: 1000,
    });
    expect(await repo.get(child.id)).toEqual(child);
  });

  it('stamps updatedAt on every update and keeps createdAt', async () => {
    let time = 1000;
    const repo = childrenRepository(db, () => time);
    const child = await repo.create({ name: 'Sam', avatar: 'fox' });
    time = 2000;
    await repo.update(child.id, { dailyGoal: 'quest+challenge' });
    expect(await repo.get(child.id)).toMatchObject({
      dailyGoal: 'quest+challenge',
      createdAt: 1000,
      updatedAt: 2000,
    });
  });

  it('lists all profiles for the avatar picker', async () => {
    const repo = childrenRepository(db);
    await repo.create({ name: 'Sam', avatar: 'fox' });
    await repo.create({ name: 'Ari', avatar: 'owl' });
    expect((await repo.list()).map((c) => c.name).sort()).toEqual(['Ari', 'Sam']);
  });

  it('data survives closing and reopening the database', async () => {
    const repo = childrenRepository(db);
    const child = await repo.create({ name: 'Sam', avatar: 'fox' });
    db.close();
    await db.open();
    expect(await repo.get(child.id)).toEqual(child);
  });
});

describe('requestPersistentStorage', () => {
  it('reports false when the API is missing', async () => {
    expect(await requestPersistentStorage({} as StorageManager)).toBe(false);
  });
  it('does not re-request when already persisted', async () => {
    let asked = 0;
    const storage = {
      persisted: async () => true,
      persist: async () => {
        asked++;
        return true;
      },
    };
    expect(await requestPersistentStorage(storage)).toBe(true);
    expect(asked).toBe(0);
  });
  it('requests when not yet persisted, and reports a refusal', async () => {
    const storage = { persisted: async () => false, persist: async () => false };
    expect(await requestPersistentStorage(storage)).toBe(false);
  });
  it('reports false rather than throwing if the browser errors', async () => {
    const storage = {
      persisted: async () => {
        throw new Error('blocked');
      },
      persist: async () => true,
    };
    expect(await requestPersistentStorage(storage)).toBe(false);
  });
});
