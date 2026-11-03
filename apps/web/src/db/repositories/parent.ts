import { GRADE_1_SKILLS } from '@mathapp/content';
import {
  grantShield,
  markDelivered,
  newStreak,
  startAtSkill,
  type Attempt,
  type ChildProfile,
  type Goal,
  type Session,
} from '@mathapp/engine';
import type { AppDb, StoredCheer } from '../db';
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
const childTables = (db: AppDb) => [
  db.skillStates,
  db.factCards,
  db.attempts,
  db.sessions,
  db.streaks,
  db.wallets,
  db.inventories,
  db.missions,
  db.goals,
  db.cheers,
];

export function parentRepository(db: AppDb, now: () => number = Date.now) {
  const children = childrenRepository(db, now);
  const progress = progressRepository(db);

  const clearProgress = (childId: string) =>
    Promise.all(childTables(db).map((t) => t.where('childId').equals(childId).delete()));

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
      const next = startAtSkill(skillId, GRADE_1_SKILLS, states, child.id, now());
      const rows = Object.values(next).filter((s) => s !== undefined);
      await db.transaction('rw', db.skillStates, db.children, async () => {
        await db.skillStates.bulkPut(rows);
        await db.children.update(child.id, { placedAt: child.placedAt ?? now(), updatedAt: now() });
      });
    },

    addGoal: (goal: Goal) => db.goals.put(goal),

    async deliverGoal(goal: Goal) {
      await db.goals.put(markDelivered(goal, now()));
    },

    removeGoal: (id: string) => db.goals.delete(id),

    addCheer: (cheer: StoredCheer) => db.cheers.put(cheer),

    removeCheer: (id: string) => db.cheers.delete(id),

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
        await db.children.delete(childId);
      });
    },
  };
}

export type ParentRepository = ReturnType<typeof parentRepository>;
