import { describe, expect, it } from 'vitest';
import { selectFrontier } from './frontier';
import { newSkillState } from './mastery';
import {
  applyPlacement,
  MAX_PLACEMENT_PROBLEMS,
  nextProbe,
  PLACEMENT_PATH,
  placementRng,
  recordProbe,
  startAtSkill,
  startPlacement,
  type PlacementState,
} from './placement';
import { def } from './testing/skills';

const walk = (answers: boolean[]): PlacementState =>
  answers.reduce((s, a) => recordProbe(s, a), startPlacement());
const skills = PLACEMENT_PATH.map((id, i) =>
  def(id, i + 1, i === 0 ? [] : [PLACEMENT_PATH[i - 1] as string]),
);

describe('placement walk', () => {
  it('passes a skill on 2 straight correct, without a third probe', () => {
    const s = walk([true, true]);
    expect(s.passed).toEqual(['1.counting']);
    expect(s.index).toBe(1);
    expect(s.asked).toBe(2);
  });
  it('2 of 3 with a miss first still passes', () => {
    expect(walk([false, true, true]).passed).toEqual(['1.counting']);
  });
  it('stops at a failed skill: 1 of 3 is below 60', () => {
    const s = walk([true, true, false, false]);
    expect(s.done).toBe(true);
    expect(s.passed).toEqual(['1.counting']);
  });
  it('a child who misses everything finishes fast with nothing passed', () => {
    const s = walk([false, false]);
    expect(s).toMatchObject({ done: true, passed: [], asked: 2 });
  });
  it('a child who gets everything right clears the path within the cap', () => {
    const s = walk(Array(12).fill(true));
    expect(s.done).toBe(true);
    expect(s.passed).toEqual(PLACEMENT_PATH);
  });
  it('never exceeds 15 problems, however the answers fall', () => {
    let s = startPlacement();
    for (let i = 0; !s.done && i < 100; i++) s = recordProbe(s, i % 3 !== 0);
    expect(s.done).toBe(true);
    expect(s.asked).toBeLessThanOrEqual(MAX_PLACEMENT_PROBLEMS);
  });
  it('ignores answers after it ends', () => {
    const s = walk([false, false]);
    expect(recordProbe(s, true)).toBe(s);
  });
  it('gives probes from the current skill, then none when finished', () => {
    expect(nextProbe(startPlacement(), placementRng(1))?.skillId).toBe('1.counting');
    expect(nextProbe(walk([true, true]), placementRng(1))?.skillId).toBe('1.ten-frame');
    expect(nextProbe(walk([false, false]), placementRng(1))).toBeUndefined();
  });
  it('gives no probe past the end of the path', () => {
    expect(nextProbe({ ...startPlacement(), index: 99 }, placementRng(1))).toBeUndefined();
  });
});

describe('applyPlacement', () => {
  it('marks passed skills as placed out at 70, with no badge', () => {
    const out = applyPlacement(['1.counting'], skills, {}, 'c', 5);
    expect(out['1.counting']).toMatchObject({ mastery: 70, placedOut: true, attempts: 0 });
    expect(out['1.counting']?.masteredAt).toBeUndefined();
  });
  it('sets the frontier just past the last pass, not back at the start', () => {
    const out = applyPlacement(['1.counting', '1.ten-frame'], skills, {}, 'c', 5);
    expect(selectFrontier(skills, out)?.id).toBe('1.add-within-10');
  });
  it('unlocks the next skill', () => {
    const out = applyPlacement(['1.counting'], skills, {}, 'c', 5);
    expect(out['1.ten-frame']?.unlockedAt).toBe(5);
  });
  it('never lowers a higher score', () => {
    const existing = { '1.counting': { ...newSkillState('c', '1.counting'), mastery: 88 } };
    expect(applyPlacement(['1.counting'], skills, existing, 'c', 5)['1.counting']?.mastery).toBe(
      88,
    );
  });
});

describe('startAtSkill', () => {
  it('places out every ancestor', () => {
    const out = startAtSkill('1.sub-within-10', skills, {}, 'c', 5);
    expect(selectFrontier(skills, out)?.id).toBe('1.sub-within-10');
    expect(out['1.counting']?.placedOut).toBe(true);
  });
  it('a root skill places out nothing', () => {
    const out = startAtSkill('1.counting', skills, {}, 'c', 5);
    expect(selectFrontier(skills, out)?.id).toBe('1.counting');
  });
  it('handles diamonds without repeating', () => {
    const diamond = [def('a', 1), def('b', 2, ['a']), def('c', 3, ['a']), def('d', 4, ['b', 'c'])];
    const out = startAtSkill('d', diamond, {}, 'c', 5);
    expect(selectFrontier(diamond, out)?.id).toBe('d');
  });
  it('rejects an unknown skill', () => {
    expect(() => startAtSkill('nope', skills, {}, 'c', 5)).toThrow();
  });
});
