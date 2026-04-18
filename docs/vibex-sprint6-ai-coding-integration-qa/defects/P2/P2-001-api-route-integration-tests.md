# P2-001: API Route 无 Integration 测试

**严重性**: P2 (测试覆盖)
**Epic**: E1, E2
**Spec 引用**: analyst-qa-report.md §4 单元测试覆盖验证

## 问题描述

所有测试都是纯逻辑测试，无 Integration 测试（无 mock HTTP 层的 API route 测试）。`/api/chat` 和 `/api/figma` 的端到端行为无测试保护。

## 修复建议

补充 API route 的 Integration 测试（使用 Next.js test helpers）。

## 影响范围

- `app/api/chat/route.test.ts`（建议新增）
- `app/api/figma/route.test.ts`（建议新增）
