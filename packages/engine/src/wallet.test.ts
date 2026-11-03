import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';
import { buyWithCoins, canAfford, coinsForAnswer, earnCoins, newWallet } from './wallet';

const answer = { correct: true, fast: false, recovered: false, mode: 'quest' } as const;

describe('coinsForAnswer', () => {
  it('pays 2 for a correct answer', () => expect(coinsForAnswer(answer)).toBe(2));
  it('adds 1 for fast', () => expect(coinsForAnswer({ ...answer, fast: true })).toBe(3));
  it('adds 1 for recovering after a miss', () =>
    expect(coinsForAnswer({ ...answer, recovered: true })).toBe(3));
  it('pays nothing for a wrong answer, and never a negative', () =>
    expect(coinsForAnswer({ ...answer, correct: false })).toBe(0));
  it('free play pays less, rounded up to a whole coin', () => {
    expect(coinsForAnswer({ ...answer, mode: 'free' })).toBe(1);
    expect(coinsForAnswer({ ...answer, fast: true, mode: 'free' })).toBe(2);
  });
});

describe('wallet', () => {
  it('earning raises both totals', () => {
    expect(earnCoins(newWallet('c'), 5, 1)).toMatchObject({ coins: 5, lifetimeCoins: 5 });
  });
  it('rejects negative or fractional earnings', () => {
    expect(() => earnCoins(newWallet('c'), -1, 1)).toThrow();
    expect(() => earnCoins(newWallet('c'), 0.5, 1)).toThrow();
  });
  it('buying lowers coins and leaves lifetime alone', () => {
    const w = buyWithCoins(earnCoins(newWallet('c'), 10, 1), 4, 2);
    expect(w).toMatchObject({ coins: 6, lifetimeCoins: 10 });
  });
  it('can spend down to exactly 0', () => {
    expect(buyWithCoins(earnCoins(newWallet('c'), 4, 1), 4, 2)?.coins).toBe(0);
  });
  it('refuses a purchase it cannot cover, and never goes negative', () => {
    const w = earnCoins(newWallet('c'), 3, 1);
    expect(canAfford(w, 4)).toBe(false);
    expect(buyWithCoins(w, 4, 2)).toBeUndefined();
  });
  it('rejects a zero or negative price, which could add coins', () => {
    const w = newWallet('c');
    expect(() => buyWithCoins(w, 0, 1)).toThrow();
    expect(() => buyWithCoins(w, -5, 1)).toThrow();
  });
  it('lifetime only rises over any mix of earning and buying', () => {
    const rng = mulberry32(4);
    let w = newWallet('c');
    let lifetime = 0;
    for (let i = 0; i < 2000; i++) {
      const amount = rng.int(1, 9);
      w = rng.int(0, 1) ? earnCoins(w, amount, i) : (buyWithCoins(w, amount, i) ?? w);
      expect(w.lifetimeCoins).toBeGreaterThanOrEqual(lifetime);
      expect(w.coins).toBeGreaterThanOrEqual(0);
      lifetime = w.lifetimeCoins;
    }
  });
});
