# VibeX Sprint24 经验沉淀

> 收口时间: 2026-05-03 | 项目: vibex-proposals-sprint24

## 项目概述

5 个 Epic 完成:
- **P001** Slack Webhook Dry-run（E2E 测试验证）
- **P002** TypeScript Debt 确认（遗留类型清理）
- **P003** Onboarding 新手指引（NewUserGuide 集成）
- **P004** API Module Tests（≥60% 覆盖率门槛）
- **P005** Canvas 对比（canvasDiff 算法）

## 核心经验

### 1. API 测试覆盖率门槛设计
P004 成功在 CI 设置了 ≥60% 覆盖率门槛，测试分布在 `src/lib/canvas/api/__tests__/` 和 `src/services/api/modules/__tests__/`。
**经验**: 覆盖率门槛必须配合 `canvasApiValidation.test.ts`（19 个测试）和 `canvasApi.test.ts`（35 个测试）才能稳定通过。

### 2. Canvas 对比功能的测试先行
P005 的 `canvasDiff.test.ts`（6 测试）和 `canvasApi` 错误路径测试先于功能开发完成，
确保 skeleton loading 和 diff 算法的健壮性。修复了 `e62f161fc` 中的 skeleton + algorithm bug。

### 3. Onboarding 的 data-testid 去重
P003 发现 `data-testid` 属性重复导致测试不稳定，通过 `dedupe data-testid` 修复。
NewUserGuide 集成到 DDSCanvasPage 后，需确认 data-testid 在整个引导流程中唯一。

### 4. CHANGELOG 管理规范
每个 Epic 完成后都需单独更新 CHANGELOG.md 的 `## [Unreleased]` 区块。
154 条 CHANGELOG 条目，需定期归档到版本 tag。

## 质量门禁

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 所有 Epic dev commit | ✅ | 5/5 commit 存在 |
| 单元测试通过 | ✅ | P004/P005 72 测试 PASS |
| CHANGELOG 更新 | ✅ | 154 entries，包含所有 5 Epic |
| 远程 origin/main | ✅ | 已 fetch 并验证 |

## 未解决问题

- `Button.test.tsx` 和 `MermaidRenderer.test.tsx` 有少量遗留失败（非本次 sprint 引入）
- `src/components/guide/NewUserGuide.test.tsx` 缺失（建议后续补全）

## 可复用模式

1. **覆盖率门槛**: `CI unit job` + `canvasApi.test.ts` 组合适合作为其他 API 模块测试的模板
2. **Canvas diff**: `canvasDiff.test.ts` 的算法验证模式可推广到其他可视化组件
3. **Onboarding 集成**: NewUserGuide → DDSCanvasPage 的集成模式适合其他 guide 组件
