# Kids Math App — Claude Code Project Brief

> **How to use this file:** Drop it in the root of a new, empty repo and open Claude Code there. Paste the kickoff prompt below as your first message. Claude Code should read this file, enter plan mode, and build in the phases listed at the end.

---

## Kickoff prompt (paste this into Claude Code)

```
Read MATH_APP_BRIEF.md in full. It is the product spec for this project.

Before writing any code:
1. Enter plan mode. Produce an implementation plan that follows the "Build phases" section, lists the files you'll create in Phase 0 and 1, and flags anything in the brief that is ambiguous or that you'd push back on. Ask me those questions before proceeding.
2. Create a CLAUDE.md for this repo capturing: the stack, the folder layout you chose, how to run tests, the "Design rules for a 6-year-old" section verbatim, and the "Non-negotiables" section verbatim.

Then build Phase 0 and Phase 1 only. Stop after Phase 1 with the test suite passing and a short demo script I can run. I'll review before you continue.

Work in small, atomic commits. Write tests for the content engine before the UI. Prefer boring, well-known libraries over clever ones.
```

---

## 1. Why this exists

A 1st grader's teacher said the apps the class is currently using are not good. This is a home-built replacement for one family: a math practice app that a 6-year-old opens every single day on their own, enjoys, and that measurably builds fact fluency and grade-level skills. A parent needs enough visibility to see progress and to show the teacher.

**Primary user:** a 6-year-old in 1st grade who reads a little but not fluently. Must be usable with zero reading.
**Secondary user:** the parent, who sets goals, checks progress, and can print a report for a teacher.
**Scope of MVP:** math only, grades 1–3 content, one family (multiple child profiles).

---

## 2. Non-negotiables

1. **No ads, no purchases, no dark patterns.** Nothing in the app is ever for sale. No countdown timers that pressure a child. No "you'll lose everything" messaging.
2. **Rewards are never taken away.** Coins, collectibles, and badges only go up. A broken streak starts a new streak; it never deletes anything earned.
3. **Zero-reading operation.** Every prompt, button, and feedback message has audio (Web Speech API is fine for MVP). Icons over words. A child must be able to complete a full daily session without a parent and without reading.
4. **Local-first and private.** No child account, no email, no third-party analytics. All data lives on the device (IndexedDB) with an export/import so it can move between devices. Cloud sync is a later phase and will be parent-authenticated only.
5. **Session is short by design.** The daily quest targets 5–8 minutes. The app should feel finished when the quest is done, not try to extend the session.
6. **Correctness of math content is tested.** Every problem generator has unit tests. A wrong answer key is a bug of the highest severity.
7. **Works offline** as an installable PWA on an iPad or Android tablet in landscape and portrait.

---

## 3. Design rules for a 6-year-old

- Tap targets ≥ 64px. No drag-and-drop in MVP (fine motor + touch reliability); use tap-to-select.
- Numeric input is an on-screen number pad, never the OS keyboard.
- One task on screen at a time. No menus deeper than two levels for the child.
- Feedback is immediate and specific: a correct answer gets a satisfying sound + animation within 100ms. A wrong answer is never a buzzer or red X; it's a neutral "not yet" with a hint/visual (ten-frame, number line, counters) and a second try. After two misses, show the answer with the visual, then move on and schedule that item for review.
- Bright, high-contrast, large type (min 28px for problem text). One font. Consistent character/mascot that reacts.
- No text-heavy tutorials. Teach by showing: the first problem of a new skill is a worked example the child taps through.
- Praise effort and growth ("You kept trying!", "That one was tricky and you got it!") not intelligence ("You're so smart").
- Every session ends with a celebration screen, even on a rough day.

---

## 4. Curriculum: skill graph (grades 1–3, CCSS-aligned)

Build content as a **skill graph** (a DAG with prerequisites), not a linear level list. Each skill has: id, grade, standard code, name, child-friendly name + audio, prerequisite skill ids, a problem generator, allowed question types, and a mastery rule.

Fluency targets (match the standards): grade 1 add/subtract within 10 automatic and within 20 with strategies; grade 2 add/subtract within 20 from memory and within 100 using place value; grade 3 multiply/divide within 100 with single-digit products from memory, add/subtract within 1000. Fluency bar for "automatic" facts: **correct within 3 seconds, ≥90% over the last 10 attempts.**

### Grade 1 (ship first — this is the active user)
- `1.counting` Count to 120 from any number; read/write numerals; next/previous number
- `1.ten-frame` Subitize 0–10 on a ten-frame; make 10 (which number + n = 10)
- `1.add-within-10` Addition facts within 10 (fluency tracked per fact)
- `1.sub-within-10` Subtraction facts within 10 (fluency tracked per fact)
- `1.add-within-20` Addition within 20 using counting on and make-10 strategy (visual scaffolds)
- `1.sub-within-20` Subtraction within 20 as unknown addend; decompose through 10
- `1.fact-families` Related facts (3+4, 4+3, 7−3, 7−4)
- `1.compare` Compare two-digit numbers with >, <, = (use "alligator"/bigger-side visual)
- `1.place-value` Tens and ones; compose/decompose two-digit numbers
- `1.add-sub-10s` Add/subtract multiples of 10 within 100
- `1.word-problems` Add-to / take-from / put-together result-unknown, read aloud, with pictures
- `1.time` Tell time to the hour and half hour (analog + digital)
- `1.shapes` Identify shapes; halves and quarters as equal shares
- `1.measure` Compare lengths; order three objects (visual only)

### Grade 2
- `2.facts-within-20` All add/sub facts within 20 from memory (spaced repetition deck)
- `2.place-value-1000` Hundreds, tens, ones; read/write to 1000; skip count by 5, 10, 100
- `2.compare-1000` Compare three-digit numbers
- `2.add-within-100` Two-digit addition with regrouping (visual base-ten blocks)
- `2.sub-within-100` Two-digit subtraction with regrouping
- `2.add-sub-1000` Add/subtract within 1000 (strategies, no formal algorithm required)
- `2.even-odd` Even/odd; pairs
- `2.arrays` Rectangular arrays as repeated addition (bridge to multiplication)
- `2.money` Count coins and bills; make amounts; simple change within $1
- `2.time-5min` Time to the nearest 5 minutes; a.m./p.m.
- `2.word-problems-2step` One- and two-step word problems within 100
- `2.measure-units` Measure length in inches/cm; estimate

### Grade 3
- `3.mult-concept` Multiplication as equal groups / arrays / area
- `3.mult-facts` Products of single-digit numbers (fluency tracked per fact; introduce in order 2, 5, 10, 3, 4, 6, 7, 8, 9)
- `3.div-concept` Division as sharing / grouping; unknown factor
- `3.div-facts` Division facts within 100 (tied to mult facts)
- `3.fact-families-md` Related mult/div facts
- `3.add-sub-1000` Fluent add/subtract within 1000 (standard algorithm OK)
- `3.round` Round to nearest 10 and 100
- `3.fractions-unit` Unit fractions on a number line and as parts of a whole
- `3.fractions-compare` Equivalent fractions and comparing fractions with the same numerator or denominator
- `3.time-minute` Time to the minute; elapsed time
- `3.area-perimeter` Area by counting unit squares; perimeter
- `3.word-problems-4ops` Two-step word problems with all four operations

Each skill ships with a problem generator (seeded RNG so sessions are reproducible in tests), at least 2 question types, a hint visual, and ≥ 20 unit tests covering answer keys and edge cases (0, 10, 20, regrouping boundaries, etc.).

### Question types for MVP
1. **Multiple choice** (3–4 big buttons, distractors generated from common errors: off-by-one, wrong operation, digit swap)
2. **Number pad entry**
3. **Ten-frame / counters tap** (tap to fill, tap to count)
4. **Number line tap** (tap the correct point)
5. **True/false compare** (two numbers, tap the bigger one)
6. **Clock face** (tap the correct of 3 clocks for MVP; drag hands later)

Word problems are always read aloud and always have a picture.

---

## 5. Adaptive engine

Keep it simple and explainable. No ML.

- **Per-skill mastery score** 0–100, updated per attempt with a small step size; correct and fast moves it up more than correct and slow; wrong moves it down. Mastery ≥ 80 over ≥ 15 attempts = "mastered" (badge). Mastered skills still get light review.
- **Per-fact fluency** for the fact-based skills (add/sub within 20, mult/div within 100): each fact is a card in a Leitner/spaced-repetition box with response-time tracking. The session draws due cards first.
- **Placement:** a 3–5 minute first-run "warm-up" that walks down the grade 1 graph to find the frontier (first skill below 60). Parent can override the starting grade/skill.
- **Frontier selection:** the next "new" skill is the lowest-grade unmastered skill whose prerequisites are all ≥ 70.
- **Difficulty within a skill:** each generator takes a 1–5 difficulty parameter (e.g., for add-within-20: 1 = +1/+2, 3 = make-10 pairs, 5 = any). Difficulty steps up after 3 fast-correct in a row, down after 2 wrong.
- **Error-type tagging:** classify wrong answers (off-by-one, reversed operation, place-value, didn't regroup) and surface the most common per skill to the parent.

---

## 6. Daily loop — the core product

The app has one thing the child does every day: the **Daily Quest**. Everything else hangs off it.

### Daily Quest structure (target 5–8 min, ~25–35 problems)
1. **Warm-up (1 min):** 6–8 due fact cards from the spaced-repetition deck. Fast, rhythmic, with a visible "fuel gauge" filling up.
2. **Today's skill (3–4 min):** 12–16 problems on the frontier skill (or review of a shaky one on alternating days). First problem is a tap-through worked example when the skill is new.
3. **Challenge (1 min):** 3–5 problems one difficulty step up, or a mixed "boss" round. Optional — a child can skip it with no penalty, but completing it gives a bonus.
4. **Celebration screen:** coins earned, streak updated, collectible chest opens, mascot reacts, "See you tomorrow!" Then the app hard-stops the quest (free play is still available but visually secondary).

### Streak system (the retention backbone — do this carefully)
- A day counts when the Daily Quest is completed. Not time spent, not opening the app.
- **Daily goal is separate from the streak** and chosen at setup by parent + child together: "Just the quest" / "Quest + challenge" / "Quest + 5 free-play minutes." Chosen goals, not imposed ones. Can be changed any time in parent settings.
- Streak is shown as something that grows, not a number alone: e.g., a plant that grows a leaf per day, a tower that adds a block, a train that adds a car. Milestones at 3, 7, 14, 30, 60, 100 days unlock a new collectible and a shareable certificate.
- **Streak Shields (freezes):** the child earns a shield every 7-day streak (max 2 banked). A missed day consumes a shield automatically — no decision for the child to make. Parents can grant a shield manually (sick day, vacation). A missed day with no shield simply starts a new streak with a warm message: "New streak starts today! Your best was 12." The best-ever streak is always displayed and never resets.
- **Perfect Week:** completing all 7 days in a calendar week gives a bigger chest. This is the weekly rhythm layered on the daily one.
- **First-week onboarding ramp:** days 1–7 are the fragile window. Make quests on days 1–3 slightly shorter and guaranteed to end on a win; unlock the first collectible on day 1, the mascot's first accessory on day 2, the first shield on day 7.

### Daily quests / missions (variety on top of the streak)
Three small missions refresh daily, always visible on the home screen as pictures: e.g., "Get 5 in a row" / "Finish the challenge" / "Beat your fast time on 3 facts." Easy / medium / hard. Each gives coins; all three give a bonus chest. Missions are generated from the child's current skills so they're always achievable.

### Rewards economy (never-lose)
- **Coins** earned per correct answer (bonus for fast, bonus for recovering after a miss). Coins only go up.
- **Collectibles:** themed sets (pick a theme at setup — see Open Questions). Each set has ~12 items; chests give random items from the active set, with a pity rule (no duplicate on 3rd try). Completing a set unlocks a new set and a scene decoration.
- **Mascot customization:** hats, accessories, backgrounds bought with coins. This is the "spend" sink; it is cosmetic only.
- **Daily chest:** opens once per day after the quest; variable reward (coins, item, or rarely a shield). This is the Prodigy-style login reward, gated behind the quest so it rewards practice, not opening the app.
- **Mastery badges:** one per skill, with a kid-readable name ("Make-10 Master"). Displayed on a trophy wall. These are the "real" achievements and are visually weightier than collectibles.
- **Progress map:** the skill graph rendered as a path/map the child walks along. Mastered nodes glow. The next node is visible but locked, so there is always a "what's next."

### Parent-driven motivation (borrowed from Prodigy's goals & rewards)
- Parent can set a **real-world goal + reward**: "Finish 5 quests this week → movie night." The child sees the goal as a picture with a progress bar. Parent marks it delivered.
- Parent can leave a **cheer**: a short voice recording or emoji that plays at the start of the next quest.
- Weekly recap for the parent (in-app for MVP; email/push later).

### Notifications (later phase, parent-controlled)
MVP: none for the child. Phase 5: a single optional daily reminder at a parent-chosen time, worded to the child by the mascot, never fear-based. Parents can also enable a "streak at risk" nudge sent to the *parent*, not the child.

---

## 6b. Daily-login playbook — mechanics borrowed from outside education

This is the catalogue of "come back every day" mechanics from games, social, and habit apps, with a verdict on each for a 6-year-old. Section 6 is the synthesis; this is the source material so Claude Code understands *why* each system exists and doesn't drift toward the manipulative versions.

| Mechanic | Where it's from | What it does | Verdict for this app |
|---|---|---|---|
| **Streak counter** | Duolingo, Snapchat, Wordle, Strava, Headspace | Visible consecutive-day count; works through loss aversion. Biggest single retention lever in habit apps. | **Use**, but soften: growth visual, best-ever never resets, warm reset message. |
| **Streak freeze / shield** | Duolingo (streak freeze), Snapchat (restore) | Absorbs a missed day so one slip doesn't kill the habit. Duolingo found broken streaks cost users entirely. | **Use.** Earned, auto-applied, parent-grantable. Never purchasable. |
| **Self-chosen daily goal** | Duolingo (streak goal choice after first streak) | Committing to a goal you picked raises follow-through. | **Use.** Parent + child pick the goal together at setup. |
| **Perfect week** | Duolingo, Apple Fitness (perfect week/month awards) | A weekly rhythm layered on the daily one; a bigger prize for 7/7. | **Use.** |
| **Daily login calendar / escalating daily bonus** | Nearly every F2P game (Dragon City, Summoners War, Angry Birds, Hearthstone) | Day 1→7 prizes that get better; visible "tomorrow's prize" creates anticipation. | **Use, gated behind the quest** (reward practice, not opening the app). Show tomorrow's chest tier. Weekly 7-day calendar that resets each week, no monthly calendars. |
| **Daily missions / quests** | Pokémon GO daily bonuses, Genshin/Wuthering Waves commissions, Duolingo daily quests | 2–3 small tasks per day; converts a vague "play" into concrete, completable goals. Pokémon GO added these specifically to arrest churn, with a 7-day bonus on top. | **Use.** 3 picture-based missions, easy/medium/hard, generated from current skills. |
| **One-per-day scarcity** | Wordle (one puzzle per day, can't binge), Animal Crossing (daily events) | Capping the session makes the thing feel special, creates a ritual slot in the day, and prevents burnout. Wordle deliberately breaks the time-on-app playbook. | **Use.** The Daily Quest is one-per-day and hard-stops. Free play exists but is secondary. This is also what keeps a parent happy. |
| **Appointment timers / energy systems** | Candy Crush lives, Clash of Clans build timers, Facebook-era social games | Rationing play so you come back later in the day; multiple opens per day. | **Don't use.** Rations learning, teaches waiting-for-the-app. Counterproductive for a kid. |
| **Variable / surprise rewards** | Loot boxes, gacha, Prodigy chests, Pokémon GO encounters | Unpredictable prize → stronger dopamine response than fixed prize. | **Use lightly.** One daily chest, random item from a *small, fully visible* set, pity rule against duplicates. No rarity tiers with vanishing odds, no paid pulls. |
| **Collections to complete** | Pokémon, Khan Kids (bugs/hats/toys), SplashLearn (aquarium fish), Animal Crossing (museum) | Completion drive; the empty slot is the motivator. | **Use.** Themed sets of ~12, progress shown as a sticker sheet with empty slots. |
| **Growing thing / nurturing** | Tamagotchi, Forest, Animal Crossing villagers, Finch | Something that visibly thrives when you show up. Emotionally strong for young kids. | **Use** as the streak visual (plant/pet/tower grows per day). It must never visibly suffer or die when a day is missed — it just pauses. |
| **Progress map / world** | Candy Crush level map, Prodigy world, Duolingo path | Always a visible "next thing"; locked nodes create curiosity. | **Use.** Skill graph rendered as a path. |
| **Milestone celebrations** | Duolingo (7/30/100/365), Apple Fitness awards, Strava | Big moments at round numbers; shareable. | **Use.** 3/7/14/30/60/100 with a printable certificate for the fridge/teacher. |
| **Social streaks / leaderboards** | Snapchat snapstreaks, Duolingo leagues, Strava | Peer pressure; among the most-engaged features in mobile history. | **Don't use** kid-to-kid. Reroute the social pull to the *parent* (cheers, goals) and the *teacher* (report). A sibling-friendly "family wall" of badges is an acceptable later addition. |
| **Implementation intentions / reminders** | Headspace (pick when/where you'll meditate), Duolingo widget + notifications | Attaching the habit to a time and place; mood-changing widget that reflects streak state. | **Use the intention, not the nag.** Setup asks "When is math time?" (e.g., after breakfast) and the parent gets one optional reminder. A home-screen icon/widget that shows the streak plant is a nice later touch. |
| **Loss-framed messaging** | "Your streak will expire!", sad mascot, sunk-cost nudges | Guilt-driven returns. Stacking streaks + timers + variable prizes + loss framing is where retention design shades into exploitation. | **Never.** Explicit non-negotiable. All copy is forward-looking ("New streak starts today!"). |
| **Daily content refresh / seasonal events** | Animal Crossing seasons, Khan Kids seasonal library, every F2P game | Something new to see today; holiday themes. | **Later (Phase 5+).** Cheap wins: themed chest skins for holidays, a "weekend boss" mixed round on Saturdays. |

Design principle that falls out of this table: **one well-placed daily nudge, not a stacked reinforcement system.** Streak + shields + one chest + three missions + a growing thing is already a full loop for a 6-year-old. Resist adding more layers; add content instead.

## 7. Parent dashboard (PIN-gated)

- Child profiles: create/edit, pick grade, pick theme, set daily goal.
- Today / this week: quests completed, minutes, problems, accuracy, streak + shields.
- **Skill map view:** every skill with mastery %, trend arrow, last practiced, top error type.
- **Fact fluency grid:** add/sub facts within 20 (and later mult facts) as a heat-map grid — fast/slow/unknown. This is the view a teacher actually wants.
- Goals & rewards: set, track, mark delivered. Cheers: record.
- **Teacher report:** one-page printable (PDF or print-styled HTML) with skill mastery, fluency grid, and 30-day activity. The whole reason this app exists is a teacher conversation — make this good.
- Data: export JSON, import JSON, reset child.
- Settings: audio voice, left/right-hand layout, reduce motion, color-blind-safe palette.

---

## 8. Free play (secondary, after the quest)

Two modes only for MVP, both reusing the same engines:
1. **Fact Blitz:** 60-second timed facts on a chosen skill, personal-best tracking. Kids love beating their own time; never compare to other kids.
2. **Pick a skill:** practice any unlocked skill for coins at a reduced rate (so the quest stays the main event).

---

## 9. Tech stack (recommendation — change if you have a strong reason)

- **TypeScript everywhere.**
- **Frontend:** React + Vite, installable PWA (vite-plugin-pwa), Tailwind. Framer Motion for celebrations. Howler or plain Web Audio for SFX. Web Speech API `speechSynthesis` for read-aloud with a pre-recorded audio fallback hook so clips can be swapped in later.
- **State/data:** Zustand for UI state; Dexie (IndexedDB) for persistence. Single `db` module; every write goes through typed repositories. Schema versioning from day one.
- **Content engine:** a pure, dependency-free package (`packages/engine`) containing the skill graph, generators, adaptive logic, spaced repetition, streak/goal logic. **No React in this package.** This is where most tests live. Seeded RNG (e.g., a tiny mulberry32) so tests are deterministic.
- **Testing:** Vitest for engine + components; Playwright for a smoke test of a full daily quest. Target: engine ≥ 90% coverage.
- **Monorepo layout:** `apps/web`, `packages/engine`, `packages/content` (skill definitions + audio script strings), `packages/ui` (optional later).
- **Deploy:** static hosting. CloudFront + S3 via CDK is the eventual home; for MVP any static host is fine. Later phases add a Cognito-authenticated parent sync API (DynamoDB) via CDK — design the local schema so a sync layer can diff by `updatedAt`.
- **No backend in MVP.**

---

## 10. Data model (sketch — refine in plan mode)

```
ChildProfile { id, name, avatar, theme, grade, dailyGoal, createdAt, settings }
SkillState   { childId, skillId, mastery (0-100), attempts, lastPracticedAt, difficulty (1-5), errorCounts{} }
FactCard     { childId, factId, box (0-5), dueAt, lastResponseMs, history[] }
Attempt      { id, childId, skillId, questionType, difficulty, prompt, answer, given, correct, responseMs, errorType?, at }
Session      { id, childId, startedAt, endedAt, type: 'quest'|'blitz'|'free', problemsCount, correctCount, coinsEarned, completedQuest }
Streak       { childId, current, best, lastCountedDate, shields, perfectWeeks[] }
Wallet       { childId, coins, lifetimeCoins }
Inventory    { childId, items[], mascotEquipped{} }
Mission      { childId, date, slot: 1|2|3, kind, target, progress, done }
Goal         { id, childId, title, imageKey, target, unit, progress, rewardText, delivered }
Cheer        { id, childId, audioBlob?, emoji?, createdAt, playedAt? }
```

---

## 11. Build phases (stop and check in after each)

**Phase 0 — Scaffold.** Monorepo, tooling, CLAUDE.md, CI running tests, PWA shell that installs and loads offline, Dexie schema v1, seeded RNG.

**Phase 1 — Engine + Grade 1 content.** Skill graph types, all grade 1 generators with tests, adaptive mastery, Leitner fact deck, streak/goal/mission/wallet logic as pure functions with tests. A CLI/dev page that prints a generated Daily Quest for a given profile state. *Stop here for review.*

**Phase 2 — Child UI for the Daily Quest.** Home screen, quest flow (warm-up → skill → challenge → celebration), the 6 question types, audio read-aloud, hints/visuals, number pad. Playwright smoke test completes a quest.

**Phase 3 — Engagement systems UI.** Streak visual + shields, missions, chests + collectibles, mascot customization, trophy wall, progress map, first-week ramp.

**Phase 4 — Parent dashboard.** PIN, profiles, skill map, fluency grid, goals/cheers, teacher report, export/import.

**Phase 5 — Polish + grade 2/3 content.** Remaining generators with tests, Fact Blitz, free play, settings/accessibility, reminder notification, perf pass (first load < 2s on an older iPad), sound/animation polish.

**Phase 6 (later) — Cloud sync via CDK.** Cognito parent auth, DynamoDB sync, CloudFront/S3 deploy, weekly recap email.

---

## 12. Acceptance criteria for "MVP done" (end of Phase 4)

- A 6-year-old can open the app, complete a Daily Quest, and reach the celebration screen with no adult help and no reading.
- Every grade 1 skill has a generator with passing tests; no answer-key bugs found in a 500-problem random audit.
- Streak, shields, missions, chests, collectibles, goals, and cheers all work and persist across reloads and offline.
- Parent can view the fluency grid and print a one-page teacher report.
- App installs as a PWA and runs fully offline on an iPad.
- Lighthouse PWA + accessibility scores ≥ 90.

---

## 13. Open questions for the parent (answer these in the first Claude Code session)

1. **Theme / mascot.** Pick one the child is already obsessed with (animals, space, dinosaurs, vehicles, something from home life). The collectible sets and mascot are built around it, so decide before Phase 3.
2. **App name.** Working title is fine; it shows on the home-screen icon.
3. **Device.** iPad, Android tablet, or phone? Affects target viewport and whether portrait or landscape is primary.
4. **Starting point.** Should the first run do the placement warm-up, or just start at `1.add-within-10`?
5. **Siblings.** Multiple child profiles are in scope; should profiles share a device PIN-free (tap your avatar) or each have a simple picture-password?
6. **Audio.** Synthesized voice is fine for MVP, but a parent-recorded voice reading the prompts is a huge engagement lever for a 6-year-old. Worth planning a recording tool in Phase 5?

---

## 14. Things explicitly out of scope for MVP

Reading/ELA, leaderboards or any kid-to-kid comparison, social features, chat, in-app purchases, cloud accounts, a native app store build, AI-generated hints, video lessons.