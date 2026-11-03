import { COLLECTIBLE_SETS, artFor } from '@mathapp/content';
import { activeSet } from '@mathapp/engine';
import { useGame } from '../game/GameProvider';
import { ItemArt } from '../ui/Critters';
import { PlaceFrame } from '../ui/PlaceFrame';

/** A sticker sheet. Every animal shows as a shadow, so a child can see exactly what's left. */
export function Stickers() {
  const { actions, use } = useGame();
  const inventory = use((s) => s.progress?.inventory);
  const items = inventory?.items ?? [];
  const active = activeSet({ items }, COLLECTIBLE_SETS);
  const lastShown = active ? COLLECTIBLE_SETS.indexOf(active) : COLLECTIBLE_SETS.length - 1;
  const shown = COLLECTIBLE_SETS.slice(0, lastShown + 1).reverse();
  return (
    <PlaceFrame
      title="Animals"
      icon="paw"
      hint="Find animals in your chests. Grey ones are still to find."
    >
      <div className="mx-auto flex max-w-md flex-col gap-4" data-testid="stickers">
        {shown.map((set) => (
          <section key={set.id} data-set={set.id}>
            <h2 className="section-label mb-1.5">
              {artFor(set.decoration)?.name ?? set.id} ·{' '}
              {set.items.filter((i) => items.includes(i)).length} of {set.items.length}
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {set.items.map((id) => {
                const owned = items.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-label={owned ? (artFor(id)?.name ?? id) : 'still to find'}
                    data-owned={owned}
                    onClick={() =>
                      actions.say(owned ? { key: `item.${id}` } : { key: 'sticker.waiting' })
                    }
                    className={`tap flex-col gap-0.5 px-1 py-1 ${owned ? '' : 'border-dashed !shadow-none'}`}
                  >
                    <span className={`inline-flex ${owned ? '' : 'silhouette'}`}>
                      <ItemArt id={id} emoji={artFor(id)?.emoji} size={52} />
                    </span>
                    {owned && (
                      <span aria-hidden="true" className="text-[11px] leading-none font-extrabold">
                        {artFor(id)?.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PlaceFrame>
  );
}
