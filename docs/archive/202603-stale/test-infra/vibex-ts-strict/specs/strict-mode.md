# Feature: Strict Mode Enablement

## Jobs-To-Be-Done
- 作为**开发者**，我希望**启用 TypeScript strict 模式**，以便**在编译时发现更多潜在问题**。

## User Stories
- US1: 在 tsconfig.json 中启用 strict 相关选项
- US2: 运行 `tsc --noEmit` 确认无编译错误

## Requirements
- [ ] (F1.1) tsconfig.json 启用 `"strict": true`
- [ ] (F1.2) 启用 `"noImplicitAny": true`
- [ ] (F1.3) 启用 `"strictNullChecks": true`
- [ ] (F1.4) 启用 `"strictFunctionTypes": true`
- [ ] (F1.5) 启用 `"noUnusedLocals": true` 和 `"noUnusedParameters": true`

## Technical Notes
- 建议在 CI 中添加 `tsc --noEmit` 检查
- 分阶段启用可以减少突然的大规模错误

## Acceptance Criteria
- [ ] `expect(tsconfig.compilerOptions.strict).toBe(true)`
- [ ] `expect(tsconfig.compilerOptions.noImplicitAny).toBe(true)`
- [ ] `expect(exec('npx tsc --noEmit 2>&1').exitCode).toBe(0)`
