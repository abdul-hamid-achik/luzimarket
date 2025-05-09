import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  projects: [
    {
      name: 'backend',
      root: 'apps/backend',
      resolve: { alias: { '@': path.resolve(__dirname, 'apps/backend/src') } },
      test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.spec.ts'],
      },
    },
    {
      name: 'frontend',
      root: 'apps/frontend',
      plugins: [react()],
      resolve: { alias: { '@': path.resolve(__dirname, 'apps/frontend/src') } },
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: 'src/setupTests.js',
        include: ['src/**/*.spec.{js,jsx,ts,tsx}'],
      },
    },
  ],
})