import { stepDifficulty } from './difficulty';
import type { ErrorType, SkillState } from './state';
import type { ItemOutcome, SkillDef } from './types';

/**
 * Mastery is an exponential moving average: each result pulls the score a fixed share of
 * the way toward a target. It takes about 15 attempts at roughly 85% accuracy to reach 80.
 */
export const MASTERY_STEP = 0.12;
export const MASTERY_TARGET: Record<ItemOutcome, number> = {
  fast: 100,
  slow: 90,
  'second-try': 50,
  missed: 0,
};

export function newSkillState(childId: string, skillId: string): SkillState {
  return {
    childId,
    skillId,
    mastery: 0,
    attempts: 0,
    difficulty: 1,
    errorCounts: {},
    fastStreak: 0,
    wrongStreak: 0,
    questsOnSkill: 0,
    updatedAt: 0,
  };
}

export const outcomeFor = (input: {
  correct: boolean;
  tryNumber: 1 | 2;
  responseMs: number;
  fastMs: number;
}): ItemOutcome => {
  if (!input.correct) return 'missed';
  if (input.tryNumber === 2) return 'second-try';
  return input.responseMs <= input.fastMs ? 'fast' : 'slow';
};

export interface ItemResult {
  outcome: ItemOutcome;
  errorType?: ErrorType | undefined;
  /** Epoch ms from the caller; the engine never reads the clock. */
  at: number;
}

/** Applies one problem's result. Call once per problem, not once per try. */
export function applyResult(state: SkillState, skill: SkillDef, result: ItemResult): SkillState {
  const { outcome, errorType, at } = result;
  const mastery = state.mastery + MASTERY_STEP * (MASTERY_TARGET[outcome] - state.mastery);
  const firstTryWrong = outcome === 'second-try' || outcome === 'missed';
  const attempts = state.attempts + 1;
  const errorCounts = { ...state.errorCounts };
  if (errorType) errorCounts[errorType] = (errorCounts[errorType] ?? 0) + 1;

  const earned = mastery >= skill.mastery.threshold && attempts >= skill.mastery.minAttempts;
  const next: SkillState = {
    ...state,
    mastery,
    attempts,
    errorCounts,
    lastPracticedAt: at,
    fastStreak: outcome === 'fast' ? state.fastStreak + 1 : 0,
    wrongStreak: firstTryWrong ? state.wrongStreak + 1 : 0,
    updatedAt: at,
  };
  // Sticky: a badge, once earned, stays even if mastery later falls.
  if (earned && next.masteredAt === undefined) next.masteredAt = at;
  return stepDifficulty(next);
}
