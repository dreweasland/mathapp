import type { Wallet } from './state';

export const COINS = {
  correct: 2,
  fastBonus: 1,
  recoveryBonus: 1,
  questComplete: 10,
  challengeComplete: 5,
} as const;

export const newWallet = (childId: string): Wallet => ({
  childId,
  coins: 0,
  lifetimeCoins: 0,
  updatedAt: 0,
});

export interface AnswerCoins {
  correct: boolean;
  fast: boolean;
  /** Right on the second try, after a miss. */
  recovered: boolean;
  mode: 'quest' | 'free';
}

/** A wrong answer earns nothing and costs nothing. Free play pays half, rounded up. */
export function coinsForAnswer({ correct, fast, recovered, mode }: AnswerCoins): number {
  if (!correct) return 0;
  const total =
    COINS.correct + (fast ? COINS.fastBonus : 0) + (recovered ? COINS.recoveryBonus : 0);
  return mode === 'free' ? Math.ceil(total / 2) : total;
}

export function earnCoins(wallet: Wallet, amount: number, at: number): Wallet {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`Coins can only be earned in whole positive amounts: ${amount}`);
  }
  return {
    ...wallet,
    coins: wallet.coins + amount,
    lifetimeCoins: wallet.lifetimeCoins + amount,
    updatedAt: at,
  };
}

export const canAfford = (wallet: Wallet, price: number): boolean => wallet.coins >= price;

/**
 * The only way `coins` goes down, and only for something the child chose to buy.
 * Returns undefined if they can't afford it; `lifetimeCoins` never changes here.
 */
export function buyWithCoins(wallet: Wallet, price: number, at: number): Wallet | undefined {
  if (!Number.isInteger(price) || price <= 0) throw new Error(`Bad price: ${price}`);
  if (!canAfford(wallet, price)) return undefined;
  return { ...wallet, coins: wallet.coins - price, updatedAt: at };
}
