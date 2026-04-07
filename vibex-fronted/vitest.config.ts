// Root vitest config — delegates to tests/unit/vitest.config.ts for shared aliases + environment
import { defineConfig } from 'vitest/config';
import path from 'path';

const rootDir = path.resolve(__dirname);

export default defineConfig({
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
      'tests/unit/**/*.test.tsx',
      'tests/unit/**/*.spec.ts',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
    ],
  },
});
