---
title: Sprint 19 — Design Review 前端假数据全链路修复
date: 2026-04-30
category: docs/solutions/integration-issues/
module: VibeX Design Review
problem_type: integration_issue
component: frontend_stimulus
severity: critical
symptoms:
  - Ctrl+Shift+R 触发的 Design Review 报告是硬编码假数据
  - 前端 useDesignReview hook 使用 setTimeout(1500) + mockReport
  - 用户看到的 compliance score "3.2:1" 等数字与真实设计状态无关
root_cause: missing_tooling
resolution_type: workflow_improvement
tags: [design-review, mcp, mock-data, frontend-integration, e2e]
---

# Sprint 19 — Design Review 前端假数据全链路修复

## Problem

从 Sprint 9 开始，Design Review 功能就是假的。前端 `useDesignReview` hook 写成了 mock 占位符（`setTimeout(1500)` + 硬编码假数据），标注"等 MCP tool 可用后替换"，但这个替换从未执行。底层 MCP tool `review_design`（`checkDesignCompliance` + `checkA11yCompliance` + `analyzeComponentReuse`）逻辑完整，唯独前端连接层断了。

用户按 Ctrl+Shift+R 看到的评审报告与真实设计状态毫无关系。

## Symptoms

- `grep "setTimeout.*1500" src/hooks/useDesignReview.ts` → 有匹配（mock 占位符）
- `grep "// Mock" src/hooks/useDesignReview.ts` → 有匹配（注释说明占位状态）
- Ctrl+Shift+R 后 panel 立即显示（1500ms 后），数据写死不变
- 后端 `review_design.ts` MCP tool 的 execute handler 存在但从未被前端调用

## What Didn't Work

1. **方案 B（MCP SDK 客户端）**：引入新依赖，MCP SDK 浏览器端支持度未知，实施成本 1-2d
2. **方案 C（child_process spawn MCP）**：每次请求启动进程，性能差，已排除
3. **直接 import backend 逻辑（跨包）**：相对路径 import 脆弱，build 时可能失效

## Solution

通过 Next.js API Route 直调后端逻辑，绕过 MCP stdio transport。

### 核心改动

**新增** `vibex-fronted/src/app/api/mcp/review_design/route.ts`（268 行）：
- POST `/api/mcp/review_design` 接收 `{canvasId, nodes}`
- 内联 3 个 checker 函数（designCompliance / a11yCompliance / componentReuse）
- 返回 `DesignReviewReport` 结构（`summary` + `designCompliance` + `a11y` + `reuse`）
- 400 错误（缺 canvasId）+ 500 错误（服务端异常）

**修改** `src/hooks/useDesignReview.ts`（173 行）：
```typescript
// OLD:
setTimeout(resolve, 1500);
return mockReport;

// NEW:
const response = await fetch('/api/mcp/review_design', {
  method: 'POST',
  body: JSON.stringify({ canvasId }),
});
const data = await response.json();
setResult(data);
```

**修改** `src/components/design-review/ReviewReportPanel.tsx`（218 行）：
- 四态降级：loading / error / empty / success
- 错误文案区分：网络异常 vs 服务端错误
- 重试按钮

**修改** `tests/e2e/design-review.spec.ts`（114 行）：
- TC1: Ctrl+Shift+R 触发 POST `/api/mcp/review_design`
- TC2: 验证结果不包含硬编码 mock 字符串
- TC3–TC4: 降级 + 重试
- TC5–TC7: 回归

### 方案选择理由

选择 API Route 直调而非 MCP stdio：
- `reviewDesign()` 是纯函数，无状态依赖，直接 import 即可
- MCP stdio 需要 `child_process.spawn`，每次请求多一个进程开销
- 架构简单，零新依赖，TypeScript 类型一致

## Why This Works

API Route 作为 HTTP 桥接层，前端通过标准 fetch 调用，不需要 MCP SDK 也不需要 spawn 进程。内联 checker 逻辑避免跨包 import 路径问题。适配层（`DesignReviewReport → DesignReviewResult`）确保接口契约一致。

## Prevention

1. **DoD 必须包含 grep 自检**：`grep -r "setTimeout.*1500\|mock\|simulated" src/hooks/` → 0 matches
2. **E2E 测试必须验证真实 API 路径**，不能只验证 UI 渲染
3. **PRD 审查必须标记 `// TODO` 和 `// Mock` 注释**为 red flag
4. **Analyst 验证应包含 gstack 扫描**，交叉验证代码状态与 CHANGELOG 描述是否一致
5. **建议新增**: 每次 Sprint 交付后，Dev agent 用 grep 扫描全量代码库，标记任何 mock 数据残留

## Related Issues

- `docs/vibex-sprint19-qa/analysis.md` — QA 验证报告
- `docs/solutions/best-practices/vibex-sprint16-mock-driven-dev-patterns-20260428.md` — Mock 驱动开发模式总结