import { weekStart } from '@mathapp/engine';
import { APP_NAME } from '../../web/src/config';
import { ensureSchema, type Db } from './db';
import type { Email, Mailer } from './mail';
import type { RecapChild } from './protocol';

/** Sunday evening where the family lives: the week is all but done, and there's time to talk. */
export const RECAP_HOUR = 18;

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const page = (lines: string[]) =>
  `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1d3557">${lines.join('')}</div>`;

export function signInEmail(to: string, code: string): Email {
  return {
    to,
    subject: `${code} is your ${APP_NAME} code`,
    text: `Your ${APP_NAME} sign-in code is ${code}.\n\nIt works for 10 minutes. If you didn't ask for it, you can ignore this email.`,
    html: page([
      `<p>Your ${escape(APP_NAME)} sign-in code is</p>`,
      `<p style="font-size:32px;font-weight:800;letter-spacing:6px">${code}</p>`,
      `<p>It works for 10 minutes. If you didn't ask for it, you can ignore this email.</p>`,
    ]),
  };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function childLines(c: RecapChild): string[] {
  const lines = [
    `${plural(c.quests, 'quest')}, ${plural(c.minutes, 'minute')}, ${plural(c.problems, 'problem')}` +
      (c.accuracy === null ? '' : `, ${Math.round(c.accuracy * 100)}% right first try`),
    `Streak: ${plural(c.streak, 'day')} (best ${c.best})`,
  ];
  if (c.badges.length > 0) lines.push(`New badges: ${c.badges.join(', ')}`);
  return lines;
}

/** `fresh` is false when no device has synced this week, so the numbers are last week's. */
export function recapEmail(
  to: string,
  week: string,
  children: RecapChild[],
  fresh: boolean,
): Email {
  const intro = fresh
    ? `Here's the week starting ${week}.`
    : 'No practice has synced this week. These are the last numbers we have.';
  const text = [
    intro,
    '',
    ...children.flatMap((c) => [c.name, ...childLines(c).map((l) => `  ${l}`), '']),
    `Open ${APP_NAME} and go to Grown-ups for skills, fact fluency and the teacher report.`,
    'To stop these emails, turn off the weekly email in Grown-ups, then Sync.',
  ].join('\n');
  const html = page([
    `<p>${escape(intro)}</p>`,
    ...children.map(
      (c) =>
        `<p><strong>${escape(c.name)}</strong><br>${childLines(c).map(escape).join('<br>')}</p>`,
    ),
    `<p>Open ${escape(APP_NAME)} and go to Grown-ups for skills, fact fluency and the teacher report.</p>`,
    `<p style="font-size:13px;color:#555">To stop these emails, turn off the weekly email in Grown-ups, then Sync.</p>`,
  ]);
  return { to, subject: `${APP_NAME}: this week's practice`, text, html };
}

/** The local date, weekday and hour in a time zone. */
export function localTime(at: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: parts.weekday as string,
    hour: Number(parts.hour),
  };
}

interface RecapRow {
  id: string;
  email: string;
  recap_tz: string;
  recap_week: string | null;
  recap_body: string | null;
  recap_sent_week: string | null;
}

/** Runs every hour. Each family gets one email a week, the first run after Sunday 6pm local. */
export async function sendRecaps(db: Db, mail: Mailer, now: number): Promise<number> {
  await ensureSchema(db);
  const { results } = await db
    .prepare(
      `SELECT id, email, recap_tz, recap_week, recap_body, recap_sent_week FROM accounts
       WHERE recap_enabled = 1 AND recap_tz IS NOT NULL`,
    )
    .all<RecapRow>();
  let sent = 0;
  for (const row of results) {
    const local = localTime(now, row.recap_tz);
    if (local.weekday !== 'Sun' || local.hour < RECAP_HOUR) continue;
    const week = weekStart(local.date);
    if (row.recap_sent_week === week) continue;
    const children = JSON.parse(row.recap_body ?? '[]') as RecapChild[];
    if (children.length === 0) continue;
    try {
      await mail(recapEmail(row.email, week, children, row.recap_week === week));
      await db
        .prepare('UPDATE accounts SET recap_sent_week = ? WHERE id = ?')
        .bind(week, row.id)
        .run();
      sent++;
    } catch (error) {
      // One family's bad address mustn't stop the others; the next hour tries again.
      console.error(error);
    }
  }
  return sent;
}
