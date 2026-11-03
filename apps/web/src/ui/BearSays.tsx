import { render } from '@mathapp/content';
import type { Speech } from '@mathapp/engine';
import type { Mood } from '../game/store';
import { useGame } from '../game/GameProvider';
import { MyMascot } from './MyMascot';

/** What the bear said, written out. "Again" buttons say it again; this only shows it. */
export function Bubble({
  line,
  className = '',
  tail = 'left',
}: {
  line: Speech | undefined;
  className?: string;
  tail?: 'left' | 'none';
}) {
  if (!line) return null;
  let text: string;
  try {
    text = render(line.key, line.params);
  } catch {
    return null;
  }
  return (
    <p
      data-testid="bubble"
      aria-live="polite"
      className={`bubble ${tail === 'left' ? 'bubble-left' : ''} min-w-0 ${className}`}
    >
      {text}
    </p>
  );
}

/** The bear with its speech bubble: how every screen tells the child what's happening. */
export function BearSays({
  mood = 'idle',
  size = 84,
  line,
  className = '',
}: {
  mood?: Mood;
  size?: number;
  /** Defaults to the bear's last spoken line. */
  line?: Speech;
  className?: string;
}) {
  const { use } = useGame();
  const caption = use((s) => s.caption);
  const shown = line ?? caption;
  return (
    <div className={`flex w-full max-w-md items-center gap-3 ${className}`}>
      <MyMascot mood={mood} size={size} />
      <Bubble line={shown} className="flex-1" />
    </div>
  );
}
