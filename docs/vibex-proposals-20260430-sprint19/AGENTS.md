# AGENTS.md — VibeX Sprint 19 实现指南

## 项目概述

**目标**: 将 `useDesignReview` 中的 `setTimeout(1500)` mock 替换为真实后端 Design Review MCP 集成

**依赖**: Sprint 15 MCP Server Integration (packages/mcp-server)

## 实现顺序

| Sub-task | Agent | 描述 | 依赖 |
|----------|-------|------|------|
| S1 | dev | API Route 桥接层 `/api/mcp/review_design` | 无 |
| S2 | dev | 前端 Hook 接入，移除 mock | S1 |
| S3 | dev | ReviewReportPanel 优雅降级 | S2 |
| S4 | dev | E2E 测试覆盖真实 API 路径 | S1+S2 |

## 关键文件

- **前端 Hook**: `vibex-fronted/src/hooks/useDesignReview.ts`（移除 mock，调用 API）
- **API Route**: `vibex-fronted/src/app/api/mcp/review_design/route.ts`（新增）
- **后端 MCP**: `packages/mcp-server/src/tools/reviewDesign.ts`
- **UI 组件**: `vibex-fronted/src/components/design-review/ReviewReportPanel.tsx`
- **E2E 测试**: `vibex-fronted/tests/e2e/design-review.spec.ts`

## 验收标准

- `tsc --noEmit` → 0 errors
- `grep -r "setTimeout.*1500\|// Mock\|simulated" src/hooks/useDesignReview` → 0 matches
- `pnpm run build` → 0 errors
- E2E 测试通过

## 回滚计划

如 API Route 失败，保留 hook 中的 mock（当前行为）作为降级路径。

## 详细规格

每个 Sub-task 的详细规格见 `specs/E19-1-S{1,2,3,4}-{name}.md`
