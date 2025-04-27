/**
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testEnvironmentOptions: {},
  testMatch: ['**/*.test.ts'],
  rootDir: './',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Add path mapping to resolve @/ imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // Use a separate tsconfig for Jest to skip type errors
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      diagnostics: false
    }]
  },
  // Store Jest cache inside the backend folder to avoid OS temp permissions issues
  cacheDirectory: '<rootDir>/node_modules/.cache/jest'
};