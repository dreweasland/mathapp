/** Regenerates scripts/fixtures from the engine's own defaults. Run: npx tsx scripts/make-fixtures.ts */
import { writeFileSync } from 'node:fs';
import { newFactCard, newSkillState, newStreak, newWallet, reviewCard } from '@mathapp/engine';

const childId = 'demo-child';
const write = (name: string, data: unknown) =>
  writeFileSync(
    new URL(`./fixtures/${name}.json`, import.meta.url),
    `${JSON.stringify(data, null, 2)}\n`,
  );
const skill = (id: string, over: object) => ({ [id]: { ...newSkillState(childId, id), ...over } });
const base = { childId, name: 'Sam', skillStates: {}, factCards: [], wallet: newWallet(childId) };

write('day1', {
  ...base,
  description: 'first quest, placed past counting and ten-frames',
  today: '2026-11-02',
  questsCompleted: 0,
  placement: ['1.counting', '1.ten-frame'],
  streak: newStreak(childId),
});

const cards = ['add:3+4', 'add:5+5', 'add:6+2', 'add:7+1', 'add:2+8', 'add:4+4', 'add:9+0'].map(
  (factId, i) =>
    reviewCard(newFactCard(childId, factId, '2026-11-02'), {
      correct: i % 3 !== 0,
      responseMs: 2000 + i * 300,
      today: '2026-11-08',
      at: 1,
    }),
);

write('day10', {
  ...base,
  description: 'ten days in, partway through addition facts',
  today: '2026-11-11',
  questsCompleted: 10,
  skillStates: {
    ...skill('1.counting', { mastery: 70, placedOut: true }),
    ...skill('1.ten-frame', { mastery: 70, placedOut: true }),
    ...skill('1.add-within-10', { mastery: 62, attempts: 34, difficulty: 3 }),
    ...skill('1.shapes', { mastery: 45, attempts: 9, difficulty: 2 }),
  },
  factCards: cards,
  streak: { ...newStreak(childId), current: 9, best: 9, shields: 1, lastCountedDate: '2026-11-10' },
  wallet: { ...newWallet(childId), coins: 180, lifetimeCoins: 240 },
});

write('broken-streak', {
  ...base,
  description: 'missed three days with one shield, which is kept',
  today: '2026-11-11',
  questsCompleted: 12,
  skillStates: {
    ...skill('1.counting', { mastery: 88, attempts: 40, masteredAt: 1, difficulty: 4 }),
    ...skill('1.ten-frame', { mastery: 74, attempts: 20, difficulty: 3 }),
  },
  streak: {
    ...newStreak(childId),
    current: 12,
    best: 12,
    shields: 1,
    lastCountedDate: '2026-11-07',
  },
  wallet: { ...newWallet(childId), coins: 90, lifetimeCoins: 300 },
});
