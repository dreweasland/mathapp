import { selectWarmupFacts, unlockedFacts } from './factDeck';
import { factSkill, parseFactId } from './facts';
import { isUnlocked, selectReview, selectToday, type TodayMode } from './frontier';
import { generatorFor } from './generators';
import { arithProblem } from './generators/arith';
import { divFactProblem } from './generators/divFacts';
import { multFactProblem } from './generators/multFacts';
import { clampDifficulty } from './problem';
import { hashSeed, mulberry32, type Rng } from './rng';
import type { FactCard, LocalDate, SkillState } from './state';
import type { Difficulty, Problem, SkillDef, SkillStates } from './types';

export interface QuestItem {
  problem: Problem;
  /** Tap-through demo: the first problem of a brand-new skill. */
  workedExample?: boolean;
  /** Light review of a skill already earned. */
  review?: boolean;
  /** Days 1–3: the deliberately easy last problem. */
  finalWin?: boolean;
}

export interface QuestSection {
  kind: 'warmup' | 'skill' | 'challenge';
  /** Only the challenge can be skipped, with no penalty. */
  optional: boolean;
  items: QuestItem[];
}

export interface DailyQuest {
  childId: string;
  date: LocalDate;
  seed: number;
  /** 1 for the child's first quest. */
  dayNumber: number;
  /** Days 1–3: shorter, and planned to end on a win. */
  ramp: boolean;
  /** If the final problem is missed, the quest player adds an easier one. */
  endOnWin: boolean;
  todaySkillId: string;
  mode: TodayMode;
  challengeKind: 'step-up' | 'boss';
  sections: QuestSection[];
  problemCount: number;
  /** A rough planning figure, not a measurement; check it against real sessions. */
  estimatedMinutes: number;
}

export interface QuestInput {
  childId: string;
  today: LocalDate;
  questsCompleted: number;
  skills: SkillDef[];
  states: SkillStates;
  factCards: FactCard[];
  /** Defaults to child + date, so reopening today's quest gives the same quest. */
  seed?: number;
}

const RAMP_DAYS = 3;
const REVIEW_SLOTS = 2;
const TODAY_BUDGET_SECONDS = 240;
const CHALLENGE_BUDGET_SECONDS = 90;
const MIN_TODAY_PROBLEMS = 8;

const SIZES = {
  normal: { warmup: [6, 8], today: [12, 16], challenge: [3, 5] },
  ramp: { warmup: [5, 5], today: [10, 10], challenge: [3, 3] },
} as const;

/**
 * Rough time for one problem, calibrated to the brief's 12–16 problems in 3–4 minutes:
 * speech and feedback, plus thinking time up to the skill's "fast" bar.
 */
const secondsPerProblem = (skill: SkillDef) => 10 + skill.fastMs / 1000;

const MAX_RETAKES = 2;

export const signature = (p: Problem) => JSON.stringify(p.operands);

/** Problems the child was shown the answer to, due back in a later quest. */
function duePracticeProblems(skills: SkillDef[], states: SkillStates, limit: number): Problem[] {
  return skills.flatMap((s) => states[s.id]?.retakes ?? []).slice(0, Math.max(0, limit));
}

/** Avoids showing the same problem twice in a section. */
function drawUnique(make: () => Problem, seen: Set<string>): Problem {
  let problem = make();
  for (let tries = 0; tries < 8 && seen.has(signature(problem)); tries++) problem = make();
  seen.add(signature(problem));
  return problem;
}

/** A fact card as a problem. Warm-up is fast, so it's a tap or a number pad. */
export function factProblem(factId: string, rng: Rng): Problem {
  const { op, a, b } = parseFactId(factId);
  if (op === 'mul') return multFactProblem(rng, 1, a, b);
  if (op === 'div') return divFactProblem(rng, 1, a, b);
  return arithProblem(rng, {
    skillId: factSkill({ id: factId, op, a, b }),
    difficulty: 1,
    op,
    a,
    b,
    type: rng.pick(['number-pad', 'multiple-choice']),
    max: 20,
    factId,
    hint:
      op === 'add'
        ? { visual: 'ten-frame', params: { a, b } }
        : { visual: 'number-line', params: { from: a, back: b } },
  });
}

/** Taught already. A skill that's merely open hasn't been shown to the child yet. */
const hasStarted = (states: SkillStates, skill: SkillDef): boolean => {
  const state = states[skill.id];
  return (state?.attempts ?? 0) > 0 || state?.placedOut === true || state?.masteredAt !== undefined;
};

function warmupSection(input: QuestInput, unlocked: SkillDef[], count: number, rng: Rng) {
  // Never drill a skill before its worked example has taught it.
  const taught = unlocked.filter((s) => hasStarted(input.states, s));
  const facts = unlockedFacts(taught.filter((s) => s.factBased).map((s) => s.id));
  const items: QuestItem[] = selectWarmupFacts(input.factCards, facts, input.today, count, rng).map(
    (id) => ({ problem: factProblem(id, rng) }),
  );
  // No facts yet: easy, quick problems from what's been taught. Stories are too slow here.
  const quick = (taught.length > 0 ? taught : unlocked).filter((s) => s.fastMs <= 8000);
  const seen = new Set(items.map((i) => signature(i.problem)));
  while (items.length < count && quick.length > 0) {
    const skill = rng.pick(quick);
    items.push({ problem: drawUnique(() => generatorFor(skill.id)(rng, 1), seen) });
  }
  return items;
}

const difficultyOf = (states: SkillStates, id: string): Difficulty => states[id]?.difficulty ?? 1;

function todaySection(
  input: QuestInput,
  skill: SkillDef,
  mode: TodayMode,
  count: number,
  ramp: boolean,
  rng: Rng,
): QuestItem[] {
  const generate = generatorFor(skill.id);
  const difficulty = difficultyOf(input.states, skill.id);
  const seen = new Set<string>();
  const reviews =
    ramp || mode === 'review'
      ? []
      : selectReview(input.skills, input.states, REVIEW_SLOTS).filter((s) => s.id !== skill.id);
  const retakes = duePracticeProblems(input.skills, input.states, Math.min(MAX_RETAKES, count - 2));
  for (const problem of retakes) seen.add(signature(problem));
  const main = count - reviews.length - retakes.length;
  const items: QuestItem[] = [];
  for (let i = 0; i < main; i++) {
    const problem = drawUnique(() => generate(rng, difficulty), seen);
    items.push(mode === 'new' && i === 0 ? { problem, workedExample: true } : { problem });
  }
  for (const review of reviews) {
    const problem = drawUnique(
      () => generatorFor(review.id)(rng, difficultyOf(input.states, review.id)),
      seen,
    );
    items.push({ problem, review: true });
  }
  // After the first problem, so a worked example still leads and a final win still ends.
  items.splice(1, 0, ...retakes.map((problem) => ({ problem, review: true })));
  return items;
}

function challengeSection(
  input: QuestInput,
  skill: SkillDef,
  unlocked: SkillDef[],
  count: number,
  rng: Rng,
): { kind: DailyQuest['challengeKind']; items: QuestItem[] } {
  const difficulty = difficultyOf(input.states, skill.id);
  const seen = new Set<string>();
  if (difficulty < 5) {
    const up = clampDifficulty(difficulty + 1);
    const items = Array.from({ length: count }, () => ({
      problem: drawUnique(() => generatorFor(skill.id)(rng, up), seen),
    }));
    return { kind: 'step-up', items };
  }
  // Already at the top: a mixed boss round from everything open.
  const items = Array.from({ length: count }, () => {
    const pick = rng.pick(unlocked);
    return {
      problem: drawUnique(
        () => generatorFor(pick.id)(rng, difficultyOf(input.states, pick.id)),
        seen,
      ),
    };
  });
  return { kind: 'boss', items };
}

/** Replaces the last item with a problem from the easiest level. */
function endOnEasyWin(items: QuestItem[], skill: SkillDef, rng: Rng): QuestItem[] {
  if (items.length === 0) return items;
  const easy = { problem: generatorFor(skill.id)(rng, 1), finalWin: true };
  return [...items.slice(0, -1), easy];
}

export function buildDailyQuest(input: QuestInput): DailyQuest {
  const { childId, today, questsCompleted, skills, states } = input;
  const seed = input.seed ?? hashSeed(`${childId}|${today}`);
  const rng = mulberry32(seed);
  const ramp = questsCompleted < RAMP_DAYS;
  const sizes = ramp ? SIZES.ramp : SIZES.normal;
  const pickSize = (range: readonly [number, number], r: Rng) => r.int(range[0], range[1]);

  const unlocked = skills.filter((s) => isUnlocked(s, states));
  const chosen = selectToday(skills, states, questsCompleted);
  if (!chosen) throw new Error('No skills available to build a quest');
  const { skill, mode } = chosen;

  const seconds = secondsPerProblem(skill);
  // Slow problems like stories shrink the section, because 5–8 minutes is non-negotiable.
  const wantedToday = pickSize(sizes.today, rng.fork('size-today'));
  const todayCount = Math.max(
    Math.min(wantedToday, MIN_TODAY_PROBLEMS),
    Math.min(wantedToday, Math.floor(TODAY_BUDGET_SECONDS / seconds)),
  );
  const wantedChallenge = pickSize(sizes.challenge, rng.fork('size-challenge'));
  const challengeCount = Math.max(
    3,
    Math.min(wantedChallenge, Math.floor(CHALLENGE_BUDGET_SECONDS / seconds)),
  );

  const warmupRng = rng.fork('warmup');
  const warmup = warmupSection(
    input,
    unlocked,
    pickSize(sizes.warmup, rng.fork('size-warmup')),
    warmupRng,
  );
  let todayItems = todaySection(input, skill, mode, todayCount, ramp, rng.fork('today'));
  const challenge = challengeSection(input, skill, unlocked, challengeCount, rng.fork('challenge'));
  let challengeItems = challenge.items;

  if (ramp) {
    // The challenge is optional, so either section can be the last one played.
    todayItems = endOnEasyWin(todayItems, skill, rng.fork('win-today'));
    challengeItems = endOnEasyWin(challengeItems, skill, rng.fork('win-challenge'));
  }

  const sections: QuestSection[] = [
    { kind: 'warmup', optional: false, items: warmup },
    { kind: 'skill', optional: false, items: todayItems },
    { kind: 'challenge', optional: true, items: challengeItems },
  ];
  const problemCount = sections.reduce((sum, s) => sum + s.items.length, 0);
  const estimatedSeconds =
    warmup.length * 8 + (todayItems.length + challengeItems.length) * seconds;

  return {
    childId,
    date: today,
    seed,
    dayNumber: questsCompleted + 1,
    ramp,
    endOnWin: ramp,
    todaySkillId: skill.id,
    mode,
    challengeKind: challenge.kind,
    sections,
    problemCount,
    estimatedMinutes: Math.round((estimatedSeconds / 60) * 10) / 10,
  };
}

/** After a quest: a frontier skill counts one more quest; mastering it clears the count. */
export function recordQuestOnSkill(state: SkillState, mode: TodayMode, at: number): SkillState {
  if (mode === 'review') return state;
  return {
    ...state,
    questsOnSkill: state.masteredAt === undefined ? state.questsOnSkill + 1 : 0,
    updatedAt: at,
  };
}
