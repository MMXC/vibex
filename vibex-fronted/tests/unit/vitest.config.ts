import { defineConfig } from 'vitest/config';
import path from 'path';

const rootDir = path.resolve(__dirname, '..', '..');

export default defineConfig({
  // Aliases at root level (Vite convention)
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      '@vibex/types': path.resolve(rootDir, '../packages/types/src'),
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.spec.ts',
      'src/hooks/**/*.test.ts',
    ],

    // Coverage thresholds matching the original jest config
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      reporter: ['text', 'lcov', 'json', 'json-summary'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
        '**/storybook-static/**',
        'ConfirmationSteps.tsx',
      ],
    },

    // Fake timers opt-in
    fakeTimers: {
      enabled: false,
    },
  },
});
