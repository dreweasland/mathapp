import { describe, expect, it } from 'vitest';
import { newFactCard } from './factDeck';
import { newSkillState } from './mastery';
import type { DailyQuest, QuestItem, QuestSection } from './quest';
import {
  acceptChallenge,
  advance,
  beginSection,
  completeDailyQuest,
  currentItem,
  finishWorkedExample,
  isCorrect,
  resumeRun,
  settleItem,
  skipChallenge,
  startRun,
  submitAnswer,
  summarizeRun,
  type QuestRun,
} from './questRun';
import type { ChildProfile } from './state';
import { newStreak } from './streak';
import type { Problem, SkillDef } from './types';
import { COINS, newWallet } from './wallet';

const problem = (answer = '7', over: Partial<Problem> = {}): Problem => ({
  skillId: 's',
  questionType: 'number-pad',
  difficulty: 1,
  operands: { kind: 'arith', op: 'add', a: 3, b: 4 },
  answer,
  speech: { key: 'q.add', params: { a: 3, b: 4 } },
  hint: { visual: 'counters' },
  ...over,
});
const items = (n: number, over: Partial<QuestItem> = {}): QuestItem[] =>
  Array.from({ length: n }, () => ({ problem: problem(), ...over }));

function quest(
  sections: Partial<Record<QuestSection['kind'], QuestItem[]>>,
  over = {},
): DailyQuest {
  return {
    childId: 'c',
    date: '2026-11-02',
    seed: 1,
    dayNumber: 5,
    ramp: false,
    endOnWin: false,
    todaySkillId: 's',
    mode: 'continue',
    challengeKind: 'step-up',
    sections: [
      { kind: 'warmup', optional: false, items: sections.warmup ?? items(1) },
      { kind: 'skill', optional: false, items: sections.skill ?? items(1) },
      { kind: 'challenge', optional: true, items: sections.challenge ?? items(1) },
    ],
    problemCount: 3,
    estimatedMinutes: 5,
    ...over,
  };
}

const FAST = { responseMs: 1000, fastMs: 3000 };
const right = (run: QuestRun) => {
  const done = submitAnswer(run, { given: '7', ...FAST });
  if (!done) throw new Error('not answering');
  return done;
};
const wrong = (run: QuestRun, given = '9') => {
  const done = submitAnswer(run, { given, ...FAST });
  if (!done) throw new Error('not answering');
  return done;
};
const started = (q: DailyQuest) => beginSection(startRun(q));

describe('isCorrect', () => {
  it('ignores leading zeros on numbers', () => {
    expect(isCorrect(problem('7'), '07')).toBe(true);
    expect(isCorrect(problem('0'), '00')).toBe(true);
  });
  it('compares non-numbers exactly', () => {
    expect(isCorrect(problem('left'), 'left')).toBe(true);
    expect(isCorrect(problem('3:30'), '3:00')).toBe(false);
  });
});

describe('moving through a quest', () => {
  it('opens on the warm-up intro', () => {
    const run = startRun(quest({}));
    expect(run.stage).toBe('section-intro');
    expect(beginSection(run).stage).toBe('answering');
  });

  it('goes warm-up, skill, challenge offer, challenge, finished', () => {
    let run = started(quest({}));
    run = advance(right(run).run);
    expect([run.section, run.stage]).toEqual([1, 'section-intro']);
    run = advance(right(beginSection(run)).run);
    expect(run.stage).toBe('offer-challenge');
    expect(run.questDone).toBe(true);
    run = acceptChallenge(run);
    expect([run.section, run.stage]).toEqual([2, 'section-intro']);
    run = advance(right(beginSection(run)).run);
    expect(run.stage).toBe('finished');
    expect(run.challengeDone).toBe(true);
  });

  it('skipping the challenge finishes with no penalty', () => {
    let run = started(quest({}));
    run = advance(right(run).run);
    run = advance(right(beginSection(run)).run);
    const before = run.coins;
    run = skipChallenge(run);
    expect(run.stage).toBe('finished');
    expect(run.questDone).toBe(true);
    expect(run.challengeDone).toBe(false);
    expect(run.coins).toBe(before);
  });

  it('finishes with no offer when the challenge is empty', () => {
    let run = started(quest({ challenge: [] }));
    run = advance(right(run).run);
    run = advance(right(beginSection(run)).run);
    expect(run.stage).toBe('finished');
  });

  it('ignores calls made at the wrong moment', () => {
    const intro = startRun(quest({}));
    expect(advance(intro)).toBe(intro);
    expect(acceptChallenge(intro)).toBe(intro);
    expect(skipChallenge(intro)).toBe(intro);
    expect(finishWorkedExample(intro)).toBe(intro);
    const answering = beginSection(intro);
    expect(beginSection(answering)).toBe(answering);
    expect(submitAnswer(intro, { given: '7', ...FAST })).toBeUndefined();
  });

  it('a double tap can only score once', () => {
    const { run } = right(started(quest({})));
    expect(submitAnswer(run, { given: '7', ...FAST })).toBeUndefined();
    expect(run.answered).toBe(1);
  });
});

describe('worked examples', () => {
  it('start the section, then pass without counting as an attempt', () => {
    const q = quest({ warmup: items(1, { workedExample: true }).concat(items(1)) });
    const run = started(q);
    expect(run.stage).toBe('worked-example');
    const next = finishWorkedExample(run);
    expect([next.stage, next.item, next.answered, next.coins]).toEqual(['answering', 1, 0, 0]);
  });
  it('work as the second item too', () => {
    const q = quest({ warmup: items(1).concat(items(1, { workedExample: true })) });
    expect(advance(right(started(q)).run).stage).toBe('worked-example');
  });
});

describe('tries', () => {
  it('a first wrong answer stays on the problem and gives a second try', () => {
    const { run, result } = wrong(started(quest({})));
    expect(result.kind).toBe('retry');
    expect(run.stage).toBe('answering');
    expect(run.misses).toBe(1);
    expect(run.answered).toBe(0);
  });
  it('right on the second try earns the recovery bonus', () => {
    const { run, result } = right(wrong(started(quest({}))).run);
    expect(result).toEqual({
      kind: 'correct',
      outcome: 'second-try',
      coins: COINS.correct + COINS.recoveryBonus,
      tryNumber: 2,
    });
    expect(run.correct).toBe(1);
    expect(run.inARow).toBe(0);
  });
  it('two misses reveal the answer, cost nothing, and move on', () => {
    const first = wrong(started(quest({})));
    const { run, result } = wrong(first.run);
    expect(result.kind).toBe('reveal');
    expect(run.stage).toBe('feedback');
    expect(run.coins).toBe(0);
    expect(run.answered).toBe(1);
    expect(run.correct).toBe(0);
    expect(advance(run).stage).toBe('section-intro');
  });
  it('remembers the first error for the parent view', () => {
    const { run } = wrong(started(quest({})), '8');
    expect(run.firstError).toBe('off-by-one');
  });
  it('a fresh problem starts with a clean slate', () => {
    const q = quest({ warmup: items(2) });
    const { run } = right(wrong(started(q)).run);
    const next = advance(run);
    expect(next.misses).toBe(0);
    expect(next.firstError).toBeUndefined();
    expect(next.lastOutcome).toBeUndefined();
  });
  it('fast answers earn the fast bonus and slow ones do not', () => {
    const q = quest({});
    expect(right(started(q)).result).toMatchObject({ outcome: 'fast', coins: 3 });
    const slow = submitAnswer(started(q), { given: '7', responseMs: 9000, fastMs: 3000 });
    expect(slow?.result).toMatchObject({ outcome: 'slow', coins: 2 });
  });
});

describe('counting', () => {
  it('tracks first-try answers in a row and keeps the best', () => {
    let run = started(quest({ warmup: items(4) }));
    run = advance(right(run).run);
    run = advance(right(run).run);
    expect(run.inARow).toBe(2);
    run = advance(right(wrong(run).run).run);
    expect(run.inARow).toBe(0);
    expect(run.bestInARow).toBe(2);
  });
  it('totals include the quest and challenge bonuses', () => {
    let run = started(quest({}));
    run = advance(right(run).run);
    run = advance(right(beginSection(run)).run);
    expect(run.coins).toBe(6 + COINS.questComplete);
    run = beginSection(acceptChallenge(run));
    run = advance(right(run).run);
    expect(run.coins).toBe(9 + COINS.questComplete + COINS.challengeComplete);
  });
});

describe('ending on a win, days 1–3', () => {
  const ramp = (skillItems: QuestItem[]) => quest({ skill: skillItems }, { endOnWin: true });
  const atSkill = (q: DailyQuest) => beginSection(advance(right(started(q)).run));
  const twice = (run: QuestRun) => wrong(wrong(run).run).run;

  it('a missed final problem comes straight back', () => {
    const run = advance(twice(atSkill(ramp(items(1, { finalWin: true })))));
    expect([run.stage, run.section, run.item]).toEqual(['answering', 1, 0]);
    expect(run.finalReplayed).toBe(true);
    expect(run.misses).toBe(0);
  });
  it('a win on the replay finishes the section', () => {
    const run = advance(twice(atSkill(ramp(items(1, { finalWin: true })))));
    expect(advance(right(run).run).stage).toBe('offer-challenge');
  });
  it('only comes back once, so a child can never get stuck', () => {
    let run = advance(twice(atSkill(ramp(items(1, { finalWin: true })))));
    run = advance(twice(run));
    expect(run.stage).toBe('offer-challenge');
  });
  it('a final problem answered correctly does not come back', () => {
    const run = advance(right(atSkill(ramp(items(1, { finalWin: true })))).run);
    expect(run.stage).toBe('offer-challenge');
  });
  it('a second-try answer is already a win', () => {
    const run = atSkill(ramp(items(1, { finalWin: true })));
    expect(advance(right(wrong(run).run).run).stage).toBe('offer-challenge');
  });
  it('does not apply to normal quests', () => {
    const q = quest({ skill: items(1, { finalWin: true }) });
    expect(advance(twice(atSkill(q))).stage).toBe('offer-challenge');
  });
  it('does not apply to other problems', () => {
    const run = advance(twice(atSkill(ramp(items(1).concat(items(1, { finalWin: true }))))));
    expect(run.item).toBe(1);
  });
});

describe('resuming', () => {
  it('survives being saved as JSON', () => {
    const run = wrong(started(quest({}))).run;
    expect(JSON.parse(JSON.stringify(run))).toEqual(run);
  });
  it('picks up at the next problem if closed during feedback', () => {
    const q = quest({ warmup: items(2) });
    const run = resumeRun(right(started(q)).run);
    expect([run.stage, run.item]).toEqual(['answering', 1]);
  });
  it('keeps a second try where it was', () => {
    const run = wrong(started(quest({}))).run;
    expect(resumeRun(run)).toBe(run);
    expect(currentItem(run)).toBeDefined();
  });
});

describe('settleItem', () => {
  const skill = (id: string, prerequisites: string[] = []): SkillDef => ({
    id,
    grade: 1,
    standard: 'x',
    name: id,
    kidName: id,
    speechKey: id,
    badgeName: id,
    prerequisites,
    questionTypes: ['number-pad', 'multiple-choice'],
    fastMs: 3000,
    factBased: true,
    mastery: { threshold: 80, minAttempts: 15 },
    order: 1,
  });
  const base = {
    skills: [skill('s'), skill('next', ['s'])],
    states: {},
    childId: 'c',
    responseMs: 1000,
    today: '2026-11-02',
    at: 5,
  };

  it('updates mastery once and creates missing state', () => {
    const { states, card } = settleItem({ ...base, problem: problem(), outcome: 'fast' });
    expect(states['s']?.attempts).toBe(1);
    expect(states['s']?.mastery).toBeGreaterThan(0);
    expect(card).toBeUndefined();
  });
  it('records the error type', () => {
    const { states } = settleItem({
      ...base,
      problem: problem(),
      outcome: 'missed',
      errorType: 'off-by-one',
    });
    expect(states['s']?.errorCounts['off-by-one']).toBe(1);
  });
  it('opens the next skill when mastery reaches the bar', () => {
    const s = { ...newSkillState('c', 's'), mastery: 69 };
    const { states } = settleItem({
      ...base,
      states: { s },
      problem: problem(),
      outcome: 'fast',
    });
    expect(states['next']?.unlockedAt).toBe(5);
  });
  it('rejects an unknown skill', () => {
    expect(() =>
      settleItem({ ...base, problem: problem('7', { skillId: 'nope' }), outcome: 'fast' }),
    ).toThrow();
  });

  const fact = problem('7', { factId: 'add:3+4' });
  it('creates and moves a fact card up on a fast answer', () => {
    const { card } = settleItem({ ...base, problem: fact, outcome: 'fast' });
    expect(card?.box).toBe(1);
    expect(card?.dueDate).toBe('2026-11-03');
  });
  it('sends a card back to the start after a second-try answer', () => {
    const start = { ...newFactCard('c', 'add:3+4', base.today), box: 3 as const };
    const { card } = settleItem({ ...base, card: start, problem: fact, outcome: 'second-try' });
    expect(card?.box).toBe(0);
    expect(card?.dueDate).toBe(base.today);
  });
  it('schedules a missed fact for the very next warm-up', () => {
    const { card } = settleItem({ ...base, problem: fact, outcome: 'missed' });
    expect(card?.dueDate).toBe(base.today);
    expect(card?.history.at(-1)?.correct).toBe(false);
  });
});

describe('retakes', () => {
  const skill: SkillDef = {
    id: 's',
    grade: 1,
    standard: 'x',
    name: 's',
    kidName: 's',
    speechKey: 's',
    badgeName: 's',
    prerequisites: [],
    questionTypes: ['number-pad', 'multiple-choice'],
    fastMs: 3000,
    factBased: false,
    mastery: { threshold: 80, minAttempts: 15 },
    order: 1,
  };
  const base = {
    skills: [skill],
    states: {},
    childId: 'c',
    responseMs: 1000,
    today: '2026-11-02',
    at: 5,
  };
  const numbered = (a: number) => problem('7', { operands: { kind: 'arith', op: 'add', a, b: 0 } });

  it('a missed problem is saved to come back', () => {
    const { states } = settleItem({ ...base, problem: problem(), outcome: 'missed' });
    expect(states['s']?.retakes).toHaveLength(1);
  });
  it('a problem right on either try is not saved', () => {
    for (const outcome of ['fast', 'slow', 'second-try'] as const) {
      const { states } = settleItem({ ...base, problem: problem(), outcome });
      expect(states['s']?.retakes).toBeUndefined();
    }
  });
  it('getting it right later clears it', () => {
    const missed = settleItem({ ...base, problem: problem(), outcome: 'missed' });
    const { states } = settleItem({
      ...base,
      states: missed.states,
      problem: problem(),
      outcome: 'slow',
    });
    expect(states['s']?.retakes).toBeUndefined();
  });
  it('missing it again keeps one copy', () => {
    const first = settleItem({ ...base, problem: problem(), outcome: 'missed' });
    const { states } = settleItem({
      ...base,
      states: first.states,
      problem: problem(),
      outcome: 'missed',
    });
    expect(states['s']?.retakes).toHaveLength(1);
  });
  it('keeps only the newest few, so a rough day does not flood tomorrow', () => {
    let states = base.states as Parameters<typeof settleItem>[0]['states'];
    for (let a = 0; a < 6; a++) {
      states = settleItem({ ...base, states, problem: numbered(a), outcome: 'missed' }).states;
    }
    expect(states['s']?.retakes).toHaveLength(3);
  });
  it('fact problems leave this to their cards', () => {
    const fact = problem('7', { factId: 'add:3+4' });
    const { states } = settleItem({ ...base, problem: fact, outcome: 'missed' });
    expect(states['s']?.retakes).toBeUndefined();
  });
});

describe('completeDailyQuest', () => {
  const child: ChildProfile = {
    id: 'c',
    name: 'A',
    avatar: 'bear',
    theme: 'animals',
    grade: 1,
    dailyGoal: 'quest',
    settings: { handedness: 'right', reduceMotion: false, colorBlindSafe: false },
    questsCompleted: 2,
    createdAt: 0,
    updatedAt: 0,
  };
  const input = {
    child,
    streak: newStreak('c'),
    wallet: newWallet('c'),
    states: {},
    quest: quest({}),
    at: 9,
  };

  it('counts the quest, the streak and the coin bonus together', () => {
    const done = completeDailyQuest(input);
    expect(done.child.questsCompleted).toBe(3);
    expect(done.streak.current).toBe(1);
    expect(done.wallet.coins).toBe(COINS.questComplete);
    expect(done.wallet.lifetimeCoins).toBe(COINS.questComplete);
    expect(done.events).toContainEqual({ type: 'first-day' });
  });
  it('counts for the day the quest started, even after midnight', () => {
    expect(completeDailyQuest(input).streak.lastCountedDate).toBe('2026-11-02');
  });
  it('adds to the count of quests on a frontier skill', () => {
    expect(completeDailyQuest(input).states['s']?.questsOnSkill).toBe(1);
  });
  it('day 7 brings the first shield, even after a missed day', () => {
    const q = quest({}, { dayNumber: 7 });
    const done = completeDailyQuest({ ...input, quest: q });
    expect(done.streak.current).toBe(1);
    expect(done.streak.shields).toBe(1);
    expect(done.events).toContainEqual({ type: 'shield-earned' });
  });
  it('day 7 gives no extra shield if one was already earned', () => {
    const q = quest({}, { dayNumber: 7 });
    const streak = { ...input.streak, shields: 1 };
    const done = completeDailyQuest({ ...input, streak, quest: q });
    expect(done.streak.shields).toBe(1);
  });
  it('leaves that count alone on a review day', () => {
    const review = quest({}, { mode: 'review' });
    expect(completeDailyQuest({ ...input, quest: review }).states['s']?.questsOnSkill).toBe(0);
  });
});

describe('the end-of-quest summary', () => {
  it('records each problem once: first try, second try, or shown', () => {
    let run = started(quest({ warmup: items(3) }));
    run = advance(right(run).run);
    run = advance(right(wrong(run, '8').run).run);
    run = wrong(wrong(run, '9').run, '6').run;
    const summary = summarizeRun(run);
    expect([summary.firstTry, summary.secondTry, summary.shown]).toEqual([1, 1, 1]);
    expect(summary.items.map((i) => [i.item, i.result, i.tried])).toEqual([
      [0, 'first-try', []],
      [1, 'second-try', ['8']],
      [2, 'shown', ['9', '6']],
    ]);
    expect(summary.items[0]?.kind).toBe('warmup');
    expect(summary.items[0]?.problem.answer).toBe('7');
  });
  it('a day-1 replay after seeing the answer keeps the first result', () => {
    const q = quest({ skill: items(1, { finalWin: true }) }, { endOnWin: true });
    let run = beginSection(advance(right(started(q)).run));
    run = advance(wrong(wrong(run).run).run);
    run = right(run).run;
    const summary = summarizeRun(run);
    expect(summary.items.filter((i) => i.section === 1).map((i) => i.result)).toEqual(['shown']);
  });
  it('worked examples are not attempts, so they are not listed', () => {
    let run = started(quest({ warmup: items(2, { workedExample: true }) }));
    run = finishWorkedExample(run);
    expect(summarizeRun(run).items).toEqual([]);
  });
  it('a run saved before results existed summarises as empty', () => {
    const run = { ...started(quest({})) };
    delete run.results;
    expect(summarizeRun(run)).toMatchObject({ firstTry: 0, secondTry: 0, shown: 0, items: [] });
  });
  it('the wrong first answer is forgotten on the next problem', () => {
    const run = advance(right(wrong(started(quest({ warmup: items(2) })), '8').run).run);
    expect(run.firstTried).toBeUndefined();
  });
});
