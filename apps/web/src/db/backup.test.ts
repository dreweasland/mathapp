import 'fake-indexeddb/auto';
import { newInventory, newStreak, newWallet, type Goal } from '@mathapp/engine';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBackup, parseBackup, restoreBackup, type Backup } from './backup';
import { AppDb, type StoredCheer } from './db';
import { backupDue, familyRepository } from './repositories/family';
import { parentRepository } from './repositories/parent';

const NOW = new Date(2026, 10, 2, 12).getTime();
const DAY = 24 * 60 * 60 * 1000;

let db: AppDb;
beforeEach(() => {
  db = new AppDb(`backup-${crypto.randomUUID()}`);
});
afterEach(async () => {
  await db.delete();
});

const goal = (childId: string): Goal => ({
  id: 'g1',
  childId,
  title: 'Movie night',
  imageKey: '🎬',
  target: 5,
  unit: 'quests',
  progress: 2,
  rewardText: 'movie night',
  startDate: '2026-11-02',
  delivered: false,
  updatedAt: 1,
});

async function family() {
  const repo = parentRepository(db, () => NOW);
  const sam = await repo.addChild({ name: 'Sam', avatar: '🦊' });
  const kim = await repo.addChild({ name: 'Kim', avatar: '🐼' });
  await db.children.update(sam.id, { questsCompleted: 12 });
  await db.wallets.put({ ...newWallet(sam.id), coins: 40, lifetimeCoins: 90 });
  await db.streaks.put({ ...newStreak(sam.id), current: 6, best: 9 });
  await db.inventories.put({ ...newInventory(sam.id), items: ['forest.fox'] });
  await db.goals.put(goal(sam.id));
  const cheer: StoredCheer = {
    id: 'c1',
    childId: sam.id,
    audio: { bytes: new Uint8Array([1, 2, 250]).buffer, type: 'audio/mp4' },
    createdAt: 5,
    updatedAt: 5,
  };
  await db.cheers.put(cheer);
  await db.cheers.put({ id: 'c2', childId: kim.id, emoji: '🌟', createdAt: 6, updatedAt: 6 });
  return { repo, sam, kim };
}

const textOf = async () => JSON.stringify(await createBackup(db, NOW));

describe('backup round trip', () => {
  it('moves everything to an empty device', async () => {
    const { sam } = await family();
    const parsed = parseBackup(await textOf());
    if (!parsed.ok) throw new Error(parsed.reason);
    expect(parsed.summary.children.map((c) => c.name)).toEqual(
      expect.arrayContaining(['Sam', 'Kim']),
    );

    const other = new AppDb(`backup-${crypto.randomUUID()}`);
    await restoreBackup(other, parsed.backup);
    expect((await other.wallets.get(sam.id))?.lifetimeCoins).toBe(90);
    expect((await other.streaks.get(sam.id))?.best).toBe(9);
    expect((await other.inventories.get(sam.id))?.items).toEqual(['forest.fox']);
    expect((await other.goals.get('g1'))?.progress).toBe(2);
    const cheer = await other.cheers.get('c1');
    expect(cheer?.audio?.type).toBe('audio/mp4');
    expect([...new Uint8Array(cheer?.audio?.bytes as ArrayBuffer)]).toEqual([1, 2, 250]);
    expect((await other.cheers.get('c2'))?.emoji).toBe('🌟');
    await other.delete();
  });

  it('replaces what was on the device instead of mixing with it', async () => {
    await family();
    const parsed = parseBackup(await textOf());
    if (!parsed.ok) throw new Error(parsed.reason);
    const stray = await parentRepository(db, () => NOW).addChild({ name: 'New', avatar: '🐸' });
    await restoreBackup(db, parsed.backup);
    expect(await db.children.get(stray.id)).toBeUndefined();
    expect(await db.children.count()).toBe(2);
  });

  it('never carries the PIN, in the file or over the one on the device', async () => {
    await family();
    await familyRepository(db).savePin('secret-hash', 'salt');
    const text = await textOf();
    expect(text).not.toContain('secret-hash');
    const parsed = parseBackup(text);
    if (!parsed.ok) throw new Error(parsed.reason);
    await restoreBackup(db, parsed.backup);
    expect((await familyRepository(db).get()).pinHash).toBe('secret-hash');
  });

  it('leaves the device untouched if the restore fails partway', async () => {
    const { sam } = await family();
    const parsed = parseBackup(await textOf());
    if (!parsed.ok) throw new Error(parsed.reason);
    // Two rows with no key: parseBackup would catch this, so it's forced in here.
    const broken: Backup = {
      ...parsed.backup,
      tables: {
        ...parsed.backup.tables,
        skillStates: [{ childId: sam.id } as Record<string, unknown>],
      },
    };
    await expect(restoreBackup(db, broken)).rejects.toThrow();
    expect((await db.wallets.get(sam.id))?.coins).toBe(40);
    expect(await db.children.count()).toBe(2);
  });
});

describe('parseBackup', () => {
  const mangle = async (change: (b: Backup) => void) => {
    const backup = JSON.parse(await textOf()) as Backup;
    change(backup);
    return parseBackup(JSON.stringify(backup));
  };
  const reason = (r: ReturnType<typeof parseBackup>) => (r.ok ? 'accepted' : r.reason);

  it('turns away files that are not backups', () => {
    expect(reason(parseBackup('not json'))).toMatch(/can't be read/);
    expect(reason(parseBackup('[]'))).toMatch(/isn't a backup/);
    expect(reason(parseBackup('null'))).toMatch(/isn't a backup/);
    expect(reason(parseBackup('{"format":"other"}'))).toMatch(/isn't a backup/);
  });
  it('turns away a different version', async () => {
    await family();
    expect(reason(await mangle((b) => (b.version = 99)))).toMatch(/different version/);
  });
  it('turns away a file with a table missing, or no children', async () => {
    await family();
    const noWallets = await mangle((b) => {
      delete (b.tables as Partial<Backup['tables']>).wallets;
    });
    expect(reason(noWallets)).toMatch(/wallets/);
    expect(reason(await mangle((b) => (b.tables.children = [])))).toMatch(/no children/);
  });
  it('turns away rows the app could crash on', async () => {
    await family();
    const cases: ((b: Backup) => void)[] = [
      (b) => ((b.tables.wallets[0] as Record<string, unknown>).coins = 'lots'),
      (b) => ((b.tables.inventories[0] as Record<string, unknown>).items = 'none'),
      (b) => ((b.tables.children[0] as Record<string, unknown>).name = 7),
      (b) => (b.tables.goals[0] = null as unknown as Record<string, unknown>),
      (b) => ((b.tables.streaks[0] as Record<string, unknown>).current = null),
    ];
    for (const change of cases) expect(reason(await mangle(change))).toMatch(/damaged/);
  });
  it('turns away a row for a child who is not in the file', async () => {
    await family();
    const result = await mangle((b) => {
      (b.tables.wallets[0] as Record<string, unknown>).childId = 'stranger';
    });
    expect(reason(result)).toMatch(/isn't in the file/);
  });
  it('turns away a recording that cannot be decoded', async () => {
    await family();
    const result = await mangle((b) => {
      const row = b.tables.cheers.find((c) => c.audio) as Record<string, unknown>;
      row.audio = { base64: '***', type: 'audio/mp4' };
    });
    expect(reason(result)).toMatch(/recording/);
  });
});

describe('backupDue', () => {
  const row = (lastBackupAt?: number) => ({
    id: 'family' as const,
    updatedAt: 0,
    ...(lastBackupAt === undefined ? {} : { lastBackupAt }),
  });
  it('waits until there is real progress to protect', () => {
    expect(backupDue(row(), 6, NOW)).toBe(false);
    expect(backupDue(row(), 7, NOW)).toBe(true);
  });
  it('asks again after two weeks', () => {
    expect(backupDue(row(NOW - 13 * DAY), 50, NOW)).toBe(false);
    expect(backupDue(row(NOW - 14 * DAY), 50, NOW)).toBe(true);
  });
});

describe('parent repository', () => {
  it('resets one child completely and leaves the other alone', async () => {
    const { repo, sam, kim } = await family();
    await db.children.update(sam.id, { placedAt: 5 });
    await repo.resetChild((await db.children.get(sam.id)) as typeof sam);
    const after = await db.children.get(sam.id);
    expect(after?.name).toBe('Sam');
    expect(after?.questsCompleted).toBe(0);
    expect(after?.placedAt).toBeUndefined();
    expect(await db.wallets.get(sam.id)).toBeUndefined();
    expect(await db.goals.get('g1')).toBeUndefined();
    expect(await db.cheers.get('c1')).toBeUndefined();
    expect(await db.cheers.get('c2')).toBeDefined();
    expect(await db.children.get(kim.id)).toBeDefined();
  });
  it('removes a profile with its data', async () => {
    const { repo, sam } = await family();
    await repo.removeChild(sam.id);
    expect(await db.children.get(sam.id)).toBeUndefined();
    expect(await db.streaks.get(sam.id)).toBeUndefined();
  });
  it('grants a shield within the cap, and marks it as parent-granted', async () => {
    const { repo, sam } = await family();
    for (let i = 0; i < 3; i++) await repo.grantShield(sam.id);
    const streak = await db.streaks.get(sam.id);
    expect(streak?.shields).toBe(2);
    expect(streak?.parentShields).toBe(2);
  });
  it('can start a child later, counting earlier skills as passed', async () => {
    const { repo, kim } = await family();
    await repo.startAt(kim, '1.add-within-10');
    const states = await db.skillStates.where('childId').equals(kim.id).toArray();
    const passed = states.filter((s) => s.placedOut).map((s) => s.skillId);
    expect(passed).toEqual(expect.arrayContaining(['1.counting', '1.ten-frame']));
    expect(passed).not.toContain('1.add-within-10');
    expect((await db.children.get(kim.id))?.placedAt).toBe(NOW);
  });
  it('gathers everything the dashboard needs for one child', async () => {
    const { repo, sam } = await family();
    const view = await repo.dashboard(sam);
    expect(view.goals.map((g) => g.id)).toEqual(['g1']);
    expect(view.cheers.map((c) => c.id)).toEqual(['c1']);
    expect(view.progress.wallet.coins).toBe(40);
  });
});
