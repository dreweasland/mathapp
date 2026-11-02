import { skillById } from '@mathapp/content';
import { chestTierTomorrow } from '@mathapp/engine';
import { motion } from 'framer-motion';
import { SKILL_ICON } from '../game/art';
import { useGame } from '../game/GameProvider';
import { localDate } from '../game/today';
import { BigButton } from '../ui/BigButton';
import { MyMascot } from '../ui/MyMascot';
import { Chest } from '../visuals/Chest';
import { Plant } from '../visuals/Plant';

const CONFETTI = ['🎉', '⭐', '🪙', '🌱', '🎈', '✨', '🐾', '🎉', '⭐', '🪙'];

/** Every quest ends here, on a good day or a rough one. */
export function Celebrate() {
  const { actions, use } = useGame();
  const coins = use((s) => s.run?.coins ?? 0);
  const streak = use((s) => s.progress?.streak);
  const chest = use((s) => s.progress?.inventory.unopened[0]);
  const badges = use((s) => s.newBadges);
  const current = streak?.current ?? 0;
  const tomorrow = streak ? chestTierTomorrow(streak, localDate(new Date())) : 'bronze';
  return (
    <main className="screen relative items-center justify-center gap-4 overflow-hidden text-center">
      {CONFETTI.map((emoji, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 text-4xl"
          style={{ left: `${5 + i * 9}%` }}
          initial={{ y: -60, rotate: 0 }}
          animate={{ y: '110dvh', rotate: 200 }}
          transition={{ duration: 2.4, delay: i * 0.12, ease: 'easeIn' }}
        >
          {emoji}
        </motion.span>
      ))}
      {badges.map((id) => (
        <div
          key={id}
          data-testid="new-badge"
          className="tap tap-primary map-glow px-4 py-2 text-3xl font-extrabold"
        >
          {SKILL_ICON[id]} {skillById(id)?.badgeName}
        </div>
      ))}
      <div className="flex items-end gap-3">
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <MyMascot mood="cheer" size={130} />
        </motion.div>
        <Plant days={current} size={90} />
      </div>
      <div data-testid="celebrate" className="flex gap-8 text-4xl font-extrabold">
        <span aria-label="coins earned" data-testid="coins-earned">
          🪙 +{coins}
        </span>
        <span aria-label="streak" data-testid="streak">
          🌱 {current}
        </span>
      </div>
      {chest ? (
        <button
          type="button"
          aria-label="open chest"
          onClick={actions.openChest}
          className="tap tap-primary min-h-28 w-full max-w-md"
        >
          <span className="bounce">
            <Chest tier={chest.tier} size={110} />
          </span>
        </button>
      ) : (
        <>
          <div data-testid="tomorrow" className="flex items-center gap-2 text-2xl font-extrabold">
            🌙 <Chest tier={tomorrow} size={56} />
          </div>
          <BigButton label="home" className="w-full max-w-md text-6xl" onClick={actions.goHome}>
            🏠
          </BigButton>
        </>
      )}
    </main>
  );
}
