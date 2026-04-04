import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Dependencies
    'node_modules/**',
    // Test and coverage
    'coverage/**',
    'test-results/**',
    'playwright-report/**',
    'reports/**',
    'coverage-history/**',
    // Storybook
    'storybook-static/**',
    // Scripts
    'scripts/**',
    // Docs
    'docs/**',
    // GitHub
    '.github/**',
    '**/*.yml',
    '**/*.yaml',
    '**/*.md',
    // Wrangler
    '.wrangler/**',
    // Tests
    'tests/**',
    // Config files
    '*.config.ts',
    '*.config.mjs',
    'tsconfig*.json',
    // Env files
    '.env*',
    // CSS Module files (parsed incorrectly by ESLint)
    '**/*.module.css',
  ]),
  // E5: 测试文件命名规范
  // Jest: **/*.test.ts | Playwright: **/*.spec.ts
  // 详见 TESTING_STRATEGY.md 命名规范章节

  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // import/no-duplicates: enforce consistent use of duplicate imports
      // E1-S2: Prevents duplicate import statements (spec: "no-duplicate-imports")
      // Note: @typescript-eslint/no-duplicate-imports not available in current version
      // import/no-duplicates from eslint-plugin-import provides equivalent coverage
      'import/no-duplicates': 'error',
      // Allow explicit any for API responses and third-party integrations
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow unused vars for destructuring patterns
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Allow unused expressions (common in React useEffect)
      '@typescript-eslint/no-unused-expressions': 'off',
      // Relax React rules for complex components
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/display-name': 'off',
      'react/no-danger': 'off',
      // Allow require imports for certain patterns
      '@typescript-eslint/no-require-imports': 'off',
      // Allow ESM imports
      'import/no-anonymous-default-export': 'off',
      // Disable React compiler errors
      'react-compiler/react-compiler': 'off',
      // Disable all react-compiler related rules
      'react-compiler': 'off',
      // Disable react-hooks exhaustive deps warnings that become errors
      'react-hooks/exhaustive-deps': 'off',
      // Allow unescaped entities in JSX
      'react/no-unescaped-entities': 'off',
      // Disable React hooks rules that are too strict
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      // Allow Function type
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // Disable Next.js link rule
      '@next/next/no-html-link-for-pages': 'off',
      // Disable all react rules that are too strict
      react: 'off',
    },
  },
]);

export default eslintConfig;
