# 分析文档: vibex-canvas-component-group

> **约束红线**: 不改业务逻辑，只分析根因
> **分析时间**: 2026-03-29
> **Analyst**: Subagent

---

## 一、需求概述

| # | 需求 | 描述 |
|---|------|------|
| R1 | 组件树页面分组 | Canvas 组件树没有按页面归属用虚线框分组，类似限界上下文的虚线框效果 |
| R2 | 通用组件分组 | 用户/web/app 通用组件单独框起来，通用组件应第一个展示 |
| R3 | 错误提示自动消失 | 错误提示需要手动关闭，改为延迟 3s 自动消失 |

---

## 二、根因分析

### 2.1 组件树渲染方式

**关键文件**:
- `vibex-fronted/src/components/canvas/ComponentTree.tsx` — 主渲染入口
- `vibex-fronted/src/components/canvas/ComponentTreeCard.tsx` — 卡片渲染（备用）
- `vibex-fronted/src/components/canvas/CanvasPage.tsx` — 画布容器
- `vibex-fronted/src/lib/canvas/canvasStore.ts` — 状态管理
- `vibex-fronted/src/lib/canvas/types.ts` — 类型定义

**当前展示方式**: **扁平垂直列表**，非树形。

```tsx
// ComponentTree.tsx L469-478
componentNodes.map((node) => (
  <ComponentCard
    key={node.nodeId}
    node={node}
    onConfirm={confirmComponentNode}
    onEdit={editComponentNode}
    onDelete={deleteComponentNode}
    readonly={readonly}
  />
))
```

每个 `ComponentNode` 渲染为一个独立卡片，无任何分组包裹，无层级结构。

---

### 2.2 页面归属数据来源分析

**根因**: `ComponentNode.flowId` 存在，但组件树渲染层未使用它做分组。

#### 数据链路

```
ComponentNode.flowId (string)
  → BusinessFlowNode.nodeId (通过 canvasStore.flowNodes 查找)
  → BusinessFlowNode.contextId
  → BoundedContextNode.name (页面名称)
```

#### 现有字段

`ComponentNode` 类型定义:
```typescript
export interface ComponentNode {
  nodeId: string;
  flowId: string;         // ← 关联到 BusinessFlowNode.nodeId
  name: string;
  type: ComponentType;     // 'page' | 'form' | 'list' | 'detail' | 'modal'
  props: Record<string, unknown>;
  api: ComponentApi;
  children: string[];
  parentId?: string;
  confirmed: boolean;
  status: NodeStatus;
  previewUrl?: string;
}
```

**关键问题**:
- `flowId` 字段存在，但在 `ComponentTree.tsx` 渲染时**完全未被使用**
- Mock 生成时所有组件的 `flowId` 统一为 `'mock'` (L26-58)，无真实页面归属
- 真实 API 生成时 `flowId` 来自后端 `comp.flowId`，但后端需要确认是否有 pageName/pageId 映射

#### 后端 API 确认点

`canvasApi.ts` L186:
```typescript
flowId: comp.flowId ?? 'mock',
```

API 响应格式 (`GenerateComponentsOutput`):
```typescript
export interface GenerateComponentsOutput {
  success: boolean;
  components: Array<{
    name: string;
    flowId: string;         // ← 存在
    type: ComponentType;
    description?: string;
    api?: { ... };
  }>;
  confidence: number;
  error?: string;
}
```

**分析结论**: `flowId` 是现成的分组依据，但 UI 层从未按它分组。需要确认后端 `comp.flowId` 是否能正确映射到页面名（通过 `flowNodes` 查找 `BusinessFlowNode.name`）。

---

### 2.3 通用组件识别逻辑

**根因**: `ComponentNode` 类型中**不存在** `isCommon`、`isShared`、`isUniversal` 等通用组件标识字段。

现有 `type` 枚举仅包含: `'page' | 'form' | 'list' | 'detail' | 'modal'`

限界上下文有 `generic` 类型:
```typescript
// types.ts L38
type: 'core' | 'supporting' | 'generic' | 'external';
```

但组件树无对应标识。

**可能的识别策略** (需要 PM 决策):
1. **新增字段**: `ComponentNode.isCommon?: boolean`
2. **类型推断**: 某些组件类型（如 `'modal'`）天然偏通用，但不够精确
3. **用户手动标记**: 在组件编辑表单中提供"标记为通用组件"选项
4. **AI 推断**: 后端生成组件时自动判断是否为通用组件

---

### 2.4 虚线框设计模式（已有参考实现）

**现有虚线框实现**: `vibex-fronted/src/components/canvas/groups/BoundedGroupOverlay.tsx`

这是限界上下文树和流程树的虚线框实现，完全可复用于组件树。

#### 架构

```
canvasStore.boundedGroups: BoundedGroup[]
         ↓
BoundedGroupOverlay (SVG 层)
         ↓
虚线矩形 (stroke-dasharray: '5 3')
         + 标签徽章
```

#### 类型定义

```typescript
export interface BoundedGroup {
  groupId: string;
  label: string;              // 显示名称，如"页面1"或"通用组件"
  treeType: TreeType;         // 'context' | 'flow' | 'component'
  nodeIds: string[];          // 属于该组的节点 ID
  color?: string;
  visible?: boolean;
}
```

#### 关键常量 (types.ts)

```typescript
export const BOUNDED_GROUP_COLORS: Record<TreeType, string> = {
  context: '#f59e0b',    // amber
  flow: '#3b82f6',       // blue
  component: '#10b981',  // green ← 组件树配色
};

export const DEFAULT_GROUP_STROKE_DASHARRAY = '5 3';
export const DEFAULT_GROUP_STROKE_WIDTH = 1.5;
export const DEFAULT_GROUP_PADDING = 12;
```

**结论**: 虚线框的视觉设计、SVG 渲染逻辑、bbox 计算逻辑均已实现，组件树可直接复用 `BoundedGroupOverlay`，只需在渲染时注入对应 `boundedGroups`。

---

### 2.5 错误提示自动消失机制

**关键文件**: `vibex-fronted/src/components/ui/Toast.tsx`

**根因**: `showToast` 中 `type='error'` 的默认 `duration` 为 `0`，导致不触发自动消失定时器。

#### 当前逻辑

```typescript
const defaultDuration =
  type === 'success' ? 3000
  : type === 'warning' ? 5000
  : 0;  // ← error 和 info 默认不自动消失

// L59-64: 只有 duration > 0 才设置定时器
if (toast.duration && toast.duration > 0) {
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, toast.duration);
}
```

#### 错误 toast 调用点

| 文件 | 调用 | 类型 |
|------|------|------|
| `ComponentTree.tsx:127` | `showToast('该组件暂无预览链接...', 'error')` | 未传 duration |
| `ComponentTreeCard.tsx:64` | `showToast('该组件暂无预览链接', 'error')` | 未传 duration |
| `ErrorMiddleware.ts:78` | `showToast(fullConfig.userMessage)` | 未传 type |
| `useApiCall.ts:202` | `showToast(..., 'error')` | 未传 duration |
| `useApiCall.ts:304` | `showToast(..., toastType)` | toastType 可能为 error |

#### 修复方案

最简单的方案: 将 `error` 的默认 duration 改为 `3000`。

```typescript
// 修改前
const defaultDuration =
  type === 'success' ? 3000
  : type === 'warning' ? 5000
  : 0;

// 修改后
const defaultDuration =
  type === 'success' ? 3000
  : type === 'warning' ? 5000
  : 3000;  // error 也 3s 自动消失
```

---

## 三、架构影响分析

### 3.1 组件树页面分组 (R1)

| 维度 | 分析 |
|------|------|
| **数据依赖** | `ComponentNode.flowId` → `flowNodes[].name` |
| **渲染改动** | `ComponentTree` 需要按 `flowId` 分组渲染，加上 `BoundedGroupOverlay` |
| **分组逻辑** | 按 `flowId` 相同值归为同一组 |
| **实现位置** | `ComponentTree.tsx` 或新组件 `ComponentTreeGrouped.tsx` |
| **复杂度** | 中等 — 已有 `BoundedGroupOverlay` 可复用 |

### 3.2 通用组件分组 (R2)

| 维度 | 分析 |
|------|------|
| **数据依赖** | `ComponentNode` 无 `isCommon` 字段，需新增或通过 `flowId='common'` 约定 |
| **渲染改动** | 在分组逻辑中单独处理 `isCommon=true` 的组件，放在列表最前面 |
| **分组逻辑** | 需要新增字段或约定分组 key |
| **实现位置** | 同上 |
| **复杂度** | 中高 — 需要确定通用组件识别策略 |

### 3.3 错误提示自动消失 (R3)

| 维度 | 分析 |
|------|------|
| **数据依赖** | 无 |
| **渲染改动** | 仅改 `Toast.tsx` 一行 |
| **影响范围** | 所有 error toast — 可能影响用户体验，需确认 |
| **实现位置** | `Toast.tsx` 的 `showToast` 函数 |
| **复杂度** | 低 — 一行代码改动 |

---

## 四、实现建议

### R3 错误提示（优先级最高，改动最小）

```
文件: vibex-fronted/src/components/ui/Toast.tsx
改动: L55-57，将 error 默认 duration 改为 3000
预计工时: 0.5h
```

### R1 组件树页面分组（优先级高，需 PRD 确认分组策略）

```
文件: vibex-fronted/src/components/canvas/ComponentTree.tsx
      vibex-fronted/src/components/canvas/groups/BoundedGroupOverlay.tsx
改动: 
  1. ComponentTree 按 flowId 分组渲染
  2. 调用 addBoundedGroup 创建页面组
  3. BoundedGroupOverlay 已支持 component 树类型，无需改动
预计工时: 4-6h
```

### R2 通用组件分组（优先级中，需新增字段）

```
文件: vibex-fronted/src/lib/canvas/types.ts
      vibex-fronted/src/components/canvas/ComponentTree.tsx
      后端 API 响应格式
改动:
  1. ComponentNode 新增 isCommon?: boolean
  2. 分组逻辑优先处理 isCommon=true 的组件
  3. BoundedGroupOverlay 显示"通用组件"标签
预计工时: 6-8h（包含后端字段新增）
```

---

## 五、附录

### A. 相关文件索引

| 文件路径 | 用途 |
|----------|------|
| `vibex-fronted/src/components/canvas/ComponentTree.tsx` | 组件树主渲染逻辑 |
| `vibex-fronted/src/components/canvas/ComponentTreeCard.tsx` | 组件卡片渲染 |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | 画布容器，组件树挂载点 |
| `vibex-fronted/src/components/canvas/groups/BoundedGroupOverlay.tsx` | 虚线框 SVG 覆盖层（可复用） |
| `vibex-fronted/src/components/ui/Toast.tsx` | Toast 提示组件 |
| `vibex-fronted/src/lib/canvas/canvasStore.ts` | 状态管理，含 boundedGroups |
| `vibex-fronted/src/lib/canvas/types.ts` | 类型定义，含 BoundedGroup 接口 |
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | 组件生成 API 调用 |

### B. BoundedGroup 数据结构

```typescript
interface BoundedGroup {
  groupId: string;      // 唯一 ID，如 'page-订单管理'
  label: string;         // 显示名，如 '页面1: 订单管理'
  treeType: 'component'; // 固定为 'component'
  nodeIds: string[];     // 属于该组的 componentNode.nodeId 列表
  color?: string;        // 虚线颜色，默认 '#10b981' (green)
  visible?: boolean;
}
```

### C. Toast duration 现状

| type | 默认 duration | 是否自动消失 |
|------|-------------|------------|
| success | 3000ms | ✅ 是 |
| warning | 5000ms | ✅ 是 |
| error | **0ms** | ❌ 否（手动关闭）|
| info | **0ms** | ❌ 否（手动关闭）|
