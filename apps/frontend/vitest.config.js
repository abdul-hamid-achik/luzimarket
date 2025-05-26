import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { frontendCoverageDir, frontendReportsDir, sessionId, isCI, sessionDir } from '../../vitest.config.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Log frontend-specific session info
console.log(`🎨 Frontend Vitest Configuration:`);
console.log(`   Session ID: ${sessionId}`);
console.log(`   Session Dir: ${sessionDir}`);
console.log(`   Coverage Dir: ${frontendCoverageDir}`);
console.log(`   Reports Dir: ${frontendReportsDir}`);
console.log(`   CI Mode: ${isCI}`);

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.spec.{js,jsx,ts,tsx}'],
        setupFiles: [path.resolve(__dirname, 'src', 'vitest.setup.ts')],
        // Ensure complete test isolation
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
                isolate: true,
            },
        },
        // Force isolation between tests
        isolate: true,
        sequence: {
            shuffle: false,
            concurrent: false,
        },
        // Reduce memory usage and ensure stability
        maxConcurrency: 1,
        fileParallelism: false,
        // Enhanced reporters for CI with session info
        reporters: isCI
            ? [['html', { outputFile: path.join(frontendReportsDir, 'index.html') }], ['json', { file: path.join(frontendReportsDir, 'frontend-results.json') }]]
            : ['verbose', ['html', { outputFile: path.join(frontendReportsDir, 'index.html') }]],
        // Session-based coverage configuration (enabled automatically in CI)
        coverage: {
            enabled: isCI, // Enable coverage automatically in CI
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: frontendCoverageDir,
            include: [
                'src/**/*.{js,jsx,ts,tsx}',
            ],
            exclude: [
                'node_modules/**',
                'dist/**',
                'build/**',
                '**/*.d.ts',
                'vitest.setup.ts',
                'src/mocks/**',
                'src/**/*.spec.{js,jsx,ts,tsx}',
                'src/**/*.test.{js,jsx,ts,tsx}',
                // Exclude common non-testable files
                '**/index.{js,ts}', // barrel exports
                '**/*.config.{js,ts}',
                '**/*.stories.{js,jsx,ts,tsx}',
            ],
            // Coverage thresholds for frontend
            thresholds: {
                global: {
                    statements: 75,
                    branches: 70,
                    functions: 75,
                    lines: 75
                }
            },
            // Additional V8 coverage options for CI
            ...(isCI && {
                all: true,
                skipFull: false,
                reportOnFailure: true,
            })
        },
        // CSS and asset handling
        css: {
            modules: {
                classNameStrategy: 'non-scoped'
            }
        },
        // Environment variables for testing
        env: {
            NODE_ENV: 'test',
            VITEST_SESSION_ID: sessionId,
        },
        // Additional test environment options
        testTimeout: 10000,
        hookTimeout: 10000,
    },
}) 