import { motion } from 'framer-motion';
import { useGame } from '../game/GameProvider';
import { BigButton } from '../ui/BigButton';
import { Mascot } from '../ui/Mascot';

const CONFETTI = ['🎉', '⭐', '🪙', '🌱', '🎈', '✨', '🐾', '🎉', '⭐', '🪙'];

/** Every quest ends here, on a good day or a rough one. */
export function Celebrate() {
  const { actions, use } = useGame();
  const coins = use((s) => s.run?.coins ?? 0);
  const streak = use((s) => s.progress?.streak.current ?? 0);
  return (
    <main className="screen relative items-center justify-center gap-6 overflow-hidden text-center">
      {CONFETTI.map((emoji, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute top-0 text-4xl"
          style={{ left: `${5 + i * 9}%` }}
          initial={{ y: -60, rotate: 0 }}
          animate={{ y: '110dvh', rotate: 200 }}
          transition={{ duration: 2.4, delay: i * 0.12, ease: 'easeIn' }}
        >
          {emoji}
        </motion.span>
      ))}
      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
        <Mascot mood="cheer" size={190} />
      </motion.div>
      <div data-testid="celebrate" className="flex gap-8 text-5xl font-extrabold">
        <span aria-label="coins earned" data-testid="coins-earned">
          🪙 +{coins}
        </span>
        <span aria-label="streak" data-testid="streak">
          🌱 {streak}
        </span>
      </div>
      <BigButton label="home" className="w-full max-w-md text-6xl" onClick={actions.goHome}>
        🏠
      </BigButton>
    </main>
  );
}
