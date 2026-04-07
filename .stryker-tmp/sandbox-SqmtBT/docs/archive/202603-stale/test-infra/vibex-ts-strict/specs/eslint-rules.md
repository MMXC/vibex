# Feature: ESLint Type Rules

## Jobs-To-Be-Done
- 作为**开发者**，我希望**ESLint 强制执行类型规范**，以便**防止 `any` 类型回流**。

## User Stories
- US1: ESLint 配置 `@typescript-eslint/no-explicit-any: error`
- US2: ESLint 配置 `@typescript-eslint/no-unsafe-assignment: error`
- US3: pre-commit hook 阻止违规代码提交

## Requirements
- [ ] (F3.1) ESLint 配置 `@typescript-eslint/no-explicit-any: error`
- [ ] (F3.2) ESLint 配置 `@typescript-eslint/no-unsafe-assignment: error`
- [ ] (F3.3) ESLint 配置 `@typescript-eslint/no-unsafe-return: error`
- [ ] (F3.4) lint-staged 配置阻止违规代码提交
- [ ] (F3.5) CI 中包含 `npm run lint -- --max-warnings=0`

## Technical Notes
- 将现有 `off` 改为 `error`
- 需要先完成 F2（类型断言清理）再启用，否则 CI 会失败

## Acceptance Criteria
- [ ] `expect(eslintConfig).toContain('no-explicit-any: error')`
- [ ] `expect(exec('npm run lint 2>&1').exitCode).toBe(0)`
