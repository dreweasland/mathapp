import type { Rng } from './rng';
import type { FactCard, LocalDate, Mission, MissionKind } from './state';

export const MISSION_COINS: Record<Mission['slot'], number> = { 1: 5, 2: 10, 3: 15 };
const FAST_FACT_TARGET = 3;

export interface MissionContext {
  childId: string;
  date: LocalDate;
  /** Mastery of today's skill, so targets match what the child can do. */
  todayMastery: number;
  factCards: FactCard[];
  at: number;
}

function mission(
  ctx: MissionContext,
  slot: Mission['slot'],
  kind: MissionKind,
  target: number,
): Mission {
  return {
    childId: ctx.childId,
    date: ctx.date,
    slot,
    kind,
    target,
    progress: 0,
    done: false,
    updatedAt: ctx.at,
  };
}

/**
 * Easy, medium and hard, always achievable: a fast-fact mission needs facts with a time
 * to beat, and in-a-row targets follow today's mastery. Missed missions simply refresh.
 */
export function generateMissions(ctx: MissionContext, rng: Rng): Mission[] {
  const practiced = ctx.factCards.filter((c) => c.lastResponseMs !== undefined);
  const canBeatTimes = practiced.length >= FAST_FACT_TARGET;
  const streakTarget = ctx.todayMastery < 40 ? 4 : 5;

  const hard =
    canBeatTimes && rng.int(0, 1) === 0
      ? mission(ctx, 3, 'fast-facts', FAST_FACT_TARGET)
      : mission(ctx, 3, 'in-a-row', streakTarget);
  // Two in-a-row missions on one day would just be the same mission twice.
  const easy =
    hard.kind === 'in-a-row' || rng.int(0, 1) === 0
      ? mission(ctx, 1, 'finish-quest', 1)
      : mission(ctx, 1, 'in-a-row', 3);
  const medium = mission(ctx, 2, 'finish-challenge', 1);
  return [easy, medium, hard];
}

export type MissionEvent =
  | { type: 'answer'; inARow: number }
  | { type: 'quest-complete' }
  | { type: 'challenge-complete' }
  | { type: 'fact-beat' };

function progressFrom(mission: Mission, event: MissionEvent): number {
  switch (event.type) {
    case 'answer':
      return mission.kind === 'in-a-row'
        ? Math.max(mission.progress, event.inARow)
        : mission.progress;
    case 'quest-complete':
      return mission.kind === 'finish-quest' ? 1 : mission.progress;
    case 'challenge-complete':
      return mission.kind === 'finish-challenge' ? 1 : mission.progress;
    case 'fact-beat':
      return mission.kind === 'fast-facts' ? mission.progress + 1 : mission.progress;
  }
}

/** Progress and `done` only move forward. */
export function applyMissionEvent(missions: Mission[], event: MissionEvent, at: number): Mission[] {
  return missions.map((m) => {
    if (m.done) return m;
    const progress = Math.min(m.target, progressFrom(m, event));
    if (progress === m.progress) return m;
    return { ...m, progress, done: progress >= m.target, updatedAt: at };
  });
}

export const allMissionsDone = (missions: Mission[]): boolean =>
  missions.length > 0 && missions.every((m) => m.done);

/** A correct answer quicker than the last time on that fact. */
export const beatsFastTime = (card: FactCard | undefined, correct: boolean, ms: number): boolean =>
  correct && card?.lastResponseMs !== undefined && ms < card.lastResponseMs;
