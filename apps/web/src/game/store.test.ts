import 'fake-indexeddb/auto';
import { currentItem, type Problem, type QuestRun, type Speech } from '@mathapp/engine';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Sound } from '../audio/sfx';
import type { Speaker } from '../audio/speech';
import { AppDb } from '../db/db';
import { childrenRepository } from '../db/repositories/children';
import { progressRepository } from '../db/repositories/progress';
import { createGame } from './store';

const DAY = 24 * 60 * 60 * 1000;
const NOON = new Date(2026, 10, 2, 12).getTime();

let dbCount = 0;

function setup(startAt = NOON, database = new AppDb(`store-test-${++dbCount}`)) {
  const said: Speech[] = [];
  const sounds: Sound[] = [];
  let time = startAt;
  const hold = {
    on: false,
    pending: undefined as (() => void) | undefined,
    finish() {
      this.pending?.();
    },
  };
  const speaker: Speaker = {
    available: true,
    unlock: () => undefined,
    say: (line, done) => {
      said.push(line);
      if (hold.on) hold.pending = done;
      else done?.();
    },
    stop: () => undefined,
  };
  const pending: (() => void)[] = [];
  const game = createGame({
    children: childrenRepository(database, () => time),
    progress: progressRepository(database),
    speaker,
    play: (s) => sounds.push(s),
    now: () => time,
    after: (_, run) => pending.push(run),
  });
  const flushTimers = () => {
    while (pending.length) pending.shift()?.();
  };
  return {
    database,
    game,
    hold,
    said,
    sounds,
    flushTimers,
    tick: (ms: number) => {
      time += ms;
    },
    state: () => game.store.getState(),
  };
}

type Env = ReturnType<typeof setup>;

const problemNow = (env: Env): Problem => {
  const item = currentItem(env.state().run as QuestRun);
  if (!item) throw new Error('no problem');
  return item.problem;
};

/** A child that passes placement's first failure at once: two wrong answers. */
async function placed(env: Env) {
  await env.game.actions.createChild({ name: 'Sam', avatar: '🐻' });
  env.game.actions.startPlacement();
  for (let i = 0; i < 2 && env.state().placement; i++) {
    env.game.actions.answerPlacement('wrong');
    env.flushTimers();
  }
  await env.game.actions.flushed();
}

function playThrough(env: Env, stopAt?: { section: number; item: number }) {
  const { actions } = env.game;
  for (let guard = 0; guard < 200; guard++) {
    const run = env.state().run as QuestRun;
    if (stopAt && run.section === stopAt.section && run.item === stopAt.item) return;
    if (run.stage === 'section-intro') actions.beginSection();
    else if (run.stage === 'worked-example') actions.finishWorked();
    else if (run.stage === 'answering') {
      env.tick(1000);
      actions.answer(problemNow(env).answer);
      env.flushTimers();
    } else return;
  }
}

describe('first run', () => {
  it('starts on setup with no children', async () => {
    const env = setup();
    await env.game.actions.open();
    expect(env.state().screen).toBe('setup');
  });
  it('goes to placement after creating a child', async () => {
    const env = setup();
    await env.game.actions.createChild({ name: 'Sam', avatar: '🐻' });
    expect(env.state().screen).toBe('placement');
  });
  it('placement ends at home, is remembered, and never shows right or wrong', async () => {
    const env = setup();
    await placed(env);
    expect(env.state().screen).toBe('home');
    expect(env.state().child?.placedAt).toBeDefined();
    expect(env.sounds).not.toContain('correct');
    expect(env.sounds).not.toContain('not-yet');
    const again = setup(NOON, env.database);
    await again.game.actions.open();
    expect(again.state().screen).toBe('home');
  });
  it('placement thanks the child before the home prompt, without being cut off', async () => {
    const env = setup();
    await placed(env);
    env.game.actions.sayHome();
    expect(env.said.slice(-2).map((l) => l.key)).toEqual(['placement.done', 'home.start']);
  });
  it('a double tap in placement counts once', async () => {
    const env = setup();
    await env.game.actions.createChild({ name: 'Sam', avatar: '🐻' });
    env.game.actions.startPlacement();
    env.game.actions.answerPlacement('wrong');
    env.game.actions.answerPlacement('wrong');
    expect(env.state().session?.problemsCount).toBe(1);
  });
  it('a strong child places past the first skills', async () => {
    const env = setup();
    await env.game.actions.createChild({ name: 'Sam', avatar: '🐻' });
    env.game.actions.startPlacement();
    for (let guard = 0; guard < 20 && env.state().placement; guard++) {
      env.game.actions.answerPlacement((env.state().placement?.problem as Problem).answer);
      env.flushTimers();
    }
    expect(env.state().screen).toBe('home');
    expect(env.state().progress?.states['1.add-within-10']?.placedOut).toBe(true);
    await env.game.actions.flushed();
    expect(
      await env.database.skillStates.get([env.state().child?.id as string, '1.counting']),
    ).toBeDefined();
  });
});

describe('a daily quest', () => {
  let env: Env;
  beforeEach(async () => {
    env = setup();
    await placed(env);
  });

  it('runs start to finish and ends on the celebration', async () => {
    env.game.actions.startQuest();
    expect(env.state().screen).toBe('quest');
    playThrough(env);
    expect(env.state().run?.stage).toBe('offer-challenge');
    env.game.actions.skipChallenge();
    expect(env.state().screen).toBe('celebrate');
    expect(env.state().todayDone).toBe(true);
    expect(env.sounds).toContain('cheer');
    expect(env.said.map((l) => l.key)).toContain('quest.done');
  });

  it('counts the day before any challenge, and only once', async () => {
    env.game.actions.startQuest();
    playThrough(env);
    expect(env.state().progress?.streak.current).toBe(1);
    expect(env.state().child?.questsCompleted).toBe(1);
    env.game.actions.acceptChallenge();
    playThrough(env);
    expect(env.state().run?.stage).toBe('finished');
    expect(env.state().progress?.streak.current).toBe(1);
    expect(env.state().child?.questsCompleted).toBe(1);
  });

  it('pays every coin into the wallet, including both bonuses', async () => {
    env.game.actions.startQuest();
    playThrough(env);
    env.game.actions.acceptChallenge();
    playThrough(env);
    const { run, progress } = env.state();
    expect(run?.challengeDone).toBe(true);
    expect(progress?.wallet.coins).toBe(run?.coins);
    await env.game.actions.flushed();
    const saved = await env.database.wallets.get(env.state().child?.id as string);
    expect(saved?.lifetimeCoins).toBe(run?.coins);
  });

  it('a quest done today stays done: one a day', async () => {
    env.game.actions.startQuest();
    playThrough(env);
    env.game.actions.skipChallenge();
    await env.game.actions.flushed();
    const again = setup(NOON + 1000, env.database);
    await again.game.actions.open();
    expect(again.state().todayDone).toBe(true);
    again.game.actions.startQuest();
    expect(again.state().screen).toBe('home');
  });

  it('a new day brings a new quest and grows the streak', async () => {
    env.game.actions.startQuest();
    playThrough(env);
    env.game.actions.skipChallenge();
    await env.game.actions.flushed();
    const next = setup(NOON + DAY, env.database);
    await next.game.actions.open();
    expect(next.state().todayDone).toBe(false);
    next.game.actions.startQuest();
    playThrough(next);
    expect(next.state().progress?.streak.current).toBe(2);
  });

  it('notices a new day when an open app returns from the background', async () => {
    env.game.actions.startQuest();
    playThrough(env);
    env.game.actions.skipChallenge();
    env.game.actions.goHome();
    expect(env.state().todayDone).toBe(true);
    await env.game.actions.flushed();
    env.tick(DAY);
    await env.game.actions.checkNewDay();
    expect(env.state().todayDone).toBe(false);
    expect(env.state().run).toBeUndefined();
  });

  it('a long gap brings the warm message once, and keeps best and coins', async () => {
    env.game.actions.startQuest();
    playThrough(env);
    env.game.actions.skipChallenge();
    await env.game.actions.flushed();
    const coins = env.state().progress?.wallet.coins;
    const later = setup(NOON + 5 * DAY, env.database);
    await later.game.actions.open();
    expect(later.state().homeNote?.key).toBe('streak.new');
    later.game.actions.sayHome();
    expect(later.state().homeNote).toBeUndefined();
    expect(later.state().progress?.streak.best).toBe(1);
    expect(later.state().progress?.wallet.coins).toBe(coins);
  });
});

describe('answering', () => {
  let env: Env;
  beforeEach(async () => {
    env = setup();
    await placed(env);
    env.game.actions.startQuest();
    env.game.actions.beginSection();
  });

  it('gives sound and state before anything is saved', () => {
    env.game.actions.answer(problemNow(env).answer);
    expect(env.sounds.at(-1)).toBe('correct');
    expect(env.state().feedback?.kind).toBe('correct');
    expect(env.state().mood).toBe('happy');
  });

  it('wrong is a gentle "not yet", never a buzzer, and offers a second try', () => {
    env.game.actions.answer('999');
    expect(env.sounds.at(-1)).toBe('not-yet');
    expect(env.state().feedback?.kind).toBe('retry');
    expect(env.said.at(-1)?.key).toBe('feedback.retry');
    expect(env.state().triedValues).toEqual(['999']);
  });

  it('two misses show the answer and wait for a tap', async () => {
    env.game.actions.answer('999');
    env.game.actions.answer('998');
    expect(env.state().feedback?.kind).toBe('reveal');
    expect(env.said.at(-2)?.key).toBe('feedback.show-answer');
    expect(env.said.at(-1)?.key).toMatch(/^answer\./);
    const before = env.state().run;
    env.flushTimers();
    expect(env.state().run).toBe(before);
    env.game.actions.next();
    expect(env.state().run?.item).toBe(1);
    await env.game.actions.flushed();
    expect(await env.database.attempts.count()).toBeGreaterThanOrEqual(2);
  });

  it('praises recovery in words', () => {
    env.game.actions.answer('999');
    env.game.actions.answer(problemNow(env).answer);
    expect(
      env.said.at(-1)?.key === 'feedback.recovered' ||
        env.said.at(-2)?.key === 'feedback.recovered',
    ).toBe(true);
  });

  it('a double tap scores once', () => {
    const answer = problemNow(env).answer;
    env.game.actions.answer(answer);
    const coins = env.state().progress?.wallet.coins;
    env.game.actions.answer(answer);
    expect(env.state().progress?.wallet.coins).toBe(coins);
  });

  it('times from when the prompt ends, not when it starts', async () => {
    env.game.actions.answer(problemNow(env).answer);
    env.hold.on = true;
    env.flushTimers();
    env.tick(3000);
    env.hold.finish();
    env.tick(1000);
    env.game.actions.answer(problemNow(env).answer);
    await env.game.actions.flushed();
    const rows = await env.database.attempts.toArray();
    expect(rows.filter((r) => r.responseMs === 1000)).toHaveLength(1);
  });

  it('an answer before the prompt ends counts from when it was shown', async () => {
    env.game.actions.answer(problemNow(env).answer);
    env.hold.on = true;
    env.flushTimers();
    env.tick(1500);
    env.game.actions.answer(problemNow(env).answer);
    await env.game.actions.flushed();
    const rows = await env.database.attempts.toArray();
    expect(rows.filter((r) => r.responseMs === 1500)).toHaveLength(1);
  });

  it('saves one attempt row per try', async () => {
    env.game.actions.answer('999');
    env.game.actions.answer(problemNow(env).answer);
    await env.game.actions.flushed();
    const rows = await env.database.attempts
      .where('childId')
      .equals(env.state().child?.id as string)
      .toArray();
    const quest = rows
      .filter((r) => r.sessionId === env.state().session?.id)
      .sort((x, y) => x.tryNumber - y.tryNumber);
    expect(quest.map((r) => r.tryNumber)).toEqual([1, 2]);
    expect(quest.map((r) => r.correct)).toEqual([false, true]);
    expect(quest[0]?.errorType).toBeDefined();
    expect(quest[0]?.prompt).not.toMatch(/[{}]/);
  });
});

describe('leaving and coming back', () => {
  let env: Env;
  beforeEach(async () => {
    env = setup();
    await placed(env);
    env.game.actions.startQuest();
  });

  it('resumes the same quest at the same problem after the app closes', async () => {
    env.game.actions.beginSection();
    env.game.actions.answer(problemNow(env).answer);
    env.flushTimers();
    await env.game.actions.flushed();
    const { run } = env.state();
    const back = setup(NOON + 60_000, env.database);
    await back.game.actions.open();
    expect(back.state().run?.quest.seed).toBe(run?.quest.seed);
    back.game.actions.startQuest();
    expect(back.state().run?.item).toBe(run?.item);
    expect(back.state().run?.coins).toBe(run?.coins);
  });

  it('an unfinished quest still records how many problems were done', async () => {
    env.game.actions.beginSection();
    env.game.actions.answer(problemNow(env).answer);
    await env.game.actions.flushed();
    const row = await env.database.sessions.get(env.state().session?.id as string);
    expect([row?.problemsCount, row?.correctCount]).toEqual([1, 1]);
  });

  it('a pause timer that fires after going home does nothing', () => {
    env.game.actions.beginSection();
    env.game.actions.answer(problemNow(env).answer);
    env.game.actions.goHome();
    env.flushTimers();
    expect(env.state().screen).toBe('home');
    env.game.actions.startQuest();
    expect(env.state().run?.item).toBe(1);
  });

  it('coins earned before leaving are kept', async () => {
    env.game.actions.beginSection();
    env.game.actions.answer(problemNow(env).answer);
    await env.game.actions.flushed();
    const back = setup(NOON + 60_000, env.database);
    await back.game.actions.open();
    expect(back.state().progress?.wallet.coins).toBeGreaterThan(0);
  });

  it("does not resume yesterday's unfinished quest", async () => {
    env.game.actions.beginSection();
    env.game.actions.answer(problemNow(env).answer);
    await env.game.actions.flushed();
    const next = setup(NOON + DAY, env.database);
    await next.game.actions.open();
    expect(next.state().run).toBeUndefined();
    expect(next.state().todayDone).toBe(false);
  });
});

describe('rough days', () => {
  it('still end on the celebration, with kind words', async () => {
    const env = setup();
    await placed(env);
    env.game.actions.startQuest();
    const { actions } = env.game;
    for (let guard = 0; guard < 300; guard++) {
      const run = env.state().run as QuestRun;
      if (run.stage === 'section-intro') actions.beginSection();
      else if (run.stage === 'worked-example') actions.finishWorked();
      else if (run.stage === 'answering') actions.answer('nope');
      else if (run.stage === 'feedback') actions.next();
      else break;
    }
    actions.skipChallenge();
    expect(env.state().screen).toBe('celebrate');
    expect(env.said.map((l) => l.key)).toContain('quest.rough-day');
    expect(env.state().progress?.streak.current).toBe(1);
    expect(env.sounds).toContain('cheer');
  });
});
