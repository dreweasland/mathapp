import { addDays } from './dates';
import { topError } from './errors';
import { factHeat, type FactHeat } from './factDeck';
import { addFactId, divFactId, mulFactId, subFactId, type FactOp } from './facts';
import { mapStatus, selectFrontier, type MapStatus } from './frontier';
import type { Attempt, ErrorType, FactCard, LocalDate, Session } from './state';
import type { SkillDef, SkillStates } from './types';

/** A longer pause than this is the child stepping away, not time spent on math. */
export const MAX_ACTIVE_GAP_MS = 60_000;
export const TREND_WINDOW = 10;
/** Moving this far between windows counts as a real change. */
export const TREND_STEP = 0.15;
/** Practiced this much and still low: worth a grown-up's attention. */
export const NEEDS_HELP_ATTEMPTS = 10;
export const NEEDS_HELP_MASTERY = 60;

export interface Activity {
  quests: number;
  minutes: number;
  /** Problems, counted once however many tries they took. */
  problems: number;
  /** Right on the first try, 0–1. Undefined with no problems to measure. */
  accuracy?: number;
}

export interface DayActivity extends Activity {
  date: LocalDate;
}

/** Time from answers, because a quest can be left and resumed hours later. */
function activeMs(attempts: Attempt[]): number {
  const sorted = [...attempts].sort((a, b) => a.at - b.at);
  return sorted.reduce((total, attempt, i) => {
    const previous = sorted[i - 1];
    const gap = previous ? attempt.at - previous.at : attempt.responseMs;
    return total + Math.min(gap, MAX_ACTIVE_GAP_MS);
  }, 0);
}

const dateRange = (end: LocalDate, days: number): LocalDate[] =>
  Array.from({ length: days }, (_, i) => addDays(end, i - days + 1));

function activityOn(dates: Set<LocalDate>, sessions: Session[], attempts: Attempt[]): Activity {
  const inRange = sessions.filter((s) => dates.has(s.date) && s.type !== 'placement');
  const ids = new Set(inRange.map((s) => s.id));
  const mine = attempts.filter((a) => ids.has(a.sessionId));
  const firstTries = mine.filter((a) => a.tryNumber === 1);
  const ms = inRange.reduce(
    (total, s) => total + activeMs(mine.filter((a) => a.sessionId === s.id)),
    0,
  );
  const activity: Activity = {
    quests: inRange.filter((s) => s.completedQuest).length,
    minutes: Math.round(ms / 60_000),
    problems: firstTries.length,
  };
  if (firstTries.length > 0) {
    activity.accuracy = firstTries.filter((a) => a.correct).length / firstTries.length;
  }
  return activity;
}

/** Placement isn't practice, so it stays out of every total. */
export const activityBetween = (
  from: LocalDate,
  to: LocalDate,
  sessions: Session[],
  attempts: Attempt[],
): Activity => {
  const dates: LocalDate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);
  return activityOn(new Set(dates), sessions, attempts);
};

/** Oldest first, one entry per day, for the teacher report's activity strip. */
export const dailyActivity = (
  end: LocalDate,
  days: number,
  sessions: Session[],
  attempts: Attempt[],
): DayActivity[] =>
  dateRange(end, days).map((date) => ({
    date,
    ...activityOn(new Set([date]), sessions, attempts),
  }));

export type Trend = 'up' | 'down' | 'steady';

/**
 * First-try accuracy of the latest answers against the ones before. Harder problems can pull
 * this down while the child improves, so it's a prompt to look, not a verdict.
 */
export function skillTrend(attempts: Attempt[]): Trend | undefined {
  const firsts = attempts.filter((a) => a.tryNumber === 1).sort((a, b) => a.at - b.at);
  const size = Math.min(TREND_WINDOW, Math.floor(firsts.length / 2));
  if (size < TREND_WINDOW / 2) return undefined;
  const rate = (list: Attempt[]) => list.filter((a) => a.correct).length / list.length;
  const change = rate(firsts.slice(-size)) - rate(firsts.slice(-2 * size, -size));
  if (change >= TREND_STEP) return 'up';
  return change <= -TREND_STEP ? 'down' : 'steady';
}

export interface SkillRow {
  skill: SkillDef;
  status: MapStatus;
  mastery: number;
  attempts: number;
  trend?: Trend;
  lastPracticedAt?: number;
  topError?: ErrorType;
}

/** `graph` is the whole curriculum, so a partial list still places each skill correctly. */
export function skillRows(
  skills: SkillDef[],
  states: SkillStates,
  attempts: Attempt[],
  graph: SkillDef[] = skills,
): SkillRow[] {
  return skills.map((skill) => {
    const state = states[skill.id];
    const row: SkillRow = {
      skill,
      status: mapStatus(skill, graph, states),
      mastery: Math.round(state?.mastery ?? 0),
      attempts: state?.attempts ?? 0,
    };
    const trend = skillTrend(attempts.filter((a) => a.skillId === skill.id));
    if (trend) row.trend = trend;
    if (state?.lastPracticedAt !== undefined) row.lastPracticedAt = state.lastPracticedAt;
    const error = state && topError(state);
    if (error) row.topError = error;
    return row;
  });
}

export interface FactCell {
  id: string;
  label: string;
  heat: FactHeat;
}

export interface FactGrid {
  op: FactOp;
  /** Row and column headings: 0–10 for add and subtract, 1–10 for multiply and divide. */
  side: number[];
  /** Addition: row + column. Subtraction: (row + column) − row. And the same for × and ÷. */
  rows: FactCell[][];
  counts: Record<FactHeat, number>;
}

const ZERO_TO_TEN = Array.from({ length: 11 }, (_, i) => i);
const ONE_TO_TEN = ZERO_TO_TEN.slice(1);

function factCell(op: FactOp, row: number, col: number): { id: string; label: string } {
  switch (op) {
    case 'add':
      return { id: addFactId(row, col) as string, label: `${row}+${col}` };
    case 'sub':
      return { id: subFactId(row + col, row) as string, label: `${row + col}−${row}` };
    case 'mul':
      return { id: mulFactId(row, col) as string, label: `${row}×${col}` };
    case 'div':
      return { id: divFactId(row * col, row) as string, label: `${row * col}÷${row}` };
  }
}

export function factGrid(op: FactOp, cards: ReadonlyMap<string, FactCard>): FactGrid {
  const counts: Record<FactHeat, number> = { automatic: 0, quick: 0, working: 0, unseen: 0 };
  const side = op === 'add' || op === 'sub' ? ZERO_TO_TEN : ONE_TO_TEN;
  const rows = side.map((row) =>
    side.map((col) => {
      const cell = factCell(op, row, col);
      const heat = factHeat(cards.get(cell.id));
      counts[heat] += 1;
      return { ...cell, heat };
    }),
  );
  return { op, side, rows, counts };
}

export interface SkillSummary {
  mastered: number;
  passed: number;
  focus?: SkillDef;
  /** Lowest first, practiced enough to mean something. */
  needsHelp: SkillRow[];
  /** The mistake seen most across all skills. */
  commonError?: ErrorType;
}

export function skillSummary(
  rows: SkillRow[],
  skills: SkillDef[],
  states: SkillStates,
): SkillSummary {
  const totals: Partial<Record<ErrorType, number>> = {};
  for (const state of Object.values(states)) {
    for (const [type, count] of Object.entries(state?.errorCounts ?? {})) {
      totals[type as ErrorType] = (totals[type as ErrorType] ?? 0) + (count ?? 0);
    }
  }
  const summary: SkillSummary = {
    mastered: rows.filter((r) => r.status === 'mastered').length,
    passed: rows.filter((r) => r.status === 'passed').length,
    needsHelp: rows
      .filter(
        (r) =>
          r.status !== 'mastered' &&
          r.attempts >= NEEDS_HELP_ATTEMPTS &&
          r.mastery < NEEDS_HELP_MASTERY,
      )
      .sort((a, b) => a.mastery - b.mastery),
  };
  const focus = selectFrontier(skills, states);
  if (focus) summary.focus = focus;
  const commonError = topError({ errorCounts: totals });
  if (commonError) summary.commonError = commonError;
  return summary;
}
