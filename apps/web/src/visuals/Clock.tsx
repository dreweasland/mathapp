const NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

const point = (turns: number, radius: number) => {
  const angle = turns * 2 * Math.PI;
  return { x: 50 + radius * Math.sin(angle), y: 50 - radius * Math.cos(angle) };
};

interface ClockProps {
  hour: number;
  minute: number;
  /** A blank face with these numbers picked out: a hint that doesn't hand over the hands. */
  highlight?: number[];
  hands?: boolean;
  size?: number;
}

export function Clock({ hour, minute, highlight = [], hands = true, size = 120 }: ClockProps) {
  const hourTurns = ((hour % 12) + minute / 60) / 12;
  const hourHand = point(hourTurns, 17);
  const minuteHand = point(minute / 60, 27);
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`clock showing ${hour}:${String(minute).padStart(2, '0')}`}
      data-hour={hour}
      data-minute={minute}
    >
      <circle cx="50" cy="50" r="47" fill="white" stroke="#1d3557" strokeWidth="4" />
      {NUMBERS.map((n) => {
        const { x, y } = point(n / 12, 36);
        const on = highlight.includes(n);
        return (
          <g key={n}>
            {on && <circle cx={x} cy={y} r="8" fill="#ffb703" />}
            <text x={x} y={y + 4} fontSize="11" fontWeight="700" textAnchor="middle" fill="#1d3557">
              {n}
            </text>
          </g>
        );
      })}
      {hands && (
        <g strokeLinecap="round">
          <line
            x1="50"
            y1="50"
            x2={minuteHand.x}
            y2={minuteHand.y}
            stroke="#1d7a9c"
            strokeWidth="3.5"
          />
          <line
            x1="50"
            y1="50"
            x2={hourHand.x}
            y2={hourHand.y}
            stroke="#1d3557"
            strokeWidth="5.5"
          />
        </g>
      )}
      <circle cx="50" cy="50" r="3.5" fill="#1d3557" />
    </svg>
  );
}
