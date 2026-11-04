# Math Quest (working title)

A private, offline math practice app for a 6-year-old. The spec is `MATH_APP_BRIEF.md`, and `CLAUDE.md` holds the working rules and decisions.

**Status:** Phases 0–6 are done: the installable shell, all 38 skills across Grades 1–3, the child's Daily Quest, the engagement systems, the PIN-gated parent dashboard with its teacher report, free play, settings, reminders, and optional end-to-end encrypted cloud sync with a weekly recap email.

## Grown-ups

On Home, tap the child's picture, then the gear. The first visit asks a multiplication question and sets a 4-digit PIN.

The dashboard shows the weekly recap, skills, the fact fluency grid, goals and cheers, the teacher report, children, settings, sync, and backup. Without sync, all progress lives only on the device, so save a backup now and then. The app reminds you.

### Cloud sync (optional)

**Grown-ups → Sync & weekly email** keeps progress the same on every device signed in to the same email. You sign in with a 6-digit code sent by email, then choose a sync passphrase on the first device and type it once on each other one. A new device can do this straight from Setup ("Moving from another device? Sync or restore").

- **Encrypted on the device.** Every row is encrypted with a random family key before it leaves; the key is stored on the server only wrapped with your passphrase. The server can't read progress, and nobody can recover a forgotten passphrase. "Forgot the passphrase?" starts the cloud copy over from that device; the other devices keep their progress and join again.
- **Nothing earned is lost.** When two devices changed the same thing, coins earned on either, items, badges, bests and finished quests all survive (`packages/engine/src/sync.ts`).
- **When it runs:** on opening the app, after each quest or practice, on returning to the app, and on leaving the grown-ups' area. Never during a tap.
- **Weekly email** (off by default): Sunday 6pm in your time zone, each child's quests, minutes, problems, first-try accuracy, streak and new badges. Those numbers and first names are the only readable data on the server, and turning the email off deletes them.
- **Leaving:** sign out of one device or all of them, or delete the cloud copy and account. Each device keeps its own progress.

## Setup

```
npm install
npx playwright install webkit   # only needed for npm run e2e
```

## Demo

Prints a generated Daily Quest using only the pure engine:

```
npm run demo                                  # first quest, after placement
npm run demo -- --fixture day10               # ten days in
npm run demo -- --fixture broken-streak       # missed days; warm message, shield kept
npm run demo -- --fixture day10 --answers     # also show answers and choices
npm run demo -- --fixture day10 --date 2026-11-12 --seed 7
```

The same child and date always give the same quest.

## Play it

`npm run dev`, then open the printed address. In a desktop browser, use the device toolbar for a phone-sized window. To start over, clear the site's data.

`http://localhost:5173/gallery.html?skill=1.time&level=3&type=clock-face&help=hint` shows any problem on its own in dev. Change `skill`, `level` (1–5), `type`, `kind`, `seed` and `help` (`none`, `hint`, `reveal`).

## Checks

```
npm test            unit tests
npm run coverage    engine coverage, 90% minimum
npm run e2e         plays full quests offline in iPhone WebKit, checks every layout and the dashboard
npm run lint
npm run typecheck
```

`packages/engine/src/audit.test.ts` recomputes 2,500 answers for each of the 38 skills with solver code that shares nothing with the generators.

## Deploying to Cloudflare

One Cloudflare Worker (`wrangler.jsonc`) serves the app as static files and runs the sync API under `/api/` (`apps/worker`), with a D1 database and an hourly cron for the recap email. Static files never run Worker code. Cloudflare's own Git integration (Workers Builds) builds and deploys it; GitHub Actions only runs the tests.

One-time setup in the Cloudflare dashboard:

1. Push this repo to GitHub.
2. Go to Workers & Pages, then Create, then Import a repository, and pick the repo.
3. Set the project name to `mathapp`, the name in `wrangler.jsonc`. If you pick another, change it there too.
4. Leave the root directory empty, set the build command to `npm run build`, and leave the deploy command as `npx wrangler deploy`.
5. Set the production branch to `main`. Node comes from `.nvmrc`.

Every push to `main` then deploys to `https://mathapp.<your-subdomain>.workers.dev`. To deploy from your own machine instead, run `npx wrangler login` once, then `npm run deploy`. To try the deployed setup locally, run `npm run serve`.

**The sync database** is the D1 database `mathapp-sync`, whose id is in `wrangler.jsonc`. The Worker creates its own tables, so there's no migration step. On a different Cloudflare account, run `npx wrangler d1 create mathapp-sync` and put the new id there.

**Email, for sync sign-in codes and the weekly recap.** Until this is set up, the app works as before and the sync screen says sync isn't set up.

1. Make a free account at [resend.com](https://resend.com) and verify a domain you own (it gives you DNS records to add).
2. Create an API key there.
3. In the Cloudflare dashboard, open the `mathapp` Worker, then Settings, then Variables and Secrets, and add two secrets: `RESEND_API_KEY` (the key) and `MAIL_FROM` (for example `Math Quest <quest@yourdomain.com>`, on the verified domain). Or run `npx wrangler secret put RESEND_API_KEY` and `npx wrangler secret put MAIL_FROM`.

To try sync locally, run `npm run serve -- --var DEV_MAIL:log`: sign-in codes print in the terminal instead of being emailed.

**Pick the final address before your child starts.** The phone keeps all progress per web address, so moving to a new domain later means saving a backup on the old address and restoring it on the new one.

## Checking on a real iPhone

Playwright only approximates Safari, so these need the real device:

1. Deploy (see above) and open the `workers.dev` address in Safari. Service workers need HTTPS, so a plain local IP address won't work.
2. In Safari, tap Share, then Add to Home Screen.
3. Open the app from the Home Screen. It should have no browser bars.
4. Turn on Airplane Mode, force-quit the app, and reopen it. It should still load.
5. Tap through a whole quest in Airplane Mode. Prompts should be spoken and sounds should play.
6. Flip the ring/silent switch to silent and try again. If speech or sound goes quiet, turn the switch back and keep the volume up during practice.
7. Leave the app open overnight, then return to it. It should offer a new quest.
8. Open a certificate on the trophy wall and tap print from the installed app. If nothing happens, that's a limit of the Home Screen app.
9. In the dashboard, open Teacher report and tap Print. Then try Share or save, and print or email the file. One of the two has to work; note which.
10. In Goals & cheers, record a voice message. Allow the microphone, listen back, and send it. Start the next quest: it should play right away, with the ring/silent switch both ways.
11. In Settings, set a math time and tap Add to calendar. It should offer to add a daily event with an alert. If the file won't open, try sending it to yourself by email or Messages.
12. In Settings, try the Voice list. It should show several voices and speak a sample.
13. On a new child's first Home, the tour should step through Today's quest, the plant and the bottom buttons, with Bo's words in the bubble matching what he says. After a quest, play Fact Blitz. Watch for lag between tapping and the next problem.
14. In Backup, tap Save backup and save to Files. Delete the app, reinstall it, set it up, and restore the file. All progress and the voice message should return.
15. In Sync & weekly email, sign in and turn on sync. Check the code email arrives (and that iOS offers the code above the keyboard). On a second device, choose "Moving from another device? Sync or restore" in Setup, sign in with the same email and passphrase, and check the same child appears with the same coins and streak. Play a quest on one; open the other and check it shows within a minute.
