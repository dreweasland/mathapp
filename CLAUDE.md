# Math Quest (working title)

A local-first math practice PWA for a 6-year-old. `MATH_APP_BRIEF.md` is the product spec. It stays unedited; where it conflicts with this file, this file wins.

## Stack

- TypeScript (strict) everywhere, npm workspaces.
- `apps/web`: React + Vite, `vite-plugin-pwa`, Tailwind, Dexie (IndexedDB). Zustand and Framer Motion arrive in Phase 2.
- `packages/engine`: pure logic with **zero runtime dependencies** and no React.
- `packages/content`: skill metadata and speech strings. Depends only on the engine's types.
- Tests: Vitest (unit), Playwright on WebKit with an iPhone profile (e2e). No backend in MVP.

## Folder layout

```
apps/web/                  PWA shell
  src/config.ts            app name (one value, still to be chosen with the child)
  src/db/                  Dexie schema and typed repositories; all writes go through repositories
  e2e/                     Playwright
packages/engine/src/
  rng.ts dates.ts          seeded RNG, date-string helpers
  types.ts                 shared types
  generators/              one generator + test per skill
  mastery difficulty frontier placement factDeck    adaptive logic
  streak wallet goals missions quest                daily loop logic
  audit.test.ts            independent answer-key audit
packages/content/src/      grade1.ts (skills), strings.en.ts (speech and praise)
scripts/                   demo-quest.ts and fixtures
```

Engine rules: functions are pure, take `today` as a local `YYYY-MM-DD` string, and take an `Rng`. `Date`, `Math.random` and browser globals are lint errors there. Generators return structured data and speech keys, never rendered strings.

## Commands

```
npm test             all unit tests
npm run coverage     engine coverage (threshold 90%)
npm run e2e          build the PWA and run the offline smoke test (first run: npx playwright install webkit)
npm run demo         print a Daily Quest (see README for options)
npm run lint         ESLint + Prettier
npm run typecheck    tsc across all workspaces
npm run dev          dev server
```

## Decisions that override the brief

Agreed with the parent before Phase 0.

- **Target device:** iPhone, portrait first. Non-negotiable 7 below still says iPad/Android tablet; landscape and tablets must keep working, but the iPhone comes first.
- **iOS storage:** the installed app and the Safari tab have separate storage, and Safari can evict tab data. The parent must be walked through Home Screen install, and export reminders are required (Phases 2 and 4).
- **Coins:** `coins` drops only when the child chooses to buy something; `lifetimeCoins` only rises. Never deduct as a penalty.
- **Daily goals:** `quest` and `quest+challenge` only. "Quest + 5 free-play minutes" is dropped because it conflicts with non-negotiable 5.
- **Quest size:** 21–29 problems (6–8 + 12–16 + 3–5). The brief's "25–35" is not used.
- **Sticky rewards:** `masteredAt` and `unlockedAt` are never cleared, even if mastery later drops.
- **Placement:** passed skills get `placedOut: true` and mastery 70, skip the frontier, and join the review pool. Badges still need real attempts.
- **Shields:** used only if they can save the streak; otherwise they are kept. Shielded days preserve the streak without adding to it. Max 2 banked.
- **Perfect Week:** Monday to Sunday. Parent-granted days count, automatic shield days do not.
- **`compare` question type:** replaces "true/false compare" and has a third "same" answer.
- **Profiles:** tap your avatar, no picture password. Theme: animals.
- **Acceptance:** Lighthouse has no PWA score since v12. Use a manual install/offline checklist plus accessibility ≥ 90.

## 2. Non-negotiables

1. **No ads, no purchases, no dark patterns.** Nothing in the app is ever for sale. No countdown timers that pressure a child. No "you'll lose everything" messaging.
2. **Rewards are never taken away.** Coins, collectibles, and badges only go up. A broken streak starts a new streak; it never deletes anything earned.
3. **Zero-reading operation.** Every prompt, button, and feedback message has audio (Web Speech API is fine for MVP). Icons over words. A child must be able to complete a full daily session without a parent and without reading.
4. **Local-first and private.** No child account, no email, no third-party analytics. All data lives on the device (IndexedDB) with an export/import so it can move between devices. Cloud sync is a later phase and will be parent-authenticated only.
5. **Session is short by design.** The daily quest targets 5–8 minutes. The app should feel finished when the quest is done, not try to extend the session.
6. **Correctness of math content is tested.** Every problem generator has unit tests. A wrong answer key is a bug of the highest severity.
7. **Works offline** as an installable PWA on an iPad or Android tablet in landscape and portrait.

## 3. Design rules for a 6-year-old

- Tap targets ≥ 64px. No drag-and-drop in MVP (fine motor + touch reliability); use tap-to-select.
- Numeric input is an on-screen number pad, never the OS keyboard.
- One task on screen at a time. No menus deeper than two levels for the child.
- Feedback is immediate and specific: a correct answer gets a satisfying sound + animation within 100ms. A wrong answer is never a buzzer or red X; it's a neutral "not yet" with a hint/visual (ten-frame, number line, counters) and a second try. After two misses, show the answer with the visual, then move on and schedule that item for review.
- Bright, high-contrast, large type (min 28px for problem text). One font. Consistent character/mascot that reacts.
- No text-heavy tutorials. Teach by showing: the first problem of a new skill is a worked example the child taps through.
- Praise effort and growth ("You kept trying!", "That one was tricky and you got it!") not intelligence ("You're so smart").
- Every session ends with a celebration screen, even on a rough day.
