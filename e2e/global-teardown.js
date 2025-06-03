const fs = require('fs');
const path = require('path');

// Global teardown function
module.exports = async () => {
    console.log('Starting global teardown for E2E tests...');
    console.log('Global teardown: Using PostgreSQL (online mode)');

    try {
        console.log('Global teardown: Cleaning up test session...');
        const sessionId = process.env.PLAYWRIGHT_SESSION_ID;

        if (sessionId) {
            const sessionDir = path.join(__dirname, '..', 'tmp', 'test-results', `test-session-${sessionId}`);

            if (fs.existsSync(sessionDir)) {
                console.log(`Global teardown: Cleaning up session ${sessionId}: ${sessionDir}`);

                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log(`Global teardown: Session ${sessionId} cleaned up successfully`);
                } catch (error) {
                    console.warn(`Global teardown: Failed to clean up session ${sessionId}:`, error.message);
                }
            } else {
                console.log(`Global teardown: Session directory not found: ${sessionDir}`);
            }
        } else {
            console.log('Global teardown: No session ID found, cleaning up any old session folders...');

            // Fallback: Clean up any orphaned session folders
            const testResultsDir = path.join(__dirname, '..', 'tmp', 'test-results');
            if (fs.existsSync(testResultsDir)) {
                const items = fs.readdirSync(testResultsDir);

                for (const item of items) {
                    if (item.startsWith('test-session-')) {
                        const itemPath = path.join(testResultsDir, item);
                        try {
                            fs.rmSync(itemPath, { recursive: true, force: true });
                            console.log(`Global teardown: Cleaned up orphaned session: ${item}`);
                        } catch (error) {
                            console.warn(`Global teardown: Failed to clean up orphaned session ${item}:`, error.message);
                        }
                    }
                }
            }
        }

        console.log('Global teardown: Session cleanup complete!');
    } catch (error) {
        console.error('Global teardown: Error during cleanup:', error);
        // Don't throw error, just log it as cleanup failures shouldn't break the test process
    }

    console.log('Global teardown complete!');
}; 