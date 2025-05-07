// Jest configuration for frontend (CommonJS)
/** @type {import('jest').Config} */
module.exports = {
  displayName: 'frontend',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  // Store Jest cache inside the workspace to avoid OS temp permissions issues
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)']
};