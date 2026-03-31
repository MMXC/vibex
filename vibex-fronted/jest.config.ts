import type { Config } from 'jest';

const config: Config = {
  // Limit workers to avoid OOM on memory-heavy test suites (e.g. CardTreeView)
  maxWorkers: 2,
  workerIdleMemoryLimit: '512MB',

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
  // CSS patterns MUST come before @/ alias (first match wins)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moduleNameMapper: ({
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  } as any) as Config['moduleNameMapper'],

  // Fake timers configuration
  fakeTimers: {
    enableGlobally: false,
  },

  // CRITICAL: Exclude e2e and performance tests (use Playwright instead)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/performance/',
    '/tests/basic.spec.ts',
    '/tests/e2e.spec.ts',
    '/.next/',
    '/coverage/',
    '/storybook-static/',
    '/dist/',
    '/build/',
    'FlowEditor',
    'MermaidCodeEditor',
    'flow/page.test',
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
    // Required by Jest types; actual thresholds are per-path
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    // Canvas directory: low threshold (rapidly evolving area)
    './src/components/canvas/**': {
      branches: 30,
      functions: 40,
      lines: 50,
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
    // Individual service thresholds (glob removed to allow per-file override)
    './src/services/api/client.ts': {
      branches: 50,
      functions: 60,
      lines: 60,
    },
    './src/services/api/cache.ts': {
      branches: 60,
      functions: 60,
      lines: 80,
    },
    './src/services/api/retry.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
    },
    './src/services/api/unwrappers.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
    },
    './src/services/homepageAPI.ts': {
      branches: 70,
      functions: 80,
      lines: 85,
    },
    './src/services/themeStorage.ts': {
      branches: 65,
      functions: 65,
      lines: 80,
    },
    // stream-service.ts: SSE streaming with complex async callbacks — integration-tested only
    './src/services/ddd/stream-service.ts': {
      branches: 5,
      functions: 10,
      lines: 10,
    },
    './src/services/github/github-import.ts': {
      branches: 10,
      functions: 10,
      lines: 35,
    },
    './src/services/figma/figma-import.ts': {
      branches: 5,
      functions: 5,
      lines: 10,
    },
    './src/services/oauth/oauth.ts': {
      branches: 10,
      functions: 15,
      lines: 30,
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
