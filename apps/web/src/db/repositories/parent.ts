import { ALL_SKILLS } from '@mathapp/content';
import {
  grantShield,
  markDelivered,
  newStreak,
  startAtGrade,
  startAtSkill,
  type Attempt,
  type ChildProfile,
  type Goal,
  type Session,
} from '@mathapp/engine';
import type { AppDb, StoredCheer } from '../db';
import { deleteRows } from '../tombstones';
import { childrenRepository, type NewChild } from './children';
import { progressRepository, type ChildProgress } from './progress';

export interface Dashboard {
  child: ChildProfile;
  progress: ChildProgress;
  sessions: Session[];
  attempts: Attempt[];
  goals: Goal[];
  /** Played and waiting, newest first. */
  cheers: StoredCheer[];
}

/** Every table that holds a child's data, apart from the profile itself. */
const CHILD_TABLES = [
  'skillStates',
  'factCards',
  'attempts',
  'sessions',
  'streaks',
  'wallets',
  'inventories',
  'missions',
  'goals',
  'cheers',
] as const;
const childTables = (db: AppDb) => [...CHILD_TABLES.map((t) => db.table(t)), db.tombstones];

export function parentRepository(db: AppDb, now: () => number = Date.now) {
  const children = childrenRepository(db, now);
  const progress = progressRepository(db);

  const clearProgress = async (childId: string) => {
    const at = now();
    for (const table of CHILD_TABLES) {
      const rows = await db.table(table).where('childId').equals(childId).toArray();
      await deleteRows(db, table, rows, at);
    }
  };

  /** One row, deleted here and, through sync, everywhere. */
  const deleteOne = (table: 'goals' | 'cheers', id: string) =>
    db.transaction('rw', db.table(table), db.tombstones, async () => {
      const row = await db.table(table).get(id);
      if (row) await deleteRows(db, table, [row], now());
    });

  return {
    children: async () => (await children.list()).sort((a, b) => a.createdAt - b.createdAt),

    addChild: (input: NewChild) => children.create(input),

    saveChild: (child: ChildProfile) => children.update(child.id, child),

    async dashboard(child: ChildProfile): Promise<Dashboard> {
      const [data, sessions, attempts, goals, cheers] = await Promise.all([
        progress.load(child.id),
        db.sessions.where('childId').equals(child.id).toArray(),
        db.attempts.where('childId').equals(child.id).toArray(),
        db.goals.where('childId').equals(child.id).toArray(),
        db.cheers.where('childId').equals(child.id).reverse().sortBy('createdAt'),
      ]);
      return { child, progress: data, sessions, attempts, goals, cheers };
    },

    async grantShield(childId: string) {
      const streak = (await db.streaks.get(childId)) ?? newStreak(childId);
      await db.streaks.put(grantShield(streak, now()));
    },

    /** Placement override: everything before this skill counts as passed. */
    async startAt(child: ChildProfile, skillId: string) {
      const { states } = await progress.load(child.id);
      const next = startAtSkill(skillId, ALL_SKILLS, states, child.id, now());
      const rows = Object.values(next).filter((s) => s !== undefined);
      await db.transaction('rw', db.skillStates, db.children, async () => {
        await db.skillStates.bulkPut(rows);
        await db.children.update(child.id, { placedAt: child.placedAt ?? now(), updatedAt: now() });
      });
    },

    /** Moves a child up a grade. Earned things stay; earlier skills count as passed. */
    async moveToGrade(child: ChildProfile, grade: ChildProfile['grade']) {
      const { states } = await progress.load(child.id);
      const next = startAtGrade(grade, ALL_SKILLS, states, child.id, now());
      const rows = Object.values(next).filter((s) => s !== undefined);
      await db.transaction('rw', db.skillStates, db.children, async () => {
        await db.skillStates.bulkPut(rows);
        await db.children.update(child.id, {
          grade,
          placedAt: child.placedAt ?? now(),
          updatedAt: now(),
        });
      });
    },

    addGoal: (goal: Goal) => db.goals.put(goal),

    async deliverGoal(goal: Goal) {
      await db.goals.put(markDelivered(goal, now()));
    },

    removeGoal: (id: string) => deleteOne('goals', id),

    addCheer: (cheer: StoredCheer) => db.cheers.put(cheer),

    removeCheer: (id: string) => deleteOne('cheers', id),

    /** Keeps the name and picture, and sends the child back through placement. */
    async resetChild(child: ChildProfile) {
      const fresh = { ...child, questsCompleted: 0, updatedAt: now() };
      delete fresh.placedAt;
      await db.transaction('rw', [...childTables(db), db.children], async () => {
        await clearProgress(child.id);
        await db.children.put(fresh);
      });
    },

    async removeChild(childId: string) {
      await db.transaction('rw', [...childTables(db), db.children], async () => {
        await clearProgress(childId);
        const child = await db.children.get(childId);
        if (child) await deleteRows(db, 'children', [child], now());
      });
    },
  };
}

export type ParentRepository = ReturnType<typeof parentRepository>;
