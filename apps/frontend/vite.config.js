import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

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
        port: 3000
    }
}); 