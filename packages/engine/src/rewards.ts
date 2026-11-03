import { addDays, weekDays, weekStart } from './dates';
import { hashSeed, mulberry32, type Rng } from './rng';
import type { ChestReward, ChestTier, Inventory, LocalDate, Streak, Wallet } from './state';
import { MAX_SHIELDS, earnShield, type StreakEvent } from './streak';
import type { CollectibleSet, Cosmetic } from './types';
import { buyWithCoins, earnCoins } from './wallet';

export const CHEST_COINS: Record<ChestTier, number> = {
  bronze: 5,
  silver: 10,
  gold: 15,
  perfect: 30,
};
/** Paid with a duplicate, so no chest is ever a letdown. */
export const DUPLICATE_COINS = 5;
/** The brief's first shield comes on day 7; chests hold none before that. */
export const FIRST_SHIELD_DAY = 7;
/** Two duplicates in a row, then the third pull is always new. */
export const PITY_AFTER = 2;

export const newInventory = (childId: string): Inventory => ({
  childId,
  items: [],
  mascotEquipped: {},
  unopened: [],
  dupesInARow: 0,
  updatedAt: 0,
});

/** The first set with anything left to find. */
export function activeSet(
  inventory: Pick<Inventory, 'items'>,
  sets: CollectibleSet[],
): CollectibleSet | undefined {
  return sets.find((s) => s.items.some((id) => !inventory.items.includes(id)));
}

export type DayMark = 'done' | 'excused' | 'today' | 'open' | 'past';

/** Monday to Sunday for the week strip. A new week simply starts empty. */
export function weekStrip(streak: Streak, today: LocalDate): { date: LocalDate; mark: DayMark }[] {
  return weekDays(today).map((date) => {
    if (streak.countedDates.includes(date)) return { date, mark: 'done' };
    if (streak.excusedDates.includes(date)) return { date, mark: 'excused' };
    if (date === today) return { date, mark: 'today' };
    return { date, mark: date < today ? 'past' : 'open' };
  });
}

/** Chests get better through the week, on quests done, and start over each Monday. */
export function tierForDays(daysDone: number): ChestTier {
  if (daysDone >= 6) return 'gold';
  return daysDone >= 3 ? 'silver' : 'bronze';
}

const daysDoneThisWeek = (streak: Streak, date: LocalDate): number => {
  const start = weekStart(date);
  const done = [...streak.countedDates, ...streak.excusedDates];
  return new Set(done.filter((d) => d >= start && d <= date)).size;
};

export const chestTierToday = (streak: Streak, date: LocalDate): ChestTier =>
  tierForDays(daysDoneThisWeek(streak, date));

/** What tomorrow's chest will be, if tomorrow's quest is done. */
export function chestTierTomorrow(streak: Streak, today: LocalDate): ChestTier {
  const tomorrow = addDays(today, 1);
  return tierForDays(daysDoneThisWeek(streak, tomorrow) + 1);
}

export interface ChestInput {
  source: ChestReward['source'];
  tier: ChestTier;
  /** First-week promises and big moments. */
  guarantee?: 'item' | { cosmetic: string } | undefined;
  inventory: Inventory;
  sets: CollectibleSet[];
  shields: number;
  /** False in the first week, because the first shield is day 7's moment. */
  allowShield?: boolean;
  rng: Rng;
}

function pullItem(input: ChestInput, base: ChestReward): { reward: ChestReward; next: Inventory } {
  const { inventory, sets, rng } = input;
  const set = activeSet(inventory, sets);
  const coinsOnly = { reward: base, next: inventory };
  if (!set) return coinsOnly;
  const missing = set.items.filter((id) => !inventory.items.includes(id));
  const certain = input.guarantee === 'item' || inventory.dupesInARow >= PITY_AFTER;
  const itemId = rng.pick(certain ? missing : set.items);
  if (inventory.items.includes(itemId)) {
    return {
      reward: { ...base, itemId, duplicate: true, coins: base.coins + DUPLICATE_COINS },
      next: { ...inventory, dupesInARow: inventory.dupesInARow + 1 },
    };
  }
  const items = [...inventory.items, itemId];
  const finished = set.items.every((id) => items.includes(id));
  const reward: ChestReward = { ...base, itemId };
  if (finished) reward.setCompleted = set.id;
  return {
    reward,
    next: { ...inventory, items: finished ? [...items, set.decoration] : items, dupesInARow: 0 },
  };
}

/**
 * Decides what's inside. The odds are simple and flat: mostly an item from the visible set,
 * sometimes coins, rarely a shield. There are no rarity tiers. Every chest pays something.
 */
export function fillChest(input: ChestInput): { reward: ChestReward; inventory: Inventory } {
  const { source, tier, guarantee, inventory, shields, allowShield = true, rng } = input;
  const base: ChestReward = { source, tier, coins: 0 };
  const bonus: ChestReward = { ...base, coins: CHEST_COINS[tier] };

  if (guarantee && guarantee !== 'item') {
    const items = inventory.items.includes(guarantee.cosmetic)
      ? inventory.items
      : [...inventory.items, guarantee.cosmetic];
    return { reward: { ...base, itemId: guarantee.cosmetic }, inventory: { ...inventory, items } };
  }
  if (guarantee === 'item' || tier === 'perfect') {
    const { reward, next } = pullItem(
      { ...input, guarantee: 'item' },
      tier === 'perfect' ? bonus : base,
    );
    return { reward: reward.itemId || reward.coins ? reward : bonus, inventory: next };
  }
  const roll = rng.int(1, 20);
  if (roll === 1 && allowShield && shields < MAX_SHIELDS) {
    return { reward: { ...base, shield: true }, inventory };
  }
  if (roll <= 13) {
    const { reward, next } = pullItem(input, base);
    return { reward: reward.itemId ? reward : bonus, inventory: next };
  }
  return { reward: bonus, inventory };
}

export interface ChestBank {
  streak: Streak;
  wallet: Wallet;
  inventory: Inventory;
}

/** Banks a chest: coins and shields apply now, and it joins the pile to open. */
export function bankChest(
  bank: ChestBank,
  input: Omit<ChestInput, 'inventory' | 'shields'>,
  at: number,
): ChestBank {
  const { reward, inventory } = fillChest({
    ...input,
    inventory: bank.inventory,
    shields: bank.streak.shields,
  });
  return {
    streak: reward.shield ? earnShield(bank.streak, at) : bank.streak,
    wallet: reward.coins > 0 ? earnCoins(bank.wallet, reward.coins, at) : bank.wallet,
    inventory: { ...inventory, unopened: [...inventory.unopened, reward], updatedAt: at },
  };
}

export interface QuestChestInput extends ChestBank {
  childId: string;
  date: LocalDate;
  /** 1 for the child's first quest. */
  dayNumber: number;
  events: StreakEvent[];
  sets: CollectibleSet[];
  /** The free one promised on day 2. */
  firstAccessory: string;
  at: number;
}

/** Today's chest, once a day, plus a sure collectible on a milestone. */
export function bankQuestChests(input: QuestChestInput): ChestBank {
  const { childId, date, dayNumber, events, sets, firstAccessory, at } = input;
  if (input.inventory.dailyChestDate === date) return input;
  const rng = mulberry32(hashSeed(`${childId}|${date}|chest`));
  const perfect = events.some((e) => e.type === 'perfect-week');
  const firstWeek =
    dayNumber === 1 ? 'item' : dayNumber === 2 ? { cosmetic: firstAccessory } : undefined;
  let bank = bankChest(
    input,
    {
      source: 'daily',
      tier: perfect ? 'perfect' : chestTierToday(input.streak, date),
      guarantee: firstWeek,
      allowShield: dayNumber >= FIRST_SHIELD_DAY,
      sets,
      rng,
    },
    at,
  );
  bank = { ...bank, inventory: { ...bank.inventory, dailyChestDate: date } };
  if (dayNumber === 2) bank = { ...bank, inventory: equipIfEmpty(bank.inventory, firstAccessory) };
  if (events.some((e) => e.type === 'milestone')) {
    bank = bankChest(bank, { source: 'milestone', tier: 'gold', guarantee: 'item', sets, rng }, at);
  }
  return bank;
}

const equipIfEmpty = (inventory: Inventory, id: string): Inventory =>
  inventory.mascotEquipped['accessory']
    ? inventory
    : { ...inventory, mascotEquipped: { ...inventory.mascotEquipped, accessory: id } };

/** All three missions done: one bonus chest a day. */
export function bankMissionChest(
  bank: ChestBank,
  input: {
    childId: string;
    date: LocalDate;
    dayNumber: number;
    sets: CollectibleSet[];
    at: number;
  },
): ChestBank {
  const { childId, date, dayNumber, sets, at } = input;
  if (bank.inventory.bonusChestDate === date) return bank;
  const rng = mulberry32(hashSeed(`${childId}|${date}|bonus-chest`));
  const next = bankChest(
    bank,
    {
      source: 'missions',
      tier: 'silver',
      allowShield: dayNumber >= FIRST_SHIELD_DAY,
      sets,
      rng,
    },
    at,
  );
  return { ...next, inventory: { ...next.inventory, bonusChestDate: date } };
}

export function openNextChest(inventory: Inventory, at: number) {
  const [reward, ...unopened] = inventory.unopened;
  return { reward, inventory: { ...inventory, unopened, updatedAt: at } };
}

/** Coins drop only here, when the child taps buy, and what's bought is theirs for good. */
export function buyCosmetic(
  wallet: Wallet,
  inventory: Inventory,
  cosmetic: Cosmetic,
  at: number,
): { wallet: Wallet; inventory: Inventory } | undefined {
  if (inventory.items.includes(cosmetic.id)) return undefined;
  const paid = buyWithCoins(wallet, cosmetic.price, at);
  if (!paid) return undefined;
  const items = [...inventory.items, cosmetic.id];
  const mascotEquipped = { ...inventory.mascotEquipped, [cosmetic.slot]: cosmetic.id };
  return { wallet: paid, inventory: { ...inventory, items, mascotEquipped, updatedAt: at } };
}

/** Wear something owned, or tap it again to take it off. */
export function toggleCosmetic(inventory: Inventory, cosmetic: Cosmetic, at: number): Inventory {
  if (!inventory.items.includes(cosmetic.id)) return inventory;
  const mascotEquipped = { ...inventory.mascotEquipped };
  if (mascotEquipped[cosmetic.slot] === cosmetic.id) delete mascotEquipped[cosmetic.slot];
  else mascotEquipped[cosmetic.slot] = cosmetic.id;
  return { ...inventory, mascotEquipped, updatedAt: at };
}
