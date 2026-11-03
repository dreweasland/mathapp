import {
  activeGoal,
  chestTierTomorrow,
  goalProgress,
  isReached,
  weekStrip,
  type Mission,
  type Speech,
} from '@mathapp/engine';
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

/** A grown-up's real-world goal, as a picture and a bar. */
function GoalBar() {
  const { use, actions } = useGame();
  const goals = use((s) => s.progress?.goals);
  const today = use((s) => s.enteredOn);
  const goal = goals && today ? activeGoal(goals, today) : undefined;
  if (!goal) return null;
  const reached = isReached(goal);
  const line: Speech = reached
    ? { key: 'goal.ready', params: { reward: goal.rewardText } }
    : {
        key: `goal.${goal.unit}`,
        params: { done: goal.progress, target: goal.target, reward: goal.rewardText },
      };
  return (
    <button
      type="button"
      aria-label="goal"
      data-testid="goal"
      data-reached={reached}
      onClick={() => actions.say(line)}
      className={`tap w-full max-w-md gap-2 px-3 ${reached ? 'tap-answer' : ''}`}
    >
      <span aria-hidden="true" className="text-3xl">
        {goal.imageKey}
      </span>
      <span className="h-4 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
        <span
          data-testid="goal-fill"
          className="block h-full bg-sun"
          style={{ width: `${goalProgress(goal) * 100}%` }}
        />
      </span>
      <span className="text-lg font-extrabold">
        {reached ? '🎉' : `${goal.progress}/${goal.target}`}
      </span>
    </button>
  );
}

/**
 * One note, most urgent first, in the header's spare room: anywhere else, small phones push
 * it off the bottom of the screen, and these protect the child's progress.
 */
function GrownUpNote() {
  const { use } = useGame();
  const saveFailed = use((s) => s.saveFailed);
  const backup = use((s) => s.backupDue);
  const text = saveFailed
    ? "Grown-ups: this device couldn't save. Is storage full?"
    : needsInstall()
      ? 'Grown-ups: add to Home Screen to keep progress safe.'
      : backup
        ? 'Grown-ups: time to save a backup.'
        : undefined;
  if (!text) return null;
  return (
    <p
      data-testid="grown-up-note"
      role={saveFailed ? 'alert' : undefined}
      className="min-w-0 flex-1 px-1 text-[11px] leading-tight font-bold"
    >
      {text}
    </p>
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
  const current = streak?.current ?? 0;
  const best = streak?.best ?? 0;
  const shields = streak?.shields ?? 0;

  useEffect(() => actions.sayHome(), [actions]);

  const tomorrow = streak ? chestTierTomorrow(streak, localDate(new Date())) : 'bronze';

  return (
    <main className="screen items-center justify-between text-center">
      <h1 className="sr-only">{APP_NAME}</h1>
      <header className="flex w-full items-center justify-between text-2xl font-extrabold">
        <button
          type="button"
          aria-label={child?.name}
          className="flex min-h-16 min-w-16 items-center justify-center text-3xl"
          onClick={() => void actions.showWho()}
        >
          {child?.avatar}
        </button>
        <GrownUpNote />
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
          <GoalBar />
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
    </main>
  );
}
