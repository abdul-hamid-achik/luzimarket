import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            protocolImports: false,
            overrides: {
                net: path.resolve(__dirname, 'src/shims/net.js'),
                path: path.resolve(__dirname, 'src/shims/path.js'),
                url: path.resolve(__dirname, 'src/shims/url.js'),
            }
        }),
    ],

    server: {
        cors: true,
        proxy: {
            '/api': {
                target: 'http://localhost:6000',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, '')
            },
            '/admin/graphql': {
                target: 'http://localhost:6000',
                changeOrigin: true,
                secure: false
            }
        }
    },

    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            'path': path.resolve(__dirname, 'src/shims/path.js'),
            'net': path.resolve(__dirname, 'src/shims/net.js'),
            'url': path.resolve(__dirname, 'src/shims/url.js'),
        },
        preferBuiltins: false,
    }
}); 