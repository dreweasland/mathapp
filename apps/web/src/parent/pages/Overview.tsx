import {
  MAX_SHIELDS,
  activityBetween,
  addDays,
  dailyGoalMet,
  weekStart,
  type Activity,
} from '@mathapp/engine';
import { useEffect, useState } from 'react';
import { localDate } from '../../game/today';
import { backupDue } from '../../db/repositories/family';
import { percent } from '../labels';
import type { PageProps } from '../ParentApp';

function Stats({ label, activity, days }: { label: string; activity: Activity; days?: number }) {
  return (
    <tr>
      <th scope="row" className="py-1 pr-2 text-left font-bold">
        {label}
      </th>
      <td className="px-1 text-right">
        {activity.quests}
        {days ? ` of ${days}` : ''}
      </td>
      <td className="px-1 text-right">{activity.minutes}</td>
      <td className="px-1 text-right">{activity.problems}</td>
      <td className="pl-1 text-right">{percent(activity.accuracy)}</td>
    </tr>
  );
}

export function Overview({ view, today, services, reload }: PageProps) {
  const { child, sessions, attempts, progress } = view;
  const { streak, states } = progress;
  const [needsBackup, setNeedsBackup] = useState(false);
  useEffect(() => {
    void services.family
      .get()
      .then((f) => setNeedsBackup(backupDue(f, child.questsCompleted, services.now())));
  }, [services, child.questsCompleted]);

  const week = weekStart(today);
  const todayStats = activityBetween(today, today, sessions, attempts);
  const thisWeek = activityBetween(week, today, sessions, attempts);
  const lastWeek = activityBetween(addDays(week, -7), addDays(week, -1), sessions, attempts);
  const todayQuest = sessions.find((s) => s.date === today && s.completedQuest);
  const challengeDone = sessions.some((s) => s.date === today && s.challengeDone);
  const goalMet = dailyGoalMet(child.dailyGoal, todayQuest !== undefined, challengeDone);
  const badges = Object.values(states).filter(
    (s) => s?.masteredAt !== undefined && localDate(new Date(s.masteredAt)) >= week,
  ).length;

  return (
    <>
      {needsBackup && (
        <p role="status" className="p-card font-bold">
          It's time to save a backup. This device holds the only copy of the progress.
        </p>
      )}
      <section className="p-card" data-testid="today">
        <h2 className="font-extrabold">
          {child.avatar} {child.name} today
        </h2>
        <p>
          {todayQuest ? 'Daily quest done.' : 'Daily quest not done yet.'}{' '}
          {child.dailyGoal === 'quest+challenge' &&
            (goalMet ? 'Challenge goal met.' : 'Goal includes the challenge.')}
        </p>
      </section>

      <section className="p-card" data-testid="recap">
        <h2 className="font-extrabold">Weekly recap</h2>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>
                <span className="sr-only">Period</span>
              </th>
              <th className="px-1 text-right">Quests</th>
              <th className="px-1 text-right">Min</th>
              <th className="px-1 text-right">Problems</th>
              <th className="pl-1 text-right">1st try</th>
            </tr>
          </thead>
          <tbody>
            <Stats label="Today" activity={todayStats} />
            <Stats label="This week" activity={thisWeek} days={7} />
            <Stats label="Last week" activity={lastWeek} days={7} />
          </tbody>
        </table>
        {badges > 0 && <p className="mt-1 text-sm font-bold">New badges this week: {badges}</p>}
      </section>

      <section className="p-card" data-testid="streak-card">
        <h2 className="font-extrabold">Streak</h2>
        <p>
          Now {streak.current} {streak.current === 1 ? 'day' : 'days'}, best {streak.best}. Shields:{' '}
          {streak.shields} of {MAX_SHIELDS}.
        </p>
        <p className="mb-2 text-sm">
          Going to miss a day for illness or a trip? Add a shield before the missed day. It covers
          the day automatically, and the day still counts toward a Perfect Week.
        </p>
        <button
          type="button"
          className="p-btn"
          disabled={streak.shields >= MAX_SHIELDS}
          onClick={() => void services.repo.grantShield(child.id).then(() => reload())}
        >
          Give a shield
        </button>
      </section>
    </>
  );
}
