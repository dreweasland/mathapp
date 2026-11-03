import type { ReactNode } from 'react';

/**
 * The collectible animals, drawn in the bear's style: navy outline, flat fills, friendly faces.
 * Keyed by item id, so saved inventories and backups need no change.
 */
const INK = '#1d3557';
const S = {
  stroke: INK,
  strokeWidth: 2.5,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;
const LINE = { ...S, fill: 'none' } as const;

const eyes = (lx: number, rx: number, y: number, r = 2.3) => (
  <>
    <circle cx={lx} cy={y} r={r} fill={INK} />
    <circle cx={rx} cy={y} r={r} fill={INK} />
  </>
);
const eye = (x: number, y: number, r = 2.3) => <circle cx={x} cy={y} r={r} fill={INK} />;
const nose = (x: number, y: number, w = 3, h = 2.2) => (
  <ellipse cx={x} cy={y} rx={w} ry={h} fill={INK} />
);
const smile = (x: number, y: number, w = 4) => (
  <path d={`M${x - w} ${y} Q${x} ${y + w * 0.8} ${x + w} ${y}`} {...LINE} />
);

const BROWN = '#c98b53';
const CREAM = '#f4dcc0';
const GREY = '#a8b3bd';
const ORANGE = '#f4a261';

const ART: Record<string, ReactNode> = {
  // Forest
  'forest.fox': (
    <>
      <path d="M8 5 L19 15 L9 22 Z M40 5 L29 15 L39 22 Z" fill="#e76f51" {...S} />
      <path
        d="M6 18 C6 33 15 43 24 43 C33 43 42 33 42 18 C35 13 13 13 6 18 Z"
        fill={ORANGE}
        {...S}
      />
      <path d="M12 30 C16 38 20 41 24 41 C28 41 32 38 36 30 C31 33 17 33 12 30 Z" fill="#fff" />
      {eyes(17, 31, 25)}
      {nose(24, 32)}
    </>
  ),
  'forest.raccoon': (
    <>
      <path d="M9 18 L11 5 L20 13 Z M39 18 L37 5 L28 13 Z" fill={GREY} {...S} />
      <ellipse cx="24" cy="27" rx="18" ry="15" fill={GREY} {...S} />
      <ellipse cx="24" cy="34" rx="9" ry="6.5" fill="#fff" />
      <path
        d="M7 24 C11 18 19 19 24 23 C29 19 37 18 41 24 C37 30 29 29 24 27 C19 29 11 30 7 24 Z"
        fill={INK}
      />
      <circle cx="16" cy="24" r="2.3" fill="#fff" />
      <circle cx="32" cy="24" r="2.3" fill="#fff" />
      {nose(24, 31)}
    </>
  ),
  'forest.deer': (
    <>
      <path
        d="M16 13 L11 3 M13 8 L7 6 M32 13 L37 3 M35 8 L41 6"
        {...LINE}
        stroke="#8b5a2b"
        strokeWidth={3}
      />
      <ellipse cx="9" cy="18" rx="7" ry="3.5" transform="rotate(-25 9 18)" fill={BROWN} {...S} />
      <ellipse cx="39" cy="18" rx="7" ry="3.5" transform="rotate(25 39 18)" fill={BROWN} {...S} />
      <path
        d="M14 15 C16 10 32 10 34 15 C37 25 31 41 24 43 C17 41 11 25 14 15 Z"
        fill={BROWN}
        {...S}
      />
      <ellipse cx="24" cy="36" rx="6" ry="5" fill={CREAM} />
      {eyes(18.5, 29.5, 23)}
      {nose(24, 35, 3, 2.2)}
      <circle cx="20" cy="15" r="1.4" fill="#fff" />
      <circle cx="28" cy="15" r="1.4" fill="#fff" />
    </>
  ),
  'forest.bear': (
    <>
      <circle cx="11" cy="12" r="7" fill={BROWN} {...S} />
      <circle cx="37" cy="12" r="7" fill={BROWN} {...S} />
      <circle cx="11" cy="12" r="3" fill="#f4c99b" />
      <circle cx="37" cy="12" r="3" fill="#f4c99b" />
      <circle cx="24" cy="26" r="17" fill="#8b5a2b" {...S} />
      <ellipse cx="24" cy="32" rx="8" ry="6" fill={CREAM} />
      {eyes(17, 31, 23)}
      {nose(24, 29.5)}
      {smile(24, 33, 3)}
    </>
  ),
  'forest.owl': (
    <>
      <path d="M9 14 L11 3 L19 10 Z M39 14 L37 3 L29 10 Z" fill="#b5835a" {...S} />
      <ellipse cx="24" cy="27" rx="17" ry="17" fill="#b5835a" {...S} />
      <ellipse cx="24" cy="36" rx="9" ry="7" fill="#e9c9a0" />
      <circle cx="17" cy="21" r="7" fill={CREAM} {...S} />
      <circle cx="31" cy="21" r="7" fill={CREAM} {...S} />
      {eyes(17, 31, 21, 3.4)}
      <circle cx="18" cy="20" r="1" fill="#fff" />
      <circle cx="32" cy="20" r="1" fill="#fff" />
      <path d="M21 27 L24 32 L27 27 Z" fill="#ffb703" {...S} strokeWidth={2} />
      <path d="M20 37 l2 2 l2 -2 l2 2 l2 -2" {...LINE} strokeWidth={1.8} />
    </>
  ),
  'forest.chipmunk': (
    <>
      <circle cx="12" cy="13" r="5" fill={BROWN} {...S} />
      <circle cx="36" cy="13" r="5" fill={BROWN} {...S} />
      <circle cx="24" cy="27" r="16" fill={BROWN} {...S} />
      <path d="M24 11 V21 M19 12 L20 20 M29 12 L28 20" {...LINE} strokeWidth={2.5} />
      <ellipse cx="14.5" cy="32" rx="6" ry="5" fill={CREAM} />
      <ellipse cx="33.5" cy="32" rx="6" ry="5" fill={CREAM} />
      {eyes(18, 30, 25)}
      {nose(24, 30, 2.3, 1.8)}
      <rect x="22" y="33" width="4" height="4" rx="1" fill="#fff" stroke={INK} strokeWidth={1.5} />
    </>
  ),
  'forest.hedgehog': (
    <>
      <path
        d="M24 3 L28 9 L34 5 L35 12 L42 11 L39 18 L46 22 L40 26 L43 33 L36 33 L35 40 L29 37 L24 43 L19 37 L13 40 L12 33 L5 33 L8 26 L2 22 L9 18 L6 11 L13 12 L14 5 L20 9 Z"
        fill="#8b6b4a"
        {...S}
      />
      <ellipse cx="24" cy="28" rx="11" ry="10" fill={CREAM} {...S} />
      {eyes(20, 28, 26)}
      <circle cx="24" cy="31" r="2.6" fill={INK} />
    </>
  ),
  'forest.badger': (
    <>
      <circle cx="10" cy="15" r="4.5" fill={INK} />
      <circle cx="38" cy="15" r="4.5" fill={INK} />
      <ellipse cx="24" cy="27" rx="17" ry="16" fill="#fff" {...S} />
      <ellipse cx="15.5" cy="25" rx="4.5" ry="11" fill={INK} />
      <ellipse cx="32.5" cy="25" rx="4.5" ry="11" fill={INK} />
      <circle cx="16" cy="25" r="1.9" fill="#fff" />
      <circle cx="32" cy="25" r="1.9" fill="#fff" />
      {nose(24, 37, 3.2, 2.3)}
    </>
  ),
  'forest.boar': (
    <>
      <path d="M8 16 L10 5 L18 12 Z M40 16 L38 5 L30 12 Z" fill="#8b6b4a" {...S} />
      <ellipse cx="24" cy="25" rx="17" ry="15" fill="#8b6b4a" {...S} />
      <path d="M16 36 Q12 33 13 27" {...LINE} stroke="#fff" strokeWidth={3} />
      <path d="M32 36 Q36 33 35 27" {...LINE} stroke="#fff" strokeWidth={3} />
      <ellipse cx="24" cy="33" rx="8" ry="6" fill="#e9a07a" {...S} />
      <circle cx="21" cy="33" r="1.6" fill={INK} />
      <circle cx="27" cy="33" r="1.6" fill={INK} />
      {eyes(17, 31, 22)}
    </>
  ),
  'forest.bat': (
    <>
      <path
        d="M19 22 C14 14 7 13 2 17 C6 20 6 26 9 30 C11 27 14 27 17 30 C18 27 19 25 19 22 Z"
        fill="#6b5b73"
        {...S}
      />
      <path
        d="M29 22 C34 14 41 13 46 17 C42 20 42 26 39 30 C37 27 34 27 31 30 C30 27 29 25 29 22 Z"
        fill="#6b5b73"
        {...S}
      />
      <path d="M17 13 L18 4 L22 11 Z M31 13 L30 4 L26 11 Z" fill="#6b5b73" {...S} />
      <ellipse cx="24" cy="25" rx="8" ry="13" fill="#6b5b73" {...S} />
      <circle cx="20.5" cy="19" r="2" fill="#fff" />
      <circle cx="27.5" cy="19" r="2" fill="#fff" />
      <path d="M21 25 L22 27 M27 25 L26 27" {...LINE} stroke="#fff" strokeWidth={1.6} />
    </>
  ),
  'forest.wolf': (
    <>
      <path d="M9 3 L19 14 L8 20 Z M39 3 L29 14 L40 20 Z" fill="#7d8894" {...S} />
      <path
        d="M6 18 C6 32 15 44 24 44 C33 44 42 32 42 18 C35 12 13 12 6 18 Z"
        fill="#7d8894"
        {...S}
      />
      <path d="M14 30 C17 39 21 42 24 42 C27 42 31 39 34 30 C29 33 19 33 14 30 Z" fill="#fff" />
      {eyes(18, 30, 26)}
      {nose(24, 33)}
    </>
  ),
  'forest.rabbit': (
    <>
      <ellipse cx="17" cy="11" rx="4.5" ry="10" fill="#b9a38c" {...S} />
      <ellipse cx="31" cy="11" rx="4.5" ry="10" fill="#b9a38c" {...S} />
      <ellipse cx="17" cy="11" rx="1.8" ry="6" fill="#f6b8c4" />
      <ellipse cx="31" cy="11" rx="1.8" ry="6" fill="#f6b8c4" />
      <circle cx="24" cy="29" r="15" fill="#b9a38c" {...S} />
      <ellipse cx="24" cy="34" rx="7" ry="5" fill={CREAM} />
      {eyes(18.5, 29.5, 27)}
      <path d="M21.5 31.5 L24 34 L26.5 31.5 Z" fill="#e76f51" />
    </>
  ),

  // Ocean
  'ocean.octopus': (
    <>
      <g strokeLinecap="round" fill="none">
        <path
          d="M13 27 C11 34 6 36 6 41 M18 29 C18 36 14 40 16 44 M24 30 V44 M30 29 C30 36 34 40 32 44 M35 27 C37 34 42 36 42 41"
          stroke={INK}
          strokeWidth={7}
        />
        <path
          d="M13 27 C11 34 6 36 6 41 M18 29 C18 36 14 40 16 44 M24 30 V44 M30 29 C30 36 34 40 32 44 M35 27 C37 34 42 36 42 41"
          stroke="#c08bd6"
          strokeWidth={3.5}
        />
      </g>
      <ellipse cx="24" cy="19" rx="15" ry="14" fill="#c08bd6" {...S} />
      {eyes(18.5, 29.5, 20, 2.6)}
      {smile(24, 25, 3.5)}
    </>
  ),
  'ocean.clownfish': (
    <>
      <path d="M36 24 L46 15 L45 33 Z" fill={ORANGE} {...S} />
      <ellipse cx="22" cy="24" rx="16" ry="11" fill={ORANGE} {...S} />
      <path d="M13 14 C10 20 10 28 13 34 L17 34.5 C14 28 14 20 17 13.5 Z" fill="#fff" />
      <path d="M25 13 C22 20 22 28 25 35 L29 34 C26 28 26 20 29 14 Z" fill="#fff" />
      <path d="M22 13 L26 6 L31 14" fill={ORANGE} {...S} />
      {eye(10, 22, 2.4)}
      {smile(9, 28, 2)}
    </>
  ),
  'ocean.dolphin': (
    <>
      <path d="M8 30 L1 22 L4 31 L1 39 Z" fill="#7fa7c9" {...S} />
      <path d="M22 17 L27 7 L31 17 Z" fill="#7fa7c9" {...S} />
      <path
        d="M6 31 C8 21 22 14 35 17 C40 18 43 22 46 26 L39 27 C31 32 17 34 6 31 Z"
        fill="#7fa7c9"
        {...S}
      />
      <path d="M14 31 C22 31 30 30 38 27" {...LINE} stroke="#dff3fa" strokeWidth={3} />
      {eye(36, 22)}
      <path d="M40 26 Q42 27 44 26" {...LINE} strokeWidth={1.8} />
    </>
  ),
  'ocean.whale': (
    <>
      <path
        d="M29 12 C29 8 27 6 24 5 M29 12 C29 8 31 6 34 5 M29 12 V6"
        {...LINE}
        stroke="#7fd1e8"
        strokeWidth={2.5}
      />
      <path d="M7 27 L1 19 L3 28 L0 36 Z" fill="#5b8fd6" {...S} />
      <path
        d="M5 28 C5 18 17 14 29 15 C39 16 45 23 43 31 C40 39 14 40 5 28 Z"
        fill="#5b8fd6"
        {...S}
      />
      <path d="M12 33 C20 37 34 37 41 32" {...LINE} stroke="#dff3fa" strokeWidth={3} />
      {eye(34, 25)}
      {smile(38, 29, 3)}
    </>
  ),
  'ocean.shark': (
    <>
      <path d="M8 28 L1 19 L4 28 L1 37 Z" fill="#8d99a6" {...S} />
      <path d="M19 19 L25 6 L30 18 Z" fill="#8d99a6" {...S} />
      <path d="M5 28 C11 20 27 15 40 21 L47 26 L40 29 C28 35 12 35 5 28 Z" fill="#8d99a6" {...S} />
      <path d="M12 31 C22 34 32 33 41 29" fill="#fff" stroke="#fff" strokeWidth={3} />
      <path d="M26 24 V28 M29 23.5 V27.5" {...LINE} strokeWidth={1.6} />
      {eye(37, 23)}
      <path d="M38 28 l1.5 2 l1.5 -2 l1.5 2" {...LINE} strokeWidth={1.4} />
    </>
  ),
  'ocean.crab': (
    <>
      <path
        d="M12 30 L5 34 M12 33 L6 39 M36 30 L43 34 M36 33 L42 39 M14 24 L9 18 M34 24 L39 18"
        {...LINE}
        strokeWidth={3}
      />
      <path d="M9 18 C3 17 3 9 8 8 L10 13 L13 10 C14 14 13 18 9 18 Z" fill="#e76f51" {...S} />
      <path d="M39 18 C45 17 45 9 40 8 L38 13 L35 10 C34 14 35 18 39 18 Z" fill="#e76f51" {...S} />
      <path d="M19 22 V15 M29 22 V15" {...LINE} />
      <circle cx="19" cy="14" r="3.2" fill="#fff" {...S} strokeWidth={2} />
      <circle cx="29" cy="14" r="3.2" fill="#fff" {...S} strokeWidth={2} />
      {eyes(19, 29, 14, 1.4)}
      <ellipse cx="24" cy="29" rx="14" ry="9" fill="#e76f51" {...S} />
      {smile(24, 30, 3.5)}
    </>
  ),
  'ocean.turtle': (
    <>
      <ellipse cx="13" cy="35" rx="4" ry="3.5" fill="#8fe3a8" {...S} />
      <ellipse cx="33" cy="35" rx="4" ry="3.5" fill="#8fe3a8" {...S} />
      <circle cx="40" cy="25" r="6" fill="#8fe3a8" {...S} />
      {eye(42, 23.5, 1.8)}
      <path d="M6 31 C6 18 14 12 23 12 C32 12 36 20 36 31 Z" fill="#4caf7a" {...S} />
      <path
        d="M15 31 L18 22 H28 L31 31 M18 22 L14 16 M28 22 L32 16 M23 12 V22"
        {...LINE}
        strokeWidth={2}
      />
      <path d="M4 31 H38" {...LINE} />
    </>
  ),
  'ocean.squid': (
    <>
      <path
        d="M17 31 L13 44 M21 32 L20 45 M24 32 V46 M27 32 L28 45 M31 31 L35 44"
        {...LINE}
        stroke={INK}
        strokeWidth={5}
      />
      <path
        d="M17 31 L13 44 M21 32 L20 45 M24 32 V46 M27 32 L28 45 M31 31 L35 44"
        {...LINE}
        stroke="#f4a3b5"
        strokeWidth={2.4}
      />
      <path d="M24 2 L36 13 L33 32 H15 L12 13 Z" fill="#f4a3b5" {...S} />
      {eyes(19.5, 28.5, 24, 2.6)}
      <circle cx="24" cy="13" r="1.6" fill="#e07a92" />
      <circle cx="20" cy="17" r="1.2" fill="#e07a92" />
      <circle cx="28" cy="17" r="1.2" fill="#e07a92" />
    </>
  ),
  'ocean.lobster': (
    <>
      <path d="M20 12 C16 6 12 4 8 5 M28 12 C32 6 36 4 40 5" {...LINE} strokeWidth={2} />
      <path d="M18 17 L12 13 M30 17 L36 13" {...LINE} strokeWidth={3} />
      <path d="M12 14 C5 14 4 5 9 3 L11 8 L14 5 C16 9 15 13 12 14 Z" fill="#d9534f" {...S} />
      <path d="M36 14 C43 14 44 5 39 3 L37 8 L34 5 C32 9 33 13 36 14 Z" fill="#d9534f" {...S} />
      <path d="M18 23 L11 27 M18 27 L11 31 M30 23 L37 27 M30 27 L37 31" {...LINE} strokeWidth={2} />
      <path d="M19 37 L14 45 H34 L29 37 Z" fill="#d9534f" {...S} />
      <ellipse cx="24" cy="26" rx="8" ry="13" fill="#d9534f" {...S} />
      <path d="M17 30 H31 M17.5 34 H30.5" {...LINE} strokeWidth={1.8} />
      {eyes(21, 27, 18, 2)}
    </>
  ),
  'ocean.pufferfish': (
    <>
      <path
        d="M22 6 V2 M12 9 L9 5 M32 9 L35 5 M7 18 L3 16 M7 30 L3 32 M12 39 L9 43 M22 42 V46 M32 39 L35 43"
        {...LINE}
      />
      <path d="M36 24 L45 17 L45 31 Z" fill="#ffd27a" {...S} />
      <circle cx="22" cy="24" r="16" fill="#ffd27a" {...S} />
      <path d="M10 30 C14 36 30 36 34 30" fill="#fff3c4" />
      <circle cx="16" cy="20" r="4.5" fill="#fff" {...S} strokeWidth={2} />
      <circle cx="28" cy="20" r="4.5" fill="#fff" {...S} strokeWidth={2} />
      {eyes(17, 29, 20.5, 2.2)}
      <circle cx="22" cy="28" r="2.4" fill="#e76f51" {...S} strokeWidth={1.6} />
    </>
  ),
  'ocean.seal': (
    <>
      <ellipse cx="24" cy="26" rx="17" ry="16" fill={GREY} {...S} />
      <ellipse cx="24" cy="32" rx="9" ry="6" fill="#d7dee5" />
      {eyes(16.5, 31.5, 22, 3.2)}
      <circle cx="17.5" cy="21" r="1" fill="#fff" />
      <circle cx="32.5" cy="21" r="1" fill="#fff" />
      {nose(24, 29, 3.2, 2.3)}
      <path
        d="M18 32 L10 30 M18 34 L10 35 M30 32 L38 30 M30 34 L38 35"
        {...LINE}
        strokeWidth={1.5}
      />
      {smile(24, 33, 2.5)}
    </>
  ),
  'ocean.penguin': (
    <>
      <path d="M17 43 L13 46 H21 Z M31 43 L27 46 H35 Z" fill="#ffb703" {...S} strokeWidth={2} />
      <ellipse cx="24" cy="26" rx="15" ry="19" fill={INK} />
      <path
        d="M24 12 C17 12 14 18 15 25 C15 34 18 42 24 42 C30 42 33 34 33 25 C34 18 31 12 24 12 Z"
        fill="#fff"
      />
      <circle cx="20" cy="20" r="2.2" fill={INK} />
      <circle cx="28" cy="20" r="2.2" fill={INK} />
      <path d="M21 24 L24 29 L27 24 Z" fill="#ffb703" {...S} strokeWidth={1.8} />
      <path d="M9 24 C6 30 7 35 10 37 M39 24 C42 30 41 35 38 37" {...LINE} strokeWidth={3.5} />
    </>
  ),

  // Safari
  'safari.lion': (
    <>
      <path
        d="M24 2 L29 6 L35 4 L37 10 L43 12 L42 18 L46 23 L42 28 L44 34 L38 37 L37 43 L31 42 L26 46 L22 46 L17 42 L11 43 L10 37 L4 34 L6 28 L2 23 L6 18 L5 12 L11 10 L13 4 L19 6 Z"
        fill="#d9822b"
        {...S}
      />
      <circle cx="24" cy="25" r="13" fill="#f4c27a" {...S} />
      <ellipse cx="24" cy="31" rx="6.5" ry="4.5" fill="#fbe3bd" />
      {eyes(19, 29, 23)}
      <path d="M21.5 27.5 H26.5 L24 30.5 Z" fill={INK} />
      {smile(24, 32, 2.5)}
    </>
  ),
  'safari.elephant': (
    <>
      <ellipse cx="9" cy="21" rx="8.5" ry="12" fill="#b4bec9" {...S} />
      <ellipse cx="39" cy="21" rx="8.5" ry="12" fill="#b4bec9" {...S} />
      <path
        d="M24 6 C14 6 11 13 12 21 C13 27 17 29 20 30 C20 37 21 42 26 43 C30 43 31 40 29 39 C26 39 26 34 27 30 C31 29 35 27 36 21 C37 13 34 6 24 6 Z"
        fill={GREY}
        {...S}
      />
      {eyes(18.5, 29.5, 18)}
      <path d="M17 29 Q15 33 16 36 M31 29 Q33 33 32 36" {...LINE} stroke="#fff" strokeWidth={2.8} />
    </>
  ),
  'safari.giraffe': (
    <>
      <path d="M18 9 V3 M30 9 V3" {...LINE} strokeWidth={3} />
      <circle cx="18" cy="3" r="2.5" fill="#8b5a2b" />
      <circle cx="30" cy="3" r="2.5" fill="#8b5a2b" />
      <ellipse
        cx="10"
        cy="13"
        rx="5"
        ry="2.8"
        transform="rotate(-20 10 13)"
        fill="#f2c14e"
        {...S}
      />
      <ellipse cx="38" cy="13" rx="5" ry="2.8" transform="rotate(20 38 13)" fill="#f2c14e" {...S} />
      <path d="M17 30 L16 47 H32 L31 30 Z" fill="#f2c14e" {...S} />
      <path
        d="M14 10 C14 6 34 6 34 10 C36 20 33 32 24 33 C15 32 12 20 14 10 Z"
        fill="#f2c14e"
        {...S}
      />
      <ellipse cx="24" cy="28" rx="7" ry="5" fill="#f7dc9a" />
      <circle cx="19" cy="40" r="2.5" fill="#c98b53" />
      <circle cx="28" cy="38" r="2" fill="#c98b53" />
      <circle cx="17" cy="13" r="1.8" fill="#c98b53" />
      <circle cx="31" cy="14" r="1.6" fill="#c98b53" />
      {eyes(19, 29, 19)}
      <circle cx="21.5" cy="28" r="1.2" fill={INK} />
      <circle cx="26.5" cy="28" r="1.2" fill={INK} />
    </>
  ),
  'safari.zebra': (
    <>
      <path d="M18 9 L22 2 L26 9 L30 2 L32 10" fill={INK} />
      <path d="M12 12 L13 3 L19 10 Z M36 12 L35 3 L29 10 Z" fill="#fff" {...S} />
      <path
        d="M14 10 C14 6 34 6 34 10 C36 22 33 40 24 42 C15 40 12 22 14 10 Z"
        fill="#fff"
        {...S}
      />
      <path
        d="M14.5 14 L21 16 M33.5 14 L27 16 M14 20 L19 21 M34 20 L29 21 M24 8 V14 M15 26 L19 26 M33 26 L29 26"
        {...LINE}
        strokeWidth={2.6}
      />
      <ellipse cx="24" cy="36" rx="8" ry="6" fill="#5c6670" {...S} />
      {eyes(18.5, 29.5, 23)}
      <circle cx="21" cy="36" r="1.3" fill={INK} />
      <circle cx="27" cy="36" r="1.3" fill={INK} />
    </>
  ),
  'safari.rhino': (
    <>
      <path d="M12 14 L13 5 L19 11 Z M36 14 L35 5 L29 11 Z" fill="#9aa3ad" {...S} />
      <ellipse cx="24" cy="26" rx="16" ry="15" fill="#9aa3ad" {...S} />
      <path d="M20 30 L24 12 L28 30 Z" fill="#e9e1d3" {...S} />
      <path d="M21 22 L24 18 L27 22" fill="#e9e1d3" />
      <ellipse cx="24" cy="35" rx="10" ry="5.5" fill="#b9c1c9" {...S} />
      {eyes(15, 33, 24)}
      <circle cx="20" cy="35" r="1.4" fill={INK} />
      <circle cx="28" cy="35" r="1.4" fill={INK} />
    </>
  ),
  'safari.hippo': (
    <>
      <circle cx="12" cy="10" r="4" fill="#a48aa8" {...S} />
      <circle cx="36" cy="10" r="4" fill="#a48aa8" {...S} />
      <ellipse cx="24" cy="18" rx="14" ry="11" fill="#a48aa8" {...S} />
      <ellipse cx="24" cy="32" rx="19" ry="12" fill="#b9a2bd" {...S} />
      {eyes(18, 30, 15)}
      <ellipse cx="18" cy="29" rx="2" ry="2.6" fill={INK} />
      <ellipse cx="30" cy="29" rx="2" ry="2.6" fill={INK} />
      <path d="M15 37 Q24 41 33 37" {...LINE} />
    </>
  ),
  'safari.leopard': (
    <>
      <path d="M8 15 L10 5 L18 11 Z M40 15 L38 5 L30 11 Z" fill="#f2c14e" {...S} />
      <circle cx="24" cy="26" r="17" fill="#f2c14e" {...S} />
      <ellipse cx="24" cy="33" rx="8" ry="6" fill="#fbe8b8" />
      <g fill="#8b5a2b">
        <circle cx="13" cy="20" r="1.8" />
        <circle cx="35" cy="20" r="1.8" />
        <circle cx="19" cy="13" r="1.6" />
        <circle cx="29" cy="13" r="1.6" />
        <circle cx="24" cy="16" r="1.4" />
        <circle cx="11" cy="28" r="1.6" />
        <circle cx="37" cy="28" r="1.6" />
      </g>
      {eyes(18, 30, 24)}
      <path d="M21.5 29.5 H26.5 L24 32.5 Z" fill="#e76f51" stroke={INK} strokeWidth={1.4} />
      {smile(24, 34, 2.5)}
    </>
  ),
  'safari.tiger': (
    <>
      <circle cx="11" cy="12" r="6" fill={ORANGE} {...S} />
      <circle cx="37" cy="12" r="6" fill={ORANGE} {...S} />
      <circle cx="24" cy="26" r="17" fill={ORANGE} {...S} />
      <path
        d="M24 9 V15 M18 10 L19.5 15 M30 10 L28.5 15 M7 24 H12 M41 24 H36 M8 30 H13 M40 30 H35"
        {...LINE}
      />
      <ellipse cx="24" cy="32" rx="8" ry="6" fill="#fff" />
      {eyes(17, 31, 24)}
      {nose(24, 29.5)}
      {smile(24, 33, 2.5)}
    </>
  ),
  'safari.gorilla': (
    <>
      <circle cx="9" cy="24" r="4.5" fill="#4a4a55" {...S} />
      <circle cx="39" cy="24" r="4.5" fill="#4a4a55" {...S} />
      <path
        d="M24 4 C13 4 8 13 9 23 C10 36 16 44 24 44 C32 44 38 36 39 23 C40 13 35 4 24 4 Z"
        fill="#4a4a55"
        {...S}
      />
      <path
        d="M24 15 C17 14 13 18 14 24 C14 28 16 29 16 31 C16 38 20 41 24 41 C28 41 32 38 32 31 C32 29 34 28 34 24 C35 18 31 14 24 15 Z"
        fill="#9a8478"
      />
      <path d="M15 20 C19 17 29 17 33 20" {...LINE} strokeWidth={2} />
      {eyes(19, 29, 23)}
      <circle cx="21.5" cy="31" r="1.5" fill={INK} />
      <circle cx="26.5" cy="31" r="1.5" fill={INK} />
      {smile(24, 35, 3)}
    </>
  ),
  'safari.camel': (
    <>
      <path
        d="M12 30 V45 M18 31 V45 M30 31 V45 M35 30 V45"
        {...LINE}
        stroke="#c9a15a"
        strokeWidth={4}
      />
      <path
        d="M8 30 C8 22 11 16 16 16 C19 16 20 20 22 20 C24 20 25 15 29 15 C33 15 35 21 36 26 C37 20 39 12 42 10 L46 11 L45 15 L43 16 C42 22 41 30 36 33 C28 36 14 36 8 30 Z"
        fill="#d9b26f"
        {...S}
      />
      {eye(43, 13, 1.6)}
    </>
  ),
  'safari.kangaroo': (
    <>
      <ellipse cx="16" cy="10" rx="4" ry="9" transform="rotate(-12 16 10)" fill={BROWN} {...S} />
      <ellipse cx="32" cy="10" rx="4" ry="9" transform="rotate(12 32 10)" fill={BROWN} {...S} />
      <path
        d="M12 22 C12 14 36 14 36 22 C36 30 31 42 24 42 C17 42 12 30 12 22 Z"
        fill={BROWN}
        {...S}
      />
      <ellipse cx="24" cy="35" rx="7" ry="5.5" fill={CREAM} />
      {eyes(18.5, 29.5, 25)}
      {nose(24, 32.5, 3, 2)}
      <ellipse cx="16" cy="10" rx="1.6" ry="5.5" transform="rotate(-12 16 10)" fill="#f4c99b" />
      <ellipse cx="32" cy="10" rx="1.6" ry="5.5" transform="rotate(12 32 10)" fill="#f4c99b" />
    </>
  ),
  'safari.crocodile': (
    <>
      <path
        d="M3 30 C3 24 8 21 14 21 L42 23 C46 24 46 31 42 32 L14 34 C8 34 3 33 3 30 Z"
        fill="#5aa469"
        {...S}
      />
      <path d="M14 28 H44" {...LINE} strokeWidth={2} />
      <path
        d="M18 28 l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3"
        fill="#fff"
        stroke={INK}
        strokeWidth={1.2}
      />
      <circle cx="12" cy="19" r="5" fill="#5aa469" {...S} />
      <circle cx="21" cy="19" r="5" fill="#5aa469" {...S} />
      <circle cx="12" cy="18.5" r="2.6" fill="#fff" />
      <circle cx="21" cy="18.5" r="2.6" fill="#fff" />
      {eyes(12.5, 21.5, 18.5, 1.5)}
      <circle cx="41" cy="25.5" r="1.2" fill={INK} />
    </>
  ),
};

export const hasCritter = (id: string) => id in ART;
export const CRITTER_IDS = Object.keys(ART);

/** An item's picture: drawn when there is a drawing, otherwise its emoji. */
export function ItemArt({ id, emoji, size = 48 }: { id: string; emoji?: string; size?: number }) {
  const art = ART[id];
  if (!art) {
    return (
      <span aria-hidden="true" style={{ fontSize: size * 0.8, lineHeight: 1 }}>
        {emoji}
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      data-critter={id}
      className="shrink-0 overflow-visible"
    >
      {art}
    </svg>
  );
}
