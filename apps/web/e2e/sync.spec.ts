import { devices, expect, test, type BrowserContext, type Page } from '@playwright/test';
import { createApi } from '@mathapp/worker/api';
import { memoryDb } from '@mathapp/worker/testing';
import { finishQuest, openDashboard, setUpChild, stubSpeech } from './helpers';

const BASE = 'http://localhost:4173';
const EMAIL = 'parent@example.com';
const PASS = 'purple elephant pancakes';

/**
 * The real sync Worker runs here in the test process, and every /api request from either
 * phone goes to it. Service workers are blocked so the route sees each request.
 */
function server() {
  const codes: string[] = [];
  const handle = createApi({
    db: memoryDb(),
    mail: async (email) => void codes.push(/(\d{6})/.exec(email.subject)?.[1] ?? ''),
    now: Date.now,
  });
  const connect = (context: BrowserContext) =>
    context.route('**/api/**', async (route) => {
      const request = route.request();
      const body = request.postDataBuffer();
      const response = await handle(
        new Request(request.url(), {
          method: request.method(),
          headers: await request.allHeaders(),
          ...(body ? { body: new Uint8Array(body) } : {}),
        }),
      );
      await route.fulfill({
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: Buffer.from(await response.arrayBuffer()),
      });
    });
  return { connect, lastCode: () => codes.at(-1) ?? '' };
}

async function signIn(page: Page, lastCode: () => string) {
  const panel = page.getByTestId('sync');
  await panel.getByLabel('Your email').fill(EMAIL);
  await panel.getByRole('button', { name: 'Email me a code' }).click();
  await expect(panel).toContainText(`sent a 6-digit code to ${EMAIL}`);
  await panel.getByLabel('Code').fill(lastCode());
  await panel.getByRole('button', { name: 'Sign in' }).click();
}

test.use({ serviceWorkers: 'block' });

test('a second phone signs in and gets the same progress', async ({ page, context, browser }) => {
  test.setTimeout(120_000);
  const cloud = server();
  await cloud.connect(context);
  await stubSpeech(page);
  await setUpChild(page);
  await finishQuest(page);
  await expect(page.getByTestId('streak')).toContainText('1');

  await openDashboard(page);
  await page.getByRole('button', { name: /^Sync & weekly email/ }).click();
  await signIn(page, cloud.lastCode);
  await page.getByLabel('Sync passphrase').fill(PASS);
  await page.getByLabel('Type it again').fill(PASS);
  await page.getByRole('button', { name: 'Turn on sync' }).click();
  await expect(page.getByTestId('sync-status')).toContainText(`Syncing as ${EMAIL}`, {
    timeout: 20_000,
  });
  await page.getByLabel('Weekly email').click();
  await expect(page.getByLabel('Weekly email')).toBeChecked();

  const phone = await browser.newContext({
    ...devices['iPhone 15'],
    baseURL: BASE,
    serviceWorkers: 'block',
  });
  await cloud.connect(phone);
  const fresh = await phone.newPage();
  await stubSpeech(fresh);
  await fresh.goto('/');
  await fresh.getByRole('button', { name: 'Continue in Safari for now' }).click();
  await fresh.getByRole('button', { name: /Moving from another device/ }).click();
  await signIn(fresh, cloud.lastCode);
  await fresh.getByLabel('Sync passphrase').fill('not the passphrase');
  await fresh.getByRole('button', { name: 'Unlock and sync' }).click();
  await expect(fresh.getByRole('alert')).toContainText("doesn't open");
  await fresh.getByLabel('Sync passphrase').fill(PASS);
  await fresh.getByRole('button', { name: 'Unlock and sync' }).click();

  // The same child, with the quest already done today and its streak.
  await expect(fresh.getByTestId('streak')).toContainText('1', { timeout: 20_000 });
  await expect(fresh.getByRole('button', { name: 'Sam' })).toBeVisible();
  await phone.close();
});

test('sync says so when the server has no email set up', async ({ page }) => {
  await page.route('**/api/health', (route) => route.fulfill({ json: { ok: true, email: false } }));
  await stubSpeech(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue in Safari for now' }).click();
  await page.getByRole('button', { name: /Moving from another device/ }).click();
  await expect(page.getByTestId('sync')).toContainText("isn't set up on this server");
  // Restoring from a file still works without it.
  await expect(page.getByTestId('restore')).toBeVisible();
});
