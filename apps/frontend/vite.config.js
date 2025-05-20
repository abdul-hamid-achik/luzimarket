import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

// Use environment variable to disable native Rollup on Node.js 22
const disableNativeRollup = process.env.ROLLUP_NATIVE_DISABLE ||
    process.versions.node.startsWith('22.');

if (disableNativeRollup) {
    process.env.ROLLUP_NATIVE_DISABLE = '1';
    console.log('Native Rollup plugins disabled due to Node.js 22 compatibility');
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        nodePolyfills()
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/app': path.resolve(__dirname, './src/app.jsx'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/pages': path.resolve(__dirname, './src/pages'),
            '@/context': path.resolve(__dirname, './src/context'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/api': path.resolve(__dirname, './src/api'),
            '@/assets': path.resolve(__dirname, './src/assets')
        }
    },
    build: {
        rollupOptions: {
            // Disable experimental features that might cause issues
            experimentalLogSideEffects: false,
            // Use WASM instead of native code for better compatibility
            preferBuiltins: false,
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    // Split large libraries into separate chunks
                    ui: ['@mui/material', '@mui/icons-material', '@chakra-ui/react', '@emotion/react', '@emotion/styled']
                }
            }
        },
        // Increase memory limit for the build
        chunkSizeWarningLimit: 1600,
        // Add build-time environment variables
        commonjsOptions: {
            include: [/node_modules/],
            extensions: ['.js', '.cjs']
        }
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false
            }
        }
    }
}); 