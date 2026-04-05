import { defineConfig } from 'vitest/config';
import path from 'path';

// Config lives in src/hooks/canvas/__tests__/
// Project root is 4 levels up from __tests__
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
      '@vibex/types': path.resolve(projectRoot, '../packages/types/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(projectRoot, 'tests/unit/setup.ts')],
    include: [path.resolve(__dirname, '**/*.test.ts')],
    fakeTimers: {
      enabled: false,
    },
  },
});
