# AGENTS.md: VibeX 2026-04-12 Sprint 开发约束

**Project**: vibex-proposals-20260412
**Stage**: agents-constraints
**Date**: 2026-04-07

---

## Sprint 0 紧急规则

1. **TypeScript 修复**: 禁止 `@ts-ignore`，每次修改后 `pnpm tsc --noEmit`
2. **Auth Mock**: 必须先备份再修改，修复后运行全量测试

## Sprint 1 规则

3. **safeError**: 所有 API 路由 console.log 必须使用 safeError
4. **ErrorBoundary**: 每个 TreePanel 独立包裹，fallback 需重试按钮
5. **@vibex/types**: 新增类型先写入 `packages/types/`，禁止独立定义

## Sprint 2 规则

6. **v0→v1 迁移**: 旧路由保留 Deprecation Header，frontend 同步更新
7. **waitForTimeout**: 重构前记录原写法，保留 flakiness 案例
8. **pre-commit hook**: Husky + ESLint no-console，阻塞 commit

---

## PR 清单

- [ ] `pnpm tsc --noEmit` → 0 error
- [ ] `pnpm test` → 101 tests: 0 failed
- [ ] grep token → 0 leaks
- [ ] Canvas 三栏独立恢复
- [ ] waitForTimeout ≤ 10 处
- [ ] `pnpm playwright test` → all pass
