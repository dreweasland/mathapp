import type { ReactNode } from 'react';
import { STORY_ART } from '../visuals/StoryArt';

/**
 * Pictures a grown-up picks: the reward for a goal, and the picture on a cheer. Saved data
 * keeps the emoji it always has; this only changes how it's drawn, in the bear's style.
 */
const INK = '#1d3557';
const S = {
  stroke: INK,
  strokeWidth: 2.5,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;
const LINE = { ...S, fill: 'none' } as const;

const star = (
  <path
    d="M24 5 L29.5 17.5 L43 18.8 L32.8 27.8 L35.8 41 L24 34 L12.2 41 L15.2 27.8 L5 18.8 L18.5 17.5 Z"
    fill="#ffb703"
    {...S}
  />
);

const ART: Record<string, ReactNode> = {
  // Goal rewards
  '🎬': (
    <>
      <rect x="6" y="20" width="36" height="22" rx="2" fill={INK} />
      <path d="M6 12 L40 6 L42 14 L8 20 Z" fill="#fff" {...S} />
      <path d="M14 11 L18 18 M22 9.5 L26 16.5 M30 8 L34 15" {...LINE} strokeWidth={3} />
      <path d="M12 28 H36 M12 34 H28" {...LINE} stroke="#fff" strokeWidth={2.5} />
    </>
  ),
  '🍦': (
    <>
      <path d="M14 22 L24 45 L34 22 Z" fill="#e0a96d" {...S} />
      <path d="M17 27 L29 33 M31 27 L19 33" {...LINE} strokeWidth={1.6} />
      <path
        d="M12 23 C8 16 14 10 18 12 C18 5 30 5 30 12 C34 10 40 16 36 23 Z"
        fill="#f6b8c4"
        {...S}
      />
      <circle cx="24" cy="5" r="3" fill="#e76f51" {...S} strokeWidth={2} />
    </>
  ),
  '🍕': (
    <>
      <path d="M6 10 C18 4 32 4 42 10 L24 44 Z" fill="#ffd27a" {...S} />
      <path d="M6 10 C18 4 32 4 42 10 L40 14 C30 9 18 9 8 14 Z" fill="#e0a96d" {...S} />
      <circle cx="18" cy="20" r="3.5" fill="#e76f51" />
      <circle cx="29" cy="22" r="3.5" fill="#e76f51" />
      <circle cx="23" cy="32" r="3" fill="#e76f51" />
    </>
  ),
  '🏞️': (
    <>
      <rect x="4" y="6" width="40" height="36" rx="5" fill="#bfe7f5" {...S} />
      <circle cx="34" cy="15" r="5" fill="#ffb703" {...S} strokeWidth={2} />
      <path
        d="M4 34 C14 24 24 26 32 32 C36 30 40 30 44 32 V37 C44 40 42 42 39 42 H9 C6 42 4 40 4 37 Z"
        fill="#8fe3a8"
        {...S}
      />
      <path d="M14 30 L18 20 L22 30 Z" fill="#4caf7a" {...S} strokeWidth={2} />
      <path d="M18 30 V34" {...LINE} stroke="#8b5a2b" strokeWidth={2.5} />
    </>
  ),
  '🎮': (
    <>
      <path
        d="M10 16 H38 C43 16 46 22 46 30 C46 37 42 40 38 38 L32 32 H16 L10 38 C6 40 2 37 2 30 C2 22 5 16 10 16 Z"
        fill="#9aa3ad"
        {...S}
      />
      <path d="M13 22 V30 M9 26 H17" {...LINE} strokeWidth={3} />
      <circle cx="33" cy="23" r="2.6" fill="#e76f51" />
      <circle cx="38" cy="28" r="2.6" fill="#5b8fd6" />
    </>
  ),
  '📚': STORY_ART['books'],
  '🧸': (
    <>
      <circle cx="13" cy="9" r="5" fill="#c98b53" {...S} />
      <circle cx="35" cy="9" r="5" fill="#c98b53" {...S} />
      <ellipse cx="24" cy="35" rx="13" ry="10" fill="#c98b53" {...S} />
      <ellipse cx="24" cy="36" rx="6" ry="5" fill="#f4dcc0" />
      <circle cx="24" cy="16" r="11" fill="#d99c63" {...S} />
      <ellipse cx="24" cy="20" rx="5" ry="3.8" fill="#f4dcc0" />
      <circle cx="20" cy="14" r="1.8" fill={INK} />
      <circle cx="28" cy="14" r="1.8" fill={INK} />
      <ellipse cx="24" cy="18.5" rx="2" ry="1.5" fill={INK} />
    </>
  ),
  '🚲': (
    <>
      <circle cx="11" cy="32" r="8" fill="none" {...S} strokeWidth={3} />
      <circle cx="37" cy="32" r="8" fill="none" {...S} strokeWidth={3} />
      <path
        d="M11 32 L19 18 H33 L37 32 M19 18 L25 32 L33 18 M17 13 H23 M33 18 L31 11 H36"
        {...LINE}
        stroke="#e76f51"
        strokeWidth={3}
      />
      <circle cx="25" cy="32" r="2" fill={INK} />
    </>
  ),

  // Cheers
  '🌟': (
    <>
      {star}
      <path
        d="M40 4 V10 M37 7 H43 M7 34 V39 M4.5 36.5 H9.5"
        {...LINE}
        stroke="#ffb703"
        strokeWidth={2.5}
      />
    </>
  ),
  '🎉': (
    <>
      <path d="M6 42 L16 14 L34 32 Z" fill="#ffb703" {...S} />
      <path d="M11 30 L22 38 M13 23 L28 34" {...LINE} stroke="#e76f51" strokeWidth={2.5} />
      <path
        d="M22 12 C24 8 28 8 28 4 M32 18 C36 16 38 20 42 18 M36 8 L40 4"
        {...LINE}
        stroke="#5b8fd6"
        strokeWidth={2.5}
      />
      <circle cx="40" cy="28" r="2.5" fill="#e76f51" />
      <circle cx="30" cy="8" r="2" fill="#8fe3a8" />
    </>
  ),
  '💪': (
    <>
      <path
        d="M8 44 C6 34 8 24 14 18 L16 10 C17 6 23 6 24 10 L24 18 C30 14 40 16 42 26 C44 34 38 42 28 42 Z"
        fill="#f4c99b"
        {...S}
      />
      <path d="M24 18 C22 22 22 26 26 28 M30 30 C34 30 36 28 36 26" {...LINE} strokeWidth={2} />
    </>
  ),
  '❤️': (
    <path
      d="M24 41 C12 32 6 26 6 18 C6 12 10.5 8 16 8 C19.5 8 22.5 10 24 13 C25.5 10 28.5 8 32 8 C37.5 8 42 12 42 18 C42 26 36 32 24 41 Z"
      fill="#e76f51"
      {...S}
    />
  ),
  '👏': (
    <>
      <path
        d="M12 40 C6 34 6 24 12 18 L20 10 C22 8 25 10 23 13 L18 19 L26 11 C28 9 31 11 29 14 L22 22"
        fill="#f4c99b"
        {...S}
      />
      <path
        d="M22 44 C16 40 14 32 18 26 L28 16 C30 14 33 16 31 19 L26 25 L34 18 C36 16 39 18 37 21 L28 30 L36 25 C38 24 40 27 38 29 L30 38 C27 41 25 44 22 44 Z"
        fill="#f4c99b"
        {...S}
      />
      <path
        d="M38 6 L35 11 M44 12 L39 14 M30 4 L30 9"
        {...LINE}
        stroke="#ffb703"
        strokeWidth={2.5}
      />
    </>
  ),
  '🚀': (
    <>
      <path d="M17 32 L10 40 L16 41 M31 32 L38 40 L32 41" fill="#e76f51" {...S} />
      <path d="M20 38 L24 46 L28 38 Z" fill="#ffb703" {...S} strokeWidth={2} />
      <path d="M24 3 C32 10 33 26 30 38 H18 C15 26 16 10 24 3 Z" fill="#fff" {...S} />
      <circle cx="24" cy="19" r="4" fill="#7fd1e8" {...S} strokeWidth={2} />
    </>
  ),
  '🐻': (
    <>
      <circle cx="11" cy="12" r="7" fill="#c98b53" {...S} />
      <circle cx="37" cy="12" r="7" fill="#c98b53" {...S} />
      <circle cx="24" cy="26" r="17" fill="#d99c63" {...S} />
      <ellipse cx="24" cy="32" rx="8" ry="6" fill="#f4dcc0" />
      <circle cx="17" cy="23" r="2.3" fill={INK} />
      <circle cx="31" cy="23" r="2.3" fill={INK} />
      <ellipse cx="24" cy="29.5" rx="3" ry="2.2" fill={INK} />
    </>
  ),
  '🌈': (
    <>
      <g fill="none" strokeWidth={5}>
        <path d="M4 38 A20 20 0 0 1 44 38" stroke="#e76f51" />
        <path d="M9 38 A15 15 0 0 1 39 38" stroke="#ffb703" />
        <path d="M14 38 A10 10 0 0 1 34 38" stroke="#8fe3a8" />
        <path d="M19 38 A5 5 0 0 1 29 38" stroke="#7fd1e8" />
      </g>
      <path
        d="M1 40 C0 36 5 34 7 36 C8 33 14 34 13 38 C16 38 16 42 13 42 H3 C1 42 0 41 1 40 Z"
        fill="#fff"
        {...S}
        strokeWidth={2}
      />
      <path
        d="M35 40 C34 36 39 34 41 36 C42 33 48 34 47 38 C50 38 50 42 47 42 H37 C35 42 34 41 35 40 Z"
        fill="#fff"
        {...S}
        strokeWidth={2}
      />
    </>
  ),
};

export const hasPicture = (value: string) => value in ART;

/** The choices, in order, with words for buttons and lists. Values are what's saved. */
export const GOAL_PICTURES: [value: string, name: string][] = [
  ['🎬', 'movie'],
  ['🍦', 'ice cream'],
  ['🍕', 'pizza'],
  ['🏞️', 'park'],
  ['🎮', 'video game'],
  ['📚', 'books'],
  ['🧸', 'teddy'],
  ['🚲', 'bike'],
];
export const CHEER_PICTURES: [value: string, name: string][] = [
  ['🌟', 'star'],
  ['🎉', 'party'],
  ['💪', 'strong'],
  ['❤️', 'heart'],
  ['👏', 'clapping'],
  ['🚀', 'rocket'],
  ['🐻', 'bear'],
  ['🌈', 'rainbow'],
];
const NAMES = Object.fromEntries([...GOAL_PICTURES, ...CHEER_PICTURES]);
export const pictureName = (value: string) => NAMES[value] ?? value;

/** A goal or cheer picture: drawn when there is a drawing, otherwise the emoji it was saved as. */
export function Picture({ value, size = 32 }: { value: string | undefined; size?: number }) {
  const art = value ? ART[value] : undefined;
  if (!art) {
    return (
      <span aria-hidden="true" style={{ fontSize: size * 0.8, lineHeight: 1 }}>
        {value}
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      data-picture={value}
      className="inline-block shrink-0 overflow-visible align-middle"
    >
      {art}
    </svg>
  );
}
