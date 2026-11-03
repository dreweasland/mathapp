import type { Problem } from '@mathapp/engine';
import { BaseTen } from '../visuals/BaseTen';
import { Clock } from '../visuals/Clock';
import { CountedSides, Shape, Shares } from '../visuals/Shape';
import { LengthBar, lengthObjects } from '../visuals/Lengths';
import { TenFrames } from '../visuals/TenFrame';

const num = (value: number | string | undefined, fallback = 0) =>
  typeof value === 'number' ? value : fallback;

/** A short stretch of the line, with hops from `from` by `step`. */
function Hops({ from, hops, step }: { from: number; hops: number; step: 1 | -1 }) {
  const end = from + hops * step;
  const low = Math.max(0, Math.min(from, end) - 1);
  const high = Math.max(from, end) + 1;
  const ticks = Array.from({ length: high - low + 1 }, (_, i) => low + i);
  const between = (n: number) =>
    n !== from && (step === 1 ? n > from && n <= end : n < from && n >= end);
  return (
    <div
      className="flex w-full justify-center gap-px"
      role="img"
      aria-label={`${hops} hops from ${from}`}
    >
      {ticks.map((n) => (
        <div key={n} className="flex min-w-0 flex-1 flex-col items-center" data-tick={n}>
          <span className="h-5 text-base leading-none" aria-hidden="true">
            {between(n) ? '⌒' : ''}
          </span>
          <span
            className={`flex aspect-square w-full max-w-9 items-center justify-center rounded-full border-2 text-sm font-bold ${
              n === from ? 'border-ink bg-sun' : 'border-ink/40 bg-white'
            }`}
          >
            {n}
          </span>
        </div>
      ))}
    </div>
  );
}

function Counters({ a, b, taking }: { a: number; b: number; taking: boolean }) {
  const total = taking ? a : a + b;
  return (
    <div
      className="flex flex-wrap justify-center gap-1"
      role="img"
      aria-label={`${total} counters`}
    >
      {Array.from({ length: total }, (_, i) => {
        const away = taking && i >= a - b;
        const second = !taking && i >= a;
        return (
          <span
            key={i}
            data-counter={away ? 'away' : 'stay'}
            className={`h-7 w-7 rounded-full border-2 border-ink ${
              away ? 'border-dashed bg-white' : second ? 'bg-sun' : 'bg-sky'
            }`}
          />
        );
      })}
    </div>
  );
}

function PartWhole({ a, b, whole }: { a: number; b: number; whole: number }) {
  return (
    <div
      className="w-full max-w-72 text-center text-2xl font-extrabold"
      role="img"
      aria-label="parts and whole"
    >
      <div className="rounded-t-lg border-2 border-ink bg-white py-1">{whole}</div>
      <div className="flex">
        <div className="border-2 border-t-0 border-ink bg-sky py-1" style={{ flex: a }}>
          {a}
        </div>
        <div className="border-2 border-t-0 border-l-0 border-ink bg-sun py-1" style={{ flex: b }}>
          {b}
        </div>
      </div>
    </div>
  );
}

/** Rods and cubes for each number, so "bigger" can be seen before the sign is chosen. */
function Alligator({ a, b, showSign }: { a: number; b: number; showSign: boolean }) {
  const sign = a > b ? '>' : a < b ? '<' : '=';
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="text-center">
        <BaseTen tens={Math.floor(a / 10)} ones={a % 10} />
        <p className="text-2xl font-extrabold">{a}</p>
      </div>
      <span className="text-3xl font-extrabold" aria-hidden="true">
        {showSign ? sign : '🐊'}
      </span>
      <div className="text-center">
        <BaseTen tens={Math.floor(b / 10)} ones={b % 10} />
        <p className="text-2xl font-extrabold">{b}</p>
      </div>
    </div>
  );
}

function clockNumbers(hour: number, minute: number) {
  return minute === 0 ? [hour, 12] : [hour, 6];
}

function SortedLengths({ problem }: { problem: Problem }) {
  const o = problem.operands;
  if (o.kind !== 'lengths' || !problem.picture) return null;
  const objects = lengthObjects(problem.picture.scene);
  const longest = Math.max(...o.lengths);
  const rows = o.lengths
    .map((length, i) => ({ length, index: i, object: objects[i] ?? '' }))
    .sort((x, y) => x.length - y.length);
  return (
    <div className="flex w-full max-w-72 flex-col gap-1 border-l-4 border-dashed border-ink pl-1">
      {rows.map((row) => (
        <LengthBar
          key={row.object}
          index={row.index}
          length={row.length}
          longest={longest}
          object={row.object}
        />
      ))}
    </div>
  );
}

/** The picture for a hint. `reveal` also shows what the hint leaves for the child to work out. */
export function Hint({ problem, reveal }: { problem: Problem; reveal: boolean }) {
  const { visual, params } = problem.hint;
  const o = problem.operands;
  const a = num(params?.['a']);
  const b = num(params?.['b']);
  switch (visual) {
    case 'ten-frame':
      if (params?.['filled'] !== undefined) {
        const filled = num(params['filled']);
        const add = reveal && o.kind === 'missing-addend' ? o.whole - filled : 0;
        return <TenFrames a={filled} b={add} compact />;
      }
      return <TenFrames a={a} b={b} compact />;
    case 'double-ten-frame': {
      if (o.kind === 'missing-addend')
        return <TenFrames a={o.known} b={o.whole - o.known} compact />;
      if (o.kind === 'arith' && o.op === 'sub') return <Counters a={o.a} b={o.b} taking />;
      return (
        <TenFrames a={o.kind === 'arith' ? o.a : a} b={o.kind === 'arith' ? o.b : b} compact />
      );
    }
    case 'number-line': {
      if (params?.['from'] !== undefined) {
        return <Hops from={num(params['from'])} hops={num(params['back'])} step={-1} />;
      }
      if (o.kind === 'sequence') return <Hops from={o.from} hops={1} step={o.step} />;
      if (o.kind === 'arith' && o.op === 'add') return <Hops from={o.a} hops={o.b} step={1} />;
      if (o.kind === 'arith') return <Hops from={o.a} hops={o.b} step={-1} />;
      return <Hops from={num(params?.['n'])} hops={0} step={1} />;
    }
    case 'counters':
      return <Counters a={a} b={b} taking={o.kind === 'arith' && o.op === 'sub'} />;
    case 'base-ten': {
      if (params?.['tens'] !== undefined) {
        return <BaseTen tens={num(params['tens'])} ones={num(params['ones'])} />;
      }
      if (o.kind === 'arith' && o.op === 'sub') {
        return <BaseTen tens={Math.floor(o.a / 10)} ones={o.a % 10} crossed={o.b / 10} />;
      }
      const total = a + b;
      return <BaseTen tens={Math.floor(total / 10)} ones={total % 10} />;
    }
    case 'alligator':
      return <Alligator a={a} b={b} showSign={reveal} />;
    case 'clock': {
      if (o.kind !== 'clock') return null;
      return reveal ? (
        <Clock hour={o.hour} minute={o.minute} size={110} />
      ) : (
        <Clock
          hour={o.hour}
          minute={o.minute}
          hands={false}
          highlight={clockNumbers(o.hour, o.minute)}
          size={110}
        />
      );
    }
    case 'shape': {
      if (o.kind === 'shape-sides') return <CountedSides shape={o.shape} size={110} />;
      if (o.kind === 'shape-name') return <Shape shape={o.shape} size={90} />;
      if (o.kind === 'shares') return <Shares shape={o.shape} parts={o.parts} equal size={90} />;
      return null;
    }
    case 'bars':
      if (o.kind === 'family') return <PartWhole a={o.a} b={o.b} whole={o.a + o.b} />;
      return <SortedLengths problem={problem} />;
  }
}
