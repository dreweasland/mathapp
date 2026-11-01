import { clampDifficulty } from './problem';
import type { SkillState } from './state';

export const FAST_TO_STEP_UP = 3;
export const WRONG_TO_STEP_DOWN = 2;

/** Steps up after 3 fast-correct in a row and down after 2 wrong. A step resets both counts. */
export function stepDifficulty<
  T extends Pick<SkillState, 'difficulty' | 'fastStreak' | 'wrongStreak'>,
>(state: T): T {
  if (state.fastStreak >= FAST_TO_STEP_UP) {
    return { ...state, difficulty: clampDifficulty(state.difficulty + 1), fastStreak: 0 };
  }
  if (state.wrongStreak >= WRONG_TO_STEP_DOWN) {
    return { ...state, difficulty: clampDifficulty(state.difficulty - 1), wrongStreak: 0 };
  }
  return state;
}
