import { MILESTONES } from '@mathapp/engine';

const MAX_LEAVES = 14;

/** Leaves drawn: one a day up to the cap. Past that the plant blooms instead. */
export const leavesFor = (days: number) => Math.min(days, MAX_LEAVES);
export const flowersFor = (days: number) => MILESTONES.filter((m) => m <= days).length;

/**
 * The streak as something alive. It only ever looks healthy: a new streak is a fresh sprout,
 * and nothing here can wilt, droop or turn brown.
 */
export function Plant({ days, size = 110 }: { days: number; size?: number }) {
  const leaves = leavesFor(days);
  const top = 70 - leaves * 5;
  const flowers = flowersFor(days);
  return (
    <svg
      viewBox="0 -14 100 124"
      width={size}
      height={size * 1.24}
      role="img"
      aria-label={`plant, ${days} days`}
    >
      <line
        x1="50"
        y1="88"
        x2="50"
        y2={top}
        stroke="#3f9e4d"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {Array.from({ length: leaves }, (_, i) => {
        const y = 78 - i * 5;
        const left = i % 2 === 0;
        const x = left ? 34 : 66;
        return (
          <ellipse
            key={i}
            data-leaf
            cx={x}
            cy={y}
            rx="16"
            ry="7"
            fill="#5cc26c"
            stroke="#2d7a3a"
            strokeWidth="1.5"
            transform={`rotate(${left ? 22 : -22} ${x} ${y})`}
          />
        );
      })}
      {leaves === 0 && <ellipse cx="50" cy="68" rx="9" ry="6" fill="#5cc26c" stroke="#2d7a3a" />}
      {Array.from({ length: flowers }, (_, i) => (
        <circle
          key={i}
          data-flower
          cx={50 + (i - (flowers - 1) / 2) * 13}
          cy={top - 2 - (i % 2) * 6}
          r="7"
          fill="#ffb703"
          stroke="#e76f51"
          strokeWidth="2"
        />
      ))}
      <path
        d="M24 88 H76 L69 108 H31 Z"
        fill="#e0916a"
        stroke="#1d3557"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
