import { describe, expect, it } from 'vitest';
import {
  mapStatus,
  isUnlocked,
  refreshUnlocks,
  selectFrontier,
  selectReview,
  selectShaky,
  selectToday,
  STUCK_AFTER_QUESTS,
} from './frontier';
import { newSkillState } from './mastery';
import type { SkillState } from './state';
import { def, SKILLS } from './testing/skills';
import type { SkillDef, SkillStates } from './types';

const st = (id: string, over: Partial<SkillState> = {}): SkillState => ({
  ...newSkillState('c', id),
  ...over,
});
const of = (...rows: SkillState[]): SkillStates =>
  Object.fromEntries(rows.map((r) => [r.skillId, r]));
const needs = (id: string) => SKILLS.find((s) => s.id === id) as (typeof SKILLS)[number];

describe('unlocking', () => {
  it('a root skill is open from the start', () => {
    expect(isUnlocked(needs('a'), {})).toBe(true);
  });
  it('a prerequisite at 70 opens the next skill', () => {
    expect(isUnlocked(needs('b'), of(st('a', { mastery: 70 })))).toBe(true);
  });
  it('a prerequisite at 69.9 does not', () => {
    expect(isUnlocked(needs('b'), of(st('a', { mastery: 69.9 })))).toBe(false);
  });
  it('needs all prerequisites', () => {
    const skill = def('z', 9, ['a', 'b']);
    expect(isUnlocked(skill, of(st('a', { mastery: 90 })))).toBe(false);
  });
  it('a mastered prerequisite counts even after its score dips', () => {
    expect(isUnlocked(needs('b'), of(st('a', { mastery: 40, masteredAt: 1 })))).toBe(true);
  });
  it('a placed-out prerequisite counts even after its score dips', () => {
    expect(isUnlocked(needs('b'), of(st('a', { mastery: 40, placedOut: true })))).toBe(true);
  });
  it('once unlocked, a skill stays unlocked when its prerequisite falls', () => {
    const opened = refreshUnlocks(SKILLS, of(st('a', { mastery: 80 })), 'c', 5);
    expect(opened.b?.unlockedAt).toBe(5);
    const dipped = { ...opened, a: st('a', { mastery: 10 }) };
    expect(isUnlocked(needs('b'), dipped)).toBe(true);
  });
  it('refresh never moves an existing unlock date', () => {
    const once = refreshUnlocks(SKILLS, {}, 'c', 5);
    expect(refreshUnlocks(SKILLS, once, 'c', 9).a?.unlockedAt).toBe(5);
  });
  it('refresh only opens what is ready', () => {
    const out = refreshUnlocks(SKILLS, {}, 'c', 5);
    expect(out.a?.unlockedAt).toBe(5);
    expect(out.e?.unlockedAt).toBe(5);
    expect(out.b).toBeUndefined();
  });
});

describe('selectFrontier', () => {
  it('starts with the first root skill', () => {
    expect(selectFrontier(SKILLS, {})?.id).toBe('a');
  });
  it('skips mastered skills', () => {
    expect(selectFrontier(SKILLS, of(st('a', { mastery: 90, masteredAt: 1 })))?.id).toBe('b');
  });
  it('skips placed-out skills, so placement never sends a child backward', () => {
    expect(selectFrontier(SKILLS, of(st('a', { mastery: 70, placedOut: true })))?.id).toBe('b');
  });
  it('prefers the lowest grade over teaching order', () => {
    const skills = [{ ...def('x', 1), grade: 2 as const }, def('y', 2)];
    expect(selectFrontier(skills, {})?.id).toBe('y');
  });
  it('ties break by order', () => {
    expect(selectFrontier([def('y', 2), def('x', 1)], {})?.id).toBe('x');
  });
  it('rotates off a stuck skill', () => {
    const states = of(st('a', { mastery: 75, questsOnSkill: STUCK_AFTER_QUESTS }));
    expect(selectFrontier(SKILLS, states)?.id).toBe('b');
  });
  it('one quest short of stuck, it stays', () => {
    const states = of(st('a', { mastery: 60, questsOnSkill: STUCK_AFTER_QUESTS - 1 }));
    expect(selectFrontier(SKILLS, states)?.id).toBe('a');
  });
  it('if everything is stuck, picks the one with the fewest quests', () => {
    const states = of(st('a', { questsOnSkill: 9 }), st('e', { questsOnSkill: 6 }));
    expect(selectFrontier(SKILLS, states)?.id).toBe('e');
  });
  it('is empty when every skill is done', () => {
    const states = of(...SKILLS.map((s) => st(s.id, { mastery: 90, masteredAt: 1 })));
    expect(selectFrontier(SKILLS, states)).toBeUndefined();
  });
});

describe('selectShaky and selectReview', () => {
  it('finds the weakest practiced skill', () => {
    const states = of(st('a', { attempts: 5, mastery: 50 }), st('b', { attempts: 5, mastery: 30 }));
    expect(selectShaky(SKILLS, states)?.id).toBe('b');
  });
  it('ignores unpracticed skills, 0 mastery or not', () => {
    expect(selectShaky(SKILLS, of(st('a')))).toBeUndefined();
  });
  it('ignores solid skills and the excluded skill', () => {
    const states = of(st('a', { attempts: 5, mastery: 70 }), st('b', { attempts: 5, mastery: 30 }));
    expect(selectShaky(SKILLS, states, 'b')).toBeUndefined();
  });
  it('reviews the least recently practiced first', () => {
    const states = of(
      st('a', { masteredAt: 1, lastPracticedAt: 50 }),
      st('b', { placedOut: true, lastPracticedAt: 10 }),
    );
    expect(selectReview(SKILLS, states, 1).map((s) => s.id)).toEqual(['b']);
  });
  it('leaves out skills not yet earned', () => {
    expect(selectReview(SKILLS, of(st('a', { mastery: 75 })), 5)).toEqual([]);
  });
});

describe('selectToday', () => {
  const states = of(st('a', { attempts: 5, mastery: 40 }), st('b', { attempts: 5, mastery: 30 }));
  it('is new when the frontier has never been tried', () => {
    expect(selectToday(SKILLS, {}, 0)).toMatchObject({ mode: 'new', skill: { id: 'a' } });
  });
  it('continues a started skill on even quests', () => {
    expect(selectToday(SKILLS, states, 2)).toMatchObject({ mode: 'continue', skill: { id: 'a' } });
  });
  it('reviews a shaky skill on odd quests', () => {
    expect(selectToday(SKILLS, states, 3)).toMatchObject({ mode: 'review', skill: { id: 'b' } });
  });
  it('stays on the frontier on odd quests with nothing shaky', () => {
    expect(selectToday(SKILLS, {}, 1)).toMatchObject({ skill: { id: 'a' } });
  });
  it('falls back to review when all skills are done', () => {
    const done = of(...SKILLS.map((s) => st(s.id, { mastery: 90, masteredAt: 1 })));
    expect(selectToday(SKILLS, done, 0)?.mode).toBe('review');
  });
  it('is empty with no skills at all', () => {
    expect(selectToday([], {}, 0)).toBeUndefined();
  });
});

describe('mapStatus', () => {
  const def = (id: string, order: number, prerequisites: string[] = []): SkillDef =>
    ({ id, grade: 1, order, prerequisites }) as SkillDef;
  const skills = [def('a', 1), def('b', 2, ['a']), def('c', 3, ['b']), def('d', 4)];
  const state = (over = {}) => ({ ...newSkillState('c', 'x'), ...over });

  it('marks the next skill as current and the rest by what is open', () => {
    expect(skills.map((s) => mapStatus(s, skills, {}))).toEqual([
      'current',
      'locked',
      'locked',
      'open',
    ]);
  });
  it('keeps a badge on the map even if mastery later drops', () => {
    const states = { a: state({ masteredAt: 1, mastery: 10 }) };
    expect(mapStatus(skills[0] as SkillDef, skills, states)).toBe('mastered');
  });
  it('shows placed-out skills as passed, not mastered', () => {
    const states = { a: state({ placedOut: true, mastery: 70 }) };
    expect(mapStatus(skills[0] as SkillDef, skills, states)).toBe('passed');
    expect(mapStatus(skills[1] as SkillDef, skills, states)).toBe('current');
  });
});
