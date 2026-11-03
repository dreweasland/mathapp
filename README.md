# Math Quest (working title)

A private, offline math practice app for a 6-year-old. The spec is `MATH_APP_BRIEF.md`, and `CLAUDE.md` holds the working rules and decisions.

**Status:** Phases 0–5 are done: the installable shell, all 38 skills across Grades 1–3, the child's Daily Quest, the engagement systems, the PIN-gated parent dashboard with its teacher report, free play, settings and reminders. Phase 6 (cloud sync) is a later, optional step.

## Grown-ups

On Home, tap the child's picture, then the gear. The first visit asks a multiplication question and sets a 4-digit PIN.

The dashboard shows the weekly recap, skills, the fact fluency grid, goals and cheers, the teacher report, children, settings, and backup. All progress lives only on the device, so save a backup now and then. The app reminds you.

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

## Checking on a real iPhone

Playwright only approximates Safari, so these need the real device:

1. Run `npm run build`, then serve `apps/web/dist` over HTTPS. Service workers need HTTPS, so a plain local IP address won't work.
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
13. After a quest, play Fact Blitz. Watch for lag between tapping and the next problem.
14. In Backup, tap Save backup and save to Files. Delete the app, reinstall it, set it up, and restore the file. All progress and the voice message should return.
