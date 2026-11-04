/**
 * The Worker. Static files are served by Cloudflare before this runs; only /api/* reaches it
 * (`run_worker_first` in wrangler.jsonc). The hourly cron sends weekly recap emails.
 */
import { createApi } from './api';
import type { Db } from './db';
import { logMailer, resendMailer, type Mailer } from './mail';
import { sendRecaps } from './recap';

interface Env {
  DB: Db;
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Secrets, set with `wrangler secret put` or in the dashboard. */
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  /** "log" in .dev.vars prints emails instead of sending them. */
  DEV_MAIL?: string;
}

interface Waiter {
  waitUntil(promise: Promise<unknown>): void;
}

function mailerFor(env: Env): Mailer | undefined {
  if (env.RESEND_API_KEY && env.MAIL_FROM) return resendMailer(env.RESEND_API_KEY, env.MAIL_FROM);
  if (env.DEV_MAIL === 'log') return logMailer;
  return undefined;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    return createApi({ db: env.DB, mail: mailerFor(env), now: Date.now })(request);
  },

  async scheduled(_event: unknown, env: Env, ctx: Waiter): Promise<void> {
    const mail = mailerFor(env);
    if (mail) ctx.waitUntil(sendRecaps(env.DB, mail, Date.now()));
  },
};
