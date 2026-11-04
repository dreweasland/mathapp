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
} from '@mathapp/engine';
import Dexie, { type EntityTable, type Table } from 'dexie';

/** Stored as bytes, because Blobs in IndexedDB have been unreliable on iOS Safari. */
export interface CheerAudio {
  bytes: ArrayBuffer;
  type: string;
}

export type StoredCheer = Cheer<CheerAudio>;

/** The one row of device-wide settings. Stays behind on export: a PIN belongs to a device. */
export interface Family {
  id: 'family';
  pinHash?: string;
  pinSalt?: string;
  lastBackupAt?: number;
  updatedAt: number;
}

/** A row deleted on this device, so sync can delete it on the others. */
export interface Tombstone {
  /** `${table}|${key}`. */
  id: string;
  table: string;
  key: string;
  updatedAt: number;
}

/** This device's link to cloud sync. Never in a backup. */
export interface SyncState {
  id: 'sync';
  email?: string;
  token?: string;
  /** The family key, opened with the passphrase on this device. */
  familyKey?: ArrayBuffer;
  /** The wrapped key as the server had it, so a key replaced elsewhere is noticed. */
  wrapped?: string;
  /** Highest server position pulled. */
  cursor: number;
  /** Local rows changed at or after this time still need pushing. */
  pushFrom: number;
  lastSyncedAt?: number;
  recap: boolean;
  updatedAt: number;
}

/**
 * The only place that knows the IndexedDB schema.
 *
 * To change the schema, add a new `this.version(n)` block below; never edit an old one.
 * Rows already on a child's device must migrate forward. App code writes through
 * `repositories/`, not through these tables.
 */
export class AppDb extends Dexie {
  children!: EntityTable<ChildProfile, 'id'>;
  skillStates!: Table<SkillState, [string, string]>;
  factCards!: Table<FactCard, [string, string]>;
  attempts!: EntityTable<Attempt, 'id'>;
  sessions!: EntityTable<Session, 'id'>;
  streaks!: EntityTable<Streak, 'childId'>;
  wallets!: EntityTable<Wallet, 'childId'>;
  inventories!: EntityTable<Inventory, 'childId'>;
  missions!: Table<Mission, [string, string, number]>;
  goals!: EntityTable<Goal, 'id'>;
  cheers!: EntityTable<StoredCheer, 'id'>;
  family!: EntityTable<Family, 'id'>;
  tombstones!: EntityTable<Tombstone, 'id'>;
  syncState!: EntityTable<SyncState, 'id'>;

  constructor(name = 'mathapp') {
    super(name);
    this.version(1).stores({
      children: 'id, updatedAt',
      skillStates: '[childId+skillId], childId, updatedAt',
      factCards: '[childId+factId], childId, [childId+dueDate], updatedAt',
      attempts: 'id, childId, [childId+skillId], [childId+at], updatedAt',
      sessions: 'id, childId, [childId+date], updatedAt',
      streaks: 'childId, updatedAt',
      wallets: 'childId, updatedAt',
      inventories: 'childId, updatedAt',
      missions: '[childId+date+slot], [childId+date], updatedAt',
      goals: 'id, childId, updatedAt',
      cheers: 'id, childId, updatedAt',
    });
    this.version(2).stores({ family: 'id, updatedAt' });
    this.version(3).stores({ tombstones: 'id, updatedAt', syncState: 'id' });
  }
}

export const db = new AppDb();
