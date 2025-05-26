/** @type {import('eslint').Linter.FlatConfig[]} */
const next = require('eslint-plugin-next').configs['core-web-vitals'];

module.exports = [
  {
    ignores: [
      '.next/**',
      'dist/**',
      'build/**',
      'node_modules/**',
      'coverage/**',
      '**/*.min.js',
      '**/vendor/**'
    ]
  },
  next,
  {
    rules: {
      'no-restricted-imports': ['error', { patterns: ['../**'] }],
    },
  },
];
