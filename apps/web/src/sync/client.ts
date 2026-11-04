import {
  KEY_FIELDS,
  SYNC_TABLES,
  isSyncTable,
  mergeRow,
  rowKey,
  sameRow,
  type SyncRows,
  type SyncTable,
} from '@mathapp/engine';
import { LIMITS, type PulledRecord, type WireRecord } from '@mathapp/worker/protocol';
import type { AppDb, SyncState } from '../db/db';
import { SyncError, type SyncApi } from './api';
import {
  newFamilyKey,
  open,
  recordId,
  rowKeys,
  seal,
  unwrapFamilyKey,
  wrapFamilyKey,
  type RowKeys,
} from './crypto';
import { buildRecap } from './recap';

/** What one sealed record holds: which row, and the row or a deletion. */
type Payload =
  { t: SyncTable; k: string; r: SyncRows[SyncTable] } | { t: SyncTable; k: string; deleted: true };

export interface SyncResult {
  /** Rows on this device changed, so screens showing them should read again. */
  changed: boolean;
  /** Set when the run stopped early, in words for the grown-up. */
  error?: string;
}

export type SyncStatus =
  | { kind: 'off' }
  /** Signed in, but the passphrase hasn't been entered on this device yet. */
  | { kind: 'needs-key'; email: string; hasKey: boolean }
  | { kind: 'on'; email: string; lastSyncedAt?: number; recap: boolean };

export interface SyncDeps {
  db: AppDb;
  api: SyncApi;
  now: () => number;
  timeZone: () => string;
  /** PBKDF2 rounds for a new key; tests lower it. */
  iterations?: number;
}

/** Rows written just before a push started may commit after it reads; overlap catches them. */
const PUSH_OVERLAP_MS = 10_000;
const PUSH_CHARS = 4_000_000;
const PUSH_ROUNDS = 3;

const blankState = (at: number): SyncState => ({
  id: 'sync',
  cursor: 0,
  pushFrom: 0,
  recap: false,
  updatedAt: at,
});

/** A key string back into what Dexie's `get` takes. */
const primaryKey = (key: string): string | number | (string | number)[] => {
  const parts = JSON.parse(key) as (string | number)[];
  return parts.length === 1 ? (parts[0] as string | number) : parts;
};

export function createSync({ db, api, now, timeZone, iterations }: SyncDeps) {
  const tables = () => [...SYNC_TABLES.map((t) => db.table(t)), db.tombstones];
  const state = async () => db.syncState.get('sync');
  const patch = async (changes: Partial<SyncState>) => {
    const current = (await state()) ?? blankState(now());
    await db.syncState.put({ ...current, ...changes, updatedAt: now() });
  };

  async function need(): Promise<SyncState & { token: string }> {
    const s = await state();
    if (!s?.token) throw new SyncError(401, 'Sign in again.');
    return s as SyncState & { token: string };
  }

  /** Opened records, written in one transaction so a closed app can't leave half. */
  async function apply(keys: RowKeys, records: PulledRecord[]): Promise<boolean> {
    const opened: (Payload & { updatedAt: number })[] = [];
    for (const record of records) {
      if (record.data === null) continue;
      try {
        const payload = (await open(keys, record.id, record.data)) as Payload;
        if (!isSyncTable(payload.t) || typeof payload.k !== 'string') continue;
        opened.push({ ...payload, updatedAt: record.updatedAt });
      } catch {
        // Sealed with another key or damaged: leave this device's copy alone.
      }
    }
    if (opened.length === 0) return false;
    let changed = false;
    await db.transaction('rw', tables(), async () => {
      for (const item of opened) {
        const table = db.table(item.t);
        const id = `${item.t}|${item.k}`;
        const local = (await table.get(primaryKey(item.k))) as SyncRows[SyncTable] | undefined;
        if ('deleted' in item) {
          if (!local) continue;
          if (local.updatedAt > item.updatedAt) {
            // Changed here after the other device deleted it: keep it and send it back.
            await table.put({ ...local, updatedAt: Math.max(now(), item.updatedAt + 1) });
            continue;
          }
          await table.delete(primaryKey(item.k));
          await db.tombstones.put({ id, table: item.t, key: item.k, updatedAt: item.updatedAt });
          changed = true;
          continue;
        }
        const remote = item.r;
        if (rowKey(item.t, remote) !== item.k) continue;
        const tomb = await db.tombstones.get(id);
        if (tomb && tomb.updatedAt >= remote.updatedAt) continue;
        if (!local) {
          await table.put(remote);
          if (tomb) await db.tombstones.delete(id);
          changed = true;
          continue;
        }
        const merged = mergeRow(item.t, local, remote);
        if (!sameRow(merged, remote)) {
          // Holds something the server's copy lacks, so it goes back up.
          merged.updatedAt = Math.max(now(), remote.updatedAt + 1);
        }
        if (sameRow(merged, local)) continue;
        await table.put(merged);
        if (!sameRow({ ...merged, updatedAt: 0 }, { ...local, updatedAt: 0 })) changed = true;
      }
    });
    return changed;
  }

  /** Everything changed here since `from`, sealed. A row and its deletion: the later wins. */
  async function outgoing(keys: RowKeys, from: number): Promise<WireRecord[]> {
    const latest = new Map<string, { updatedAt: number; payload: Payload }>();
    const offer = (payload: Payload, updatedAt: number) => {
      const id = `${payload.t}|${payload.k}`;
      const seen = latest.get(id);
      if (!seen || updatedAt > seen.updatedAt) latest.set(id, { updatedAt, payload });
    };
    for (const t of SYNC_TABLES) {
      const rows = (await db
        .table(t)
        .where('updatedAt')
        .aboveOrEqual(from)
        .toArray()) as SyncRows[SyncTable][];
      for (const r of rows) {
        if (KEY_FIELDS[t].some((f) => (r as unknown as Record<string, unknown>)[f] === undefined)) {
          continue;
        }
        offer({ t, k: rowKey(t, r), r }, r.updatedAt);
      }
    }
    const tombs = await db.tombstones.where('updatedAt').aboveOrEqual(from).toArray();
    for (const tomb of tombs) {
      if (isSyncTable(tomb.table)) {
        offer({ t: tomb.table, k: tomb.key, deleted: true }, tomb.updatedAt);
      }
    }
    const records: WireRecord[] = [];
    for (const { updatedAt, payload } of latest.values()) {
      const id = await recordId(keys, payload.t, payload.k);
      const data = await seal(keys, id, payload);
      if (data.length > LIMITS.recordChars) continue; // Too big to store; it stays on this device.
      records.push({ id, updatedAt, data });
    }
    return records;
  }

  function batches(records: WireRecord[]): WireRecord[][] {
    const out: WireRecord[][] = [];
    let batch: WireRecord[] = [];
    let chars = 0;
    for (const r of records) {
      const size = r.data?.length ?? 0;
      if (batch.length >= LIMITS.pushRecords || (batch.length > 0 && chars + size > PUSH_CHARS)) {
        out.push(batch);
        batch = [];
        chars = 0;
      }
      batch.push(r);
      chars += size;
    }
    if (batch.length > 0) out.push(batch);
    return out;
  }

  async function forget(keepEmail: boolean) {
    const s = await state();
    await db.syncState.put({
      ...blankState(now()),
      ...(keepEmail && s?.email ? { email: s.email } : {}),
    });
  }

  async function go(): Promise<SyncResult> {
    const s = await state();
    if (!s?.token || !s.familyKey) return { changed: false };
    const { token } = s;
    let changed = false;
    try {
      const envelope = await api.getKey(token);
      if (!envelope || envelope.wrapped !== s.wrapped) {
        await forget(true);
        return {
          changed,
          error: 'The sync passphrase was changed on another device. Sign in again here.',
        };
      }
      const keys = await rowKeys(new Uint8Array(s.familyKey));

      let cursor = s.cursor;
      for (;;) {
        const page = await api.pull(token, cursor);
        if (await apply(keys, page.records)) changed = true;
        cursor = page.next;
        await patch({ cursor });
        if (!page.more) break;
      }

      const mark = now() - PUSH_OVERLAP_MS;
      let from = s.pushFrom;
      for (let round = 0; round < PUSH_ROUNDS; round++) {
        const records = await outgoing(keys, from);
        const newer: PulledRecord[] = [];
        for (const batch of batches(records)) newer.push(...(await api.push(token, batch)).newer);
        if (newer.length === 0) break;
        if (await apply(keys, newer)) changed = true;
        from = mark + PUSH_OVERLAP_MS;
      }
      await patch({ pushFrom: Math.max(s.pushFrom, mark) });

      if (s.recap) await api.recap(token, await buildRecap(db, now(), timeZone()));
      await patch({ lastSyncedAt: now() });
      return { changed };
    } catch (error) {
      if (error instanceof SyncError && error.status === 401) {
        await forget(true);
        return { changed, error: 'Signed out. Sign in again to keep syncing.' };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { changed, error: message };
    }
  }

  let running: Promise<SyncResult> | undefined;

  /** Connects a signed-in device to the family key, then syncs everything both ways. */
  async function useKey(familyKey: Uint8Array<ArrayBuffer>, wrapped: string) {
    await patch({
      familyKey: familyKey.buffer,
      wrapped,
      cursor: 0,
      pushFrom: 0,
    });
    return sync.run();
  }

  const sync = {
    /** Pull, merge, push. Safe to call often: overlapping calls share one run. */
    run(): Promise<SyncResult> {
      running ??= go().finally(() => {
        running = undefined;
      });
      return running;
    },

    async status(): Promise<SyncStatus> {
      const s = await state();
      if (!s?.token || !s.email) return { kind: 'off' };
      if (!s.familyKey) {
        const envelope = await api.getKey(s.token).catch(() => undefined);
        return { kind: 'needs-key', email: s.email, hasKey: envelope !== undefined };
      }
      return {
        kind: 'on',
        email: s.email,
        recap: s.recap,
        ...(s.lastSyncedAt === undefined ? {} : { lastSyncedAt: s.lastSyncedAt }),
      };
    },

    async lastSyncedAt(): Promise<number | undefined> {
      const s = await state();
      return s?.familyKey ? s.lastSyncedAt : undefined;
    },

    available: async () => (await api.health()).email,

    sendCode: (email: string) => api.sendCode(email),

    /** Returns whether the family already has a key, so the next step asks or creates. */
    async verify(email: string, code: string): Promise<boolean> {
      const account = await api.verify(email, code);
      await db.syncState.put({
        ...blankState(now()),
        email: account.email,
        token: account.token,
        recap: account.recap,
      });
      return account.hasKey;
    },

    /** First device in the family: makes the key and sends everything up. */
    async createKey(passphrase: string): Promise<SyncResult> {
      const { token } = await need();
      const familyKey = newFamilyKey();
      const envelope = await wrapFamilyKey(familyKey, passphrase, iterations);
      await api.putKey(token, { envelope });
      return useKey(familyKey, envelope.wrapped);
    },

    /** Another device: opens the family key. False when the passphrase is wrong. */
    async openKey(passphrase: string): Promise<SyncResult | false> {
      const { token } = await need();
      const envelope = await api.getKey(token);
      if (!envelope) throw new SyncError(404, 'This family has no sync passphrase yet.');
      const familyKey = await unwrapFamilyKey(envelope, passphrase);
      if (!familyKey) return false;
      return useKey(familyKey, envelope.wrapped);
    },

    /**
     * Forgotten passphrase: the cloud copy starts over from this device, with a new one.
     * Other devices keep their own progress and sign in again to rejoin.
     */
    async replaceKey(passphrase: string): Promise<SyncResult> {
      const { token } = await need();
      const familyKey = newFamilyKey();
      const envelope = await wrapFamilyKey(familyKey, passphrase, iterations);
      await api.putKey(token, { envelope, replace: true });
      return useKey(familyKey, envelope.wrapped);
    },

    async setRecap(on: boolean) {
      const { token } = await need();
      await api.recap(token, on ? await buildRecap(db, now(), timeZone()) : { enabled: false });
      await patch({ recap: on });
    },

    /** This device stops syncing. Its progress stays; so does the cloud copy. */
    async signOut(all = false) {
      const s = await state();
      if (s?.token) await api.signOut(s.token, all).catch(() => undefined);
      await forget(false);
    },

    /** Deletes the family's cloud copy and account. Every device keeps its own progress. */
    async deleteCloud() {
      const { token } = await need();
      await api.deleteAccount(token);
      await forget(false);
    },

    /** After restoring a file, everything in it goes up on the next run. */
    async afterRestore() {
      if (await state()) await patch({ pushFrom: 0 });
    },
  };
  return sync;
}

export type Sync = ReturnType<typeof createSync>;
