import { ALL_SKILLS } from '@mathapp/content';
import { activityBetween, weekStart } from '@mathapp/engine';
import type { RecapChild, RecapRequest } from '@mathapp/worker/protocol';
import type { AppDb } from '../db/db';
import { localDate } from '../game/today';

/**
 * The only numbers that leave the device readable, and only with the weekly email turned on:
 * this week's totals, the streak and new badge names, per child.
 */
export async function buildRecap(db: AppDb, at: number, timeZone: string): Promise<RecapRequest> {
  const today = localDate(new Date(at));
  const week = weekStart(today);
  const children = (await db.children.toArray()).sort((a, b) => a.createdAt - b.createdAt);
  const rows: RecapChild[] = [];
  for (const child of children) {
    const [sessions, attempts, streak, skills] = await Promise.all([
      db.sessions.where('childId').equals(child.id).toArray(),
      db.attempts.where('childId').equals(child.id).toArray(),
      db.streaks.get(child.id),
      db.skillStates.where('childId').equals(child.id).toArray(),
    ]);
    const activity = activityBetween(week, today, sessions, attempts);
    const badges = skills
      .filter((s) => s.masteredAt !== undefined && localDate(new Date(s.masteredAt)) >= week)
      .map((s) => ALL_SKILLS.find((k) => k.id === s.skillId)?.badgeName ?? s.skillId);
    rows.push({
      name: child.name,
      quests: activity.quests,
      minutes: activity.minutes,
      problems: activity.problems,
      accuracy: activity.accuracy ?? null,
      streak: streak?.current ?? 0,
      best: streak?.best ?? 0,
      badges,
    });
  }
  return { enabled: true, timeZone, week, children: rows };
}
