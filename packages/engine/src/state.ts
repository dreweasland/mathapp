/**
 * Persisted data model, shared by the engine (pure logic) and the web app (Dexie).
 *
 * Conventions:
 * - Calendar days are local `YYYY-MM-DD` strings (LocalDate). Timestamps are epoch ms.
 * - Every row has `updatedAt`, so a later sync layer can diff by it.
 * - All ids are strings; `childId` scopes every row to one profile.
 */
import type { QuestRun } from './questRun';
import type { Problem } from './types';

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
  /** "HH:MM", for the calendar reminder. */
  mathTime?: string;
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
  /** Set when the first-run placement warm-up ends. */
  placedAt?: number;
  /** Set when the first-visit tour of Home ends, so it only runs once on its own. */
  touredAt?: number;
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
  /** Most right in one Fact Blitz. Only ever rises, and only against the child's own score. */
  blitzBest?: number;
  /** Problems missed twice, due back in the next quest. Non-fact only: fact cards do this. */
  retakes?: Problem[];
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
  /** Kept after the run is cleared, for the parent's daily-goal view. */
  challengeDone?: boolean;
  /** The quest in progress. Cleared when it ends, so old rows stay small. */
  run?: QuestRun;
  updatedAt: number;
}

export interface Streak {
  childId: string;
  current: number;
  /** Never decreases. */
  best: number;
  lastCountedDate?: LocalDate;
  shields: number;
  /** How many of `shields` a parent granted; those days count toward a Perfect Week. */
  parentShields: number;
  /** Missed days up to here are settled, so reopening the app can't spend a shield twice. */
  coveredThrough?: LocalDate;
  /** Days a quest was done, kept for the current and previous week. */
  countedDates: LocalDate[];
  /** Days covered by a parent-granted shield. */
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

export type ChestTier = 'bronze' | 'silver' | 'gold' | 'perfect';

/** A chest's contents are decided and banked when earned; opening it only shows them. */
export interface ChestReward {
  source: 'daily' | 'missions' | 'milestone';
  tier: ChestTier;
  coins: number;
  /** A collectible or cosmetic. Absent when the chest held only coins or a shield. */
  itemId?: string;
  shield?: boolean;
  /** The item was already owned, so the chest paid coins too. */
  duplicate?: boolean;
  /** Set id, when this item finished a collection. */
  setCompleted?: string;
}

export interface Inventory {
  childId: string;
  /** Collectibles, cosmetics and scene decorations. Only ever grows. */
  items: string[];
  /** Slot to cosmetic id. */
  mascotEquipped: Record<string, string>;
  /** Earned but not opened yet, so closing the app can't cost a chest. */
  unopened: ChestReward[];
  /** Item pulls in a row that were duplicates, for the pity rule. */
  dupesInARow: number;
  dailyChestDate?: LocalDate;
  bonusChestDate?: LocalDate;
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

/** `AudioData` is browser-only, so the engine stays free of DOM types. */
export interface Cheer<AudioData = unknown> {
  id: string;
  childId: string;
  audio?: AudioData;
  emoji?: string;
  createdAt: number;
  playedAt?: number;
  updatedAt: number;
}
