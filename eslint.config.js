/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    extends: ['next', 'next/core-web-vitals'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['../**'] }],
    },
  },
];
