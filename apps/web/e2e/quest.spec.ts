import { expect, test } from '@playwright/test';
import {
  answer,
  openChests,
  playUntilBreak,
  problemOnScreen,
  said,
  savedRun,
  setUpChild,
  stubSpeech,
  waitForServiceWorker,
  wrongValue,
} from './helpers';

const DAY_ONE = new Date(2026, 10, 2, 16).getTime();
const DAY = 24 * 60 * 60 * 1000;

test.beforeEach(async ({ page }) => {
  test.setTimeout(180_000);
  await stubSpeech(page);
  await page.clock.setFixedTime(DAY_ONE);
});

test('a full quest works offline, reaches the celebration, and stays done', async ({
  page,
  context,
}) => {
  await setUpChild(page);
  await waitForServiceWorker(page);
  await context.setOffline(true);

  await page.getByRole('button', { name: 'start quest' }).click();
  await playUntilBreak(page);

  // Warm-up and today's skill count for the day, even before the optional challenge.
  await page.getByRole('button', { name: 'Try it' }).click();
  await playUntilBreak(page);
  await expect(page.getByTestId('celebrate')).toBeVisible();
  await expect(page.getByTestId('streak')).toContainText('1');
  const earned = await page.getByTestId('coins-earned').innerText();
  expect(Number(earned.replace(/\D/g, ''))).toBeGreaterThan(15);

  await openChests(page);
  const heard = await said(page);
  expect(heard).toContain('You did it! See you tomorrow!');
  expect(heard.some((line) => /earned \d+ coins/.test(line))).toBe(true);

  await page.getByRole('button', { name: 'home' }).click();
  await expect(page.getByTestId('see-you')).toBeVisible();

  // Everything survives a reload with no network, and today's quest stays finished.
  await page.reload();
  await expect(page.getByTestId('see-you')).toBeVisible();
  await expect(page.getByRole('button', { name: 'start quest' })).toHaveCount(0);
  const banked = await page.getByTestId('coins').innerText();
  expect(Number(banked.replace(/\D/g, ''))).toBeGreaterThanOrEqual(
    Number(earned.replace(/\D/g, '')),
  );

  // Tomorrow there's a new quest, and the streak has carried over.
  await page.clock.setFixedTime(DAY_ONE + DAY);
  await page.reload();
  await page.getByRole('button', { name: 'start quest' }).click();
  await playUntilBreak(page);
  await page.getByRole('button', { name: "I'm done" }).click();
  await expect(page.getByTestId('celebrate')).toBeVisible();
  await expect(page.getByTestId('streak')).toContainText('2');
});

test('wrong answers get a hint, then the answer, and never a dead end', async ({ page }) => {
  await setUpChild(page);
  await page.getByRole('button', { name: 'start quest' }).click();
  await page.getByRole('button', { name: "Let's go", exact: true }).click();

  // A two-choice problem can't be missed twice, so move on to one that can.
  let problem = await problemOnScreen(page);
  let item = 0;
  while (problem.choices?.length === 2) {
    await answer(page, problem, problem.answer);
    item += 1;
    await expect(page.locator(`main[data-item="${item}"]`)).toBeVisible();
    problem = await problemOnScreen(page);
  }
  const first = wrongValue(problem);
  await answer(page, problem, first);
  await expect(page.getByTestId('hint')).toBeVisible();
  await expect(page.getByTestId('not-yet')).toBeAttached();
  await expect(page.getByTestId('correct')).toHaveCount(0);
  expect(await said(page)).toContain('Not yet. Look at this and try again.');

  await answer(page, problem, wrongValue(problem, [first]));
  await expect(page.getByRole('button', { name: 'next' })).toBeVisible();
  expect((await said(page)).join(' ')).toContain("That one was tricky. Here's how it works.");

  await page.getByRole('button', { name: 'next' }).click();
  await expect(page.locator(`main[data-item="${item + 1}"]`)).toBeVisible();
  await expect(page.getByTestId('hint')).toHaveCount(0);
});

test('correct feedback appears within 100ms of the tap', async ({ page }) => {
  await setUpChild(page);
  await page.getByRole('button', { name: 'start quest' }).click();
  await page.getByRole('button', { name: "Let's go", exact: true }).click();
  await page.evaluate(() => {
    const state = window as unknown as { __tap?: number; __shown?: number };
    document.addEventListener('click', () => (state.__tap = performance.now()), true);
    new MutationObserver(() => {
      if (document.querySelector('[data-testid="correct"]')) {
        state.__shown ??= performance.now();
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
  const problem = await problemOnScreen(page);
  await answer(page, problem, problem.answer);
  await expect(page.getByTestId('correct')).toBeAttached();
  const delay = await page.evaluate(() => {
    const state = window as unknown as { __tap: number; __shown: number };
    return state.__shown - state.__tap;
  });
  expect(delay).toBeLessThan(100);
});

test('closing the app mid-quest resumes the same quest at the same problem', async ({ page }) => {
  await setUpChild(page);
  await page.getByRole('button', { name: 'start quest' }).click();
  await page.getByRole('button', { name: "Let's go", exact: true }).click();
  const problem = await problemOnScreen(page);
  await answer(page, problem, problem.answer);
  await expect(page.locator('main[data-item="1"]')).toBeVisible();
  const before = await savedRun(page);

  await page.reload();
  await page.getByRole('button', { name: 'keep going' }).click();
  await expect(page.locator('main[data-item="1"]')).toBeVisible();
  const after = await savedRun(page);
  expect(after?.quest.seed).toBe(before?.quest.seed);
  expect(after?.coins).toBe(before?.coins);
});

test('leaving for home mid-quest costs nothing', async ({ page }) => {
  await setUpChild(page);
  await page.getByRole('button', { name: 'start quest' }).click();
  await page.getByRole('button', { name: "Let's go", exact: true }).click();
  await expect(page.locator('main[data-stage]')).toBeVisible();
  await page.getByRole('button', { name: 'home' }).click();
  await page.getByRole('button', { name: 'keep going' }).click();
  await expect(page.locator('main[data-item="0"]')).toBeVisible();
});
