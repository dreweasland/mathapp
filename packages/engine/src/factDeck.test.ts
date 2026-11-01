import { describe, expect, it } from 'vitest';
import {
  BOX_INTERVALS,
  fluencyStatus,
  isAutomatic,
  newFactCard,
  NEW_CARDS_PER_DAY,
  reviewCard,
  selectWarmupFacts,
  unlockedFacts,
} from './factDeck';
import type { FactCard } from './state';

const TODAY = '2026-11-01';
const card = (over: Partial<FactCard> = {}): FactCard => ({
  ...newFactCard('c', 'add:3+4', TODAY),
  ...over,
});
const review = (c: FactCard, correct: boolean, responseMs: number) =>
  reviewCard(c, { correct, responseMs, today: TODAY, at: 1 });
const history = (quick: number, of: number): FactCard['history'] =>
  Array.from({ length: of }, (_, i) => ({
    at: i,
    correct: true,
    responseMs: i < quick ? 1000 : 9000,
  }));

describe('reviewCard', () => {
  it('a fast correct moves up a box', () => {
    expect(review(card({ box: 2 }), true, 2000).box).toBe(3);
  });
  it('exactly 3 seconds counts as fast', () => {
    expect(review(card(), true, 3000).box).toBe(1);
  });
  it('a slow correct stays in its box', () => {
    expect(review(card({ box: 2 }), true, 3001).box).toBe(2);
  });
  it('wrong returns to box 0', () => {
    expect(review(card({ box: 5 }), false, 500).box).toBe(0);
  });
  it('tops out at box 5', () => {
    expect(review(card({ box: 5 }), true, 500).box).toBe(5);
  });
  it.each([
    [0, '2026-11-02'],
    [1, '2026-11-03'],
    [2, '2026-11-05'],
    [3, '2026-11-09'],
    [4, '2026-11-17'],
  ] as const)('from box %i a fast answer is next due %s', (box, due) => {
    expect(review(card({ box }), true, 500).dueDate).toBe(due);
  });
  it('box 5 waits 16 days', () => {
    expect(BOX_INTERVALS[5]).toBe(16);
    expect(review(card({ box: 5 }), true, 500).dueDate).toBe('2026-11-17');
  });
  it('wrong is due again the same day', () => {
    expect(review(card({ box: 4 }), false, 500).dueDate).toBe(TODAY);
  });
  it('records the response time and keeps only the last 10', () => {
    let c = card();
    for (let i = 0; i < 25; i++) c = review(c, true, i);
    expect(c.history).toHaveLength(10);
    expect(c.lastResponseMs).toBe(24);
  });
  it('honors a custom fast bar', () => {
    const r = reviewCard(card(), {
      correct: true,
      responseMs: 5000,
      today: TODAY,
      at: 1,
      fastMs: 6000,
    });
    expect(r.box).toBe(1);
  });
});

describe('fluency', () => {
  it('needs 10 attempts', () => {
    expect(isAutomatic(card({ history: history(9, 9) }))).toBe(false);
  });
  it('9 of 10 quick is automatic: exactly 90%', () => {
    expect(isAutomatic(card({ history: history(9, 10) }))).toBe(true);
  });
  it('8 of 10 is not', () => {
    expect(isAutomatic(card({ history: history(8, 10) }))).toBe(false);
  });
  it('a quick wrong answer does not count', () => {
    const h = history(10, 10).map((x, i) => (i < 2 ? { ...x, correct: false } : x));
    expect(isAutomatic(card({ history: h }))).toBe(false);
  });
  it('maps to the heat-map statuses', () => {
    expect(fluencyStatus(undefined)).toBe('unknown');
    expect(fluencyStatus(card())).toBe('unknown');
    expect(fluencyStatus(card({ history: history(2, 5) }))).toBe('slow');
    expect(fluencyStatus(card({ history: history(10, 10) }))).toBe('fast');
  });
});

describe('selectWarmupFacts', () => {
  const add10 = unlockedFacts(['1.add-within-10']);
  const row = (factId: string, dueDate: string, box: FactCard['box'] = 1) =>
    card({ factId, dueDate, box });

  it('only offers facts from reached skills', () => {
    expect(unlockedFacts(['1.add-within-10'])).toHaveLength(66);
    expect(unlockedFacts(['1.counting'])).toHaveLength(0);
  });
  it('fills an empty deck with new cards on day 1', () => {
    expect(selectWarmupFacts([], add10, TODAY, 7)).toHaveLength(7);
  });
  it('due cards come before new ones', () => {
    const out = selectWarmupFacts([row('add:3+4', TODAY)], add10, TODAY, 7);
    expect(out[0]).toBe('add:3+4');
  });
  it('oldest due goes first, then the lowest box', () => {
    const cards = [
      row('add:1+1', '2026-10-30', 3),
      row('add:2+2', '2026-10-29', 3),
      row('add:3+3', '2026-10-30', 1),
    ];
    expect(selectWarmupFacts(cards, add10, TODAY, 3)).toEqual(['add:2+2', 'add:3+3', 'add:1+1']);
  });
  it('skips cards not yet due', () => {
    const out = selectWarmupFacts([row('add:3+4', '2026-11-05')], add10, TODAY, 2);
    expect(out).not.toContain('add:3+4');
  });
  it('never returns more than asked', () => {
    const cards = add10.slice(0, 20).map((f) => row(f.id, TODAY));
    expect(selectWarmupFacts(cards, add10, TODAY, 7)).toHaveLength(7);
  });
  it('tops up with at most 3 new cards once a deck exists', () => {
    const cards = [row('add:0+0', TODAY)];
    const out = selectWarmupFacts(cards, add10, TODAY, 8);
    expect(out).toHaveLength(1 + NEW_CARDS_PER_DAY);
  });
  it('never repeats a fact', () => {
    const out = selectWarmupFacts([row('add:0+0', TODAY)], add10, TODAY, 8);
    expect(new Set(out).size).toBe(out.length);
  });
  it('leaves out a due card whose skill is out of reach', () => {
    expect(selectWarmupFacts([row('sub:9-3', TODAY)], add10, TODAY, 1)).not.toContain('sub:9-3');
  });
  it('returns nothing with no reachable facts', () => {
    expect(selectWarmupFacts([], [], TODAY, 7)).toEqual([]);
  });
});
