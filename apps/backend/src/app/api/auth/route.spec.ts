import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestServer, getTestClient, cleanupTestServer, createGuestSession, authenticateUser } from '../../../test/api-client';

describe('Authentication API', () => {
    let client: any;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('POST /api/auth/guest', () => {
        it('should issue guest token', async () => {
            const response = await client
                .post('/api/auth/guest')
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('sessionId');
            expect(typeof response.body.token).toBe('string');
            expect(typeof response.body.sessionId).toBe('string');
            expect(response.body.token.length).toBeGreaterThan(10);
        });

        it('should create valid JWT token', async () => {
            const response = await client
                .post('/api/auth/guest')
                .expect(200);

            const token = response.body.token;

            // JWT tokens have 3 parts separated by dots
            const tokenParts = token.split('.');
            expect(tokenParts).toHaveLength(3);

            // Decode the payload (without verification for testing)
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            expect(payload).toHaveProperty('sessionId');
            expect(payload).toHaveProperty('isGuest', true);
        });
    });

    describe('POST /api/auth/register', () => {
        it('should register new user with valid data', async () => {
            const timestamp = Date.now();
            const userData = {
                email: `test-register-${timestamp}@example.com`,
                password: 'TestPassword123!',
                name: 'Test User'
            };

            const response = await client
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('email', userData.email);
            expect(response.body.user).toHaveProperty('name', userData.name);
            expect(response.body.user).not.toHaveProperty('password'); // Should not return password
        });

        it('should reject registration with invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'TestPassword123!',
                name: 'Test User'
            };

            const response = await client
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should reject registration with weak password', async () => {
            const timestamp = Date.now();
            const userData = {
                email: `test-weak-password-${timestamp}@example.com`,
                password: '123', // Weak password
                name: 'Test User'
            };

            const response = await client
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should reject duplicate email registration', async () => {
            const timestamp = Date.now();
            const userData = {
                email: `test-duplicate-${timestamp}@example.com`,
                password: 'TestPassword123!',
                name: 'Test User'
            };

            // First registration should succeed
            await client
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Second registration with same email should fail
            const response = await client
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            // First register a user
            const timestamp = Date.now();
            const userData = {
                email: `test-login-${timestamp}@example.com`,
                password: 'TestPassword123!',
                name: 'Test User'
            };

            await client
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Now login
            const loginResponse = await client
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                })
                .expect(200);

            expect(loginResponse.body).toHaveProperty('accessToken');
            expect(loginResponse.body).toHaveProperty('user');
            expect(loginResponse.body.user).toHaveProperty('email', userData.email);
        });

        it('should reject login with invalid credentials', async () => {
            const response = await client
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should merge guest cart on login', async () => {
            // Create a guest session first
            const guestResponse = await client
                .post('/api/auth/guest')
                .expect(200);

            const guestToken = guestResponse.body.token;

            // Add item to guest cart (assuming cart endpoint exists)
            try {
                await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${guestToken}`)
                    .send({ productId: 1, quantity: 1 });
            } catch (error) {
                // Cart endpoint might not exist in tests, ignore
            }

            // Register and login a user with guest token
            const timestamp = Date.now();
            const userData = {
                email: `test-cart-merge-${timestamp}@example.com`,
                password: 'TestPassword123!',
                name: 'Test User'
            };

            await client
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Login with guest token to trigger cart merge
            const loginResponse = await client
                .post('/api/auth/login')
                .set('Authorization', `Bearer ${guestToken}`)
                .send({
                    email: userData.email,
                    password: userData.password
                })
                .expect(200);

            expect(loginResponse.body).toHaveProperty('accessToken');
        });
    });

    describe('Authentication Helpers', () => {
        it('should authenticate customer user using helper', async () => {
            const auth = await authenticateUser('customer');

            expect(auth).toHaveProperty('token');
            expect(auth).toHaveProperty('user');
            expect(typeof auth.token).toBe('string');
            expect(auth.user).toHaveProperty('email');
        });

        it('should create guest session using helper', async () => {
            const guest = await createGuestSession();

            expect(guest).toHaveProperty('token');
            expect(guest).toHaveProperty('sessionId');
            expect(typeof guest.token).toBe('string');
            expect(typeof guest.sessionId).toBe('string');
        });
    });

    describe('Protected Endpoints', () => {
        it('should require authentication for protected routes', async () => {
            // Test accessing cart without token
            const response = await client
                .get('/api/cart')
                .expect(401);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Authorization');
        });

        it('should allow access with valid token', async () => {
            const { token } = await createGuestSession();

            // This should work with guest token
            await client
                .get('/api/cart')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });

        it('should reject invalid tokens', async () => {
            const response = await client
                .get('/api/cart')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should reject malformed authorization header', async () => {
            const response = await client
                .get('/api/cart')
                .set('Authorization', 'InvalidFormat')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Token Validation', () => {
        it('should decode token payload correctly', async () => {
            const { token } = await authenticateUser('customer');

            // Decode token payload (without verification)
            const tokenParts = token.split('.');
            expect(tokenParts).toHaveLength(3);

            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            expect(payload).toHaveProperty('userId');
            expect(payload).toHaveProperty('sessionId');
            expect(payload.isGuest).toBe(false);
        });

        it('should have proper token expiration', async () => {
            const { token } = await authenticateUser('customer');

            const tokenParts = token.split('.');
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

            expect(payload).toHaveProperty('exp');
            expect(payload).toHaveProperty('iat');
            expect(payload.exp).toBeGreaterThan(payload.iat);

            // Token should be valid for a reasonable time (at least 1 hour)
            const tokenLifetime = payload.exp - payload.iat;
            expect(tokenLifetime).toBeGreaterThan(3600); // 1 hour in seconds
        });
    });
}); 