/**
 * Vitest config for catalog unit tests (Node.js environment).
 * Runs outside the jsdom React component test environment.
 */
import { defineConfig } from 'vitest/config';
import path from 'path';

const rootDir = path.resolve(__dirname);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/design-catalog.test.ts'],
  },
});
