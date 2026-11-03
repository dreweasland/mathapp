import { skillById } from '@mathapp/content';
import { chestTierTomorrow } from '@mathapp/engine';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { SkillIcon } from '../game/art';
import { useGame } from '../game/GameProvider';
import { localDate } from '../game/today';
import { BearSays } from '../ui/BearSays';
import { BigButton } from '../ui/BigButton';
import { Icon } from '../ui/icons';
import { Motion } from '../ui/Motion';
import { Chest } from '../visuals/Chest';

/** Drawn confetti in the app's colours: squares, dots and stars, never emoji. */
const CONFETTI = [
  '#ffb703',
  '#7fd1e8',
  '#e76f51',
  '#8fe3a8',
  '#ffb703',
  '#7fd1e8',
  '#e76f51',
  '#8fe3a8',
  '#ffb703',
  '#7fd1e8',
];

function Bit({ color, i }: { color: string; i: number }) {
  const shape = i % 3;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      {shape === 0 ? (
        <rect
          x="4"
          y="2"
          width="12"
          height="18"
          rx="3"
          fill={color}
          stroke="#1d3557"
          strokeWidth="2.5"
        />
      ) : shape === 1 ? (
        <circle cx="11" cy="11" r="8" fill={color} stroke="#1d3557" strokeWidth="2.5" />
      ) : (
        <path
          d="M11 2 L13.5 8 L20 8.5 L15 13 L16.5 19.5 L11 16 L5.5 19.5 L7 13 L2 8.5 L8.5 8 Z"
          fill={color}
          stroke="#1d3557"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function Row({
  icon,
  label,
  value,
  testId,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <li className="flex items-center gap-3 border-line py-2 text-lg font-extrabold [&+&]:border-t-2 [&+&]:border-dashed">
      {icon}
      <span className="flex-1 text-left">{label}</span>
      <span className="text-xl font-black" data-testid={testId}>
        {value}
      </span>
    </li>
  );
}

/** Every quest ends here, on a good day or a rough one, with a list of what was earned. */
export function Celebrate() {
  const { actions, use } = useGame();
  const coins = use((s) => s.run?.coins ?? 0);
  const streak = use((s) => s.progress?.streak);
  const chest = use((s) => s.progress?.inventory.unopened[0]);
  const badges = use((s) => s.newBadges);
  const current = streak?.current ?? 0;
  const tomorrow = streak ? chestTierTomorrow(streak, localDate(new Date())) : 'bronze';
  return (
    <Motion>
      <main className="screen relative items-center gap-3 overflow-hidden text-center">
        {CONFETTI.map((color, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute top-0"
            style={{ left: `${5 + i * 9}%` }}
            initial={{ y: -40, rotate: 0 }}
            animate={{ y: '110dvh', rotate: 260 }}
            transition={{ duration: 2.4, delay: i * 0.12, ease: 'easeIn' }}
          >
            <Bit color={color} i={i} />
          </motion.span>
        ))}
        <div className="flex min-h-0 w-full max-w-md flex-1 flex-col items-center gap-3 overflow-y-auto">
          <h1 className="mt-2 text-4xl font-black">You did it!</h1>
          <BearSays mood="cheer" size={96} />
          {badges.map((id) => (
            <div
              key={id}
              data-testid="new-badge"
              className="card map-glow flex w-full items-center gap-3 !bg-sun text-xl font-black"
            >
              <SkillIcon id={id} size={44} />
              <span className="flex flex-col text-left leading-tight">
                <span className="section-label !text-ink">New badge</span>
                {skillById(id)?.badgeName}
              </span>
            </div>
          ))}
          <section data-testid="celebrate" className="card w-full">
            <h2 className="section-label text-left">What you got today</h2>
            <ul>
              <Row
                icon={<Icon name="coin" size={34} />}
                label="Coins"
                value={`+${coins}`}
                testId="coins-earned"
              />
              <Row
                icon={<Icon name="sprout" size={34} />}
                label="Plant"
                value={`${current} ${current === 1 ? 'day' : 'days'}`}
                testId="streak"
              />
              {chest && (
                <Row
                  icon={<Chest tier={chest.tier} size={34} />}
                  label={`${chest.tier[0]?.toUpperCase()}${chest.tier.slice(1)} chest`}
                  value="1"
                />
              )}
            </ul>
          </section>
          {!chest && (
            <p
              data-testid="tomorrow"
              className="flex items-center gap-2 text-base font-extrabold text-ink-soft"
            >
              <Icon name="moon" size={28} />
              Tomorrow's chest
              <Chest tier={tomorrow} size={36} />
            </p>
          )}
        </div>
        {chest ? (
          <button
            type="button"
            aria-label="open chest"
            onClick={actions.openChest}
            className="tap tap-primary min-h-20 w-full max-w-md gap-3 text-2xl font-black"
          >
            <span className="bounce">
              <Chest tier={chest.tier} size={56} />
            </span>
            Open your chest
          </button>
        ) : (
          <BigButton
            label="Home"
            aria-label="home"
            icon="home"
            className="w-full max-w-md"
            onClick={actions.goHome}
          />
        )}
      </main>
    </Motion>
  );
}
