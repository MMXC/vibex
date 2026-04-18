---
title: Sprint QA 持续发现 Stub 未替换 — 结构性数据流断链
date: 2026-04-18
category: docs/solutions/workflow-issues/
module: VibeX Delivery Canvas
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - Sprint 阶段完成后的 QA 验证
  - 多 store 数据流集成时
  - 新功能模块首次与已有 store 对接时
tags:
  - stub-replacement
  - data-flow
  - sprint-qa
  - delivery-canvas
  - store-integration
---

# Sprint QA 持续发现 Stub 未替换 — 结构性数据流断链

## Context

VibeX 的 DDS Canvas Sprint（Sprint 2/5/6）历经多个迭代，QA 在每次 sprint 后都发现**结构性 stub 未替换**问题：

| Sprint | 发现的问题 | 影响 Epic |
|--------|-----------|-----------|
| Sprint 5 QA | `loadMockData()` 未替换为 `loadFromStores()` | E1 |
| Sprint 5 QA | `exportItem()` / `exportAll()` 为 stub，无文件下载 | E4 |
| Sprint 5 QA | `generatePRD()` 函数不存在，使用硬编码 mock 文案 | E4 |
| Sprint 6 QA | `CodingAgentService.mockAgentCall()` 为 stub，核心 TODO 未实现 | E2 |
| Sprint 6 QA | `app/canvas/delivery/version/page.tsx` 路由页面缺失 | E3 |

所有 stub 均在实现阶段存在，QA 阶段才被发现。**无一例外。**

## Guidance

### 1. Stub 必须带 Issue 追踪，禁止裸 TODO

任何 `// TODO` 或 `// Replace with` 注释必须关联 issue，不允许存在无追踪的 stub。

```typescript
// ❌ 裸 stub（无法追踪）
export async function exportItem(type: ExportType) {
  // TODO: Replace with real API call
}

// ✅ 带追踪的 stub
// BLOCKER: vibex-p0-q2-sprint1 E4 export — 需接入 /api/delivery/export
// Tracking: https://github.com/xxx/issues/XXX
export async function exportItem(type: ExportType) {
  throw new Error('STUB: exportItem not implemented — see tracking issue');
}
```

### 2. Sprint QA 前增加「Stub 替换」专项检查

在 sprint 结束前的 AGENTS.md 自检清单中增加：

```bash
# 检查所有 TODO stub（禁止在 Sprint close 前存在无追踪 TODO）
grep -rn "TODO.*Replace\|TODO.*implement\|STUB\|mockAgentCall\|loadMockData\|exportItem" \
  src/components/ src/stores/ src/services/ \
  --include="*.ts" --include="*.tsx" | grep -v "__tests__"
```

**禁止裸 TODO 通过 Sprint close gate。**

### 3. 多 store 数据流集成必须显式验证

当新功能需要从多个 store（`prototypeStore` + `DDSCanvasStore` + `deliveryStore`）拉取数据时：

```bash
# 必须验证 loadFromStores 被调用（而非 loadMockData）
grep -n "loadFromStores\|loadMockData" delivery/page.tsx
# 预期：loadFromStores 存在且被调用，loadMockData 为 0

# 必须验证 store selector 正确
grep -n "prototypeStore\|ddsStore" src/components/delivery/
```

### 4. 每个 Epic 必须包含至少 1 个单元测试

E4（PRD融合）和 E5（状态处理）在 Sprint 5 完成后测试覆盖为 0，直接导致 BLOCKER 缺陷漏过。

**规则**：Epic 完成的标准之一是对应功能有单元测试保护。

### 5. 路由页面与组件同步交付

组件存在（测试通过）但路由页面不存在是持续出现的模式。

**规则**：组件和路由页面必须在同一个 Epic 中完成，不得分 Sprint 交付。

```bash
# 验收前必须执行
find src/app -name "page.tsx" | sort
# 确认所有 Spec 中列出的路由页面均存在
```

## Why This Matters

Sprint QA 每次都能发现 stub 问题，说明这不是偶发失误，而是**流程缺口**。Stub 在开发阶段是合理的工程选择（支持 UI 开发/测试独立进行），但无追踪的 stub 会在 Sprint close 后被遗忘，最终影响用户功能。

QA 发现 stub = 功能实际上线不了 = Sprint 交付物水分大。

## When to Apply

- Sprint 自检清单（每次 commit 前）
- Sprint close 前（必须通过 Stub 替换检查）
- 多 store 集成场景（delivery/page.tsx 等跨 store 组件）
- 新组件完成后（确认路由页面 + 组件同步存在）

## Examples

### Stub 追踪模板

```typescript
// src/services/coding/CodingAgentService.ts
// BLOCKER: vibex-sprint6 E2 AI Coding — sessions_spawn 跨进程边界，需后端 HTTP API 桥接
// Tracking: https://github.com/xxx/issues/YYY
export async function mockAgentCall(task: string): Promise<AgentMessage[]> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return [{ /* mock response */ }];
}
```

### 路由页面存在性验证

```bash
# E3 version-diff
SPEC_ROUTES=(
  "app/canvas/delivery/version/page.tsx"
  "app/canvas/delivery/export/page.tsx"
)

for route in "${SPEC_ROUTES[@]}"; do
  if [ ! -f "$route" ]; then
    echo "BLOCKER: $route not found — component has no route"
    exit 1
  fi
done
```

## Related

- [vibex-canvas-silent-400](vibex-canvas-silent-400.md) — async/await 和静默错误处理
- [vibex-auth-401-handling](vibex-auth-401-handling.md) — API 错误处理统一模式
- Sprint 5 QA Final Report: `docs/vibex-sprint5-delivery-integration-qa/qa-final-report.md`
- Sprint 6 QA Final Report: `docs/vibex-sprint6-ai-coding-integration-qa/`
