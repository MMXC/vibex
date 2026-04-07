# 架构设计: vibex-canvas-component-group

**项目**: vibex-canvas-component-group  
**版本**: 1.0  
**日期**: 2026-03-29  
**状态**: Approved  
**架构师**: Subagent (Architect)

---

## 1. 执行摘要

本架构设计解决 VibeX Canvas 组件树的三个体验问题：
1. **组件树页面分组** — 按 `flowId` 用虚线框分组组件
2. **通用组件独立分组** — 通用组件置顶单独展示
3. **错误提示自动消失** — error Toast 3s 后自动消失

**核心策略**: 复用现有 `BoundedGroupOverlay` 基础设施，最小化新增代码。

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        CanvasPage.tsx                            │
│  ┌──────────────┬──────────────────────┬──────────────────────┐ │
│  │ ContextTree  │   FlowTree           │   ComponentTree       │ │
│  │              │                      │                       │ │
│  │ Bounded      │   Bounded            │   ComponentGroup      │ │
│  │ GroupOverlay │   GroupOverlay       │   Overlay (NEW)       │ │
│  │ (复用)       │   (复用)             │                       │ │
│  └──────────────┴──────────────────────┴───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    canvasStore.ts (状态管理)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ boundedGroups│  │ flowNodes   │  │ componentNodes          │ │
│  │ (现有)      │  │ (现有)      │  │ (现有)                  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  新增: ComponentGroupOverlay 状态                          │ │
│  │  - componentBoundedGroups: BoundedGroup[]                  │ │
│  │  - componentCardPositions: Record<string, DOMRect>          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 组件树页面分组架构 (E1)

#### 方案选择

| 方案 | 描述 | 优点 | 缺点 | 推荐 |
|------|------|------|------|------|
| **A: DOM bbox 方案** | 新建 `ComponentGroupOverlay.tsx`，用 `getBoundingClientRect()` 计算卡片位置 | 不修改 CanvasPage，不影响现有 ReactFlow 架构 | 需监听 resize/scroll | ✅ **推荐** |
| B: ReactFlow position 方案 | 给每个卡片设置 position 并同步到 store | 已有类似实现 | 需要修改 CanvasPage.tsx | ❌ |

#### 数据流

```
componentNodes (from canvasStore)
       │
       ▼
┌─────────────────────────────────────────┐
│   ComponentTree.tsx 分组逻辑             │
│   1. 过滤 isCommon=true → 通用组件分组  │
│   2. 其余按 flowId 分组                  │
│   3. 调用 addBoundedGroup 注册分组      │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│   canvasStore.boundedGroups             │
│   treeType: 'component'                 │
│   color: '#10b981' (green)              │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│   ComponentGroupOverlay.tsx (NEW)       │
│   1. 监听 componentNodes 变化           │
│   2. 用 querySelectorAll 计算 DOM bbox  │
│   3. 渲染 SVG 虚线框                    │
└─────────────────────────────────────────┘
```

### 2.3 通用组件分组架构 (E2)

#### 数据流

```
ComponentNode.isCommon (from API or inference)
       │
       ▼
┌─────────────────────────────────────────┐
│   inferIsCommon() 启发式推断            │
│   1. node.isCommon !== undefined → 直接用│
│   2. node.flowId === 'common' → true   │
│   3. name 匹配关键词 → true             │
│      (header/footer/nav/menu/sidebar)   │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│   分组排序逻辑                           │
│   1. [通用组件] — 置顶，color: #8b5cf6 │
│   2. [页面1]    — flowId=flow-1         │
│   3. [页面2]    — flowId=flow-2         │
└─────────────────────────────────────────┘
```

### 2.4 错误提示自动消失架构 (E3)

#### 最小改动方案

```
Toast.tsx L55-57
       │
       ▼
修改前: 0 (error/info 不自动消失)
修改后: 3000 (统一 3s 自动消失)
       │
       ▼
影响范围: 所有调用 showToast('...', 'error') 且未传 duration 的场景
向后兼容: ✅ 显式传 duration=0 仍不自动消失
```

---

## 3. 接口设计

### 3.1 类型扩展

```typescript
// types.ts 新增

/** 组件树分组元数据 */
export interface ComponentGroupMeta {
  /** 分组 ID */
  groupId: string;
  /** 分组类型: 'common' | 'page' */
  type: 'common' | 'page';
  /** 页面名称 (type='page' 时有) */
  pageName?: string;
  /** flowId (type='page' 时有) */
  flowId?: string;
  /** 组件节点 ID 列表 */
  nodeIds: string[];
}

/** 组件卡片 DOM 位置映射 */
export interface ComponentCardPosition {
  nodeId: string;
  rect: DOMRect;
}
```

### 3.2 Store 扩展

```typescript
// canvasStore.ts 新增 slice

interface ComponentGroupSlice {
  /** 组件分组元数据 */
  componentGroups: ComponentGroupMeta[];
  /** 组件卡片 DOM 位置映射 */
  componentCardPositions: Record<string, DOMRect>;
  /** 添加组件分组 */
  addComponentGroup: (group: ComponentGroupMeta) => void;
  /** 批量设置组件分组 */
  setComponentGroups: (groups: ComponentGroupMeta[]) => void;
  /** 更新卡片位置 */
  updateCardPosition: (nodeId: string, rect: DOMRect) => void;
  /** 清除所有卡片位置 */
  clearCardPositions: () => void;
}
```

### 3.3 组件接口

```typescript
// ComponentGroupOverlay.tsx

interface ComponentGroupOverlayProps {
  /** 容器 ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 分组数据 */
  groups: ComponentGroupMeta[];
  /** 卡片位置映射 */
  cardPositions: Record<string, DOMRect>;
}
```

---

## 4. 模块设计

### 4.1 新增文件

| 文件 | 职责 | 行数估计 |
|------|------|---------|
| `components/canvas/groups/ComponentGroupOverlay.tsx` | SVG 虚线框渲染 | ~150 |
| `components/canvas/ComponentTreeGrouped.tsx` | 分组渲染逻辑 (或内嵌 ComponentTree.tsx) | ~100 |
| `lib/canvas/utils/groupComponents.ts` | 分组工具函数 | ~80 |
| `lib/canvas/utils/inferCommon.ts` | 通用组件推断工具 | ~50 |

### 4.2 修改文件

| 文件 | 改动 | 行数估计 |
|------|------|---------|
| `lib/canvas/types.ts` | 新增 `isCommon?: boolean` 到 `ComponentNode` | +3 |
| `lib/canvas/canvasStore.ts` | 新增 `ComponentGroupSlice` | +30 |
| `components/ui/Toast.tsx` | 修改 `defaultDuration` 三元表达式 | -1/+1 |
| `components/canvas/ComponentTree.tsx` | 添加分组渲染逻辑 | +50 |
| `components/canvas/CanvasPage.tsx` | 挂载 `ComponentGroupOverlay` | +5 |

---

## 5. 性能分析

### 5.1 性能指标

| 场景 | 指标 | 目标 |
|------|------|------|
| 分组计算 (100 nodes) | 计算时间 | < 5ms |
| DOM bbox 同步 (100 nodes) | 重排时间 | < 10ms |
| SVG 重渲染 | FPS 影响 | < 5% |
| Toast 定时器 | 内存泄漏风险 | 无 |

### 5.2 优化策略

1. **防抖 bbox 同步**: `debounce(updateCardPositions, 100)`
2. **虚拟化卡片列表**: 超过 50 个组件时考虑虚拟滚动
3. **Memo 化 SVG**: `React.memo` + `useMemo` 减少重渲染
4. **定时器清理**: Toast unmount 时清理所有定时器

---

## 6. 兼容性设计

### 6.1 向后兼容

| 变更 | 兼容性保证 |
|------|-----------|
| `ComponentNode.isCommon` | 新增字段，`undefined` 表示未判断 |
| `showToast(..., 'error')` | 显式传 `duration=0` 仍不自动消失 |
| `BoundedGroup.treeType='component'` | 新增 treeType，不影响 context/flow |

### 6.2 深色模式

```css
/* 组件分组样式 */
[data-theme='dark'] .component-group {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

[data-theme='dark'] .component-group-label {
  background: rgba(16, 185, 129, 0.15);
}
```

---

## 7. 测试架构

### 7.1 测试层次

```
单元测试 (Jest)
  ├── groupComponents() — 分组逻辑
  ├── inferIsCommon() — 通用组件推断
  └── getDefaultDuration() — Toast duration

集成测试 (Jest + Testing Library)
  ├── ComponentTree 分组渲染
  ├── ComponentGroupOverlay SVG 渲染
  └── Toast 自动消失行为

E2E 测试 (Playwright)
  ├── 虚线框视觉一致性
  └── 深色模式兼容性
```

### 7.2 Mock 数据

```typescript
const mockComponentNodes: ComponentNode[] = [
  { nodeId: 'c1', flowId: 'flow-1', name: '首页', type: 'page', isCommon: true, ... },
  { nodeId: 'c2', flowId: 'flow-1', name: '列表', type: 'list', ... },
  { nodeId: 'c3', flowId: 'flow-2', name: '详情', type: 'detail', ... },
];

const mockFlowNodes: BusinessFlowNode[] = [
  { nodeId: 'flow-1', name: '首页管理' },
  { nodeId: 'flow-2', name: '订单管理' },
];
```

---

## 8. 风险与缓解

| ID | 风险 | 等级 | 缓解措施 |
|----|------|------|---------|
| R1 | BoundedGroupOverlay 不兼容 flex 布局 | 高 | 新建 ComponentGroupOverlay 使用 DOM bbox，不依赖 ReactFlow |
| R2 | 后端 isCommon 字段延迟上线 | 中 | 前端先用启发式推断，后端上线后切换 |
| R3 | E3 变更影响已有 error toast 行为 | 低 | 仅改默认值，显式传 duration=0 不受影响 |
| R4 | 分组渲染影响现有 ComponentTree 交互 | 中 | 新增 data-component-group 包裹，不改变现有 card 结构 |

---

## 9. 附录

### 9.1 颜色规范

| 分组类型 | 颜色 | CSS 值 |
|----------|------|--------|
| 页面分组 | green | `#10b981` |
| 通用组件分组 | purple | `#8b5cf6` |

### 9.2 常量规范

```typescript
const COMPONENT_GROUP = {
  STROKE_DASHARRAY: '5 3',
  STROKE_WIDTH: 1.5,
  PADDING: 12,
  BORDER_RADIUS: 8,
  LABEL_HEIGHT: 24,
} as const;

const COMMON_KEYWORDS = ['header', 'footer', 'nav', 'menu', 'sidebar', 'toolbar', 'breadcrumb'] as const;
```
