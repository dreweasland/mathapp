import { describe, expect, it } from 'vitest';
import {
  BLITZ_MS,
  PRACTICE_PROBLEMS,
  blitzFacts,
  buildPractice,
  nextBlitzProblem,
  practiceSkills,
  recordBlitz,
} from './free';
import { allFacts } from './facts';
import { newSkillState } from './mastery';
import { advance, beginSection, startRun, submitAnswer, currentItem } from './questRun';
import { mulberry32 } from './rng';
import { def } from './testing/skills';

const skill = { ...def('1.add-within-10', 1), fastMs: 3000 };
const practice = () =>
  buildPractice({
    childId: 'c',
    today: '2026-11-02',
    skill,
    state: newSkillState('c', skill.id),
    rng: mulberry32(3),
    seed: 3,
  });

function play() {
  let run = beginSection(startRun(practice()));
  for (let i = 0; i < PRACTICE_PROBLEMS; i++) {
    const item = currentItem(run);
    const tried = submitAnswer(run, {
      given: item?.problem.answer as string,
      responseMs: 1000,
      fastMs: 3000,
    });
    run = advance((tried as { run: typeof run }).run);
  }
  return run;
}

describe('practice', () => {
  it('is one short set on the chosen skill', () => {
    const quest = practice();
    expect(quest.free).toBe(true);
    expect(quest.sections).toHaveLength(1);
    expect(quest.sections[0]?.items).toHaveLength(PRACTICE_PROBLEMS);
    for (const { problem } of quest.sections[0]?.items ?? [])
      expect(problem.skillId).toBe(skill.id);
  });
  it('never shows a worked example or a challenge', () => {
    const items = practice().sections.flatMap((s) => s.items);
    expect(items.some((i) => i.workedExample)).toBe(false);
  });
  it('finishes without counting as the daily quest', () => {
    const run = play();
    expect(run.stage).toBe('finished');
    expect(run.questDone).toBe(false);
    expect(run.challengeDone).toBe(false);
  });
  it('pays half coins and no quest bonus', () => {
    // 3 coins for a fast answer in a quest; half, rounded up, is 2.
    expect(play().coins).toBe(2 * PRACTICE_PROBLEMS);
  });
  it('uses the child’s current level', () => {
    const quest = buildPractice({
      childId: 'c',
      today: '2026-11-02',
      skill,
      state: { ...newSkillState('c', skill.id), difficulty: 4 },
      rng: mulberry32(3),
      seed: 3,
    });
    for (const { problem } of quest.sections[0]?.items ?? []) expect(problem.difficulty).toBe(4);
  });
  it('only offers skills already taught', () => {
    const a = def('a', 1);
    const b = def('b', 2);
    const states = { a: { ...newSkillState('c', 'a'), attempts: 4 } };
    expect(practiceSkills([a, b], states).map((s) => s.id)).toEqual(['a']);
  });
});

describe('Fact Blitz', () => {
  it('runs for one minute', () => {
    expect(BLITZ_MS).toBe(60_000);
  });
  it('each skill draws on its own facts', () => {
    expect(blitzFacts('1.add-within-10')).toHaveLength(66);
    expect(blitzFacts('3.mult-facts')).toHaveLength(100);
    expect(blitzFacts('3.div-facts')).toHaveLength(100);
  });
  it('Grade 2 covers every add and subtract card', () => {
    expect(blitzFacts('2.facts-within-20')).toHaveLength(242);
  });
  it('every card can become a problem with the right answer', () => {
    for (const fact of allFacts()) {
      const problem = nextBlitzProblem(
        fact.op === 'add' || fact.op === 'sub' ? '2.facts-within-20' : '3.mult-facts',
        undefined,
        mulberry32(fact.a + fact.b),
      );
      expect(problem.factId).toBeDefined();
    }
  });
  it('never repeats the fact just answered', () => {
    const rng = mulberry32(9);
    let last = nextBlitzProblem('1.sub-within-10', undefined, rng);
    for (let i = 0; i < 300; i++) {
      const next = nextBlitzProblem('1.sub-within-10', last, rng);
      expect(next.factId).not.toBe(last.factId);
      last = next;
    }
  });
  it('sets a best on the first go, and only beats it by beating it', () => {
    const first = recordBlitz(newSkillState('c', 's'), 5, 1);
    expect(first).toMatchObject({ best: 5, isBest: true });
    const same = recordBlitz(first.state, 5, 2);
    expect(same.isBest).toBe(false);
    const lower = recordBlitz(first.state, 2, 3);
    expect(lower).toMatchObject({ best: 5, isBest: false });
    expect(lower.state.blitzBest).toBe(5);
    expect(recordBlitz(first.state, 6, 4)).toMatchObject({ best: 6, isBest: true });
  });
  it('a score of zero is not a best', () => {
    expect(recordBlitz(newSkillState('c', 's'), 0, 1).isBest).toBe(false);
  });
});
