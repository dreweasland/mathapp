import type { AppDb, CheerAudio, StoredCheer } from './db';

const FORMAT = 'math-quest-backup';
const VERSION = 1;

type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object';
type Rules = Record<string, FieldType>;

const OWNED: Rules = { childId: 'string', updatedAt: 'number' };

/** Enough of each row's shape that the app can't crash on a damaged or hand-edited file. */
const TABLES = {
  children: {
    id: 'string',
    name: 'string',
    avatar: 'string',
    theme: 'string',
    grade: 'number',
    dailyGoal: 'string',
    settings: 'object',
    questsCompleted: 'number',
    createdAt: 'number',
    updatedAt: 'number',
  },
  skillStates: {
    ...OWNED,
    skillId: 'string',
    mastery: 'number',
    attempts: 'number',
    difficulty: 'number',
    errorCounts: 'object',
    fastStreak: 'number',
    wrongStreak: 'number',
    questsOnSkill: 'number',
  },
  factCards: { ...OWNED, factId: 'string', box: 'number', dueDate: 'string', history: 'array' },
  attempts: {
    ...OWNED,
    id: 'string',
    sessionId: 'string',
    skillId: 'string',
    correct: 'boolean',
    tryNumber: 'number',
    responseMs: 'number',
    at: 'number',
  },
  sessions: {
    ...OWNED,
    id: 'string',
    startedAt: 'number',
    date: 'string',
    type: 'string',
    problemsCount: 'number',
    correctCount: 'number',
    coinsEarned: 'number',
    completedQuest: 'boolean',
  },
  streaks: {
    ...OWNED,
    current: 'number',
    best: 'number',
    shields: 'number',
    parentShields: 'number',
    countedDates: 'array',
    excusedDates: 'array',
    perfectWeeks: 'array',
  },
  wallets: { ...OWNED, coins: 'number', lifetimeCoins: 'number' },
  inventories: {
    ...OWNED,
    items: 'array',
    mascotEquipped: 'object',
    unopened: 'array',
    dupesInARow: 'number',
  },
  missions: {
    ...OWNED,
    date: 'string',
    slot: 'number',
    kind: 'string',
    target: 'number',
    progress: 'number',
    done: 'boolean',
  },
  goals: {
    ...OWNED,
    id: 'string',
    title: 'string',
    imageKey: 'string',
    target: 'number',
    unit: 'string',
    progress: 'number',
    rewardText: 'string',
    startDate: 'string',
    delivered: 'boolean',
  },
  cheers: { ...OWNED, id: 'string', createdAt: 'number' },
} as const satisfies Record<string, Rules>;

export type TableName = keyof typeof TABLES;
const TABLE_NAMES = Object.keys(TABLES) as TableName[];

type Row = Record<string, unknown>;

export interface Backup {
  format: typeof FORMAT;
  version: number;
  exportedAt: number;
  tables: Record<TableName, Row[]>;
}

export interface BackupSummary {
  exportedAt: number;
  children: { name: string; avatar: string; quests: number }[];
}

export type ParsedBackup =
  { ok: true; backup: Backup; summary: BackupSummary } | { ok: false; reason: string };

function toBase64(bytes: ArrayBuffer): string {
  let text = '';
  for (const byte of new Uint8Array(bytes)) text += String.fromCharCode(byte);
  return btoa(text);
}

function fromBase64(text: string): ArrayBuffer {
  const decoded = atob(text);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes.buffer;
}

const encodeCheer = ({ audio, ...rest }: StoredCheer): Row =>
  audio ? { ...rest, audio: { base64: toBase64(audio.bytes), type: audio.type } } : rest;

function decodeCheer(row: Row): StoredCheer {
  const { audio, ...rest } = row as unknown as StoredCheer & {
    audio?: { base64: string; type: string };
  };
  if (!audio) return rest;
  const decoded: CheerAudio = { bytes: fromBase64(audio.base64), type: audio.type };
  return { ...rest, audio: decoded };
}

/** All children, but not the PIN: restoring a file must never open a stranger's dashboard. */
export async function createBackup(db: AppDb, at: number): Promise<Backup> {
  const rows = await Promise.all(TABLE_NAMES.map((name) => db.table<Row>(name).toArray()));
  const tables = Object.fromEntries(
    TABLE_NAMES.map((name, i) => [name, rows[i]]),
  ) as Backup['tables'];
  tables.cheers = (tables.cheers as unknown as StoredCheer[]).map(encodeCheer);
  return { format: FORMAT, version: VERSION, exportedAt: at, tables };
}

const isType = (value: unknown, type: FieldType) => {
  if (type === 'array') return Array.isArray(value);
  if (type === 'object')
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
};

const isObject = (value: unknown): value is Row => isType(value, 'object');

function rowProblem(name: TableName, row: unknown, childIds: Set<string>): string | undefined {
  if (!isObject(row)) return `${name} has a row that isn't readable.`;
  for (const [field, type] of Object.entries(TABLES[name])) {
    if (!isType(row[field], type)) return `${name} has a row with a bad ${field}.`;
  }
  if (name !== 'children' && !childIds.has(row.childId as string)) {
    return `${name} has a row for a child who isn't in the file.`;
  }
  if (name === 'cheers' && row.audio !== undefined) {
    const audio = row.audio;
    if (!isObject(audio) || typeof audio.base64 !== 'string' || typeof audio.type !== 'string') {
      return 'cheers has a recording that is not readable.';
    }
    try {
      atob(audio.base64);
    } catch {
      return 'cheers has a recording that is not readable.';
    }
  }
  return undefined;
}

/** Everything in the file is checked before the device's data is touched. */
export function parseBackup(text: string): ParsedBackup {
  const fail = (reason: string): ParsedBackup => ({ ok: false, reason });
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return fail("This file isn't a backup: it can't be read.");
  }
  if (!isObject(data) || data.format !== FORMAT) return fail("This file isn't a backup.");
  if (data.version !== VERSION) {
    return fail('This backup came from a different version of the app.');
  }
  if (!isType(data.exportedAt, 'number') || !isObject(data.tables)) {
    return fail('This backup is damaged.');
  }
  const tables = data.tables;
  for (const name of TABLE_NAMES) {
    if (!Array.isArray(tables[name])) return fail(`This backup is damaged: ${name} is missing.`);
  }
  const people = tables.children as Row[];
  if (people.length === 0) return fail('This backup has no children in it.');
  const childIds = new Set(people.map((c) => (isObject(c) ? (c.id as string) : '')));
  for (const name of TABLE_NAMES) {
    for (const row of tables[name] as unknown[]) {
      const problem = rowProblem(name, row, childIds);
      if (problem) return fail(`This backup is damaged: ${problem}`);
    }
  }
  const backup = data as unknown as Backup;
  return {
    ok: true,
    backup,
    summary: {
      exportedAt: backup.exportedAt,
      children: (people as { name: string; avatar: string; questsCompleted: number }[]).map(
        (c) => ({ name: c.name, avatar: c.avatar, quests: c.questsCompleted }),
      ),
    },
  };
}

/** Replaces everything in one transaction, so a failure leaves the device as it was. */
export async function restoreBackup(db: AppDb, backup: Backup): Promise<void> {
  const cheers = backup.tables.cheers.map(decodeCheer);
  const tables = TABLE_NAMES.map((name) => db.table<Row>(name));
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
    await Promise.all(
      TABLE_NAMES.map((name) =>
        db.table(name).bulkPut(name === 'cheers' ? cheers : backup.tables[name]),
      ),
    );
  });
}
