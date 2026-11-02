import { LENGTH_EMOJI } from './scenes';

const COLORS = ['bg-sky', 'bg-sun', 'bg-leaf'];

/** One object drawn to scale against the longest in the problem. */
export function LengthBar({
  index,
  length,
  longest,
  object,
}: {
  index: number;
  length: number;
  longest: number;
  object: string;
}) {
  return (
    <div className="flex w-full items-center gap-2" role="img" aria-label={object}>
      <span className="text-3xl leading-none">{LENGTH_EMOJI[object]}</span>
      <div className="min-w-0 flex-1">
        <div
          className={`h-7 rounded-full border-2 border-ink ${COLORS[index % COLORS.length]}`}
          style={{ width: `${(length / longest) * 100}%` }}
          data-length={length}
        />
      </div>
    </div>
  );
}

export const lengthObjects = (scene: string) => scene.replace('lengths:', '').split(',');
