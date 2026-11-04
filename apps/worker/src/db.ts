/**
 * The slice of Cloudflare D1 the Worker uses, so tests can run the same SQL on node:sqlite.
 */
export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface Db {
  prepare(query: string): Statement;
  /** Runs in one transaction. */
  batch(statements: Statement[]): Promise<unknown[]>;
}

/**
 * The schema, created on first use so a deploy needs no migration step. To change it, add
 * statements that are safe to repeat; never edit one that has shipped.
 */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    seq INTEGER NOT NULL DEFAULT 0,
    key_envelope TEXT,
    recap_enabled INTEGER NOT NULL DEFAULT 0,
    recap_tz TEXT,
    recap_week TEXT,
    recap_body TEXT,
    recap_sent_week TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS codes (
    email TEXT PRIMARY KEY,
    hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    tries INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_account ON sessions (account_id)`,
  `CREATE TABLE IF NOT EXISTS records (
    account_id TEXT NOT NULL,
    id TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    data TEXT,
    PRIMARY KEY (account_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS records_seq ON records (account_id, seq)`,
  `CREATE TABLE IF NOT EXISTS limits (
    key TEXT NOT NULL,
    window INTEGER NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (key, window)
  )`,
];

const ready = new WeakMap<Db, Promise<unknown>>();

export function ensureSchema(db: Db): Promise<unknown> {
  let done = ready.get(db);
  if (!done) {
    done = db.batch(SCHEMA.map((sql) => db.prepare(sql)));
    done.catch(() => ready.delete(db));
    ready.set(db, done);
  }
  return done;
}
