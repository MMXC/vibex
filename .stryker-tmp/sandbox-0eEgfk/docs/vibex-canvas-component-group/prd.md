# PRD: VibeX Canvas 组件树分组增强

**项目**: vibex-canvas-component-group
**版本**: 1.0
**日期**: 2026-03-29
**状态**: Draft
**Epic 数量**: 3
**总预计工时**: 10.5h ~ 14.5h

---

## 1. 执行摘要

### 背景

VibeX Canvas 的组件树（ComponentTree）目前以扁平列表展示所有组件节点，存在以下体验问题：

1. **无分组隔离** — 来自不同页面的组件混在一起，无法快速区分组件归属
2. **通用组件不突出** — 用户/web/app 通用组件未视觉隔离
3. **错误提示需手动关闭** — error 类型的 Toast 不会自动消失，用户体验差

### 目标

| ID | 目标 |
|----|------|
| R1 | 按页面归属（flowId）用虚线框分组组件节点，视觉上与限界上下文树一致 |
| R2 | 通用组件（isCommon）单独分组并置顶展示 |
| R3 | error 类型 Toast 延迟 3s 自动消失，无需手动关闭 |

### 关键验收指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 组件树分组数 | 0 | ≥1（按 flowId 分组） |
| 通用组件独立分组 | ❌ | ✅ |
| error Toast 自动消失率 | 0% | 100%（3s 后自动消失） |
| 虚线框配色 | 无 | green (#10b981) |

---

## 2. Epic E1: 组件树页面分组（R1）

**Feature ID**: `E1-F1` / `E1-F2` / `E1-F3`
**优先级**: P1
**预计工时**: 4-6h
**依赖**: 无

### 背景

`ComponentNode.flowId` 字段已存在，指向关联的 `BusinessFlowNode.nodeId`。通过 `canvasStore.flowNodes` 可查到对应的页面名称。当前渲染层（`ComponentTree.tsx`）直接 `map` 渲染，完全未使用该字段做分组。

### 数据链路

```
ComponentNode.flowId
  → canvasStore.flowNodes[.nodeId === flowId]
  → BusinessFlowNode.name  （页面名称用作分组标签）
```

### F1.1: ComponentTree 分组渲染逻辑

**描述**: 修改 `ComponentTree.tsx` 渲染逻辑，按 `flowId` 分组组件节点，调用 `canvasStore.addBoundedGroup` 创建分组。

**实现要点**:

1. **分组计算**: 在渲染前按 `flowId` 对 `componentNodes` 分组
2. **页面名称解析**: 对每个 flowId，通过 `flowNodes` 查找 `BusinessFlowNode.name`，若找不到则显示 "未知页面"
3. **BoundedGroup 注册**: 对每个分组调用 `canvasStore.addBoundedGroup`:
   ```typescript
   addBoundedGroup({
     label: `📄 ${pageName}`,
     treeType: 'component',
     nodeIds: groupNodeIds,
     color: '#10b981',
     visible: true,
   });
   ```
4. **渲染顺序**: 按 flowId 分组依次渲染，每组内组件节点垂直排列
5. **通用组件特殊处理**: `isCommon === true` 的节点不参与页面分组，由 F1.2 单独处理

**验收标准**:

```typescript
// E1-F1.1: flowId 相同时归为同一组
const grouped = groupByFlowId(mockNodes);
expect(grouped['flow-1'].length).toBe(2);
expect(grouped['flow-2'].length).toBe(1);

// E1-F1.2: flowId 找不到时标记为"未知页面"
expect(getPageLabel('unknown-id', flowNodes)).toBe('未知页面');

// E1-F1.3: 分组后 BoundedGroup 已注册到 store
expect(addBoundedGroup).toHaveBeenCalledWith(
  expect.objectContaining({
    label: expect.stringContaining('首页'),
    treeType: 'component',
    color: '#10b981',
  })
);

// E1-F1.4: 组件树 DOM 中存在分组容器元素
const { container } = render(<ComponentTree ... />);
const groups = container.querySelectorAll('[data-component-group]');
expect(groups.length).toBeGreaterThanOrEqual(1);
```

### F1.2: 页面虚线框 SVG 叠加层

**描述**: 复用 `BoundedGroupOverlay` 在组件树面板上渲染虚线框。组件树卡片使用 flex 布局，需要额外计算 DOM bbox 而非依赖 ReactFlow position。

**技术方案**:

方案 A（推荐）: **CSS 定位方案** — 在 `BoundedGroupOverlay` 之外，新建 `ComponentGroupOverlay.tsx`，通过 `getBoundingClientRect()` 计算每组第一个/最后一个卡片的 DOM 位置，渲染绝对定位的 SVG 虚线框。

方案 B: **Zustand + ReactFlow position** — 在 `CanvasPage.tsx` 中给 `ComponentTree` 内的每个卡片设置 `data-node-id` 属性，并维护一个 `componentCardPositions: Record<string, DOMRect>` map，通过 `useEffect` + `querySelectorAll('[data-node-id]')` 同步卡片位置到 store，再传给 `BoundedGroupOverlay`。

**推荐方案 A**，原因：
- 不需要修改 `CanvasPage.tsx`（减少回归风险）
- 组件自包含，符合单一职责
- DOM bbox 计算在现代浏览器中足够快（~100 cards < 5ms）

**验收标准**:

```typescript
// E1-F2.1: 组件树面板内存在 SVG 虚线框
const { container } = render(<ComponentTree ... />);
const svgRects = container.querySelectorAll('svg rect[stroke-dasharray]');
expect(svgRects.length).toBeGreaterThanOrEqual(1);

// E1-F2.2: 虚线框 stroke-dasharray 为 '5 3'
const dashArray = svgRects[0].getAttribute('stroke-dasharray');
expect(dashArray).toBe('5 3');

// E1-F2.3: 虚线框颜色为 green (#10b981)
const strokeColor = svgRects[0].getAttribute('stroke');
expect(strokeColor).toBe('#10b981');

// E1-F2.4: 分组标签显示页面名称
const labels = container.querySelectorAll('[data-group-label]');
expect(labels[0].textContent).toMatch(/首页|未知页面/);
```

### F1.3: 页面分组 UI 样式

**描述**: 分组容器 CSS 样式，与 `BoundedContextGroup.tsx` 风格保持一致。

**CSS 规范**:

```css
/* .component-group */
.component-group {
  margin-bottom: 16px;
  border: 1px dashed #10b981;
  border-radius: 8px;
  padding: 8px;
  background: rgba(16, 185, 129, 0.03);
}

/* .component-group-label */
.component-group-label {
  font-size: 12px;
  font-weight: 500;
  color: #10b981;
  margin-bottom: 8px;
  padding: 2px 8px;
  border: 1px solid #10b981;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.08);
  display: inline-block;
}
```

**验收标准**:

```typescript
// E1-F3.1: 分组容器有虚线边框
const group = container.querySelector('.component-group');
expect(group).not.toBeNull();
expect(getComputedStyle(group!).borderStyle).toBe('dashed');

// E1-F3.2: 分组容器圆角为 8px
expect(getComputedStyle(group!).borderRadius).toBe('8px');
```

---

## 3. Epic E2: 通用组件独立分组（R2）

**Feature ID**: `E2-F1` / `E2-F2`
**优先级**: P2
**预计工时**: 6-8h（含后端字段新增）
**依赖**: E1（复用分组渲染基础设施）

### 背景

当前 `ComponentNode` 类型中不存在 `isCommon` / `isShared` / `isUniversal` 等通用组件标识字段。组件类型（page/form/list/detail/modal）无法准确判断组件是否属于通用组件（header/footer/nav/user-context 等）。

### 字段新增方案

#### 前端类型变更 (`types.ts`)

```typescript
// ComponentNode 新增字段
export interface ComponentNode {
  // ... 现有字段 ...
  /** 是否为通用组件（用户/web/app 通用），通用组件单独分组置顶展示 */
  isCommon?: boolean;
}
```

#### 后端 API 配合

| 接口 | 变更内容 | 负责方 |
|------|---------|--------|
| `GenerateComponentsOutput.components[].isCommon` | 后端 LLM 生成时判断组件是否为通用组件，追加 `isCommon` 字段 | 后端团队 |
| Mock 数据 | `mockGenerateComponents` 中预设 1-2 个通用组件（flowId='common' 或 isCommon=true） | 前端 dev |

**后端配合说明**:
- 后端在调用 LLM 生成组件时，要求 LLM 对每个组件额外判断 `isCommon`（通用组件指在多个页面复用的组件，如 header/footer/nav 等 UI 框架组件）
- 若后端暂不支持，前端可先用 `flowId === 'common'` 或 `name` 包含关键词（header/footer/nav）做临时推断

#### 临时推断策略（前端先行方案）

若后端 `isCommon` 字段暂未上线，前端使用以下启发式规则推断：

```typescript
const COMMON_KEYWORDS = ['header', 'footer', 'nav', 'menu', 'sidebar', 'toolbar', 'breadcrumb'];

function inferIsCommon(node: ComponentNode): boolean {
  if (node.isCommon !== undefined) return node.isCommon;
  if (node.flowId === 'common') return true;
  const name = node.name.toLowerCase();
  return COMMON_KEYWORDS.some(k => name.includes(k));
}
```

### F2.1: 通用组件数据模型与分组逻辑

**描述**: 在 `ComponentTree.tsx` 分组逻辑中，优先处理 `isCommon=true` 的组件，单独作为一个分组置顶展示。

**实现要点**:

1. **分组优先级**:
   ```
   [通用组件分组]  ← 置顶，isCommon=true
   [页面分组 1]
   [页面分组 2]
   ...
   ```
2. **通用组件分组标签**: "🧩 通用组件"
3. **通用组件不参与页面分组**: `isCommon=true` 的节点不参与 F1.1 的 flowId 分组
4. **BoundedGroup 注册**: 通用组件单独注册一个 `BoundedGroup`，color 使用 `#8b5cf6`（紫色，与 generic 限界上下文一致）

**验收标准**:

```typescript
// E2-F1.1: isCommon=true 的组件归入"通用组件"分组
const groups = groupComponentNodes(mockNodesWithCommon);
const commonGroup = groups.find(g => g.label.includes('通用组件'));
expect(commonGroup).toBeDefined();
expect(commonGroup!.nodes.some(n => n.name === 'Header 组件')).toBe(true);

// E2-F1.2: 通用组件分组排在最前面
expect(groups[0].label).toContain('通用组件');

// E2-F1.3: 通用组件不参与页面分组
const pageGroups = groups.filter(g => !g.label.includes('通用组件'));
const commonNodeIds = new Set(commonGroup!.nodes.map(n => n.nodeId));
pageGroups.forEach(pg => {
  pg.nodes.forEach(n => expect(commonNodeIds.has(n.nodeId)).toBe(false));
});

// E2-F1.4: 后端响应中 isCommon 字段正确映射到 ComponentNode
const apiResponse = { name: 'Header', flowId: 'flow-1', type: 'page', isCommon: true };
const node = mapApiToComponentNode(apiResponse);
expect(node.isCommon).toBe(true);
```

### F2.2: 通用组件虚线框样式

**描述**: 通用组件分组的虚线框使用紫色（#8b5cf6），与 generic 限界上下文风格一致。

**验收标准**:

```typescript
// E2-F2.1: 通用组件分组 SVG 虚线框颜色为紫色
const { container } = render(<ComponentTree ... />);
const svgRects = container.querySelectorAll('svg rect');
// 找到 label 为"通用组件"的 rect
const commonRect = findRectByLabel(container, '通用组件');
expect(commonRect?.getAttribute('stroke')).toBe('#8b5cf6');

// E2-F2.2: 通用组件标签使用紫色
const label = container.querySelector('[data-group-label="通用组件"]');
expect(getComputedStyle(label!).color).toBe('rgb(139, 92, 246)');
```

---

## 4. Epic E3: 错误提示自动消失（R3）

**Feature ID**: `E3-F1`
**优先级**: P0
**预计工时**: 0.5h
**依赖**: 无
**风险**: 低 — 单文件单行改动

### 背景

`Toast.tsx` 的 `showToast` 函数中，`error` 类型的默认 `duration` 为 `0`，导致所有 error toast 不会自动消失，需要用户手动点击 × 关闭。用户体验差，且与 `success`（3s）/ `warning`（5s）的行为不一致。

### 根因

```typescript
// Toast.tsx L55-57（当前代码）
const defaultDuration =
  type === 'success' ? 3000
  : type === 'warning' ? 5000
  : 0;  // ← error 和 info 默认 duration = 0
```

### F3.1: Toast error 类型默认 duration 修改

**描述**: 将 `error` 和 `info` 类型的默认 `duration` 从 `0` 改为 `3000`ms。

**改动位置**: `vibex-fronted/src/components/ui/Toast.tsx`，`showToast` 函数内部，`defaultDuration` 三元表达式。

**变更前**:

```typescript
const defaultDuration =
  type === 'success' ? 3000
  : type === 'warning' ? 5000
  : 0;
```

**变更后**:

```typescript
const defaultDuration =
  type === 'success' ? 3000
  : type === 'warning' ? 5000
  : 3000; // error + info 也 3s 自动消失
```

**验收标准**:

```typescript
// E3-F1.1: error 类型默认 duration 为 3000ms
const defaultDuration = getDefaultDuration('error');
expect(defaultDuration).toBe(3000);

// E3-F1.2: info 类型默认 duration 为 3000ms
const defaultDurationInfo = getDefaultDuration('info');
expect(defaultDurationInfo).toBe(3000);

// E3-F1.3: error toast 3s 后自动从 DOM 移除（集成测试）
const { getByRole, queryByRole } = render(<ToastProvider>...</ToastProvider>);
act(() => { showToast('操作失败', 'error'); });
expect(getByRole('alert')).toBeInTheDocument();
act(() => { jest.advanceTimersByTime(3001); });
expect(queryByRole('alert')).not.toBeInTheDocument();

// E3-F1.4: 显式传入 duration=0 时不自动消失
act(() => { showToast('永久错误', 'error', 0); });
act(() => { jest.advanceTimersByTime(10000); });
expect(getByRole('alert')).toBeInTheDocument();

// E3-F1.5: success/warning 不受变更影响
expect(getDefaultDuration('success')).toBe(3000);
expect(getDefaultDuration('warning')).toBe(5000);
```

---

## 5. 非功能性需求

| 维度 | 要求 |
|------|------|
| **向后兼容** | E3 的 duration 变更不影响显式传入 `duration` 参数的调用 |
| **回归测试** | 不删除现有 ComponentTree 测试，新增分组相关测试 |
| **性能** | 100 个组件节点内，分组计算 + 渲染 < 100ms |
| **深色模式** | 虚线框颜色、标签背景在深色模式下无视觉问题 |
| **可访问性** | 分组标签 `role="group"` + `aria-label`，符合 WCAG 2.1 AA |

---

## 6. 依赖关系与实施顺序

```
E3 (0.5h, P0) ──┐
                ├──> E1 (4-6h, P1) ──> E2 (6-8h, P2)
                │     (复用分组基础设施)    (复用 E1 基础设施)
                │
                └───> 无依赖，可最先交付
```

**推荐实施顺序**:
1. **E3** — 改动最小（1 行），立即交付价值
2. **E1** — 建立分组渲染基础，E2 复用
3. **E2** — 在 E1 基础上添加 isCommon 字段处理

---

## 7. 测试策略

| Epic | 测试类型 | 工具 | 覆盖目标 |
|------|---------|------|---------|
| E3 | 单元测试 | Jest | `getDefaultDuration` 返回值 |
| E3 | 集成测试 | Jest + Testing Library | toast 自动消失行为 |
| E1 | 单元测试 | Jest | `groupByFlowId` 分组逻辑 |
| E1 | 渲染测试 | Testing Library | DOM 分组容器、SVG 虚线框 |
| E1 | 视觉测试 | Playwright screenshot | 虚线框在真实浏览器中的渲染 |
| E2 | 单元测试 | Jest | `inferIsCommon` 推断逻辑 |
| E2 | 渲染测试 | Testing Library | 通用组件置顶、分组顺序 |

---

## 8. 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 后端 `isCommon` 字段延迟上线 | 中 | 前端先用启发式推断，后端上线后切换 |
| `BoundedGroupOverlay` 不兼容 flex 布局 | 高 | 新建 `ComponentGroupOverlay` 使用 DOM bbox |
| E3 变更影响已有 error toast 行为 | 低 | 仅改默认值，显式传 duration=0 不受影响 |
| 分组渲染影响现有 ComponentTree 交互 | 中 | 新增 `data-component-group` 包裹，不改变现有 card 结构 |
