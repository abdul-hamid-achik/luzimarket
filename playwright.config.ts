import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Read from ".env.local" file.
dotenv.config({ path: path.resolve(__dirname, '.env.local') });


/**
 * See https://playwright.dev/docs/test-configuration.
 */
const isCi = !!process.env.CI;
const includeAdditionalBrowsers = isCi ? process.env.CI_ALL_BROWSERS === '1' : false;
const workersCount = isCi ? Number(process.env.PW_WORKERS || '2') : undefined;

// Always enable JSON and JUnit reporters with defaults under tmp/
const tmpDir = path.resolve(__dirname, 'tmp');
try {
  fs.mkdirSync(tmpDir, { recursive: true });
} catch {
  // best-effort
}
const jsonOutput = process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || path.join(tmpDir, 'test-results.json');
const junitOutput = process.env.PLAYWRIGHT_JUNIT_OUTPUT_NAME || path.join(tmpDir, 'junit-results.xml');
const junitStripAnsi = String(process.env.PLAYWRIGHT_JUNIT_STRIP_ANSI ?? 'true').toLowerCase() === 'true';

const reporters: ReporterDescription[] = [
  ['list'],
  ['json', { outputFile: jsonOutput }],
  ['junit', { outputFile: junitOutput, stripANSI: junitStripAnsi }],
];

export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: isCi ? 2 : 0,
  /* Control workers in CI via PW_WORKERS (default 2). */
  workers: workersCount,
  /* Reporter to use. Avoid HTML by default so tests don't open a report server */
  reporter: reporters,
  /* Run global setup to prepare DB/test data */
  globalSetup: './e2e/global.setup.ts',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // Force localhost for tests to avoid hitting production/staging URLs by mistake
    // Keep in sync with webServer.url below to avoid navigation to wrong port
    baseURL: `http://localhost:${process.env.PORT || '3000'}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Increase timeouts for slower operations */
    navigationTimeout: 60000,
    actionTimeout: 30000,

    /* Browser context options */
    contextOptions: {
      // Grant permissions that tests might need
      permissions: ['clipboard-read', 'clipboard-write'],
      // Bypass CSP for tests
      bypassCSP: true,
    },
  },

  /* Global timeout for tests */
  timeout: 60000,

  /* Timeout for each test expect() call */
  expect: {
    timeout: 15000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Additional browsers enabled in CI only when CI_ALL_BROWSERS=1
    ...(includeAdditionalBrowsers ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },

      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },

      /* Test against mobile viewports. */
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 12'] },
      },
    ] : []),

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before running tests:
   * npm run dev
   * 
   * Then run tests:
   * npm test
   */

  webServer: {
    command: 'sh -c "npm run build && npm run start"',
    url: `http://localhost:${process.env.PORT || '3000'}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    env: {
      NEXT_PUBLIC_APP_URL: `http://localhost:${process.env.PORT || '3000'}`,
      NEXTAUTH_URL: `http://localhost:${process.env.PORT || '3000'}`,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test_e2e_secret',
      AUTH_URL: `http://localhost:${process.env.PORT || '3000'}`,
      AUTH_TRUST_HOST: 'true',
    },
  },
});