# Feature: ESLint 性能优化

## Jobs-To-Be-Done
- 作为开发者，我希望 `npm run lint` 在 30 秒内完成，以便不阻塞开发反馈循环。

## Requirements
- [ ] (F1.1) package.json lint 脚本添加 `--cache --cache-location node_modules/.cache/eslint/`
- [ ] (F1.2) eslint.config.mjs 或 CLI 添加 `--ignore-pattern 'tests/**'` 完全排除测试文件
- [ ] (F1.3) 验证 `tests/e2e/**` 和 `tests/unit/**` 不再被 ESLint 检查

## Acceptance Criteria
- [ ] AC1: expect(execSync('npm run lint', {cwd: 'vibex-fronted'}).status).toBe(0)
- [ ] AC2: expect(execSync('npm run lint', {cwd: 'vibex-fronted'}).toString()).not.toContain('tests/e2e/')
- [ ] AC3: 第二次执行（cache）< 20s
