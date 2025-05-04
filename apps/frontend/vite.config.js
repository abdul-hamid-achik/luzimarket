import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    // Serve from this folder
    root: '.',

    plugins: [react()],

    server: {
        cors: true,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    },

    build: {
        // Output into dist inside this folder
        outDir: 'dist',
        emptyOutDir: true
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    }
}); 