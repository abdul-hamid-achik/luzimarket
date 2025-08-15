// Flat ESLint config enabling Next.js rules and our custom i18n plugin
import { defineConfig } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import i18n from './lib/custom-eslint-plugins/i18n/index.mjs';

// Bridge old-style "extends" (eslintrc) configs into flat config
const compat = new FlatCompat({ baseDirectory: process.cwd() });

export default defineConfig([
  // Ignore generated and vendor files
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/public/**',
      '**/playwright-report/**',
      '**/e2e/**',
      '**/test-results/**',
      '**/tmp/**',
      '**/.vercel/**',
    ],
  },

  // Bring in Next.js recommended rules via compat
  ...compat.extends('next/core-web-vitals'),

  // Project-wide i18n rules
  {
    name: 'luzimarket/i18n',
    plugins: { i18n },
    rules: {
      'i18n/messages-parity': 'error',
      'i18n/messages-sorted': 'error',
      'i18n/no-missing-keys': 'error',
    },
  },
]);
