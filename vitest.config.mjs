import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate session-specific directories for Vitest (similar to Playwright setup)
const generateVitestSessionDirectories = () => {
    const sessionId = process.env.VITEST_SESSION_ID || process.env.PLAYWRIGHT_SESSION_ID || crypto.randomUUID().substring(0, 8);

    // Store session ID for other processes
    process.env.VITEST_SESSION_ID = sessionId;

    // Create test-results/test-session-{uuid} structure under root tmp directory
    // Always use the project root, not the current working directory
    const rootDir = path.resolve(__dirname);
    const sessionDir = path.join(rootDir, 'tmp', 'test-results', `test-session-${sessionId}`);

    const directories = {
        sessionDir,
        sessionId,
        coverageDir: path.join(sessionDir, 'coverage'),
        frontendCoverageDir: path.join(sessionDir, 'coverage', 'frontend'),
        backendCoverageDir: path.join(sessionDir, 'coverage', 'backend'),
        vitestReportsDir: path.join(sessionDir, 'vitest-reports'),
        frontendReportsDir: path.join(sessionDir, 'vitest-reports', 'frontend'),
        backendReportsDir: path.join(sessionDir, 'vitest-reports', 'backend'),
        vitestResultsDir: path.join(sessionDir, 'vitest-results')
    };

    return directories;
};

const {
    sessionDir,
    sessionId,
    coverageDir,
    frontendCoverageDir,
    backendCoverageDir,
    vitestReportsDir,
    frontendReportsDir,
    backendReportsDir,
    vitestResultsDir
} = generateVitestSessionDirectories();

// Check if we're in CI environment
const isCI = process.env.CI === 'true';

console.log(`🧪 Vitest session: ${sessionId} (CI: ${isCI})`);
console.log(`📁 Session directory: ${sessionDir}`);
console.log(`📁 Coverage directory: ${coverageDir}`);
console.log(`📁 Frontend coverage: ${frontendCoverageDir}`);
console.log(`📁 Backend coverage: ${backendCoverageDir}`);
console.log(`📁 Vitest reports: ${vitestReportsDir}`);

// Create all session directories
[sessionDir, coverageDir, frontendCoverageDir, backendCoverageDir, vitestReportsDir, frontendReportsDir, backendReportsDir, vitestResultsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Initialize coverage info file
const coverageInfoFile = path.join(sessionDir, 'coverage-info.json');
const coverageInfo = {
    sessionId,
    timestamp: new Date().toISOString(),
    environment: isCI ? 'ci' : 'local',
    directories: {
        session: sessionDir,
        coverage: coverageDir,
        frontendCoverage: frontendCoverageDir,
        backendCoverage: backendCoverageDir,
        vitestReports: vitestReportsDir,
        frontendReports: frontendReportsDir,
        backendReports: backendReportsDir,
        vitestResults: vitestResultsDir
    },
    configuration: {
        isCI,
        coverageEnabled: isCI,
        nodeEnv: process.env.NODE_ENV,
        projectRoot: path.resolve(__dirname)
    }
};

fs.writeFileSync(coverageInfoFile, JSON.stringify(coverageInfo, null, 2));
console.log('📝 Coverage info saved to:', coverageInfoFile);

export {
    sessionId,
    sessionDir,
    coverageDir,
    frontendCoverageDir,
    backendCoverageDir,
    vitestReportsDir,
    frontendReportsDir,
    backendReportsDir,
    vitestResultsDir,
    isCI
}; 