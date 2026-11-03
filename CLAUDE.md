# Math Quest (working title)

A local-first math practice PWA for a 6-year-old. `MATH_APP_BRIEF.md` is the product spec. It stays unedited; where it conflicts with this file, this file wins.

## Stack

- TypeScript (strict) everywhere, npm workspaces.
- `apps/web`: React + Vite, `vite-plugin-pwa`, Tailwind, Dexie (IndexedDB), Zustand (game state), Framer Motion (celebration only). Sound effects are synthesized with Web Audio; speech uses the Web Speech API.
- `packages/engine`: pure logic with **zero runtime dependencies** and no React.
- `packages/content`: skill metadata and speech strings. Depends only on the engine's types.
- Tests: Vitest (unit, plus Testing Library for components), Playwright on WebKit with an iPhone profile (e2e). No backend in MVP.

## Folder layout

```
apps/web/                  PWA shell
  src/config.ts            app name (one value, still to be chosen with the child)
  src/db/                  Dexie schema, typed repositories, backup.ts; all writes go through repositories
  src/game/                store.ts: the one game store, built from injected deps so tests need no browser
  src/audio/               speech.ts (always by string key), sfx.ts
  src/question/            ProblemView = Prompt + Hint + Answers; one renderer for all 6 question types
  src/visuals/ src/ui/     clock, ten-frame, shapes, base-ten, Numbers (coins, arrays, fractions, rulers); mascot, big button,
                           icons.tsx (the drawn icon set), Avatar.tsx, BearSays.tsx (the bear's speech bubble)
  src/game/art.tsx         a drawn icon per skill, for the map, trophies and free play
  src/screens/             Setup, Who, Placement, Home, Cheer, Quest, Celebrate, ChestReveal, Map, Trophies, Stickers, Shop, Free, Blitz
  src/parent/              grown-ups' area, lazy-loaded: PinGate, ParentApp, pages/, reportDoc (teacher report)
  src/gallery.tsx          dev-only page of any problem, for layout tests; never in the build
  e2e/                     Playwright: offline, quest, layout, rewards, parent, free
packages/engine/src/
  rng.ts dates.ts          seeded RNG, date-string helpers
  types.ts                 shared types
  generators/              one generator + test per skill, 38 in all
  mastery difficulty frontier placement factDeck    adaptive logic
  streak wallet goals missions quest rewards        daily loop logic
  report free              dashboard and teacher-report numbers; practice and Fact Blitz
  questRun                 tries, sections, end-on-win, resume, scoring (pure; the store just calls it)
  audit.test.ts            independent answer-key audit
packages/content/src/      grade1-3.ts and skills.ts (ALL_SKILLS), collectibles.ts (sets, shop, prices), strings.en.ts (speech and praise), answerSpeech.ts
scripts/                   demo-quest.ts and fixtures
```

Engine rules: functions are pure, take `today` as a local `YYYY-MM-DD` string, and take an `Rng`. `Date`, `Math.random` and browser globals are lint errors there. Generators return structured data and speech keys, never rendered strings.

## Commands

```
npm test             all unit tests
npm run coverage     engine coverage (threshold 90%)
npm run e2e          build the PWA, play full quests, check layouts (first run: npx playwright install webkit)
npm run demo         print a Daily Quest (see README for options)
npm run lint         ESLint + Prettier
npm run typecheck    tsc across all workspaces
npm run dev          dev server
npm run serve        build, then serve it as Cloudflare will (wrangler dev)
npm run deploy       build and deploy to Cloudflare (normally Workers Builds does this on push to main)
```

Hosting: a Cloudflare Worker with static assets only (`wrangler.jsonc`, headers in `apps/web/public/_headers`). No Worker script, no analytics. Deploys come from Cloudflare Workers Builds, not GitHub Actions; CI only tests.

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
- **Warm-up order:** only skills already taught (started, placed out, or mastered) feed the warm-up, so a skill is never drilled before its worked example.
- **Mastery pace:** all-fast answers earn a badge at 15 attempts, all-slow-but-correct at 18. Each skill has its own `fastMs`; the 3-second bar is for within-10 facts.
- **Time budget beats problem count:** slow skills (word problems) get fewer problems, down to 8, to protect the 5–8 minutes.
- **Profiles:** tap your avatar, no picture password. Theme: animals.
- **Number line:** a 0–20 line cannot fit an iPhone at 64px per target, so tappable lines wrap into a number path of rows. Hints still draw a true line with hops.
- **Worked examples:** the tap-through shows the question, the visual and the answer. It is not an attempt, so it earns nothing and doesn't touch mastery.
- **What counts for the day:** finishing warm-up and today's skill. The challenge comes after, so skipping it or closing the app there can't affect the streak.
- **One quest a day, resumable the same day:** an unfinished quest resumes where it stopped; one left from an earlier day is abandoned, with its coins kept.
- **Ending on a win:** on days 1–3 a missed final problem comes back once, right after its answer was shown. Level 1 has nothing easier to offer.
- **Challenge bonus:** 5 coins. The brief promises a bonus but gives no number.
- **Placement feedback:** the same neutral response for right and wrong, with one try and no hints.
- **Response clock:** starts when the prompt finishes speaking, or at display if the child answers first. On the number pad it stops at the last digit, not at the check mark.
- **Chests are banked when earned:** contents and coins apply at quest end, and opening only shows them, so closing the app can't cost a chest. Odds are flat: mostly an item, sometimes coins, rarely a shield (none before day 7). No rarity tiers.
- **Chest tiers:** bronze, silver and gold by quests done this week, reset each Monday. A Perfect Week upgrades that day's chest.
- **Shop:** 2,630 coins total, about a month of quests, because it's the only coin sink. Tapping tries an item on; buying is a second, separate tap. Prices live in `collectibles.ts`.
- **Missed problems:** non-fact problems missed twice return as retakes in the next quest (max 2 a day) and clear when answered. Fact problems use their cards.
- **PIN:** four digits, salted hash, device-only, never in a backup, and relocks on every entry. It keeps a 6-year-old out and nothing more. Setting or replacing one takes a grown-up multiplication question, so a forgotten PIN never costs progress.
- **Getting to the dashboard:** tap your picture on Home, then the gear. One child goes straight to Home on open; two or more get "who's playing?". Pictures are unique per device, so a non-reader can tell them apart.
- **Fluency grid:** four levels, not the brief's three. `automatic` is the brief's bar, which takes 10 attempts per card; `quick` (last 2 right within 3s) shows progress in the months before that.
- **Minutes:** summed from gaps between answers, each capped at 60s, because a quest can be paused for hours. Placement stays out of all totals.
- **Trend:** first-try accuracy of the latest answers against the ones before. Harder problems can lower it, so the dashboard says it's a prompt to look.
- **Teacher report:** one self-contained HTML document with no scripts or outside files, so preview, print and a shared file are the same page. It must stay on one page on Letter and A4.
- **Saving files:** share sheet first, then a download, because downloads are unreliable in an installed iPhone app. A cancelled share doesn't count as a backup.
- **Backups:** every child in one file, restored by replacing everything in one transaction after a confirmation. Every row is checked first, so a bad file changes nothing.
- **Backup reminder:** after 7 quests, then every 14 days.
- **Goals:** one on Home at a time. A reached goal stays until delivered and can't be removed; an unreached one can be. A window that closes short just stops showing, with no message to the child.
- **Cheers:** one per quest, oldest first, marked heard only on tapping past it. Recordings start inside the child's tap because iOS blocks later audio, and are stored as bytes because Blobs in IndexedDB have been unreliable on iOS.
- **Daily goal:** `quest+challenge` changes what the child hears and what the parent sees. The challenge stays skippable and the streak ignores it.
- **Grown-up notes on Home:** one at a time in the header (save failure, then install, then backup), because anywhere else small phones push them off screen.
- **Fact Blitz (Phase 5):** time shows as a bar that fills, with no countdown numbers and no ticking. It stays opt-in.
- **Standards:** the teacher report says "selected Grade 1 standards". The brief's list omits 1.MD.C.4, 1.OA.D.7–8 and 1.G.A.2, and those stay out unless the curriculum is extended.
- **Settings:** per child, in the dashboard: voice, left-hand layout, reduce motion, color-blind palette.
- **Grades:** one graph of 38 skills, worked lowest grade first. The map and the teacher report show the grade the child is in now, set by the frontier; the trophy wall shows that grade and earlier. Placement only covers Grade 1, so a child starting in Grade 2 or 3 skips it and earlier grades count as passed. A grade only moves forward.
- **Multiplication and division cards:** factors 1–10, 100 of each, in the brief's order. The report shows × and ÷ grids from Grade 3, because one page holds two grids.
- **Free play:** opens only after today's quest. It pays half coins and updates mastery and fact cards, but never touches the streak, chests, missions or goals. Practice is 8 problems; a new set means choosing to start again. It shows up in the grown-ups' minutes and problems, never as a quest.
- **Fact Blitz:** one try per fact, so a miss moves on with no "not yet" sound. The best is per skill and against the child's own score only. The problem isn't read aloud, which would use up the minute.
- **Reminders:** a calendar file with a daily alert. A PWA with no server can't notify, so the "streak at risk" nudge waits for Phase 6. Math time is set in the dashboard rather than Setup, which is already long.
- **Hints help without solving:** counting hints stop short of the total. `ProblemView.test.tsx` enforces this.
- **Words and drawn icons (redesign, Nov 2026):** the first build read "icons over words" as "no words", and a grown-up couldn't tell what anything was. Every control now has a drawn icon plus a short word, and the bear's speech bubble shows what it just said. Everything is still spoken, so a non-reader can play alone. App controls never use emoji; `icons.tsx` holds the set. The 36 collectible animals are drawn too (`ui/Critters.tsx`, keyed by item id, with a test that every animal a chest can hold has a drawing). Dress-up items and backgrounds are drawn as well (`ui/Wearables.tsx`, with where each sits on the bear); a background is a round scene inside the bear's own box, so worn things never move the layout. Word-problem pictures are still emoji.
- **Home has one job:** a "Today's quest" card with three named steps (Warm-up, Learn, Bonus) and one Start button. The plant, the week, little jobs (missions) and goals sit below; Map, Trophies, Animals and Dress up are pinned at the bottom. The middle scrolls on small phones, but Start and the bottom row never leave the screen.
- **First-visit tour:** Bo walks through Home in three spoken steps the first time, then never again on its own (`touredAt`). The Help button runs it again.
- **Feedback on every answer:** the tapped answer turns green with a tick, or shakes and greys out; the number pad keeps the entry in its box. The header swaps its step bar for "Yes! +coins", "Not yet! Look at the hint, try again" or "Here's the answer" until the next problem, so it shows on any phone size. Still no red and no crosses.
- **How it went:** the celebration (and practice's end) counts problems right first try, on the second try, and shown by Bo, and can list every one with its answer and what was tried. The run records each problem's first result (`results`, optional so older saved runs still load).
- **New badges:** shown full screen, one at a time, before the celebration or the end of free play, and said first. The trophy wall marks badges earned today with "New!".
- **The challenge is called the bonus round** everywhere the child sees or hears it. The engine and dashboard still say challenge.
- **Grown-up notes:** a dark bar above Home with an OK that hides it until the next opening. A failed save can't be dismissed.
- **One font:** Nunito, bundled (Latin only, 39 KB), so it looks the same on every device and works offline.
- **Performance:** only Home and the quest load up front. Everything else is lazy and precached, so offline still works.
- **Acceptance:** Lighthouse has no PWA score since v12. Use a manual install/offline checklist plus accessibility ≥ 90.

## How the quest UI works

- Tap path: a tap updates in-memory state, sound and screen first. Saving is queued afterward, so storage can never delay feedback.
- The whole `QuestRun` is saved on the session row after every step. That is what makes resume work, and e2e reads answers from it, so production has no test hooks.
- Every child control uses the `.tap` class, which enforces 64px. `e2e/layout.spec.ts` checks size and fit for all question shapes on five viewports; add new shapes to its `CASES`.
- A new generator's output must render in `ProblemView`; `ProblemView.test.tsx` answers every generator's problems through the real screen.

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
