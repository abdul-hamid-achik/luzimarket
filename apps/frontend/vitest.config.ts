import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

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
        // Memory and performance optimizations
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
        // Reduce memory usage
        maxConcurrency: 1,
        fileParallelism: false,
        // Faster feedback, less memory usage
        reporters: process.env.CI ? ['basic'] : ['verbose'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: 'coverage',
            exclude: ['node_modules/', 'dist/'],
        },
    },
}) 