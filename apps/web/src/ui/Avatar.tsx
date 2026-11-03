import type { ReactNode } from 'react';

const INK = '#1d3557';
const S = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const eyes = (y = 25, gap = 7) => (
  <>
    <circle cx={24 - gap} cy={y} r="2.6" fill={INK} />
    <circle cx={24 + gap} cy={y} r="2.6" fill={INK} />
  </>
);

/**
 * The six pictures a child picks at setup, drawn in the bear's style. Profiles store the emoji
 * they always have, so old data and backups keep working; this only changes how they look.
 */
const HEADS: Record<string, ReactNode> = {
  '🐻': (
    <>
      <circle cx="11" cy="12" r="7" fill="#c98b53" {...S} />
      <circle cx="37" cy="12" r="7" fill="#c98b53" {...S} />
      <circle cx="24" cy="26" r="17" fill="#d99c63" {...S} />
      <ellipse cx="24" cy="32" rx="8" ry="6" fill="#f4dcc0" />
      {eyes(23)}
      <ellipse cx="24" cy="29.5" rx="3" ry="2.2" fill={INK} />
    </>
  ),
  '🦊': (
    <>
      <path d="M8 5 L19 15 L9 22 Z M40 5 L29 15 L39 22 Z" fill="#e76f51" {...S} />
      <path
        d="M6 18 C6 33 15 43 24 43 C33 43 42 33 42 18 C35 13 13 13 6 18 Z"
        fill="#f4a261"
        {...S}
      />
      <ellipse cx="24" cy="34" rx="9" ry="7" fill="#fff" />
      {eyes(25)}
      <ellipse cx="24" cy="31" rx="3.2" ry="2.4" fill={INK} />
    </>
  ),
  '🐰': (
    <>
      <ellipse cx="17" cy="11" rx="4.5" ry="10" fill="#fff" {...S} />
      <ellipse cx="31" cy="11" rx="4.5" ry="10" fill="#fff" {...S} />
      <ellipse cx="17" cy="11" rx="1.8" ry="6" fill="#f6b8c4" />
      <ellipse cx="31" cy="11" rx="1.8" ry="6" fill="#f6b8c4" />
      <circle cx="24" cy="29" r="15" fill="#fff" {...S} />
      {eyes(27, 6)}
      <path d="M21.5 32 L24 34.5 L26.5 32 Z" fill="#e76f51" />
    </>
  ),
  '🐼': (
    <>
      <circle cx="11" cy="12" r="6.5" fill={INK} />
      <circle cx="37" cy="12" r="6.5" fill={INK} />
      <circle cx="24" cy="26" r="17" fill="#fff" {...S} />
      <ellipse cx="17" cy="24" rx="4.5" ry="5.5" fill={INK} transform="rotate(20 17 24)" />
      <ellipse cx="31" cy="24" rx="4.5" ry="5.5" fill={INK} transform="rotate(-20 31 24)" />
      <circle cx="17.5" cy="23.5" r="1.6" fill="#fff" />
      <circle cx="30.5" cy="23.5" r="1.6" fill="#fff" />
      <ellipse cx="24" cy="31" rx="3" ry="2.2" fill={INK} />
    </>
  ),
  '🐯': (
    <>
      <circle cx="11" cy="12" r="6" fill="#f4a261" {...S} />
      <circle cx="37" cy="12" r="6" fill="#f4a261" {...S} />
      <circle cx="24" cy="26" r="17" fill="#f4a261" {...S} />
      <path
        d="M24 9 V15 M18 10 L19.5 15 M30 10 L28.5 15 M7 24 H12 M41 24 H36 M8 30 H13 M40 30 H35"
        {...S}
        fill="none"
      />
      <ellipse cx="24" cy="32" rx="8" ry="6" fill="#fff" />
      {eyes(24)}
      <ellipse cx="24" cy="29.5" rx="3" ry="2.2" fill={INK} />
    </>
  ),
  '🐸': (
    <>
      <circle cx="15" cy="14" r="7" fill="#8fe3a8" {...S} />
      <circle cx="33" cy="14" r="7" fill="#8fe3a8" {...S} />
      <ellipse cx="24" cy="29" rx="19" ry="14" fill="#8fe3a8" {...S} />
      <circle cx="15" cy="14" r="2.8" fill={INK} />
      <circle cx="33" cy="14" r="2.8" fill={INK} />
      <path d="M15 32 Q24 39 33 32" fill="none" {...S} />
    </>
  ),
};

/** Words for each picture, for screen readers and for buttons a grown-up taps. */
export const AVATAR_NAMES: Record<string, string> = {
  '🐻': 'bear',
  '🦊': 'fox',
  '🐰': 'rabbit',
  '🐼': 'panda',
  '🐯': 'tiger',
  '🐸': 'frog',
};
export const avatarName = (value: string) => AVATAR_NAMES[value] ?? value;

/** A child's picture and name, side by side, for lists and headings. */
export function AvatarName({
  avatar,
  name,
  size = 26,
}: {
  avatar: string;
  name: string;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <Avatar value={avatar} size={size} />
      {name}
    </span>
  );
}

export function Avatar({ value, size = 40 }: { value: string | undefined; size?: number }) {
  const head = value ? HEADS[value] : undefined;
  if (!head) {
    return (
      <span aria-hidden="true" style={{ fontSize: size * 0.8, lineHeight: 1 }}>
        {value}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="shrink-0">
      {head}
    </svg>
  );
}
