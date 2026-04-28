# AGENTS.md — Sprint 17 开发约束

**项目**: vibex-proposals-20260428-sprint17
**Sprint**: S17
**日期**: 2026-04-29

---

## 开发约束总览

### Epic 1: 验证收尾

**S17-P0-1 E2E 覆盖率补全**：
- 测试文件路径：`vibex-fronted/tests/e2e/code-generator-e2e.spec.ts`（新建）
- 测试文件路径：`vibex-fronted/tests/e2e/design-review.spec.ts`（补充）
- 禁止在 E2E 测试中使用 `page.evaluate()` mock 数据，必须使用真实 Zustand store 数据
- Framework selector 测试需覆盖 React/Vue/Solid 三种输出

**S17-P1-1 MCP Tool Registry 收尾**：
- `/health` 端点路径：`packages/mcp-server/src/routes/health.ts`
- 索引脚本路径：`scripts/generate-tool-index.ts`（独立可运行）
- 索引输出路径：`docs/mcp-tools/INDEX.md`

### Epic 2: 集成深化

**S17-P1-2 Firebase 真实集成验证**：
- Benchmark 脚本路径：`vibex-fronted/benchmark/firebase-benchmark.ts`
- PresenceAvatars 降级：`isFirebaseConfigured() === false` 时不渲染任何 DOM
- 5 用户并发测试使用 Playwright 多 context

### Epic 3: 技术深化

**S17-P2-1 TypeScript noUncheckedIndexedAccess**：
- 配置修改：`tsconfig.json` + `vibex-fronted/tsconfig.json`
- 修复顺序：先 `packages/dds/`（约 30 files），再 `vibex-fronted/src/`（按 import 依赖）
- 修复方式：`Array[index]` → `Array[index] ?? defaultValue` 或 `Array.at(index)`
- 禁止使用 `as` 类型断言绕过检查

**S17-P2-2 Analytics Dashboard E2E 验证**：
- 测试文件：`vibex-fronted/tests/e2e/analytics-dashboard.spec.ts`（补充）
- 必须覆盖 FunnelWidget 渲染 + useFunnelQuery 数据流

---

## 技术约束

1. **无破坏性变更**：所有修改向后兼容，不改变现有 API 契约
2. **E2E 测试幂等性**：可重复运行不产生 side effect
3. **Firebase mock 降级**：无 Firebase 配置时功能正常降级
4. **tsc --noEmit 0 errors**：所有修改后必须通过类型检查

---

## 验收命令

| Epic | 命令 |
|------|------|
| E1 | `pnpm playwright test code-generator-e2e.spec.ts design-review.spec.ts` |
| E1 | `node scripts/generate-tool-index.ts && curl localhost:3100/health` |
| E2 | `node benchmark/firebase-benchmark.ts` |
| E2 | `pnpm playwright test firebase-presence.spec.ts` |
| E3 | `pnpm exec tsc --noEmit` |
| E3 | `pnpm playwright test analytics-dashboard.spec.ts` |
