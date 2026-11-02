/** Each word-problem scene's animals: one emoji, or one per group for "put together" stories. */
export const SCENE_EMOJI: Record<string, { first: string; second: string; tint?: string }> = {
  ducks: { first: '🦆', second: '🦆' },
  bunnies: { first: '🐰', second: '🐰' },
  birds: { first: '🐦', second: '🐦' },
  frogs: { first: '🐸', second: '🐸' },
  fish: { first: '🐟', second: '🐟' },
  squirrels: { first: '🐿️', second: '🐿️' },
  'cats-dogs': { first: '🐱', second: '🐶' },
  'hens-chicks': { first: '🐔', second: '🐥' },
  'red-blue-butterflies': { first: '🦋', second: '🦋', tint: 'hue-rotate(140deg) saturate(1.6)' },
};

export const LENGTH_EMOJI: Record<string, string> = {
  pencil: '✏️',
  crayon: '🖍️',
  worm: '🪱',
  snake: '🐍',
  ribbon: '🎀',
};

/** Story pictures for numbers too big to draw one by one. */
export const STORY_EMOJI: Record<string, string> = {
  stickers: '⭐',
  marbles: '🔮',
  books: '📚',
  bus: '🚌',
  'apple-bags': '🍎',
  'egg-boxes': '🥚',
  'share-cookies': '🍪',
  'team-seats': '💺',
};

export const DAY_EMOJI: Record<string, string> = {
  breakfast: '🥣',
  'school-bus': '🚌',
  sunrise: '🌅',
  dinner: '🍽️',
  bedtime: '🛏️',
  stars: '🌙',
};

export const OBJECT_EMOJI: Record<string, string> = {
  paperclip: '📎',
  crayon: '🖍️',
  pencil: '✏️',
  book: '📕',
};
