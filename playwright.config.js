const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const logsDir = path.join(__dirname, 'tmp', 'playwright-logs');
const screenshotsDir = path.join(__dirname, 'tmp', 'playwright-screenshots');
const resultsDir = path.join(__dirname, 'tmp', 'playwright-test-results');
const reportDir = path.join(__dirname, 'tmp', 'playwright-report');

// Check if we're using PGLite (offline mode) or Neon (online mode)
const DB_MODE = process.env.DB_MODE || 'neon';
const isOfflineMode = DB_MODE === 'offline';

console.log(`Running tests in ${isOfflineMode ? 'OFFLINE (SQLite)' : 'ONLINE (PostgreSQL)'} mode using ${DB_MODE} database`);

[logsDir, screenshotsDir, resultsDir, reportDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Clean up and initialize log files
['api-requests.log', 'api-errors.log', 'console-errors.log', 'backend.log', 'stripe-webhook.log'].forEach(file => {
  const logFile = path.join(logsDir, file);
  fs.writeFileSync(logFile, `--- Log started at ${new Date().toISOString()} ---\n\n`, { flag: 'w' });
});

// Backend port - matches the port in vite.config.ts
const BACKEND_PORT = process.env.PORT || 8000;

// Check if we're in CI environment
const isCI = process.env.CI === 'true';
const skipStripeCLI = process.env.SKIP_STRIPE_CLI === 'true' || isCI;

// Check if Stripe CLI is available
function checkStripeCLI() {
  if (skipStripeCLI) {
    console.log('⏭️  Skipping Stripe CLI setup (CI environment or explicitly disabled)');
    return false;
  }

  try {
    execSync('stripe --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.warn('⚠️  Stripe CLI not found. Webhook testing will be limited.');
    console.warn('   Install Stripe CLI: https://stripe.com/docs/stripe-cli');
    return false;
  }
}

const hasStripeCLI = checkStripeCLI();

// Playwright Test configuration for root-level E2E tests.
// See: https://playwright.dev/docs/test-configuration
module.exports = defineConfig({
  testDir: './e2e',
  timeout: 120 * 1000,
  expect: { timeout: 30000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  maxFailures: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: reportDir }],
    ['json', { outputFile: path.join(resultsDir, 'test-results.json') }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    headless: true,
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Additional setup to handle sessionStorage for tests
    launchOptions: {
      args: ['--disable-web-security'] // Required to allow cross-origin access
    },
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
  webServer: [
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
          // Pass the database mode to the backend
          DB_MODE: DB_MODE,
          // For offline (SQLite), db/index.ts will use :memory:.
          // DATABASE_URL is not strictly needed by the server in offline mode if db/index.ts hardcodes :memory: for SQLite,
          // but doesn't hurt to keep it consistent with the push step if it were a file.
          DATABASE_URL: process.env.DATABASE_URL,
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
      },
      // Start Stripe CLI webhook listener (if available)
      ...(hasStripeCLI ? [{
        command: `stripe listen --forward-to localhost:${BACKEND_PORT}/api/webhooks/stripe --events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.created,charge.succeeded,charge.failed,invoice.payment_succeeded,invoice.payment_failed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted`,
        url: null, // No health check URL for Stripe CLI
        reuseExistingServer: false,
        timeout: 60000, // Increased timeout for Stripe CLI to start
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          ...process.env,
        },
        onStdOut: (chunk) => {
          const output = chunk.toString();
          console.log('Stripe CLI:', output);

          // Extract webhook secret from Stripe CLI output
          const secretMatch = output.match(/Your webhook signing secret is ([^ \n\r]+)/);
          if (secretMatch) {
            const webhookSecret = secretMatch[1];
            console.log('🔑 Stripe webhook secret captured:', webhookSecret.substring(0, 10) + '...');

            // Store the webhook secret for tests to use
            process.env.STRIPE_WEBHOOK_SECRET_TEST = webhookSecret;

            // Write to a file that tests can read
            try {
              fs.writeFileSync(
                path.join(__dirname, 'tmp', 'stripe-webhook-secret.txt'),
                webhookSecret
              );
              console.log('📝 Webhook secret saved to file');
            } catch (e) {
              console.error('Failed to write webhook secret:', e);
            }
          }

          // Log webhook events for debugging
          if (output.includes('payment_intent.') || output.includes('charge.') || output.includes('invoice.')) {
            console.log('🎯 Stripe webhook event received:', output.trim());
          }

          try {
            fs.appendFileSync(path.join(logsDir, 'stripe-webhook.log'), output);
          } catch (e) {
            console.error('Failed to write Stripe log:', e);
          }
        },
        onStdErr: (chunk) => {
          const error = chunk.toString();
          console.error('Stripe CLI Error:', error);
          try {
            fs.appendFileSync(path.join(logsDir, 'stripe-webhook.log'), `ERROR: ${error}`);
          } catch (e) {
            console.error('Failed to write Stripe error log:', e);
          }
        }
      }] : [])
    ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  // Global setup to capture request/response logging
  globalSetup: './e2e/global-setup.js',
});