import type { ReactNode } from 'react';

/**
 * Things the bear can wear, drawn in its style. Keyed by item id, so saved inventories and
 * backups need no change. Backgrounds are round, so they sit behind the bear like a badge.
 */
const INK = '#1d3557';
const S = {
  stroke: INK,
  strokeWidth: 2.5,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;
const LINE = { ...S, fill: 'none' } as const;

const disc = (fill: string) => <circle cx="24" cy="24" r="22" fill={fill} {...S} />;
const star = (x: number, y: number, r: number, fill = '#fff3b0') => (
  <path
    d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`}
    fill={fill}
  />
);
const cloud = (x: number, y: number, s = 1) => (
  <path
    d={`M${x - 8 * s} ${y} C${x - 10 * s} ${y - 5 * s} ${x - 3 * s} ${y - 7 * s} ${x - 1 * s} ${y - 4 * s} C${x + 1 * s} ${y - 9 * s} ${x + 9 * s} ${y - 7 * s} ${x + 8 * s} ${y - 2 * s} C${x + 11 * s} ${y - 1 * s} ${x + 10 * s} ${y + 3 * s} ${x + 7 * s} ${y + 3 * s} H${x - 7 * s} C${x - 10 * s} ${y + 3 * s} ${x - 10 * s} ${y} ${x - 8 * s} ${y} Z`}
    fill="#fff"
    {...S}
    strokeWidth={2}
  />
);

export const WEAR_ART: Record<string, ReactNode> = {
  // Extras
  'accessory.bow': (
    <>
      <path d="M24 24 C16 13 5 13 5 24 C5 35 16 35 24 24 Z" fill="#f28bb0" {...S} />
      <path d="M24 24 C32 13 43 13 43 24 C43 35 32 35 24 24 Z" fill="#f28bb0" {...S} />
      <path d="M10 20 C12 22 12 26 10 28 M38 20 C36 22 36 26 38 28" {...LINE} strokeWidth={1.8} />
      <rect x="20" y="18" width="8" height="12" rx="3" fill="#e0678f" {...S} />
    </>
  ),
  'accessory.sunglasses': (
    <>
      <path d="M5 20 L1 15 M43 20 L47 15" {...LINE} strokeWidth={3} />
      <path d="M20 21 Q24 17 28 21" {...LINE} strokeWidth={3} />
      <rect x="3" y="18" width="18" height="13" rx="5" fill={INK} />
      <rect x="27" y="18" width="18" height="13" rx="5" fill={INK} />
      <path d="M7 22 L11 21 M31 22 L35 21" {...LINE} stroke="#fff" strokeWidth={2} />
    </>
  ),
  'accessory.scarf': (
    <>
      <path d="M30 24 L33 44 L41 42 L37 23 Z" fill="#e76f51" {...S} />
      <path d="M34 34 L39 33 M35 39 L40 38" {...LINE} stroke="#fff" strokeWidth={2} />
      <path d="M4 14 C14 21 34 21 44 14 L44 23 C34 31 14 31 4 23 Z" fill="#e76f51" {...S} />
      <path
        d="M12 19 V27 M20 21 V29 M28 21 V29 M36 19 V27"
        {...LINE}
        stroke="#fff"
        strokeWidth={2}
      />
    </>
  ),
  'accessory.medal': (
    <>
      <path d="M14 3 L22 21 H28 L20 3 Z" fill="#7fd1e8" {...S} />
      <path d="M34 3 L26 21 H20 L28 3 Z" fill="#5b8fd6" {...S} />
      <circle cx="24" cy="31" r="12" fill="#ffb703" {...S} />
      <circle cx="24" cy="31" r="8" fill="none" stroke="#c98500" strokeWidth={2} />
      {star(24, 31, 5, '#fff3b0')}
    </>
  ),

  // Hats
  'hat.cap': (
    <>
      <path d="M8 32 C8 16 34 13 38 30 L46 32 C46 36 38 36 32 35 H8 Z" fill="#5b8fd6" {...S} />
      <path d="M22 17 V33 M12 22 C16 21 20 21 22 22" {...LINE} strokeWidth={2} />
      <circle cx="22" cy="16" r="2.5" fill="#e76f51" {...S} strokeWidth={2} />
    </>
  ),
  'hat.top-hat': (
    <>
      <path d="M13 6 H35 V32 H13 Z" fill={INK} />
      <rect x="13" y="24" width="22" height="6" fill="#e76f51" />
      <ellipse cx="24" cy="33" rx="20" ry="5" fill={INK} />
      <path d="M17 9 V22" {...LINE} stroke="#5c6670" strokeWidth={2} />
    </>
  ),
  'hat.grad-cap': (
    <>
      <path d="M12 22 V31 C12 36 36 36 36 31 V22" fill={INK} />
      <path d="M2 18 L24 9 L46 18 L24 27 Z" fill={INK} stroke="#3a5a80" strokeWidth={1.5} />
      <path d="M24 18 L39 22 V33" {...LINE} stroke="#ffb703" strokeWidth={2.5} />
      <path d="M36 32 L39 39 L42 32 Z" fill="#ffb703" />
      <circle cx="24" cy="18" r="2" fill="#ffb703" />
    </>
  ),
  'hat.crown': (
    <>
      <path d="M6 36 L10 12 L18 23 L24 8 L30 23 L38 12 L42 36 Z" fill="#ffb703" {...S} />
      <path d="M6 36 H42" {...LINE} />
      <circle cx="10" cy="10" r="3" fill="#e76f51" {...S} strokeWidth={2} />
      <circle cx="24" cy="6" r="3" fill="#7fd1e8" {...S} strokeWidth={2} />
      <circle cx="38" cy="10" r="3" fill="#e76f51" {...S} strokeWidth={2} />
      <circle cx="24" cy="28" r="3" fill="#8fe3a8" {...S} strokeWidth={2} />
    </>
  ),

  // Backgrounds
  'background.rainbow': (
    <>
      {disc('#dff3fa')}
      <g fill="none" strokeWidth={4.2}>
        <path d="M6 36 A18 18 0 0 1 42 36" stroke="#e76f51" />
        <path d="M10 36 A14 14 0 0 1 38 36" stroke="#ffb703" />
        <path d="M14 36 A10 10 0 0 1 34 36" stroke="#8fe3a8" />
        <path d="M18 36 A6 6 0 0 1 30 36" stroke="#7fd1e8" />
      </g>
      {cloud(9, 37, 0.7)}
      {cloud(39, 37, 0.7)}
    </>
  ),
  'background.sunny-sky': (
    <>
      {disc('#bfe7f5')}
      <circle cx="31" cy="17" r="7" fill="#ffb703" {...S} />
      <path d="M31 5 V7 M41 9 L39.5 10.5 M43 17 H41" {...LINE} stroke="#ffb703" strokeWidth={2.5} />
      {cloud(18, 30, 1)}
    </>
  ),
  'background.night-sky': (
    <>
      {disc('#2b3f6b')}
      <path
        d="M28 10 C21 11 17 17 17 23 C17 30 23 35 30 35 C33 35 35 34 37 33 C29 32 25 27 25 21 C25 17 26 13 28 10 Z"
        fill="#fff3b0"
        {...S}
      />
      {star(13, 14, 3)}
      {star(36, 18, 2.5)}
      {star(12, 32, 2)}
      {star(34, 39, 2)}
    </>
  ),
  'background.rocket': (
    <>
      {disc('#2b3f6b')}
      {star(11, 13, 2.2)}
      {star(38, 34, 2.2)}
      <path d="M19 30 L13 36 L17 37 M29 30 L35 36 L31 37" fill="#e76f51" {...S} />
      <path d="M21 36 L24 44 L27 36 Z" fill="#ffb703" {...S} strokeWidth={2} />
      <path d="M24 5 C31 11 31 25 29 35 H19 C17 25 17 11 24 5 Z" fill="#fff" {...S} />
      <circle cx="24" cy="19" r="3.5" fill="#7fd1e8" {...S} strokeWidth={2} />
    </>
  ),
  'scene.forest': (
    <>
      {disc('#dff3fa')}
      <path d="M2.8 30 H45.2 A22 22 0 0 1 2.8 30 Z" fill="#8fe3a8" />
      <path d="M15 8 L24 22 H19 L26 32 H4 L11 22 H6 Z" fill="#4caf7a" {...S} />
      <path d="M33 14 L40 25 H36 L42 33 H24 L30 25 H26 Z" fill="#3d9a68" {...S} />
      <path d="M15 32 V37 M33 33 V37" {...LINE} stroke="#8b5a2b" strokeWidth={3} />
      <circle cx="24" cy="24" r="22" fill="none" {...S} />
    </>
  ),
  'scene.ocean': (
    <>
      {disc('#bfe7f5')}
      <path
        d="M3 26 C8 22 12 22 16 26 C20 30 24 30 28 26 C32 22 36 22 40 26 C42 28 44 28 45 27 L44 34 A22 22 0 0 1 4 34 Z"
        fill="#5b8fd6"
      />
      <path
        d="M3 26 C8 22 12 22 16 26 C20 30 24 30 28 26 C32 22 36 22 40 26 C42 28 44 28 45 27"
        {...LINE}
      />
      <path
        d="M8 36 C12 33 16 33 20 36 M26 39 C30 36 34 36 38 39"
        {...LINE}
        stroke="#dff3fa"
        strokeWidth={2}
      />
      <circle cx="33" cy="13" r="5" fill="#ffb703" {...S} />
      <circle cx="24" cy="24" r="22" fill="none" {...S} />
    </>
  ),
  'scene.safari': (
    <>
      {disc('#ffe2a8')}
      <circle cx="14" cy="17" r="6" fill="#ffb703" {...S} />
      <path d="M3.9 33 H44.1 A22 22 0 0 1 3.9 33 Z" fill="#e9c27a" />
      <path d="M30 34 C30 26 29 20 27 15" {...LINE} stroke="#8b5a2b" strokeWidth={3.5} />
      <path
        d="M27 15 C22 10 16 11 14 14 C19 13 23 14 27 15 Z M27 15 C30 9 37 8 40 11 C35 11 31 12 27 15 Z M27 15 C33 13 39 16 40 21 C36 18 31 16 27 15 Z M27 15 C24 16 19 20 19 24 C22 20 25 17 27 15 Z"
        fill="#4caf7a"
        {...S}
        strokeWidth={2}
      />
      <circle cx="24" cy="24" r="22" fill="none" {...S} />
    </>
  ),
};

/**
 * Where each thing sits on the bear, as fractions of the bear's box: the centre, and the width.
 * The bear's head fills the box, with its eyes at about 41% down.
 */
export const WEAR_SPOT: Record<string, { x: number; y: number; w: number }> = {
  'accessory.bow': { x: 0.5, y: 0.94, w: 0.36 },
  'accessory.sunglasses': { x: 0.5, y: 0.43, w: 0.66 },
  'accessory.scarf': { x: 0.5, y: 0.97, w: 0.72 },
  'accessory.medal': { x: 0.5, y: 1.0, w: 0.34 },
  'hat.cap': { x: 0.52, y: 0.14, w: 0.56 },
  'hat.top-hat': { x: 0.5, y: 0.12, w: 0.5 },
  'hat.grad-cap': { x: 0.5, y: 0.15, w: 0.58 },
  'hat.crown': { x: 0.5, y: 0.15, w: 0.46 },
};

export const hasWearable = (id: string) => id in WEAR_ART;

export function WearArt({ id, size }: { id: string; size: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      data-wear-art={id}
      className="shrink-0 overflow-visible"
    >
      {WEAR_ART[id]}
    </svg>
  );
}
