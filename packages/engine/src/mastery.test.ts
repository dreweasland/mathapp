import { describe, expect, it } from 'vitest';
import { FAST_TO_STEP_UP, stepDifficulty } from './difficulty';
import { applyResult, MASTERY_STEP, newSkillState, outcomeFor } from './mastery';
import type { ItemOutcome, SkillDef } from './types';

const skill = { mastery: { threshold: 80, minAttempts: 15 } } as SkillDef;
const run = (outcomes: ItemOutcome[], start = newSkillState('c', 's')) =>
  outcomes.reduce((s, outcome, i) => applyResult(s, skill, { outcome, at: i + 1 }), start);
const repeat = (o: ItemOutcome, n: number) => Array<ItemOutcome>(n).fill(o);

describe('mastery', () => {
  it('fast correct moves up more than slow correct', () => {
    expect(run(['fast']).mastery).toBeGreaterThan(run(['slow']).mastery);
  });
  it('second try moves up less than a slow correct', () => {
    const base = { ...newSkillState('c', 's'), mastery: 20 };
    expect(run(['second-try'], base).mastery).toBeLessThan(run(['slow'], base).mastery);
  });
  it('a wrong answer moves it down', () => {
    expect(run(['missed'], { ...newSkillState('c', 's'), mastery: 50 }).mastery).toBeLessThan(50);
  });
  it('a small step: one result never moves more than the step share of 100', () => {
    expect(run(['fast']).mastery).toBeCloseTo(100 * MASTERY_STEP);
  });
  it('stays within 0–100', () => {
    expect(run(repeat('fast', 500)).mastery).toBeLessThanOrEqual(100);
    expect(run(repeat('missed', 500)).mastery).toBeGreaterThanOrEqual(0);
  });
  it('15 fast answers earn mastery', () => {
    expect(run(repeat('fast', 15)).masteredAt).toBe(15);
  });
  it('all slow-but-correct answers earn mastery too, at 18 rather than 15', () => {
    expect(run(repeat('slow', 17)).masteredAt).toBeUndefined();
    expect(run(repeat('slow', 18)).masteredAt).toBe(18);
  });
  it('14 attempts never earn the badge, even if the score were high', () => {
    const near = { ...newSkillState('c', 's'), mastery: 95 };
    expect(run(repeat('fast', 14), near).masteredAt).toBeUndefined();
  });
  it('15 attempts exactly can earn it from a high start, but not before', () => {
    const near = { ...newSkillState('c', 's'), mastery: 95 };
    expect(run(repeat('fast', 15), near).masteredAt).toBe(15);
  });
  it('about 85% accuracy is enough given time; 60% is not', () => {
    const pattern = (hits: number, of: number, n: number) =>
      Array.from({ length: n }, (_, i): ItemOutcome => (i % of < hits ? 'slow' : 'missed'));
    expect(run(pattern(9, 10, 60)).masteredAt).toBeDefined();
    expect(run(pattern(3, 5, 200)).masteredAt).toBeUndefined();
  });
  it('a badge stays after mastery falls: rewards are never taken away', () => {
    const earned = run(repeat('fast', 20));
    const after = run(repeat('missed', 30), earned);
    expect(after.mastery).toBeLessThan(20);
    expect(after.masteredAt).toBe(earned.masteredAt);
  });
  it('re-earning does not move the original badge date', () => {
    const earned = run(repeat('fast', 20));
    expect(run(repeat('fast', 10), earned).masteredAt).toBe(earned.masteredAt);
  });
  it('counts one attempt per problem and records the time', () => {
    const s = run(['fast', 'missed', 'slow']);
    expect(s.attempts).toBe(3);
    expect(s.lastPracticedAt).toBe(3);
  });
  it('tallies error types', () => {
    let s = newSkillState('c', 's');
    s = applyResult(s, skill, { outcome: 'missed', errorType: 'off-by-one', at: 1 });
    s = applyResult(s, skill, { outcome: 'missed', errorType: 'off-by-one', at: 2 });
    s = applyResult(s, skill, { outcome: 'second-try', errorType: 'place-value', at: 3 });
    expect(s.errorCounts).toEqual({ 'off-by-one': 2, 'place-value': 1 });
  });
  it('does not mutate the input', () => {
    const s = newSkillState('c', 's');
    applyResult(s, skill, { outcome: 'missed', errorType: 'other', at: 1 });
    expect(s).toEqual(newSkillState('c', 's'));
  });
});

describe('outcomeFor', () => {
  const base = { correct: true, tryNumber: 1, responseMs: 3000, fastMs: 3000 } as const;
  it('exactly on the bar is fast', () => expect(outcomeFor(base)).toBe('fast'));
  it('one ms over is slow', () => expect(outcomeFor({ ...base, responseMs: 3001 })).toBe('slow'));
  it('a correct retry is second-try, however quick', () =>
    expect(outcomeFor({ ...base, tryNumber: 2, responseMs: 1 })).toBe('second-try'));
  it('incorrect is missed', () => expect(outcomeFor({ ...base, correct: false })).toBe('missed'));
});

describe('difficulty', () => {
  it('steps up after 3 fast in a row and resets the count', () => {
    const s = run(repeat('fast', FAST_TO_STEP_UP));
    expect(s.difficulty).toBe(2);
    expect(s.fastStreak).toBe(0);
  });
  it('a slow answer breaks the fast run', () => {
    expect(run(['fast', 'fast', 'slow', 'fast']).difficulty).toBe(1);
  });
  it('steps down after 2 wrong', () => {
    expect(
      run(['missed', 'missed'], { ...newSkillState('c', 's'), difficulty: 3 }).difficulty,
    ).toBe(2);
  });
  it('a correct answer between misses resets the wrong run', () => {
    const s = run(['missed', 'slow', 'missed'], { ...newSkillState('c', 's'), difficulty: 3 });
    expect(s.difficulty).toBe(3);
  });
  it('a second-try answer counts as wrong for difficulty', () => {
    const s = run(['second-try', 'missed'], { ...newSkillState('c', 's'), difficulty: 3 });
    expect(s.difficulty).toBe(2);
  });
  it('tops out at 5', () => expect(run(repeat('fast', 40)).difficulty).toBe(5));
  it('bottoms out at 1', () => expect(run(repeat('missed', 40)).difficulty).toBe(1));
  it('leaves a neutral state alone', () => {
    const s = { difficulty: 2 as const, fastStreak: 1, wrongStreak: 1 };
    expect(stepDifficulty(s)).toBe(s);
  });
});
