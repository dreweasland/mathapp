import { artFor } from '@mathapp/content';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
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
          {art && (
            <span data-testid="chest-item" data-id={reward.itemId} className="text-9xl">
              {art.emoji}
            </span>
          )}
          {reward.shield && (
            <span data-testid="chest-shield" className="text-9xl">
              🛡️
            </span>
          )}
          {reward.coins > 0 && (
            <span data-testid="chest-coins" className="text-5xl font-extrabold">
              🪙 +{reward.coins}
            </span>
          )}
          {reward.setCompleted && (
            <span data-testid="set-complete" className="text-6xl">
              {artFor(`scene.${reward.setCompleted}`)?.emoji} ⭐
            </span>
          )}
        </motion.div>
        <BigButton label="next" className="w-full max-w-md" onClick={actions.closeChest}>
          ➜
        </BigButton>
      </div>
    </Motion>
  );
}
