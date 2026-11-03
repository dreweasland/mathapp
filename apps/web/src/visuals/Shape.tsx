import type { ShapeName } from '@mathapp/engine';

const STROKE = { stroke: '#1d3557', strokeWidth: 3, strokeLinejoin: 'round' } as const;

const OUTLINE: Record<ShapeName, string> = {
  circle: '',
  square: '15,15 85,15 85,85 15,85',
  rectangle: '5,28 95,28 95,72 5,72',
  triangle: '50,10 92,86 8,86',
  hexagon: '27,12 73,12 96,50 73,88 27,88 4,50',
  trapezoid: '30,22 70,22 94,78 6,78',
  rhombus: '50,6 86,50 50,94 14,50',
};

const COLOR: Record<ShapeName, string> = {
  circle: '#ffb703',
  square: '#7fd1e8',
  rectangle: '#9be3b4',
  triangle: '#f7a98b',
  hexagon: '#c9b6f2',
  trapezoid: '#ffd77a',
  rhombus: '#f5b4d2',
};

const body = (shape: ShapeName, fill: string) =>
  shape === 'circle' ? (
    <circle cx="50" cy="50" r="42" fill={fill} {...STROKE} />
  ) : (
    <polygon points={OUTLINE[shape]} fill={fill} {...STROKE} />
  );

export function Shape({
  shape,
  size = 96,
  className,
}: {
  shape: ShapeName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={shape}
      className={className}
    >
      {body(shape, COLOR[shape])}
    </svg>
  );
}

/** Numbers each side, for "how many sides". */
export function CountedSides({ shape, size = 96 }: { shape: ShapeName; size?: number }) {
  const points = OUTLINE[shape].split(' ').map((p) => p.split(',').map(Number) as [number, number]);
  return (
    <svg
      viewBox="-12 -12 124 124"
      width={size}
      height={size}
      role="img"
      aria-label={`${shape} sides`}
    >
      {body(shape, COLOR[shape])}
      {points.map(([x, y], i) => {
        const [nx, ny] = points[(i + 1) % points.length] as [number, number];
        const mx = (x + nx) / 2;
        const my = (y + ny) / 2;
        const out = Math.hypot(mx - 50, my - 50) || 1;
        return (
          <text
            key={i}
            x={mx + ((mx - 50) / out) * 8}
            y={my + ((my - 50) / out) * 8 + 4}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="#1d3557"
          >
            {i + 1}
          </text>
        );
      })}
    </svg>
  );
}

const LINES = { stroke: '#1d3557', strokeWidth: 3 } as const;

/** Cuts for each share picture. Unequal cuts are clearly off-centre. */
function cuts(shape: 'circle' | 'square' | 'rectangle', parts: number, equal: boolean) {
  const [left, right, top, bottom] =
    shape === 'rectangle'
      ? [5, 95, 28, 72]
      : shape === 'square'
        ? [15, 85, 15, 85]
        : [8, 92, 8, 92];
  const midX = equal ? 50 : left + (right - left) * 0.24;
  const midY = equal ? 50 : top + (bottom - top) * 0.24;
  return (
    <>
      <line x1={midX} y1={top} x2={midX} y2={bottom} {...LINES} />
      {parts === 4 && <line x1={left} y1={midY} x2={right} y2={midY} {...LINES} />}
    </>
  );
}

export function Shares({
  shape,
  parts,
  equal,
  size = 96,
}: {
  shape: 'circle' | 'square' | 'rectangle';
  parts: number;
  equal: boolean;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`${shape} in ${parts} ${equal ? 'equal' : 'unequal'} parts`}
    >
      <defs>
        <clipPath id={`clip-${shape}`}>{body(shape, 'white')}</clipPath>
      </defs>
      {body(shape, COLOR[shape])}
      <g clipPath={`url(#clip-${shape})`}>{cuts(shape, parts, equal)}</g>
    </svg>
  );
}

/** Side lengths for each shape, as a share of the longest, in drawing order. */
const STICKS: Record<ShapeName, number[]> = {
  circle: [],
  triangle: [1, 1, 1],
  square: [1, 1, 1, 1],
  rectangle: [1, 0.5, 1, 0.5],
  hexagon: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6],
  trapezoid: [0.5, 0.75, 1, 0.75],
  rhombus: [0.8, 0.8, 0.8, 0.8],
};
const STICK_COLORS = ['#e76f51', '#5b8fd6', '#4caf7a', '#ffb703', '#c08bd6', '#f4a261'];

/**
 * A clue for "tap the shape": its sides as loose sticks, never the shape itself, so the
 * child still has to match the clue to the right picture. A circle has no sticks: it's a bend.
 */
export function SideSticks({ shape, size = 120 }: { shape: ShapeName; size?: number }) {
  const sticks = STICKS[shape];
  const height = size * 0.5;
  if (sticks.length === 0) {
    return (
      <svg
        viewBox="0 0 120 60"
        width={size}
        height={height}
        role="img"
        aria-label="no straight sides"
      >
        <path
          d="M14 46 C30 6 90 6 106 46"
          fill="none"
          stroke="#ffb703"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  const gap = 120 / sticks.length;
  return (
    <svg
      viewBox="0 0 120 60"
      width={size}
      height={height}
      role="img"
      aria-label={`${sticks.length} sides`}
      data-testid="side-sticks"
    >
      {sticks.map((len, i) => {
        const x = gap * i + gap / 2;
        const half = (len * 48) / 2;
        return (
          <line
            key={i}
            x1={x}
            y1={30 - half}
            x2={x}
            y2={30 + half}
            stroke={STICK_COLORS[i % STICK_COLORS.length]}
            strokeWidth="7"
            strokeLinecap="round"
            transform={shape === 'rhombus' ? `rotate(25 ${x} 30)` : undefined}
          />
        );
      })}
    </svg>
  );
}

/** For "how many sides": each side its own colour and a dot to start from, but no numbers. */
export function ColouredSides({
  shape,
  size = 96,
  className,
}: {
  shape: ShapeName;
  size?: number;
  className?: string;
}) {
  const points = OUTLINE[shape].split(' ').map((p) => p.split(',').map(Number) as [number, number]);
  const [sx, sy] = points[0] ?? [50, 50];
  return (
    <svg
      viewBox="-6 -6 112 112"
      width={size}
      height={size}
      role="img"
      aria-label={`${shape} to count`}
      className={className}
    >
      {body(shape, '#fff')}
      {points.map(([x, y], i) => {
        const [nx, ny] = points[(i + 1) % points.length] as [number, number];
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={nx}
            y2={ny}
            stroke={STICK_COLORS[i % STICK_COLORS.length]}
            strokeWidth="7"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={sx} cy={sy} r="6" fill="#1d3557" />
    </svg>
  );
}
