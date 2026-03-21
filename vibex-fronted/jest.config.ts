import type { Config } from 'jest';

const config: Config = {
  // Setup files - load jest-dom matchers and custom mocks
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
    '<rootDir>/jest.setup.js',
  ],

  // Test environment for React component testing
  testEnvironment: 'jsdom',

  // Transform TypeScript and JSX files with Babel
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },

  // Module alias mappings for cleaner imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.module\\.css$': 'identity-obj-proxy',
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Fake timers configuration
  fakeTimers: {
    enableGlobally: false,
  },

  // CRITICAL: Exclude e2e and performance tests (use Playwright instead)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',      // Playwright e2e tests - not Jest
    '/tests/performance/', // Performance tests - not Jest
    '/tests/basic.spec.ts', // Standalone spec
    '/tests/e2e.spec.ts',   // Standalone spec
    '/.next/',
    '/coverage/',
    '/storybook-static/',
    '/dist/',
    '/build/',
    // Individual problematic files
    'FlowEditor',
    'MermaidCodeEditor',
    'flow/page.test',
    // Legacy e2e directories
    '/e2e/',
  ],

  // Coverage ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'ConfirmationSteps.tsx',
  ],

  // Coverage report formats
  coverageReporters: ['text', 'lcov', 'json', 'json-summary'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 45,
      lines: 55,
      statements: 55,
    },
    './src/components/ui/ConfirmationSteps.tsx': {
      branches: 0,
      functions: 0,
      lines: 0,
    },
    './src/components/ui/Modal.tsx': {
      branches: 10,
      functions: 10,
      lines: 15,
    },
    './src/components/ui/Dropdown.tsx': {
      branches: 10,
      functions: 10,
      lines: 15,
    },
    './src/hooks/**/*.ts': {
      branches: 40,
      functions: 40,
      lines: 40,
    },
    './src/services/**/*.ts': {
      branches: 40,
      functions: 40,
      lines: 45,
    },
    './src/services/github/github-import.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
    },
    './src/services/figma/figma-import.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
    },
    './src/services/oauth/oauth.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
    },
    './src/services/api/diagnosis/index.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
    },
    './src/hooks/useDDDStream.ts': {
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
};

export default config;
