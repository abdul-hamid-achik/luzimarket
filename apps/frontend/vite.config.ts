import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const port = process.env.PORT || 8080;
const apiUrl = process.env.VITE_API_URL || `http://localhost:${port}`;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@web',
        replacement: path.resolve(__dirname, 'src'),
      },
      {
        find: '@/',
        replacement: path.resolve(__dirname, 'src') + '/',
      },
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});