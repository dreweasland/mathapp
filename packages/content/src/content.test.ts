import { describe, expect, it } from 'vitest';
import { GENERATORS, generatorFor, mulberry32, type Difficulty } from '@mathapp/engine';
import { COLLECTIBLE_SETS, COSMETICS, FIRST_ACCESSORY, artFor, cosmeticFor } from './collectibles';
import { GRADE_1_SKILLS } from './grade1';
import { STRINGS, SCENE_COUNT, render } from './strings.en';

const byId = new Map(GRADE_1_SKILLS.map((s) => [s.id, s]));

describe('Grade 1 skill graph', () => {
  it('has the 14 skills from the brief', () => {
    expect(GRADE_1_SKILLS).toHaveLength(14);
  });
  it('every skill has a generator and every generator has a skill', () => {
    expect(new Set(GRADE_1_SKILLS.map((s) => s.id))).toEqual(new Set(Object.keys(GENERATORS)));
  });
  it('ids and orders are unique', () => {
    expect(byId.size).toBe(14);
    expect(new Set(GRADE_1_SKILLS.map((s) => s.order)).size).toBe(14);
  });
  it('every prerequisite exists', () => {
    for (const s of GRADE_1_SKILLS) {
      for (const p of s.prerequisites) expect(byId.has(p), `${s.id} needs ${p}`).toBe(true);
    }
  });
  it('has no cycles, because prerequisites always come earlier in teaching order', () => {
    for (const s of GRADE_1_SKILLS) {
      for (const p of s.prerequisites) {
        expect(byId.get(p)?.order, `${s.id} needs ${p}`).toBeLessThan(s.order);
      }
    }
  });
  it('every skill has at least 2 question types', () => {
    for (const s of GRADE_1_SKILLS) expect(s.questionTypes.length).toBeGreaterThanOrEqual(2);
  });
  it('generators only use the question types the skill lists', () => {
    for (const s of GRADE_1_SKILLS) {
      for (let seed = 0; seed < 300; seed++) {
        const d = ((seed % 5) + 1) as Difficulty;
        expect(s.questionTypes).toContain(generatorFor(s.id)(mulberry32(seed), d).questionType);
      }
    }
  });
  it('all use the brief mastery rule', () => {
    for (const s of GRADE_1_SKILLS) expect(s.mastery).toEqual({ threshold: 80, minAttempts: 15 });
  });
  it('the 3-second fluency bar applies to within-10 facts', () => {
    expect(byId.get('1.add-within-10')?.fastMs).toBe(3000);
    expect(byId.get('1.sub-within-10')?.fastMs).toBe(3000);
  });
  it('word problems allow time to hear the story', () => {
    expect(byId.get('1.word-problems')?.fastMs).toBeGreaterThanOrEqual(15000);
  });
  it('every standard looks like a Grade 1 CCSS code', () => {
    for (const s of GRADE_1_SKILLS) expect(s.standard).toMatch(/^1\.[A-Z]+\.[A-Z]\.\d+/);
  });
});

describe('speech strings', () => {
  it('every skill name has a string', () => {
    for (const s of GRADE_1_SKILLS) expect(STRINGS[s.speechKey], s.id).toBeDefined();
  });
  it('every word scene has a string', () => {
    expect(Object.keys(STRINGS).filter((k) => k.startsWith('q.word.'))).toHaveLength(SCENE_COUNT);
  });
  it('every problem any generator produces can be spoken in full', () => {
    for (const s of GRADE_1_SKILLS) {
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
    for (const s of GRADE_1_SKILLS) expect(STRINGS[`badge.${s.id}`]).toBe(s.badgeName);
  });
});
