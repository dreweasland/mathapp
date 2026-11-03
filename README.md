# Math Quest (working title)

A private, offline math practice app for a 6-year-old. The spec is `MATH_APP_BRIEF.md`, and `CLAUDE.md` holds the working rules and decisions.

**Status:** Phases 0–3 are done: the installable shell, the full Grade 1 engine, the child's Daily Quest, and the engagement systems (growing plant, shields, missions, chests, collectibles, dressing up the bear, trophy wall, progress map). The parent dashboard comes next.

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
npm run e2e         plays full quests offline in iPhone WebKit and checks every layout
npm run lint
npm run typecheck
```

`packages/engine/src/audit.test.ts` recomputes 2,500 answers per skill with solver code that shares nothing with the generators.

## Checking on a real iPhone

Playwright only approximates Safari, so these need the real device:

1. Run `npm run build`, then serve `apps/web/dist` over HTTPS. Service workers need HTTPS, so a plain local IP address won't work.
2. In Safari, tap Share, then Add to Home Screen.
3. Open the app from the Home Screen. It should have no browser bars.
4. Turn on Airplane Mode, force-quit the app, and reopen it. It should still load.
5. Tap through a whole quest in Airplane Mode. Prompts should be spoken and sounds should play.
6. Flip the ring/silent switch to silent and try again. If speech or sound goes quiet, turn the switch back and keep the volume up during practice.
7. Leave the app open overnight, then return to it. It should offer a new quest.
8. Open a certificate on the trophy wall and tap print from the installed app. If nothing happens, that's a limit of the Home Screen app, so note it for Phase 4.
