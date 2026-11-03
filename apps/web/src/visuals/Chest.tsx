import type { ChestTier } from '@mathapp/engine';

const COLOR: Record<ChestTier, string> = {
  bronze: '#c98b53',
  silver: '#b8c4d0',
  gold: '#ffb703',
  perfect: '#c084fc',
};

export function Chest({ tier, size = 120 }: { tier: ChestTier; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 84"
      width={size}
      height={size * 0.84}
      role="img"
      aria-label={`${tier} chest`}
    >
      <rect
        x="6"
        y="34"
        width="88"
        height="46"
        rx="6"
        fill={COLOR[tier]}
        stroke="#1d3557"
        strokeWidth="4"
      />
      <path
        d="M6 36 Q6 6 50 6 Q94 6 94 36 Z"
        fill={COLOR[tier]}
        stroke="#1d3557"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect
        x="42"
        y="28"
        width="16"
        height="20"
        rx="3"
        fill="#fff8e7"
        stroke="#1d3557"
        strokeWidth="3"
      />
      {tier === 'perfect' && (
        <text x="50" y="72" fontSize="20" textAnchor="middle">
          ⭐
        </text>
      )}
    </svg>
  );
}
