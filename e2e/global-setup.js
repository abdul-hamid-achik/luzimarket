const { chromium, firefox, webkit } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get session-specific directories using new test-results structure
const getSessionDirectories = () => {
    const sessionId = process.env.PLAYWRIGHT_SESSION_ID;
    if (!sessionId) {
        throw new Error('PLAYWRIGHT_SESSION_ID not found. Session should be initialized in playwright.config.js');
    }

    const sessionDir = path.join(__dirname, '..', 'tmp', 'test-results', `test-session-${sessionId}`);

    return {
        sessionDir,
        sessionId,
        logsDir: path.join(sessionDir, 'logs'),
        screenshotsDir: path.join(sessionDir, 'screenshots')
    };
};

const { sessionDir, sessionId, logsDir, screenshotsDir } = getSessionDirectories();

// Check if Stripe CLI is available
const isCI = process.env.CI === 'true';
const skipStripeCLI = process.env.SKIP_STRIPE_CLI === 'true' || isCI;
const hasStripeCLI = !skipStripeCLI;

console.log('Global setup running in ONLINE (PostgreSQL) mode');

// Ensure directories exist
[logsDir, screenshotsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Helper to log API requests to session directory
function logApiRequest(request, info = {}) {
    try {
        const logFile = path.join(logsDir, 'api-requests.log');
        const timestamp = new Date().toISOString();
        const url = request.url();
        const method = request.method();

        // Create log entry
        const logEntry = `[${timestamp}] ${method} ${url} | ${JSON.stringify(info)}`;
        fs.appendFileSync(logFile, logEntry + '\n');
    } catch (error) {
        console.error('Error logging API request:', error);
    }
}

// Helper to log errors to session directory
function logApiError(request, error, details = {}) {
    try {
        const logFile = path.join(logsDir, 'api-errors.log');
        const timestamp = new Date().toISOString();
        const url = request.url();
        const method = request.method();

        const logEntry = `[${timestamp}] ERROR: ${method} ${url} | ${error} | ${JSON.stringify(details)}`;
        fs.appendFileSync(logFile, logEntry + '\n');
    } catch (logError) {
        console.error('Error logging API error:', logError);
    }
}

// Global setup function
module.exports = async () => {
    console.log('Starting global setup for E2E tests...');
    console.log('Global setup: Using Neon PostgreSQL database (online mode)');
    console.log(`Global setup: Session ${sessionId}`);
    console.log(`Global setup: Session directory: ${sessionDir}`);

    // Ensure session directory exists
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Determine which browser to use based on environment
    // In CI, we use different browsers based on the project matrix
    // Locally, we default to chromium for speed
    const getBrowserType = () => {
        // Check if we're running a specific browser project in CI
        const args = process.argv;
        const projectArg = args.find(arg => arg.startsWith('--project='));

        if (projectArg) {
            const projectName = projectArg.split('=')[1];
            console.log(`🌐 Using browser: ${projectName} (from --project flag)`);

            if (projectName.includes('firefox')) return firefox;
            if (projectName.includes('webkit') || projectName.includes('safari')) return webkit;
            return chromium; // Default to chromium for chrome/edge projects
        }

        // Default to chromium for local development
        console.log('🌐 Using browser: chromium (default)');
        return chromium;
    };

    const browserType = getBrowserType();

    try {
        console.log('Global setup: Launching browser for authentication setup...');
        const browser = await browserType.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Set up request/response logging
        page.on('request', request => logApiRequest(request, { type: 'request' }));
        page.on('requestfailed', request => logApiError(request, 'Request failed', { type: 'request_failed' }));
        page.on('response', response => {
            if (!response.ok()) {
                logApiError(response.request(), `Response ${response.status()}`, {
                    type: 'response_error',
                    status: response.status(),
                    statusText: response.statusText()
                });
            }
        });

        // Wait for backend to be ready
        console.log('Global setup: Waiting for backend to be ready...');
        let backendReady = false;
        let attempts = 0;
        const maxAttempts = 30;

        while (!backendReady && attempts < maxAttempts) {
            try {
                const response = await page.goto('http://localhost:8000/api/health', {
                    waitUntil: 'networkidle',
                    timeout: 5000
                });

                if (response && response.ok()) {
                    console.log('Global setup: Backend is ready!');
                    backendReady = true;
                } else {
                    throw new Error(`Backend health check failed: ${response?.status()}`);
                }
            } catch (error) {
                attempts++;
                console.log(`Global setup: Backend not ready yet (attempt ${attempts}/${maxAttempts}), waiting...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!backendReady) {
            throw new Error('Backend failed to start within timeout period');
        }

        // Wait for frontend to be ready
        console.log('Global setup: Waiting for frontend to be ready...');
        let frontendReady = false;
        attempts = 0;

        while (!frontendReady && attempts < maxAttempts) {
            try {
                const response = await page.goto('http://localhost:5173', {
                    waitUntil: 'networkidle',
                    timeout: 10000
                });

                if (response && response.ok()) {
                    console.log('Global setup: Frontend is ready!');
                    frontendReady = true;
                } else {
                    throw new Error(`Frontend health check failed: ${response?.status()}`);
                }
            } catch (error) {
                attempts++;
                console.log(`Global setup: Frontend not ready yet (attempt ${attempts}/${maxAttempts}), waiting...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!frontendReady) {
            throw new Error('Frontend failed to start within timeout period');
        }

        console.log('Global setup: Both backend and frontend are ready!');

        await browser.close();
        console.log('Global setup: Browser closed successfully');

    } catch (error) {
        console.error('Global setup: Error during setup:', error);
        throw error;
    }

    console.log('Global setup complete!');
}; 