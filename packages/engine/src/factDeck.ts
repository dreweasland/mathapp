import { addDays } from './dates';
import { allFacts, factSkill, type Fact } from './facts';
import type { Rng } from './rng';
import type { FactCard, LocalDate } from './state';

/** Days until due, indexed by box. */
export const BOX_INTERVALS = [0, 1, 2, 4, 8, 16] as const;
export const HISTORY_LIMIT = 10;
export const FLUENCY_MS = 3000;
export const FLUENCY_RATE = 0.9;

export function newFactCard(childId: string, factId: string, today: LocalDate): FactCard {
  return { childId, factId, box: 0, dueDate: today, history: [], updatedAt: 0 };
}

/** Facts belonging to these skills. Pass only skills the child has already been taught. */
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

/**
 * For the parent's heat map. `automatic` is the brief's bar, which takes 10 attempts on one
 * card, so a child needs months to reach it across 242 cards. `quick` shows the climb.
 */
export type FactHeat = 'automatic' | 'quick' | 'working' | 'unseen';

export function factHeat(card: FactCard | undefined): FactHeat {
  if (!card || card.history.length === 0) return 'unseen';
  if (isAutomatic(card)) return 'automatic';
  const lastTwo = card.history.slice(-2);
  const quick =
    lastTwo.length === 2 && lastTwo.every((h) => h.correct && h.responseMs <= FLUENCY_MS);
  return quick ? 'quick' : 'working';
}

/** At most this many never-seen cards a day, so a child isn't flooded. */
export const NEW_CARDS_PER_DAY = 3;

const easeTier = (fact: Fact): number => {
  const total = fact.op === 'add' ? fact.a + fact.b : fact.a;
  return total <= 5 ? 0 : total <= 10 ? 1 : 2;
};

/**
 * Due cards first (oldest first, then lowest box), then a few new ones: easier sums before
 * harder, shuffled within each tier so a child doesn't get 0+0, 0+1, 0+2 in a row.
 */
export function selectWarmupFacts(
  cards: FactCard[],
  unlocked: Fact[],
  today: LocalDate,
  count: number,
  rng: Rng,
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
  const fresh = rng
    .shuffle(unlocked.filter((f) => !known.has(f.id)))
    .sort((a, b) => easeTier(a) - easeTier(b))
    .slice(0, Math.min(room, due.length === 0 ? count : NEW_CARDS_PER_DAY))
    .map((f) => f.id);
  return [...due.slice(0, count), ...fresh];
}
