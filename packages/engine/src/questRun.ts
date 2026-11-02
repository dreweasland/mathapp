import { classifyError } from './errors';
import { newFactCard, reviewCard } from './factDeck';
import { refreshUnlocks } from './frontier';
import { applyResult, newSkillState, outcomeFor } from './mastery';
import type { DailyQuest, QuestItem } from './quest';
import { recordQuestOnSkill } from './quest';
import type { ChildProfile, ErrorType, FactCard, LocalDate, Streak, Wallet } from './state';
import { completeQuest, type StreakEvent } from './streak';
import type { ItemOutcome, Problem, SkillDef, SkillStates } from './types';
import { coinsForAnswer, COINS, earnCoins } from './wallet';

/**
 * Where a child is inside a Daily Quest, as plain data. It is saved after every problem so
 * a quest can resume exactly where it stopped, even after the app is closed.
 */
export type RunStage =
  'section-intro' | 'worked-example' | 'answering' | 'feedback' | 'offer-challenge' | 'finished';

export interface QuestRun {
  quest: DailyQuest;
  stage: RunStage;
  section: number;
  item: number;
  /** Wrong tries on the current problem. */
  misses: 0 | 1;
  firstError?: ErrorType;
  lastOutcome?: ItemOutcome;
  /** First-try correct answers in a row. */
  inARow: number;
  bestInARow: number;
  answered: number;
  correct: number;
  coins: number;
  /** Warm-up and today's skill are finished. This is what counts for the streak. */
  questDone: boolean;
  challengeDone: boolean;
  /** Days 1–3: the last problem has already been given a second go. */
  finalReplayed: boolean;
}

export type TryResult =
  | { kind: 'correct'; outcome: ItemOutcome; coins: number; tryNumber: 1 | 2 }
  | { kind: 'retry'; errorType: ErrorType; tryNumber: 1 }
  | { kind: 'reveal'; outcome: 'missed'; errorType: ErrorType; tryNumber: 2 };

export const startRun = (quest: DailyQuest): QuestRun => ({
  quest,
  stage: 'section-intro',
  section: 0,
  item: 0,
  misses: 0,
  inARow: 0,
  bestInARow: 0,
  answered: 0,
  correct: 0,
  coins: 0,
  questDone: false,
  challengeDone: false,
  finalReplayed: false,
});

export const currentSection = (run: QuestRun) => run.quest.sections[run.section];
export const currentItem = (run: QuestRun): QuestItem | undefined =>
  currentSection(run)?.items[run.item];

/** Number-pad entry may carry leading zeros; "07" and "7" are the same answer. */
export function isCorrect(problem: Problem, given: string): boolean {
  const clean = /^\d+$/.test(given) ? String(Number(given)) : given;
  return clean === problem.answer;
}

const stageFor = (item: QuestItem | undefined): RunStage =>
  item?.workedExample ? 'worked-example' : 'answering';

const fresh = (run: QuestRun): QuestRun => {
  const next = { ...run, misses: 0 as const };
  delete next.firstError;
  delete next.lastOutcome;
  return next;
};

/** Called from the intro card; a tap starts the section's first problem. */
export function beginSection(run: QuestRun): QuestRun {
  if (run.stage !== 'section-intro') return run;
  return { ...run, stage: stageFor(currentItem(run)) };
}

function finishSection(run: QuestRun): QuestRun {
  const kind = currentSection(run)?.kind;
  const nextSection = run.section + 1;
  const toSection = (section: number): QuestRun => ({
    ...fresh(run),
    section,
    item: 0,
    stage: 'section-intro',
  });
  if (kind === 'warmup') return toSection(nextSection);
  if (kind === 'skill') {
    const challenge = run.quest.sections[nextSection];
    return {
      ...fresh(run),
      questDone: true,
      coins: run.coins + COINS.questComplete,
      stage: challenge && challenge.items.length > 0 ? 'offer-challenge' : 'finished',
    };
  }
  return {
    ...fresh(run),
    challengeDone: true,
    coins: run.coins + COINS.challengeComplete,
    stage: 'finished',
  };
}

function nextItem(run: QuestRun): QuestRun {
  const item = run.item + 1;
  const section = currentSection(run);
  if (!section || item >= section.items.length) return finishSection(run);
  return { ...fresh(run), item, stage: stageFor(section.items[item]) };
}

/** The tap-through example teaches; it isn't an attempt, so it earns and costs nothing. */
export function finishWorkedExample(run: QuestRun): QuestRun {
  return run.stage === 'worked-example' ? nextItem(run) : run;
}

export interface SubmitInput {
  given: string;
  responseMs: number;
  fastMs: number;
}

/** Applies one try. Returns undefined if this isn't a moment to answer, such as a double tap. */
export function submitAnswer(
  run: QuestRun,
  { given, responseMs, fastMs }: SubmitInput,
): { run: QuestRun; result: TryResult } | undefined {
  const item = currentItem(run);
  if (run.stage !== 'answering' || !item) return undefined;
  const correct = isCorrect(item.problem, given);
  const tryNumber = (run.misses + 1) as 1 | 2;

  if (!correct && tryNumber === 1) {
    const errorType = classifyError(item.problem, given);
    return {
      run: { ...run, misses: 1, firstError: errorType, inARow: 0 },
      result: { kind: 'retry', errorType, tryNumber: 1 },
    };
  }

  const answered = run.answered + 1;
  if (!correct) {
    const errorType = classifyError(item.problem, given);
    return {
      run: { ...run, stage: 'feedback', answered, lastOutcome: 'missed', inARow: 0 },
      result: { kind: 'reveal', outcome: 'missed', errorType, tryNumber: 2 },
    };
  }

  const outcome = outcomeFor({ correct, tryNumber, responseMs, fastMs });
  const coins = coinsForAnswer({
    correct,
    fast: outcome === 'fast',
    recovered: tryNumber === 2,
    mode: 'quest',
  });
  const inARow = tryNumber === 1 ? run.inARow + 1 : 0;
  return {
    run: {
      ...run,
      stage: 'feedback',
      answered,
      correct: run.correct + 1,
      coins: run.coins + coins,
      inARow,
      bestInARow: Math.max(run.bestInARow, inARow),
      lastOutcome: outcome,
    },
    result: { kind: 'correct', outcome, coins, tryNumber },
  };
}

/**
 * Moves on after feedback. On days 1–3 a missed final problem comes straight back: the child
 * has just seen its answer, so the quest still ends on a win. It only comes back once.
 */
export function advance(run: QuestRun): QuestRun {
  if (run.stage !== 'feedback') return run;
  const finalWin = currentItem(run)?.finalWin === true;
  if (run.quest.endOnWin && finalWin && run.lastOutcome === 'missed' && !run.finalReplayed) {
    return { ...fresh(run), stage: 'answering', finalReplayed: true };
  }
  return nextItem(run);
}

export function acceptChallenge(run: QuestRun): QuestRun {
  if (run.stage !== 'offer-challenge') return run;
  return { ...fresh(run), section: run.section + 1, item: 0, stage: 'section-intro' };
}

/** Skipping costs nothing: the quest is already complete. */
export function skipChallenge(run: QuestRun): QuestRun {
  return run.stage === 'offer-challenge' ? { ...run, stage: 'finished' } : run;
}

/** A quest reopened mid-feedback was already scored, so it picks up at the next problem. */
export const resumeRun = (run: QuestRun): QuestRun =>
  run.stage === 'feedback' ? advance(run) : run;

export interface SettleInput {
  skills: SkillDef[];
  states: SkillStates;
  card?: FactCard | undefined;
  childId: string;
  problem: Problem;
  outcome: ItemOutcome;
  errorType?: ErrorType | undefined;
  responseMs: number;
  today: LocalDate;
  at: number;
}

/** Scores one finished problem, once, however many tries it took. */
export function settleItem(input: SettleInput): { states: SkillStates; card?: FactCard } {
  const { skills, states, childId, problem, outcome, errorType, responseMs, today, at } = input;
  const skill = skills.find((s) => s.id === problem.skillId);
  if (!skill) throw new Error(`Unknown skill ${problem.skillId}`);
  const state = states[skill.id] ?? newSkillState(childId, skill.id);
  const scored = { ...states, [skill.id]: applyResult(state, skill, { outcome, errorType, at }) };
  const nextStates = refreshUnlocks(skills, scored, childId, at);
  if (!problem.factId) return { states: nextStates };
  const card = input.card ?? newFactCard(childId, problem.factId, today);
  // A second-try answer means the fact isn't secure yet, so its card starts over.
  const firstTry = outcome === 'fast' || outcome === 'slow';
  return {
    states: nextStates,
    card: reviewCard(card, { correct: firstTry, responseMs, today, at }),
  };
}

export interface QuestCompletion {
  child: ChildProfile;
  streak: Streak;
  wallet: Wallet;
  states: SkillStates;
  events: StreakEvent[];
  coins: number;
}

/** Everything that happens once when the required parts of a quest are done. */
export function completeDailyQuest(input: {
  child: ChildProfile;
  streak: Streak;
  wallet: Wallet;
  states: SkillStates;
  quest: DailyQuest;
  at: number;
}): QuestCompletion {
  const { child, wallet, states, quest, at } = input;
  // The quest belongs to the day it started, even if it finishes after midnight.
  const { streak, events } = completeQuest(input.streak, quest.date, at);
  const today = states[quest.todaySkillId] ?? newSkillState(child.id, quest.todaySkillId);
  return {
    child: { ...child, questsCompleted: child.questsCompleted + 1, updatedAt: at },
    streak,
    wallet: earnCoins(wallet, COINS.questComplete, at),
    states: { ...states, [today.skillId]: recordQuestOnSkill(today, quest.mode, at) },
    events,
    coins: COINS.questComplete,
  };
}
