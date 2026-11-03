import { describe, expect, it } from 'vitest';
import { newFactCard, reviewCard, selectWarmupFacts, unlockedFacts } from './factDeck';
import { GENERATORS } from './generators';
import { newSkillState } from './mastery';
import { buildDailyQuest, factProblem, recordQuestOnSkill, type QuestInput } from './quest';
import { mulberry32 } from './rng';
import type { SkillState } from './state';
import { solve } from './testing/solver';
import type { Problem, SkillDef, SkillStates } from './types';

const skill = (
  id: string,
  order: number,
  prerequisites: string[] = [],
  over: Partial<SkillDef> = {},
): SkillDef => ({
  id,
  grade: 1,
  standard: 'x',
  name: id,
  kidName: id,
  speechKey: id,
  badgeName: id,
  prerequisites,
  questionTypes: ['number-pad', 'multiple-choice'],
  fastMs: 6000,
  factBased: false,
  mastery: { threshold: 80, minAttempts: 15 },
  order,
  ...over,
});

const SKILLS: SkillDef[] = [
  skill('1.counting', 1),
  skill('1.ten-frame', 2, ['1.counting']),
  skill('1.add-within-10', 3, ['1.ten-frame'], { factBased: true, fastMs: 3000 }),
  skill('1.sub-within-10', 4, ['1.add-within-10'], { factBased: true, fastMs: 3000 }),
  skill('1.word-problems', 5, ['1.add-within-10'], { fastMs: 20000 }),
  skill('1.shapes', 6),
];
const st = (id: string, over: Partial<SkillState> = {}): SkillState => ({
  ...newSkillState('kid', id),
  ...over,
});
const of = (...rows: SkillState[]): SkillStates =>
  Object.fromEntries(rows.map((r) => [r.skillId, r]));
const input = (over: Partial<QuestInput> = {}): QuestInput => ({
  childId: 'kid',
  today: '2026-11-05',
  questsCompleted: 10,
  skills: SKILLS,
  states: {},
  factCards: [],
  ...over,
});
const placed = of(
  st('1.counting', { placedOut: true, mastery: 70 }),
  st('1.ten-frame', { placedOut: true, mastery: 70 }),
);
const section = (q: ReturnType<typeof buildDailyQuest>, i: number) => q.sections[i]?.items ?? [];

describe('quest structure', () => {
  it('has warm-up, skill and challenge in order', () => {
    expect(buildDailyQuest(input()).sections.map((s) => s.kind)).toEqual([
      'warmup',
      'skill',
      'challenge',
    ]);
  });
  it('only the challenge is optional', () => {
    expect(buildDailyQuest(input()).sections.map((s) => s.optional)).toEqual([false, false, true]);
  });
  it('the same child and day give the identical quest', () => {
    expect(buildDailyQuest(input())).toEqual(buildDailyQuest(input()));
  });
  it('a different day gives a different quest', () => {
    const a = buildDailyQuest(input());
    const b = buildDailyQuest(input({ today: '2026-11-06' }));
    expect(a.seed).not.toBe(b.seed);
  });
  it('a different child on the same day gets their own quest', () => {
    expect(buildDailyQuest(input()).seed).not.toBe(buildDailyQuest(input({ childId: 'sib' })).seed);
  });
  it.each(Array.from({ length: 40 }, (_, i) => i))('seed %i: sizes match the brief', (seed) => {
    const q = buildDailyQuest(input({ seed, states: placed }));
    expect(section(q, 0).length).toBeGreaterThanOrEqual(6);
    expect(section(q, 0).length).toBeLessThanOrEqual(8);
    expect(section(q, 1).length).toBeGreaterThanOrEqual(12);
    expect(section(q, 1).length).toBeLessThanOrEqual(16);
    expect(section(q, 2).length).toBeGreaterThanOrEqual(3);
    expect(section(q, 2).length).toBeLessThanOrEqual(5);
    expect(q.problemCount).toBeGreaterThanOrEqual(21);
    expect(q.problemCount).toBeLessThanOrEqual(29);
  });
  it('every problem in a quest has a correct answer key', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const s of buildDailyQuest(input({ seed, states: placed })).sections) {
        for (const { problem } of s.items) {
          if (problem.operands.kind === 'family' && problem.operands.ask === 'belongs') continue;
          expect(problem.answer).toBe(solve(problem));
        }
      }
    }
  });
  it('no problem repeats within a section', () => {
    const q = buildDailyQuest(input({ states: placed, seed: 3 }));
    const warmup = section(q, 0).map((i) => JSON.stringify(i.problem.operands));
    expect(new Set(warmup).size).toBe(warmup.length);
  });
  it('fails clearly with no skills at all', () => {
    expect(() => buildDailyQuest(input({ skills: [] }))).toThrow();
  });
});

describe('time budget', () => {
  it('keeps slow story problems near the 5–8 minute target', () => {
    const states = of(
      st('1.counting', { masteredAt: 1, mastery: 90 }),
      st('1.ten-frame', { masteredAt: 1, mastery: 90 }),
      st('1.add-within-10', { masteredAt: 1, mastery: 90 }),
      st('1.sub-within-10', { masteredAt: 1, mastery: 90 }),
    );
    const q = buildDailyQuest(input({ states }));
    expect(q.todaySkillId).toBe('1.word-problems');
    expect(section(q, 1).length).toBeLessThan(12);
    expect(q.estimatedMinutes).toBeLessThanOrEqual(8);
  });
  it('an ordinary quest fits 5–8 minutes by estimate', () => {
    for (let seed = 0; seed < 30; seed++) {
      const q = buildDailyQuest(input({ seed, states: placed }));
      expect(q.estimatedMinutes).toBeGreaterThanOrEqual(4);
      expect(q.estimatedMinutes).toBeLessThanOrEqual(8);
    }
  });
});

describe('warm-up', () => {
  it('uses due cards first', () => {
    const started = of(
      ...Object.values(placed).flatMap((s) => (s ? [s] : [])),
      st('1.add-within-10', { attempts: 5, mastery: 30 }),
    );
    const card = reviewCard(newFactCard('kid', 'add:3+4', '2026-11-01'), {
      correct: false,
      responseMs: 900,
      today: '2026-11-05',
      at: 1,
    });
    const q = buildDailyQuest(input({ states: started, factCards: [card] }));
    expect(section(q, 0)[0]?.problem.factId).toBe('add:3+4');
  });
  it('fills with new cards once a fact skill has been started', () => {
    const states = of(
      ...Object.values(placed).flatMap((s) => (s ? [s] : [])),
      st('1.add-within-10', { attempts: 5, mastery: 30 }),
    );
    const q = buildDailyQuest(input({ states, questsCompleted: 0 }));
    expect(section(q, 0).every((i) => i.problem.factId)).toBe(true);
  });
  it('never drills facts of a skill that is open but not yet taught', () => {
    const q = buildDailyQuest(input({ states: placed, questsCompleted: 0 }));
    expect(q.mode).toBe('new');
    expect(q.todaySkillId).toBe('1.add-within-10');
    for (const i of section(q, 0)) {
      expect(i.problem.factId).toBeUndefined();
      expect(i.problem.skillId).not.toBe('1.add-within-10');
    }
  });
  it('placed-out fact skills count as taught', () => {
    const states = of(
      ...Object.values(placed).flatMap((s) => (s ? [s] : [])),
      st('1.add-within-10', { placedOut: true, mastery: 70 }),
    );
    const q = buildDailyQuest(input({ states }));
    expect(section(q, 0).every((i) => i.problem.factId)).toBe(true);
  });
  it('before fact skills, falls back to easy problems from open skills', () => {
    const q = buildDailyQuest(input());
    expect(section(q, 0).length).toBeGreaterThanOrEqual(6);
    for (const i of section(q, 0)) {
      expect(i.problem.factId).toBeUndefined();
      expect(i.problem.difficulty).toBe(1);
    }
  });
  it('fallback never uses slow story problems', () => {
    const states = of(
      st('1.counting', { placedOut: true }),
      st('1.ten-frame', { placedOut: true }),
      st('1.add-within-10', { mastery: 90 }),
    );
    const onlyStories = SKILLS.map((s) => ({ ...s, factBased: false }));
    const q = buildDailyQuest(input({ states, skills: onlyStories }));
    for (const i of section(q, 0)) expect(i.problem.skillId).not.toBe('1.word-problems');
  });
  it('factProblem gives a correct problem for any fact', () => {
    for (const f of unlockedFacts(['1.add-within-20', '1.sub-within-20'])) {
      const p = factProblem(f.id, mulberry32(1));
      expect(p.factId).toBe(f.id);
      expect(p.answer).toBe(solve(p));
      expect(p.skillId).toMatch(/within-20/);
    }
  });
  it('a warm-up pick matches the deck selection', () => {
    const facts = unlockedFacts(['1.add-within-10']);
    expect(selectWarmupFacts([], facts, '2026-11-05', 6, mulberry32(1))).toHaveLength(6);
  });
});

describe("today's skill", () => {
  it('a new skill opens with a worked example, and only the first item', () => {
    const q = buildDailyQuest(input());
    expect(q.mode).toBe('new');
    expect(section(q, 1).filter((i) => i.workedExample)).toHaveLength(1);
    expect(section(q, 1)[0]?.workedExample).toBe(true);
  });
  it('a skill in progress has no worked example', () => {
    const q = buildDailyQuest(
      input({ states: of(st('1.counting', { attempts: 10, mastery: 40 })), questsCompleted: 10 }),
    );
    expect(q.mode).toBe('continue');
    expect(section(q, 1).some((i) => i.workedExample)).toBe(false);
  });
  it('uses the child’s current difficulty', () => {
    const q = buildDailyQuest(
      input({ states: of(st('1.counting', { attempts: 3, difficulty: 3 })) }),
    );
    expect(section(q, 1)[0]?.problem.difficulty).toBe(3);
  });
  it('alternate quests review a shaky skill', () => {
    const states = of(
      st('1.counting', { placedOut: true, mastery: 70 }),
      st('1.ten-frame', { attempts: 10, mastery: 75 }),
      st('1.shapes', { attempts: 10, mastery: 40 }),
    );
    expect(buildDailyQuest(input({ states, questsCompleted: 11 }))).toMatchObject({
      mode: 'review',
      todaySkillId: '1.shapes',
    });
  });
  it('adds light review of earned skills at the end', () => {
    const q = buildDailyQuest(input({ states: placed }));
    const items = section(q, 1);
    expect(items.filter((i) => i.review)).toHaveLength(2);
    expect(items.at(-1)?.review).toBe(true);
    expect(items[0]?.review).toBeUndefined();
  });
  it('a child with everything earned still gets a quest', () => {
    const states = of(...SKILLS.map((s) => st(s.id, { masteredAt: 1, mastery: 90 })));
    expect(buildDailyQuest(input({ states })).mode).toBe('review');
  });
});

describe('challenge', () => {
  it('is one difficulty step up', () => {
    const q = buildDailyQuest(
      input({ states: of(st('1.counting', { attempts: 3, difficulty: 2 })) }),
    );
    expect(q.challengeKind).toBe('step-up');
    for (const i of section(q, 2)) expect(i.problem.difficulty).toBe(3);
  });
  it('at the top level it becomes a mixed boss round', () => {
    const states = of(
      st('1.counting', { attempts: 9, difficulty: 5, mastery: 75 }),
      st('1.ten-frame', { placedOut: true, mastery: 70 }),
    );
    const q = buildDailyQuest(input({ states, questsCompleted: 10 }));
    expect(q.challengeKind).toBe('boss');
    expect(section(q, 2).length).toBeGreaterThanOrEqual(3);
  });
});

describe('first-week ramp', () => {
  const day = (questsCompleted: number) =>
    buildDailyQuest(input({ questsCompleted, states: placed }));
  it.each([0, 1, 2])('quest %i is shorter', (n) => {
    expect(day(n).ramp).toBe(true);
    expect(day(n).problemCount).toBeLessThan(21);
    expect(day(n).problemCount).toBeGreaterThanOrEqual(15);
  });
  it('day 4 is a normal quest', () => {
    expect(day(3)).toMatchObject({ ramp: false, endOnWin: false, dayNumber: 4 });
  });
  it.each([0, 1, 2])(
    'quest %i ends on an easy win, whether or not the challenge is played',
    (n) => {
      const q = day(n);
      expect(q.endOnWin).toBe(true);
      for (const items of [section(q, 1), section(q, 2)]) {
        expect(items.at(-1)?.finalWin).toBe(true);
        expect(items.at(-1)?.problem.difficulty).toBe(1);
      }
    },
  );
  it('the worked example survives the ramp', () => {
    const q = buildDailyQuest(input({ questsCompleted: 0 }));
    expect(section(q, 1)[0]?.workedExample).toBe(true);
  });
  it('ramp days have no review of older skills', () => {
    expect(section(day(0), 1).some((i) => i.review)).toBe(false);
  });
});

describe('recordQuestOnSkill', () => {
  it('counts a frontier quest', () => {
    expect(recordQuestOnSkill(st('a'), 'continue', 1).questsOnSkill).toBe(1);
  });
  it('a review quest does not count', () => {
    const s = st('a', { questsOnSkill: 2 });
    expect(recordQuestOnSkill(s, 'review', 1)).toBe(s);
  });
  it('mastering clears the count', () => {
    expect(
      recordQuestOnSkill(st('a', { questsOnSkill: 4, masteredAt: 1 }), 'continue', 1).questsOnSkill,
    ).toBe(0);
  });
});

it('the test skill list only uses real generators', () => {
  for (const s of SKILLS) expect(GENERATORS[s.id]).toBeDefined();
});

describe('retakes in the quest', () => {
  const missed: Problem = {
    skillId: 'a',
    questionType: 'number-pad',
    difficulty: 1,
    operands: { kind: 'arith', op: 'add', a: 40, b: 2 },
    answer: '42',
    speech: { key: 'q.add' },
    hint: { visual: 'counters' },
  };
  const skills = [skill('1.counting', 1), skill('1.shapes', 2)];
  const states = (retakes: Problem[]): SkillStates => ({
    '1.counting': { ...newSkillState('c', '1.counting'), attempts: 3, retakes },
  });
  const build = (retakes: Problem[], questsCompleted = 5) =>
    buildDailyQuest({
      childId: 'c',
      today: '2026-11-02',
      questsCompleted,
      skills,
      states: states(retakes),
      factCards: [],
    });
  const inToday = (q: ReturnType<typeof build>) => q.sections[1]?.items ?? [];

  it('a missed problem comes back in the next quest, marked as review', () => {
    const items = inToday(build([missed]));
    const found = items.filter((i) => i.problem.answer === '42' && i.review);
    expect(found).toHaveLength(1);
  });
  it('does not make the quest longer', () => {
    expect(inToday(build([missed])).length).toBe(inToday(build([])).length);
  });
  it('brings back at most two a day', () => {
    const many = [40, 41, 42].map((a) => ({
      ...missed,
      answer: `x${a}`,
      operands: { kind: 'arith' as const, op: 'add' as const, a, b: 2 },
    }));
    expect(inToday(build(many)).filter((i) => i.problem.answer.startsWith('x'))).toHaveLength(2);
  });
  it('stays behind a worked example and ahead of a first-week final win', () => {
    const items = inToday(build([missed], 0));
    expect(items[0]?.problem.answer).not.toBe('42');
    expect(items.at(-1)?.finalWin).toBe(true);
    expect(items.some((i) => i.problem.answer === '42')).toBe(true);
  });
});
