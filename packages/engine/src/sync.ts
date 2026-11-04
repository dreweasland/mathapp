/**
 * Merging two copies of the same row, for cloud sync between a family's devices.
 *
 * Each table starts from the newer copy (last writer wins), then keeps everything the
 * never-lose rules promise: coins earned, items owned, badges, bests and finished things
 * survive whichever device wrote last. `mergeRow` gives the same result in either order,
 * so two devices that merge the same pair always agree.
 */
import type {
  Attempt,
  ChildProfile,
  Cheer,
  FactCard,
  Goal,
  Inventory,
  Mission,
  Session,
  SkillState,
  Streak,
  Wallet,
} from './state';

export interface SyncRows {
  children: ChildProfile;
  skillStates: SkillState;
  factCards: FactCard;
  attempts: Attempt;
  sessions: Session;
  streaks: Streak;
  wallets: Wallet;
  inventories: Inventory;
  missions: Mission;
  goals: Goal;
  cheers: Cheer;
}

export type SyncTable = keyof SyncRows;

/** Every table that holds a family's progress. Device settings, like the PIN, stay behind. */
export const SYNC_TABLES: readonly SyncTable[] = [
  'children',
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
];

/** The primary key of each table, in the order the database stores it. */
export const KEY_FIELDS: Record<SyncTable, readonly string[]> = {
  children: ['id'],
  skillStates: ['childId', 'skillId'],
  factCards: ['childId', 'factId'],
  attempts: ['id'],
  sessions: ['id'],
  streaks: ['childId'],
  wallets: ['childId'],
  inventories: ['childId'],
  missions: ['childId', 'date', 'slot'],
  goals: ['id'],
  cheers: ['id'],
};

export const isSyncTable = (name: string): name is SyncTable =>
  (SYNC_TABLES as readonly string[]).includes(name);

/** A row's key as one string, the same on every device. */
export const rowKey = (table: SyncTable, row: object): string =>
  JSON.stringify(KEY_FIELDS[table].map((f) => (row as Record<string, unknown>)[f]));

/** The child a row belongs to. */
export const rowChild = (table: SyncTable, row: object): string =>
  (row as Record<string, unknown>)[table === 'children' ? 'id' : 'childId'] as string;

/** A stable text form, for comparing rows and breaking ties. Keys are sorted at every depth. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
      return `"bytes:${Array.from(bytes as Uint8Array).join('.')}"`;
    }
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export const sameRow = (a: unknown, b: unknown) => stableJson(a) === stableJson(b);

/** The copy to start from: the later write, with a fixed tie-break so both orders agree. */
function newer<T extends { updatedAt: number }>(a: T, b: T): T {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  return stableJson(a) >= stableJson(b) ? a : b;
}

const earliest = (a: number | undefined, b: number | undefined) =>
  a === undefined ? b : b === undefined ? a : Math.min(a, b);
const latest = <T extends number | string>(a: T | undefined, b: T | undefined) =>
  a === undefined ? b : b === undefined ? a : a > b ? a : b;
const union = <T>(first: readonly T[], second: readonly T[]) => [
  ...first,
  ...second.filter((x) => !first.includes(x)),
];
const sortedUnion = (a: readonly string[], b: readonly string[]) => union(a, b).sort();

/** Sets an optional field, leaving it out (not `undefined`) when there's no value. */
function withOptional<T extends object, K extends keyof T>(row: T, key: K, value: T[K]): T {
  const next = { ...row };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}

type Merge<T> = (base: T, a: T, b: T) => T;

const MERGES: { [K in SyncTable]: Merge<SyncRows[K]> } = {
  children(base, a, b) {
    let row = {
      ...base,
      questsCompleted: Math.max(a.questsCompleted, b.questsCompleted),
      createdAt: Math.min(a.createdAt, b.createdAt),
    };
    row = withOptional(row, 'placedAt', earliest(a.placedAt, b.placedAt));
    return withOptional(row, 'touredAt', earliest(a.touredAt, b.touredAt));
  },

  skillStates(base, a, b) {
    let row = { ...base, attempts: Math.max(a.attempts, b.attempts) };
    row = withOptional(row, 'masteredAt', earliest(a.masteredAt, b.masteredAt));
    row = withOptional(row, 'unlockedAt', earliest(a.unlockedAt, b.unlockedAt));
    row = withOptional(row, 'blitzBest', latest(a.blitzBest, b.blitzBest));
    return withOptional(row, 'placedOut', a.placedOut || b.placedOut ? true : undefined);
  },

  factCards: (base) => base,
  attempts: (base) => base,

  /** A finished quest stays finished, even if the other device still had it running. */
  sessions(base, a, b) {
    const finished = (s: Session) => s.completedQuest && s.run === undefined;
    const done = finished(base) ? base : [a, b].find(finished);
    let row = { ...base, completedQuest: a.completedQuest || b.completedQuest };
    row = withOptional(row, 'challengeDone', a.challengeDone || b.challengeDone ? true : undefined);
    if (done) {
      row = withOptional(row, 'run', undefined);
      row = withOptional(row, 'endedAt', done.endedAt ?? row.endedAt);
    }
    return row;
  },

  streaks(base, a, b) {
    return {
      ...base,
      best: Math.max(a.best, b.best, base.current),
      countedDates: sortedUnion(a.countedDates, b.countedDates),
      excusedDates: sortedUnion(a.excusedDates, b.excusedDates),
      perfectWeeks: sortedUnion(a.perfectWeeks, b.perfectWeeks),
    };
  },

  /**
   * Spending is lifetime minus spendable. Taking the larger of each keeps every coin earned
   * on either device and every purchase made on either, so coins never drop except by buying.
   */
  wallets(base, a, b) {
    const lifetimeCoins = Math.max(a.lifetimeCoins, b.lifetimeCoins);
    const spent = Math.max(a.lifetimeCoins - a.coins, b.lifetimeCoins - b.coins, 0);
    return { ...base, lifetimeCoins, coins: Math.max(0, lifetimeCoins - spent) };
  },

  inventories(base, a, b) {
    const other = base === a ? b : a;
    let row = { ...base, items: union(base.items, other.items) };
    row = withOptional(row, 'dailyChestDate', latest(a.dailyChestDate, b.dailyChestDate));
    return withOptional(row, 'bonusChestDate', latest(a.bonusChestDate, b.bonusChestDate));
  },

  missions(base, a, b) {
    const progress = Math.max(a.progress, b.progress);
    return { ...base, progress, done: a.done || b.done || progress >= base.target };
  },

  goals(base, a, b) {
    return {
      ...base,
      progress: Math.min(base.target, Math.max(a.progress, b.progress)),
      delivered: a.delivered || b.delivered,
    };
  },

  /** Once heard on any device, a cheer doesn't play again. */
  cheers: (base, a, b) => withOptional(base, 'playedAt', earliest(a.playedAt, b.playedAt)),
};

/** One row from two devices, merged. The result's `updatedAt` is the later of the two. */
export function mergeRow<K extends SyncTable>(
  table: K,
  a: SyncRows[K],
  b: SyncRows[K],
): SyncRows[K] {
  const base = newer(a, b);
  const merge = MERGES[table] as Merge<SyncRows[K]>;
  return { ...merge(base, a, b), updatedAt: Math.max(a.updatedAt, b.updatedAt) };
}
