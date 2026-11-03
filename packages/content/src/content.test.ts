import { describe, expect, it } from 'vitest';
import {
  DAY_SCENES,
  FOUR_OP_STORIES,
  GENERATORS,
  TWO_STEP_STORIES,
  activeGrade,
  applyPlacement,
  buildDailyQuest,
  generatorFor,
  mulberry32,
  newSkillState,
  parseFactId,
  selectFrontier,
  selectWarmupFacts,
  startAtGrade,
  unlockedFacts,
  type Difficulty,
} from '@mathapp/engine';
import { COLLECTIBLE_SETS, COSMETICS, FIRST_ACCESSORY, artFor, cosmeticFor } from './collectibles';
import { GRADE_1_SKILLS } from './grade1';
import { GRADE_2_SKILLS } from './grade2';
import { GRADE_3_SKILLS } from './grade3';
import { ALL_SKILLS, skillById, skillsInGrade } from './skills';
import { STRINGS, SCENE_COUNT, render } from './strings.en';

const byId = new Map(ALL_SKILLS.map((s) => [s.id, s]));

describe('skill graph', () => {
  it('has the 14, 12 and 12 skills from the brief', () => {
    expect(GRADE_1_SKILLS).toHaveLength(14);
    expect(GRADE_2_SKILLS).toHaveLength(12);
    expect(GRADE_3_SKILLS).toHaveLength(12);
  });
  it('each grade holds only its own skills', () => {
    for (const grade of [1, 2, 3] as const) {
      for (const s of skillsInGrade(grade)) expect(s.id.startsWith(`${grade}.`)).toBe(true);
    }
  });
  it('a skill can only depend on its own grade or earlier', () => {
    for (const s of ALL_SKILLS) {
      for (const p of s.prerequisites) expect(byId.get(p)?.grade).toBeLessThanOrEqual(s.grade);
    }
  });
  it('fact skills hold the 3-second bar', () => {
    for (const s of ALL_SKILLS.filter((x) => x.grade > 1 && x.factBased)) {
      expect(s.fastMs).toBe(3000);
    }
  });
  it('every skill has a generator and every generator has a skill', () => {
    expect(new Set(ALL_SKILLS.map((s) => s.id))).toEqual(new Set(Object.keys(GENERATORS)));
  });
  it('ids and orders are unique', () => {
    expect(byId.size).toBe(38);
    expect(new Set(ALL_SKILLS.map((s) => s.order)).size).toBe(38);
  });
  it('every prerequisite exists', () => {
    for (const s of ALL_SKILLS) {
      for (const p of s.prerequisites) expect(byId.has(p), `${s.id} needs ${p}`).toBe(true);
    }
  });
  it('has no cycles, because prerequisites always come earlier in teaching order', () => {
    for (const s of ALL_SKILLS) {
      for (const p of s.prerequisites) {
        expect(byId.get(p)?.order, `${s.id} needs ${p}`).toBeLessThan(s.order);
      }
    }
  });
  it('every skill has at least 2 question types', () => {
    for (const s of ALL_SKILLS) expect(s.questionTypes.length).toBeGreaterThanOrEqual(2);
  });
  it('generators only use the question types the skill lists', () => {
    for (const s of ALL_SKILLS) {
      for (let seed = 0; seed < 300; seed++) {
        const d = ((seed % 5) + 1) as Difficulty;
        expect(s.questionTypes).toContain(generatorFor(s.id)(mulberry32(seed), d).questionType);
      }
    }
  });
  it('all use the brief mastery rule', () => {
    for (const s of ALL_SKILLS) expect(s.mastery).toEqual({ threshold: 80, minAttempts: 15 });
  });
  it('the 3-second fluency bar applies to within-10 facts', () => {
    expect(byId.get('1.add-within-10')?.fastMs).toBe(3000);
    expect(byId.get('1.sub-within-10')?.fastMs).toBe(3000);
  });
  it('word problems allow time to hear the story', () => {
    expect(byId.get('1.word-problems')?.fastMs).toBeGreaterThanOrEqual(15000);
  });
  it('every standard looks like a CCSS code for its grade', () => {
    for (const s of ALL_SKILLS) {
      expect(s.standard.startsWith(`${s.grade}.`), s.id).toBe(true);
      expect(s.standard).toMatch(/^\d\.[A-Z]+\.[A-Z]\.\d+/);
    }
  });
});

describe('speech strings', () => {
  it('every skill name has a string', () => {
    for (const s of ALL_SKILLS) expect(STRINGS[s.speechKey], s.id).toBeDefined();
  });
  it('every word scene has a string', () => {
    expect(Object.keys(STRINGS).filter((k) => k.startsWith('q.word.'))).toHaveLength(SCENE_COUNT);
    for (const { story } of TWO_STEP_STORIES) expect(STRINGS[`q.word2.${story}`]).toBeDefined();
    for (const { story } of FOUR_OP_STORIES) expect(STRINGS[`q.word4.${story}`]).toBeDefined();
    for (const { scene } of DAY_SCENES) expect(STRINGS[`q.ampm.${scene}`]).toBeDefined();
  });
  it('every problem any generator produces can be spoken in full', () => {
    for (const s of ALL_SKILLS) {
      for (let seed = 0; seed < 1500; seed++) {
        const d = ((seed % 5) + 1) as Difficulty;
        const { speech } = generatorFor(s.id)(mulberry32(seed), d);
        const text = render(speech.key, speech.params);
        expect(text).not.toMatch(/[{}]|undefined|NaN/);
      }
    }
  });
  it('render fails loudly on a missing key or param', () => {
    expect(() => render('nope')).toThrow();
    expect(() => render('q.add', { a: 1 })).toThrow();
  });

  const BANNED =
    /\b(smart|genius|brilliant|gifted|lose|lost|losing|expire|hurry|wrong|fail|failed|too bad|dumb|last chance|don't miss)\b/i;
  it('contains no intelligence praise, loss framing, or pressure', () => {
    for (const [key, text] of Object.entries(STRINGS)) expect(text, key).not.toMatch(BANNED);
  });
  it('the reset message is warm and forward-looking', () => {
    expect(render('streak.new', { best: 12 })).toBe('New streak starts today! Your best was 12.');
  });
});

describe('collectibles and cosmetics', () => {
  const allItems = COLLECTIBLE_SETS.flatMap((s) => s.items);
  it('each set has about 12 items, as the brief asks', () => {
    for (const set of COLLECTIBLE_SETS) expect(set.items).toHaveLength(12);
  });
  it('no item is in two sets', () => {
    expect(new Set(allItems).size).toBe(allItems.length);
  });
  it('everything a child can own has a picture and a spoken name', () => {
    for (const id of [...allItems, ...COSMETICS.map((c) => c.id)]) {
      expect(artFor(id)?.emoji, id).toBeTruthy();
      expect(STRINGS[`item.${id}`], id).toBeTruthy();
    }
  });
  it('finishing a set unlocks a scene the bear can use', () => {
    for (const set of COLLECTIBLE_SETS) {
      expect(cosmeticFor(set.decoration)?.slot).toBe('background');
    }
  });
  it('scenes are earned and everything else costs coins', () => {
    for (const c of COSMETICS) {
      if (c.id.startsWith('scene.')) expect(c.price).toBe(0);
      else expect(c.price).toBeGreaterThan(0);
    }
  });
  it('the day 2 present is a real accessory', () => {
    expect(cosmeticFor(FIRST_ACCESSORY)?.slot).toBe('accessory');
  });
  it('every badge has a spoken name', () => {
    for (const s of ALL_SKILLS) expect(STRINGS[`badge.${s.id}`]).toBe(s.badgeName);
  });
});

describe('a quest on every skill', () => {
  const at = 1;
  it.each(ALL_SKILLS.map((s) => s.id))('%s builds, with no repeats and only real answers', (id) => {
    const order = skillById(id)?.order ?? 0;
    const earlier = ALL_SKILLS.filter((s) => s.order < order).map((s) => s.id);
    const states = applyPlacement(earlier, ALL_SKILLS, {}, 'c', at);
    const quest = buildDailyQuest({
      childId: 'c',
      today: '2026-11-02',
      questsCompleted: 10,
      skills: ALL_SKILLS,
      states,
      factCards: [],
    });
    expect(quest.todaySkillId).toBe(id);
    const items = quest.sections.flatMap((s) => s.items);
    expect(items.length).toBeGreaterThan(5);
    const skillItems = quest.sections.find((s) => s.kind === 'skill')?.items ?? [];
    const seen = skillItems.map((i) => JSON.stringify(i.problem.operands));
    expect(new Set(seen).size).toBeGreaterThanOrEqual(Math.min(seen.length, 4));
    for (const { problem } of items) {
      expect(problem.answer).not.toMatch(/undefined|NaN/);
      const text = render(problem.speech.key, problem.speech.params);
      expect(text).not.toMatch(/[{}]/);
    }
  });
});

describe('moving between grades', () => {
  it('stays in Grade 1 until it is finished', () => {
    expect(activeGrade(ALL_SKILLS, {})).toBe(1);
  });
  it('a child placed at Grade 2 works in Grade 2', () => {
    const states = startAtGrade(2, ALL_SKILLS, {}, 'c', 1);
    expect(activeGrade(ALL_SKILLS, states)).toBe(2);
    expect(selectFrontier(ALL_SKILLS, states)?.grade).toBe(2);
  });
  it('a child placed at Grade 3 can reach Grade 3 skills with no Grade 2 gaps', () => {
    const states = startAtGrade(3, ALL_SKILLS, {}, 'c', 1);
    expect(activeGrade(ALL_SKILLS, states)).toBe(3);
  });
  it('earned things stay when moving up', () => {
    const before = startAtGrade(1, ALL_SKILLS, {}, 'c', 1);
    const earned = {
      ...before,
      '1.counting': { ...newSkillState('c', '1.counting'), mastery: 95, masteredAt: 5 },
    };
    const after = startAtGrade(2, ALL_SKILLS, earned, 'c', 9);
    expect(after['1.counting']?.masteredAt).toBe(5);
    expect(after['1.counting']?.mastery).toBe(95);
  });
  it('finishing everything leaves the top grade showing', () => {
    const states = Object.fromEntries(
      ALL_SKILLS.map((s) => [s.id, { ...newSkillState('c', s.id), mastery: 95, masteredAt: 1 }]),
    );
    expect(activeGrade(ALL_SKILLS, states)).toBe(3);
  });
  it('Grade 3 fact cards are reached through the warm-up once taught', () => {
    const facts = unlockedFacts(['3.mult-facts']);
    expect(facts).toHaveLength(100);
    expect(facts.every((f) => f.op === 'mul')).toBe(true);
  });
  it('multiplication cards come in the brief order', () => {
    const facts = unlockedFacts(['3.mult-facts']);
    const picked = selectWarmupFacts([], facts, '2026-11-02', 3, mulberry32(1));
    for (const id of picked) {
      const { a, b } = parseFactId(id);
      expect([a, b].some((n) => n === 1 || n === 2)).toBe(true);
    }
  });
});
