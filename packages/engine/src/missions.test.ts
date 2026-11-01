import { describe, expect, it } from 'vitest';
import { newFactCard } from './factDeck';
import {
  allMissionsDone,
  applyMissionEvent,
  beatsFastTime,
  generateMissions,
  type MissionContext,
} from './missions';
import { mulberry32 } from './rng';
import type { FactCard } from './state';

const practiced = (n: number): FactCard[] =>
  Array.from({ length: n }, (_, i) => ({
    ...newFactCard('c', `add:${i}+1`, '2026-11-01'),
    lastResponseMs: 2500,
  }));
const ctx = (over: Partial<MissionContext> = {}): MissionContext => ({
  childId: 'c',
  date: '2026-11-01',
  todayMastery: 50,
  factCards: [],
  at: 1,
  ...over,
});
const many = (over: Partial<MissionContext> = {}) =>
  Array.from({ length: 200 }, (_, seed) => generateMissions(ctx(over), mulberry32(seed)));

describe('generateMissions', () => {
  it('gives three missions in slots 1, 2, 3', () => {
    for (const set of many()) expect(set.map((m) => m.slot)).toEqual([1, 2, 3]);
  });
  it('is the same for the same seed', () => {
    expect(generateMissions(ctx(), mulberry32(1))).toEqual(generateMissions(ctx(), mulberry32(1)));
  });
  it('varies across days', () => {
    expect(new Set(many({ factCards: practiced(3) }).map((s) => s[0]?.kind)).size).toBe(2);
  });
  it('never gives the same kind of mission twice in a day', () => {
    for (const over of [{}, { factCards: practiced(3) }]) {
      for (const set of many(over)) {
        expect(new Set(set.map((m) => m.kind)).size).toBe(3);
      }
    }
  });
  it('a child with no timed facts never gets a fast-facts mission', () => {
    for (const set of many({ factCards: practiced(2) })) {
      expect(set.map((m) => m.kind)).not.toContain('fast-facts');
    }
  });
  it('fast-facts needs a time on at least as many facts as its target', () => {
    const missions = many({ factCards: practiced(3) }).flat();
    const fast = missions.filter((m) => m.kind === 'fast-facts');
    expect(fast.length).toBeGreaterThan(0);
    for (const m of fast) expect(m.target).toBeLessThanOrEqual(3);
  });
  it('unseen cards do not count as practiced', () => {
    const cards = [newFactCard('c', 'add:1+1', '2026-11-01')];
    for (const set of many({ factCards: cards })) {
      expect(set.map((m) => m.kind)).not.toContain('fast-facts');
    }
  });
  it('a low-mastery child gets a lower in-a-row target', () => {
    const hard = many({ todayMastery: 10 }).map((s) => s[2]);
    for (const m of hard) expect(m?.target).toBe(4);
  });
  it('in-a-row targets are always within a quest length', () => {
    for (const m of many().flat()) {
      if (m.kind === 'in-a-row') expect(m.target).toBeLessThanOrEqual(5);
    }
  });
});

describe('applyMissionEvent', () => {
  const base = generateMissions(ctx({ factCards: practiced(3) }), mulberry32(3));
  const of = (kind: string, target: number) =>
    [{ ...base[0], slot: 1, kind, target, progress: 0, done: false }] as typeof base;

  it('tracks the best run, not the latest', () => {
    let m = applyMissionEvent(of('in-a-row', 5), { type: 'answer', inARow: 3 }, 1);
    m = applyMissionEvent(m, { type: 'answer', inARow: 1 }, 2);
    expect(m[0]?.progress).toBe(3);
  });
  it('completes at the target and stays done', () => {
    let m = applyMissionEvent(of('in-a-row', 3), { type: 'answer', inARow: 3 }, 1);
    expect(m[0]?.done).toBe(true);
    m = applyMissionEvent(m, { type: 'answer', inARow: 0 }, 2);
    expect(m[0]?.done).toBe(true);
  });
  it('does not overshoot the target', () => {
    const m = applyMissionEvent(of('in-a-row', 3), { type: 'answer', inARow: 9 }, 1);
    expect(m[0]?.progress).toBe(3);
  });
  it('handles quest, challenge and fact events', () => {
    expect(applyMissionEvent(of('finish-quest', 1), { type: 'quest-complete' }, 1)[0]?.done).toBe(
      true,
    );
    expect(
      applyMissionEvent(of('finish-challenge', 1), { type: 'challenge-complete' }, 1)[0]?.done,
    ).toBe(true);
    expect(applyMissionEvent(of('fast-facts', 3), { type: 'fact-beat' }, 1)[0]?.progress).toBe(1);
  });
  it('ignores unrelated events', () => {
    const m = of('finish-quest', 1);
    expect(applyMissionEvent(m, { type: 'fact-beat' }, 1)[0]).toBe(m[0]);
  });
  it('reports when all three are done, and not for an empty list', () => {
    expect(allMissionsDone([])).toBe(false);
    expect(allMissionsDone(of('in-a-row', 3))).toBe(false);
    expect(allMissionsDone([{ ...base[0], done: true }] as typeof base)).toBe(true);
  });
});

describe('beatsFastTime', () => {
  const card = practiced(1)[0];
  it('needs a correct answer quicker than last time', () => {
    expect(beatsFastTime(card, true, 2000)).toBe(true);
    expect(beatsFastTime(card, true, 2500)).toBe(false);
    expect(beatsFastTime(card, false, 100)).toBe(false);
  });
  it('a new fact has no time to beat', () => {
    expect(beatsFastTime(undefined, true, 100)).toBe(false);
  });
});
