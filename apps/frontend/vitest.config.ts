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
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: 'coverage',
            exclude: ['node_modules/', 'dist/'],
        },
    },
}) 