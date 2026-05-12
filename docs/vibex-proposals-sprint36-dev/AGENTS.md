# VibeX Sprint 36 — AGENTS 执行清单

**版本**: v1.0
**日期**: 2026-05-11
**Agent**: architect

---

## 1. Epic → Agent 分配

| Epic | Dev Agent | Tester Agent | Reviewer Agent |
|------|-----------|-------------|----------------|
| E1: 多人协作 MVP | dev | tester | reviewer |
| E2: 模板市场 MVP | dev | tester | reviewer |
| E3: MCP DoD CI Gate | dev | tester | reviewer |
| E4: 撤销重做 Toolbar | dev | tester | reviewer |
| E5: Design Review E2E | dev | tester | reviewer |

---

## 2. 每个 Epic 的 Agent 流程

```
dev-E1 → tester-E1 → reviewer-E1 → reviewer-push-E1
dev-E2 → tester-E2 → reviewer-E2 → reviewer-push-E2
dev-E3 → tester-E3 → reviewer-E3 → reviewer-push-E3
dev-E4 → tester-E4 → reviewer-E4 → reviewer-push-E4
dev-E5 → tester-E5 → reviewer-E5 → reviewer-push-E5
```

---

## 3. Epic 约束（Dev Agent）

### E1: 多人协作 MVP
- **工作区**: `/root/.openclaw/vibex`
- **前端目录**: `vibex-fronted/src/pages/DDSCanvasPage.tsx`
- **E2E 测试**: `vibex-fronted/e2e/presence-mvp.spec.ts`
- **约束**:
  - RemoteCursor 使用 `isFirebaseConfigured()` 条件守卫
  - `useRealtimeSync({ projectId, userId })` 调用位置在 DDSCanvasPage
  - E2E 测试需在 Firebase mock 模式下运行
  - RemoteCursor 位置更新延迟 < 3s

### E2: 模板市场 MVP
- **工作区**: `/root/.openclaw/vibex`
- **API 路由**: `vibex-fronted/src/app/api/marketplace/templates/route.ts`
- **Dashboard**: `vibex-fronted/src/app/dashboard/templates/page.tsx`
- **E2E 测试**: `vibex-fronted/e2e/templates-market.spec.ts`
- **约束**:
  - API 返回 200 且字段完整（id/name/description/thumbnail/category/tags）
  - Industry 筛选器前端过滤生效

### E3: MCP DoD CI Gate
- **工作区**: `/root/vibex-workbench`
- **工具脚本**: `tools/generate-tool-index.ts`
- **约束**:
  - 生成 `tool-index.json`（含 tool name/description/path/mcp_capabilities）
  - CI pipeline 中包含 tool-index 验证 step
  - `pnpm generate:tool-index` 命令可用

### E4: 撤销重做 Toolbar 补全
- **工作区**: `/root/.openclaw/vibex`
- **组件文件**: `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`
- **约束**:
  - Undo/Redo 按钮点击调用 `history.undo()/history.redo()`
  - 按钮 disabled 状态根据历史记录正确切换

### E5: Design Review E2E 补全
- **工作区**: `/root/.openclaw/vibex`
- **E2E 测试**: `vibex-fronted/e2e/design-review-degradation.spec.ts`, `design-review-tabs.spec.ts`
- **约束**:
  - 降级路径测试: Firebase 未配置时 UI 正常展示
  - 三 Tab 测试: Comments / Suggestions / Approved 切换正常

---

## 4. 通用 Agent 约束

- 所有 Epic commit 使用 `feat(E#): <description>` 格式
- 每个 Epic 需在 CHANGELOG.md 添加 `[Unreleased]` 条目
- TypeScript 类型检查: `pnpm exec tsc --noEmit` 零错误
- E2E 测试: `pnpm playwright test` 全通过
- Commit 前运行 pre-commit hook（eslint + lint-staged）
- Push 到 `origin/main`（reviewer-push 阶段）

---

## 5. 实现顺序建议

```
1. E3 (0.5d) — CI Gate（独立）
2. E4 (0.5d) — Toolbar（独立）
3. E2 (2-3d) — 模板市场（backend + frontend）
4. E1 (3-5d) — 多人协作（核心）
5. E5 (1d) — Design Review E2E
```

E4 可与 E2/E1 并行开发。E5 可在任意时间完成。
