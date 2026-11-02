import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4173', ...devices['iPhone 15'] },
  projects: [{ name: 'iphone-webkit', use: { browserName: 'webkit' } }],
  webServer: [
    {
      command: 'npm run build && npm run preview',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // The question gallery exists only in dev; layout tests run against it.
      command: 'npx vite --port 5199 --strictPort',
      url: 'http://localhost:5199/gallery.html',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
