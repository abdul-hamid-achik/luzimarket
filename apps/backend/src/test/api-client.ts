import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import request from 'supertest';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { sessionDir } from './config';
import { getTestUsers } from './test-setup';

// Set environment for testing before Next.js initialization
(process.env as any).NODE_ENV = 'test';

// Function to get the test database path from global setup
function getTestDatabasePath(): string | null {
    try {
        const dbInfoPath = path.join(sessionDir, 'test-db-info.json');
        if (require('fs').existsSync(dbInfoPath)) {
            const dbInfo = JSON.parse(readFileSync(dbInfoPath, 'utf8'));
            return dbInfo.dbPath;
        }
    } catch (error) {
        console.log('Could not read test database info:', error);
    }
    return null;
}

// Singleton pattern to ensure only one server instance
class TestServerSingleton {
    private static instance: TestServerSingleton;
    private app: any = null;
    private server: any = null;
    private testUsers: any = null;
    private isInitializing = false;
    private initPromise: Promise<any> | null = null;

    private constructor() { }

    public static getInstance(): TestServerSingleton {
        if (!TestServerSingleton.instance) {
            TestServerSingleton.instance = new TestServerSingleton();
        }
        return TestServerSingleton.instance;
    }

    public async initialize() {
        // If already initialized, return the existing server
        if (this.server && this.app) {
            return this.server;
        }

        // If currently initializing, wait for that to complete
        if (this.isInitializing && this.initPromise) {
            return await this.initPromise;
        }

        // Start initialization
        this.isInitializing = true;
        this.initPromise = this._doInitialize();

        try {
            const result = await this.initPromise;
            this.isInitializing = false;
            return result;
        } catch (error) {
            this.isInitializing = false;
            this.initPromise = null;
            throw error;
        }
    }

    private async _doInitialize() {
        console.log('🧪 Initializing singleton test server...');

        // Get the test database path
        const testDbPath = getTestDatabasePath();
        const databaseUrl = testDbPath ? `file:${testDbPath}` : process.env.DATABASE_URL;

        console.log('🧪 DATABASE_URL for test server:', databaseUrl);

        try {
            // Always use development mode for tests to ensure database access
            // Production builds can't access the global test instance
            this.app = next({
                dev: true, // Force development mode for tests
                dir: process.cwd(),
                quiet: true,
                conf: {
                    env: {
                        NODE_ENV: 'test',
                        DATABASE_URL: databaseUrl,
                        DB_MODE: 'offline', // Force offline mode for tests
                        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
                    },
                    experimental: {
                        // Pass environment variables to the server
                        serverComponentsExternalPackages: ['better-sqlite3']
                    }
                }
            });

            await this.app.prepare();
            const handle = this.app.getRequestHandler();

            this.server = createServer(async (req, res) => {
                try {
                    // Simple error handling
                    if (res.headersSent || res.finished || res.destroyed) {
                        return;
                    }

                    const parsedUrl = parse(req.url!, true);
                    await handle(req, res, parsedUrl);
                } catch (error) {
                    console.error('Request handler error:', error);
                    if (!res.headersSent && !res.finished && !res.destroyed) {
                        res.statusCode = 500;
                        res.end('Internal Server Error');
                    }
                }
            });

            // Load test users
            this.testUsers = getTestUsers();
            if (!this.testUsers) {
                const authInfoPath = path.join(sessionDir, 'test-auth.json');
                try {
                    this.testUsers = JSON.parse(readFileSync(authInfoPath, 'utf8'));
                } catch (error) {
                    console.log('🔧 Creating test auth file...');
                    const setup = await import('./api-setup');
                    await setup.default();
                    this.testUsers = JSON.parse(readFileSync(authInfoPath, 'utf8'));
                }
            }

            console.log('✅ Singleton test server initialized');
            return this.server;
        } catch (error) {
            console.error('❌ Failed to initialize singleton test server:', error);
            this.server = null;
            this.app = null;
            throw error;
        }
    }

    public getServer() {
        return this.server;
    }

    public getTestUsers() {
        return this.testUsers;
    }

    public async cleanup() {
        if (this.server) {
            await new Promise<void>((resolve) => {
                this.server.close(() => resolve());
            });
        }
        if (this.app) {
            try {
                await this.app.close();
            } catch (error) {
                console.warn('App close error:', error);
            }
        }
        this.server = null;
        this.app = null;
        this.testUsers = null;
        this.isInitializing = false;
        this.initPromise = null;
    }
}

const testServerSingleton = TestServerSingleton.getInstance();

// Initialize the test server (lightweight since DB setup is done in global setup)
export async function initializeTestServer() {
    return await testServerSingleton.initialize();
}

// Get the supertest instance
export function getTestClient() {
    const server = testServerSingleton.getServer();
    if (!server) {
        throw new Error('Test server not initialized. Call initializeTestServer() first.');
    }
    return request(server);
}

// Authentication helpers
export async function authenticateUser(userType: 'customer' | 'admin' = 'customer') {
    const client = getTestClient();
    const testUsers = testServerSingleton.getTestUsers();

    if (!testUsers) {
        throw new Error('Test users not loaded');
    }

    const user = testUsers[userType];

    // First register the user
    const registerResponse = await client
        .post('/api/auth/register')
        .send({
            email: user.email,
            password: user.password,
            name: user.name
        })
        .expect((res: any) => {
            // Accept either 201 (created), 400 (already exists), or 409 (conflict)
            if (![201, 400, 409].includes(res.status)) {
                throw new Error(`Registration failed with status ${res.status}: ${res.body?.error || res.text}`);
            }
        });

    let token;

    if (registerResponse.status === 201) {
        // User created successfully
        token = registerResponse.body.accessToken || registerResponse.body.token;
    } else {
        // User already exists (400 or 409), try to login
        const loginResponse = await client
            .post('/api/auth/login')
            .send({
                email: user.email,
                password: user.password
            })
            .expect(200);

        token = loginResponse.body.accessToken || loginResponse.body.token;
    }

    if (!token) {
        throw new Error('No token received from authentication');
    }

    return {
        token,
        user: {
            email: user.email,
            name: user.name
        }
    };
}

// Guest session helper
export async function createGuestSession() {
    const client = getTestClient();

    const response = await client
        .post('/api/auth/guest')
        .expect(200);

    return {
        token: response.body.token,
        sessionId: response.body.sessionId
    };
}

// Helper to make authenticated requests
export class AuthenticatedClient {
    private client: any;
    private token: string;

    constructor(client: any, token: string) {
        this.client = client;
        this.token = token;
    }

    get(url: string) {
        return this.client
            .get(url)
            .set('Authorization', `Bearer ${this.token}`);
    }

    post(url: string, data?: any) {
        return this.client
            .post(url)
            .set('Authorization', `Bearer ${this.token}`)
            .send(data);
    }

    put(url: string, data?: any) {
        return this.client
            .put(url)
            .set('Authorization', `Bearer ${this.token}`)
            .send(data);
    }

    patch(url: string, data?: any) {
        return this.client
            .patch(url)
            .set('Authorization', `Bearer ${this.token}`)
            .send(data);
    }

    delete(url: string) {
        return this.client
            .delete(url)
            .set('Authorization', `Bearer ${this.token}`);
    }
}

// Helper to create authenticated client
export async function createAuthenticatedClient(userType: 'customer' | 'admin' = 'customer') {
    const { token } = await authenticateUser(userType);
    const client = getTestClient();
    return new AuthenticatedClient(client, token);
}

// Cleanup function - now just a placeholder since we use singleton
export async function cleanupTestServer() {
    // Don't actually cleanup the singleton during individual test cleanup
    // The cleanup will happen at the end of the test session
    console.log('🧹 Test cleanup (singleton preserved)');
}

// Global cleanup for end of test session
export async function globalCleanupTestServer() {
    console.log('🧹 Global cleanup of singleton test server...');
    await testServerSingleton.cleanup();
    console.log('✅ Global test server cleanup complete');
} 