import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Root-level Vite config for frontend workspace
export default defineConfig({
  // Use absolute path for root so it resolves correctly no matter the cwd
  root: path.resolve(__dirname, 'apps/frontend'),
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    // Use absolute path for outDir so build goes to the right folder
    outDir: path.resolve(__dirname, 'apps/frontend/dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/frontend/src')
    }
  }
});