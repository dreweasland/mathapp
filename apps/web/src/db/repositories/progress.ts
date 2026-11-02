import {
  newInventory,
  newStreak,
  newWallet,
  type Attempt,
  type ChildProfile,
  type FactCard,
  type Goal,
  type Inventory,
  type LocalDate,
  type Mission,
  type Session,
  type SkillState,
  type SkillStates,
  type Streak,
  type Wallet,
} from '@mathapp/engine';
import type { AppDb, StoredCheer } from '../db';

export interface ChildProgress {
  states: SkillStates;
  cards: Map<string, FactCard>;
  wallet: Wallet;
  streak: Streak;
  inventory: Inventory;
  goals: Goal[];
  /** Waiting for the next quest, oldest first. */
  cheers: StoredCheer[];
}

/** Everything one tap can change, written together so a closed app can't leave half of it. */
export interface ProgressChange {
  session?: Session | undefined;
  attempt?: Attempt | undefined;
  skills?: SkillState[] | undefined;
  card?: FactCard | undefined;
  wallet?: Wallet | undefined;
  streak?: Streak | undefined;
  child?: ChildProfile | undefined;
  inventory?: Inventory | undefined;
  missions?: Mission[] | undefined;
  goals?: Goal[] | undefined;
  cheer?: StoredCheer | undefined;
}

export function progressRepository(db: AppDb) {
  return {
    async load(childId: string): Promise<ChildProgress> {
      const [skills, cards, wallet, streak, inventory, goals, cheers] = await Promise.all([
        db.skillStates.where('childId').equals(childId).toArray(),
        db.factCards.where('childId').equals(childId).toArray(),
        db.wallets.get(childId),
        db.streaks.get(childId),
        db.inventories.get(childId),
        db.goals.where('childId').equals(childId).toArray(),
        db.cheers.where('childId').equals(childId).sortBy('createdAt'),
      ]);
      return {
        states: Object.fromEntries(skills.map((s) => [s.skillId, s])),
        cards: new Map(cards.map((c) => [c.factId, c])),
        wallet: wallet ?? newWallet(childId),
        streak: streak ?? newStreak(childId),
        inventory: inventory ?? newInventory(childId),
        goals,
        cheers: cheers.filter((c) => c.playedAt === undefined),
      };
    },

    missionsOn: (childId: string, date: LocalDate) =>
      db.missions.where({ childId, date }).sortBy('slot'),

    sessionsOn: (childId: string, date: LocalDate) =>
      db.sessions.where({ childId, date }).toArray(),

    async save(change: ProgressChange): Promise<void> {
      const tables = [
        db.sessions,
        db.attempts,
        db.skillStates,
        db.factCards,
        db.wallets,
        db.streaks,
        db.children,
        db.inventories,
        db.missions,
        db.goals,
        db.cheers,
      ];
      await db.transaction('rw', tables, async () => {
        if (change.session) await db.sessions.put(change.session);
        if (change.attempt) await db.attempts.put(change.attempt);
        if (change.skills?.length) await db.skillStates.bulkPut(change.skills);
        if (change.card) await db.factCards.put(change.card);
        if (change.wallet) await db.wallets.put(change.wallet);
        if (change.streak) await db.streaks.put(change.streak);
        if (change.child) await db.children.put(change.child);
        if (change.inventory) await db.inventories.put(change.inventory);
        if (change.missions?.length) await db.missions.bulkPut(change.missions);
        if (change.goals?.length) await db.goals.bulkPut(change.goals);
        if (change.cheer) await db.cheers.put(change.cheer);
      });
    },
  };
}

export type ProgressRepository = ReturnType<typeof progressRepository>;
