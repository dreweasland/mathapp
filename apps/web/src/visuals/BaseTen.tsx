/** A rod is one ten; a cube is one. `crossed` marks the tens taken away. */
export function BaseTen({
  tens,
  ones,
  crossed = 0,
}: {
  tens: number;
  ones: number;
  crossed?: number;
}) {
  return (
    <div
      className="flex flex-wrap items-end justify-center gap-1"
      role="img"
      aria-label={`${tens} tens and ${ones} ones`}
    >
      {Array.from({ length: tens }, (_, i) => (
        <div
          key={i}
          data-rod
          className={`h-20 w-3 rounded-sm border-2 border-ink ${i >= tens - crossed ? 'bg-white opacity-50' : 'bg-sky'}`}
        />
      ))}
      <div className="ml-2 grid grid-cols-5 gap-0.5">
        {Array.from({ length: ones }, (_, i) => (
          <div key={i} data-cube className="h-3.5 w-3.5 rounded-sm border-2 border-ink bg-sun" />
        ))}
      </div>
    </div>
  );
}
