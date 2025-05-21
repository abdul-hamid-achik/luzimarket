/** @type {import('eslint').Linter.FlatConfig[]} */
const next = require('eslint-plugin-next').configs['core-web-vitals'];

module.exports = [
  next,
  {
    rules: {
      'no-restricted-imports': ['error', { patterns: ['../**'] }],
    },
  },
];
