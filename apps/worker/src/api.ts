import { ensureSchema, type Db } from './db';
import {
  LIMITS,
  type AccountInfo,
  type HealthResponse,
  type KeyEnvelope,
  type PullResponse,
  type PulledRecord,
  type PushRequest,
  type PushResponse,
  type PutKeyRequest,
  type RecapRequest,
  type SignOutRequest,
  type StartRequest,
  type VerifyRequest,
  type VerifyResponse,
  type WireRecord,
} from './protocol';
import type { Mailer } from './mail';
import { signInEmail } from './recap';

export interface ApiDeps {
  db: Db;
  /** Undefined when email isn't set up: sign-in then says so instead of failing quietly. */
  mail: Mailer | undefined;
  now: () => number;
}

const HOUR_MS = 60 * 60 * 1000;
const IP_STARTS_PER_HOUR = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const empty = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

const encoder = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  let text = '';
  for (const b of bytes) text += String.fromCharCode(b);
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

const randomText = (size: number) => base64url(crypto.getRandomValues(new Uint8Array(size)));

async function sha256(text: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text))));
}

/** Six digits, every one equally likely. */
function sixDigits(): string {
  const limit = Math.floor(0x1_0000_0000 / 1_000_000) * 1_000_000;
  for (;;) {
    const [n] = crypto.getRandomValues(new Uint32Array(1));
    if (n !== undefined && n < limit) return String(n % 1_000_000).padStart(6, '0');
  }
}

async function body<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, 'The request was not readable.');
  }
}

const normalEmail = (value: unknown) => {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (email.length > 254 || !EMAIL.test(email))
    throw new HttpError(400, 'Check the email address.');
  return email;
};

const isEnvelope = (value: unknown): value is KeyEnvelope => {
  const v = value as KeyEnvelope;
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof v.salt === 'string' &&
    typeof v.iv === 'string' &&
    typeof v.wrapped === 'string' &&
    Number.isInteger(v.iterations) &&
    v.iterations >= 100_000 &&
    v.salt.length + v.iv.length + v.wrapped.length < 1000
  );
};

const isRecord = (value: unknown): value is WireRecord => {
  const r = value as WireRecord;
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof r.id === 'string' &&
    r.id.length > 0 &&
    r.id.length <= 64 &&
    Number.isSafeInteger(r.updatedAt) &&
    r.updatedAt >= 0 &&
    (r.data === null || (typeof r.data === 'string' && r.data.length <= LIMITS.recordChars))
  );
};

interface RecordRow {
  id: string;
  updated_at: number;
  seq: number;
  data: string | null;
}

const toPulled = (r: RecordRow): PulledRecord => ({
  id: r.id,
  updatedAt: r.updated_at,
  seq: r.seq,
  data: r.data,
});

export function createApi({ db, mail, now }: ApiDeps) {
  /** Counts within the current hour, so a typo'd address can't flood someone's inbox. */
  async function withinLimit(key: string, max: number): Promise<boolean> {
    const window = Math.floor(now() / HOUR_MS);
    const row = await db
      .prepare(
        `INSERT INTO limits (key, window, count) VALUES (?, ?, 1)
         ON CONFLICT (key, window) DO UPDATE SET count = count + 1 RETURNING count`,
      )
      .bind(key, window)
      .first<{ count: number }>();
    return (row?.count ?? 1) <= max;
  }

  async function accountFor(request: Request): Promise<string> {
    const header = request.headers.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new HttpError(401, 'Sign in again.');
    const hash = await sha256(token);
    const row = await db
      .prepare('SELECT account_id, last_seen FROM sessions WHERE token_hash = ?')
      .bind(hash)
      .first<{ account_id: string; last_seen: number }>();
    if (!row) throw new HttpError(401, 'Sign in again.');
    if (now() - row.last_seen > 24 * HOUR_MS) {
      await db
        .prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?')
        .bind(now(), hash)
        .run();
    }
    return row.account_id;
  }

  async function info(accountId: string): Promise<AccountInfo> {
    const row = await db
      .prepare('SELECT email, key_envelope, recap_enabled FROM accounts WHERE id = ?')
      .bind(accountId)
      .first<{ email: string; key_envelope: string | null; recap_enabled: number }>();
    if (!row) throw new HttpError(401, 'Sign in again.');
    return { email: row.email, hasKey: row.key_envelope !== null, recap: row.recap_enabled === 1 };
  }

  const routes: Record<string, (request: Request, url: URL) => Promise<Response>> = {
    'GET /api/health': async () =>
      json({ ok: true, email: mail !== undefined } satisfies HealthResponse),

    async 'POST /api/auth/start'(request) {
      const { email: raw } = await body<StartRequest>(request);
      const email = normalEmail(raw);
      if (!mail) throw new HttpError(503, "Email isn't set up on this server yet.");
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
      const allowed =
        (await withinLimit(`ip:${ip}`, IP_STARTS_PER_HOUR)) &&
        (await withinLimit(`email:${email}`, LIMITS.codesPerHour));
      if (!allowed) throw new HttpError(429, 'Too many codes. Wait an hour and try again.');
      const code = sixDigits();
      const salt = randomText(16);
      await db
        .prepare(
          `INSERT INTO codes (email, hash, salt, expires_at, tries) VALUES (?, ?, ?, ?, 0)
           ON CONFLICT (email) DO UPDATE SET
             hash = excluded.hash, salt = excluded.salt, expires_at = excluded.expires_at, tries = 0`,
        )
        .bind(email, await sha256(`${salt}:${code}`), salt, now() + LIMITS.codeMinutes * 60_000)
        .run();
      try {
        await mail(signInEmail(email, code));
      } catch (error) {
        console.error(error);
        throw new HttpError(502, "The email couldn't be sent. Try again in a minute.");
      }
      return empty();
    },

    async 'POST /api/auth/verify'(request) {
      const input = await body<VerifyRequest>(request);
      const email = normalEmail(input.email);
      const code = typeof input.code === 'string' ? input.code.replace(/\D/g, '') : '';
      const row = await db
        .prepare('SELECT hash, salt, expires_at, tries FROM codes WHERE email = ?')
        .bind(email)
        .first<{ hash: string; salt: string; expires_at: number; tries: number }>();
      const wrong = () => new HttpError(400, "That code didn't work. Check it, or send a new one.");
      if (!row || row.expires_at < now() || row.tries >= LIMITS.codeTries) throw wrong();
      if ((await sha256(`${row.salt}:${code}`)) !== row.hash) {
        await db.prepare('UPDATE codes SET tries = tries + 1 WHERE email = ?').bind(email).run();
        throw wrong();
      }
      await db.prepare('DELETE FROM codes WHERE email = ?').bind(email).run();
      await db
        .prepare(
          'INSERT INTO accounts (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT (email) DO NOTHING',
        )
        .bind(crypto.randomUUID(), email, now())
        .run();
      const account = await db
        .prepare('SELECT id FROM accounts WHERE email = ?')
        .bind(email)
        .first<{ id: string }>();
      if (!account) throw new HttpError(500, 'The account could not be made.');
      const token = randomText(32);
      await db
        .prepare(
          'INSERT INTO sessions (token_hash, account_id, created_at, last_seen) VALUES (?, ?, ?, ?)',
        )
        .bind(await sha256(token), account.id, now(), now())
        .run();
      return json({ token, ...(await info(account.id)) } satisfies VerifyResponse);
    },

    async 'POST /api/auth/signout'(request) {
      const accountId = await accountFor(request);
      const { all } = await body<SignOutRequest>(request);
      if (all) {
        await db.prepare('DELETE FROM sessions WHERE account_id = ?').bind(accountId).run();
      } else {
        const token = (request.headers.get('authorization') ?? '').slice(7);
        await db
          .prepare('DELETE FROM sessions WHERE token_hash = ?')
          .bind(await sha256(token))
          .run();
      }
      return empty();
    },

    'GET /api/account': async (request) => json(await info(await accountFor(request))),

    /** Everything the server holds for this family, gone in one transaction. */
    async 'DELETE /api/account'(request) {
      const accountId = await accountFor(request);
      await db.batch([
        db.prepare('DELETE FROM records WHERE account_id = ?').bind(accountId),
        db.prepare('DELETE FROM sessions WHERE account_id = ?').bind(accountId),
        db.prepare('DELETE FROM accounts WHERE id = ?').bind(accountId),
      ]);
      return empty();
    },

    async 'GET /api/key'(request) {
      const accountId = await accountFor(request);
      const row = await db
        .prepare('SELECT key_envelope FROM accounts WHERE id = ?')
        .bind(accountId)
        .first<{ key_envelope: string | null }>();
      if (!row?.key_envelope) throw new HttpError(404, 'No family key yet.');
      return json(JSON.parse(row.key_envelope) as KeyEnvelope);
    },

    async 'PUT /api/key'(request) {
      const accountId = await accountFor(request);
      const { envelope, replace } = await body<PutKeyRequest>(request);
      if (!isEnvelope(envelope)) throw new HttpError(400, 'The family key was not readable.');
      const text = JSON.stringify(envelope);
      if (replace) {
        // A new key can't read old rows, so they go.
        await db.batch([
          db.prepare('DELETE FROM records WHERE account_id = ?').bind(accountId),
          db.prepare('UPDATE accounts SET key_envelope = ? WHERE id = ?').bind(text, accountId),
        ]);
        return empty();
      }
      const row = await db
        .prepare(
          'UPDATE accounts SET key_envelope = ? WHERE id = ? AND key_envelope IS NULL RETURNING id',
        )
        .bind(text, accountId)
        .first();
      if (!row) throw new HttpError(409, 'This family already has a key.');
      return empty();
    },

    async 'GET /api/sync'(request, url) {
      const accountId = await accountFor(request);
      const since = Number(url.searchParams.get('since') ?? 0);
      if (!Number.isSafeInteger(since) || since < 0) throw new HttpError(400, 'Bad position.');
      const { results } = await db
        .prepare(
          `SELECT id, updated_at, seq, data FROM records
           WHERE account_id = ? AND seq > ? ORDER BY seq LIMIT ?`,
        )
        .bind(accountId, since, LIMITS.pullRecords + 1)
        .all<RecordRow>();
      const page = results.slice(0, LIMITS.pullRecords);
      const records = page.map(toPulled);
      return json({
        records,
        next: records.at(-1)?.seq ?? since,
        more: results.length > LIMITS.pullRecords,
      } satisfies PullResponse);
    },

    /**
     * Keeps each row's later copy; a tie keeps the one already stored. Every stored row gets its own, higher seq inside one
     * transaction, so a device pulling at the same time can never skip one.
     */
    async 'POST /api/sync'(request) {
      const accountId = await accountFor(request);
      const input = await body<PushRequest>(request);
      if (!Array.isArray(input.records) || input.records.length > LIMITS.pushRecords) {
        throw new HttpError(400, `Send at most ${LIMITS.pushRecords} rows at a time.`);
      }
      if (!input.records.every(isRecord)) throw new HttpError(400, 'A row was not readable.');
      const latest = new Map<string, WireRecord>();
      for (const r of input.records) {
        const seen = latest.get(r.id);
        if (!seen || r.updatedAt >= seen.updatedAt) latest.set(r.id, r);
      }
      const records = [...latest.values()];
      if (records.length === 0) return json({ stored: 0, newer: [] } satisfies PushResponse);
      const n = records.length;
      await db.batch([
        db.prepare('UPDATE accounts SET seq = seq + ? WHERE id = ?').bind(n, accountId),
        ...records.map((r, i) =>
          db
            .prepare(
              `INSERT INTO records (account_id, id, updated_at, seq, data)
               VALUES (?, ?, ?, (SELECT seq FROM accounts WHERE id = ?) - ?, ?)
               ON CONFLICT (account_id, id) DO UPDATE SET
                 updated_at = excluded.updated_at, seq = excluded.seq, data = excluded.data
               WHERE excluded.updated_at > records.updated_at`,
            )
            .bind(accountId, r.id, r.updatedAt, accountId, n - 1 - i, r.data),
        ),
      ]);
      const { results } = await db
        .prepare(
          `SELECT id, updated_at, seq, data FROM records
           WHERE account_id = ? AND id IN (${records.map(() => '?').join(',')})`,
        )
        .bind(accountId, ...records.map((r) => r.id))
        .all<RecordRow>();
      // Anything that isn't exactly what was sent goes back, so the device can merge it.
      const pushed = new Map(records.map((r) => [r.id, r]));
      const newer = results
        .filter((r) => {
          const sent = pushed.get(r.id);
          return sent !== undefined && (r.updated_at !== sent.updatedAt || r.data !== sent.data);
        })
        .map(toPulled);
      return json({ stored: n - newer.length, newer } satisfies PushResponse);
    },

    async 'PUT /api/recap'(request) {
      const accountId = await accountFor(request);
      const input = await body<RecapRequest>(request);
      if (!input.enabled) {
        await db
          .prepare(
            `UPDATE accounts SET recap_enabled = 0, recap_tz = NULL, recap_week = NULL,
             recap_body = NULL WHERE id = ?`,
          )
          .bind(accountId)
          .run();
        return empty();
      }
      const zone = typeof input.timeZone === 'string' ? input.timeZone : 'UTC';
      try {
        new Intl.DateTimeFormat('en', { timeZone: zone });
      } catch {
        throw new HttpError(400, 'Unknown time zone.');
      }
      const children = Array.isArray(input.children) ? input.children.slice(0, 10) : [];
      const text = JSON.stringify(children);
      if (text.length > 20_000) throw new HttpError(400, 'The recap is too long.');
      const week =
        typeof input.week === 'string' && /^\d{4}-\d\d-\d\d$/.test(input.week) ? input.week : null;
      await db
        .prepare(
          `UPDATE accounts SET recap_enabled = 1, recap_tz = ?, recap_week = ?, recap_body = ?
           WHERE id = ?`,
        )
        .bind(zone, week, text, accountId)
        .run();
      return empty();
    },
  };

  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = routes[`${request.method} ${url.pathname}`];
    if (!route) return json({ error: 'Not found.' }, 404);
    try {
      await ensureSchema(db);
      return await route(request, url);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.error(error);
      return json({ error: 'Something went wrong on the server.' }, 500);
    }
  };
}
