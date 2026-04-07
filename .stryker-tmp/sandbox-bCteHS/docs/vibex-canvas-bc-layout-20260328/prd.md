# PRD: VibeX Canvas Bounded Context Card Layout

**Project**: vibex-canvas-bc-layout-20260328
**Author**: PM
**Date**: 2026-03-28
**Status**: Draft
**Recommended Approach**: 方案 B（纯 CSS 分组布局）

---

## 1. 执行摘要

### 背景

VibeX 限界上下文树视图（BoundedContextTree）中，上下文卡片以纯垂直列表排列，用户无法直观识别哪些上下文属于同一领域类型。当上下文数量 > 5 时，认知负担显著增加。

### 目标

- 按领域类型（核心域 / 支撑域 / 通用域）将上下文卡片分组
- 每个分组以不同颜色的虚线框包裹，左上角显示领域标签
- 保持现有 CRUD 操作完全不受影响

### 指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 领域分组可识别性 | 0（无分组） | 页面加载 3s 内可识别所有分组 |
| 分组边框覆盖率 | 0% | 100%（所有多节点领域均有虚线框） |
| CRUD 功能回归 | — | 0 regression |
| 响应式宽度 | 列表错位 | 缩放 375px~1440px 无错位 |

---

## 2. Epic 1: 领域分组布局修复

**Priority**: P0
**Effort**: ~4h

### F1.1: 数据结构扩展

**描述**: 在 `contextNode` 接口中增加 `domainType` 和 `groupId` 字段，使节点具备领域分组属性。

**Technical Details**:
- 文件: `src/stores/canvasStore.ts` (或节点类型定义文件)
- `domainType`: `'core' | 'supporting' | 'generic' | 'external'`
- `groupId`: `string` — 按 `domainType` 自动生成，用于 BoundedGroupOverlay 关联

```ts
// contextNode 类型扩展
interface ContextNode {
  nodeId: string;
  name: string;
  type: 'core' | 'supporting' | 'generic' | 'external'; // 已存在
  domainType: 'core' | 'supporting' | 'generic' | 'external'; // 新增
  groupId: string; // 新增: `domain-${domainType}`
  // ... 其他已有字段
}
```

**Acceptance Criteria**:

```ts
// F1.1 AC
const node: ContextNode = {
  nodeId: 'ctx-001',
  name: '用户管理',
  type: 'core',
  domainType: 'core',
  groupId: 'domain-core',
};
expect(node.domainType).toBe('core');
expect(node.groupId).toBe('domain-core');
```

---

### F1.2: 领域分组渲染逻辑

**描述**: 修改 `BoundedContextTree.tsx`，将 `contextNodes` 按 `domainType` 分组渲染，替代原有的纯 `map` 遍历。

**Technical Details**:
- 文件: `src/components/canvas/BoundedContextTree.tsx`
- 使用 CSS Modules 样式文件 `canvas.module.css`
- 分组顺序固定: `core → supporting → generic → external`
- 空分组不渲染

**Rendering Structure**:

```
BoundedContextTree
└── DomainGroup { domainType: 'core' }
    ├── DomainGroupHeader { label: '核心域' }
    └── ContextCard × N
└── DomainGroup { domainType: 'supporting' }
    ├── DomainGroupHeader { label: '支撑域' }
    └── ContextCard × N
└── DomainGroup { domainType: 'generic' }
    ├── DomainGroupHeader { label: '通用域' }
    └── ContextCard × N
└── DomainGroup { domainType: 'external' }
    ├── DomainGroupHeader { label: '外部域' }
    └── ContextCard × N
```

**Acceptance Criteria**:

```ts
// F1.2 AC-1: 核心域节点被包裹在同一容器内
const coreNodes = groupedNodes.core; // type: ContextNode[]
expect(coreNodes.length).toBeGreaterThan(0);
const container = screen.getByTestId('domain-group-core');
expect(container).toBeInTheDocument();
coreNodes.forEach(node => {
  expect(within(container).getByTestId(`context-card-${node.nodeId}`)).toBeInTheDocument();
});

// F1.2 AC-2: 空分组不渲染
const supportingNodes = groupedNodes.supporting;
expect(supportingNodes.length).toBe(0);
expect(screen.queryByTestId('domain-group-supporting')).not.toBeInTheDocument();

// F1.2 AC-3: 分组顺序为 core → supporting → generic → external
const groups = screen.getAllByTestId(/^domain-group-/);
expect(groups.map(g => g.dataset.domainType)).toEqual(['core', 'supporting', 'generic', 'external']);
```

---

### F1.3: 领域虚线框样式

**描述**: 为每个领域分组添加 CSS 虚线边框样式，领域标签使用绝对定位浮在边框左上角。

**Technical Details**:
- 文件: `src/components/canvas/canvas.module.css`
- 边框样式: `2px dashed {color}`
- 领域颜色定义:

| 领域类型 | 颜色变量 | 十六进制 |
|----------|----------|----------|
| core | `--color-core` | `#F97316` (橙色) |
| supporting | `--color-supporting` | `#3B82F6` (蓝色) |
| generic | `--color-generic` | `#6B7280` (灰色) |
| external | `--color-external` | `#8B5CF6` (紫色) |

**CSS Spec**:

```css
/* canvas.module.css */
.domainGroup {
  position: relative;
  border: 2px dashed var(--domain-color);
  border-radius: 8px;
  padding: 16px;
  padding-top: 20px;
  margin-bottom: 16px;
}

.domainGroupHeader {
  position: absolute;
  top: -10px;
  left: 12px;
  background: #fff;
  padding: 0 8px;
  color: var(--domain-color);
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
  border-radius: 4px;
}

/* 颜色变体 */
.domainGroup[data-type="core"] { --domain-color: #F97316; }
.domainGroup[data-type="supporting"] { --domain-color: #3B82F6; }
.domainGroup[data-type="generic"] { --domain-color: #6B7280; }
.domainGroup[data-type="external"] { --domain-color: #8B5CF6; }
```

**Acceptance Criteria**:

```ts
// F1.3 AC-1: 核心域虚线框为橙色
const coreGroup = screen.getByTestId('domain-group-core');
expect(coreGroup).toHaveStyle({ border: '2px dashed #F97316' });

// F1.3 AC-2: 领域标签文字正确
const coreHeader = within(coreGroup).getByTestId('domain-group-header');
expect(coreHeader).toHaveTextContent('核心域');
expect(coreHeader).toHaveStyle({ color: '#F97316' });

// F1.3 AC-3: 标签背景为白色，覆盖虚线边框
const headerBg = window.getComputedStyle(coreHeader).backgroundColor;
expect(headerBg).toBe('rgb(255, 255, 255)');
```

---

## 3. 页面集成

### 集成点

| 页面 | 组件 | 变更 |
|------|------|------|
| CanvasPage | `<BoundedContextTree />` | 无组件级变更，纯渲染逻辑重构 |
| CanvasPage | `<BoundedGroupOverlay />` | 保持现有渲染（不参与本次变更） |
| canvasStore | `contextNodes` 类型 | 增加 `domainType` + `groupId` 字段 |

### 依赖项

- `BoundedContextTree.tsx` — 渲染逻辑重构
- `canvas.module.css` — 新增领域分组样式
- `contextNode` 类型定义 — 增加字段
- 无需修改 BoundedGroupOverlay

### 数据流

```
canvasStore.contextNodes[]
  → F1.1: domainType + groupId 字段注入
    → F1.2: BoundedContextTree 按 domainType 分组
      → F1.3: DomainGroup 虚线框 + 标签渲染
```

---

## 4. 验收总览

| Epic | Feature | AC | 验收方式 |
|------|---------|-----|----------|
| Epic 1 | F1.1 | node.domainType 存在且正确 | 单元测试 |
| Epic 1 | F1.1 | node.groupId 格式为 `domain-{type}` | 单元测试 |
| Epic 1 | F1.2 | core 节点在 domain-group-core 容器内 | 集成测试 |
| Epic 1 | F1.2 | 空分组（无节点）不渲染 DOM | 集成测试 |
| Epic 1 | F1.2 | 分组顺序为 core→supporting→generic→external | 集成测试 |
| Epic 1 | F1.3 | 核心域边框为 2px dashed #F97316 | 样式测试 |
| Epic 1 | F1.3 | 领域标签文字正确，颜色匹配边框 | 样式测试 |
| Epic 1 | F1.3 | 标签白色背景覆盖虚线边框 | 视觉验证 |
| Epic 1 | — | CRUD 操作（确认/编辑/删除）正常响应 | E2E 测试 |
| Epic 1 | — | 响应式 375px~1440px 无错位 | 视觉回归 |

---

## 5. Out of Scope

- BoundedGroupOverlay 组件改造（方案 A）
- ReactFlow 迁移（方案 C）
- 其他页面或模块的领域分组
- 领域分组拖拽排序
- 分组折叠/展开

---

## 6. 工作量估算

| Task | Effort |
|------|--------|
| F1.1 数据结构扩展 | 0.5h |
| F1.2 分组渲染逻辑 | 2h |
| F1.3 虚线框样式 | 1h |
| 集成测试编写 | 0.5h |
| **Total** | **~4h** |
