import { expect, test } from '@playwright/test';
import { said, stubSpeech } from './helpers';

test.beforeEach(async ({ page }) => {
  await stubSpeech(page);
});

/** Reaches a new child's first Home without dismissing anything. */
async function firstHome(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue in Safari for now' }).click();
  await page.getByLabel("Child's name").fill('Sam');
  await page.getByRole('button', { name: 'Grade 2' }).click();
  await page.getByRole('button', { name: 'done' }).click();
}

test('the first Home walks through its three parts, once, and Help brings it back', async ({
  page,
}) => {
  await firstHome(page);
  const tour = page.getByTestId('tour');
  await expect(tour).toBeVisible();
  await expect(tour).toContainText('1 of 3');
  await expect(page.getByTestId('today')).toHaveClass(/tour-lit/);
  await expect(tour.getByTestId('bubble')).toContainText("I'm Bo");

  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(tour).toContainText('2 of 3');
  await expect(page.getByRole('button', { name: 'streak plant' })).toHaveClass(/tour-lit/);

  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(tour).toContainText('3 of 3');
  // The part being explained is on screen, not scrolled away.
  await expect(page.locator('nav.tour-lit').filter({ visible: true })).toBeInViewport();

  await tour.getByRole('button', { name: 'Got it' }).click();
  await expect(tour).toHaveCount(0);
  expect((await said(page)).at(-1)).toMatch(/Tap Start/);

  // Seen once, it stays away.
  await page.reload();
  await expect(page.getByRole('button', { name: 'start quest' })).toBeVisible();
  await expect(tour).toHaveCount(0);

  await page.getByRole('button', { name: 'help' }).click();
  await expect(tour).toContainText('1 of 3');
  await tour.getByRole('button', { name: 'Skip tour' }).click();
  await expect(tour).toHaveCount(0);
});

test('Home says what to do in words as well as speech, and every button has a word', async ({
  page,
}) => {
  await firstHome(page);
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.getByTestId('bubble').first()).toBeVisible();
  for (const word of [
    'Start',
    'Warm-up',
    'Learn',
    'Bonus',
    'Map',
    'Trophies',
    'Animals',
    'Dress up',
  ]) {
    await expect(page.locator('main')).toContainText(word);
  }
  // No emoji left on the child's screens: they are drawn icons now.
  const emoji = await page.evaluate(() =>
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(
      document.querySelector('main')?.textContent ?? '',
    ),
  );
  expect(emoji).toBe(false);
});

test('the grown-up note can be put away for the rest of the visit', async ({ page }) => {
  await firstHome(page);
  await page.getByRole('button', { name: 'Skip tour' }).click();
  const note = page.getByTestId('grown-up-note');
  await expect(note).toContainText('Home Screen');
  await note.getByRole('button', { name: 'OK' }).click();
  await expect(note).toHaveCount(0);
  await page.reload();
  await expect(note).toContainText('Home Screen');
});
