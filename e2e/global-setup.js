const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories for logs and screenshots
const logsDir = path.join(__dirname, '..', 'tmp', 'playwright-logs');
const screenshotsDir = path.join(__dirname, '..', 'tmp', 'playwright-screenshots');

// Check if we're using PGlite (offline mode)
const DB_MODE = process.env.DB_MODE || 'online';
const isOfflineMode = DB_MODE === 'offline';

console.log(`Global setup running in ${isOfflineMode ? 'OFFLINE (SQLite)' : 'ONLINE (PostgreSQL)'} mode`);

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

    if (isOfflineMode) {
        try {
            console.log('Global setup: Setting up SQLite database for testing...');
            const tmpDir = path.join(__dirname, '..', 'tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }
            const sqliteDbFilePath = path.join(tmpDir, 'db.sqlite');

            if (fs.existsSync(sqliteDbFilePath)) {
                console.log(`Global setup: Deleting existing SQLite database file: ${sqliteDbFilePath}`);
                fs.unlinkSync(sqliteDbFilePath);
                console.log('Global setup: Old SQLite database file deleted.');
            }

            console.log(`Global setup: Ensuring SQLite database file exists at: ${sqliteDbFilePath}`);
            fs.closeSync(fs.openSync(sqliteDbFilePath, 'w'));
            console.log('Global setup: SQLite database file created/ensured.');

            process.env.DATABASE_URL = sqliteDbFilePath;

            console.log('Global setup: Applying SQLite schema: drop existing schema then push...');
            execSync('cd apps/backend && DB_MODE=offline npx --yes drizzle-kit drop && DB_MODE=offline npx --yes drizzle-kit push', {
                env: { ...process.env, DB_MODE: 'offline', DATABASE_URL: sqliteDbFilePath },
                stdio: 'inherit'
            });

            console.log('Global setup: Seeding the SQLite database...');
            execSync('cd apps/backend && DB_MODE=offline tsx src/db/seed.ts', {
                env: { ...process.env, DB_MODE: 'offline', DATABASE_URL: sqliteDbFilePath },
                stdio: 'inherit'
            });

            console.log('Global setup: SQLite database setup and seed complete!');
        } catch (error) {
            console.error('Global setup: Failed to set up SQLite database:', error);
            process.exit(1); // Exit if DB setup fails
        }
    }

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

    // Create storage state directory if it doesn't exist
    const storageDir = path.join(__dirname, '..', 'tmp');
    const storagePath = path.join(storageDir, 'storageState.json');

    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }

    // Programmatically register a test user and save storage state for skipping UI login
    try {
        console.log('Registering test user for auth storage state...');
        const testEmail = `e2e+${Date.now()}@example.com`;
        const testPassword = 'TestPass123!';

        const registerUrl = `http://localhost:${process.env.PORT || 8000}/api/auth/register`;
        const loginUrl = `http://localhost:${process.env.PORT || 8000}/api/auth/login`;
        console.log(`Calling register API at: ${registerUrl}`);

        const registerRes = await fetch(registerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });

        let token;

        if (!registerRes.ok) {
            const errorText = await registerRes.text();
            console.error(`Registration failed with status: ${registerRes.status}, Error: ${errorText}`);

            // Attempt login if user already exists
            console.log('Attempting login with same credentials...');
            const loginRes = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, password: testPassword })
            });

            if (!loginRes.ok) {
                const loginError = await loginRes.text();
                console.error(`Login after registration failure failed with status: ${loginRes.status}, Error: ${loginError}`);
                throw new Error(`Login fallback failed: ${loginRes.status}`);
            }

            const loginData = await loginRes.json();
            token = loginData.accessToken || loginData.token; // Support both old and new field names
        } else {
            const registerData = await registerRes.json();
            token = registerData.accessToken || registerData.token; // Support both old and new field names
        }

        if (!token) {
            console.error('No token received from auth API');
            throw new Error('No token in authentication response');
        }

        // Setup storage state for tests - provide both localStorage and sessionStorage
        // This is required by Playwright but our actual app uses sessionStorage with obfuscated keys
        const obfuscatedAccessTokenKey = Buffer.from('_luzi_auth_access').toString('base64');
        const storage = {
            cookies: [],
            origins: [
                {
                    origin: 'http://localhost:5173',
                    localStorage: [
                        { name: 'token', value: token }, // Legacy compatibility
                        { name: obfuscatedAccessTokenKey, value: token }
                    ],
                    sessionStorage: [
                        { name: 'token', value: token }, // Legacy compatibility  
                        { name: obfuscatedAccessTokenKey, value: token }
                    ]
                }
            ]
        };

        try {
            fs.writeFileSync(storagePath, JSON.stringify(storage));
            console.log('Auth storage state saved at', storagePath);
        } catch (e) {
            console.error('Failed to write storage state file:', e);
        }

        // Create a page with this token and visit the site to initialize sessionStorage
        const authPage = await browser.newPage();
        await authPage.goto('http://localhost:5173');
        await authPage.evaluate((authToken) => {
            const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
            // Set tokens with obfuscated keys for production app
            sessionStorage.setItem(obfuscatedAccessTokenKey, authToken);
            localStorage.setItem(obfuscatedAccessTokenKey, authToken);
            // Also set legacy keys for compatibility
            sessionStorage.setItem('token', authToken);
            localStorage.setItem('token', authToken);
        }, token);

        // Save this state as well
        const authenticatedStoragePath = path.join(storageDir, 'authenticatedState.json');
        const authenticatedStorage = await authPage.context().storageState();
        fs.writeFileSync(authenticatedStoragePath, JSON.stringify(authenticatedStorage));
        await authPage.close();

    } catch (err) {
        console.error('Failed to create storage state:', err);

        // If in offline mode, create a fallback token for testing
        if (isOfflineMode) {
            console.log('Creating fallback token for offline mode...');

            // Create a simple mock token for testing
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJmYWtlLXNlc3Npb24taWQiLCJ1c2VySWQiOiJmYWtlLXVzZXItaWQiLCJpYXQiOjE2MjM0NTY3ODksImV4cCI6MTYyMzQ1Njc4OX0.fake-signature';
            const obfuscatedAccessTokenKey = Buffer.from('_luzi_auth_access').toString('base64');

            const storage = {
                cookies: [],
                origins: [
                    {
                        origin: 'http://localhost:5173',
                        localStorage: [
                            { name: 'token', value: mockToken },
                            { name: obfuscatedAccessTokenKey, value: mockToken }
                        ],
                        sessionStorage: [
                            { name: 'token', value: mockToken },
                            { name: obfuscatedAccessTokenKey, value: mockToken }
                        ]
                    }
                ]
            };

            fs.writeFileSync(storagePath, JSON.stringify(storage));
            console.log('Created fallback auth storage for offline mode at', storagePath);

            // Also create the authenticated state
            const authenticatedStoragePath = path.join(storageDir, 'authenticatedState.json');
            fs.writeFileSync(authenticatedStoragePath, JSON.stringify(storage));
        }
    }

    // Cleanup
    await browser.close();
    console.log('Global setup complete');
}; 