/**
 * Prints a Daily Quest for a sample child, using only the pure engine.
 *
 *   npm run demo
 *   npm run demo -- --fixture day10
 *   npm run demo -- --fixture broken-streak --date 2026-11-20 --seed 7
 *   npm run demo -- --answers       also show answers and choices
 */
import { readFileSync } from 'node:fs';
import { ALL_SKILLS, render } from '@mathapp/content';
import {
  applyPlacement,
  buildDailyQuest,
  generateMissions,
  hashSeed,
  mulberry32,
  reconcileStreak,
  refreshUnlocks,
  type FactCard,
  type LocalDate,
  type Problem,
  type QuestItem,
  type SkillStates,
  type Streak,
  type StreakEvent,
  type Wallet,
} from '@mathapp/engine';

interface Fixture {
  description: string;
  childId: string;
  name: string;
  today: LocalDate;
  questsCompleted: number;
  placement?: string[];
  skillStates: SkillStates;
  factCards: FactCard[];
  streak: Streak;
  wallet: Wallet;
}

function option(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const fixtureName = option('fixture') ?? 'day1';
const showAnswers = process.argv.includes('--answers');
const fixture = JSON.parse(
  readFileSync(new URL(`./fixtures/${fixtureName}.json`, import.meta.url), 'utf8'),
) as Fixture;

const today = option('date') ?? fixture.today;
const seedText = option('seed');
const AT = 0;

const eventLine = (event: StreakEvent): string | undefined => {
  if (event.type === 'new-streak') return render('streak.new', { best: event.best });
  if (event.type === 'shielded') return render('streak.shielded');
  return undefined;
};

function line(item: QuestItem, n: number): string {
  const { problem } = item;
  const tags = [
    item.workedExample && 'worked example',
    item.review && 'review',
    item.finalWin && 'final win',
  ]
    .filter(Boolean)
    .join(', ');
  const text = render(problem.speech.key, problem.speech.params);
  const head = `  ${String(n).padStart(2)}. [${problem.questionType}, level ${problem.difficulty}] ${text}`;
  return `${head}${tags ? `  (${tags})` : ''}${showAnswers ? `\n      ${answerLine(problem)}` : ''}`;
}

function answerLine(problem: Problem): string {
  const choices = problem.choices?.map((c) => c.value).join(' | ');
  return `answer: ${problem.answer}${choices ? `   choices: ${choices}` : ''}   hint: ${problem.hint.visual}`;
}

let states = fixture.skillStates;
if (fixture.placement) {
  states = applyPlacement(fixture.placement, ALL_SKILLS, states, fixture.childId, AT);
}
states = refreshUnlocks(ALL_SKILLS, states, fixture.childId, AT);

const { streak, events } = reconcileStreak(fixture.streak, today, AT);
const quest = buildDailyQuest({
  childId: fixture.childId,
  today,
  questsCompleted: fixture.questsCompleted,
  skills: ALL_SKILLS,
  states,
  factCards: fixture.factCards,
  ...(seedText ? { seed: Number(seedText) } : {}),
});
const skill = ALL_SKILLS.find((s) => s.id === quest.todaySkillId);
const missions = generateMissions(
  {
    childId: fixture.childId,
    date: today,
    todayMastery: states[quest.todaySkillId]?.mastery ?? 0,
    factCards: fixture.factCards,
    at: AT,
  },
  mulberry32(hashSeed(`${fixture.childId}|${today}|missions`)),
);

console.log(`\n${fixture.name}: ${fixture.description}`);
console.log(`Date ${today}, quest day ${quest.dayNumber}${quest.ramp ? ' (first-week ramp)' : ''}`);
console.log(
  `Streak ${streak.current}, best ${streak.best}, shields ${streak.shields}. ` +
    `Coins ${fixture.wallet.coins} to spend, ${fixture.wallet.lifetimeCoins} all-time.`,
);
for (const message of events.map(eventLine)) {
  if (message) console.log(`Says: "${message}"`);
}

console.log(`\nToday: ${skill?.name} (${skill?.standard}), mode: ${quest.mode}`);
console.log(
  `${quest.problemCount} problems, about ${quest.estimatedMinutes} minutes (rough estimate)`,
);

console.log('\nMissions');
for (const m of missions) {
  console.log(`  ${m.slot}. ${render(`mission.${m.kind}`, { target: m.target })}`);
}

const TITLES = {
  warmup: '1. Warm-up',
  skill: "2. Today's skill",
  challenge: `3. Challenge (optional, ${quest.challengeKind})`,
};
let n = 0;
for (const section of quest.sections) {
  console.log(`\n${TITLES[section.kind]}`);
  for (const item of section.items) console.log(line(item, ++n));
}
console.log(`\n4. Celebration: "${render('quest.done')}"\n`);
