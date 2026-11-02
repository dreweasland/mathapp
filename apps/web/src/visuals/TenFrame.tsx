const CELLS = Array.from({ length: 10 }, (_, i) => i);

export type CellFill = 'empty' | 'a' | 'b' | 'answer';

const FILL: Record<CellFill, string> = {
  empty: 'bg-white',
  a: 'bg-sky',
  b: 'bg-sun',
  answer: 'bg-leaf',
};

function Frame({ fill, compact }: { fill: (index: number) => CellFill; compact: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-px overflow-hidden rounded-lg border-2 border-ink bg-ink">
      {CELLS.map((i) => (
        <div
          key={i}
          className={`flex aspect-square items-center justify-center bg-white ${compact ? 'w-7' : 'w-11'}`}
        >
          {fill(i) !== 'empty' && (
            <span className={`block h-3/4 w-3/4 rounded-full ${FILL[fill(i)]}`} data-dot />
          )}
        </div>
      ))}
    </div>
  );
}

/** Read-only frames: dots from `a`, then dots from `b`. A total over 10 flows into a second frame. */
export function TenFrames({
  a,
  b = 0,
  compact = false,
}: {
  a: number;
  b?: number;
  compact?: boolean;
}) {
  const total = a + b;
  const fillAt = (i: number): CellFill => (i < a ? 'a' : i < total ? 'b' : 'empty');
  return (
    <div className="flex flex-wrap justify-center gap-2" role="img" aria-label={`${total} dots`}>
      <Frame fill={fillAt} compact={compact} />
      {total > 10 && <Frame fill={(i) => fillAt(i + 10)} compact={compact} />}
    </div>
  );
}
