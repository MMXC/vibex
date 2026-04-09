import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "reports/**",
    "coverage-history/**",
    "storybook-static/**",
    "scripts/**",
    "docs/**",
    ".github/**",
    "**/*.yml",
    "**/*.yaml",
    "**/*.md",
    ".wrangler/**",
    "tests/**",
    "src/**/*.test.*",
    "src/**/__tests__/**",
    "*.config.ts",
    "*.config.mjs",
    "tsconfig*.json",
    ".env*",
    "**/*.module.css",
  ]),
  // F-3.3: 测试文件豁免 dddApi 限制（向后兼容迁移期）
  {
    files: ["**/*.test.*", "**/__tests__/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    rules: {
      "import/no-duplicates": "error",
      // F-3.3: 禁止从 dddApi 导入（已废弃，统一使用 canvasSseApi）
      // 测试文件豁免：在测试中允许 dddApi 引用（向后兼容）
      // 注意：使用 ESLint 内置的 no-restricted-imports
      "no-restricted-imports": [
        "error",
        {
          name: "@/lib/canvas/api/dddApi",
          message:
            "@deprecated dddApi 已废弃。请使用 @/lib/canvas/api/canvasSseApi 替代。详见 docs/vibex-canvas-analysis/dddApi-migration.md",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      // E6: block console.log/warn/error in non-test files
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/display-name": "off",
      "react/no-danger": "off",
      "@typescript-eslint/no-require-imports": "off",
      "import/no-anonymous-default-export": "off",
      "react-compiler/react-compiler": "off",
      "react-compiler": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@next/next/no-html-link-for-pages": "off",
      react: "off",
    },
  },
]);

export default eslintConfig;
