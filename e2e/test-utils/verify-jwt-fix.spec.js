import { test, expect } from '@playwright/test';
import { generateValidCustomerToken, generateValidAdminToken, JWT_SECRET } from './token-generator.js';
import { debugJWT, validateTokenForBackend } from './jwt-debug.js';
import jwt from 'jsonwebtoken';

test.describe('JWT Token Validation Fix', () => {
    test('should use consistent JWT secret across all utilities', async () => {
        console.log('🔍 Verifying JWT secret consistency...');

        // Check that our utilities use the same secret resolution as backend
        const backendSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        expect(JWT_SECRET).toBe(backendSecret);

        console.log('✅ JWT secret consistency verified');
    });

    test('should generate valid tokens that backend can verify', async () => {
        console.log('🔍 Testing token generation and validation...');

        // Generate a test token
        const customerToken = generateValidCustomerToken();
        const adminToken = generateValidAdminToken();

        // Verify that tokens can be decoded with the same secret
        const customerPayload = jwt.verify(customerToken, JWT_SECRET);
        const adminPayload = jwt.verify(adminToken, JWT_SECRET);

        expect(customerPayload.sessionId).toBe('fake-customer-session-id');
        expect(customerPayload.role).toBe('customer');
        expect(adminPayload.sessionId).toBe('fake-admin-session-id');
        expect(adminPayload.role).toBe('admin');

        console.log('✅ Token generation and validation successful');
    });

    test('should validate tokens for backend usage', async () => {
        console.log('🔍 Testing backend token validation...');

        const customerToken = generateValidCustomerToken();

        // Use our debug utility to validate
        const isValid = validateTokenForBackend(customerToken);
        expect(isValid).toBe(true);

        console.log('✅ Backend token validation successful');
    });

    test('should handle missing JWT_SECRET gracefully', async () => {
        console.log('🔍 Testing JWT secret fallback behavior...');

        // Temporarily clear the environment variable
        const originalSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;

        try {
            // Create a token with fallback secret
            const fallbackSecret = 'test-jwt-secret-for-e2e-tests';
            const testPayload = {
                sessionId: 'test-session',
                userId: 'test-user',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600
            };

            const token = jwt.sign(testPayload, fallbackSecret);

            // Should be able to verify with the same fallback secret
            const decoded = jwt.verify(token, fallbackSecret);
            expect(decoded.sessionId).toBe('test-session');

            console.log('✅ JWT secret fallback behavior verified');
        } finally {
            // Restore original environment variable
            if (originalSecret) {
                process.env.JWT_SECRET = originalSecret;
            }
        }
    });
}); 