import type { ReactNode } from 'react';

/**
 * The app's own drawn icons: navy outline, flat fills from the palette, one weight everywhere.
 * Emoji draw differently on every device and clash with the bear, so the app's controls use these.
 */
const INK = '#1d3557';
const S = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

const PATHS = {
  home: (
    <>
      <path d="M12 21 V41 H36 V21" fill="#fff" {...S} />
      <path d="M6 23 L24 8 L42 23" fill="none" {...S} strokeWidth={3.5} />
      <rect x="20" y="29" width="8" height="12" rx="1.5" fill="#e76f51" {...S} />
    </>
  ),
  speaker: (
    <>
      <path d="M8 19 H15 L25 11 V37 L15 29 H8 Z" fill="#fff" {...S} />
      <path d="M31 18 C34 21 34 27 31 30 M35 13 C41 19 41 29 35 35" fill="none" {...S} />
    </>
  ),
  coin: (
    <>
      <circle cx="24" cy="24" r="18" fill="#ffb703" {...S} />
      <circle cx="24" cy="24" r="10.5" fill="none" stroke="#c98500" strokeWidth={3} />
    </>
  ),
  shield: (
    <>
      <path d="M24 5 L39 10 V22 C39 33 32 39 24 43 C16 39 9 33 9 22 V10 Z" fill="#7fd1e8" {...S} />
      <path d="M24 12 V36" fill="none" {...S} />
    </>
  ),
  sprout: (
    <>
      <path d="M12 30 H36 L33 44 H15 Z" fill="#e9a07a" {...S} />
      <path d="M24 30 V12" fill="none" {...S} />
      <path
        d="M24 24 C17 24 12 20 12 14 C18 14 24 18 24 24 Z M24 18 C24 12 29 8 36 8 C36 14 31 18 24 18 Z"
        fill="#8fe3a8"
        {...S}
      />
    </>
  ),
  chest: (
    <>
      <path d="M7 21 C7 12 13 8 24 8 C35 8 41 12 41 21 Z" fill="#e0a96d" {...S} />
      <rect x="7" y="21" width="34" height="19" rx="3" fill="#c98b53" {...S} />
      <rect x="20" y="17" width="8" height="10" rx="2" fill="#fff3c4" {...S} />
    </>
  ),
  map: (
    <>
      <path d="M5 12 L17 7 L31 12 L43 7 V36 L31 41 L17 36 L5 41 Z" fill="#dff3fa" {...S} />
      <path d="M17 7 V36 M31 12 V41" fill="none" {...S} />
      <circle cx="24" cy="22" r="3.5" fill="#e76f51" />
    </>
  ),
  trophy: (
    <>
      <path d="M15 9 H33 V18 C33 24 29 28 24 28 C19 28 15 24 15 18 Z" fill="#ffb703" {...S} />
      <path
        d="M15 12 H9 C9 18 12 21 16 21 M33 12 H39 C39 18 36 21 32 21 M24 28 V34"
        fill="none"
        {...S}
      />
      <rect x="15" y="34" width="18" height="7" rx="2" fill="#ffb703" {...S} />
    </>
  ),
  paw: (
    <>
      <ellipse cx="24" cy="32" rx="10" ry="8.5" fill="#c98b53" {...S} />
      <circle cx="11" cy="21" r="4.5" fill="#c98b53" {...S} />
      <circle cx="19" cy="12" r="4.5" fill="#c98b53" {...S} />
      <circle cx="29" cy="12" r="4.5" fill="#c98b53" {...S} />
      <circle cx="37" cy="21" r="4.5" fill="#c98b53" {...S} />
    </>
  ),
  crown: (
    <>
      <path d="M8 36 L13 14 L21 24 L24 10 L27 24 L35 14 L40 36 Z" fill="#ffb703" {...S} />
      <circle cx="13" cy="12" r="3" fill="#e76f51" {...S} strokeWidth={2.5} />
      <circle cx="24" cy="8" r="3" fill="#7fd1e8" {...S} strokeWidth={2.5} />
      <circle cx="35" cy="12" r="3" fill="#e76f51" {...S} strokeWidth={2.5} />
      <path d="M8 36 H40" fill="none" {...S} />
    </>
  ),
  sun: (
    <>
      <path
        d="M24 4 V9 M24 39 V44 M4 24 H9 M39 24 H44 M10 10 L13.5 13.5 M34.5 34.5 L38 38 M10 38 L13.5 34.5 M34.5 13.5 L38 10"
        fill="none"
        {...S}
      />
      <circle cx="24" cy="24" r="10" fill="#ffb703" {...S} />
    </>
  ),
  bulb: (
    <>
      <path
        d="M24 5 C16 5 11 11 11 18 C11 24 15 27 17 32 H31 C33 27 37 24 37 18 C37 11 32 5 24 5 Z"
        fill="#fff3b0"
        {...S}
      />
      <path d="M18 37 H30 M20 42 H28" fill="none" {...S} />
    </>
  ),
  star: (
    <path
      d="M24 5 L29.5 17.5 L43 18.8 L32.8 27.8 L35.8 41 L24 34 L12.2 41 L15.2 27.8 L5 18.8 L18.5 17.5 Z"
      fill="#ffb703"
      {...S}
    />
  ),
  balloon: (
    <>
      <ellipse cx="24" cy="18" rx="13" ry="14" fill="#7fd1e8" {...S} />
      <path d="M24 32 C22 36 26 38 24 44" fill="none" {...S} strokeWidth={2.5} />
      <path d="M21 32 H27 L24 35 Z" fill={INK} />
    </>
  ),
  bolt: <path d="M27 4 L10 27 H22 L19 44 L38 19 H26 Z" fill="#ffb703" {...S} />,
  lock: (
    <>
      <path d="M16 22 V16 C16 11 19.5 8 24 8 C28.5 8 32 11 32 16 V22" fill="none" {...S} />
      <rect x="10" y="21" width="28" height="21" rx="5" fill="#c5cdd8" {...S} />
      <circle cx="24" cy="31" r="3" fill={INK} />
    </>
  ),
  check: <path d="M10 25 L20 35 L38 14" fill="none" {...S} strokeWidth={6} />,
  done: (
    <>
      <circle cx="24" cy="24" r="19" fill="#8fe3a8" {...S} />
      <path d="M14 25 L21 32 L34 17" fill="none" {...S} strokeWidth={5} />
    </>
  ),
  close: <path d="M13 13 L35 35 M35 13 L13 35" fill="none" {...S} strokeWidth={5} />,
  play: <path d="M14 8 L40 24 L14 40 Z" fill={INK} {...S} />,
  arrow: <path d="M10 24 H36 M26 13 L37 24 L26 35" fill="none" {...S} strokeWidth={5} />,
  back: <path d="M38 24 H12 M22 13 L11 24 L22 35" fill="none" {...S} strokeWidth={5} />,
  gear: (
    <>
      <path
        d="M24 4 L28 9 L34 7 L35 13 L41 15 L39 21 L44 24 L39 27 L41 33 L35 35 L34 41 L28 39 L24 44 L20 39 L14 41 L13 35 L7 33 L9 27 L4 24 L9 21 L7 15 L13 13 L14 7 L20 9 Z"
        fill="#dff3fa"
        {...S}
      />
      <circle cx="24" cy="24" r="7" fill="#fff" {...S} />
    </>
  ),
  help: (
    <>
      <circle cx="24" cy="24" r="19" fill="#fff" {...S} />
      <path
        d="M18 19 C18 15 21 13 24 13 C27.5 13 30 15.5 30 18.5 C30 22 26 23 24.5 26 V28"
        fill="none"
        {...S}
      />
      <circle cx="24.5" cy="34.5" r="2.6" fill={INK} />
    </>
  ),
  printer: (
    <>
      <rect x="13" y="6" width="22" height="12" fill="#fff" {...S} />
      <rect x="6" y="17" width="36" height="17" rx="4" fill="#c5cdd8" {...S} />
      <rect x="13" y="28" width="22" height="14" fill="#fff" {...S} />
    </>
  ),
  heart: (
    <path
      d="M24 41 C12 32 6 26 6 18 C6 12 10.5 8 16 8 C19.5 8 22.5 10 24 13 C25.5 10 28.5 8 32 8 C37.5 8 42 12 42 18 C42 26 36 32 24 41 Z"
      fill="#e76f51"
      {...S}
    />
  ),
  moon: (
    <path
      d="M30 6 C20 8 14 16 14 25 C14 35 22 42 32 42 C36 42 39 41 42 39 C30 38 24 30 24 21 C24 15 26 10 30 6 Z"
      fill="#fff3b0"
      {...S}
    />
  ),
  target: (
    <>
      <circle cx="24" cy="24" r="18" fill="#fff" {...S} />
      <circle cx="24" cy="24" r="11" fill="#e76f51" {...S} />
      <circle cx="24" cy="24" r="4" fill="#fff" {...S} />
    </>
  ),
  flag: (
    <>
      <path d="M12 44 V6" fill="none" {...S} />
      <path d="M12 8 H38 L32 16 L38 24 H12 Z" fill="#8fe3a8" {...S} />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export function Icon({
  name,
  size = 32,
  className = '',
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      data-icon={name}
      className={`shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
