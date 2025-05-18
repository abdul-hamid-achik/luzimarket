/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    rules: {
      'no-restricted-imports': ['error', { patterns: ['../**'] }],
    },
  },
];
