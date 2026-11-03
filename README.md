# Math Quest (working title)

A private, offline math practice app for a 6-year-old. The spec is `MATH_APP_BRIEF.md`, and `CLAUDE.md` holds the working rules and decisions.

**Status:** Phases 0 and 1 are done: the installable shell, the data layer, and the full Grade 1 engine. There is no child UI yet (Phase 2).

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

The same child and date always give the same quest. To see the app shell, run `npm run dev`.

## Checks

```
npm test            unit tests
npm run coverage    engine coverage, 90% minimum
npm run e2e         builds the PWA and reloads it offline in iPhone WebKit
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
