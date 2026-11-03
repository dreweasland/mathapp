import { COLLECTIBLE_SETS } from '@mathapp/content';
import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, hasCritter } from './Critters';

describe('collectible animal drawings', () => {
  it('draws every animal a chest can hold', () => {
    const missing = COLLECTIBLE_SETS.flatMap((set) => set.items).filter((id) => !hasCritter(id));
    expect(missing).toEqual([]);
  });

  it('has no drawing for an animal that no longer exists', () => {
    const items = new Set(COLLECTIBLE_SETS.flatMap((set) => set.items));
    expect(CRITTER_IDS.filter((id) => !items.has(id))).toEqual([]);
  });
});

describe('dress-up drawings', () => {
  it('draws everything the bear can wear, and knows where each one goes', async () => {
    const { COSMETICS } = await import('@mathapp/content');
    const { hasWearable, WEAR_SPOT } = await import('./Wearables');
    expect(COSMETICS.filter((c) => !hasWearable(c.id)).map((c) => c.id)).toEqual([]);
    const unplaced = COSMETICS.filter((c) => c.slot !== 'background' && !WEAR_SPOT[c.id]);
    expect(unplaced.map((c) => c.id)).toEqual([]);
  });
});
