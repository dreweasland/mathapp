import {
  activeGoal,
  addDays,
  goalEnded,
  isReached,
  weekStart,
  daysBetween,
  type Goal,
} from '@mathapp/engine';
import { useState } from 'react';
import type { PageProps } from '../ParentApp';
import { Recorder } from '../Recorder';

const PICTURES = ['🎬', '🍦', '🍕', '🏞️', '🎮', '📚', '🧸', '🚲'];
const CHEER_EMOJI = ['🌟', '🎉', '💪', '❤️', '👏', '🚀', '🐻', '🌈'];
const UNITS: { value: Goal['unit']; label: string }[] = [
  { value: 'quests', label: 'daily quests' },
  { value: 'skills', label: 'new badges' },
  { value: 'perfect-weeks', label: 'perfect weeks' },
];
const UNIT_NAME = Object.fromEntries(UNITS.map((u) => [u.value, u.label]));

function GoalForm({ view, today, services, reload }: PageProps) {
  const [unit, setUnit] = useState<Goal['unit']>('quests');
  const [target, setTarget] = useState(5);
  const [reward, setReward] = useState('');
  const [image, setImage] = useState(PICTURES[0] as string);
  const [thisWeek, setThisWeek] = useState(true);
  const endDate = addDays(weekStart(today), 6);
  const daysLeft = daysBetween(today, endDate) + 1;
  const useWeek = unit === 'quests' && thisWeek;
  const tooMany = useWeek && target > daysLeft;

  const add = async () => {
    const text = reward.trim();
    const goal: Goal = {
      id: crypto.randomUUID(),
      childId: view.child.id,
      title: `${target} ${UNIT_NAME[unit]}: ${text}`,
      imageKey: image,
      target,
      unit,
      progress: 0,
      rewardText: text,
      startDate: today,
      delivered: false,
      updatedAt: services.now(),
      ...(useWeek ? { endDate } : {}),
    };
    await services.repo.addGoal(goal);
    await reload();
  };

  return (
    <div className="flex flex-col gap-2" data-testid="goal-form">
      <label className="font-bold">
        Reward
        <input
          className="p-input font-normal"
          placeholder="movie night"
          value={reward}
          maxLength={40}
          onChange={(e) => setReward(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <label className="w-24 font-bold">
          Finish
          <input
            className="p-input font-normal"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            value={target}
            onChange={(e) => setTarget(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          />
        </label>
        <label className="flex-1 font-bold">
          Of
          <select
            className="p-input font-normal"
            value={unit}
            onChange={(e) => setUnit(e.target.value as Goal['unit'])}
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {unit === 'quests' && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={thisWeek}
            onChange={(e) => setThisWeek(e.target.checked)}
          />
          By this Sunday
        </label>
      )}
      {tooMany && (
        <p role="alert" className="text-sm font-bold">
          Only {daysLeft} {daysLeft === 1 ? 'day is' : 'days are'} left this week, and it's one
          quest a day. Lower the number or turn off "By this Sunday".
        </p>
      )}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Picture">
        {PICTURES.map((p) => (
          <button
            key={p}
            type="button"
            aria-label={`picture ${p}`}
            aria-pressed={p === image}
            className={`p-btn text-xl ${p === image ? 'p-btn-main' : ''}`}
            onClick={() => setImage(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="p-btn p-btn-main"
        disabled={reward.trim() === '' || tooMany}
        onClick={() => void add()}
      >
        Set goal
      </button>
    </div>
  );
}

function CurrentGoal({ goal, services, reload }: { goal: Goal } & PageProps) {
  const [removing, setRemoving] = useState(false);
  const reached = isReached(goal);
  return (
    <div data-testid="current-goal">
      <p className="text-lg font-bold">
        {goal.imageKey} {goal.rewardText}
      </p>
      <p>
        {goal.progress} of {goal.target} {UNIT_NAME[goal.unit]}
        {goal.endDate ? ` by ${goal.endDate}` : ''}
      </p>
      {reached ? (
        <button
          type="button"
          className="p-btn p-btn-main mt-2"
          onClick={() => void services.repo.deliverGoal(goal).then(() => reload())}
        >
          Reached! Mark as delivered
        </button>
      ) : removing ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm">Your child will stop seeing this goal.</span>
          <button
            type="button"
            className="p-btn"
            onClick={() => void services.repo.removeGoal(goal.id).then(() => reload())}
          >
            Remove it
          </button>
          <button type="button" className="p-btn" onClick={() => setRemoving(false)}>
            Keep it
          </button>
        </div>
      ) : (
        <button type="button" className="p-link" onClick={() => setRemoving(true)}>
          Remove goal
        </button>
      )}
    </div>
  );
}

export function Motivate(props: PageProps) {
  const { view, today, services, reload } = props;
  const { goals, cheers, child } = view;
  const current = activeGoal(goals, today);
  const past = goals.filter((g) => g !== current && (g.delivered || goalEnded(g, today)));
  const waiting = cheers.filter((c) => c.playedAt === undefined);

  const send = async (cheer: { emoji?: string; audio?: { bytes: ArrayBuffer; type: string } }) => {
    const at = services.now();
    await services.repo.addCheer({
      id: crypto.randomUUID(),
      childId: child.id,
      createdAt: at,
      updatedAt: at,
      ...cheer,
    });
    await reload();
  };

  return (
    <>
      <section className="p-card">
        <h2 className="mb-1 font-extrabold">Goal</h2>
        {current ? <CurrentGoal {...props} goal={current} /> : <GoalForm {...props} />}
        {past.length > 0 && (
          <ul className="mt-2 text-sm" data-testid="past-goals">
            {past.map((g) => (
              <li key={g.id}>
                {g.imageKey} {g.rewardText}:{' '}
                {g.delivered ? 'delivered' : `${g.progress} of ${g.target}`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="p-card" data-testid="cheers">
        <h2 className="font-extrabold">Cheers</h2>
        <p className="mb-2 text-sm">
          {child.name} gets one at the start of the next quest. Send a picture or your voice.
        </p>
        <div className="mb-2 flex flex-wrap gap-1">
          {CHEER_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`send ${emoji}`}
              className="p-btn text-xl"
              onClick={() => void send({ emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
        <Recorder onSave={(audio) => void send({ audio })} />
        {waiting.length > 0 && (
          <>
            <h3 className="mt-2 font-bold">Waiting to play</h3>
            <ul data-testid="cheers-waiting">
              {waiting.map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <span>{c.emoji ?? 'Voice message'}</span>
                  <button
                    type="button"
                    className="p-link"
                    onClick={() => void services.repo.removeCheer(c.id).then(() => reload())}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
