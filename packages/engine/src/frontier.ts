import { newSkillState } from './mastery';
import type { SkillState } from './state';
import type { SkillDef, SkillStates } from './types';

export const UNLOCK_THRESHOLD = 70;
export const SHAKY_THRESHOLD = 70;
/** After this many quests without mastering a skill, try something else for a while. */
export const STUCK_AFTER_QUESTS = 5;

const stateOf = (states: SkillStates, skill: SkillDef, childId = ''): SkillState =>
  states[skill.id] ?? newSkillState(childId, skill.id);

const inOrder = (a: SkillDef, b: SkillDef) => a.grade - b.grade || a.order - b.order;

/** Mastered or placed-out counts forever, so a dip in mastery can't re-lock anything. */
function prerequisiteMet(state: SkillState | undefined): boolean {
  if (!state) return false;
  return (
    state.mastery >= UNLOCK_THRESHOLD || state.masteredAt !== undefined || state.placedOut === true
  );
}

export function isUnlocked(skill: SkillDef, states: SkillStates): boolean {
  if (states[skill.id]?.unlockedAt !== undefined) return true;
  return skill.prerequisites.every((id) => prerequisiteMet(states[id]));
}

/** Stamps `unlockedAt` on anything newly open. Existing stamps are never touched. */
export function refreshUnlocks(
  skills: SkillDef[],
  states: SkillStates,
  childId: string,
  at: number,
): SkillStates {
  const next: SkillStates = { ...states };
  for (const skill of [...skills].sort(inOrder)) {
    if (next[skill.id]?.unlockedAt === undefined && isUnlocked(skill, next)) {
      next[skill.id] = { ...stateOf(next, skill, childId), unlockedAt: at, updatedAt: at };
    }
  }
  return next;
}

/** The lowest-grade unmastered skill whose prerequisites are met, skipping stuck ones. */
export function selectFrontier(skills: SkillDef[], states: SkillStates): SkillDef | undefined {
  const open = skills
    .filter((s) => {
      const state = states[s.id];
      return isUnlocked(s, states) && state?.masteredAt === undefined && !state?.placedOut;
    })
    .sort(inOrder);
  const moving = open.find((s) => (states[s.id]?.questsOnSkill ?? 0) < STUCK_AFTER_QUESTS);
  if (moving) return moving;
  // Everything open is stuck: go to whichever has had the least time lately.
  return [...open].sort(
    (a, b) => (states[a.id]?.questsOnSkill ?? 0) - (states[b.id]?.questsOnSkill ?? 0),
  )[0];
}

/** Practiced, unlocked, not fully solid: the weakest first. */
export function selectShaky(
  skills: SkillDef[],
  states: SkillStates,
  excludeId?: string,
): SkillDef | undefined {
  return skills
    .filter((s) => {
      const state = states[s.id];
      return (
        s.id !== excludeId &&
        state !== undefined &&
        state.attempts > 0 &&
        state.mastery < SHAKY_THRESHOLD
      );
    })
    .sort(
      (a, b) => (states[a.id]?.mastery ?? 0) - (states[b.id]?.mastery ?? 0) || inOrder(a, b),
    )[0];
}

/** Mastered and placed-out skills, the longest-unpracticed first, for light review. */
export function selectReview(skills: SkillDef[], states: SkillStates, limit: number): SkillDef[] {
  return skills
    .filter((s) => states[s.id]?.masteredAt !== undefined || states[s.id]?.placedOut === true)
    .sort(
      (a, b) =>
        (states[a.id]?.lastPracticedAt ?? 0) - (states[b.id]?.lastPracticedAt ?? 0) ||
        inOrder(a, b),
    )
    .slice(0, limit);
}

export type MapStatus = 'mastered' | 'passed' | 'current' | 'open' | 'locked';

/** Each skill's place on the child's map. A dip in mastery never moves one backward. */
export function mapStatus(skill: SkillDef, skills: SkillDef[], states: SkillStates): MapStatus {
  const state = states[skill.id];
  if (state?.masteredAt !== undefined) return 'mastered';
  if (state?.placedOut) return 'passed';
  if (selectFrontier(skills, states)?.id === skill.id) return 'current';
  return isUnlocked(skill, states) ? 'open' : 'locked';
}

export type TodayMode = 'new' | 'continue' | 'review';

export interface TodaySkill {
  skill: SkillDef;
  mode: TodayMode;
}

/** Odd-numbered quests review a shaky skill if there is one; otherwise it's the frontier. */
export function selectToday(
  skills: SkillDef[],
  states: SkillStates,
  questsCompleted: number,
): TodaySkill | undefined {
  const frontier = selectFrontier(skills, states);
  const shaky = selectShaky(skills, states, frontier?.id);
  if (questsCompleted % 2 === 1 && shaky) return { skill: shaky, mode: 'review' };
  if (frontier) {
    return {
      skill: frontier,
      mode: (states[frontier.id]?.attempts ?? 0) === 0 ? 'new' : 'continue',
    };
  }
  const review = shaky ?? selectReview(skills, states, 1)[0];
  return review ? { skill: review, mode: 'review' } : undefined;
}
