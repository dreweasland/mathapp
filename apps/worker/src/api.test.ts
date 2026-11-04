import { beforeEach, describe, expect, it } from 'vitest';
import { createApi } from './api';
import type { Db } from './db';
import type { Email } from './mail';
import type {
  AccountInfo,
  KeyEnvelope,
  PullResponse,
  PushResponse,
  VerifyResponse,
  WireRecord,
} from './protocol';
import { LIMITS } from './protocol';
import { sendRecaps } from './recap';
import { memoryDb } from './testing/memoryDb';

const ENVELOPE: KeyEnvelope = { salt: 'c2FsdA', iterations: 600_000, iv: 'aXY', wrapped: 'a2V5' };

let db: Db;
let sent: Email[];
let clock: number;
let api: (request: Request) => Promise<Response>;

const call = (method: string, path: string, body?: unknown, token?: string, ip = '1.1.1.1') =>
  api(
    new Request(`https://app.test${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': ip,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );

const lastCode = () => /(\d{6})/.exec(sent.at(-1)?.subject ?? '')?.[1] ?? '';

async function signIn(email = 'Parent@Example.com'): Promise<VerifyResponse> {
  expect((await call('POST', '/api/auth/start', { email })).status).toBe(204);
  const response = await call('POST', '/api/auth/verify', { email, code: lastCode() });
  expect(response.status).toBe(200);
  return (await response.json()) as VerifyResponse;
}

const rec = (id: string, updatedAt: number, data: string | null = `d-${id}-${updatedAt}`) =>
  ({ id, updatedAt, data }) satisfies WireRecord;

beforeEach(() => {
  db = memoryDb();
  sent = [];
  clock = Date.UTC(2026, 10, 3, 12);
  api = createApi({ db, mail: async (e) => void sent.push(e), now: () => clock });
});

describe('health', () => {
  it('says whether email works', async () => {
    expect(await (await call('GET', '/api/health')).json()).toEqual({ ok: true, email: true });
    const noMail = createApi({ db, mail: undefined, now: () => clock });
    const response = await noMail(new Request('https://app.test/api/health'));
    expect(await response.json()).toEqual({ ok: true, email: false });
    const start = await noMail(
      new Request('https://app.test/api/auth/start', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.co' }),
      }),
    );
    expect(start.status).toBe(503);
  });

  it('answers unknown routes with 404', async () => {
    expect((await call('GET', '/api/nope')).status).toBe(404);
  });
});

describe('sign-in', () => {
  it('emails a six-digit code and signs in with it', async () => {
    const account = await signIn();
    expect(sent[0]?.to).toBe('parent@example.com');
    expect(sent[0]?.text).toContain(lastCode());
    expect(account).toMatchObject({ email: 'parent@example.com', hasKey: false, recap: false });
    expect(account.token.length).toBeGreaterThan(30);
    const me = await call('GET', '/api/account', undefined, account.token);
    expect(((await me.json()) as AccountInfo).email).toBe('parent@example.com');
  });

  it('signs the same email into the same family', async () => {
    const a = await signIn();
    await call('PUT', '/api/key', { envelope: ENVELOPE }, a.token);
    const b = await signIn('parent@example.com ');
    expect(b.hasKey).toBe(true);
  });

  it('refuses a bad address', async () => {
    expect((await call('POST', '/api/auth/start', { email: 'nope' })).status).toBe(400);
    expect((await call('POST', '/api/auth/start', {})).status).toBe(400);
  });

  it('refuses wrong, used, expired and over-tried codes', async () => {
    const email = 'p@example.com';
    await call('POST', '/api/auth/start', { email });
    const code = lastCode();
    const wrong = code === '000000' ? '111111' : '000000';
    expect((await call('POST', '/api/auth/verify', { email, code: wrong })).status).toBe(400);
    expect((await call('POST', '/api/auth/verify', { email, code })).status).toBe(200);
    expect((await call('POST', '/api/auth/verify', { email, code })).status).toBe(400);

    await call('POST', '/api/auth/start', { email });
    clock += (LIMITS.codeMinutes + 1) * 60_000;
    expect((await call('POST', '/api/auth/verify', { email, code: lastCode() })).status).toBe(400);

    await call('POST', '/api/auth/start', { email });
    const good = lastCode();
    const bad = good === '000000' ? '111111' : '000000';
    for (let i = 0; i < LIMITS.codeTries; i++)
      await call('POST', '/api/auth/verify', { email, code: bad });
    expect((await call('POST', '/api/auth/verify', { email, code: good })).status).toBe(400);
  });

  it('limits codes per address each hour', async () => {
    for (let i = 0; i < LIMITS.codesPerHour; i++) {
      expect((await call('POST', '/api/auth/start', { email: 'p@example.com' })).status).toBe(204);
    }
    expect((await call('POST', '/api/auth/start', { email: 'p@example.com' })).status).toBe(429);
    clock += 60 * 60 * 1000;
    expect((await call('POST', '/api/auth/start', { email: 'p@example.com' })).status).toBe(204);
  });

  it('needs a valid token', async () => {
    expect((await call('GET', '/api/account')).status).toBe(401);
    expect((await call('GET', '/api/account', undefined, 'made-up')).status).toBe(401);
  });

  it('signs out one device or all of them', async () => {
    const a = await signIn();
    const b = await signIn();
    const c = await signIn();
    await call('POST', '/api/auth/signout', {}, a.token);
    expect((await call('GET', '/api/account', undefined, a.token)).status).toBe(401);
    expect((await call('GET', '/api/account', undefined, b.token)).status).toBe(200);
    await call('POST', '/api/auth/signout', { all: true }, b.token);
    expect((await call('GET', '/api/account', undefined, c.token)).status).toBe(401);
  });

  it('reports a failed email instead of pretending', async () => {
    const failing = createApi({
      db,
      mail: async () => {
        throw new Error('down');
      },
      now: () => clock,
    });
    const response = await failing(
      new Request('https://app.test/api/auth/start', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.co' }),
      }),
    );
    expect(response.status).toBe(502);
  });
});

describe('family key', () => {
  it('stores one key, refuses a second, and replaces on request', async () => {
    const { token } = await signIn();
    expect((await call('GET', '/api/key', undefined, token)).status).toBe(404);
    expect((await call('PUT', '/api/key', { envelope: ENVELOPE }, token)).status).toBe(204);
    expect(await (await call('GET', '/api/key', undefined, token)).json()).toEqual(ENVELOPE);
    const other = { ...ENVELOPE, wrapped: 'bmV3' };
    expect((await call('PUT', '/api/key', { envelope: other }, token)).status).toBe(409);

    await call('POST', '/api/sync', { records: [rec('a', 1)] }, token);
    expect((await call('PUT', '/api/key', { envelope: other, replace: true }, token)).status).toBe(
      204,
    );
    expect(await (await call('GET', '/api/key', undefined, token)).json()).toEqual(other);
    const pulled = (await (
      await call('GET', '/api/sync?since=0', undefined, token)
    ).json()) as PullResponse;
    expect(pulled.records).toEqual([]);
  });

  it('refuses a weak or malformed key', async () => {
    const { token } = await signIn();
    const weak = { envelope: { ...ENVELOPE, iterations: 1000 } };
    expect((await call('PUT', '/api/key', weak, token)).status).toBe(400);
    expect((await call('PUT', '/api/key', { envelope: 'x' }, token)).status).toBe(400);
  });
});

describe('sync', () => {
  const pull = async (token: string, since = 0) =>
    (await (
      await call('GET', `/api/sync?since=${since}`, undefined, token)
    ).json()) as PullResponse;
  const push = async (token: string, records: WireRecord[]) =>
    (await (await call('POST', '/api/sync', { records }, token)).json()) as PushResponse;

  it('stores rows and hands them back in order', async () => {
    const { token } = await signIn();
    expect(await push(token, [rec('a', 1), rec('b', 2)])).toEqual({ stored: 2, newer: [] });
    const first = await pull(token);
    expect(first.records.map((r) => r.id)).toEqual(['a', 'b']);
    expect(first.records[0]?.data).toBe('d-a-1');
    expect(first.more).toBe(false);
    await push(token, [rec('a', 5)]);
    const second = await pull(token, first.next);
    expect(second.records.map((r) => [r.id, r.updatedAt])).toEqual([['a', 5]]);
    expect((await pull(token, second.next)).records).toEqual([]);
  });

  it('keeps the later copy and returns it to a device that sent an older one', async () => {
    const { token } = await signIn();
    await push(token, [rec('a', 10)]);
    const reply = await push(token, [rec('a', 4), rec('b', 1)]);
    expect(reply.stored).toBe(1);
    expect(reply.newer.map((r) => [r.id, r.updatedAt, r.data])).toEqual([['a', 10, 'd-a-10']]);
  });

  it('stores deletions', async () => {
    const { token } = await signIn();
    await push(token, [rec('a', 1)]);
    await push(token, [rec('a', 2, null)]);
    expect((await pull(token)).records).toEqual([
      expect.objectContaining({ id: 'a', updatedAt: 2, data: null }),
    ]);
  });

  it('pages a large pull', async () => {
    const { token } = await signIn();
    for (let batch = 0; batch < 3; batch++) {
      const rows = Array.from({ length: LIMITS.pushRecords }, (_, i) => rec(`r${batch}-${i}`, 1));
      await push(token, rows);
    }
    const seen = new Set<string>();
    let since = 0;
    for (;;) {
      const page = await pull(token, since);
      page.records.forEach((r) => seen.add(r.id));
      since = page.next;
      if (!page.more) break;
    }
    expect(seen.size).toBe(3 * LIMITS.pushRecords);
  });

  it('keeps families apart', async () => {
    const a = await signIn('a@example.com');
    const b = await signIn('b@example.com');
    await push(a.token, [rec('same-id', 1)]);
    await push(b.token, [rec('same-id', 1, 'theirs')]);
    expect((await pull(a.token)).records[0]?.data).toBe('d-same-id-1');
    expect((await pull(b.token)).records[0]?.data).toBe('theirs');
  });

  it('refuses too many or unreadable rows', async () => {
    const { token } = await signIn();
    const many = Array.from({ length: LIMITS.pushRecords + 1 }, (_, i) => rec(`r${i}`, 1));
    expect((await call('POST', '/api/sync', { records: many }, token)).status).toBe(400);
    const bad = [{ id: '', updatedAt: 1, data: 'x' }];
    expect((await call('POST', '/api/sync', { records: bad }, token)).status).toBe(400);
    const huge = [rec('h', 1, 'x'.repeat(LIMITS.recordChars + 1))];
    expect((await call('POST', '/api/sync', { records: huge }, token)).status).toBe(400);
    expect((await call('GET', '/api/sync?since=-1', undefined, token)).status).toBe(400);
  });

  it('deletes everything with the account', async () => {
    const { token } = await signIn();
    await push(token, [rec('a', 1)]);
    expect((await call('DELETE', '/api/account', undefined, token)).status).toBe(204);
    expect((await call('GET', '/api/account', undefined, token)).status).toBe(401);
    const again = await signIn();
    expect(again.hasKey).toBe(false);
    expect((await pull(again.token)).records).toEqual([]);
  });
});

describe('weekly recap', () => {
  const kid = {
    name: 'Sam',
    quests: 5,
    minutes: 32,
    problems: 120,
    accuracy: 0.86,
    streak: 12,
    best: 15,
    badges: ['Make-10 Master'],
  };

  it('emails each family once, on Sunday evening where they live', async () => {
    const { token } = await signIn();
    sent = [];
    const recap = {
      enabled: true,
      timeZone: 'America/Chicago',
      week: '2026-11-02',
      children: [kid],
    };
    expect((await call('PUT', '/api/recap', recap, token)).status).toBe(204);
    expect(
      ((await (await call('GET', '/api/account', undefined, token)).json()) as AccountInfo).recap,
    ).toBe(true);

    // Sunday 8 Nov 2026, 5pm in Chicago (23:00 UTC): too early.
    expect(await sendRecaps(db, async (e) => void sent.push(e), Date.UTC(2026, 10, 8, 23))).toBe(0);
    // 6pm in Chicago.
    const sixPm = Date.UTC(2026, 10, 9, 0);
    expect(await sendRecaps(db, async (e) => void sent.push(e), sixPm)).toBe(1);
    expect(sent[0]?.to).toBe('parent@example.com');
    expect(sent[0]?.text).toContain('Sam');
    expect(sent[0]?.text).toContain('5 quests, 32 minutes, 120 problems, 86% right first try');
    expect(sent[0]?.text).toContain('Make-10 Master');
    expect(sent[0]?.text).toContain('week starting 2026-11-02');
    // Not twice in one week.
    expect(await sendRecaps(db, async (e) => void sent.push(e), sixPm + 3600_000)).toBe(0);
  });

  it('says when nothing synced this week', async () => {
    const { token } = await signIn();
    const recap = { enabled: true, timeZone: 'UTC', week: '2026-10-26', children: [kid] };
    await call('PUT', '/api/recap', recap, token);
    sent = [];
    await sendRecaps(db, async (e) => void sent.push(e), Date.UTC(2026, 10, 8, 19));
    expect(sent[0]?.text).toContain('No practice has synced this week');
  });

  it('stops, and forgets the numbers, when turned off', async () => {
    const { token } = await signIn();
    await call('PUT', '/api/recap', { enabled: true, timeZone: 'UTC', children: [kid] }, token);
    await call('PUT', '/api/recap', { enabled: false }, token);
    const row = await db.prepare('SELECT recap_body FROM accounts').first<{ recap_body: null }>();
    expect(row?.recap_body).toBeNull();
    sent = [];
    expect(await sendRecaps(db, async (e) => void sent.push(e), Date.UTC(2026, 10, 8, 19))).toBe(0);
  });

  it('refuses an unknown time zone', async () => {
    const { token } = await signIn();
    const recap = { enabled: true, timeZone: 'Mars/Base', children: [kid] };
    expect((await call('PUT', '/api/recap', recap, token)).status).toBe(400);
  });

  it('keeps going when one email fails', async () => {
    const a = await signIn('a@example.com');
    const b = await signIn('b@example.com');
    for (const { token } of [a, b]) {
      await call('PUT', '/api/recap', { enabled: true, timeZone: 'UTC', children: [kid] }, token);
    }
    sent = [];
    const flaky = async (e: Email) => {
      if (e.to === 'a@example.com') throw new Error('bounced');
      sent.push(e);
    };
    expect(await sendRecaps(db, flaky, Date.UTC(2026, 10, 8, 19))).toBe(1);
    expect(sent.map((e) => e.to)).toEqual(['b@example.com']);
  });
});
