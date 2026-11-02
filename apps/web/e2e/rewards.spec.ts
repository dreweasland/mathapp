import { expect, test, type Page } from '@playwright/test';
import { openChests, patchRow, playUntilBreak, setUpChild, stubSpeech } from './helpers';

const DAY_ONE = new Date(2026, 10, 2, 16).getTime();
const DAY = 24 * 60 * 60 * 1000;

test.beforeEach(async ({ page }) => {
  test.setTimeout(180_000);
  await stubSpeech(page);
  await page.clock.setFixedTime(DAY_ONE);
  await setUpChild(page);
});

async function finishQuest(page: Page) {
  await page.getByRole('button', { name: 'start quest' }).click();
  await playUntilBreak(page);
  await page.getByRole('button', { name: 'skip' }).click();
  await expect(page.getByTestId('celebrate')).toBeVisible();
}

test('day 1 chest holds a collectible that lands in the sticker book', async ({ page }) => {
  await finishQuest(page);
  await page.getByRole('button', { name: 'open chest' }).click();
  await expect(page.getByTestId('chest-item')).toBeVisible();
  const id = await page.getByTestId('chest-item').getAttribute('data-id');
  expect(id).toMatch(/^forest\./);
  await page.getByTestId('chest-reveal').getByRole('button', { name: 'next' }).click();
  await openChests(page);
  await page.getByRole('button', { name: 'home' }).click();

  await page.getByRole('button', { name: 'animals' }).click();
  const owned = page.locator('[data-testid="stickers"] button[data-owned="true"]');
  await expect(owned.first()).toBeVisible();
  await expect(page.locator('[data-testid="stickers"] button')).toHaveCount(12);
  await page.getByRole('button', { name: 'home' }).click();
  await expect(page.getByTestId('see-you')).toBeVisible();
});

test('a chest left closed waits on Home, and survives a reload', async ({ page }) => {
  await finishQuest(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'open chest' })).toBeVisible();
  await openChests(page);
  await expect(page.getByTestId('see-you')).toBeVisible();
});

test('day 2 brings the bow, worn by the bear on every screen', async ({ page }) => {
  await finishQuest(page);
  await openChests(page);
  await page.getByRole('button', { name: 'home' }).click();
  await page.clock.setFixedTime(DAY_ONE + DAY);
  await page.reload();
  await expect(page.getByTestId('streak')).toContainText('1');
  await finishQuest(page);
  await openChests(page);
  await expect(page.locator('[data-wear="accessory"]').first()).toBeVisible();
  await expect(page.getByTestId('streak')).toContainText('2');
  await page.getByRole('button', { name: 'home' }).click();
  await expect(page.locator('[data-mark="done"]')).toHaveCount(2);
});

test('buying takes a second tap, and the purchase stays after a reload', async ({ page }) => {
  await finishQuest(page);
  await openChests(page);
  await page.getByRole('button', { name: 'home' }).click();
  await patchRow(page, 'wallets', { coins: 500, lifetimeCoins: 500 });
  await page.reload();
  const coins = 500;

  await page.getByRole('button', { name: 'dress up' }).click();
  await page.getByRole('button', { name: 'Bow', exact: true }).click();
  // Trying it on has shown it but spent nothing.
  await expect(page.locator('[data-wear="accessory"]')).toBeVisible();
  await expect(page.getByTestId('shop-coins')).toContainText(String(coins));
  await page.getByRole('button', { name: 'buy for 80' }).click();
  await expect(page.getByTestId('shop-coins')).toContainText(String(coins - 80));

  await page.reload();
  await page.getByRole('button', { name: 'dress up' }).click();
  await expect(page.locator('[data-wear="accessory"]')).toBeVisible();
  await expect(page.getByTestId('shop-coins')).toContainText(String(coins - 80));
});

test('the map has one place to be, and the wall shows every badge to earn', async ({ page }) => {
  await page.getByRole('button', { name: 'map' }).click();
  await expect(page.locator('[data-testid="map"] button')).toHaveCount(14);
  await expect(page.locator('[data-status="current"]')).toHaveCount(1);
  await expect(page.locator('[data-status="locked"]').first()).toBeVisible();
  await page.getByRole('button', { name: 'home' }).click();

  await page.getByRole('button', { name: 'trophies' }).click();
  await expect(page.locator('[data-testid="trophies"] button')).toHaveCount(14);
  await expect(page.locator('[data-earned="true"]')).toHaveCount(0);
});

test('a reached milestone opens a certificate', async ({ page }) => {
  await finishQuest(page);
  await openChests(page);
  await page.getByRole('button', { name: 'home' }).click();
  await patchRow(page, 'streaks', { best: 3 });
  await page.reload();
  await page.getByRole('button', { name: 'trophies' }).click();
  await expect(page.getByRole('button', { name: '7 days' })).toBeDisabled();
  await page.getByRole('button', { name: '3 days' }).click();
  await expect(page.getByTestId('certificate')).toContainText('3 days');
  await expect(page.getByTestId('certificate')).toContainText('Sam');
  await page.getByRole('button', { name: 'back' }).click();
  await expect(page.getByTestId('trophies')).toBeVisible();
});

test('missions are on Home and speak when tapped', async ({ page }) => {
  const missions = page.locator('[data-testid="missions"] button');
  await expect(missions).toHaveCount(3);
  await missions.first().click();
  const heard = await page.evaluate(() => (window as unknown as { __said: string[] }).__said);
  expect(heard.at(-1)).toMatch(/quest|in a row/i);
});

const VIEWPORTS = [
  { name: 'iPhone 15', width: 393, height: 660 },
  { name: 'iPhone SE', width: 375, height: 553 },
  { name: 'iPhone SE landscape', width: 667, height: 375 },
  { name: 'iPad portrait', width: 768, height: 1024 },
  { name: 'iPad landscape', width: 1024, height: 768 },
];

test('every new screen keeps tap targets and fits, on all five sizes', async ({ page }) => {
  await finishQuest(page);
  await openChests(page);
  await page.getByRole('button', { name: 'home' }).click();
  const failures: string[] = [];
  for (const view of VIEWPORTS) {
    await page.setViewportSize({ width: view.width, height: view.height });
    for (const place of ['home', 'map', 'trophies', 'animals', 'dress up']) {
      if (place !== 'home') await page.getByRole('button', { name: place }).click();
      await page.waitForTimeout(50);
      const found = await page.evaluate(() => {
        const small: string[] = [];
        const clipped: string[] = [];
        const scrolling = (el: Element) => el.closest('.overflow-y-auto');
        for (const button of document.querySelectorAll('main button')) {
          const box = button.getBoundingClientRect();
          const name = button.getAttribute('aria-label') ?? '?';
          if (box.width < 63.5 || box.height < 63.5) small.push(name);
          if (!scrolling(button) && (box.bottom > innerHeight + 0.5 || box.top < -0.5)) {
            clipped.push(name);
          }
        }
        return { small, clipped, sideways: document.documentElement.scrollWidth > innerWidth };
      });
      if (found.small.length) failures.push(`${view.name} ${place}: small ${found.small}`);
      if (found.clipped.length) failures.push(`${view.name} ${place}: clipped ${found.clipped}`);
      if (found.sideways) failures.push(`${view.name} ${place}: sideways`);
      if (place !== 'home') await page.getByRole('button', { name: 'home' }).click();
    }
  }
  expect(failures).toEqual([]);
});
