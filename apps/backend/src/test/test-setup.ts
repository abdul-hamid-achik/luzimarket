import { readFileSync } from 'fs';
import path from 'path';
import { sessionDir } from './config';

// Set test environment
(process.env as any).NODE_ENV = 'test';

// Global test users cache for quick access
let testUsers: any = null;

// Load test users from session if they exist
export function getTestUsers() {
    if (testUsers) return testUsers;

    try {
        const authInfoPath = path.join(sessionDir, 'test-auth.json');
        const authData = readFileSync(authInfoPath, 'utf8');
        testUsers = JSON.parse(authData);
        return testUsers;
    } catch (error) {
        // If auth file doesn't exist, tests will create their own auth
        return null;
    }
}

// Setup test database connection
export function setupTestDatabaseConnection() {
    // The global setup should have set DATABASE_URL
    console.log('🔧 Setting up test database connection');
    console.log('🔧 Current DATABASE_URL:', process.env.DATABASE_URL);

    // Force database connection reset if possible
    try {
        // Dynamic import to avoid circular dependencies
        import('../db/index').then(({ resetDatabaseConnection }) => {
            resetDatabaseConnection();
            console.log('🔄 Database connection reset for test');
        }).catch((error) => {
            console.log('ℹ️  Database connection reset failed:', error.message);
        });
    } catch (error) {
        console.log('ℹ️  Database connection reset not available:', error);
    }
}

// Increase max listeners to prevent warnings in test environment
if (typeof process !== 'undefined' && process.setMaxListeners) {
    process.setMaxListeners(100); // Increased limit for concurrent tests and database connections
}

// Event listener cleanup utility
let originalListenerCounts = {
    exit: 0,
    SIGINT: 0,
    SIGTERM: 0,
    uncaughtException: 0,
    unhandledRejection: 0
};

// Store original listener counts on startup
function captureOriginalListenerCounts() {
    originalListenerCounts = {
        exit: process.listenerCount('exit'),
        SIGINT: process.listenerCount('SIGINT'),
        SIGTERM: process.listenerCount('SIGTERM'),
        uncaughtException: process.listenerCount('uncaughtException'),
        unhandledRejection: process.listenerCount('unhandledRejection')
    };
}

// Clean up test-added listeners (simplified approach)
export function cleanupTestListeners() {
    try {
        // Remove all listeners except the original count
        process.removeAllListeners('exit');
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');

        console.log('✅ Test listeners cleaned up');
    } catch (error) {
        console.warn('⚠️  Error cleaning up test listeners:', error);
    }
}

// Capture original listener counts on module load
captureOriginalListenerCounts();

// Suppress specific Next.js unhandled promise rejection warnings in tests
process.on('unhandledRejection', (reason) => {
    // Only suppress specific Next.js errors that don't affect test functionality
    if (reason && typeof reason === 'object' && 'message' in reason) {
        const message = (reason as Error).message;
        if (message?.includes('waitUntil') ||
            message?.includes('AwaiterOnce') ||
            message?.includes('Cannot call waitUntil() on an AwaiterOnce that was already awaited')) {
            // Silently ignore these specific Next.js dev mode errors
            return;
        }
    }
    // Log other unhandled rejections as they might be real issues
    console.error('Unhandled promise rejection in tests:', reason);
});

// Reduce console noise
if (process.env.CI || process.env.VITEST_SILENT) {
    console.log = () => { };
    console.info = () => { };
    console.warn = () => { };
}

// Set up test database connection on module load
setupTestDatabaseConnection(); 