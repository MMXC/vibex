import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Disallow console.log/error/warn/info in production code.
  // Use devLog() / safeError() from @/lib/log-sanitizer instead.
  {
    rules: {
      // Allow console.log in log-sanitizer (it IS the logging utility)
      "no-console": ["error", { allow: ["warn", "error", "log"] }],
    },
  },
]);

export default eslintConfig;
