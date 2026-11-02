import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  answer,
  openChests,
  playUntilBreak,
  problemOnScreen,
  setUpChild,
  stubSpeech,
} from './helpers';

const VIEWS = [
  { width: 393, height: 660 },
  { width: 375, height: 553 },
  { width: 667, height: 375 },
  { width: 768, height: 1024 },
];

test.beforeEach(async ({ page }) => {
  await stubSpeech(page);
  await page.addInitScript(() => Object.assign(navigator, { canShare: undefined }));
});

async function finishQuest(page: Page) {
  await page.getByRole('button', { name: 'start quest' }).click();
  await playUntilBreak(page);
  const skip = page.getByRole('button', { name: 'skip' });
  if (await skip.isVisible()) await skip.click();
  await expect(page.getByTestId('celebrate')).toBeVisible();
  await openChests(page);
  await page.getByRole('button', { name: 'home' }).click();
  await expect(page.getByTestId('see-you')).toBeVisible();
}

async function openFree(page: Page) {
  await page.getByRole('button', { name: 'free play' }).click();
  await expect(page.getByTestId('free')).toBeVisible();
}

async function grownUps(page: Page) {
  await page.getByRole('button', { name: 'Sam' }).click();
  await page.getByRole('button', { name: 'grown-ups' }).click();
  const pad = page.getByTestId('pin-pad');
  const tap = async (digits: string[]) => {
    for (const d of digits) await pad.getByRole('button', { name: d, exact: true }).click();
  };
  const question = await page.getByText(/What is \d+ × \d+\?/).textContent();
  const [, a, b] = /(\d+) × (\d+)/.exec(question ?? '') as RegExpExecArray;
  await tap(String(Number(a) * Number(b)).split(''));
  await expect(page.getByRole('heading', { name: 'Make a 4-digit PIN' })).toBeVisible();
  await tap(['1', '2', '3', '4']);
  await expect(page.getByRole('heading', { name: 'Enter it again' })).toBeVisible();
  await tap(['1', '2', '3', '4']);
  await expect(page.getByTestId('parent')).toBeVisible();
}

test('free play only appears after the quest', async ({ page }) => {
  await setUpChild(page);
  await expect(page.getByRole('button', { name: 'free play' })).toHaveCount(0);
  await finishQuest(page);
  await expect(page.getByRole('button', { name: 'free play' })).toBeVisible();
});

test('practice pays coins and leaves the streak alone', async ({ page }) => {
  await setUpChild(page);
  await finishQuest(page);
  const coins = Number((await page.getByTestId('coins').textContent())?.replace(/\D/g, ''));
  await expect(page.getByTestId('streak')).toContainText('1');
  await openFree(page);
  await page.getByTestId('practice-tiles').getByRole('button').first().click();
  for (let i = 0; i < 40; i++) {
    const done = page.getByTestId('free-done');
    if (await done.isVisible()) break;
    const main = page.locator('main[data-stage="answering"]');
    await expect(main.or(done).first()).toBeVisible();
    if (await done.isVisible()) break;
    const before = await main.getAttribute('data-item');
    const problem = await problemOnScreen(page);
    await answer(page, problem, problem.answer);
    await expect(page.locator(`main[data-stage="answering"][data-item="${before}"]`)).toHaveCount(
      0,
    );
  }
  await expect(page.getByTestId('free-done')).toBeVisible();
  await page.getByRole('button', { name: 'home' }).click();
  await expect(page.getByTestId('streak')).toContainText('1');
  const after = Number((await page.getByTestId('coins').textContent())?.replace(/\D/g, ''));
  expect(after).toBeGreaterThan(coins);
});

/** Reads the fact off the screen, the way the child does, and answers it. */
async function answerBlitz(page: Page) {
  const prompt = await page.getByTestId('prompt').textContent();
  const [, a, op, b] = /(\d+)\s*([+−×÷])\s*(\d+)/.exec(prompt ?? '') as RegExpExecArray;
  const [x, y] = [Number(a), Number(b)];
  const value = op === '+' ? x + y : op === '−' ? x - y : op === '×' ? x * y : x / y;
  const choice = page.locator(`[data-testid="blitz"] button[data-value="${value}"]`);
  if (await choice.count()) {
    await choice.click();
    return;
  }
  for (const digit of String(value)) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'check' }).click();
}

async function startAtGrade2(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue in Safari for now' }).click();
  await page.getByLabel("Child's name").fill('Sam');
  await page.getByRole('button', { name: 'Grade 2' }).click();
  await page.getByRole('button', { name: 'done' }).click();
  await expect(page.getByRole('button', { name: 'start quest' })).toBeVisible();
}

test('Fact Blitz fills a bar with no countdown, and keeps a personal best', async ({ page }) => {
  await page.clock.install();
  await startAtGrade2(page);
  await finishQuest(page);
  await openFree(page);
  await page.getByTestId('blitz-tiles').getByRole('button').first().click();
  await expect(page.getByTestId('blitz-bar')).toBeVisible();
  await expect(page.getByTestId('blitz').locator('header')).not.toContainText(/:\d\d|\d+\s*s/);

  await answerBlitz(page);
  await expect(page.getByTestId('blitz-live')).toContainText('1');
  await answerBlitz(page);
  await expect(page.getByTestId('blitz-live')).toContainText('2');

  await page.clock.fastForward(61_000);
  await expect(page.getByTestId('free-done')).toBeVisible();
  await expect(page.getByTestId('blitz-score')).toContainText('⭐ 2');
  await page.getByRole('button', { name: 'home' }).click();

  // A lower score leaves the best where it was.
  await openFree(page);
  const tile = page.getByTestId('blitz-tiles').getByRole('button').first();
  await expect(tile).toContainText('2');
  await tile.click();
  await expect(page.getByTestId('blitz-bar')).toBeVisible();
  await page.clock.fastForward(61_000);
  await expect(page.getByTestId('blitz-best')).toContainText('2');
});

test('a child starting in Grade 2 skips the warm-up and plays Grade 2', async ({ page }) => {
  await startAtGrade2(page);
  await page.getByRole('button', { name: 'map' }).click();
  await expect(page.getByTestId('map').getByRole('button')).toHaveCount(12);
  await page.getByRole('button', { name: 'home' }).click();
  await finishQuest(page);
  const skill = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open('mathapp');
        open.onsuccess = () => {
          const read = open.result.transaction('attempts').objectStore('attempts').getAll();
          read.onsuccess = () => {
            open.result.close();
            const rows = read.result as { skillId: string }[];
            resolve(rows.map((r) => r.skillId).find((s) => s.startsWith('2.')) ?? 'none');
          };
        };
      }),
  );
  expect(skill).toMatch(/^2\./);
});

test('moving up to Grade 3 changes the report to multiplication, still one page', async ({
  page,
}) => {
  await setUpChild(page);
  await grownUps(page);
  await page.getByRole('button', { name: /^Children/ }).click();
  await page.getByRole('button', { name: 'Move to Grade 2' }).click();
  await page.getByRole('button', { name: 'Move to Grade 3' }).click();
  await expect(page.getByTestId('grade')).toContainText('Grade 3');
  await page.getByRole('button', { name: '‹ Back' }).click();

  await page.getByRole('button', { name: /^Fact fluency/ }).click();
  await expect(page.getByTestId('facts-mul').locator('td')).toHaveCount(100);
  await page.getByRole('button', { name: '‹ Back' }).click();

  await page.getByRole('button', { name: /^Teacher report/ }).click();
  const report = page.frameLocator('[data-testid="report-frame"]');
  await expect(report.getByText('Grade 3 ·')).toBeVisible();
  await expect(report.locator('tr[data-skill]')).toHaveCount(12);
  await expect(report.locator('td[data-fact]')).toHaveCount(200);
  const height = await page.evaluate(() => {
    const doc = (document.querySelector('iframe') as HTMLIFrameElement).contentDocument as Document;
    doc.body.style.width = '720px';
    return doc.body.scrollHeight;
  });
  expect(height).toBeLessThanOrEqual(960);
});

test('settings apply to the child and survive a reload', async ({ page }) => {
  await setUpChild(page);
  await grownUps(page);
  await page.getByRole('button', { name: /^Settings/ }).click();
  // Saved first and then shown, so each box is awaited before the next.
  for (const label of ['Left-handed', 'Reduce motion', 'Color-blind-safe colors']) {
    await page.getByLabel(label).click();
    await expect(page.getByLabel(label)).toBeChecked();
  }
  await page.getByRole('button', { name: '‹ Back' }).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'start quest' })).toBeVisible();
  const root = () => page.evaluate(() => ({ ...document.documentElement.dataset }));
  await expect.poll(root).toMatchObject({ hand: 'left', motion: 'reduced', palette: 'safe' });
  const sun = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-sun').trim(),
  );
  expect(sun).toBe('#f0e442');
});

test('left-handed moves the check mark to the left of the number pad', async ({ page }) => {
  await page.goto('http://localhost:5199/gallery.html?skill=2.add-within-100&type=number-pad');
  const position = async () => ({
    check: (await page.getByRole('button', { name: 'check' }).boundingBox())?.x ?? 0,
    erase: (await page.getByRole('button', { name: 'erase' }).boundingBox())?.x ?? 0,
  });
  const right = await position();
  expect(right.check).toBeGreaterThan(right.erase);
  await page.evaluate(() => (document.documentElement.dataset['hand'] = 'left'));
  const left = await position();
  expect(left.check).toBeLessThan(left.erase);
});

test('math time makes a daily calendar reminder', async ({ page }) => {
  await setUpChild(page);
  await grownUps(page);
  await page.getByRole('button', { name: /^Settings/ }).click();
  // WebKit's test build can't type into a time field, so this sets it as the picker would.
  await page.getByLabel('When is math time?').evaluate((input: HTMLInputElement) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    set?.call(input, '16:30');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const text = await readFile(await (await download).path(), 'utf8');
  expect(text).toContain('RRULE:FREQ=DAILY');
  expect(text).toMatch(/DTSTART:\d{8}T163000/);
});

for (const viewport of VIEWS) {
  test.describe(`free play at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    test('fits with 64px targets and can be scrolled by hand', async ({ page }) => {
      await setUpChild(page);
      await finishQuest(page);
      await openFree(page);
      const small = await page.evaluate(
        () =>
          [...document.querySelectorAll('main button')]
            .map((b) => b.getBoundingClientRect())
            .filter((box) => box.width < 63.5 || box.height < 63.5).length,
      );
      expect(small).toBe(0);
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect(sideways).toBe(false);
    });
  });
}
