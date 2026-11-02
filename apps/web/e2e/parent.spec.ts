import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  openChests,
  patchRow,
  playUntilBreak,
  said,
  setUpChild,
  stubSpeech,
  waitForServiceWorker,
} from './helpers';

const PIN = ['1', '2', '3', '4'];

async function tapPin(page: Page, digits: string[]) {
  const pad = page.getByTestId('pin-pad');
  for (const digit of digits) await pad.getByRole('button', { name: digit, exact: true }).click();
}

/** Answers the grown-up question shown on screen, then sets the PIN. */
async function createPin(page: Page) {
  const question = await page.getByText(/What is \d+ × \d+\?/).textContent();
  const [, a, b] = /(\d+) × (\d+)/.exec(question ?? '') as RegExpExecArray;
  await tapPin(page, String(Number(a) * Number(b)).split(''));
  await expect(page.getByRole('heading', { name: 'Make a 4-digit PIN' })).toBeVisible();
  await tapPin(page, PIN);
  await expect(page.getByRole('heading', { name: 'Enter it again' })).toBeVisible();
  await tapPin(page, PIN);
}

async function openGate(page: Page) {
  await page.getByRole('button', { name: 'Sam' }).click();
  await page.getByRole('button', { name: 'grown-ups' }).click();
}

async function openDashboard(page: Page) {
  await openGate(page);
  await createPin(page);
  await expect(page.getByTestId('parent')).toBeVisible();
}

const leave = (page: Page) => page.getByRole('button', { name: 'Done' }).click();

async function finishQuest(page: Page) {
  await page.getByRole('button', { name: 'start quest' }).click();
  await playUntilBreak(page);
  const skip = page.getByRole('button', { name: 'skip' });
  if (await skip.isVisible()) await skip.click();
  await expect(page.getByTestId('celebrate')).toBeVisible();
  await openChests(page);
  await page.getByRole('button', { name: 'home' }).click();
}

test.beforeEach(async ({ page }) => {
  await stubSpeech(page);
});

test('the PIN keeps a child out and stays locked on return', async ({ page }) => {
  await setUpChild(page);
  await openDashboard(page);
  await leave(page);
  await expect(page.getByRole('button', { name: 'start quest' })).toBeVisible();

  await openGate(page);
  await tapPin(page, ['9', '9', '9', '9']);
  await expect(page.getByRole('alert')).toContainText('not right');
  await expect(page.getByTestId('parent')).toHaveCount(0);
  await tapPin(page, PIN);
  await expect(page.getByTestId('parent')).toBeVisible();
});

test('a forgotten PIN can be replaced and costs no progress', async ({ page }) => {
  await setUpChild(page);
  await openDashboard(page);
  await leave(page);
  await openGate(page);
  await page.getByRole('button', { name: 'Forgot the PIN?' }).click();
  await createPin(page);
  await expect(page.getByTestId('parent')).toBeVisible();
  await expect(page.getByTestId('today')).toContainText('Sam');
});

test('progress from a real quest reaches every dashboard view', async ({ page }) => {
  await setUpChild(page);
  await finishQuest(page);
  await openDashboard(page);

  await expect(page.getByTestId('today')).toContainText('Daily quest done');
  await expect(page.getByTestId('recap')).toContainText('This week');
  await expect(page.getByTestId('streak-card')).toContainText('Now 1 day');

  await page.getByRole('button', { name: /^Skills/ }).click();
  await expect(page.getByTestId('skill-list').locator('li')).toHaveCount(14);
  await expect(page.getByTestId('skill-list')).toContainText('%');
  await page.getByRole('button', { name: '‹ Back' }).click();

  await page.getByRole('button', { name: /^Fact fluency/ }).click();
  await expect(page.getByTestId('facts-add').locator('td')).toHaveCount(121);
  await expect(page.getByTestId('facts-sub').locator('td')).toHaveCount(121);
  await expect(page.locator('td[data-heat="unseen"]').first()).toBeVisible();
});

test('a grown-up gives a shield and the child sees it', async ({ page }) => {
  await setUpChild(page);
  await openDashboard(page);
  await page.getByRole('button', { name: 'Give a shield' }).click();
  await expect(page.getByTestId('streak-card')).toContainText('Shields: 1 of 2');
  await leave(page);
  await expect(page.getByTestId('shields')).toContainText('1');
});

test('a real-world goal shows as a bar, moves with quests, and can be delivered', async ({
  page,
}) => {
  await setUpChild(page);
  await openDashboard(page);
  await page.getByRole('button', { name: /^Goals & cheers/ }).click();
  await page.getByLabel('Reward').fill('movie night');
  await page.getByLabel('Finish').fill('1');
  await page.getByRole('button', { name: 'Set goal' }).click();
  await expect(page.getByTestId('current-goal')).toContainText('movie night');
  await page.getByRole('button', { name: '‹ Back' }).click();
  await leave(page);

  await expect(page.getByTestId('goal')).toContainText('0/1');
  await page.getByTestId('goal').click();
  await expect.poll(() => said(page)).toContainEqual(expect.stringContaining('movie night'));
  await finishQuest(page);
  await expect(page.getByTestId('goal')).toHaveAttribute('data-reached', 'true');

  await page.reload();
  await expect(page.getByTestId('goal')).toHaveAttribute('data-reached', 'true');

  await page.getByRole('button', { name: 'Sam' }).click();
  await page.getByRole('button', { name: 'grown-ups' }).click();
  await tapPin(page, PIN);
  await page.getByRole('button', { name: /^Goals & cheers/ }).click();
  await page.getByRole('button', { name: /Mark as delivered/ }).click();
  await expect(page.getByTestId('past-goals')).toContainText('delivered');
  await page.getByRole('button', { name: '‹ Back' }).click();
  await leave(page);
  await expect(page.getByTestId('goal')).toHaveCount(0);
});

test('a cheer plays before the next quest, once', async ({ page }) => {
  await setUpChild(page);
  await openDashboard(page);
  await page.getByRole('button', { name: /^Goals & cheers/ }).click();
  await page.getByRole('button', { name: 'send 🚀' }).click();
  await expect(page.getByTestId('cheers-waiting')).toContainText('🚀');
  await page.getByRole('button', { name: '‹ Back' }).click();
  await leave(page);

  await page.reload();
  await page.getByRole('button', { name: 'start quest' }).click();
  await expect(page.getByTestId('cheer')).toContainText('🚀');
  await expect.poll(() => said(page)).toContainEqual('A cheer from your grown-up!');
  await page.getByRole('button', { name: 'next' }).click();
  await expect(page.getByRole('button', { name: 'go', exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'keep going' }).click();
  await expect(page.getByTestId('cheer')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'go', exact: true })).toBeVisible();
});

test('a recorded cheer is sent and played from the start tap', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecorder {
      state = 'inactive';
      mimeType = 'audio/mp4';
      ondataavailable?: (e: { data: Blob }) => void;
      onstop?: () => void;
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/mp4' }) });
        this.onstop?.();
      }
    }
    Object.assign(window, { MediaRecorder: FakeRecorder });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: async () => ({ getTracks: () => [] }) },
    });
    const played: string[] = [];
    Object.assign(window, { __played: played });
    HTMLMediaElement.prototype.play = function play() {
      played.push(this.src);
      return Promise.resolve();
    };
  });
  await setUpChild(page);
  await openDashboard(page);
  await page.getByRole('button', { name: /^Goals & cheers/ }).click();
  await page.getByRole('button', { name: 'Record a message' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByTestId('cheers-waiting')).toContainText('Voice message');
  await page.getByRole('button', { name: '‹ Back' }).click();
  await leave(page);

  await page.getByRole('button', { name: 'start quest' }).click();
  await expect(page.getByTestId('cheer')).toHaveAttribute('data-kind', 'voice');
  const played = await page.evaluate(
    () => (window as unknown as { __played: string[] }).__played.length,
  );
  expect(played).toBe(1);
});

test('a second child gets their own profile, and siblings pick by picture', async ({ page }) => {
  await setUpChild(page);
  await openDashboard(page);
  await page.getByRole('button', { name: /^Children/ }).click();
  await page.getByTestId('add-child').getByLabel('Name').fill('Kim');
  await expect(
    page.getByTestId('add-child').getByRole('button', { name: 'picture 🦊' }),
  ).toBeDisabled();
  await page.getByTestId('add-child').getByRole('button', { name: 'picture 🐼' }).click();
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByRole('button', { name: /🐼 Kim/ })).toBeVisible();
  await page.getByRole('button', { name: '‹ Back' }).click();
  await leave(page);

  await expect(page.getByTestId('who')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Kim' }).click();
  await expect(page.getByRole('button', { name: 'start warm-up' })).toBeVisible();
});

test('erasing needs the child name and sends them back to placement', async ({ page }) => {
  await setUpChild(page);
  await finishQuest(page);
  await openDashboard(page);
  await page.getByRole('button', { name: /^Children/ }).click();
  const erase = page.getByRole('button', { name: 'Erase progress' });
  await expect(erase).toBeDisabled();
  await page.getByLabel("Type the child's name").fill('sam');
  await erase.click();
  await page.getByRole('button', { name: '‹ Back' }).click();
  await leave(page);
  await expect(page.getByRole('button', { name: 'start warm-up' })).toBeVisible();
});

test('the teacher report fits one page and carries real numbers', async ({ page }) => {
  await setUpChild(page);
  await finishQuest(page);
  await openDashboard(page);
  await page.getByRole('button', { name: /^Teacher report/ }).click();
  const report = page.frameLocator('[data-testid="report-frame"]');
  await expect(report.getByRole('heading', { name: 'Sam: math progress' })).toBeVisible();
  await expect(report.getByTestId('report-stats')).toContainText('Daily quests');
  await expect(report.locator('tr[data-skill]')).toHaveCount(14);
  await expect(report.locator('td[data-fact]')).toHaveCount(242);
  await expect(report.locator('.day')).toHaveCount(30);
  await expect(report.locator('.day.quest')).toHaveCount(1);

  // Letter minus half-inch margins: 720px wide leaves 960px, and A4 is narrower but taller.
  const height = await page.evaluate(() => {
    const frame = document.querySelector('iframe') as HTMLIFrameElement;
    const doc = frame.contentDocument as Document;
    doc.body.style.width = '720px';
    return doc.body.scrollHeight;
  });
  expect(height).toBeLessThanOrEqual(960);
});

test('an iPhone-style share sheet saves the backup, and cancelling does not count', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const shared: string[] = [];
    let cancel = true;
    Object.assign(window, { __shared: shared });
    Object.assign(navigator, {
      canShare: () => true,
      share: async ({ files }: { files: File[] }) => {
        if (cancel) {
          cancel = false;
          throw new DOMException('cancelled', 'AbortError');
        }
        shared.push((files[0] as File).name);
      },
    });
  });
  await setUpChild(page);
  await openDashboard(page);
  await page.getByRole('button', { name: /^Backup/ }).click();
  await page.getByRole('button', { name: 'Save backup' }).click();
  await expect(page.getByTestId('backup')).toContainText('No backup saved yet');
  await expect(page.getByTestId('backup')).not.toContainText('Backup saved.');
  await page.getByRole('button', { name: 'Save backup' }).click();
  await expect(page.getByTestId('backup')).toContainText('Backup saved.');
  await expect(page.getByTestId('backup')).toContainText('Last saved');
  const shared = await page.evaluate(() => (window as unknown as { __shared: string[] }).__shared);
  expect(shared[0]).toMatch(/^math-quest-backup-.*\.json$/);
});

test('backup and restore bring progress back, and a bad file changes nothing', async ({ page }) => {
  await page.addInitScript(() => Object.assign(navigator, { canShare: undefined }));
  await setUpChild(page);
  await finishQuest(page);
  await openDashboard(page);
  await page.getByRole('button', { name: /^Backup/ }).click();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save backup' }).click();
  const file = await (await download).path();
  await expect(page.getByTestId('backup')).toContainText('Backup saved');
  const text = await readFile(file, 'utf8');
  expect(text).toContain('math-quest-backup');
  expect(text).not.toContain('pinHash');

  await page.getByLabel('Choose a backup file').setInputFiles({
    name: 'nope.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"format":"something else"}'),
  });
  await expect(page.getByTestId('restore').getByRole('alert')).toContainText("isn't a backup");

  await page.getByRole('button', { name: '‹ Back' }).click();
  await leave(page);
  const coinsBefore = await page.getByTestId('coins').textContent();
  await patchRow(page, 'wallets', { coins: 0 });
  await patchRow(page, 'streaks', { current: 0 });
  await page.reload();
  await expect(page.getByTestId('coins')).toContainText('0');

  await page.getByRole('button', { name: 'Sam' }).click();
  await page.getByRole('button', { name: 'grown-ups' }).click();
  await tapPin(page, PIN);
  await page.getByRole('button', { name: /^Backup/ }).click();
  await page.getByLabel('Choose a backup file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  });
  await expect(page.getByTestId('restore-confirm')).toContainText('Sam');
  await page.getByRole('button', { name: 'Replace and restore' }).click();
  await expect(page.getByTestId('restore')).toContainText('Restored');
  await page.getByRole('button', { name: '‹ Back' }).click();
  await leave(page);
  await expect(page.getByTestId('coins')).toHaveText(coinsBefore as string);
  await expect(page.getByTestId('streak')).toContainText('1');
});

test('the dashboard opens offline, including on the first visit to it', async ({
  page,
  context,
}) => {
  await setUpChild(page);
  await waitForServiceWorker(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sam' })).toBeVisible();
  await openDashboard(page);
  await page.getByRole('button', { name: /^Teacher report/ }).click();
  await expect(page.getByTestId('report-frame')).toBeVisible();
});

test.describe('every parent page fits a small phone', () => {
  test.use({ viewport: { width: 320, height: 568 } });
  test('without sideways scrolling', async ({ page }) => {
    await setUpChild(page);
    await openDashboard(page);
    const fits = () =>
      page.evaluate(() => {
        const scroller = document.querySelector('.parent') as HTMLElement;
        return scroller.scrollWidth <= scroller.clientWidth;
      });
    expect(await fits()).toBe(true);
    for (const name of [
      /^Skills/,
      /^Fact fluency/,
      /^Goals & cheers/,
      /^Teacher report/,
      /^Children/,
      /^Backup/,
    ]) {
      await page.getByRole('button', { name }).click();
      await expect(page.getByRole('button', { name: '‹ Back' })).toBeVisible();
      expect(await fits(), String(name)).toBe(true);
      await page.getByRole('button', { name: '‹ Back' }).click();
    }
  });
});
