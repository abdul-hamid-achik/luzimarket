import { writeFileSync } from 'fs';
import path from 'path';
import { sessionId, sessionDir } from './config';

// Lightweight setup - only creates auth file if missing
// Heavy database work is now done in global setup

// Create test users and tokens
async function setupAuth() {
    try {
        console.log('Setting up test authentication...');

        // Test user credentials
        const testUsers = {
            customer: {
                email: `test-customer-${sessionId}@example.com`,
                password: 'TestPassword123!',
                name: 'Test Customer'
            },
            admin: {
                email: `test-admin-${sessionId}@example.com`,
                password: 'AdminPassword123!',
                name: 'Test Admin'
            }
        };

        // Store test users for use in tests
        const authInfoPath = path.join(sessionDir, 'test-auth.json');
        writeFileSync(authInfoPath, JSON.stringify(testUsers, null, 2));

        console.log('✅ Auth setup complete!');
        console.log(`📝 Test users saved to: ${authInfoPath}`);

        return testUsers;
    } catch (error) {
        console.error('❌ Auth setup failed:', error);
        throw error;
    }
}

// Main setup function - now only handles auth setup
export default async function setup() {
    try {
        // Setup authentication (database is handled in global setup)
        await setupAuth();

        console.log('✅ Auth setup complete!');
    } catch (error) {
        console.error('❌ Auth setup failed:', error);
        process.exit(1);
    }
} 