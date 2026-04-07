# 开发约束: vibex-canvas-component-group

**项目**: vibex-canvas-component-group  
**版本**: 1.0  
**日期**: 2026-03-29  
**Agent 版本**: dev / tester / reviewer

---

## 1. 项目概述

**目标**: VibeX Canvas 组件树分组与错误提示增强

**三个 Epic**:
1. **E1 (P1)**: 组件树按页面归属用虚线框分组
2. **E2 (P2)**: 通用组件独立分组并置顶
3. **E3 (P0)**: error 类型 Toast 延迟 3s 自动消失

**红线**: 不改业务逻辑，只改 UI/UX 体验

---

## 2. 开发约束 (Red Lines)

### 2.1 禁止事项

| ❌ 禁止 | 原因 | 替代方案 |
|---------|------|---------|
| 删除现有测试 | 回归风险 | 新增测试，保留现有 |
| 修改 `ComponentNode` 核心字段 | 破坏向后兼容 | 只新增 `isCommon?: boolean` |
| 修改 `canvasStore` 核心 slice | 影响其他功能 | 新增 `ComponentGroupSlice` |
| 硬编码颜色值在组件内 | 不可维护 | 使用 `GROUP_COLORS` 常量 |
| 直接操作 DOM (除 bbox 计算外) | React 规范 | 使用 ref + useEffect |

### 2.2 必须遵守

| ✅ 必须 | 说明 |
|--------|------|
| 使用 `React.memo` 包裹 `ComponentGroupOverlay` | 减少重渲染 |
| 分组计算用 `useMemo` | 避免每次渲染重新计算 |
| DOM bbox 同步用防抖 | 避免性能问题 |
| Toast 定时器在 unmount 时清理 | 防止内存泄漏 |
| 深色模式样式覆盖 | `[data-theme='dark']` |
| 虚线框 `pointer-events: none` | 不阻挡交互 |

### 2.3 类型安全

```typescript
// ✅ 正确: 扩展现有类型
export interface ComponentNode {
  // ... 现有字段 ...
  isCommon?: boolean;  // 新增字段
}

// ❌ 错误: 修改核心类型
export type ComponentType = 'page' | 'form' | 'list' | 'detail' | 'modal' | 'common';
```

---

## 3. 代码规范

### 3.1 命名规范

| 元素 | 命名规范 | 示例 |
|------|---------|------|
| 分组容器 | `data-component-group` | `<div data-component-group="page-flow-1">` |
| 分组标签 | `data-group-label` | `<span data-group-label>📄 首页</span>` |
| 组件 ID | `data-node-id` | `<div data-node-id="node-1">` |
| SVG class | `component-group-overlay` | `<svg class="component-group-overlay">` |

### 3.2 CSS 规范

```css
/* 组件分组 — 虚线边框 */
.component-group {
  border: 1px dashed var(--group-color, #10b981);
  border-radius: 8px;
  padding: 8px;
  background: color-mix(in srgb, var(--group-color) 3%, transparent);
}

/* 通用组件分组 — 紫色 */
.component-group--common {
  --group-color: #8b5cf6;
}

/* 页面分组 — 绿色 */
.component-group--page {
  --group-color: #10b981;
}
```

### 3.3 常量规范

```typescript
// 颜色常量
export const GROUP_COLORS = {
  common: '#8b5cf6',   // 紫色
  page: '#10b981',      // 绿色
} as const;

// 虚线样式
export const GROUP_STROKE = {
  DASHARRAY: '5 3',
  WIDTH: 1.5,
  RADIUS: 8,
  PADDING: 12,
} as const;

// Toast duration
export const TOAST_DURATION = {
  ERROR: 3000,
  INFO: 3000,
  SUCCESS: 3000,
  WARNING: 5000,
} as const;

// 通用组件关键词
export const COMMON_KEYWORDS = [
  'header', 'footer', 'nav', 'menu', 
  'sidebar', 'toolbar', 'breadcrumb',
] as const;
```

---

## 4. 文件结构规范

### 4.1 目录结构

```
vibex-fronted/src/
├── components/canvas/
│   ├── groups/
│   │   ├── BoundedGroupOverlay.tsx      # 已有（限界上下文用）
│   │   └── ComponentGroupOverlay.tsx   # 新增（组件树用）
│   ├── ComponentTree.tsx                # 修改（添加分组逻辑）
│   ├── CanvasPage.tsx                   # 修改（挂载 Overlay）
│   └── canvas.module.css                # 修改（添加分组样式）
├── lib/canvas/
│   ├── types.ts                         # 修改（新增 isCommon 字段）
│   ├── canvasStore.ts                   # 修改（新增 slice）
│   └── utils/
│       ├── groupComponents.ts           # 新增（分组工具）
│       └── inferCommon.ts               # 新增（通用组件推断）
└── components/ui/
    └── Toast.tsx                        # 修改（duration 默认值）
```

### 4.2 导出规范

```typescript
// lib/canvas/utils/index.ts
export { groupByFlowId, getPageLabel } from './groupComponents';
export { inferIsCommon } from './inferCommon';
```

---

## 5. 测试约束

### 5.1 测试文件位置

```
vibex-fronted/src/
├── components/canvas/
│   └── __tests__/
│       ├── ComponentTree.test.tsx       # 已有测试（勿删）
│       ├── groupComponents.test.ts      # 新增
│       └── inferCommon.test.ts          # 新增
└── e2e/
    └── component-group.spec.ts          # 新增
```

### 5.2 测试覆盖率要求

| 文件 | 最低覆盖率 |
|------|-----------|
| `Toast.tsx` | 100% |
| `groupComponents.ts` | 95% |
| `inferCommon.ts` | 90% |
| `ComponentGroupOverlay.tsx` | 80% |

### 5.3 Mock 数据规范

```typescript
// 使用真实数据结构，避免硬编码
const mockFlowNodes: BusinessFlowNode[] = [
  { nodeId: 'flow-1', name: '首页管理', contextId: 'ctx-1', steps: [], confirmed: true, status: 'confirmed', children: [] },
];

const mockComponentNodes: ComponentNode[] = [
  { nodeId: 'c1', flowId: 'flow-1', name: '首页', type: 'page', props: {}, api: { method: 'GET', path: '/', params: [] }, children: [], confirmed: true, status: 'confirmed' },
  { nodeId: 'c2', flowId: 'flow-1', name: '列表', type: 'list', props: {}, api: { method: 'GET', path: '/list', params: [] }, children: [], confirmed: true, status: 'confirmed', isCommon: true },
];
```

---

## 6. 性能约束

### 6.1 性能红线

| 指标 | 上限 | 超过则优化 |
|------|------|----------|
| 分组计算 (100 nodes) | 5ms | memoization |
| DOM bbox 同步 | 10ms | 防抖 + RAF |
| SVG 重渲染 | 16ms (60fps) | React.memo |
| Toast 定时器内存泄漏 | 0 | unmount 清理 |

### 6.2 防抖配置

```typescript
// 分组计算: 不需要防抖（数据驱动）
// DOM bbox 同步: 防抖 100ms
const debouncedUpdateRects = debounce(updateRects, 100);

// 滚动监听: 节流 50ms
const throttledOnScroll = throttle(onScroll, 50);
```

---

## 7. 可访问性约束

### 7.1 ARIA 规范

```tsx
// 分组容器
<div 
  role="group" 
  aria-label="页面: 首页管理"
  data-component-group="page-flow-1"
>
  <span data-group-label>📄 首页管理</span>
  {/* ... */}
</div>

// SVG 装饰层
<svg aria-hidden="true">
  {/* 不添加 aria 标签 */}
</svg>
```

### 7.2 键盘导航

```css
/* 分组标签可聚焦 */
.component-group-label:focus {
  outline: 2px solid var(--group-color);
  outline-offset: 2px;
}
```

---

## 8. 审查检查清单 (Reviewer)

### 8.1 代码审查

- [ ] 未删除现有测试
- [ ] `ComponentNode` 类型只新增 `isCommon?: boolean`
- [ ] 使用 `GROUP_COLORS` 常量而非硬编码颜色
- [ ] `pointer-events: none` 在 SVG 虚线框上
- [ ] `ResizeObserver` / `unmount` 清理定时器
- [ ] 深色模式样式覆盖

### 8.2 功能审查

- [ ] E3: error Toast 3s 后自动消失
- [ ] E1: 组件按 flowId 分组渲染
- [ ] E1: 虚线框颜色为绿色 `#10b981`
- [ ] E2: isCommon=true 组件置顶显示
- [ ] E2: 通用组件虚线框颜色为紫色 `#8b5cf6`

### 8.3 测试审查

- [ ] 新增测试覆盖新功能
- [ ] 现有测试全部通过
- [ ] Mock 数据使用真实结构
- [ ] 边界条件测试完整

---

## 9. 提交规范

### 9.1 Commit Message

```
feat(component-tree): add page grouping with dashed borders

- E1: ComponentTree now groups by flowId
- E1: Add ComponentGroupOverlay SVG rendering
- E2: Common components now grouped and sorted first
- E3: Toast error type auto-dismisses after 3s

Closes #XXX
```

### 9.2 PR 标题

```
feat(canvas): component tree grouping and toast auto-dismiss
```

---

## 10. 附录

### 10.1 相关文档

- 分析文档: `docs/vibex-canvas-component-group/analysis.md`
- PRD: `docs/vibex-canvas-component-group/prd.md`
- 架构设计: `docs/vibex-canvas-component-group/architecture.md`

### 10.2 外部依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| Zustand | ^4.x | 状态管理 |
| @xyflow/react | 12.x | 画布渲染 |
| Jest | ^29.x | 单元测试 |
| Playwright | ^1.x | E2E 测试 |

### 10.3 关键文件路径

```
vibex-fronted/src/
├── components/canvas/ComponentTree.tsx       # 主渲染逻辑
├── components/canvas/groups/ComponentGroupOverlay.tsx  # 虚线框
├── components/ui/Toast.tsx                  # Toast 组件
├── lib/canvas/types.ts                       # 类型定义
└── lib/canvas/canvasStore.ts                # 状态管理
```
