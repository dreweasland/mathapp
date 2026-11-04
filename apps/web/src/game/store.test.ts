import 'fake-indexeddb/auto';
import { GRADE_1_SKILLS } from '@mathapp/content';
import {
  currentItem,
  selectToday,
  type ChildProfile,
  type DailyGoal,
  type Goal,
  type Problem,
  type QuestRun,
  type SkillState,
  type Speech,
} from '@mathapp/engine';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Sound } from '../audio/sfx';
import type { Speaker } from '../audio/speech';
import { AppDb, type CheerAudio, type StoredCheer } from '../db/db';
import { childrenRepository } from '../db/repositories/children';
import { familyRepository } from '../db/repositories/family';
import { parentRepository } from '../db/repositories/parent';
import { progressRepository, type ChildProgress } from '../db/repositories/progress';
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
    setVoice: () => undefined,
  };
  const pending: (() => void)[] = [];
  const clips: CheerAudio[] = [];
  const game = createGame({
    children: childrenRepository(database, () => time),
    progress: progressRepository(database),
    family: familyRepository(database, () => time),
    speaker,
    play: (s) => sounds.push(s),
    clip: { play: (audio) => clips.push(audio), stop: () => undefined },
    now: () => time,
    after: (_, run) => pending.push(run),
  });
  const flushTimers = () => {
    while (pending.length) pending.shift()?.();
  };
  return {
    database,
    game,
    clips,
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
    while (env.state().progress?.inventory.unopened.length) {
      env.game.actions.openChest();
      env.game.actions.closeChest();
    }
    expect(env.said.at(-1)?.key).toBe('quest.done');
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
    const inChests = progress?.inventory.unopened.reduce((sum, c) => sum + c.coins, 0) ?? 0;
    expect(progress?.wallet.coins).toBe((run?.coins ?? 0) + inChests);
    await env.game.actions.flushed();
    const saved = await env.database.wallets.get(env.state().child?.id as string);
    expect(saved?.lifetimeCoins).toBe((run?.coins ?? 0) + inChests);
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
    const before = env.said.length;
    env.game.actions.answer('999');
    expect(env.sounds.at(-1)).toBe('not-yet');
    expect(env.state().feedback?.kind).toBe('retry');
    // Some problems then add a clue or ask again, after the retry line.
    expect(env.said[before]?.key).toBe('feedback.retry');
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
    while (env.state().progress?.inventory.unopened.length) {
      actions.openChest();
      actions.closeChest();
    }
    expect(env.said.at(-1)?.key).toBe('quest.rough-day');
    expect(env.state().progress?.streak.current).toBe(1);
    expect(env.sounds).toContain('cheer');
  });
});

describe('missions', () => {
  let env: Env;
  beforeEach(async () => {
    env = setup();
    await placed(env);
  });

  it('three appear for the day and are saved', async () => {
    await env.game.actions.flushed();
    expect(env.state().missions.map((m) => m.slot)).toEqual([1, 2, 3]);
    const saved = await env.database.missions.count();
    expect(saved).toBe(3);
  });
  it('are the same three if the app reopens', async () => {
    const before = env.state().missions;
    await env.game.actions.flushed();
    const back = setup(NOON + 1000, env.database);
    await back.game.actions.open();
    expect(back.state().missions).toEqual(before);
  });
  it('a new day brings new ones', async () => {
    await env.game.actions.flushed();
    const next = setup(NOON + DAY, env.database);
    await next.game.actions.open();
    expect(next.state().missions[0]?.date).not.toBe(env.state().missions[0]?.date);
    expect(next.state().missions).toHaveLength(3);
  });
  it('finishing the quest and challenge completes those missions and pays them', async () => {
    env.game.actions.startQuest();
    playThrough(env);
    env.game.actions.acceptChallenge();
    playThrough(env);
    const { missions, progress, run } = env.state();
    expect(missions.find((m) => m.kind === 'finish-challenge')?.done).toBe(true);
    expect(missions.every((m) => m.done)).toBe(true);
    expect(progress?.inventory.bonusChestDate).toBe(missions[0]?.date);
    expect(progress?.inventory.unopened.some((c) => c.source === 'missions')).toBe(true);
    // Run total covers answers, quest, challenge and missions; chests add their own.
    const chestCoins = progress?.inventory.unopened.reduce((sum, c) => sum + c.coins, 0) ?? 0;
    expect(progress?.wallet.coins).toBe((run?.coins ?? 0) + chestCoins);
  });
  it('mission progress survives closing the app', async () => {
    env.game.actions.startQuest();
    playThrough(env);
    await env.game.actions.flushed();
    const back = setup(NOON + 1000, env.database);
    await back.game.actions.open();
    expect(back.state().missions).toEqual(env.state().missions);
  });
});

describe('chests', () => {
  let env: Env;
  const finishQuest = async (e: Env) => {
    e.game.actions.startQuest();
    playThrough(e);
    e.game.actions.skipChallenge();
    await e.game.actions.flushed();
  };
  beforeEach(async () => {
    env = setup();
    await placed(env);
  });

  it('day 1 ends with a collectible chest to open', async () => {
    await finishQuest(env);
    expect(env.said.at(-1)?.key).toBe('chest.tap');
    env.game.actions.openChest();
    const opened = env.state().openedChest;
    expect(opened?.itemId).toMatch(/^forest\./);
    expect(env.state().progress?.inventory.items).toContain(opened?.itemId);
    expect(env.said.at(-1)?.key).toBe('chest.item');
  });
  it('the goodbye comes after the last chest', async () => {
    await finishQuest(env);
    env.game.actions.openChest();
    env.game.actions.closeChest();
    expect(env.said.at(-1)?.key).toBe('quest.done');
    expect(env.state().openedChest).toBeUndefined();
  });
  it('a chest left unopened is still there tomorrow', async () => {
    await finishQuest(env);
    const back = setup(NOON + DAY, env.database);
    await back.game.actions.open();
    expect(back.state().progress?.inventory.unopened.length).toBeGreaterThan(0);
    back.game.actions.openChest();
    await back.game.actions.flushed();
    const again = setup(NOON + DAY + 1000, env.database);
    await again.game.actions.open();
    expect(again.state().progress?.inventory.unopened.length).toBe(
      back.state().progress?.inventory.unopened.length,
    );
  });
  it('a double tap opens one chest', async () => {
    await finishQuest(env);
    const count = env.state().progress?.inventory.unopened.length ?? 0;
    env.game.actions.openChest();
    env.game.actions.openChest();
    expect(env.state().progress?.inventory.unopened.length).toBe(count - 1);
  });
  it('day 2 dresses the bear with the promised present', async () => {
    await finishQuest(env);
    const next = setup(NOON + DAY, env.database);
    await next.game.actions.open();
    await finishQuest(next);
    expect(next.state().progress?.inventory.mascotEquipped['accessory']).toBe('accessory.bow');
    const unopened = next.state().progress?.inventory.unopened ?? [];
    expect(unopened.some((c) => c.itemId === 'accessory.bow')).toBe(true);
  });
  it('a rewarded chest is saved even if the child never reaches the celebration', async () => {
    env.game.actions.startQuest();
    playThrough(env);
    await env.game.actions.flushed();
    const back = setup(NOON + 1000, env.database);
    await back.game.actions.open();
    expect(back.state().progress?.inventory.dailyChestDate).toBeDefined();
  });
});

describe('badges', () => {
  it('a badge earned in a quest is celebrated once', async () => {
    const env = setup();
    await placed(env);
    const child = env.state().child as { id: string };
    const data = env.state().progress as NonNullable<ReturnType<Env['state']>['progress']>;
    const { selectToday } = await import('@mathapp/engine');
    const { GRADE_1_SKILLS } = await import('@mathapp/content');
    const skill = selectToday(GRADE_1_SKILLS, data.states, 0)?.skill.id as string;
    env.game.store.setState({
      progress: {
        ...data,
        states: {
          ...data.states,
          [skill]: {
            ...(data.states[skill] as NonNullable<(typeof data.states)[string]>),
            childId: child.id,
            mastery: 99,
            attempts: 40,
          },
        },
      },
    });
    env.game.actions.startQuest();
    playThrough(env);
    env.game.actions.skipChallenge();
    expect(env.state().newBadges).toEqual([skill]);
    expect(env.said.map((l) => l.key)).toContain('badge.earned');
    // Shown full screen first, and said before the coins and the rest.
    expect(env.state().badgeShow).toEqual([skill]);
    const keys = env.said.map((l) => l.key);
    expect(keys.indexOf('badge.earned')).toBeLessThan(keys.indexOf('quest.coins'));
    env.game.actions.closeBadge();
    expect(env.state().badgeShow).toEqual([]);
    expect(env.state().progress?.states[skill]?.masteredAt).toBeDefined();
  });
});

describe('dressing the bear', () => {
  let env: Env;
  beforeEach(async () => {
    env = setup();
    await placed(env);
    const data = env.state().progress as NonNullable<ReturnType<Env['state']>['progress']>;
    env.game.store.setState({
      progress: { ...data, wallet: { ...data.wallet, coins: 500, lifetimeCoins: 500 } },
    });
  });

  it('buying spends only what it costs and keeps lifetime coins', () => {
    env.game.actions.buy('hat.cap');
    const { wallet, inventory } = env.state().progress as NonNullable<
      ReturnType<Env['state']>['progress']
    >;
    expect(wallet.coins).toBe(400);
    expect(wallet.lifetimeCoins).toBe(500);
    expect(inventory.mascotEquipped['hat']).toBe('hat.cap');
  });
  it('cannot be charged twice', () => {
    env.game.actions.buy('hat.cap');
    env.game.actions.buy('hat.cap');
    expect(env.state().progress?.wallet.coins).toBe(400);
  });
  it('taking something off keeps it', () => {
    env.game.actions.buy('hat.cap');
    env.game.actions.toggleWear('hat.cap');
    const inventory = env.state().progress?.inventory;
    expect(inventory?.mascotEquipped['hat']).toBeUndefined();
    expect(inventory?.items).toContain('hat.cap');
  });
  it('purchases survive closing the app', async () => {
    env.game.actions.buy('hat.cap');
    await env.game.actions.flushed();
    const back = setup(NOON + 1000, env.database);
    await back.game.actions.open();
    expect(back.state().progress?.inventory.items).toContain('hat.cap');
  });
});

describe('a failed save', () => {
  it('does not interrupt the child, and flags it for a grown-up', async () => {
    const env = setup();
    await placed(env);
    env.game.actions.startQuest();
    env.game.actions.beginSection();
    env.database.close();
    await env.database.delete();
    const original = console.error;
    console.error = () => undefined;
    env.game.actions.answer(problemNow(env).answer);
    await env.game.actions.flushed();
    console.error = original;
    expect(env.state().feedback?.kind).toBe('correct');
    expect(env.state().saveFailed).toBe(true);
  });
});

describe('more than one child', () => {
  it('asks who is playing, and each child keeps their own day', async () => {
    const env = setup();
    await placed(env);
    const first = env.state().child?.id;
    const repo = childrenRepository(env.database, () => NOON + 1000);
    await repo.create({ name: 'Kim', avatar: '🐼' });

    const again = setup(NOON, env.database);
    await again.game.actions.open();
    expect(again.state().screen).toBe('who');
    expect(again.state().everyone.map((c) => c.name)).toEqual(['Sam', 'Kim']);

    const kim = again.state().everyone[1] as ChildProfile;
    await again.game.actions.pick(kim);
    expect(again.state().child?.id).toBe(kim.id);
    expect(again.state().screen).toBe('placement');
    expect(again.state().child?.id).not.toBe(first);
  });
  it('one child goes straight to Home', async () => {
    const env = setup();
    await placed(env);
    const again = setup(NOON, env.database);
    await again.game.actions.open();
    expect(again.state().screen).toBe('home');
  });
  it('a half-done quest stays with the child who started it', async () => {
    const env = setup();
    await placed(env);
    const sam = env.state().child as ChildProfile;
    env.game.actions.startQuest();
    env.game.actions.goHome();
    await env.game.actions.flushed();
    const kim = await childrenRepository(env.database, () => NOON).create({
      name: 'Kim',
      avatar: '🐼',
    });
    await env.game.actions.pick({ ...kim, placedAt: 1 });
    expect(env.state().run).toBeUndefined();
    await env.game.actions.pick(sam);
    expect(env.state().run).toBeDefined();
  });
});

describe('leaving the dashboard', () => {
  it('picks up changes a grown-up made, such as a shield', async () => {
    const env = setup();
    await placed(env);
    await env.game.actions.openParent();
    expect(env.state().screen).toBe('parent');
    const id = env.state().child?.id as string;
    await parentRepository(env.database, () => NOON).grantShield(id);
    await env.game.actions.closeParent();
    expect(env.state().screen).toBe('home');
    expect(env.state().progress?.streak.shields).toBe(1);
  });
  it('waits for saves before opening, so the dashboard is never behind', async () => {
    const env = setup();
    await placed(env);
    env.game.actions.startQuest();
    await env.game.actions.openParent();
    const sessions = await env.database.sessions.toArray();
    expect(sessions.some((s) => s.run)).toBe(true);
  });
  it('after removing the child who was playing, moves to who is left', async () => {
    const env = setup();
    await placed(env);
    const parent = parentRepository(env.database, () => NOON);
    const kim = await parent.addChild({ name: 'Kim', avatar: '🐼' });
    await parent.removeChild(env.state().child?.id as string);
    await env.game.actions.closeParent();
    expect(env.state().child?.id).toBe(kim.id);
  });
  it('shows the reminder only once a backup is worth having', async () => {
    const env = setup();
    await placed(env);
    expect(env.state().backupDue).toBe(false);
    const id = env.state().child?.id as string;
    await env.database.children.update(id, { questsCompleted: 7 });
    const again = setup(NOON, env.database);
    await again.game.actions.open();
    expect(again.state().backupDue).toBe(true);
    await familyRepository(env.database, () => NOON).markBackedUp();
    await again.game.actions.open();
    expect(again.state().backupDue).toBe(false);
  });
});

describe('daily goal', () => {
  const finishRequired = async (env: Env, dailyGoal: DailyGoal) => {
    await placed(env);
    const child = env.state().child as ChildProfile;
    env.game.store.setState({ child: { ...child, dailyGoal } });
    env.game.actions.startQuest();
    playThrough(env);
  };
  it('a quest+challenge child hears that the challenge is their goal, and can still skip', async () => {
    const env = setup();
    await finishRequired(env, 'quest+challenge');
    expect(env.said.map((l) => l.key)).toContain('quest.challenge-goal');
    env.game.actions.skipChallenge();
    expect(env.state().screen).toBe('celebrate');
    expect(env.state().progress?.streak.current).toBe(1);
    expect(env.said.map((l) => l.key)).not.toContain('daily.met');
  });
  it('finishing the challenge meets that goal and is saved for the grown-up', async () => {
    const env = setup();
    await finishRequired(env, 'quest+challenge');
    env.game.actions.acceptChallenge();
    playThrough(env);
    expect(env.said.map((l) => l.key)).toContain('daily.met');
    await env.game.actions.flushed();
    const sessions = await env.database.sessions.toArray();
    expect(sessions.find((s) => s.type === 'quest')?.challengeDone).toBe(true);
  });
  it('a quest-only child hears the plain offer', async () => {
    const env = setup();
    await finishRequired(env, 'quest');
    expect(env.said.map((l) => l.key)).toContain('quest.challenge');
  });
});

describe("a grown-up's goal", () => {
  const goal = (childId: string, over: Partial<Goal> = {}): Goal => ({
    id: 'g',
    childId,
    title: 'Movie',
    imageKey: '🎬',
    target: 2,
    unit: 'quests',
    progress: 0,
    rewardText: 'movie night',
    startDate: '2026-11-01',
    delivered: false,
    updatedAt: 0,
    ...over,
  });
  const withGoal = async (over: Partial<Goal> = {}) => {
    const env = setup();
    await placed(env);
    await env.database.goals.put(goal(env.state().child?.id as string, over));
    await env.game.actions.enter(env.state().child as ChildProfile);
    return env;
  };

  it('moves when a quest counts, and survives a reload', async () => {
    const env = await withGoal();
    env.game.actions.startQuest();
    playThrough(env);
    expect(env.state().progress?.goals[0]?.progress).toBe(1);
    await env.game.actions.flushed();
    expect((await env.database.goals.get('g'))?.progress).toBe(1);
  });
  it('announces the reward the moment it is reached', async () => {
    const env = await withGoal({ progress: 1 });
    env.game.actions.startQuest();
    playThrough(env);
    env.game.actions.skipChallenge();
    const line = env.said.find((l) => l.key === 'goal.reached');
    expect(line?.params?.reward).toBe('movie night');
  });
  it('does not count quests before the goal started', async () => {
    const env = await withGoal({ startDate: '2026-11-03' });
    env.game.actions.startQuest();
    playThrough(env);
    expect(env.state().progress?.goals[0]?.progress).toBe(0);
  });
  it('counts badges for a badge goal', async () => {
    const env = await withGoal({ unit: 'skills' });
    const data = env.state().progress as ChildProgress;
    const skill = selectToday(GRADE_1_SKILLS, data.states, 0)?.skill.id as string;
    env.game.store.setState({
      progress: {
        ...data,
        states: {
          ...data.states,
          [skill]: { ...(data.states[skill] as SkillState), mastery: 99, attempts: 40 },
        },
      },
    });
    env.game.actions.startQuest();
    playThrough(env);
    expect(env.state().newBadges).toEqual([skill]);
    expect(env.state().progress?.goals[0]?.progress).toBe(1);
  });
});

describe('cheers', () => {
  const cheer = (childId: string, over: Partial<StoredCheer> = {}): StoredCheer => ({
    id: 'c',
    childId,
    emoji: '🌟',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  });
  const withCheer = async (over: Partial<StoredCheer> = {}) => {
    const env = setup();
    await placed(env);
    await env.database.cheers.put(cheer(env.state().child?.id as string, over));
    await env.game.actions.enter(env.state().child as ChildProfile);
    return env;
  };

  it('plays before the next quest, then the quest starts', async () => {
    const env = await withCheer();
    env.game.actions.startQuest();
    expect(env.state().screen).toBe('cheer');
    expect(env.said.at(-1)?.key).toBe('cheer.from');
    env.game.actions.finishCheer();
    expect(env.state().screen).toBe('quest');
    await env.game.actions.flushed();
    expect((await env.database.cheers.get('c'))?.playedAt).toBeDefined();
  });
  it('starts a recording inside the tap, not after a spoken intro', async () => {
    const bytes = new Uint8Array([1]).buffer;
    const env = await withCheer({ audio: { bytes, type: 'audio/mp4' } });
    env.game.actions.startQuest();
    expect(env.clips).toHaveLength(1);
    expect(env.said.at(-1)?.key).not.toBe('cheer.from');
  });
  it('can be heard again, and is never played twice across quests', async () => {
    const env = await withCheer();
    env.game.actions.startQuest();
    env.game.actions.playCheer();
    env.game.actions.finishCheer();
    await env.game.actions.flushed();
    const again = setup(NOON, env.database);
    await again.game.actions.open();
    expect(again.state().progress?.cheers).toEqual([]);
  });
  it('stays for next time if the app closes during it', async () => {
    const env = await withCheer();
    env.game.actions.startQuest();
    const again = setup(NOON, env.database);
    await again.game.actions.open();
    expect(again.state().progress?.cheers).toHaveLength(1);
  });
  it('plays one per quest, oldest first', async () => {
    const env = await withCheer();
    const childId = env.state().child?.id as string;
    await env.database.cheers.put(cheer(childId, { id: 'd', createdAt: 2 }));
    await env.game.actions.enter(env.state().child as ChildProfile);
    env.game.actions.startQuest();
    expect(env.state().cheer?.id).toBe('c');
    env.game.actions.finishCheer();
    expect(env.state().screen).toBe('quest');
    expect(env.state().progress?.cheers.map((c) => c.id)).toEqual(['d']);
  });
  it('waits for tomorrow when today is already done', async () => {
    const env = await withCheer();
    env.game.store.setState({ todayDone: true });
    env.game.actions.startQuest();
    expect(env.state().screen).toBe('home');
  });
});

describe('free play', () => {
  const finishToday = async () => {
    const env = setup();
    await placed(env);
    env.game.actions.startQuest();
    playThrough(env);
    env.game.actions.skipChallenge();
    env.game.actions.goHome();
    await env.game.actions.flushed();
    return env;
  };
  const snapshot = (env: Env) => {
    const data = env.state().progress as ChildProgress;
    return {
      streak: data.streak,
      missions: env.state().missions,
      unopened: data.inventory.unopened.length,
      quests: env.state().child?.questsCompleted,
      goals: data.goals,
    };
  };
  const practiceAll = (env: Env) => {
    for (let guard = 0; guard < 60 && env.state().run; guard++) {
      if ((env.state().run as QuestRun).stage !== 'answering') break;
      env.tick(1000);
      env.game.actions.answer(problemNow(env).answer);
      env.flushTimers();
    }
  };

  it('stays closed until the quest is done', async () => {
    const env = setup();
    await placed(env);
    env.game.actions.startPractice('1.counting');
    env.game.actions.startBlitz('1.add-within-10');
    expect(env.state().screen).toBe('home');
  });
  it('practice pays coins but touches no streak, chest, mission or quest count', async () => {
    const env = await finishToday();
    const before = snapshot(env);
    const coins = env.state().progress?.wallet.lifetimeCoins as number;
    env.game.actions.startPractice('1.counting');
    expect(env.state().run?.quest.free).toBe(true);
    practiceAll(env);
    expect(env.state().screen).toBe('free-done');
    expect(snapshot(env)).toEqual(before);
    expect(env.state().progress?.wallet.lifetimeCoins).toBeGreaterThan(coins);
    expect(env.state().freeResult?.coins).toBeGreaterThan(0);
  });
  it('practice still teaches: it updates mastery', async () => {
    const env = await finishToday();
    const attempts = env.state().progress?.states['1.counting']?.attempts ?? 0;
    env.game.actions.startPractice('1.counting');
    practiceAll(env);
    expect(env.state().progress?.states['1.counting']?.attempts).toBeGreaterThan(attempts);
  });
  it('leaving practice early keeps what was earned and does not come back as a quest', async () => {
    const env = await finishToday();
    env.game.actions.startPractice('1.counting');
    env.tick(1000);
    env.game.actions.answer(problemNow(env).answer);
    env.game.actions.goHome();
    expect(env.state().run).toBeUndefined();
    expect(env.state().todayDone).toBe(true);
    await env.game.actions.flushed();
    const rows = await env.database.sessions.toArray();
    expect(rows.find((s) => s.type === 'free')?.run).toBeUndefined();
  });
  it('blitz scores right answers, and a miss just moves on', async () => {
    const env = await finishToday();
    env.game.actions.startBlitz('1.add-within-10');
    const first = env.state().blitz?.problem as Problem;
    env.game.actions.answerBlitz(first.answer);
    expect(env.state().blitz?.score).toBe(1);
    const second = env.state().blitz?.problem as Problem;
    expect(second.factId).not.toBe(first.factId);
    env.sounds.length = 0;
    env.game.actions.answerBlitz('999');
    expect(env.state().blitz?.score).toBe(1);
    expect(env.sounds).not.toContain('not-yet');
  });
  it('ends itself after a minute and keeps the best, without moving the streak', async () => {
    const env = await finishToday();
    const before = snapshot(env);
    env.game.actions.startBlitz('1.add-within-10');
    env.game.actions.answerBlitz((env.state().blitz?.problem as Problem).answer);
    env.flushTimers();
    expect(env.state().screen).toBe('free-done');
    expect(env.state().freeResult).toMatchObject({ score: 1, best: 1, isBest: true });
    expect(env.state().progress?.states['1.add-within-10']?.blitzBest).toBe(1);
    expect(snapshot(env).streak).toEqual(before.streak);
    await env.game.actions.flushed();
    const saved = await env.database.skillStates
      .where({ childId: env.state().child?.id as string, skillId: '1.add-within-10' })
      .first();
    expect(saved?.blitzBest).toBe(1);
  });
  it('a blitz left early does not finish later behind the child', async () => {
    const env = await finishToday();
    env.game.actions.startBlitz('1.add-within-10');
    env.game.actions.goHome();
    env.flushTimers();
    expect(env.state().screen).toBe('home');
  });
  it('blitz answers feed the same fact cards the grown-up sees', async () => {
    const env = await finishToday();
    env.game.actions.startBlitz('1.add-within-10');
    const problem = env.state().blitz?.problem as Problem;
    env.game.actions.answerBlitz(problem.answer);
    expect(env.state().progress?.cards.get(problem.factId as string)?.history).toHaveLength(1);
  });
  it('free play shows up in the grown-up totals but never as a quest', async () => {
    const env = await finishToday();
    env.game.actions.startPractice('1.counting');
    practiceAll(env);
    await env.game.actions.flushed();
    const sessions = await env.database.sessions.toArray();
    expect(sessions.filter((s) => s.completedQuest)).toHaveLength(1);
    expect(sessions.some((s) => s.type === 'free')).toBe(true);
  });
});

describe('telling the child what is happening', () => {
  it('writes out what the bear says, but not single digits', async () => {
    const env = setup();
    await placed(env);
    env.game.actions.sayHome();
    env.flushTimers();
    const line = env.state().caption;
    expect(line?.key).toMatch(/^(home|placement)\./);
    env.game.actions.sayDigit('7');
    expect(env.state().caption).toEqual(line);
  });

  it('tours Home once, in three steps, and remembers it was seen', async () => {
    const env = setup();
    await placed(env);
    const { actions } = env.game;
    expect(env.state().child?.touredAt).toBeUndefined();
    actions.startTour();
    expect(env.state().tour).toBe(0);
    expect(env.said.at(-1)?.key).toBe('tour.today');
    actions.nextTour();
    actions.nextTour();
    expect(env.said.at(-1)?.key).toBe('tour.stuff');
    actions.nextTour();
    expect(env.state().tour).toBeUndefined();
    expect(env.said.at(-1)?.key).toBe('tour.done');
    await actions.flushed();
    const saved = await env.database.children.get(env.state().child?.id ?? '');
    expect(saved?.touredAt).toBeDefined();
  });

  it('can skip the tour, and Help runs it again without touching anything else', async () => {
    const env = setup();
    await placed(env);
    const { actions } = env.game;
    actions.startTour();
    actions.endTour();
    const toured = env.state().child?.touredAt;
    expect(toured).toBeDefined();
    const coins = env.state().progress?.wallet.coins;
    actions.startTour();
    actions.endTour();
    expect(env.state().child?.touredAt).toBe(toured);
    expect(env.state().progress?.wallet.coins).toBe(coins);
  });

  it('puts a grown-up note away for this visit only', async () => {
    const env = setup();
    await placed(env);
    expect(env.state().noteDismissed).toBe(false);
    env.game.actions.dismissNote();
    expect(env.state().noteDismissed).toBe(true);
  });
});
