import { arithCandidates } from './distractors';
import type { ErrorType, SkillState } from './state';
import type { Problem } from './types';

/** Why a wrong answer was probably given. Used for the parent's "top error" view. */
export function classifyError(problem: Problem, given: string): ErrorType {
  const tagged = problem.choices?.find((c) => c.value === given);
  if (tagged?.errorType) return tagged.errorType;
  const value = Number(given);
  if (problem.operands.kind === 'arith' && Number.isFinite(value)) {
    const { op, a, b } = problem.operands;
    return arithCandidates(op, a, b).find((c) => c.value === value)?.errorType ?? 'other';
  }
  const answer = Number(problem.answer);
  if (Number.isFinite(value) && Number.isFinite(answer) && Math.abs(value - answer) === 1) {
    return 'off-by-one';
  }
  return 'other';
}

/** The most common specific error for a skill. Ties go to the first found. */
export function topError(state: Pick<SkillState, 'errorCounts'>): ErrorType | undefined {
  let best: ErrorType | undefined;
  let bestCount = 0;
  for (const [type, count] of Object.entries(state.errorCounts) as [ErrorType, number][]) {
    if (type !== 'other' && count > bestCount) {
      best = type;
      bestCount = count;
    }
  }
  return best;
}
