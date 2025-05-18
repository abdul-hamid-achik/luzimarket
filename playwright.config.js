const { defineConfig, devices } = require('@playwright/test');

// Playwright Test configuration for root-level E2E tests.
// See: https://playwright.dev/docs/test-configuration
module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  maxFailures: 1,
  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 0,
    headless: true,
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  webServer: process.env.CI
    ? undefined
    : {
      command: 'npm run migrate:up && npm run seed && concurrently --kill-others --raw "npm --workspace=apps/backend run dev" "npm --workspace=apps/frontend run dev"',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});