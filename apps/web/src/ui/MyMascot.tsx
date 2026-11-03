import { artFor, cosmeticFor } from '@mathapp/content';
import type { Mood } from '../game/store';
import { useGame } from '../game/GameProvider';
import { Mascot } from './Mascot';
import { hasWearable, WEAR_SPOT, WearArt } from './Wearables';

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
  const background = equipped['background'];
  const worn = [equipped['accessory'], equipped['hat']].filter(
    (id): id is string => id !== undefined && WEAR_SPOT[id] !== undefined,
  );
  // A background is a round scene in the bear's own box, so nothing around it moves.
  const scene = background !== undefined && hasWearable(background);
  const bear = scene ? size * 0.74 : size;
  const inset = (size - bear) / 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} data-testid="mascot">
      {background && (
        <span
          aria-hidden="true"
          data-wear="background"
          data-id={background}
          className="absolute inset-0 flex items-center justify-center"
        >
          {scene ? (
            <WearArt id={background} size={size} />
          ) : (
            <span className="opacity-40" style={{ fontSize: size * 0.85 }}>
              {artFor(background)?.emoji}
            </span>
          )}
        </span>
      )}
      <div className="absolute" style={{ left: inset, top: inset }}>
        <Mascot mood={mood} size={bear} />
      </div>
      {worn.map((id) => {
        const spot = WEAR_SPOT[id] as { x: number; y: number; w: number };
        const w = bear * spot.w;
        return (
          <span
            key={id}
            aria-hidden="true"
            data-wear={id.split('.')[0]}
            data-id={id}
            className="absolute"
            style={{ left: inset + bear * spot.x - w / 2, top: inset + bear * spot.y - w / 2 }}
          >
            <WearArt id={id} size={w} />
          </span>
        );
      })}
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
