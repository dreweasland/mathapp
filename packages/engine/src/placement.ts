import { generatorFor } from './generators';
import { UNLOCK_THRESHOLD, refreshUnlocks } from './frontier';
import { newSkillState } from './mastery';
import { mulberry32, type Rng } from './rng';
import type { Difficulty, Problem, SkillDef, SkillStates } from './types';

/** The core strand. Side strands (time, shapes, measure, place value) come up normally. */
export const PLACEMENT_PATH = [
  '1.counting',
  '1.ten-frame',
  '1.add-within-10',
  '1.sub-within-10',
  '1.add-within-20',
  '1.sub-within-20',
];
export const MAX_PLACEMENT_PROBLEMS = 15;
export const PROBES_PER_SKILL = 3;
export const PROBES_TO_PASS = 2;
const PROBE_DIFFICULTY: Difficulty = 3;

export interface PlacementState {
  index: number;
  correct: number;
  wrong: number;
  asked: number;
  passed: string[];
  done: boolean;
}

export const startPlacement = (): PlacementState => ({
  index: 0,
  correct: 0,
  wrong: 0,
  asked: 0,
  passed: [],
  done: false,
});

export function nextProbe(state: PlacementState, rng: Rng): Problem | undefined {
  if (state.done) return undefined;
  const skillId = PLACEMENT_PATH[state.index];
  if (!skillId) return undefined;
  return generatorFor(skillId)(rng, PROBE_DIFFICULTY);
}

/** Stops the skill as soon as it's decided, to keep placement to 3–5 minutes. */
export function recordProbe(state: PlacementState, correct: boolean): PlacementState {
  if (state.done) return state;
  const next: PlacementState = {
    ...state,
    asked: state.asked + 1,
    correct: state.correct + (correct ? 1 : 0),
    wrong: state.wrong + (correct ? 0 : 1),
  };
  const failed = next.wrong > PROBES_PER_SKILL - PROBES_TO_PASS;
  const passed = next.correct >= PROBES_TO_PASS;
  const skillId = PLACEMENT_PATH[next.index] as string;
  if (failed) return { ...next, done: true };
  if (passed) {
    const index = next.index + 1;
    return {
      ...next,
      index,
      correct: 0,
      wrong: 0,
      passed: [...next.passed, skillId],
      done: index >= PLACEMENT_PATH.length || next.asked >= MAX_PLACEMENT_PROBLEMS,
    };
  }
  return next.asked >= MAX_PLACEMENT_PROBLEMS ? { ...next, done: true } : next;
}

/** Passed skills become `placedOut`, so they skip the frontier and join review. */
export function applyPlacement(
  passed: string[],
  skills: SkillDef[],
  states: SkillStates,
  childId: string,
  at: number,
): SkillStates {
  const next: SkillStates = { ...states };
  for (const id of passed) {
    const state = next[id] ?? newSkillState(childId, id);
    next[id] = {
      ...state,
      mastery: Math.max(state.mastery, UNLOCK_THRESHOLD),
      placedOut: true,
      updatedAt: at,
    };
  }
  return refreshUnlocks(skills, next, childId, at);
}

/** Parent override: start at this skill by placing out of everything it depends on. */
export function startAtSkill(
  startId: string,
  skills: SkillDef[],
  states: SkillStates,
  childId: string,
  at: number,
): SkillStates {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const ancestors = new Set<string>();
  const visit = (id: string) => {
    for (const parent of byId.get(id)?.prerequisites ?? []) {
      if (!ancestors.has(parent)) {
        ancestors.add(parent);
        visit(parent);
      }
    }
  };
  if (!byId.has(startId)) throw new Error(`Unknown skill ${startId}`);
  visit(startId);
  return applyPlacement([...ancestors], skills, states, childId, at);
}

/** A placement seed for a child, kept in one place. */
export const placementRng = (seed: number): Rng => mulberry32(seed).fork('placement');
