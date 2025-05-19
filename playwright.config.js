const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, 'tmp', 'playwright-logs');
const screenshotsDir = path.join(__dirname, 'tmp', 'playwright-screenshots');
const resultsDir = path.join(__dirname, 'tmp', 'playwright-test-results');

[logsDir, screenshotsDir, resultsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Clean up and initialize log files
['api-requests.log', 'api-errors.log', 'console-errors.log', 'backend.log'].forEach(file => {
  const logFile = path.join(logsDir, file);
  fs.writeFileSync(logFile, `--- Log started at ${new Date().toISOString()} ---\n\n`, { flag: 'w' });
});

// Backend port - matches the port in vite.config.ts
const BACKEND_PORT = process.env.PORT || 8000;

// Playwright Test configuration for root-level E2E tests.
// See: https://playwright.dev/docs/test-configuration
module.exports = defineConfig({
  testDir: './e2e',
  timeout: 120 * 1000,
  expect: { timeout: 30000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: path.join(resultsDir, 'test-results.json') }]
  ],
  maxFailures: 1,
  use: {
    // Use a precomputed storage state for auth to skip UI login
    storageState: 'tmp/storageState.json',
    baseURL: 'http://localhost:5173',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    headless: process.env.CI ? true : false,
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Save screenshots to the designated folder with timestamp
    screenshotPath: (testInfo) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return path.join(screenshotsDir, `${testInfo.title}-${timestamp}.png`);
    },
    // Additional context for debugging
    contextOptions: {
      logger: {
        isEnabled: (name) => true,
        log: (name, severity, message) => {
          console.log(`${name} [${severity}]: ${message}`);
          if (severity === 'error' || severity === 'warning') {
            try {
              fs.appendFileSync(
                path.join(logsDir, 'console-errors.log'),
                `${new Date().toISOString()} [${severity}]: ${message}\n`
              );
            } catch (e) {
              console.error('Failed to write to log file:', e);
            }
          }
        }
      }
    }
  },
  webServer: process.env.CI
    ? undefined
    : [
      // Start backend server
      {
        command: `npm run dev:backend`,
        url: `http://localhost:${BACKEND_PORT}/api/health`,
        reuseExistingServer: true,
        timeout: 120000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          ...process.env,
          PORT: BACKEND_PORT,
          NODE_ENV: 'test',
          LOG_LEVEL: 'debug',
          DEBUG: 'app:*,api:*',
        },
        onStdOut: (chunk) => {
          console.log('Backend:', chunk.toString());
          try {
            fs.appendFileSync(path.join(logsDir, 'backend.log'), chunk.toString());
          } catch (e) {
            console.error('Failed to write backend log:', e);
          }
        },
        onStdErr: (chunk) => {
          console.error('Backend Error:', chunk.toString());
          try {
            fs.appendFileSync(path.join(logsDir, 'backend.log'), `ERROR: ${chunk.toString()}`);
          } catch (e) {
            console.error('Failed to write backend error log:', e);
          }
        }
      },
      // Start frontend server
      {
        command: 'npm run dev:frontend',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 120000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          VITE_API_URL: `http://localhost:${BACKEND_PORT}`,
          DEBUG: 'app:*,api:*',
        }
      }
    ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  // Global setup to capture request/response logging
  globalSetup: './e2e/global-setup.js',
});