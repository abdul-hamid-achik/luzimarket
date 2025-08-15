// Flat ESLint config enabling Next.js rules and our custom i18n plugin
import { defineConfig } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import i18n from './lib/custom-eslint-plugins/i18n/index.mjs';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

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
      'i18n/messages-sorted': 'warn', // Temporarily downgrade from error to warning
      'i18n/no-missing-keys': 'error',
    },
  },

  // TypeScript type checking rules
  {
    name: 'luzimarket/typescript',
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Type-aware rules that catch type errors
      // '@typescript-eslint/no-unused-vars': 'error',
      // '@typescript-eslint/no-explicit-any': 'warn',
      // '@typescript-eslint/prefer-nullish-coalescing': 'error',
      // '@typescript-eslint/prefer-optional-chain': 'error',
      // '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      // '@typescript-eslint/no-floating-promises': 'error',
      // '@typescript-eslint/await-thenable': 'error',
      // '@typescript-eslint/no-misused-promises': 'error',
      // '@typescript-eslint/require-await': 'warn',
      // '@typescript-eslint/no-unsafe-assignment': 'warn',
      // '@typescript-eslint/no-unsafe-call': 'warn',
      // '@typescript-eslint/no-unsafe-member-access': 'warn',
      // '@typescript-eslint/no-unsafe-return': 'warn',
    },
  },
]);
