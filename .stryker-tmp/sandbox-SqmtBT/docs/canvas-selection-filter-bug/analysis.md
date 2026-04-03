# Analysis: canvas-selection-filter-bug

**Bug**: 修复 canvas 选择卡片后点击继续，请求体未只传勾选数据

**Priority**: P0  
**Date**: 2026-03-31  
**Analyst**: analyst  
**备注**: 本分析与 `canvas-card-selection-bug` 为同一问题，已于同期完成分析，文件位于 `../canvas-card-selection-bug/analysis.md`

---

## 1. 执行摘要

多选机制 (`selectedNodeIds`) 与 API 请求体构造完全脱节。用户通过 Ctrl+Click 或批量勾选 deselect 某些卡片后，点击"继续"按钮时后端仍收到全部卡片数据，导致未确认/未选中的卡片被错误包含在请求中。

**根因**: API 调用点均使用 `.map()` 遍历全部节点，未按 `selectedNodeIds` 过滤。

**推荐方案**: 最小修复 — 在 `handleContinueToComponents` 中增加基于 `selectedNodeIds` 的过滤逻辑（~2h）。

详细分析见: [canvas-card-selection-bug/analysis.md](./canvas-card-selection-bug/analysis.md)

---

## 2. 核心问题定位

| 文件 | 行 | 问题 |
|------|-----|------|
| `BoundedContextTree.tsx` | 439 | `handleConfirmAll` 确认全部卡片，忽略选区 |
| `canvasStore.ts` | 739 | `autoGenerateFlows` 发送所有 contexts |
| `CanvasPage.tsx` | 458 | `handleContinueToComponents` 发送全部 contexts + flows |
| `BusinessFlowTree.tsx` | 761 | 同上 |

## 3. 方案对比

| 方案 | 改动范围 | 工时 | 推荐 |
|------|---------|------|------|
| A: 最小修复 | API 调用层过滤 | 1-2h | ✅ |
| B: 增加"确认选中"按钮 | UI + API 层 | 3-4h | |
| C: 完整重构 | 确认状态由选区驱动 | 8-12h | |

## 4. 推荐方案详情

**方案 A (最小修复)**:

在 `handleContinueToComponents` 中增加：

```typescript
const selectedContextIds = new Set(selectedNodeIds.context);
const filteredContextNodes = selectedContextIds.size > 0
  ? contextNodes.filter(n => selectedContextIds.has(n.nodeId))
  : contextNodes;

const selectedFlowIds = new Set(selectedNodeIds.flow);
const filteredFlowNodes = selectedFlowIds.size > 0
  ? flowNodes.filter(n => selectedFlowIds.has(n.nodeId))
  : flowNodes;
```

## 5. 验收标准

| # | 标准 | 验证方法 |
|---|------|----------|
| 1 | 选中部分上下文卡片后点击继续，请求体仅包含选中的卡片 | 手动测试 + 网络拦截 |
| 2 | 未选中任何卡片时，点击继续发送全部卡片 | 手动测试 |
| 3 | 选中部分流程卡片后点击继续，请求体仅包含选中的流程 | 手动测试 |
| 4 | 单卡确认不受影响 | 回归测试 |
| 5 | 批量删除选中的卡片功能正常 | 手动测试 |
| 6 | handleConfirmAll 仍能确认所有未确认卡片 | 手动测试 |

---

*详细代码定位、风险评估、相关文件清单见 `canvas-card-selection-bug/analysis.md`*
