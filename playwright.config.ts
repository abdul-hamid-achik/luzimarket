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
const port = String(process.env.PORT || '3000');
const includeAdditionalBrowsers = isCi ? process.env.CI_ALL_BROWSERS === '1' : false;
const workersCount = isCi ? Number(process.env.PW_WORKERS || '2') : undefined;

// Pass threshold configuration - allow CI to pass with 95% of tests passing
const passThreshold = Number(process.env.PLAYWRIGHT_PASS_THRESHOLD || '95');

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
  
  /* Pass threshold: CI will pass if ${passThreshold}% of tests pass
   * Use e2e/scripts/check-pass-threshold.js to validate results
   * Set PLAYWRIGHT_PASS_THRESHOLD env var to override (default: 95)
   */
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
    baseURL: `http://localhost:${port}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Increase timeouts for slower operations */
    navigationTimeout: 10_000,
    actionTimeout: isCi ? 10_000 : 5_000,

    /* Browser context options - moved to per-browser configuration */
  },

  /* Global timeout for tests */
  timeout: isCi ? 60_000 : 30_000,

  /* Timeout for each test expect() call */
  expect: {
    timeout: isCi ? 10_000 : 5_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chromium supports clipboard permissions
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write'],
          bypassCSP: true,
        },
      },
    },

    // Additional browsers enabled in CI only when CI_ALL_BROWSERS=1
    ...(includeAdditionalBrowsers ? [
      {
        name: 'firefox',
        use: {
          ...devices['Desktop Firefox'],
          // Firefox doesn't support clipboard permissions in the same way
          contextOptions: {
            bypassCSP: true,
          },
        },
      },

      {
        name: 'webkit',
        use: {
          ...devices['Desktop Safari'],
          // Safari/webkit doesn't support clipboard permissions in the same way
          contextOptions: {
            bypassCSP: true,
          },
        },
      },

      /* Test against mobile viewports. */
      {
        name: 'Mobile Chrome',
        use: {
          ...devices['Pixel 5'],
          // Mobile Chrome supports clipboard permissions
          contextOptions: {
            permissions: ['clipboard-read', 'clipboard-write'],
            bypassCSP: true,
          },
        },
      },
      {
        name: 'Mobile Safari',
        use: {
          ...devices['iPhone 12'],
          // Mobile Safari doesn't support clipboard permissions in the same way
          contextOptions: {
            bypassCSP: true,
          },
        },
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

  webServer: isCi
    ? {
      command: 'npm run build && npm run start',
      url: `http://localhost:${port}`,
      reuseExistingServer: true,
      timeout: 180 * 1000,
      env: {
        PORT: port,
        NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
        NEXTAUTH_URL: `http://localhost:${port}`,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test_e2e_secret',
        AUTH_URL: `http://localhost:${port}`,
        AUTH_TRUST_HOST: 'true',
      },
    }
    : {
      command: 'npm run dev',
      url: `http://localhost:${port}`,
      reuseExistingServer: true,
      timeout: 180 * 1000,
      env: {
        PORT: port,
        NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
        NEXTAUTH_URL: `http://localhost:${port}`,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test_e2e_secret',
        AUTH_URL: `http://localhost:${port}`,
        AUTH_TRUST_HOST: 'true',
        NEXT_DISABLE_DEV_OVERLAY: '1',
      },
    },
});