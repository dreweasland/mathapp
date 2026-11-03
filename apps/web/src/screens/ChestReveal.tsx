import { artFor } from '@mathapp/content';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { Icon } from '../ui/icons';
import { Motion } from '../ui/Motion';

/** Shown over Home or the celebration. The contents were banked when the chest was earned. */
export function ChestReveal() {
  const { actions, use } = useGame();
  const reward = use((s) => s.openedChest);
  if (!reward) return null;
  const art = reward.itemId ? artFor(reward.itemId) : undefined;
  return (
    <Motion>
      <div
        role="dialog"
        aria-label="chest"
        data-testid="chest-reveal"
        className="screen fixed inset-0 z-10 items-center justify-center gap-6 bg-cream text-center"
      >
        <motion.div
          initial={{ scale: 0.2, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 12 }}
          className="flex flex-col items-center gap-2"
        >
          <p className="section-label">In your chest</p>
          {art && (
            <span
              data-testid="chest-item"
              data-id={reward.itemId}
              className="flex flex-col items-center"
            >
              <span className="card flex h-40 w-40 items-center justify-center text-8xl">
                {art.emoji}
              </span>
              <span className="mt-2 text-3xl font-black">{art.name}</span>
            </span>
          )}
          {reward.shield && (
            <span data-testid="chest-shield" className="flex flex-col items-center">
              <Icon name="shield" size={140} />
              <span className="mt-2 text-3xl font-black">A shield!</span>
              <span className="text-base font-bold text-ink-soft">
                It keeps your plant safe on a missed day.
              </span>
            </span>
          )}
          {reward.coins > 0 && (
            <span data-testid="chest-coins" className="flex items-center gap-2 text-4xl font-black">
              <Icon name="coin" size={48} />+{reward.coins}
            </span>
          )}
          {reward.setCompleted && (
            <span
              data-testid="set-complete"
              className="card flex items-center gap-2 text-xl font-black"
            >
              <Icon name="star" size={36} />
              {artFor(`scene.${reward.setCompleted}`)?.name} collection done!
            </span>
          )}
        </motion.div>
        <BigButton
          label="Next"
          aria-label="next"
          icon="arrow"
          iconAfter
          className="w-full max-w-md"
          onClick={actions.closeChest}
        />
      </div>
    </Motion>
  );
}
