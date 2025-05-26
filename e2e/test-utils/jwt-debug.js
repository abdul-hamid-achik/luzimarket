import jwt from 'jsonwebtoken';

// Use the same JWT secret resolution pattern that the backend uses
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';

/**
 * Debug utility to decode and validate JWT tokens
 */
export function debugJWT(token, secretToTry = null) {
    const secret = secretToTry || JWT_SECRET;

    console.log('🔍 JWT Debug Information:');
    console.log('📝 JWT Secret being used:', secret);
    console.log('🎫 Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'NO TOKEN');

    if (!token) {
        console.log('❌ No token provided');
        return null;
    }

    try {
        // Decode without verification to see payload
        const decoded = jwt.decode(token, { complete: true });
        console.log('📋 Token header:', decoded?.header);
        console.log('📋 Token payload:', decoded?.payload);
        console.log('📋 Token signature:', decoded?.signature?.substring(0, 20) + '...');

        // Try to verify with the current secret
        const verified = jwt.verify(token, secret);
        console.log('✅ Token verification successful');
        console.log('👤 Verified payload:', verified);
        return verified;
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);

        // Try with the fallback secret if we weren't already using it
        if (secretToTry !== 'test-jwt-secret-for-e2e-tests') {
            console.log('🔄 Trying with fallback secret...');
            return debugJWT(token, 'test-jwt-secret-for-e2e-tests');
        }

        return null;
    }
}

/**
 * Extract and debug tokens from storage state files
 */
export function debugStorageState(storageStatePath) {
    const fs = require('fs');
    const path = require('path');

    console.log('🔍 Debugging storage state:', storageStatePath);

    if (!fs.existsSync(storageStatePath)) {
        console.log('❌ Storage state file not found');
        return;
    }

    const storageState = JSON.parse(fs.readFileSync(storageStatePath, 'utf8'));
    const origin = storageState.origins?.[0];

    if (!origin) {
        console.log('❌ No origins found in storage state');
        return;
    }

    console.log('🌐 Origin:', origin.origin);

    // Check localStorage tokens
    console.log('\n📦 LocalStorage tokens:');
    origin.localStorage?.forEach(item => {
        if (item.name.includes('token') || item.name.includes('auth')) {
            console.log(`  🔑 ${item.name}:`);
            debugJWT(item.value);
        }
    });

    // Check sessionStorage tokens
    console.log('\n📦 SessionStorage tokens:');
    origin.sessionStorage?.forEach(item => {
        if (item.name.includes('token') || item.name.includes('auth')) {
            console.log(`  🔑 ${item.name}:`);
            debugJWT(item.value);
        }
    });
}

/**
 * Validate that a token can be used with the current backend configuration
 */
export function validateTokenForBackend(token) {
    console.log('🏥 Validating token for backend usage...');

    const result = debugJWT(token);

    if (!result) {
        console.log('❌ Token cannot be used with backend - invalid signature');
        return false;
    }

    // Check required fields for backend
    const requiredFields = ['sessionId'];
    const missingFields = requiredFields.filter(field => !result[field]);

    if (missingFields.length > 0) {
        console.log('❌ Token missing required fields for backend:', missingFields);
        return false;
    }

    console.log('✅ Token is valid for backend usage');
    return true;
}

export { JWT_SECRET }; 