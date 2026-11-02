import type { CollectibleSet, Cosmetic } from '@mathapp/engine';

interface Art {
  id: string;
  emoji: string;
  name: string;
}

const art = (prefix: string, rows: [string, string][]): Art[] =>
  rows.map(([emoji, name]) => ({
    id: `${prefix}.${name.toLowerCase().replace(/\s/g, '-')}`,
    emoji,
    name,
  }));

const FOREST = art('forest', [
  ['🦊', 'Fox'],
  ['🦝', 'Raccoon'],
  ['🦌', 'Deer'],
  ['🐻', 'Bear'],
  ['🦉', 'Owl'],
  ['🐿️', 'Chipmunk'],
  ['🦔', 'Hedgehog'],
  ['🦡', 'Badger'],
  ['🐗', 'Boar'],
  ['🦇', 'Bat'],
  ['🐺', 'Wolf'],
  ['🐇', 'Rabbit'],
]);
const OCEAN = art('ocean', [
  ['🐙', 'Octopus'],
  ['🐠', 'Clownfish'],
  ['🐬', 'Dolphin'],
  ['🐳', 'Whale'],
  ['🦈', 'Shark'],
  ['🦀', 'Crab'],
  ['🐢', 'Turtle'],
  ['🦑', 'Squid'],
  ['🦞', 'Lobster'],
  ['🐡', 'Pufferfish'],
  ['🦭', 'Seal'],
  ['🐧', 'Penguin'],
]);
const SAFARI = art('safari', [
  ['🦁', 'Lion'],
  ['🐘', 'Elephant'],
  ['🦒', 'Giraffe'],
  ['🦓', 'Zebra'],
  ['🦏', 'Rhino'],
  ['🦛', 'Hippo'],
  ['🐆', 'Leopard'],
  ['🐅', 'Tiger'],
  ['🦍', 'Gorilla'],
  ['🐪', 'Camel'],
  ['🦘', 'Kangaroo'],
  ['🐊', 'Crocodile'],
]);

const SCENES: (Art & { price: number })[] = [
  { id: 'scene.forest', emoji: '🌲', name: 'Forest', price: 0 },
  { id: 'scene.ocean', emoji: '🌊', name: 'Ocean', price: 0 },
  { id: 'scene.safari', emoji: '🌴', name: 'Palm trees', price: 0 },
];

const set = (id: string, items: Art[]): CollectibleSet => ({
  id,
  items: items.map((i) => i.id),
  decoration: `scene.${id}`,
});

/** Played in this order. Finishing one opens the next and adds a scene for the bear. */
export const COLLECTIBLE_SETS: CollectibleSet[] = [
  set('forest', FOREST),
  set('ocean', OCEAN),
  set('safari', SAFARI),
];

type ShopRow = [slot: Cosmetic['slot'], emoji: string, name: string, price: number];

/** A quest pays about 90 coins, so the first item is a day away and the shop lasts about a month. */
const SHOP: ShopRow[] = [
  ['accessory', '🎀', 'Bow', 80],
  ['accessory', '🕶️', 'Sunglasses', 100],
  ['accessory', '🧣', 'Scarf', 150],
  ['accessory', '🏅', 'Medal', 300],
  ['hat', '🧢', 'Cap', 100],
  ['hat', '🎩', 'Top hat', 200],
  ['hat', '🎓', 'Grad cap', 300],
  ['hat', '👑', 'Crown', 500],
  ['background', '🌈', 'Rainbow', 150],
  ['background', '⛅', 'Sunny sky', 150],
  ['background', '🌙', 'Night sky', 250],
  ['background', '🚀', 'Rocket', 400],
];

const shopArt: (Art & Cosmetic)[] = SHOP.map(([slot, emoji, name, price]) => ({
  id: `${slot}.${name.toLowerCase().replace(/\s/g, '-')}`,
  slot,
  emoji,
  name,
  price,
}));

/** Scenes cost nothing and can't be bought: they appear when a collection is finished. */
export const COSMETICS: (Art & Cosmetic)[] = [
  ...shopArt,
  ...SCENES.map((s) => ({ ...s, slot: 'background' as const })),
];

/** Given free on day 2, per the first-week plan. */
export const FIRST_ACCESSORY = 'accessory.bow';

const ALL_ART = [...FOREST, ...OCEAN, ...SAFARI, ...COSMETICS];
const BY_ID = new Map(ALL_ART.map((a) => [a.id, a]));

export const artFor = (id: string): Art | undefined => BY_ID.get(id);
export const cosmeticFor = (id: string) => COSMETICS.find((c) => c.id === id);

/** Spoken names for everything a child can own. */
export const ITEM_NAMES: Record<string, string> = Object.fromEntries(
  ALL_ART.map((a) => [`item.${a.id}`, a.name]),
);
