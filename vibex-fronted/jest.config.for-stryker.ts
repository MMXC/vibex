import type { Config } from 'jest';

// Stryker-specific Jest config: excludes .stryker-tmp sandbox copies
// so stryker's initial dry-run doesn't pick up failing sandbox tests
const config: Config = {
  maxWorkers: 2,
  workerIdleMemoryLimit: '512MB',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
    '<rootDir>/jest.setup.js',
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  moduleNameMapper: {
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  fakeTimers: {
    enableGlobally: false,
  },
  // Only test the store test files (what stryker mutates)
  testMatch: [
    '**/src/lib/canvas/stores/*.test.ts',
    '**/src/lib/canvas/stores/*.test.tsx',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
};

export default config;
