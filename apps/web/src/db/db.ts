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
  cheers!: EntityTable<Cheer<Blob>, 'id'>;

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
  }
}

export const db = new AppDb();
