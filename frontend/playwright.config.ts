import { defineConfig, devices } from '@playwright/test';

/**
 * Headless e2e config. Runs against a full running stack (Next frontend +
 * Express backend + MongoDB). Point E2E_BASE_URL at the deployed app to run
 * against Render instead of localhost.
 *
 *   npx playwright install   # one-time: download the browser
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
