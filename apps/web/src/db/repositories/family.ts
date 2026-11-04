import type { AppDb, Family } from '../db';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Enough progress that losing it would matter. */
const BACKUP_AFTER_QUESTS = 7;
const BACKUP_EVERY_DAYS = 14;

const blank = (): Family => ({ id: 'family', updatedAt: 0 });

/**
 * The nudge a parent sees, because an iPhone can lose this data and nothing else holds it.
 * A recent sync means the cloud holds a copy, so the nudge waits.
 */
export function backupDue(family: Family, quests: number, now: number, syncedAt?: number): boolean {
  if (quests < BACKUP_AFTER_QUESTS) return false;
  if (syncedAt !== undefined && now - syncedAt < BACKUP_EVERY_DAYS * DAY_MS) return false;
  return (
    family.lastBackupAt === undefined || now - family.lastBackupAt >= BACKUP_EVERY_DAYS * DAY_MS
  );
}

export function familyRepository(db: AppDb, now: () => number = Date.now) {
  const patch = async (changes: Partial<Family>) => {
    const row = (await db.family.get('family')) ?? blank();
    await db.family.put({ ...row, ...changes, updatedAt: now() });
  };
  return {
    get: async (): Promise<Family> => (await db.family.get('family')) ?? blank(),
    savePin: (pinHash: string, pinSalt: string) => patch({ pinHash, pinSalt }),
    markBackedUp: () => patch({ lastBackupAt: now() }),
  };
}

export type FamilyRepository = ReturnType<typeof familyRepository>;
