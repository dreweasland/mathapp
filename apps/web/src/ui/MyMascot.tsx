import { artFor, cosmeticFor } from '@mathapp/content';
import type { Mood } from '../game/store';
import { useGame } from '../game/GameProvider';
import { Mascot } from './Mascot';

const emoji = (id: string | undefined) => (id ? artFor(id)?.emoji : undefined);

/** The bear wearing `equipped`. Cosmetic only: nothing here changes how the app works. */
export function DressedMascot({
  equipped,
  mood,
  size,
}: {
  equipped: Record<string, string>;
  mood: Mood;
  size: number;
}) {
  const background = emoji(equipped['background']);
  const hat = emoji(equipped['hat']);
  const accessory = emoji(equipped['accessory']);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} data-testid="mascot">
      {background && (
        <span
          aria-hidden="true"
          data-wear="background"
          className="absolute inset-0 flex items-center justify-center opacity-40"
          style={{ fontSize: size * 0.85 }}
        >
          {background}
        </span>
      )}
      <div className="absolute inset-0">
        <Mascot mood={mood} size={size} />
      </div>
      {hat && (
        <span
          aria-hidden="true"
          data-wear="hat"
          className="absolute left-1/2 -translate-x-1/2"
          style={{ fontSize: size * 0.34, top: -size * 0.27 }}
        >
          {hat}
        </span>
      )}
      {accessory && (
        <span
          aria-hidden="true"
          data-wear="accessory"
          className="absolute left-1/2 -translate-x-1/2"
          style={{ fontSize: size * 0.26, bottom: -size * 0.04 }}
        >
          {accessory}
        </span>
      )}
    </div>
  );
}

/** The child's own bear, dressed the way they left it, everywhere it appears. */
export function MyMascot({ mood = 'idle', size = 96 }: { mood?: Mood; size?: number }) {
  const { use } = useGame();
  const equipped = use((s) => s.progress?.inventory.mascotEquipped) ?? {};
  const worn = Object.fromEntries(
    Object.entries(equipped).filter(([, id]) => cosmeticFor(id) !== undefined),
  );
  return <DressedMascot equipped={worn} mood={mood} size={size} />;
}
