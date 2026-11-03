import type { ReactNode } from 'react';
import { Icon, type IconName } from '../ui/icons';

const INK = '#1d3557';
const S = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

/** Small drawings for the skills whose idea is a picture rather than a symbol. */
const DRAWN = {
  tenframe: (
    <>
      <rect x="5" y="13" width="38" height="22" rx="3" fill="#fff" {...S} />
      <path
        d="M12.6 13 V35 M20.2 13 V35 M27.8 13 V35 M35.4 13 V35 M5 24 H43"
        fill="none"
        {...S}
        strokeWidth={2}
      />
      {[8.8, 16.4, 24, 31.6].map((x) => (
        <circle key={x} cx={x} cy="18.5" r="3" fill="#7fd1e8" />
      ))}
    </>
  ),
  family: (
    <>
      <path d="M8 22 L24 8 L40 22 V42 H8 Z" fill="#fff3c4" {...S} />
      <circle cx="17" cy="27" r="4" fill="#7fd1e8" {...S} strokeWidth={2.5} />
      <circle cx="31" cy="27" r="4" fill="#f4a261" {...S} strokeWidth={2.5} />
      <circle cx="24" cy="36" r="4" fill="#8fe3a8" {...S} strokeWidth={2.5} />
    </>
  ),
  blocks: (
    <>
      {[8, 15, 22].map((x) => (
        <rect
          key={x}
          x={x}
          y="8"
          width="6"
          height="32"
          rx="1"
          fill="#7fd1e8"
          {...S}
          strokeWidth={2.5}
        />
      ))}
      {[10, 20, 30].map((y) => (
        <rect
          key={y}
          x="33"
          y={y}
          width="7"
          height="7"
          rx="1"
          fill="#ffb703"
          {...S}
          strokeWidth={2.5}
        />
      ))}
    </>
  ),
  book: (
    <>
      <path d="M24 12 C19 8 11 8 5 10 V39 C11 37 19 37 24 41 Z" fill="#fff" {...S} />
      <path d="M24 12 C29 8 37 8 43 10 V39 C37 37 29 37 24 41 Z" fill="#dff3fa" {...S} />
    </>
  ),
  clock: (
    <>
      <circle cx="24" cy="24" r="18" fill="#fff" {...S} />
      <path d="M24 13 V24 L31 28" fill="none" {...S} />
    </>
  ),
  shapes: (
    <>
      <path d="M14 6 L25 24 H3 Z" fill="#e76f51" {...S} />
      <rect x="25" y="8" width="17" height="17" rx="2" fill="#7fd1e8" {...S} />
      <circle cx="24" cy="35" r="8" fill="#ffb703" {...S} />
    </>
  ),
  ruler: (
    <>
      <rect x="4" y="16" width="40" height="16" rx="3" fill="#ffb703" {...S} />
      <path
        d="M11 16 V23 M18 16 V26 M25 16 V23 M32 16 V26 M39 16 V23"
        fill="none"
        {...S}
        strokeWidth={2.5}
      />
    </>
  ),
  dots: (
    <>
      {[12, 24, 36].map((y) =>
        [12, 20, 28, 36].map((x) => (
          <circle key={`${x}.${y}`} cx={x} cy={y} r="3.5" fill="#7fd1e8" {...S} strokeWidth={2} />
        )),
      )}
    </>
  ),
  pizza: (
    <>
      <circle cx="24" cy="24" r="18" fill="#ffd27a" {...S} />
      <path d="M24 6 V42 M6 24 H42" fill="none" {...S} />
      <circle cx="16" cy="16" r="2.5" fill="#e76f51" />
      <circle cx="32" cy="31" r="2.5" fill="#e76f51" />
    </>
  ),
  half: (
    <>
      <circle cx="24" cy="24" r="18" fill="#fff" {...S} />
      <path d="M24 6 A18 18 0 0 1 24 42 Z" fill="#7fd1e8" {...S} />
    </>
  ),
  bars: (
    <>
      <rect x="5" y="9" width="38" height="11" rx="2" fill="#fff" {...S} />
      <rect x="5" y="9" width="19" height="11" rx="2" fill="#7fd1e8" {...S} />
      <rect x="5" y="28" width="38" height="11" rx="2" fill="#fff" {...S} />
      <rect x="5" y="28" width="9.5" height="11" rx="2" fill="#ffb703" {...S} />
    </>
  ),
  grid: (
    <>
      <rect x="6" y="10" width="36" height="27" rx="2" fill="#dff3fa" {...S} />
      <path
        d="M15 10 V37 M24 10 V37 M33 10 V37 M6 19 H42 M6 28 H42"
        fill="none"
        {...S}
        strokeWidth={2}
      />
    </>
  ),
} satisfies Record<string, ReactNode>;

type Art = { draw: keyof typeof DRAWN } | { icon: IconName } | { glyph: string; color: string };

const SUN = '#ffb703';
const SKY = '#7fd1e8';
const LEAF = '#8fe3a8';
const CORAL = '#f4a261';

/** One picture per skill, for the map, the trophy wall and free play. Its name is always shown beside it. */
const SKILL_ART: Record<string, Art> = {
  '1.counting': { glyph: '123', color: SKY },
  '1.ten-frame': { draw: 'tenframe' },
  '1.add-within-10': { glyph: '+', color: SUN },
  '1.sub-within-10': { glyph: '−', color: SKY },
  '1.add-within-20': { glyph: '+20', color: SUN },
  '1.sub-within-20': { glyph: '−20', color: SKY },
  '1.fact-families': { draw: 'family' },
  '1.place-value': { draw: 'blocks' },
  '1.compare': { glyph: '>', color: LEAF },
  '1.add-sub-10s': { glyph: '+10', color: CORAL },
  '1.word-problems': { draw: 'book' },
  '1.time': { draw: 'clock' },
  '1.shapes': { draw: 'shapes' },
  '1.measure': { draw: 'ruler' },
  '2.facts-within-20': { icon: 'bolt' },
  '2.place-value-1000': { glyph: '100', color: SKY },
  '2.compare-1000': { glyph: '<', color: LEAF },
  '2.add-within-100': { glyph: '+99', color: SUN },
  '2.sub-within-100': { glyph: '−99', color: SKY },
  '2.add-sub-1000': { glyph: '999', color: CORAL },
  '2.even-odd': { glyph: '246', color: LEAF },
  '2.arrays': { draw: 'dots' },
  '2.money': { icon: 'coin' },
  '2.time-5min': { draw: 'clock' },
  '2.word-problems-2step': { draw: 'book' },
  '2.measure-units': { draw: 'ruler' },
  '3.mult-concept': { draw: 'dots' },
  '3.mult-facts': { glyph: '×', color: SUN },
  '3.div-concept': { draw: 'pizza' },
  '3.div-facts': { glyph: '÷', color: SKY },
  '3.fact-families-md': { draw: 'family' },
  '3.add-sub-1000': { glyph: '+−', color: CORAL },
  '3.round': { glyph: '≈', color: LEAF },
  '3.fractions-unit': { draw: 'half' },
  '3.fractions-compare': { draw: 'bars' },
  '3.time-minute': { draw: 'clock' },
  '3.area-perimeter': { draw: 'grid' },
  '3.word-problems-4ops': { draw: 'book' },
};

export const hasSkillArt = (id: string) => id in SKILL_ART;

export function SkillIcon({ id, size = 40 }: { id: string; size?: number }) {
  const art = SKILL_ART[id];
  if (!art) return null;
  if ('icon' in art) return <Icon name={art.icon} size={size} />;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="shrink-0">
      {'draw' in art ? (
        DRAWN[art.draw]
      ) : (
        <>
          <circle cx="24" cy="24" r="20" fill={art.color} {...S} />
          <text
            x="24"
            y="25"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Nunito, ui-rounded, sans-serif"
            fontWeight="900"
            fontSize={art.glyph.length > 2 ? 15 : art.glyph.length > 1 ? 19 : 28}
            fill={INK}
          >
            {art.glyph}
          </text>
        </>
      )}
    </svg>
  );
}
