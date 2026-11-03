import { chestTierTomorrow, weekStrip, type Mission } from '@mathapp/engine';
import { useEffect } from 'react';
import { APP_NAME } from '../config';
import { useGame } from '../game/GameProvider';
import { localDate } from '../game/today';
import { BigButton } from '../ui/BigButton';
import { MyMascot } from '../ui/MyMascot';
import { Chest } from '../visuals/Chest';
import { Plant } from '../visuals/Plant';
import { needsInstall } from './Setup';

const MISSION_ICON: Record<Mission['kind'], string> = {
  'in-a-row': '🎯',
  'finish-quest': '🏁',
  'finish-challenge': '⭐',
  'fast-facts': '⚡',
};

const NAV = [
  { place: 'map', icon: '🗺️', label: 'map' },
  { place: 'trophies', icon: '🏆', label: 'trophies' },
  { place: 'stickers', icon: '🐾', label: 'animals' },
  { place: 'shop', icon: '🎩', label: 'dress up' },
] as const;

function WeekDots() {
  const { use } = useGame();
  const streak = use((s) => s.progress?.streak);
  const today = use((s) => s.enteredOn);
  if (!streak || !today) return null;
  return (
    <div
      className="flex justify-center gap-1.5"
      role="img"
      aria-label="this week"
      data-testid="week"
    >
      {weekStrip(streak, today).map(({ date, mark }) => (
        <span
          key={date}
          data-mark={mark}
          className={`flex h-7 w-7 items-center justify-center rounded-full border-3 text-sm font-extrabold ${
            mark === 'done'
              ? 'border-ink bg-leaf'
              : mark === 'excused'
                ? 'border-ink bg-sky'
                : mark === 'today'
                  ? 'border-ink bg-white'
                  : 'border-ink/30 bg-white'
          }`}
        >
          {mark === 'done' ? '✓' : mark === 'excused' ? '🛡️' : ''}
        </span>
      ))}
    </div>
  );
}

function Missions() {
  const { use, actions } = useGame();
  const missions = use((s) => s.missions);
  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-2" data-testid="missions">
      {missions.map((m) => (
        <button
          key={m.slot}
          type="button"
          aria-label={`mission ${m.slot}`}
          data-kind={m.kind}
          data-done={m.done}
          onClick={() => actions.say({ key: `mission.${m.kind}`, params: { target: m.target } })}
          className={`tap flex-col px-1 text-2xl font-extrabold ${m.done ? 'tap-answer' : ''}`}
        >
          <span aria-hidden="true">{m.done ? '✓' : MISSION_ICON[m.kind]}</span>
          {!m.done && m.target > 1 && (
            <span className="text-base leading-none">
              {m.progress}/{m.target}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Home() {
  const { actions, use } = useGame();
  const child = use((s) => s.child);
  const coins = use((s) => s.progress?.wallet.coins ?? 0);
  const streak = use((s) => s.progress?.streak);
  const unopened = use((s) => s.progress?.inventory.unopened.length ?? 0);
  const nextChest = use((s) => s.progress?.inventory.unopened[0]);
  const todayDone = use((s) => s.todayDone);
  const resuming = use((s) => s.run !== undefined);
  const saveFailed = use((s) => s.saveFailed);
  const current = streak?.current ?? 0;
  const best = streak?.best ?? 0;
  const shields = streak?.shields ?? 0;

  useEffect(() => actions.sayHome(), [actions]);

  const tomorrow = streak ? chestTierTomorrow(streak, localDate(new Date())) : 'bronze';

  return (
    <main className="screen items-center justify-between text-center">
      <h1 className="sr-only">{APP_NAME}</h1>
      <header className="flex w-full items-center justify-between text-2xl font-extrabold">
        <span aria-label={child?.name} className="text-3xl">
          {child?.avatar}
        </span>
        <span className="flex items-center gap-3">
          <button
            type="button"
            aria-label="shields"
            data-testid="shields"
            className="flex min-h-16 min-w-16 items-center justify-center gap-1"
            onClick={() => actions.say({ key: 'shield.count', params: { count: shields } })}
          >
            🛡️ {shields}
          </button>
          <span aria-label="coins" data-testid="coins">
            🪙 {coins}
          </span>
        </span>
      </header>

      <div className="home-body">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-end justify-center gap-4">
            <button
              type="button"
              aria-label="streak plant"
              className="flex flex-col items-center"
              onClick={() =>
                actions.say(
                  current > 0
                    ? { key: 'plant.days', params: { days: current, best } }
                    : { key: 'plant.seed', params: { best } },
                )
              }
            >
              <Plant days={current} size={84} />
              <span className="flex gap-2 text-xl font-extrabold">
                <span aria-label="streak" data-testid="streak">
                  🌱 {current}
                </span>
                {best > 0 && (
                  <span aria-label="best streak" data-testid="best">
                    ⭐ {best}
                  </span>
                )}
              </span>
            </button>
            <MyMascot mood={todayDone ? 'happy' : 'idle'} size={100} />
          </div>

          <WeekDots />
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          <Missions />

          {unopened > 0 && nextChest ? (
            <button
              type="button"
              aria-label="open chest"
              onClick={actions.openChest}
              className="tap tap-primary min-h-24 w-full max-w-md"
            >
              <Chest tier={nextChest.tier} size={90} />
            </button>
          ) : todayDone ? (
            <div
              data-testid="see-you"
              className="flex min-h-24 items-center gap-3 text-3xl font-extrabold"
            >
              🌙 <Chest tier={tomorrow} size={64} />
            </div>
          ) : (
            <BigButton
              label={resuming ? 'keep going' : 'start quest'}
              className="min-h-24 w-full max-w-md text-6xl"
              onClick={actions.startQuest}
            >
              ▶
            </BigButton>
          )}

          <nav className="grid w-full max-w-md grid-cols-4 gap-2">
            {NAV.map(({ place, icon, label }) => (
              <button
                key={place}
                type="button"
                aria-label={label}
                className="tap text-3xl"
                onClick={() => actions.go(place)}
              >
                {icon}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {saveFailed && (
        <p role="alert" className="text-sm font-bold">
          Grown-ups: this device couldn't save progress. Check that storage isn't full.
        </p>
      )}
      {needsInstall() && (
        <p className="text-sm">
          Grown-ups: add this app to the Home Screen so progress stays safe.
        </p>
      )}
    </main>
  );
}
