# Analysis: vibex-canvas-ux-improvements

**Goal**: Canvas UX 升级 — 状态管理优化 / 列表虚拟化 / 用户引导 Hint 体系

**Priority**: P1  
**Date**: 2026-03-31  
**Analyst**: analyst  
**来源**: architect P001 + PM P001 + 提案汇总

---

## 1. 执行摘要

本项目整合 3 个独立提案，目标是在 Canvas 中实现：
1. **状态管理规范化** — 选区过滤与确认状态分离
2. **列表虚拟化** — 100+ 节点时不卡顿
3. **用户引导体系** — 空状态和功能说明

**推荐方案**: 分 3 个 Epic 实施，总工时 ~20h。

---

## 2. Epic 1: 状态管理规范化

### 2.1 问题描述

Canvas 存在两套独立状态：
- `node.confirmed`（确认状态）— 决定是否参与 AI 生成
- `selectedNodeIds`（选区状态）— 批量操作

但 API 调用完全忽略 `selectedNodeIds`，导致用户 deselect 的卡片仍被发送。

### 2.2 现状

| 文件 | 行 | 问题 |
|------|-----|------|
| `BoundedContextTree.tsx` | 439 | `handleConfirmAll` 确认全部，忽略选区 |
| `canvasStore.ts` | 739 | `autoGenerateFlows` 发送全部 contexts |
| `CanvasPage.tsx` | 458 | `handleContinueToComponents` 发送全部 contexts + flows |
| `BusinessFlowTree.tsx` | 761 | 同上 |

### 2.3 修复方案

在 `handleContinueToComponents` 中增加选区过滤：
```typescript
const selectedContextIds = new Set(selectedNodeIds.context);
const filteredContextNodes = selectedContextIds.size > 0
  ? contextNodes.filter(n => selectedContextIds.has(n.nodeId))
  : contextNodes;
```

**工时**: 2h  
**Epic**: Epic1

---

## 3. Epic 2: 列表虚拟化

### 3.1 问题描述

节点数量 > 100 时，ComponentTree 和 BusinessFlowTree 出现明显卡顿。React Flow 默认渲染所有节点。

### 3.2 现状

当前实现无虚拟化，PAN/ZOOM 操作卡顿。

### 3.3 修复方案

**方案**: 引入 `@tanstack/react-virtual`
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: nodes.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 48,
});
```

**工时**: 5h  
**Epic**: Epic2

### 3.4 验收标准
- [ ] 100 节点渲染时间 < 100ms
- [ ] 500 节点滚动 ≥ 30 FPS

---

## 4. Epic 3: 用户引导体系

### 4.1 问题描述

Canvas 三栏空状态无引导，用户不知道下一步该做什么。

### 4.2 现状

| 位置 | 当前状态 | 评估 |
|------|---------|------|
| BoundedContextTree 空状态 | 有引导文案 | ✅ |
| BusinessFlowTree 空状态 | 有引导文案 | ✅ |
| ComponentTree 空状态 | 无引导 | ❌ |
| 连线类型图例 | 无 | ❌ |
| 节点标记 tooltip | 无 | ❌ |

### 4.3 修复方案

| 功能 | 描述 | 工时 |
|------|------|------|
| S1: ComponentTree 空状态引导 | 补充引导文案 | 0.5h |
| S2: 连线类型图例 | FlowTree 角落增加图例 | 0.5h |
| S3: 节点标记 tooltip | start/end 标记 hover tooltip | 0.5h |
| S4: 快捷键帮助面板 | "?" 键打开快捷键列表 | 0.5h |

**工时**: 2h  
**Epic**: Epic3

---

## 5. 综合实施计划

| Epic | 内容 | 工时 | 优先级 |
|------|------|------|--------|
| Epic1 | 状态管理规范化 | 2h | P0 |
| Epic2 | 列表虚拟化 | 5h | P1 |
| Epic3 | 用户引导体系 | 2h | P1 |

**总工时**: 9h

---

## 6. Epic 1 详细方案

### 6.1 CanvasPage.tsx 修改

```typescript
// handleContinueToComponents
const selectedContextIds = new Set(selectedNodeIds.context);
const filteredContextNodes = selectedContextIds.size > 0
  ? contextNodes.filter(n => selectedContextIds.has(n.nodeId))
  : contextNodes;

const selectedFlowIds = new Set(selectedNodeIds.flow);
const filteredFlowNodes = selectedFlowIds.size > 0
  ? flowNodes.filter(n => selectedFlowIds.has(n.nodeId))
  : flowNodes;

const mappedContexts = filteredContextNodes.map((ctx) => ({...}));
const mappedFlows = filteredFlowNodes.map((f) => ({...}));
```

### 6.2 BusinessFlowTree.tsx 修改

同上，增加选区过滤逻辑。

### 6.3 验收标准

- [ ] 选中部分卡片后点击继续，请求体仅包含选中卡片
- [ ] 未选中时发送全部（向后兼容）
- [ ] 批量删除选中卡片功能正常

---

## 7. 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| Epic1: 状态变更破坏现有功能 | 重构导致 checkbox 行为异常 | 完整 E2E 测试覆盖 |
| Epic2: @tanstack/react-virtual 与 React Flow 冲突 | 节点渲染异常 | 先在小范围验证 |
| Epic3: 空状态文案与实际功能不符 | 用户困惑 | 上线前用 gstack screenshot 验证 |
