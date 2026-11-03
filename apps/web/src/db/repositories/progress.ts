import {
  newStreak,
  newWallet,
  type Attempt,
  type ChildProfile,
  type FactCard,
  type LocalDate,
  type Session,
  type SkillState,
  type SkillStates,
  type Streak,
  type Wallet,
} from '@mathapp/engine';
import type { AppDb } from '../db';

export interface ChildProgress {
  states: SkillStates;
  cards: Map<string, FactCard>;
  wallet: Wallet;
  streak: Streak;
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
}

export function progressRepository(db: AppDb) {
  return {
    async load(childId: string): Promise<ChildProgress> {
      const [skills, cards, wallet, streak] = await Promise.all([
        db.skillStates.where('childId').equals(childId).toArray(),
        db.factCards.where('childId').equals(childId).toArray(),
        db.wallets.get(childId),
        db.streaks.get(childId),
      ]);
      return {
        states: Object.fromEntries(skills.map((s) => [s.skillId, s])),
        cards: new Map(cards.map((c) => [c.factId, c])),
        wallet: wallet ?? newWallet(childId),
        streak: streak ?? newStreak(childId),
      };
    },

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
      ];
      await db.transaction('rw', tables, async () => {
        if (change.session) await db.sessions.put(change.session);
        if (change.attempt) await db.attempts.put(change.attempt);
        if (change.skills?.length) await db.skillStates.bulkPut(change.skills);
        if (change.card) await db.factCards.put(change.card);
        if (change.wallet) await db.wallets.put(change.wallet);
        if (change.streak) await db.streaks.put(change.streak);
        if (change.child) await db.children.put(change.child);
      });
    },
  };
}

export type ProgressRepository = ReturnType<typeof progressRepository>;
