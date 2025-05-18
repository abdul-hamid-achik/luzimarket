const path = require('path');
const js = require('@eslint/js');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const importPlugin = require('eslint-plugin-import');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    settings: {
      react: { version: '18.2' },
      'import/resolver': {
        alias: {
          map: [
            ['@/pagina_principal', path.resolve(__dirname, 'src/pages/pagina_principal')],
            ['@/empleados', path.resolve(__dirname, 'src/pages/empleados')],
            ['@/assets', path.resolve(__dirname, 'src/assets')],
            ['@', path.resolve(__dirname, 'src')],
          ],
          extensions: ['.js', '.jsx', '.json'],
        },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { varsIgnorePattern: '^(React$|set.*|handle.*|iniciarSesion)' }],
      'import/no-unresolved': 'error',
    },
  },
  {
    files: ['src/pagina_principal/**'],
    rules: {
      'import/no-unresolved': 'off',
      'react/jsx-no-undef': 'off',
      'no-undef': 'off',
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': 'off',
    },
  },
];
