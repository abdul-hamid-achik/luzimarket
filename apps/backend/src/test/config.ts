import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

// Generate session-specific directories for backend API tests
function generateBackendSessionDirectories() {
    const sessionId = process.env.VITEST_SESSION_ID || `backend-${randomUUID().substring(0, 8)}`;

    // Create test-results structure under backend
    const backendDir = process.cwd();
    const sessionDir = path.join(backendDir, '..', '..', 'tmp', 'test-results', `test-session-${sessionId}`);

    const directories = {
        sessionDir,
        sessionId,
        coverageDir: path.join(sessionDir, 'coverage', 'backend'),
        vitestReportsDir: path.join(sessionDir, 'vitest-reports', 'backend'),
    };

    // Create directories
    [sessionDir, directories.coverageDir, directories.vitestReportsDir].forEach(dir => {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    });

    return directories;
}

export const { sessionDir, sessionId, coverageDir, vitestReportsDir } = generateBackendSessionDirectories();
export const isCI = process.env.CI === 'true'; 