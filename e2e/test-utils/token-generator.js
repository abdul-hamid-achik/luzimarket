import jwt from 'jsonwebtoken';

// Use the same JWT secret resolution pattern that the backend uses
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';

function generateValidEmployeeToken() {
    const payload = {
        sessionId: 'fake-employee-session-id',
        userId: 'fake-employee-user-id',
        role: 'employee',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, JWT_SECRET);
}

function generateValidCustomerToken() {
    const payload = {
        sessionId: 'fake-customer-session-id',
        userId: 'fake-customer-user-id',
        role: 'customer',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, JWT_SECRET);
}

function generateValidAdminToken() {
    const payload = {
        sessionId: 'fake-admin-session-id',
        userId: 'fake-admin-user-id',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, JWT_SECRET);
}

function generateValidGuestToken() {
    const payload = {
        sessionId: 'fake-guest-session-id',
        isGuest: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, JWT_SECRET);
}

export {
    generateValidEmployeeToken,
    generateValidCustomerToken,
    generateValidAdminToken,
    generateValidGuestToken,
    JWT_SECRET
}; 