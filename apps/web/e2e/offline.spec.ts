import { expect, test } from '@playwright/test';

test('installable shell loads, then reloads offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Math Quest' })).toBeVisible();

  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).display).toBe('standalone');

  // Wait until the service worker owns the page, so the offline reload is a real test.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      );
    }
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Math Quest' })).toBeVisible();
});
