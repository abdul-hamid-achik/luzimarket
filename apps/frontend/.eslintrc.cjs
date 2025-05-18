const path = require('path');

module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: '18.2' },
    'import/resolver': {
      alias: {
        map: [
          ['@/inicio', path.resolve(__dirname, 'src/pages/inicio')],
          ['@/empleados', path.resolve(__dirname, 'src/pages/empleados')],
          ['@/assets', path.resolve(__dirname, 'src/assets')],
          ['@', path.resolve(__dirname, 'src')]
        ],
        extensions: ['.js', '.jsx', '.json']
      }
    }
  },
  plugins: ['react-refresh', 'import'],
  rules: {
    'react-refresh/only-export-components': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': ['error', { varsIgnorePattern: '^(React$|set.*|handle.*|iniciarSesion)' }],
    'import/no-unresolved': 'error'
  },
  overrides: [
    {
      files: ['src/inicio/**'],
      rules: {
        'import/no-unresolved': 'off',
        'react/jsx-no-undef': 'off',
        'no-undef': 'off',
        'react/no-unescaped-entities': 'off',
        'no-unused-vars': 'off'
      }
    }
  ],
};
