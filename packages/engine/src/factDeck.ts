import { addDays } from './dates';
import { allFacts, factSkill, type Fact } from './facts';
import type { FactCard, LocalDate } from './state';

/** Days until due, indexed by box. */
export const BOX_INTERVALS = [0, 1, 2, 4, 8, 16] as const;
export const HISTORY_LIMIT = 10;
export const FLUENCY_MS = 3000;
export const FLUENCY_RATE = 0.9;

export function newFactCard(childId: string, factId: string, today: LocalDate): FactCard {
  return { childId, factId, box: 0, dueDate: today, history: [], updatedAt: 0 };
}

/** Facts the child can be drilled on: those of skills they have reached. */
export function unlockedFacts(unlockedSkillIds: Iterable<string>): Fact[] {
  const skills = new Set(unlockedSkillIds);
  return allFacts().filter((fact) => skills.has(factSkill(fact)));
}

export interface FactReview {
  correct: boolean;
  responseMs: number;
  today: LocalDate;
  at: number;
  /** Defaults to the 3-second bar. */
  fastMs?: number;
}

/** Fast-correct moves up a box, slow-correct stays, wrong goes back to the start. */
export function reviewCard(card: FactCard, review: FactReview): FactCard {
  const { correct, responseMs, today, at, fastMs = FLUENCY_MS } = review;
  const fast = correct && responseMs <= fastMs;
  const box = (!correct ? 0 : fast ? Math.min(5, card.box + 1) : card.box) as FactCard['box'];
  return {
    ...card,
    box,
    dueDate: addDays(today, BOX_INTERVALS[box]),
    lastResponseMs: responseMs,
    history: [...card.history, { at, correct, responseMs }].slice(-HISTORY_LIMIT),
    updatedAt: at,
  };
}

/** The brief's bar: correct within 3s on at least 90% of the last 10 attempts. */
export function isAutomatic(card: FactCard, fastMs = FLUENCY_MS): boolean {
  if (card.history.length < HISTORY_LIMIT) return false;
  const quick = card.history.filter((h) => h.correct && h.responseMs <= fastMs).length;
  return quick / card.history.length >= FLUENCY_RATE;
}

export type FluencyStatus = 'fast' | 'slow' | 'unknown';

/** For the parent's heat map. */
export function fluencyStatus(card: FactCard | undefined): FluencyStatus {
  if (!card || card.history.length === 0) return 'unknown';
  return isAutomatic(card) ? 'fast' : 'slow';
}

/** At most this many never-seen cards a day, so a child isn't flooded. */
export const NEW_CARDS_PER_DAY = 3;

/** Due cards first (oldest first, then lowest box), then a few new ones. */
export function selectWarmupFacts(
  cards: FactCard[],
  unlocked: Fact[],
  today: LocalDate,
  count: number,
): string[] {
  const reachable = new Set(unlocked.map((f) => f.id));
  const due = cards
    .filter((c) => reachable.has(c.factId) && c.dueDate <= today)
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) || a.box - b.box || a.factId.localeCompare(b.factId),
    )
    .map((c) => c.factId);
  const known = new Set(cards.map((c) => c.factId));
  const room = Math.max(0, count - due.length);
  const fresh = unlocked
    .filter((f) => !known.has(f.id))
    .slice(0, Math.min(room, due.length === 0 ? count : NEW_CARDS_PER_DAY))
    .map((f) => f.id);
  return [...due.slice(0, count), ...fresh];
}
