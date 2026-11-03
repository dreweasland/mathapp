// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { newInventory, newStreak, newWallet, type ChildProfile } from '@mathapp/engine';
import { describe, expect, it } from 'vitest';
import type { Dashboard } from '../db/repositories/parent';
import { statusLabel } from './labels';
import { PIN_LENGTH, grownUpQuestion, hashPin, newSalt } from './pin';
import { reportDoc, reportFileName } from './reportDoc';

const child = (name: string): ChildProfile => ({
  id: 'c',
  name,
  avatar: '🦊',
  theme: 'animals',
  grade: 1,
  dailyGoal: 'quest',
  settings: { handedness: 'right', reduceMotion: false, colorBlindSafe: false },
  questsCompleted: 0,
  createdAt: 0,
  updatedAt: 0,
});

const view = (name = 'Sam'): Dashboard => ({
  child: child(name),
  progress: {
    states: {},
    cards: new Map(),
    wallet: newWallet('c'),
    streak: newStreak('c'),
    inventory: newInventory('c'),
    goals: [],
    cheers: [],
  },
  sessions: [],
  attempts: [],
  goals: [],
  cheers: [],
});

describe('reportDoc', () => {
  it('is one complete page with no outside files, so it works offline and as a shared file', () => {
    const doc = reportDoc(view(), '2026-11-02');
    expect(doc.startsWith('<!doctype html>')).toBe(true);
    expect(doc).not.toMatch(/<script|<link|src=|https?:/);
  });
  it('still reads well before any practice', () => {
    const doc = reportDoc(view(), '2026-11-02');
    expect(doc).toContain('No practice recorded yet.');
    expect(doc).not.toContain('NaN');
    expect(doc).not.toContain('undefined');
  });
  it('escapes a name typed by a parent', () => {
    const doc = reportDoc(view('<img src=x onerror=alert(1)>'), '2026-11-02');
    expect(doc).not.toContain('<img');
  });
  it('makes a safe file name from any name', () => {
    expect(reportFileName('Sam Lee', '2026-11-02')).toBe('Sam-Lee-math-report-2026-11-02.html');
    expect(reportFileName('../../x', '2026-11-02')).toBe('-x-math-report-2026-11-02.html');
    expect(reportFileName('Zoë', '2026-11-02')).toBe('Zoë-math-report-2026-11-02.html');
  });
});

describe('statusLabel', () => {
  it('never says a practiced skill has not started', () => {
    expect(statusLabel('open', 0)).toBe('Ready to start');
    expect(statusLabel('open', 12)).toBe('Practicing');
    expect(statusLabel('locked', 3)).toBe('Practicing');
    expect(statusLabel('mastered', 30)).toBe('Mastered');
  });
});

describe('PIN', () => {
  it('matches only the same PIN and salt, and never stores the digits', async () => {
    const salt = newSalt();
    const hash = await hashPin('1234', salt);
    expect(await hashPin('1234', salt)).toBe(hash);
    expect(await hashPin('1235', salt)).not.toBe(hash);
    expect(await hashPin('1234', newSalt())).not.toBe(hash);
    expect(hash).not.toContain('1234');
    expect(PIN_LENGTH).toBe(4);
  });
  it('asks a question beyond a first grader, with a right answer', () => {
    for (const r of [0, 0.3, 0.6, 0.99]) {
      const { text, answer } = grownUpQuestion(() => r);
      const [a, b] = text.split(' × ').map(Number) as [number, number];
      expect(Number(answer)).toBe(a * b);
      expect(a).toBeGreaterThanOrEqual(12);
      expect(b).toBeGreaterThanOrEqual(6);
    }
  });
});
