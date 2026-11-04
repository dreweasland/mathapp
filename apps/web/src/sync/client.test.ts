import 'fake-indexeddb/auto';
import { earnCoins, newInventory, newWallet, type Goal } from '@mathapp/engine';
import { createApi } from '@mathapp/worker/api';
import { memoryDb } from '@mathapp/worker/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBackup, restoreBackup } from '../db/backup';
import { AppDb, type StoredCheer } from '../db/db';
import { parentRepository } from '../db/repositories/parent';
import { httpApi } from './api';
import { createSync, type Sync } from './client';
import type { Db } from '@mathapp/worker/db';

const EMAIL = 'parent@example.com';
const PASS = 'correct horse battery';

let server: Db;
let codes: string[];
let clock: number;
let dbs: AppDb[];

/** The real Worker, in-process, behind the real HTTP client. */
function device(): { db: AppDb; sync: Sync } {
  const db = new AppDb(`sync-${crypto.randomUUID()}`);
  dbs.push(db);
  const handle = createApi({
    db: server,
    mail: async (e) => void codes.push(/(\d{6})/.exec(e.subject)?.[1] ?? ''),
    now: () => clock,
  });
  const api = httpApi('https://app.test', (input, init) => handle(new Request(input, init)));
  const sync = createSync({
    db,
    api,
    now: () => clock,
    timeZone: () => 'America/Chicago',
    iterations: 100_000,
  });
  return { db, sync };
}

async function signIn(sync: Sync) {
  await sync.sendCode(EMAIL);
  return sync.verify(EMAIL, codes.at(-1) ?? '');
}

async function joined() {
  const a = device();
  const b = device();
  const repo = parentRepository(a.db, () => clock);
  const sam = await repo.addChild({ name: 'Sam', avatar: '🦊' });
  expect(await signIn(a.sync)).toBe(false);
  expect((await a.sync.createKey(PASS)).error).toBeUndefined();
  expect(await signIn(b.sync)).toBe(true);
  const opened = await b.sync.openKey(PASS);
  expect(opened && opened.changed).toBe(true);
  return { a, b, sam, repo };
}

const tick = () => (clock += 1000);

beforeEach(() => {
  server = memoryDb();
  codes = [];
  clock = new Date(2026, 10, 3, 12).getTime();
  dbs = [];
});
afterEach(async () => {
  await Promise.all(dbs.map((db) => db.delete()));
});

describe('sync between two devices', () => {
  it('brings a family to a new device', async () => {
    const { b, sam } = await joined();
    expect((await b.db.children.get(sam.id))?.name).toBe('Sam');
    expect(await b.sync.status()).toMatchObject({ kind: 'on', email: EMAIL });
  });

  it('stores only ciphertext on the server', async () => {
    const { sam } = await joined();
    const { results } = await server.prepare('SELECT id, data FROM records').all<{
      id: string;
      data: string;
    }>();
    expect(results.length).toBeGreaterThan(0);
    const all = JSON.stringify(results);
    expect(all).not.toContain('Sam');
    expect(all).not.toContain(sam.id);
    expect(all).not.toContain(btoa('Sam'));
  });

  it('carries changes both ways', async () => {
    const { a, b, sam } = await joined();
    tick();
    await a.db.inventories.put({ ...newInventory(sam.id), items: ['fox'], updatedAt: clock });
    await a.sync.run();
    expect((await b.sync.run()).changed).toBe(true);
    expect((await b.db.inventories.get(sam.id))?.items).toEqual(['fox']);
    expect((await b.sync.run()).changed).toBe(false);
  });

  it('keeps coins and items earned on both devices at once', async () => {
    const { a, b, sam } = await joined();
    tick();
    const start = earnCoins(newWallet(sam.id), 100, clock);
    await a.db.wallets.put(start);
    await a.sync.run();
    await b.sync.run();
    tick();
    await a.db.wallets.put(earnCoins(start, 20, clock));
    await a.db.inventories.put({ ...newInventory(sam.id), items: ['fox'], updatedAt: clock });
    tick();
    await b.db.wallets.put({ ...start, coins: 70, updatedAt: clock }); // bought something for 30
    await b.db.inventories.put({ ...newInventory(sam.id), items: ['hat'], updatedAt: clock });
    await a.sync.run();
    await b.sync.run();
    await a.sync.run();
    for (const { db } of [a, b]) {
      expect(await db.wallets.get(sam.id)).toMatchObject({ coins: 90, lifetimeCoins: 120 });
      expect((await db.inventories.get(sam.id))?.items.sort()).toEqual(['fox', 'hat']);
    }
  });

  it('deletes on every device what a grown-up deletes on one', async () => {
    const { a, b, sam, repo } = await joined();
    const goal: Goal = {
      id: 'g1',
      childId: sam.id,
      title: 'Movie',
      imageKey: '🎬',
      target: 5,
      unit: 'quests',
      progress: 0,
      rewardText: 'movie',
      startDate: '2026-11-02',
      delivered: false,
      updatedAt: tick(),
    };
    await repo.addGoal(goal);
    await a.sync.run();
    await b.sync.run();
    expect(await b.db.goals.get('g1')).toBeDefined();
    tick();
    await repo.removeGoal('g1');
    await a.sync.run();
    expect((await b.sync.run()).changed).toBe(true);
    expect(await b.db.goals.get('g1')).toBeUndefined();

    tick();
    await repo.removeChild(sam.id);
    await a.sync.run();
    await b.sync.run();
    expect(await b.db.children.count()).toBe(0);
  });

  it('carries a recorded cheer', async () => {
    const { a, b, sam } = await joined();
    const cheer: StoredCheer = {
      id: 'c1',
      childId: sam.id,
      audio: { bytes: new Uint8Array([1, 2, 250]).buffer, type: 'audio/mp4' },
      createdAt: tick(),
      updatedAt: clock,
    };
    await a.db.cheers.put(cheer);
    await a.sync.run();
    await b.sync.run();
    const copy = await b.db.cheers.get('c1');
    expect(Array.from(new Uint8Array(copy?.audio?.bytes ?? new ArrayBuffer(0)))).toEqual([
      1, 2, 250,
    ]);
    // Heard on the tablet: the phone won't play it again.
    tick();
    await b.db.cheers.put({ ...cheer, playedAt: clock, updatedAt: clock });
    await b.sync.run();
    await a.sync.run();
    expect((await a.db.cheers.get('c1'))?.playedAt).toBe(clock);
  });

  it('refuses a wrong passphrase', async () => {
    const a = device();
    await signIn(a.sync);
    await a.sync.createKey(PASS);
    const b = device();
    await signIn(b.sync);
    expect(await b.sync.openKey('wrong passphrase')).toBe(false);
    expect(await b.sync.status()).toMatchObject({ kind: 'needs-key', hasKey: true });
  });

  it('starts over from one device, and the others sign in again', async () => {
    const { a, b } = await joined();
    await b.sync.replaceKey('a brand new passphrase');
    const result = await a.sync.run();
    expect(result.error).toMatch(/passphrase was changed/);
    expect(await a.sync.status()).toEqual({ kind: 'off' });
    await signIn(a.sync);
    expect(await a.sync.openKey(PASS)).toBe(false);
    const reopened = await a.sync.openKey('a brand new passphrase');
    expect(reopened && reopened.error).toBeUndefined();
    expect(reopened).not.toBe(false);
  });

  it('signs out when the server forgets the device', async () => {
    const { a, b } = await joined();
    await b.sync.signOut(true);
    const result = await a.sync.run();
    expect(result.error).toMatch(/Signed out/);
    expect(await a.sync.status()).toEqual({ kind: 'off' });
    // This device's progress stays.
    expect(await a.db.children.count()).toBe(1);
  });

  it("deletes the cloud copy but keeps each device's progress", async () => {
    const { a, b } = await joined();
    await a.sync.deleteCloud();
    const { results } = await server.prepare('SELECT id FROM records').all();
    expect(results).toEqual([]);
    expect(await a.db.children.count()).toBe(1);
    expect((await b.sync.run()).error).toMatch(/Signed out/);
    expect(await b.db.children.count()).toBe(1);
  });

  it('sends a restored file up', async () => {
    const { a, b, sam } = await joined();
    const backup = await createBackup(a.db, clock);
    backup.tables.wallets = [{ ...newWallet(sam.id), coins: 5, lifetimeCoins: 5, updatedAt: 2 }];
    await restoreBackup(a.db, backup);
    await a.sync.afterRestore();
    await a.sync.run();
    await b.sync.run();
    expect((await b.db.wallets.get(sam.id))?.coins).toBe(5);
  });

  it('uploads the weekly recap only when turned on', async () => {
    const { a } = await joined();
    const read = () =>
      server
        .prepare('SELECT recap_enabled, recap_body, recap_tz FROM accounts')
        .first<{ recap_enabled: number; recap_body: string | null; recap_tz: string | null }>();
    expect((await read())?.recap_body).toBeNull();
    await a.sync.setRecap(true);
    expect(await read()).toMatchObject({ recap_enabled: 1, recap_tz: 'America/Chicago' });
    expect(JSON.parse((await read())?.recap_body ?? '[]')).toEqual([
      expect.objectContaining({ name: 'Sam', quests: 0 }),
    ]);
    expect(await a.sync.status()).toMatchObject({ recap: true });
    await a.sync.setRecap(false);
    expect((await read())?.recap_body).toBeNull();
  });

  it('shares one run between overlapping calls', async () => {
    const { a } = await joined();
    const [x, y] = [a.sync.run(), a.sync.run()];
    expect(x).toBe(y);
    await x;
  });

  it('says when the server is unreachable', async () => {
    const db = new AppDb(`sync-${crypto.randomUUID()}`);
    dbs.push(db);
    const api = httpApi('https://app.test', async () => {
      throw new TypeError('offline');
    });
    const sync = createSync({ db, api, now: () => clock, timeZone: () => 'UTC' });
    await expect(sync.sendCode(EMAIL)).rejects.toThrow(/Can't reach/);
    await db.syncState.put({
      id: 'sync',
      email: EMAIL,
      token: 't',
      familyKey: new Uint8Array(32).buffer,
      wrapped: 'w',
      cursor: 0,
      pushFrom: 0,
      recap: false,
      updatedAt: 0,
    });
    expect((await sync.run()).error).toMatch(/Can't reach/);
    expect(await sync.status()).toMatchObject({ kind: 'on' });
  });
});
