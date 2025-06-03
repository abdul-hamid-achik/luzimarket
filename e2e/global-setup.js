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
        screenshotsDir: path.join(sessionDir, 'screenshots'),
        dbPath: path.join(sessionDir, 'luzimarket.db')
    };
};

const { sessionDir, sessionId, logsDir, screenshotsDir, dbPath } = getSessionDirectories();

// Check if we're using PGlite (offline mode)
let dbMode = process.env.DB_MODE || 'online';
let isOfflineMode = dbMode === 'offline';

// Check if Stripe CLI is available
const isCI = process.env.CI === 'true';
const skipStripeCLI = process.env.SKIP_STRIPE_CLI === 'true' || isCI;
const hasStripeCLI = !skipStripeCLI;

console.log(`Global setup running in ${isOfflineMode ? 'OFFLINE (SQLite)' : 'ONLINE (PostgreSQL)'} mode`);

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

    if (isOfflineMode) {
        try {
            console.log('Global setup: Setting up SQLite database for testing...');
            console.log(`Global setup: Session ${sessionId}`);
            console.log(`Global setup: Session directory: ${sessionDir}`);

            // Ensure session directory exists
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }

            // Use session-specific database path
            let sqliteDbFilePath = process.env.DATABASE_URL;

            // Detect remote URLs like postgres://, mysql://, http://, etc.
            // "file:" URLs and simple file paths are considered local
            const isRemoteUrl = sqliteDbFilePath && /^[a-z]+:\/\//i.test(sqliteDbFilePath) && !sqliteDbFilePath.startsWith('file:');

            if (!sqliteDbFilePath || sqliteDbFilePath === ':memory:' || isRemoteUrl) {
                sqliteDbFilePath = dbPath;
                console.log(`Global setup: Using session database: ${sqliteDbFilePath}`);

                // Update environment variable for subsequent processes
                process.env.DATABASE_URL = sqliteDbFilePath;

                // Force offline mode when a remote DATABASE_URL is detected
                if (isRemoteUrl && !isOfflineMode) {
                    console.log('Global setup: Detected remote DATABASE_URL - forcing offline mode');
                    dbMode = 'offline';
                    process.env.DB_MODE = 'offline';
                    isOfflineMode = true;
                }
            } else {
                console.log(`Global setup: Using provided database path: ${sqliteDbFilePath}`);
            }

            if (fs.existsSync(sqliteDbFilePath)) {
                console.log(`Global setup: Deleting existing SQLite database file: ${sqliteDbFilePath}`);
                fs.unlinkSync(sqliteDbFilePath);
                console.log('Global setup: Old SQLite database file deleted.');
            }

            console.log(`Global setup: Ensuring SQLite database file exists at: ${sqliteDbFilePath}`);
            fs.closeSync(fs.openSync(sqliteDbFilePath, 'w'));
            console.log('Global setup: SQLite database file created/ensured.');

            // Update environment variable for subsequent processes
            process.env.DATABASE_URL = sqliteDbFilePath;

            console.log('Global setup: Applying SQLite schema: drop existing schema then push...');
            console.log(`Global setup: Using DATABASE_URL: ${sqliteDbFilePath}`);

            try {
                const schemaOutput = execSync('cd apps/backend && npx --yes drizzle-kit drop --config=drizzle.config.ts && npx --yes drizzle-kit push --config=drizzle.config.ts', {
                    env: { ...process.env, DB_MODE: 'offline', DATABASE_URL: sqliteDbFilePath },
                    stdio: 'pipe',
                    encoding: 'utf8',
                    maxBuffer: 1024 * 1024 * 5 // 5MB buffer
                });

                // Show only important parts of the output
                const lines = schemaOutput.split('\n');
                const importantLines = lines.filter(line =>
                    line.includes('✅') ||
                    line.includes('❌') ||
                    line.includes('✓') ||
                    line.includes('Error') ||
                    line.includes('dropping') ||
                    line.includes('pushing') ||
                    line.includes('Table') ||
                    line.includes('Index')
                );

                console.log('Global setup: Schema operation results:');
                importantLines.slice(0, 10).forEach(line => {
                    if (line.trim()) console.log(`  ${line.trim()}`);
                });

                if (importantLines.length === 0) {
                    console.log('  Schema operations completed successfully (no detailed output)');
                }
            } catch (error) {
                console.error('Global setup: Schema operation failed:', error.message);
                // Log more details but continue - the database might already be set up
                console.log('Global setup: Continuing despite schema error - database may already be initialized');
            }

            console.log('Global setup: Seeding the SQLite database...');
            try {
                const seedOutput = execSync('cd apps/backend && DB_MODE=offline tsx src/db/seed.ts', {
                    env: { ...process.env, DB_MODE: 'offline', DATABASE_URL: sqliteDbFilePath },
                    stdio: 'pipe',
                    encoding: 'utf8',
                    maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large output
                });

                // Show only key information instead of all output
                const lines = seedOutput.split('\n');
                const importantLines = lines.filter(line =>
                    line.includes('✅') ||
                    line.includes('❌') ||
                    line.includes('🗄️') ||
                    line.includes('🌱') ||
                    line.includes('Error') ||
                    line.startsWith('[DB')
                );

                console.log('Global setup: Seeding progress:');
                importantLines.slice(0, 20).forEach(line => {
                    if (line.trim()) console.log(line);
                });

                if (importantLines.length > 20) {
                    console.log(`... and ${importantLines.length - 20} more seeding operations completed`);
                }

                console.log('Global setup: SQLite database setup and seed complete!');
            } catch (error) {
                console.error('Global setup: Seed script failed:', error.message);
                console.log('Global setup: Continuing without seed data');
            }
        } catch (error) {
            console.error('Global setup: Error setting up SQLite database:', error);
            console.log('Global setup: Continuing despite setup error');
        }
    } else {
        console.log('Global setup: Skipping database setup for online mode (using Neon PostgreSQL).');
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

            switch (projectName) {
                case 'firefox':
                    return firefox;
                case 'webkit':
                    return webkit;
                case 'chromium':
                default:
                    return chromium;
            }
        }

        // Fallback: check environment variables that might indicate browser choice
        const browserEnv = process.env.PLAYWRIGHT_BROWSER || process.env.BROWSER;
        if (browserEnv) {
            console.log(`🌐 Using browser: ${browserEnv} (from environment variable)`);

            switch (browserEnv.toLowerCase()) {
                case 'firefox':
                    return firefox;
                case 'webkit':
                case 'safari':
                    return webkit;
                case 'chromium':
                case 'chrome':
                default:
                    return chromium;
            }
        }

        // Default to chromium for local development
        console.log(`🌐 Using browser: chromium (default for local development)`);
        return chromium;
    };

    // Create browser instance with the appropriate browser type
    const browserType = getBrowserType();

    // Browser-specific launch options
    let launchOptions = {};
    if (browserType === webkit) {
        // WebKit-specific options for better stability
        launchOptions = {
            headless: true,
            // WebKit doesn't support --disable-web-security, so we don't include it
        };
    } else if (browserType === firefox) {
        // Firefox-specific options
        launchOptions = {
            headless: true,
            firefoxUserPrefs: {
                'security.fileuri.strict_origin_policy': false
            }
        };
    } else {
        // Chromium-specific options
        launchOptions = {
            headless: true,
            args: ['--disable-web-security'] // Only for Chromium
        };
    }

    const browser = await browserType.launch(launchOptions);
    const page = await browser.newPage();

    // Set up comprehensive logging for all browser events

    // 1. Console messages from the browser (JavaScript console.log, console.error, etc.)
    page.on('console', msg => {
        try {
            const logFile = path.join(logsDir, 'console-errors.log');
            const timestamp = new Date().toISOString();
            const logLevel = msg.type();
            const logText = msg.text();

            const logEntry = `[${timestamp}] CONSOLE_${logLevel.toUpperCase()}: ${logText}`;
            fs.appendFileSync(logFile, logEntry + '\n');

            // Also log to console for immediate visibility
            if (logLevel === 'error' || logLevel === 'warning') {
                console.log(`🔴 Browser ${logLevel}: ${logText}`);
            } else {
                console.log(`📝 Browser ${logLevel}: ${logText}`);
            }
        } catch (error) {
            console.error('Error logging console message:', error);
        }
    });

    // 2. Page errors (uncaught exceptions, unhandled promise rejections)
    page.on('pageerror', exception => {
        try {
            const logFile = path.join(logsDir, 'console-errors.log');
            const timestamp = new Date().toISOString();

            const logEntry = `[${timestamp}] PAGE_ERROR: ${exception.toString()}`;
            fs.appendFileSync(logFile, logEntry + '\n');

            console.error(`💥 Uncaught exception: ${exception}`);
        } catch (error) {
            console.error('Error logging page error:', error);
        }
    });

    // 3. Request/Response logging for API calls
    page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('/auth/')) {
            logApiRequest(request, {
                phase: 'request',
                method: request.method(),
                headers: request.headers(),
                postData: request.method() === 'POST' ? request.postData() : null
            });
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
                    ok: response.ok(),
                    headers: response.headers(),
                    statusText: response.statusText()
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

                        // Log detailed error to session directory
                        logApiError(request, `Status ${status}`, info);
                        console.error(`🔴 API Error: ${request.method()} ${url} -> ${status} ${response.statusText()}`);
                    } catch (e) {
                        console.error('Error processing response body:', e);
                    }
                } else {
                    console.log(`✅ API Success: ${request.method()} ${url} -> ${status}`);
                }

                logApiRequest(request, info);
            } catch (error) {
                console.error('Error handling response:', error);
                logApiError(request, 'Error handling response', { error: error.message });
            }
        }
    });

    // 4. Request failures (network errors, timeouts)
    page.on('requestfailed', request => {
        const url = request.url();
        const failure = request.failure();

        try {
            const logFile = path.join(logsDir, 'api-errors.log');
            const timestamp = new Date().toISOString();

            const logEntry = `[${timestamp}] REQUEST_FAILED: ${request.method()} ${url} | ${failure ? failure.errorText : 'Unknown error'}`;
            fs.appendFileSync(logFile, logEntry + '\n');

            console.error(`🔴 Request failed: ${request.method()} ${url} - ${failure ? failure.errorText : 'Unknown error'}`);
        } catch (error) {
            console.error('Error logging request failure:', error);
        }
    });

    // Test a basic fetch to ensure API access works with retry logic
    const maxRetries = 5;
    let healthCheckSucceeded = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Testing basic API connectivity (attempt ${attempt}/${maxRetries})...`);
            await page.goto('http://localhost:8000/api/health', { timeout: 60000 });
            const healthText = await page.content();
            console.log('✅ Health check successful:', healthText.length > 100 ? `${healthText.substring(0, 100)}...` : healthText);
            healthCheckSucceeded = true;
            break;
        } catch (error) {
            console.warn(`⚠️  Health check attempt ${attempt} failed:`, error.message);
            if (attempt < maxRetries) {
                console.log(`⏳ Waiting 10 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }

    if (!healthCheckSucceeded) {
        console.error('❌ All health check attempts failed. Backend may not be ready.');
        console.log('🔄 Proceeding with setup anyway - tests will handle backend readiness...');
    }

    // Create storage state directory if it doesn't exist (use session-specific dir)
    const storagePath = path.join(sessionDir, 'storageState.json');

    // Also create the legacy tmp directory that tests expect
    const tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Programmatically register a test user and save storage state for skipping UI login
    try {
        console.log('Registering test user for auth storage state...');
        const testEmail = `e2e+${Date.now()}@example.com`;
        const testPassword = 'TestPass123!';

        const registerUrl = `http://localhost:${process.env.PORT || 8000}/api/auth/register`;
        const loginUrl = `http://localhost:${process.env.PORT || 8000}/api/auth/login`;
        console.log(`Calling register API at: ${registerUrl}`);

        // Try registration with timeout and retry
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const registerRes = await fetch(registerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        let token;

        if (!registerRes.ok) {
            const errorText = await registerRes.text();
            console.error(`Registration failed with status: ${registerRes.status}, Error: ${errorText}`);

            // Attempt login if user already exists
            console.log('Attempting login with same credentials...');
            const loginController = new AbortController();
            const loginTimeoutId = setTimeout(() => loginController.abort(), 30000);

            const loginRes = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, password: testPassword }),
                signal: loginController.signal
            });

            clearTimeout(loginTimeoutId);

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

        // Create admin token for CMS tests
        console.log('Creating admin token for CMS tests...');
        let adminToken;
        let adminRefreshToken; // Declare at the top level

        try {
            const adminController = new AbortController();
            const adminTimeoutId = setTimeout(() => adminController.abort(), 30000);

            const adminLoginRes = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'admin@luzimarket.shop',
                    password: 'LuziAdmin2024!'
                }),
                signal: adminController.signal
            });

            clearTimeout(adminTimeoutId);

            if (adminLoginRes.ok) {
                const adminData = await adminLoginRes.json();
                adminToken = adminData.accessToken || adminData.token;
                console.log('Admin token created successfully');
            } else {
                console.error('Admin login failed, CMS tests may fail');
            }
        } catch (err) {
            console.error('Failed to create admin token:', err);
        }

        // Setup storage state for tests - provide both localStorage and sessionStorage
        // This is required by Playwright but our actual app uses sessionStorage with obfuscated keys
        const obfuscatedAccessTokenKey = Buffer.from('_luzi_auth_access').toString('base64');
        const obfuscatedRefreshTokenKey = Buffer.from('_luzi_auth_refresh').toString('base64');

        // Create a refresh token as well (using same JWT signing approach)
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';

        // Create a proper refresh token
        const refreshToken = jwt.sign({
            sessionId: 'test-session-refresh',
            userId: 'test-user-id',
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
        }, JWT_SECRET);

        const storage = {
            cookies: [],
            origins: [
                {
                    origin: 'http://localhost:5173',
                    localStorage: [
                        { name: 'token', value: token }, // Legacy compatibility
                        { name: obfuscatedAccessTokenKey, value: token },
                        { name: obfuscatedRefreshTokenKey, value: refreshToken }
                    ],
                    sessionStorage: [
                        { name: 'token', value: token }, // Legacy compatibility  
                        { name: obfuscatedAccessTokenKey, value: token },
                        { name: obfuscatedRefreshTokenKey, value: refreshToken }
                    ]
                }
            ]
        };

        // Create admin storage state for CMS tests
        let adminStorage;
        if (adminToken) {
            // Create admin refresh token (assign to the top-level variable)
            adminRefreshToken = jwt.sign({
                sessionId: 'admin-session-refresh',
                userId: 'admin-user-id',
                type: 'refresh',
                role: 'admin',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
            }, JWT_SECRET);

            adminStorage = {
                cookies: [],
                origins: [
                    {
                        origin: 'http://localhost:5173',
                        localStorage: [
                            { name: 'token', value: adminToken },
                            { name: obfuscatedAccessTokenKey, value: adminToken },
                            { name: obfuscatedRefreshTokenKey, value: adminRefreshToken }
                        ],
                        sessionStorage: [
                            { name: 'token', value: adminToken },
                            { name: obfuscatedAccessTokenKey, value: adminToken },
                            { name: obfuscatedRefreshTokenKey, value: adminRefreshToken }
                        ]
                    }
                ]
            };
        }

        try {
            fs.writeFileSync(storagePath, JSON.stringify(storage));
            console.log('Auth storage state saved at', storagePath);

            // Also save in the tmp directory for tests that expect it there
            const legacyStoragePath = path.join(tmpDir, 'storageState.json');
            fs.writeFileSync(legacyStoragePath, JSON.stringify(storage));
            console.log('Legacy auth storage state saved at', legacyStoragePath);

            // Save admin storage state
            if (adminStorage) {
                const adminStoragePath = path.join(sessionDir, 'adminStorageState.json');
                fs.writeFileSync(adminStoragePath, JSON.stringify(adminStorage));
                console.log('Admin storage state saved at', adminStoragePath);

                // Also save admin storage in tmp directory
                const legacyAdminStoragePath = path.join(tmpDir, 'adminStorageState.json');
                fs.writeFileSync(legacyAdminStoragePath, JSON.stringify(adminStorage));
                console.log('Legacy admin storage state saved at', legacyAdminStoragePath);
            }
        } catch (e) {
            console.error('Failed to write storage state file:', e);
        }

        // Create a page with this token and visit the site to initialize sessionStorage
        const authPage = await browser.newPage();
        await authPage.goto('http://localhost:5173');
        await authPage.evaluate(({ accessToken, refreshToken }) => {
            const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
            const obfuscatedRefreshTokenKey = btoa('_luzi_auth_refresh');
            // Set tokens with obfuscated keys for production app
            sessionStorage.setItem(obfuscatedAccessTokenKey, accessToken);
            sessionStorage.setItem(obfuscatedRefreshTokenKey, refreshToken);
            localStorage.setItem(obfuscatedAccessTokenKey, accessToken);
            localStorage.setItem(obfuscatedRefreshTokenKey, refreshToken);
            // Also set legacy keys for compatibility
            sessionStorage.setItem('token', accessToken);
            localStorage.setItem('token', accessToken);
        }, { accessToken: token, refreshToken });

        // Save this state as well
        const authenticatedStoragePath = path.join(sessionDir, 'authenticatedState.json');
        const authenticatedStorage = await authPage.context().storageState();
        fs.writeFileSync(authenticatedStoragePath, JSON.stringify(authenticatedStorage));

        // Also save in tmp directory for tests that expect it there
        const legacyAuthenticatedStoragePath = path.join(tmpDir, 'authenticatedState.json');
        fs.writeFileSync(legacyAuthenticatedStoragePath, JSON.stringify(authenticatedStorage));
        console.log('Legacy authenticated state saved at', legacyAuthenticatedStoragePath);

        await authPage.close();

        // Create admin page with admin token
        if (adminToken) {
            const adminPage = await browser.newPage();
            await adminPage.goto('http://localhost:5173');
            await adminPage.evaluate(({ accessToken, refreshToken }) => {
                const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
                const obfuscatedRefreshTokenKey = btoa('_luzi_auth_refresh');
                sessionStorage.setItem(obfuscatedAccessTokenKey, accessToken);
                sessionStorage.setItem(obfuscatedRefreshTokenKey, refreshToken);
                localStorage.setItem(obfuscatedAccessTokenKey, accessToken);
                localStorage.setItem(obfuscatedRefreshTokenKey, refreshToken);
                sessionStorage.setItem('token', accessToken);
                localStorage.setItem('token', accessToken);
            }, { accessToken: adminToken, refreshToken: adminRefreshToken });

            const adminAuthStoragePath = path.join(sessionDir, 'adminAuthenticatedState.json');
            const adminAuthStorage = await adminPage.context().storageState();
            fs.writeFileSync(adminAuthStoragePath, JSON.stringify(adminAuthStorage));

            // Also save in tmp directory for tests that expect it there
            const legacyAdminAuthStoragePath = path.join(tmpDir, 'adminAuthenticatedState.json');
            fs.writeFileSync(legacyAdminAuthStoragePath, JSON.stringify(adminAuthStorage));

            await adminPage.close();
            console.log('Admin authenticated state saved');
        }

    } catch (err) {
        console.error('Failed to create storage state:', err);
        console.log('🔄 Creating fallback tokens for testing...');

        // Create fallback tokens regardless of mode (offline or online)
        // This ensures tests can run even if backend isn't ready during setup
        console.log('Creating fallback tokens for offline mode...');

        // Import JWT library and create properly signed tokens
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';

        const mockToken = jwt.sign({
            sessionId: 'fake-session-id',
            userId: 'fake-user-id',
            role: 'customer',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        }, JWT_SECRET);

        const mockRefreshToken = jwt.sign({
            sessionId: 'fake-session-refresh',
            userId: 'fake-user-id',
            type: 'refresh',
            role: 'customer',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
        }, JWT_SECRET);

        const mockAdminToken = jwt.sign({
            sessionId: 'fake-admin-session',
            userId: 'fake-admin-id',
            role: 'admin',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        }, JWT_SECRET);

        const mockAdminRefreshToken = jwt.sign({
            sessionId: 'fake-admin-refresh',
            userId: 'fake-admin-id',
            type: 'refresh',
            role: 'admin',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
        }, JWT_SECRET);

        const obfuscatedAccessTokenKey = Buffer.from('_luzi_auth_access').toString('base64');
        const obfuscatedRefreshTokenKey = Buffer.from('_luzi_auth_refresh').toString('base64');

        const storage = {
            cookies: [],
            origins: [
                {
                    origin: 'http://localhost:5173',
                    localStorage: [
                        { name: 'token', value: mockToken },
                        { name: obfuscatedAccessTokenKey, value: mockToken },
                        { name: obfuscatedRefreshTokenKey, value: mockRefreshToken }
                    ],
                    sessionStorage: [
                        { name: 'token', value: mockToken },
                        { name: obfuscatedAccessTokenKey, value: mockToken },
                        { name: obfuscatedRefreshTokenKey, value: mockRefreshToken }
                    ]
                }
            ]
        };

        const adminStorage = {
            cookies: [],
            origins: [
                {
                    origin: 'http://localhost:5173',
                    localStorage: [
                        { name: 'token', value: mockAdminToken },
                        { name: obfuscatedAccessTokenKey, value: mockAdminToken },
                        { name: obfuscatedRefreshTokenKey, value: mockAdminRefreshToken }
                    ],
                    sessionStorage: [
                        { name: 'token', value: mockAdminToken },
                        { name: obfuscatedAccessTokenKey, value: mockAdminToken },
                        { name: obfuscatedRefreshTokenKey, value: mockAdminRefreshToken }
                    ]
                }
            ]
        };

        fs.writeFileSync(storagePath, JSON.stringify(storage));
        console.log('Created fallback auth storage for offline mode at', storagePath);

        // Also create in tmp directory for tests that expect it there
        const legacyStoragePath = path.join(tmpDir, 'storageState.json');
        fs.writeFileSync(legacyStoragePath, JSON.stringify(storage));

        // Also create the authenticated state
        const authenticatedStoragePath = path.join(sessionDir, 'authenticatedState.json');
        fs.writeFileSync(authenticatedStoragePath, JSON.stringify(storage));

        const legacyAuthenticatedStoragePath = path.join(tmpDir, 'authenticatedState.json');
        fs.writeFileSync(legacyAuthenticatedStoragePath, JSON.stringify(storage));

        // Create admin storage states
        const adminStoragePath = path.join(sessionDir, 'adminStorageState.json');
        const adminAuthStoragePath = path.join(sessionDir, 'adminAuthenticatedState.json');
        fs.writeFileSync(adminStoragePath, JSON.stringify(adminStorage));
        fs.writeFileSync(adminAuthStoragePath, JSON.stringify(adminStorage));

        // Also create admin storage in tmp directory
        const legacyAdminStoragePath = path.join(tmpDir, 'adminStorageState.json');
        const legacyAdminAuthStoragePath = path.join(tmpDir, 'adminAuthenticatedState.json');
        fs.writeFileSync(legacyAdminStoragePath, JSON.stringify(adminStorage));
        fs.writeFileSync(legacyAdminAuthStoragePath, JSON.stringify(adminStorage));
        console.log('Created fallback admin storage states for offline mode');
    }

    // Create session summary for debugging and replication
    const sessionInfo = {
        sessionId: sessionId,
        sessionDir: sessionDir,
        timestamp: new Date().toISOString(),
        dbMode: dbMode,
        dbPath: isOfflineMode ? dbPath : 'N/A (online mode)',
        environment: {
            nodeEnv: process.env.NODE_ENV,
            ci: process.env.CI,
            port: process.env.PORT || 8000,
            baseUrl: 'http://localhost:5173',
            apiUrl: `http://localhost:${process.env.PORT || 8000}`
        },
        files: {
            database: isOfflineMode ? 'luzimarket.db' : null,
            storageState: 'storageState.json',
            adminStorageState: 'adminStorageState.json',
            authenticatedState: 'authenticatedState.json',
            adminAuthenticatedState: 'adminAuthenticatedState.json',
            stripeWebhookSecret: hasStripeCLI ? 'stripe-webhook-secret.txt' : null
        },
        logs: {
            apiRequests: 'logs/api-requests.log',
            apiErrors: 'logs/api-errors.log',
            backend: 'logs/backend.log',
            frontend: 'logs/frontend.log',
            stripeWebhook: hasStripeCLI ? 'logs/stripe-webhook.log' : null,
            console: 'logs/console-errors.log'
        },
        directories: {
            screenshots: 'screenshots/',
            results: 'results/',
            report: 'report/'
        }
    };

    try {
        fs.writeFileSync(
            path.join(sessionDir, 'session-info.json'),
            JSON.stringify(sessionInfo, null, 2)
        );
        console.log('📋 Session info saved to session-info.json');
    } catch (error) {
        console.error('Failed to save session info:', error);
    }

    // Cleanup
    await browser.close();
    console.log('Global setup complete');
}; 