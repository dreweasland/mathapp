import { allFacts, factSkill, type Fact } from './facts';
import { isUnlocked } from './frontier';
import { generatorFor } from './generators';
import { clampDifficulty } from './problem';
import { factProblem, hasStarted, signature, type DailyQuest } from './quest';
import type { Rng } from './rng';
import type { LocalDate, SkillState } from './state';
import type { Problem, SkillDef, SkillStates } from './types';

export const PRACTICE_PROBLEMS = 8;
/** A filling bar shows this; the child never sees a countdown. */
export const BLITZ_MS = 60_000;

/** Practice is for what's been taught, so a new skill still starts with its worked example. */
export const practiceSkills = (skills: SkillDef[], states: SkillStates): SkillDef[] =>
  skills.filter((s) => isUnlocked(s, states) && hasStarted(states, s));

export const blitzSkills = (skills: SkillDef[], states: SkillStates): SkillDef[] =>
  practiceSkills(skills, states).filter((s) => s.factBased);

export interface PracticeInput {
  childId: string;
  today: LocalDate;
  skill: SkillDef;
  state: SkillState | undefined;
  rng: Rng;
  seed: number;
}

/** One short set on one skill. Answering more means choosing to start again. */
export function buildPractice({
  childId,
  today,
  skill,
  state,
  rng,
  seed,
}: PracticeInput): DailyQuest {
  const generate = generatorFor(skill.id);
  const difficulty = clampDifficulty(state?.difficulty ?? 1);
  const seen = new Set<string>();
  const items = Array.from({ length: PRACTICE_PROBLEMS }, () => {
    let problem = generate(rng, difficulty);
    for (let tries = 0; tries < 8 && seen.has(signature(problem)); tries++) {
      problem = generate(rng, difficulty);
    }
    seen.add(signature(problem));
    return { problem };
  });
  return {
    childId,
    date: today,
    seed,
    dayNumber: 0,
    ramp: false,
    endOnWin: false,
    todaySkillId: skill.id,
    mode: 'continue',
    challengeKind: 'step-up',
    sections: [{ kind: 'skill', optional: false, items }],
    problemCount: PRACTICE_PROBLEMS,
    estimatedMinutes: 2,
    free: true,
  };
}

/** Grade 2's fact skill is the same cards as Grade 1's, now from memory. */
export function blitzFacts(skillId: string): Fact[] {
  const all = allFacts();
  if (skillId === '2.facts-within-20') return all.filter((f) => f.op === 'add' || f.op === 'sub');
  return all.filter((f) => factSkill(f) === skillId);
}

/** The next fact, never the one just answered. */
export function nextBlitzProblem(skillId: string, last: Problem | undefined, rng: Rng): Problem {
  const facts = blitzFacts(skillId).filter((f) => f.id !== last?.factId);
  return factProblem(rng.pick(facts).id, rng);
}

/** The child's own best only goes up, and a first score always counts as one. */
export function recordBlitz(
  state: SkillState,
  score: number,
  at: number,
): { state: SkillState; best: number; isBest: boolean } {
  const before = state.blitzBest ?? 0;
  if (score <= before) return { state, best: before, isBest: false };
  return { state: { ...state, blitzBest: score, updatedAt: at }, best: score, isBest: true };
}
