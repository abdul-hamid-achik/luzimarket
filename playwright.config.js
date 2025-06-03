const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');

// Generate session-specific directories under test-results
const generateSessionDirectories = () => {
  const sessionId = process.env.PLAYWRIGHT_SESSION_ID || crypto.randomUUID().substring(0, 8);

  // Store session ID for other processes
  process.env.PLAYWRIGHT_SESSION_ID = sessionId;

  // Create test-results/test-session-{uuid} structure
  const sessionDir = path.join(__dirname, 'tmp', 'test-results', `test-session-${sessionId}`);

  return {
    sessionDir,
    sessionId,
    logsDir: path.join(sessionDir, 'logs'),
    screenshotsDir: path.join(sessionDir, 'screenshots'),
    resultsDir: path.join(sessionDir, 'results'),
    reportDir: path.join(sessionDir, 'report')
  };
};

const { sessionDir, sessionId, logsDir, screenshotsDir, resultsDir, reportDir } = generateSessionDirectories();

console.log('Running tests in (PostgreSQL) using Neon database');
console.log(`🗂️ Test session: ${sessionId}`);
console.log(`📁 Session directory: ${sessionDir}`);

// Create all session directories
[sessionDir, logsDir, screenshotsDir, resultsDir, reportDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Clean up and initialize log files with session info
const logFiles = ['api-requests.log', 'api-errors.log', 'console-errors.log', 'backend.log', 'frontend.log', 'stripe-webhook.log'];
logFiles.forEach(file => {
  const logFile = path.join(logsDir, file);
  const header = `--- Test Session ${sessionId} Log started at ${new Date().toISOString()} ---\n` +
    `--- Session Directory: ${sessionDir} ---\n\n`;
  fs.writeFileSync(logFile, header, { flag: 'w' });
  console.log(`📝 Initialized log: ${file}`);
});

// Helper function to append logs safely
const appendLog = (filename, content) => {
  try {
    const logFile = path.join(logsDir, filename);
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${content}\n`);
  } catch (error) {
    console.error(`Failed to write to ${filename}:`, error);
  }
};

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
  workers: process.env.CI ? parseInt(process.env.PLAYWRIGHT_WORKERS || '2', 10) : 5, // Use single worker locally for easier debugging
  maxFailures: process.env.CI ? 10 : 100,  // Allow more failures in CI due to parallel execution
  reporter: [
    // Use line reporter for more detailed CI output, list for local dev
    [process.env.CI ? 'line' : 'list'],
    ['html', { open: 'never', outputFolder: reportDir }],
    ['json', { outputFile: path.join(resultsDir, 'test-results.json') }],
    // Add GitHub reporter for better CI integration  
    ...(process.env.CI ? [['github']] : [])
  ],
  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    headless: true,
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Save screenshots to the designated folder with timestamp
    screenshotPath: (testInfo) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return path.join(screenshotsDir, `${testInfo.title}-${timestamp}.png`);
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
        LOG_LEVEL: 'info',
        // Ensure consistent JWT secret for e2e tests
        JWT_SECRET: 'test-jwt-secret-for-e2e-tests',
        // Enable verbose API logging for debugging
        DEBUG: process.env.DEBUG || 'pw:api',
      },
      onStdOut: (chunk) => {
        const output = chunk.toString().trim();
        if (output) {
          console.log('Backend:', output);
          appendLog('backend.log', `STDOUT: ${output}`);
        }
      },
      onStdErr: (chunk) => {
        const output = chunk.toString().trim();
        if (output) {
          console.error('Backend Error:', output);
          appendLog('backend.log', `STDERR: ${output}`);
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
        // Ensure consistent JWT secret for e2e tests (for consistency)
        JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests',
        DEBUG: process.env.DEBUG || 'vite:*',
      },
      onStdOut: (chunk) => {
        const output = chunk.toString().trim();
        if (output) {
          console.log('Frontend:', output);
          appendLog('frontend.log', `STDOUT: ${output}`);
        }
      },
      onStdErr: (chunk) => {
        const output = chunk.toString().trim();
        if (output) {
          console.error('Frontend Error:', output);
          appendLog('frontend.log', `STDERR: ${output}`);
        }
      }
    },
    // Start Stripe CLI webhook listener (if available)
    ...(hasStripeCLI ? [{
      command: `stripe listen --forward-to localhost:${BACKEND_PORT}/api/webhooks/stripe --events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.created,charge.succeeded,charge.failed,invoice.payment_succeeded,invoice.payment_failed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted`,
      url: `http://localhost:${BACKEND_PORT}/api/webhooks/stripe`,
      reuseExistingServer: false,
      timeout: 30000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        STRIPE_WEBHOOK_SECRET: 'whsec_test_secret_for_e2e_tests'
      },
      onStdOut: (chunk) => {
        const output = chunk.toString().trim();
        if (output) {
          console.log('Stripe CLI:', output);
          appendLog('stripe-webhook.log', `STDOUT: ${output}`);

          // Extract webhook secret from Stripe CLI output
          const secretMatch = output.match(/whsec_[a-zA-Z0-9]+/);
          if (secretMatch) {
            const webhookSecret = secretMatch[0];
            const secretFile = path.join(sessionDir, 'stripe-webhook-secret.txt');
            fs.writeFileSync(secretFile, webhookSecret);
            console.log(`🔑 Stripe webhook secret saved: ${webhookSecret.substring(0, 20)}...`);
          }
        }
      },
      onStdErr: (chunk) => {
        const output = chunk.toString().trim();
        if (output && !output.includes('Ready!')) {
          console.error('Stripe CLI Error:', output);
          appendLog('stripe-webhook.log', `STDERR: ${output}`);
        }
      }
    }] : [])
  ],
  globalSetup: require.resolve('./e2e/global-setup.js'),
  globalTeardown: require.resolve('./e2e/global-teardown.js'),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});