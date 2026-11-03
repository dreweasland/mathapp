import type { ReactNode } from 'react';

/**
 * The pictures in word problems, drawn in the bear's style so they look the same on every
 * device. Small and simple on purpose: several of them sit side by side to be counted.
 */
const INK = '#1d3557';
const S = {
  stroke: INK,
  strokeWidth: 2.5,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;
const LINE = { ...S, fill: 'none' } as const;
const eye = (x: number, y: number, r = 2.2) => <circle cx={x} cy={y} r={r} fill={INK} />;

const butterfly = (wing: string, spot: string) => (
  <>
    <path d="M24 22 C18 8 5 8 6 18 C7 26 16 26 24 24 Z" fill={wing} {...S} />
    <path d="M24 22 C30 8 43 8 42 18 C41 26 32 26 24 24 Z" fill={wing} {...S} />
    <path d="M24 25 C18 30 10 38 14 41 C18 43 22 36 24 28 Z" fill={wing} {...S} />
    <path d="M24 25 C30 30 38 38 34 41 C30 43 26 36 24 28 Z" fill={wing} {...S} />
    <circle cx="14" cy="17" r="3" fill={spot} />
    <circle cx="34" cy="17" r="3" fill={spot} />
    <ellipse cx="24" cy="25" rx="2.6" ry="11" fill={INK} />
    <path d="M23 15 L19 8 M25 15 L29 8" {...LINE} strokeWidth={2} />
  </>
);

export const STORY_ART: Record<string, ReactNode> = {
  // Animals to count
  duck: (
    <>
      <path
        d="M8 26 C8 38 18 42 28 42 C38 42 44 36 42 28 C38 30 30 30 26 26 Z"
        fill="#ffd27a"
        {...S}
      />
      <circle cx="30" cy="17" r="9" fill="#ffd27a" {...S} />
      <path d="M38 17 L46 19 L38 22 Z" fill="#f4a261" {...S} strokeWidth={2} />
      {eye(32, 15)}
      <path d="M16 32 C20 30 24 32 26 35" {...LINE} strokeWidth={2} />
    </>
  ),
  bunny: (
    <>
      <ellipse cx="18" cy="12" rx="4" ry="9" fill="#fff" {...S} />
      <ellipse cx="30" cy="12" rx="4" ry="9" fill="#fff" {...S} />
      <ellipse cx="18" cy="12" rx="1.6" ry="5.5" fill="#f6b8c4" />
      <ellipse cx="30" cy="12" rx="1.6" ry="5.5" fill="#f6b8c4" />
      <circle cx="24" cy="30" r="13" fill="#fff" {...S} />
      {eye(19, 28)}
      {eye(29, 28)}
      <path d="M22 33 L24 35 L26 33 Z" fill="#e76f51" />
    </>
  ),
  bird: (
    <>
      <path d="M6 30 L14 26 L12 34 Z" fill="#5b8fd6" {...S} />
      <ellipse cx="24" cy="28" rx="13" ry="11" fill="#7fd1e8" {...S} />
      <path d="M18 27 C22 32 28 32 30 28" {...LINE} strokeWidth={2} />
      <path d="M36 23 L44 25 L36 28 Z" fill="#ffb703" {...S} strokeWidth={2} />
      {eye(31, 22)}
      <path d="M20 39 V44 M27 39 V44" {...LINE} strokeWidth={2} />
    </>
  ),
  frog: (
    <>
      <circle cx="15" cy="16" r="6" fill="#8fe3a8" {...S} />
      <circle cx="33" cy="16" r="6" fill="#8fe3a8" {...S} />
      <ellipse cx="24" cy="30" rx="18" ry="12" fill="#8fe3a8" {...S} />
      {eye(15, 16, 2.6)}
      {eye(33, 16, 2.6)}
      <path d="M15 31 Q24 37 33 31" {...LINE} />
    </>
  ),
  fish: (
    <>
      <path d="M34 24 L45 15 L45 33 Z" fill="#f4a261" {...S} />
      <ellipse cx="21" cy="24" rx="16" ry="11" fill="#f4a261" {...S} />
      <path d="M24 14 C21 20 21 28 24 34" {...LINE} strokeWidth={2} />
      {eye(12, 21)}
    </>
  ),
  squirrel: (
    <>
      <path
        d="M30 40 C40 40 46 30 42 20 C40 12 32 8 28 14 C34 16 38 22 34 30 Z"
        fill="#c98b53"
        {...S}
      />
      <ellipse cx="22" cy="32" rx="10" ry="10" fill="#d99c63" {...S} />
      <circle cx="17" cy="18" r="8" fill="#d99c63" {...S} />
      <path d="M12 12 L13 6 L17 10 Z" fill="#d99c63" {...S} strokeWidth={2} />
      {eye(14, 17)}
      <circle cx="10" cy="20" r="1.6" fill={INK} />
    </>
  ),
  cat: (
    <>
      <path d="M9 18 L11 6 L19 13 Z M39 18 L37 6 L29 13 Z" fill="#9aa3ad" {...S} />
      <circle cx="24" cy="27" r="16" fill="#9aa3ad" {...S} />
      {eye(18, 25)}
      {eye(30, 25)}
      <path d="M22 30 L24 32 L26 30 Z" fill="#e76f51" />
      <path d="M17 31 L8 29 M17 33 L8 35 M31 31 L40 29 M31 33 L40 35" {...LINE} strokeWidth={1.4} />
    </>
  ),
  dog: (
    <>
      <path d="M10 12 C4 14 4 28 9 31 C13 28 14 18 14 14 Z" fill="#8b5a2b" {...S} />
      <path d="M38 12 C44 14 44 28 39 31 C35 28 34 18 34 14 Z" fill="#8b5a2b" {...S} />
      <circle cx="24" cy="26" r="15" fill="#d99c63" {...S} />
      <ellipse cx="24" cy="32" rx="7" ry="5.5" fill="#f4dcc0" />
      {eye(18, 23)}
      {eye(30, 23)}
      <ellipse cx="24" cy="29.5" rx="3" ry="2.2" fill={INK} />
      <path d="M24 32 V34 M21 35 Q24 37 27 35" {...LINE} strokeWidth={1.8} />
    </>
  ),
  hen: (
    <>
      <path d="M14 10 C14 6 18 6 19 9 C20 5 24 6 23 10" fill="#e76f51" {...S} strokeWidth={2} />
      <path
        d="M8 24 C6 34 14 42 26 42 C36 42 42 36 42 28 C38 28 34 24 34 18 Z"
        fill="#fff"
        {...S}
      />
      <circle cx="19" cy="18" r="8" fill="#fff" {...S} />
      <path d="M11 18 L5 20 L11 22 Z" fill="#ffb703" {...S} strokeWidth={2} />
      <path d="M14 22 C14 25 16 26 17 25" fill="#e76f51" />
      {eye(17, 16)}
    </>
  ),
  chick: (
    <>
      <circle cx="24" cy="28" r="14" fill="#ffd27a" {...S} />
      <path d="M22 12 C22 8 26 8 26 12" {...LINE} strokeWidth={2} />
      {eye(19, 25)}
      {eye(29, 25)}
      <path d="M21 30 L24 34 L27 30 Z" fill="#f4a261" {...S} strokeWidth={1.8} />
      <path d="M19 42 V45 M29 42 V45" {...LINE} stroke="#f4a261" strokeWidth={2.5} />
    </>
  ),
  'butterfly-red': butterfly('#e76f51', '#ffd27a'),
  'butterfly-blue': butterfly('#5b8fd6', '#bfe7f5'),

  // Things to measure
  pencil: (
    <>
      <path d="M8 30 L34 4 L44 14 L18 40 Z" fill="#ffb703" {...S} />
      <path d="M8 30 L18 40 L4 44 Z" fill="#f4dcc0" {...S} />
      <path d="M5 41 L4 44 L7 43 Z" fill={INK} />
      <path d="M34 4 L44 14 L40 18 L30 8 Z" fill="#f6b8c4" {...S} />
    </>
  ),
  crayon: (
    <>
      <path d="M12 30 L32 10 L42 20 L22 40 Z" fill="#5b8fd6" {...S} />
      <path d="M12 30 L22 40 L8 42 L6 36 Z" fill="#5b8fd6" {...S} />
      <path d="M18 24 L28 34 M26 16 L36 26" {...LINE} stroke="#fff" strokeWidth={2.5} />
    </>
  ),
  worm: (
    <>
      <path
        d="M6 32 C10 22 16 22 20 30 C24 38 30 38 34 28 C36 22 40 20 43 22"
        {...LINE}
        stroke={INK}
        strokeWidth={9}
      />
      <path
        d="M6 32 C10 22 16 22 20 30 C24 38 30 38 34 28 C36 22 40 20 43 22"
        {...LINE}
        stroke="#f6a5b5"
        strokeWidth={5}
      />
      {eye(42, 21, 1.6)}
    </>
  ),
  snake: (
    <>
      <path
        d="M4 36 C10 26 18 26 22 34 C26 42 34 40 36 30 C37 24 40 20 44 20"
        {...LINE}
        stroke={INK}
        strokeWidth={10}
      />
      <path
        d="M4 36 C10 26 18 26 22 34 C26 42 34 40 36 30 C37 24 40 20 44 20"
        {...LINE}
        stroke="#5aa469"
        strokeWidth={6}
      />
      {eye(42, 18, 1.6)}
      <path d="M46 20 L47 22 M46 20 L48 19" {...LINE} stroke="#e76f51" strokeWidth={1.4} />
    </>
  ),
  ribbon: (
    <>
      <path
        d="M4 22 C12 14 20 30 28 22 C34 16 40 24 44 20 L44 28 C40 32 34 24 28 30 C20 38 12 22 4 30 Z"
        fill="#f28bb0"
        {...S}
      />
    </>
  ),

  // Two-step stories
  stickers: (
    <path
      d="M24 5 L29.5 17.5 L43 18.8 L32.8 27.8 L35.8 41 L24 34 L12.2 41 L15.2 27.8 L5 18.8 L18.5 17.5 Z"
      fill="#ffb703"
      {...S}
    />
  ),
  marbles: (
    <>
      <path d="M12 12 H36 V38 C36 42 33 44 30 44 H18 C15 44 12 42 12 38 Z" fill="#dff3fa" {...S} />
      <path d="M10 12 H38" {...LINE} strokeWidth={3} />
      <circle cx="19" cy="37" r="4.5" fill="#e76f51" {...S} strokeWidth={2} />
      <circle cx="29" cy="37" r="4.5" fill="#5b8fd6" {...S} strokeWidth={2} />
      <circle cx="24" cy="29" r="4.5" fill="#8fe3a8" {...S} strokeWidth={2} />
    </>
  ),
  books: (
    <>
      <rect x="6" y="10" width="9" height="32" rx="1.5" fill="#e76f51" {...S} />
      <rect x="15" y="14" width="9" height="28" rx="1.5" fill="#5b8fd6" {...S} />
      <path d="M26 16 L34 13 L42 40 L34 43 Z" fill="#8fe3a8" {...S} />
      <path d="M4 42 H44" {...LINE} />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="10" width="40" height="26" rx="5" fill="#ffb703" {...S} />
      <rect x="9" y="15" width="8" height="8" rx="1.5" fill="#dff3fa" {...S} strokeWidth={2} />
      <rect x="20" y="15" width="8" height="8" rx="1.5" fill="#dff3fa" {...S} strokeWidth={2} />
      <rect x="31" y="15" width="8" height="8" rx="1.5" fill="#dff3fa" {...S} strokeWidth={2} />
      <circle cx="13" cy="37" r="4.5" fill={INK} />
      <circle cx="35" cy="37" r="4.5" fill={INK} />
      <path d="M4 28 H44" {...LINE} strokeWidth={2} />
    </>
  ),
  'apple-bags': (
    <>
      <path
        d="M24 14 C18 8 6 12 8 26 C10 38 18 44 24 40 C30 44 38 38 40 26 C42 12 30 8 24 14 Z"
        fill="#e76f51"
        {...S}
      />
      <path d="M24 14 C24 9 26 6 29 4" {...LINE} stroke="#8b5a2b" strokeWidth={2.5} />
      <path
        d="M26 10 C30 6 36 7 37 10 C33 12 29 12 26 10 Z"
        fill="#8fe3a8"
        {...S}
        strokeWidth={2}
      />
      <path d="M14 20 C13 23 13 26 14 28" {...LINE} stroke="#fff" strokeWidth={2.5} />
    </>
  ),
  'egg-boxes': (
    <>
      <path d="M4 26 H44 L40 38 H8 Z" fill="#c9b6a0" {...S} />
      <ellipse cx="13" cy="22" rx="5.5" ry="7" fill="#fff" {...S} />
      <ellipse cx="24" cy="22" rx="5.5" ry="7" fill="#fff" {...S} />
      <ellipse cx="35" cy="22" rx="5.5" ry="7" fill="#fff" {...S} />
    </>
  ),
  'share-cookies': (
    <>
      <circle cx="24" cy="24" r="18" fill="#e0a96d" {...S} />
      <circle cx="17" cy="18" r="2.6" fill="#6b4226" />
      <circle cx="29" cy="15" r="2.4" fill="#6b4226" />
      <circle cx="31" cy="28" r="2.8" fill="#6b4226" />
      <circle cx="19" cy="31" r="2.4" fill="#6b4226" />
      <circle cx="24" cy="23" r="2" fill="#6b4226" />
    </>
  ),
  'team-seats': (
    <>
      <path d="M14 6 H32 C34 6 35 7 35 9 V26 H13 V9 C13 7 14 6 14 6 Z" fill="#5b8fd6" {...S} />
      <rect x="10" y="26" width="28" height="7" rx="2" fill="#7fd1e8" {...S} />
      <path d="M14 33 V44 M34 33 V44" {...LINE} strokeWidth={3} />
    </>
  ),

  // Times of day
  breakfast: (
    <>
      <path d="M4 22 H44 C44 34 36 42 24 42 C12 42 4 34 4 22 Z" fill="#7fd1e8" {...S} />
      <path
        d="M8 22 C12 16 18 18 20 20 C24 14 32 16 34 20 C38 17 42 19 42 22"
        fill="#ffd27a"
        {...S}
        strokeWidth={2}
      />
      <path d="M34 20 L44 6" {...LINE} strokeWidth={3} />
    </>
  ),
  'school-bus': (
    <>
      <rect x="4" y="10" width="40" height="26" rx="5" fill="#ffb703" {...S} />
      <rect x="9" y="15" width="8" height="8" rx="1.5" fill="#dff3fa" {...S} strokeWidth={2} />
      <rect x="20" y="15" width="8" height="8" rx="1.5" fill="#dff3fa" {...S} strokeWidth={2} />
      <rect x="31" y="15" width="8" height="8" rx="1.5" fill="#dff3fa" {...S} strokeWidth={2} />
      <circle cx="13" cy="37" r="4.5" fill={INK} />
      <circle cx="35" cy="37" r="4.5" fill={INK} />
      <path d="M8 29 H40" {...LINE} stroke={INK} strokeWidth={2} />
    </>
  ),
  sunrise: (
    <>
      <path d="M8 34 A16 16 0 0 1 40 34 Z" fill="#ffb703" {...S} />
      <path
        d="M24 8 V13 M9 15 L12.5 18.5 M39 15 L35.5 18.5 M3 26 H8 M45 26 H40"
        {...LINE}
        stroke="#f4a261"
        strokeWidth={3}
      />
      <path d="M2 34 H46 M8 40 H40" {...LINE} />
    </>
  ),
  dinner: (
    <>
      <circle cx="24" cy="26" r="16" fill="#fff" {...S} />
      <circle cx="24" cy="26" r="10" fill="#dff3fa" {...S} strokeWidth={2} />
      <path
        d="M4 10 V20 C4 22 6 23 6 23 V42 M8 10 V20 C8 22 6 23 6 23 M44 10 C40 12 40 22 44 24 V42"
        {...LINE}
        strokeWidth={2.5}
      />
      <circle cx="21" cy="24" r="3" fill="#8fe3a8" />
      <circle cx="27" cy="28" r="3" fill="#e76f51" />
    </>
  ),
  bedtime: (
    <>
      <path d="M4 14 V42 M44 30 V42" {...LINE} strokeWidth={3} />
      <rect x="4" y="28" width="40" height="8" fill="#7fd1e8" {...S} />
      <ellipse cx="12" cy="24" rx="6" ry="4" fill="#fff" {...S} />
      <path d="M18 28 C20 22 38 22 42 28 Z" fill="#5b8fd6" {...S} />
      <path d="M30 6 h6 l-6 6 h6" {...LINE} strokeWidth={2} />
    </>
  ),
  stars: (
    <>
      <circle cx="24" cy="24" r="21" fill="#2b3f6b" {...S} />
      <path
        d="M27 10 C20 11 16 17 16 23 C16 30 22 35 29 35 C32 35 34 34 36 33 C28 32 24 27 24 21 C24 17 25 13 27 10 Z"
        fill="#fff3b0"
        {...S}
      />
      <circle cx="12" cy="15" r="1.8" fill="#fff3b0" />
      <circle cx="36" cy="16" r="1.5" fill="#fff3b0" />
      <circle cx="13" cy="32" r="1.3" fill="#fff3b0" />
    </>
  ),

  // Things to guess the length of
  paperclip: (
    <>
      <path
        d="M18 40 V12 C18 6 30 6 30 12 V34 C30 38 24 38 24 34 V16"
        {...LINE}
        stroke={INK}
        strokeWidth={6.5}
      />
      <path
        d="M18 40 V12 C18 6 30 6 30 12 V34 C30 38 24 38 24 34 V16"
        {...LINE}
        stroke="#c5cdd8"
        strokeWidth={3}
      />
    </>
  ),
  book: (
    <>
      <rect x="10" y="6" width="28" height="36" rx="3" fill="#e76f51" {...S} />
      <path d="M15 6 V42" {...LINE} />
      <rect x="20" y="14" width="13" height="6" rx="1.5" fill="#fff" />
    </>
  ),
};

/** The animals in each add, take-away or put-together story: one kind, or one per group. */
export const SCENE_ART: Record<string, { first: string; second: string }> = {
  ducks: { first: 'duck', second: 'duck' },
  bunnies: { first: 'bunny', second: 'bunny' },
  birds: { first: 'bird', second: 'bird' },
  frogs: { first: 'frog', second: 'frog' },
  fish: { first: 'fish', second: 'fish' },
  squirrels: { first: 'squirrel', second: 'squirrel' },
  'cats-dogs': { first: 'cat', second: 'dog' },
  'hens-chicks': { first: 'hen', second: 'chick' },
  'red-blue-butterflies': { first: 'butterfly-red', second: 'butterfly-blue' },
};

export function StoryPic({ name, size = 32 }: { name: string; size?: number }) {
  const art = STORY_ART[name];
  if (!art) return null;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      data-story={name}
      className="shrink-0 overflow-visible"
    >
      {art}
    </svg>
  );
}
