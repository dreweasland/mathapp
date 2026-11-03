import { COSMETICS, artFor } from '@mathapp/content';
import { canAfford, type Cosmetic } from '@mathapp/engine';
import { useState } from 'react';
import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { DressedMascot } from '../ui/MyMascot';
import { PlaceFrame } from '../ui/PlaceFrame';

const SLOTS: Cosmetic['slot'][] = ['hat', 'accessory', 'background'];

/** Tapping tries something on. Coins only move on the separate coin button. */
export function Shop() {
  const { actions, use } = useGame();
  const inventory = use((s) => s.progress?.inventory);
  const wallet = use((s) => s.progress?.wallet);
  const [trying, setTrying] = useState<string>();
  if (!inventory || !wallet) return null;
  const owned = (id: string) => inventory.items.includes(id);
  const offer = trying && !owned(trying) ? COSMETICS.find((c) => c.id === trying) : undefined;
  const shownOn = offer
    ? { ...inventory.mascotEquipped, [offer.slot]: offer.id }
    : inventory.mascotEquipped;
  const stock = COSMETICS.filter((c) => c.price > 0 || owned(c.id));

  const tap = (cosmetic: Cosmetic) => {
    if (owned(cosmetic.id)) {
      setTrying(undefined);
      actions.toggleWear(cosmetic.id);
      return;
    }
    setTrying(cosmetic.id);
    const short = cosmetic.price - wallet.coins;
    actions.say(short > 0 ? { key: 'shop.need', params: { coins: short } } : { key: 'shop.try' });
  };

  return (
    <PlaceFrame title="Dress up">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3" data-testid="shop">
        <div className="flex items-center gap-4 pt-8">
          <DressedMascot equipped={shownOn} mood="happy" size={110} />
          <p aria-label="coins" data-testid="shop-coins" className="text-3xl font-extrabold">
            🪙 {wallet.coins}
          </p>
        </div>
        {offer && (
          <BigButton
            label={`buy for ${offer.price}`}
            disabled={!canAfford(wallet, offer.price)}
            className={`w-full ${canAfford(wallet, offer.price) ? '' : 'tap-used'}`}
            onClick={() => {
              actions.buy(offer.id);
              setTrying(undefined);
            }}
          >
            🪙 {offer.price}
          </BigButton>
        )}
        {SLOTS.map((slot) => (
          <div key={slot} className="grid w-full grid-cols-4 gap-2" data-slot={slot}>
            {stock
              .filter((c) => c.slot === slot)
              .map((c) => {
                const worn = inventory.mascotEquipped[slot] === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={worn}
                    data-id={c.id}
                    onClick={() => tap(c)}
                    className={`tap flex-col text-3xl ${worn ? 'tap-answer' : ''}`}
                  >
                    <span>{artFor(c.id)?.emoji}</span>
                    {!owned(c.id) && (
                      <span className="text-sm leading-none font-extrabold">{c.price}</span>
                    )}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </PlaceFrame>
  );
}
