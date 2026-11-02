import type { ReactNode } from 'react';

/** A hundreds flat, a tens rod and ones cubes in one row: base-ten past 99. */
export function Blocks({ hundreds, tens, ones }: { hundreds: number; tens: number; ones: number }) {
  return (
    <div
      className="flex flex-wrap items-end justify-center gap-1"
      role="img"
      aria-label={`${hundreds} hundreds, ${tens} tens and ${ones} ones`}
    >
      {Array.from({ length: hundreds }, (_, i) => (
        <div key={i} data-flat className="h-11 w-11 rounded-sm border-2 border-ink bg-leaf" />
      ))}
      {Array.from({ length: tens }, (_, i) => (
        <div key={i} data-rod className="h-11 w-2.5 rounded-sm border-2 border-ink bg-sky" />
      ))}
      <div className="ml-1 grid grid-cols-5 gap-0.5">
        {Array.from({ length: ones }, (_, i) => (
          <div key={i} data-cube className="h-2.5 w-2.5 rounded-sm border border-ink bg-sun" />
        ))}
      </div>
    </div>
  );
}

const digitsOf = (n: number) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];

/** Hundreds, tens and ones lined up, so regrouping has a place to happen. */
export function PlaceChart({ rows, sign }: { rows: number[]; sign?: string }) {
  const hasHundreds = rows.some((n) => n >= 100);
  const columns = hasHundreds ? ['H', 'T', 'O'] : ['T', 'O'];
  return (
    <table
      className="border-collapse text-center text-2xl font-extrabold tabular-nums"
      aria-label="place chart"
    >
      <thead>
        <tr>
          <th />
          {columns.map((c, i) => (
            <th
              key={c}
              className={`w-11 text-base ${['bg-leaf', 'bg-sky', 'bg-sun'][i + 3 - columns.length]}`}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((n, r) => (
          <tr key={r}>
            <td className="w-6">{r === rows.length - 1 ? sign : ''}</td>
            {digitsOf(n)
              .slice(3 - columns.length)
              .map((digit, i) => (
                <td key={i} data-digit className="border-2 border-ink bg-white">
                  {digit}
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Equal rows of dots, sized down so the largest still fits a small phone. */
export function DotArray({
  rows,
  cols,
  labels = false,
}: {
  rows: number;
  cols: number;
  labels?: boolean;
}) {
  const size = cols > 7 ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div
      className="flex flex-col gap-1"
      role="img"
      aria-label={`${rows} rows of ${cols}`}
      data-testid="dot-array"
    >
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-1">
          {Array.from({ length: cols }, (_, c) => (
            <span
              key={c}
              data-dot-cell
              className={`${size} rounded-full border-2 border-ink bg-sky`}
            />
          ))}
          {/* Counts along each row and stops short: the last total is the child's to find. */}
          {labels && (
            <span className="ml-1 text-lg font-extrabold">
              {r === rows - 1 ? '?' : cols * (r + 1)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Equal groups, each in its own ring. */
export function EqualGroups({ groups, each }: { groups: number; each: number }) {
  return (
    <div
      className="flex flex-wrap justify-center gap-1.5"
      role="img"
      aria-label={`${groups} groups of ${each}`}
    >
      {Array.from({ length: groups }, (_, g) => (
        <div
          key={g}
          data-group
          className="flex w-[4.5rem] flex-wrap justify-center gap-0.5 rounded-xl border-2 border-ink bg-white p-1"
        >
          {Array.from({ length: each }, (_, i) => (
            <span key={i} className="h-3 w-3 rounded-full bg-sun ring-1 ring-ink" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Dots two by two: a lone dot at the end means odd. */
export function Pairs({ n }: { n: number }) {
  return (
    <div
      className="flex flex-wrap justify-center gap-1.5"
      role="img"
      aria-label={`${n} dots in pairs`}
    >
      {Array.from({ length: Math.ceil(n / 2) }, (_, i) => {
        const single = i === Math.ceil(n / 2) - 1 && n % 2 === 1;
        return (
          <div key={i} data-pair={single ? 'single' : 'pair'} className="flex flex-col gap-0.5">
            <span className="h-4 w-4 rounded-full bg-sky ring-2 ring-ink" />
            {!single && <span className="h-4 w-4 rounded-full bg-sky ring-2 ring-ink" />}
          </div>
        );
      })}
    </div>
  );
}

const COIN_LOOK: Record<number, { size: string; color: string }> = {
  1: { size: 'h-10 w-10', color: 'bg-[#d9925b]' },
  5: { size: 'h-12 w-12', color: 'bg-[#cfd6dc]' },
  10: { size: 'h-9 w-9', color: 'bg-[#e4e9ed]' },
  25: { size: 'h-14 w-14', color: 'bg-[#dfe5ea]' },
};

/** Real relative sizes (a dime really is the smallest), and always labeled. */
export function Coin({ cents }: { cents: number }) {
  if (cents >= 100) {
    return (
      <span
        data-bill={cents / 100}
        className="flex h-12 w-20 items-center justify-center rounded-md border-2 border-ink bg-leaf text-lg font-extrabold"
      >
        ${cents / 100}
      </span>
    );
  }
  const look = COIN_LOOK[cents] ?? { size: 'h-10 w-10', color: 'bg-white' };
  return (
    <span
      data-coin={cents}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-ink text-sm font-extrabold ${look.size} ${look.color}`}
    >
      {cents}¢
    </span>
  );
}

export function CoinRow({ items }: { items: number[] }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-1.5" role="img" aria-label="money">
      {items.map((coin, i) => (
        <Coin key={i} cents={coin} />
      ))}
    </div>
  );
}

/** Counting up, one coin at a time, and stopping short of the total. */
export function RunningTotal({ items }: { items: number[] }) {
  const totals = items.map((_, i) => items.slice(0, i + 1).reduce((s, c) => s + c, 0));
  const dollars = items.some((c) => c >= 100);
  const label = (n: number) => (dollars ? `$${n / 100}` : `${n}¢`);
  return (
    <p className="text-center text-2xl font-extrabold tabular-nums" data-testid="running-total">
      {[...totals.slice(0, -1).map(label), '?'].join(' → ')}
    </p>
  );
}

const UNIT_PX = { in: 34, cm: 17 } as const;

/** An object lying against a ruler. Sizes are for counting, not true to life. */
export function Ruler({
  length,
  unit,
  marked = false,
}: {
  length: number;
  unit: 'in' | 'cm';
  marked?: boolean;
}) {
  const total = Math.max(length + 1, unit === 'in' ? 9 : 16);
  const px = Math.min(UNIT_PX[unit], Math.floor(330 / total));
  return (
    <div className="ml-2 max-w-full" role="img" aria-label="ruler" data-testid="ruler">
      <div
        data-object
        className="mb-1 h-6 rounded-r-full border-2 border-ink bg-sun"
        style={{ width: length * px }}
      />
      <div
        className="relative h-10 rounded-sm border-2 border-ink bg-white"
        style={{ width: total * px }}
      >
        {Array.from({ length: total + 1 }, (_, i) => (
          <span key={i} className="absolute top-0 h-3 w-0.5 bg-ink" style={{ left: i * px - 1 }}>
            {i < total && i % (unit === 'cm' ? 2 : 1) === 0 && (
              <span
                className={`absolute top-3 -translate-x-1/2 text-sm font-bold ${marked && i === length ? 'rounded bg-sun px-0.5' : ''}`}
              >
                {i}
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="text-right text-base font-extrabold">{unit}</p>
    </div>
  );
}

/** A stacked fraction, so 1/4 reads the way it does on paper. */
export function Frac({ n, d, blank = false }: { n: number; d: number; blank?: boolean }) {
  return (
    <span
      className="inline-flex flex-col items-center align-middle leading-none font-extrabold tabular-nums"
      aria-label={`${blank ? 'what' : n} over ${d}`}
    >
      <span className="px-1">{blank ? '?' : n}</span>
      <span className="my-0.5 h-1 w-full rounded bg-ink" />
      <span className="px-1">{d}</span>
    </span>
  );
}

export function FractionBar({ n, d }: { n: number; d: number }) {
  return (
    <div
      className={'flex h-12 w-72 max-w-full overflow-hidden rounded-md border-3 border-ink'}
      role="img"
      aria-label={`${n} of ${d} parts colored`}
      data-testid="fraction-bar"
    >
      {Array.from({ length: d }, (_, i) => (
        <span
          key={i}
          data-part={i < n ? 'on' : 'off'}
          className={`flex-1 border-ink ${i > 0 ? 'border-l-2' : ''} ${i < n ? 'bg-sun' : 'bg-white'}`}
        />
      ))}
    </div>
  );
}

/** 0 to 1 with equal ticks, and the dot on the fraction. */
export function FractionLine({ n, d, dot = true }: { n: number; d: number; dot?: boolean }) {
  return (
    <div
      className="relative mx-6 mt-5 mb-7 h-1 w-64 max-w-[80%] bg-ink"
      role="img"
      aria-label={`number line in ${d} parts`}
      data-testid="fraction-line"
    >
      {Array.from({ length: d + 1 }, (_, i) => (
        <span
          key={i}
          data-tick
          className="absolute -top-2 h-5 w-0.5 bg-ink"
          style={{ left: `${(i / d) * 100}%` }}
        />
      ))}
      {dot && (
        <span
          data-mark
          className="absolute -top-3 h-7 w-7 -translate-x-1/2 rounded-full border-3 border-ink bg-sun"
          style={{ left: `${(n / d) * 100}%` }}
        />
      )}
      <span className="absolute top-3 left-0 -translate-x-1/2 text-xl font-extrabold">0</span>
      <span className="absolute top-3 left-full -translate-x-1/2 text-xl font-extrabold">1</span>
    </div>
  );
}

/** Rectangle of unit squares with its sides labeled. `count` numbers the first row only. */
export function AreaGrid({
  w,
  h,
  edge = false,
  count = false,
}: {
  w: number;
  h: number;
  edge?: boolean;
  count?: boolean;
}) {
  const px = Math.min(30, Math.floor(280 / w));
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`rectangle ${w} by ${h}`}
      data-testid="area-grid"
    >
      <span className="text-2xl font-extrabold">{h}</span>
      <div>
        <div
          className="grid border-2 border-ink"
          style={{
            gridTemplateColumns: `repeat(${w}, ${px}px)`,
            outline: edge ? '3px solid #ffb703' : undefined,
          }}
        >
          {Array.from({ length: w * h }, (_, i) => (
            <span
              key={i}
              data-square
              className="flex items-center justify-center border border-ink/40 bg-sky/40 text-xs font-bold"
              style={{ height: px }}
            >
              {count && i < w ? i + 1 : ''}
            </span>
          ))}
        </div>
        <p className="text-center text-2xl font-extrabold">{w}</p>
      </div>
    </div>
  );
}

/** A short line between two round numbers, to show which one is closer. */
export function RoundLine({ low, high, n }: { low: number; high: number; n: number }) {
  const place = ((n - low) / (high - low)) * 100;
  return (
    <div
      className="relative mx-8 mt-8 mb-7 h-1 w-56 max-w-[75%] bg-ink"
      role="img"
      aria-label={`${n} between ${low} and ${high}`}
      data-testid="round-line"
    >
      <span className="absolute -top-2 left-1/2 h-5 w-0.5 bg-ink/50" />
      <span
        data-mark
        className="absolute -top-8 -translate-x-1/2 text-lg font-extrabold"
        style={{ left: `${place}%` }}
      >
        {n}
      </span>
      <span
        className="absolute -top-2.5 h-6 w-6 -translate-x-1/2 rounded-full border-3 border-ink bg-sun"
        style={{ left: `${place}%` }}
      />
      <span className="absolute top-3 left-0 -translate-x-1/2 text-xl font-extrabold">{low}</span>
      <span className="absolute top-3 left-full -translate-x-1/2 text-xl font-extrabold">
        {high}
      </span>
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border-2 border-ink bg-white px-3 py-1 text-2xl font-extrabold tabular-nums">
      {children}
    </span>
  );
}
