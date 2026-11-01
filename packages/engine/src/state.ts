/**
 * Persisted data model, shared by the engine (pure logic) and the web app (Dexie).
 *
 * Conventions:
 * - Calendar days are local `YYYY-MM-DD` strings (LocalDate). Timestamps are epoch ms.
 * - Every row has `updatedAt`, so a later sync layer can diff by it.
 * - All ids are strings; `childId` scopes every row to one profile.
 */
export type LocalDate = string;
export type DailyGoal = 'quest' | 'quest+challenge';
export type Theme = 'animals';
export type ErrorType =
  'off-by-one' | 'reversed-operation' | 'place-value' | 'didnt-regroup' | 'digit-swap' | 'other';

export interface ChildSettings {
  voice?: string;
  handedness: 'left' | 'right';
  reduceMotion: boolean;
  colorBlindSafe: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  theme: Theme;
  grade: 1 | 2 | 3;
  dailyGoal: DailyGoal;
  settings: ChildSettings;
  /** Completed quests, so "alternating days" isn't skewed by a missed day. */
  questsCompleted: number;
  createdAt: number;
  updatedAt: number;
}

export interface SkillState {
  childId: string;
  skillId: string;
  /** 0–100. Can move both ways; everything the child has earned is in the sticky fields. */
  mastery: number;
  attempts: number;
  lastPracticedAt?: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  errorCounts: Partial<Record<ErrorType, number>>;
  /** Sticky: set when the badge is earned and never cleared. */
  masteredAt?: number;
  /** Sticky: once a skill is open it stays open. */
  unlockedAt?: number;
  /** Passed in placement: skips the frontier and joins the review pool. */
  placedOut?: boolean;
  fastStreak: number;
  wrongStreak: number;
  /** Quests that featured this skill since it was last mastered; used to rotate off a stuck skill. */
  questsOnSkill: number;
  updatedAt: number;
}

export interface FactAttempt {
  at: number;
  correct: boolean;
  responseMs: number;
}

export interface FactCard {
  childId: string;
  factId: string;
  box: 0 | 1 | 2 | 3 | 4 | 5;
  dueDate: LocalDate;
  lastResponseMs?: number;
  /** Newest last, capped at 10: the fluency bar only looks at the last 10 attempts. */
  history: FactAttempt[];
  updatedAt: number;
}

export interface Attempt {
  id: string;
  childId: string;
  sessionId: string;
  skillId: string;
  questionType: string;
  difficulty: number;
  prompt: string;
  answer: string;
  given: string;
  correct: boolean;
  /** 1 for a first try, 2 for the retry after a hint. */
  tryNumber: 1 | 2;
  responseMs: number;
  errorType?: ErrorType;
  at: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  childId: string;
  startedAt: number;
  endedAt?: number;
  /** The local day this session belongs to. A quest counts for the day it started. */
  date: LocalDate;
  type: 'quest' | 'blitz' | 'free' | 'placement';
  problemsCount: number;
  correctCount: number;
  coinsEarned: number;
  completedQuest: boolean;
  updatedAt: number;
}

export interface Streak {
  childId: string;
  current: number;
  /** Never decreases. */
  best: number;
  lastCountedDate?: LocalDate;
  shields: number;
  /** Days a quest was done, kept for the current and previous week. */
  countedDates: LocalDate[];
  /** Days a parent excused; these count toward a Perfect Week. */
  excusedDates: LocalDate[];
  /** Monday of each Perfect Week. */
  perfectWeeks: LocalDate[];
  updatedAt: number;
}

export interface Wallet {
  childId: string;
  /** Spendable. Drops only when the child chooses to buy something. */
  coins: number;
  /** Only ever rises. */
  lifetimeCoins: number;
  updatedAt: number;
}

export interface Inventory {
  childId: string;
  items: string[];
  mascotEquipped: Record<string, string>;
  updatedAt: number;
}

export type MissionKind = 'in-a-row' | 'finish-quest' | 'finish-challenge' | 'fast-facts';

export interface Mission {
  childId: string;
  date: LocalDate;
  slot: 1 | 2 | 3;
  kind: MissionKind;
  target: number;
  progress: number;
  done: boolean;
  updatedAt: number;
}

export interface Goal {
  id: string;
  childId: string;
  title: string;
  imageKey: string;
  target: number;
  unit: 'quests' | 'perfect-weeks' | 'skills';
  progress: number;
  rewardText: string;
  startDate: LocalDate;
  endDate?: LocalDate;
  delivered: boolean;
  updatedAt: number;
}

/** `AudioData` is a Blob in the browser; the engine stays free of DOM types. */
export interface Cheer<AudioData = unknown> {
  id: string;
  childId: string;
  audioBlob?: AudioData;
  emoji?: string;
  createdAt: number;
  playedAt?: number;
  updatedAt: number;
}
