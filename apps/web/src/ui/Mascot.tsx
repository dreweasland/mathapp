import type { Mood } from '../game/store';

const MOUTH: Record<Mood, string> = {
  idle: 'M38 62 Q50 70 62 62',
  happy: 'M34 58 Q50 80 66 58 Z',
  cheer: 'M34 58 Q50 80 66 58 Z',
  thinking: 'M42 63 Q52 70 60 62',
};

/** One bear everywhere. Thinking is calm and curious, never sad. */
export const mouthFor = (mood: Mood) => MOUTH[mood];

export function Mascot({ mood = 'idle', size = 96 }: { mood?: Mood; size?: number }) {
  const closedEyes = mood === 'happy' || mood === 'cheer';
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      data-mood={mood}
      className={mood === 'happy' || mood === 'cheer' ? 'bounce shrink-0' : 'shrink-0'}
    >
      <circle cx="22" cy="24" r="14" fill="#c98b53" />
      <circle cx="78" cy="24" r="14" fill="#c98b53" />
      <circle cx="22" cy="24" r="7" fill="#f4c99b" />
      <circle cx="78" cy="24" r="7" fill="#f4c99b" />
      <circle cx="50" cy="52" r="38" fill="#d99c63" />
      <ellipse cx="50" cy="63" rx="20" ry="16" fill="#f4dcc0" />
      <ellipse cx="50" cy="53" rx="6" ry="4.5" fill="#1d3557" />
      {closedEyes ? (
        <g stroke="#1d3557" strokeWidth="3.5" fill="none" strokeLinecap="round">
          <path d="M28 42 Q34 35 40 42" />
          <path d="M60 42 Q66 35 72 42" />
        </g>
      ) : (
        // Thinking looks up and to the side, the way a curious child does.
        <g fill="#1d3557">
          <circle cx={mood === 'thinking' ? 37 : 34} cy={mood === 'thinking' ? 38 : 41} r="4.5" />
          <circle cx={mood === 'thinking' ? 69 : 66} cy={mood === 'thinking' ? 38 : 41} r="4.5" />
        </g>
      )}
      <path
        d={MOUTH[mood]}
        fill={closedEyes ? '#e76f51' : 'none'}
        stroke="#1d3557"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
