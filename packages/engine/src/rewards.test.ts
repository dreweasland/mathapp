import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import {
  activeSet,
  bankChest,
  bankMissionChest,
  bankQuestChests,
  buyCosmetic,
  CHEST_COINS,
  chestTierTomorrow,
  chestTierToday,
  DUPLICATE_COINS,
  fillChest,
  newInventory,
  openNextChest,
  tierForDays,
  toggleCosmetic,
  weekStrip,
  type ChestInput,
} from './rewards';
import { mulberry32 } from './rng';
import type { Inventory } from './state';
import { MAX_SHIELDS, newStreak, type StreakEvent } from './streak';
import type { CollectibleSet, Cosmetic } from './types';
import { newWallet } from './wallet';

const SETS: CollectibleSet[] = [
  { id: 'a', items: ['a1', 'a2', 'a3'], decoration: 'scene.a' },
  { id: 'b', items: ['b1', 'b2'], decoration: 'scene.b' },
];
const inv = (over: Partial<Inventory> = {}): Inventory => ({ ...newInventory('c'), ...over });
const chest = (over: Partial<ChestInput> = {}): ChestInput => ({
  source: 'daily',
  tier: 'bronze',
  inventory: inv(),
  sets: SETS,
  shields: 0,
  rng: mulberry32(1),
  ...over,
});
const bank = () => ({ streak: newStreak('c'), wallet: newWallet('c'), inventory: inv() });
// 2026-11-02 is a Monday.
const MON = '2026-11-02';

describe('activeSet', () => {
  it('is the first set with something left', () => {
    expect(activeSet(inv(), SETS)?.id).toBe('a');
    expect(activeSet(inv({ items: ['a1', 'a2', 'a3'] }), SETS)?.id).toBe('b');
  });
  it('is nothing once all are complete', () => {
    expect(activeSet(inv({ items: ['a1', 'a2', 'a3', 'b1', 'b2'] }), SETS)).toBeUndefined();
  });
});

describe('fillChest', () => {
  it('every chest pays something, across many rolls and states', () => {
    for (let seed = 0; seed < 500; seed++) {
      for (const items of [[], ['a1', 'a2', 'a3', 'b1', 'b2']]) {
        const { reward } = fillChest(chest({ rng: mulberry32(seed), inventory: inv({ items }) }));
        expect(reward.coins > 0 || reward.itemId !== undefined || reward.shield === true).toBe(
          true,
        );
      }
    }
  });
  it('never takes anything away', () => {
    for (let seed = 0; seed < 300; seed++) {
      const before = inv({ items: ['a1'] });
      const { inventory } = fillChest(chest({ rng: mulberry32(seed), inventory: before }));
      expect(inventory.items).toEqual(expect.arrayContaining(before.items));
    }
  });
  it('a guarantee gives something new', () => {
    for (let seed = 0; seed < 100; seed++) {
      const { reward } = fillChest(
        chest({
          guarantee: 'item',
          rng: mulberry32(seed),
          inventory: inv({ items: ['a1', 'a2'] }),
        }),
      );
      expect(reward.itemId).toBe('a3');
      expect(reward.duplicate).toBeUndefined();
    }
  });
  it('a duplicate pays coins and counts toward pity', () => {
    const items = ['a1', 'a2'];
    for (let seed = 0; seed < 300; seed++) {
      const out = fillChest(chest({ rng: mulberry32(seed), inventory: inv({ items }) }));
      if (out.reward.duplicate) {
        expect(out.reward.coins).toBe(DUPLICATE_COINS);
        expect(out.inventory.dupesInARow).toBe(1);
        return;
      }
    }
    throw new Error('no duplicate in sample');
  });
  it('never gives a third duplicate in a row', () => {
    for (let seed = 0; seed < 300; seed++) {
      const start = inv({ items: ['a1', 'a2'], dupesInARow: 2 });
      const { reward, inventory } = fillChest(chest({ rng: mulberry32(seed), inventory: start }));
      expect(reward.duplicate).toBeUndefined();
      if (reward.itemId) {
        expect(reward.itemId).toBe('a3');
        expect(inventory.dupesInARow).toBe(0);
      }
    }
  });
  it('finishing a set names it, adds its decoration, and moves to the next', () => {
    const { reward, inventory } = fillChest(
      chest({ guarantee: 'item', inventory: inv({ items: ['a1', 'a2'] }) }),
    );
    expect(reward.setCompleted).toBe('a');
    expect(inventory.items).toContain('scene.a');
    expect(activeSet(inventory, SETS)?.id).toBe('b');
  });
  it('gives coins when every set is complete', () => {
    const items = ['a1', 'a2', 'a3', 'b1', 'b2'];
    const { reward } = fillChest(chest({ guarantee: 'item', inventory: inv({ items }) }));
    expect(reward.coins).toBe(CHEST_COINS.bronze);
    expect(reward.itemId).toBeUndefined();
  });
  it('a perfect week pays coins and a new item', () => {
    const { reward } = fillChest(chest({ tier: 'perfect' }));
    expect(reward.coins).toBe(CHEST_COINS.perfect);
    expect(reward.itemId).toBeDefined();
    expect(reward.duplicate).toBeUndefined();
  });
  it('sometimes holds a shield, but never past the cap', () => {
    const rolls = Array.from({ length: 2000 }, (_, seed) => seed);
    const got = rolls.filter((seed) => fillChest(chest({ rng: mulberry32(seed) })).reward.shield);
    expect(got.length).toBeGreaterThan(40);
    expect(got.length).toBeLessThan(200);
    for (const seed of got) {
      const full = fillChest(chest({ rng: mulberry32(seed), shields: MAX_SHIELDS }));
      expect(full.reward.shield).toBeUndefined();
    }
  });
  it('holds no shield when shields are held back for day 7', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const out = fillChest(chest({ rng: mulberry32(seed), allowShield: false }));
      expect(out.reward.shield).toBeUndefined();
      expect(out.reward.coins > 0 || out.reward.itemId !== undefined).toBe(true);
    }
  });
  it('a cosmetic guarantee does not duplicate an owned item', () => {
    const { inventory } = fillChest(
      chest({ guarantee: { cosmetic: 'x' }, inventory: inv({ items: ['x'] }) }),
    );
    expect(inventory.items).toEqual(['x']);
  });
});

describe('banking chests', () => {
  it('pays coins now and queues the chest', () => {
    const out = bankChest(
      bank(),
      { source: 'daily', tier: 'perfect', sets: SETS, rng: mulberry32(1) },
      5,
    );
    expect(out.wallet.coins).toBe(CHEST_COINS.perfect);
    expect(out.wallet.lifetimeCoins).toBe(CHEST_COINS.perfect);
    expect(out.inventory.unopened).toHaveLength(1);
  });
  it('banks a chest shield onto the streak, as earned and not parent-granted', () => {
    const seed = Array.from({ length: 500 }, (_, s) => s).find(
      (s) => fillChest(chest({ rng: mulberry32(s) })).reward.shield,
    );
    const out = bankChest(
      bank(),
      { source: 'daily', tier: 'bronze', sets: SETS, rng: mulberry32(seed as number) },
      5,
    );
    expect(out.streak.shields).toBe(1);
    expect(out.streak.parentShields).toBe(0);
  });
  it('opening shows the oldest and changes nothing else', () => {
    const inventory = inv({
      items: ['a1'],
      unopened: [
        { source: 'daily', tier: 'bronze', coins: 5 },
        { source: 'missions', tier: 'silver', coins: 10 },
      ],
    });
    const { reward, inventory: next } = openNextChest(inventory, 1);
    expect(reward?.source).toBe('daily');
    expect(next.unopened).toHaveLength(1);
    expect(next.items).toEqual(['a1']);
  });
});

describe('quest chests', () => {
  const input = (over = {}) => ({
    ...bank(),
    childId: 'c',
    date: MON,
    dayNumber: 5,
    events: [] as StreakEvent[],
    sets: SETS,
    firstAccessory: 'bow',
    at: 1,
    ...over,
  });

  it('day 1 always holds a collectible', () => {
    for (const date of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-12-25']) {
      const out = bankQuestChests(input({ dayNumber: 1, date }));
      expect(out.inventory.unopened[0]?.itemId).toMatch(/^a/);
      expect(out.inventory.items).toHaveLength(1);
    }
  });
  it('day 2 always holds the first accessory, already worn', () => {
    const out = bankQuestChests(input({ dayNumber: 2 }));
    expect(out.inventory.unopened[0]?.itemId).toBe('bow');
    expect(out.inventory.items).toContain('bow');
    expect(out.inventory.mascotEquipped['accessory']).toBe('bow');
  });
  it('day 2 leaves a chosen accessory on', () => {
    const inventory = inv({ mascotEquipped: { accessory: 'scarf' } });
    const out = bankQuestChests(input({ dayNumber: 2, inventory }));
    expect(out.inventory.mascotEquipped['accessory']).toBe('scarf');
  });
  it('gives one daily chest a day, however often it is asked', () => {
    const once = bankQuestChests(input());
    const twice = bankQuestChests({ ...input(), ...once });
    expect(twice.inventory.unopened).toHaveLength(1);
    expect(twice.wallet.coins).toBe(once.wallet.coins);
  });
  it('the same day gives the same chest', () => {
    expect(bankQuestChests(input()).inventory.unopened).toEqual(
      bankQuestChests(input()).inventory.unopened,
    );
  });
  it('no chest in the first six days holds a shield', () => {
    for (let n = 0; n < 500; n++) {
      const date = addDays(MON, n);
      for (const dayNumber of [3, 4, 5, 6]) {
        const out = bankQuestChests(input({ date, dayNumber }));
        expect(out.streak.shields).toBe(0);
        const bonus = bankMissionChest(bank(), {
          childId: 'c',
          date,
          dayNumber,
          sets: SETS,
          at: 1,
        });
        expect(bonus.streak.shields).toBe(0);
      }
    }
  });
  it('a perfect week upgrades the chest', () => {
    const out = bankQuestChests(input({ events: [{ type: 'perfect-week', weekOf: MON }] }));
    expect(out.inventory.unopened[0]?.tier).toBe('perfect');
  });
  it('a milestone adds a second chest with something new', () => {
    const events: StreakEvent[] = [{ type: 'milestone', days: 3, isNewBest: true }];
    const out = bankQuestChests(input({ events }));
    expect(out.inventory.unopened).toHaveLength(2);
    expect(out.inventory.unopened[1]?.source).toBe('milestone');
    expect(out.inventory.unopened[1]?.itemId).toBeDefined();
    expect(out.inventory.unopened[1]?.duplicate).toBeUndefined();
  });
  it('the missions chest comes once a day', () => {
    const args = { childId: 'c', date: MON, dayNumber: 5, sets: SETS, at: 1 };
    const once = bankMissionChest(bank(), args);
    expect(once.inventory.unopened[0]?.source).toBe('missions');
    expect(bankMissionChest(once, args)).toBe(once);
  });
});

describe('the week', () => {
  const streak = (countedDates: string[], excusedDates: string[] = []) => ({
    ...newStreak('c'),
    countedDates,
    excusedDates,
  });
  it('tiers rise with days done', () => {
    expect([1, 2, 3, 5, 6, 7].map(tierForDays)).toEqual([
      'bronze',
      'bronze',
      'silver',
      'silver',
      'gold',
      'gold',
    ]);
  });
  it('counts only this week, and parent-excused days count', () => {
    const s = streak(['2026-10-31', '2026-11-02', '2026-11-03'], ['2026-11-04']);
    expect(chestTierToday(s, '2026-11-04')).toBe('silver');
  });
  it('shows tomorrow as a step up when it is one', () => {
    expect(chestTierTomorrow(streak([MON, '2026-11-03']), '2026-11-03')).toBe('silver');
  });
  it('starts over on Monday', () => {
    const week = ['02', '03', '04', '05', '06', '07', '08'].map((d) => `2026-11-${d}`);
    expect(chestTierTomorrow(streak(week), '2026-11-08')).toBe('bronze');
  });
  it('the strip runs Monday to Sunday and never marks a past gap as anything sad', () => {
    const strip = weekStrip(streak(['2026-11-03'], ['2026-11-04']), '2026-11-05');
    expect(strip.map((d) => d.mark)).toEqual([
      'past',
      'done',
      'excused',
      'today',
      'open',
      'open',
      'open',
    ]);
    expect(strip[0]?.date).toBe(MON);
  });
  it('a quest done today shows as done, not today', () => {
    expect(weekStrip(streak([MON]), MON)[0]?.mark).toBe('done');
  });
});

describe('the shop', () => {
  const hat: Cosmetic = { id: 'hat', slot: 'hat', price: 30 };
  const rich = { ...newWallet('c'), coins: 50, lifetimeCoins: 80 };

  it('buying spends coins, keeps lifetime, and wears the item', () => {
    const out = buyCosmetic(rich, inv(), hat, 1);
    expect(out?.wallet.coins).toBe(20);
    expect(out?.wallet.lifetimeCoins).toBe(80);
    expect(out?.inventory.items).toContain('hat');
    expect(out?.inventory.mascotEquipped['hat']).toBe('hat');
  });
  it('cannot be bought without enough coins', () => {
    expect(buyCosmetic({ ...rich, coins: 29 }, inv(), hat, 1)).toBeUndefined();
  });
  it('cannot charge twice for something owned', () => {
    expect(buyCosmetic(rich, inv({ items: ['hat'] }), hat, 1)).toBeUndefined();
  });
  it('toggling wears and removes, and never loses the item', () => {
    const owned = inv({ items: ['hat'] });
    const on = toggleCosmetic(owned, hat, 1);
    expect(on.mascotEquipped['hat']).toBe('hat');
    const off = toggleCosmetic(on, hat, 2);
    expect(off.mascotEquipped['hat']).toBeUndefined();
    expect(off.items).toEqual(['hat']);
  });
  it('cannot wear something not owned', () => {
    expect(toggleCosmetic(inv(), hat, 1).mascotEquipped).toEqual({});
  });
});
