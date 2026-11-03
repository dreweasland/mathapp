import { ALL_SKILLS, render, skillById } from '@mathapp/content';
import {
  activeGoal,
  chestTierTomorrow,
  goalProgress,
  isReached,
  selectToday,
  weekStrip,
  type Mission,
  type Speech,
} from '@mathapp/engine';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { APP_NAME } from '../config';
import { useGame } from '../game/GameProvider';
import { TOUR_STEPS } from '../game/store';
import { localDate } from '../game/today';
import { Avatar } from '../ui/Avatar';
import { BearSays } from '../ui/BearSays';
import { BigButton } from '../ui/BigButton';
import { Icon, type IconName } from '../ui/icons';
import { Picture } from '../ui/Pictures';
import { Chest } from '../visuals/Chest';
import { needsInstall } from './Setup';

const MISSION_TEXT: Record<Mission['kind'], (target: number) => string> = {
  'in-a-row': (n) => `${n} right in a row`,
  'finish-quest': () => 'Finish the quest',
  'finish-challenge': () => 'Do the bonus round',
  'fast-facts': (n) => `${n} fast facts`,
};

const NAV = [
  { place: 'map', icon: 'map', label: 'Map' },
  { place: 'trophies', icon: 'trophy', label: 'Trophies' },
  { place: 'stickers', icon: 'paw', label: 'Animals' },
  { place: 'shop', icon: 'crown', label: 'Dress up' },
] as const;

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type TourPart = (typeof TOUR_STEPS)[number];

/** During the tour, the part being explained sits above the dimmed screen. */
function useLit(part: TourPart) {
  const { use } = useGame();
  const step = use((s) => s.tour);
  return step !== undefined && TOUR_STEPS[step] === part ? 'tour-lit' : '';
}

/** The day's three steps, each with a picture and a word. */
function TodayCard() {
  const { use, actions } = useGame();
  const todayDone = use((s) => s.todayDone);
  const run = use((s) => s.run);
  const states = use((s) => s.progress?.states);
  const questsCompleted = use((s) => s.child?.questsCompleted ?? 0);
  const unopened = use((s) => s.progress?.inventory.unopened.length ?? 0);
  const nextChest = use((s) => s.progress?.inventory.unopened[0]);
  const lit = useLit('today');
  // Which step is next: the run knows; before it starts, it's the warm-up.
  const sectionKinds = run?.quest.sections.map((s) => s.kind) ?? [];
  const at = run ? sectionKinds[run.section] : undefined;
  const learnSkill = (() => {
    const id = run?.quest.todaySkillId;
    if (id) return skillById(id);
    if (!states || todayDone) return undefined;
    return selectToday(ALL_SKILLS, states, questsCompleted)?.skill;
  })();

  const stateOf = (kind: 'warmup' | 'skill' | 'challenge') => {
    if (todayDone) return 'done';
    if (!run) return kind === 'warmup' ? 'now' : 'later';
    const order = ['warmup', 'skill', 'challenge'];
    const here = order.indexOf(at ?? 'warmup');
    const mine = order.indexOf(kind);
    return mine < here ? 'done' : mine === here ? 'now' : 'later';
  };
  const steps: {
    kind: 'warmup' | 'skill' | 'challenge';
    icon: IconName;
    name: string;
    sub?: string;
  }[] = [
    { kind: 'warmup', icon: 'sun', name: 'Warm-up', sub: 'quick ones' },
    {
      kind: 'skill',
      icon: 'bulb',
      name: 'Learn',
      ...(learnSkill ? { sub: render(learnSkill.speechKey) } : {}),
    },
    { kind: 'challenge', icon: 'star', name: 'Bonus', sub: 'if you want' },
  ];

  return (
    <section className={`card flex w-full flex-col gap-2.5 ${lit}`} data-testid="today">
      <h2 className="section-label">{todayDone ? "Today's quest · done" : "Today's quest"}</h2>
      <ol className="relative flex justify-between">
        <span
          aria-hidden="true"
          className={`absolute top-7 right-12 left-12 border-t-4 ${todayDone ? 'border-ink' : 'border-dashed border-line'}`}
        />
        {steps.map((step) => {
          const state = stateOf(step.kind);
          return (
            <li
              key={step.kind}
              data-step={step.kind}
              data-state={state}
              className="relative flex w-24 flex-col items-center gap-0.5 text-center"
            >
              <span className="step-dot" data-state={state}>
                <Icon
                  name={state === 'done' ? 'check' : step.icon}
                  size={state === 'done' ? 26 : 34}
                />
              </span>
              <strong className="text-base leading-tight">{step.name}</strong>
              {step.sub && state !== 'done' && (
                <span className="step-sub text-xs leading-tight font-bold text-ink-soft">
                  {step.sub}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {unopened > 0 && nextChest ? (
        <button
          type="button"
          aria-label="open chest"
          onClick={actions.openChest}
          className="tap tap-primary min-h-18 w-full gap-3 text-2xl font-black"
        >
          <Chest tier={nextChest.tier} size={52} />
          Open your chest
        </button>
      ) : todayDone ? (
        <FreePlay />
      ) : (
        <BigButton
          label={run ? 'Keep going' : 'Start'}
          aria-label={run ? 'keep going' : 'start quest'}
          icon="play"
          className="w-full text-3xl"
          onClick={actions.startQuest}
        />
      )}
    </section>
  );
}

/** Opens after the quest, never before: the day's job comes first. */
function FreePlay() {
  const { actions, use } = useGame();
  const streak = use((s) => s.progress?.streak);
  const tomorrow = streak ? chestTierTomorrow(streak, localDate(new Date())) : 'bronze';
  return (
    <div data-testid="see-you" className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-base font-extrabold">
        <Icon name="moon" size={28} />
        All done! Tomorrow's chest:
        <Chest tier={tomorrow} size={32} />
      </p>
      <button
        type="button"
        aria-label="free play"
        className="tap min-h-16 w-full justify-start gap-3 px-4 text-left"
        onClick={() => actions.go('free')}
      >
        <Icon name="balloon" size={36} />
        <span className="flex flex-col leading-tight">
          <span className="text-xl font-black">Play more</span>
          <span className="text-xs font-bold text-ink-soft">
            Practice or Fact Blitz · half coins
          </span>
        </span>
      </button>
    </div>
  );
}

function PlantRow() {
  const { use, actions } = useGame();
  const streak = use((s) => s.progress?.streak);
  const today = use((s) => s.enteredOn);
  const lit = useLit('plant');
  const current = streak?.current ?? 0;
  const best = streak?.best ?? 0;
  const days = streak && today ? weekStrip(streak, today) : [];
  return (
    <button
      type="button"
      aria-label="streak plant"
      onClick={() =>
        actions.say(
          current > 0
            ? { key: 'plant.days', params: { days: current, best } }
            : { key: 'plant.seed', params: { best } },
        )
      }
      className={`card flex w-full items-center gap-3 !py-2 text-left ${lit}`}
    >
      <Icon name="sprout" size={44} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-baseline gap-x-2 text-base leading-tight font-extrabold">
          <span data-testid="streak">
            {current > 0
              ? `Plant: ${current} ${current === 1 ? 'day' : 'days'} in a row`
              : 'Plant: grows when you play'}
          </span>
          {best > 0 && (
            <span data-testid="best" className="text-xs font-bold text-ink-soft">
              best {best}
            </span>
          )}
        </span>
        <span className="flex gap-1" role="img" aria-label="this week" data-testid="week">
          {days.map(({ date, mark }, i) => (
            <span
              key={date}
              data-mark={mark}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-3 text-xs font-black ${
                mark === 'done'
                  ? 'border-ink bg-leaf'
                  : mark === 'excused'
                    ? 'border-ink bg-sky'
                    : mark === 'today'
                      ? 'border-ink bg-white'
                      : 'border-line bg-white text-ink-soft'
              }`}
            >
              {mark === 'done' ? '✓' : mark === 'excused' ? '' : DAY_LETTERS[i]}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

function Missions() {
  const { use, actions } = useGame();
  const missions = use((s) => s.missions);
  if (missions.length === 0) return null;
  return (
    <section className="flex w-full flex-col gap-1">
      <h2 className="section-label">Little jobs for coins</h2>
      <div className="grid grid-cols-3 gap-2" data-testid="missions">
        {missions.map((m) => (
          <button
            key={m.slot}
            type="button"
            aria-label={`mission ${m.slot}`}
            data-kind={m.kind}
            data-done={m.done}
            onClick={() => actions.say({ key: `mission.${m.kind}`, params: { target: m.target } })}
            className={`tap flex-col gap-0.5 !rounded-2xl px-1 text-center text-xs leading-tight font-extrabold ${m.done ? 'tap-answer' : ''}`}
          >
            {m.done ? (
              <Icon name="check" size={22} />
            ) : (
              m.target > 1 && (
                <span className="text-base font-black">
                  {m.progress}/{m.target}
                </span>
              )
            )}
            <span>{MISSION_TEXT[m.kind](m.target)}</span>
          </button>
        ))}
      </div>
    </section>
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
      className={`tap w-full gap-2 px-3 ${reached ? 'tap-answer' : ''}`}
    >
      <Picture value={goal.imageKey} size={36} />
      <span className="h-4 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white">
        <span
          data-testid="goal-fill"
          className="block h-full bg-sun"
          style={{ width: `${goalProgress(goal) * 100}%` }}
        />
      </span>
      <span className="text-lg font-extrabold">
        {reached ? 'Ready!' : `${goal.progress}/${goal.target}`}
      </span>
    </button>
  );
}

function MyStuff() {
  const { actions } = useGame();
  const lit = useLit('stuff');
  return (
    <nav aria-label="my stuff" className={`grid w-full grid-cols-4 gap-2 ${lit}`}>
      {NAV.map(({ place, icon, label }) => (
        <button
          key={place}
          type="button"
          aria-label={label.toLowerCase()}
          className="tap min-h-18 flex-col gap-0 !rounded-2xl px-1 text-sm font-extrabold"
          onClick={() => actions.go(place)}
        >
          <Icon name={icon} size={32} />
          {label}
        </button>
      ))}
    </nav>
  );
}

/**
 * Grown-ups' notes, most urgent first, once per opening. A failed save stays until fixed,
 * because it means progress isn't being kept.
 */
function GrownUpNote() {
  const { use, actions } = useGame();
  const saveFailed = use((s) => s.saveFailed);
  const backup = use((s) => s.backupDue);
  const dismissed = use((s) => s.noteDismissed);
  const text = saveFailed
    ? "Grown-ups: this device couldn't save. Is storage full?"
    : dismissed
      ? undefined
      : needsInstall()
        ? 'Grown-ups: add to Home Screen to keep progress safe.'
        : backup
          ? 'Grown-ups: time to save a backup.'
          : undefined;
  if (!text) return null;
  return (
    <div
      data-testid="grown-up-note"
      role={saveFailed ? 'alert' : undefined}
      className="flex items-center gap-2 rounded-2xl bg-ink px-3 py-1 text-sm leading-tight font-bold text-white"
    >
      <p className="flex-1">{text}</p>
      {!saveFailed && (
        <button
          type="button"
          onClick={actions.dismissNote}
          className="min-h-11 rounded-xl px-2 font-black underline"
        >
          OK
        </button>
      )}
    </div>
  );
}

function Chip({ children, ...rest }: { children: ReactNode } & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className="tap min-h-16 gap-1.5 !rounded-full py-0 pr-3 pl-2 text-xl font-black"
      {...rest}
    >
      {children}
    </button>
  );
}

function TourCoach() {
  const { use, actions } = useGame();
  const step = use((s) => s.tour);
  const caption = use((s) => s.caption);
  if (step === undefined) return null;
  const last = step === TOUR_STEPS.length - 1;
  // The coach card sits away from what it's explaining.
  const atTop = TOUR_STEPS[step] === 'stuff';
  return (
    <>
      <div className="tour-dim" aria-hidden="true" />
      <div
        role="dialog"
        aria-label="tour"
        data-testid="tour"
        className={`card fixed right-4 left-4 z-40 mx-auto flex max-w-md flex-col gap-3 ${atTop ? 'top-[max(1rem,env(safe-area-inset-top))]' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'}`}
      >
        <BearSays size={64} line={caption} />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={actions.endTour}
            className="tap min-h-16 px-4 text-lg font-extrabold"
          >
            Skip tour
          </button>
          <span className="text-sm font-extrabold text-ink-soft">
            {step + 1} of {TOUR_STEPS.length}
          </span>
          <BigButton
            label={last ? 'Got it' : 'Next'}
            icon={last ? 'check' : 'arrow'}
            iconAfter
            tone="go"
            className="min-h-16 !px-5 text-xl"
            onClick={actions.nextTour}
          />
        </div>
      </div>
    </>
  );
}

export function Home() {
  const { actions, use } = useGame();
  const child = use((s) => s.child);
  const coins = use((s) => s.progress?.wallet.coins ?? 0);
  const shields = use((s) => s.progress?.streak.shields ?? 0);
  const todayDone = use((s) => s.todayDone);
  const touring = use((s) => s.tour !== undefined);
  const needsTour = child !== undefined && child.touredAt === undefined;

  useEffect(() => {
    if (needsTour) actions.startTour();
    else actions.sayHome();
    // Only on arrival: the tour ending shouldn't start Home's greeting over it.
  }, [actions]);

  return (
    <main className="screen gap-2">
      <h1 className="sr-only">{APP_NAME}</h1>
      <GrownUpNote />
      <header className="flex w-full items-center gap-2">
        <Chip aria-label={child?.name} onClick={() => void actions.showWho()}>
          <Avatar value={child?.avatar} size={40} />
          <span className="max-w-24 truncate text-lg max-[389px]:hidden">{child?.name}</span>
        </Chip>
        <button
          type="button"
          aria-label="help"
          className="tap h-16 w-16 !rounded-full"
          onClick={actions.startTour}
        >
          <Icon name="help" size={34} />
        </button>
        <span className="flex-1" />
        <Chip
          aria-label="shields"
          data-testid="shields"
          onClick={() => actions.say({ key: 'shield.count', params: { count: shields } })}
        >
          <Icon name="shield" size={30} />
          {shields}
        </Chip>
        <span
          aria-label="coins"
          data-testid="coins"
          className="flex min-h-16 items-center gap-1.5 rounded-full border-3 border-ink bg-white pr-3 pl-2 text-xl font-black"
        >
          <Icon name="coin" size={30} />
          {coins}
        </span>
      </header>

      <div className="-mx-1 flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-1 pt-1 pb-2">
        <div className="home-body w-full max-w-md landscape:max-w-4xl">
          <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-3">
            {!touring && (
              <BearSays className="home-bear" mood={todayDone ? 'happy' : 'idle'} size={68} />
            )}
            <TodayCard />
          </div>
          <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-3">
            <PlantRow />
            <GoalBar />
            <Missions />
            <div className="home-nav-inline w-full">
              <MyStuff />
            </div>
          </div>
        </div>
      </div>
      <div className="home-nav-pinned mx-auto w-full max-w-md">
        <MyStuff />
      </div>
      <TourCoach />
    </main>
  );
}
