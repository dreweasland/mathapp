import type { ChildProfile, ChildSettings, DailyGoal } from '@mathapp/engine';
import type { AppDb } from '../db';

export interface NewChild {
  name: string;
  avatar: string;
  grade?: ChildProfile['grade'];
  dailyGoal?: DailyGoal;
}

const DEFAULT_SETTINGS: ChildSettings = {
  handedness: 'right',
  reduceMotion: false,
  colorBlindSafe: false,
};

/** Typed repository: the pattern every table follows. `now` is injectable for tests. */
export function childrenRepository(db: AppDb, now: () => number = Date.now) {
  return {
    async create(input: NewChild): Promise<ChildProfile> {
      const time = now();
      const child: ChildProfile = {
        id: crypto.randomUUID(),
        name: input.name,
        avatar: input.avatar,
        theme: 'animals',
        grade: input.grade ?? 1,
        dailyGoal: input.dailyGoal ?? 'quest',
        settings: DEFAULT_SETTINGS,
        questsCompleted: 0,
        createdAt: time,
        updatedAt: time,
      };
      await db.children.add(child);
      return child;
    },

    get: (id: string) => db.children.get(id),

    list: () => db.children.orderBy('updatedAt').toArray(),

    async update(id: string, changes: Partial<Omit<ChildProfile, 'id' | 'createdAt'>>) {
      await db.children.update(id, { ...changes, updatedAt: now() });
    },
  };
}
