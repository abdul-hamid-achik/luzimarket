import { defineConfig } from 'vitest/config'
import path from 'path'
import { backendCoverageDir, backendReportsDir, sessionId, sessionDir, isCI } from '../../vitest.config.mjs'

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'node',
        globals: true,
        bail: 1, // Stop on first failure
        include: [
            'src/**/*.{test,spec}.{js,ts}',
            'src/app/api/**/*.spec.ts' // Include API integration tests
        ],
        exclude: [
            'node_modules/**',
            'dist/**',
            '.next/**',
            'src/db/seed.ts', // Exclude seed files
            'src/test/setup.ts', // Exclude setup files
        ],
        // Use globalSetup instead of setupFiles to run once per session
        globalSetup: './src/test/global-setup.ts',
        // Setup file for individual tests (lightweight)
        setupFiles: './src/test/test-setup.ts',
        // Test isolation for API routes - run sequentially to prevent Next.js conflicts
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
                isolate: true,
                minForks: 1,
                maxForks: 1,
            },
        },
        // Reduce parallelism for stability with Next.js API routes
        maxConcurrency: 1,
        fileParallelism: false,
        // Ensure tests run sequentially
        sequence: {
            concurrent: false,
            shuffle: false,
        },
        // Enhanced reporters for CI with session info
        reporters: isCI
            ? ['basic', ['html', { outputFile: path.join(backendReportsDir, 'index.html') }], ['json', { file: path.join(backendReportsDir, 'backend-results.json') }]]
            : ['default', ['html', { outputFile: path.join(backendReportsDir, 'index.html') }]],
        coverage: {
            provider: 'v8',
            reportsDirectory: backendCoverageDir,
            reporter: isCI ? ['text', 'json-summary', 'html'] : ['text', 'html'],
            include: [
                'src/**/*.{ts,tsx}',
            ],
            exclude: [
                'src/**/*.{test,spec}.{ts,tsx}',
                'src/test/**',
                'src/db/seed.ts',
                '**/*.d.ts',
                'src/app/api/**/route.spec.ts'
            ],
            thresholds: {
                global: {
                    branches: 60,
                    functions: 60,
                    lines: 60,
                    statements: 60
                }
            }
        },
        // Environment variables for testing
        env: {
            NODE_ENV: 'test',
            // DB_MODE removed - using PostgreSQL for tests
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test-secret-for-vitest-backend-tests',
            VITEST_SESSION_ID: sessionId,
            CI: process.env.CI || 'false',
            SKIP_STRIPE_CLI: 'true',
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_test_key_for_testing_only',
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_webhook_secret_for_testing_only',
            CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
            VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:8000',
            // DATABASE_URL will be set dynamically by global setup
        },
        // Longer timeouts for database operations
        testTimeout: 30000,
        hookTimeout: 30000,
        // Reduce log noise
        silent: isCI,
    },
}) 