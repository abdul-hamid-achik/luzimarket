const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Directories for logs and screenshots
const logsDir = path.join(__dirname, '..', 'tmp', 'playwright-logs');
const screenshotsDir = path.join(__dirname, '..', 'tmp', 'playwright-screenshots');

// Ensure directories exist
[logsDir, screenshotsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Helper to log API requests
function logApiRequest(request, info = {}) {
    try {
        const logFile = path.join(logsDir, 'api-requests.log');
        const timestamp = new Date().toISOString();
        const url = request.url();
        const method = request.method();

        // Create log entry
        const logEntry = `${timestamp} | ${method} ${url} | ${JSON.stringify(info)}\n`;
        fs.appendFileSync(logFile, logEntry);
    } catch (error) {
        console.error('Error logging API request:', error);
    }
}

// Global setup function
module.exports = async () => {
    console.log('Starting global setup for E2E tests...');

    // Create browser instance
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Set up listeners for network events
    page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('/auth/')) {
            logApiRequest(request, { phase: 'request' });
        }
    });

    page.on('response', async response => {
        const request = response.request();
        const url = request.url();

        if (url.includes('/api/') || url.includes('/auth/')) {
            try {
                const status = response.status();
                const info = {
                    phase: 'response',
                    status,
                    ok: response.ok()
                };

                // For failed responses, try to get more details
                if (!response.ok()) {
                    try {
                        const contentType = response.headers()['content-type'] || '';
                        if (contentType.includes('application/json')) {
                            const body = await response.json().catch(() => ({ error: 'Failed to parse JSON response' }));
                            info.body = body;
                        } else {
                            const text = await response.text().catch(() => 'Failed to read response text');
                            info.text = text.substring(0, 500); // Limit text size
                        }

                        // Log detailed error to a separate file
                        const errorLogFile = path.join(logsDir, 'api-errors.log');
                        const errorEntry = `${new Date().toISOString()} | ${request.method()} ${url} | Status: ${status}\n`;
                        const errorDetails = `  Details: ${JSON.stringify(info)}\n\n`;
                        fs.appendFileSync(errorLogFile, errorEntry + errorDetails);
                    } catch (e) {
                        console.error('Error processing response body:', e);
                    }
                }

                logApiRequest(request, info);
            } catch (error) {
                console.error('Error handling response:', error);
            }
        }
    });

    // Test a basic fetch to ensure API access works
    try {
        console.log('Testing basic API connectivity...');
        await page.goto('http://localhost:8000/api/health');
        const healthText = await page.content();
        console.log('Health check response:', healthText.length > 100 ? `${healthText.substring(0, 100)}...` : healthText);
    } catch (error) {
        console.error('WARNING: Could not access health API during setup. Tests may fail:', error.message);
    }

    // Programmatically register a test user and save storage state for skipping UI login
    try {
        console.log('Registering test user for auth storage state...');
        const testEmail = `e2e+${Date.now()}@example.com`;
        const testPassword = 'TestPass123!';
        const registerRes = await fetch(`http://localhost:${process.env.PORT || 8000}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });
        if (!registerRes.ok) throw new Error(`Registration failed: ${registerRes.status}`);
        const { token } = await registerRes.json();

        // Setup storage state for tests - provide both localStorage and sessionStorage
        // This is required by Playwright but our actual app uses sessionStorage
        const storage = {
            cookies: [],
            origins: [
                {
                    origin: 'http://localhost:5173',
                    localStorage: [{ name: 'token', value: token }],
                    sessionStorage: [{ name: 'token', value: token }]
                }
            ]
        };

        const storageDir = path.join(__dirname, '..', 'tmp');
        const storagePath = path.join(storageDir, 'storageState.json');

        try {
            if (!fs.existsSync(storageDir)) {
                fs.mkdirSync(storageDir, { recursive: true });
            }
            fs.writeFileSync(storagePath, JSON.stringify(storage));
            console.log('Auth storage state saved at', storagePath);
        } catch (e) {
            console.error('Failed to write storage state file:', e);
        }

        // Create a page with this token and visit the site to initialize sessionStorage
        const authPage = await browser.newPage();
        await authPage.goto('http://localhost:5173');
        await authPage.evaluate((authToken) => {
            sessionStorage.setItem('token', authToken);
            // Also set it in localStorage for compatibility with tests
            localStorage.setItem('token', authToken);
        }, token);

        // Save this state as well
        const authenticatedStoragePath = path.join(storageDir, 'authenticatedState.json');
        const authenticatedStorage = await authPage.context().storageState();
        fs.writeFileSync(authenticatedStoragePath, JSON.stringify(authenticatedStorage));
        await authPage.close();

    } catch (err) {
        console.error('Failed to create storage state:', err);
    }

    // Cleanup
    await browser.close();
    console.log('Global setup complete');
}; 