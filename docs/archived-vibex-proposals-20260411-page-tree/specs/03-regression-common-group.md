# Spec: 通用组件分组回归验证

**关联 PRD**: F1.4（组件树分组回归验证）
**关联 Story**: S1.3
**关联验收标准**: AC3.1、AC3.2、AC3.3

---

## 概述

修复 `matchFlowNode()` 和 AI prompt 的过程中，必须确保现有通用组件（modal/button/tooltip 等）的分组逻辑不受影响。通用组件应始终归入"通用组件"节点，而非被误匹配到某个业务页面。

本规格定义 ComponentTree.tsx 中的通用组件判断逻辑，并提供回归测试用例，确保改动不破坏现有行为。

---

## 详细设计

### 通用组件判断逻辑

在 `ComponentTree.tsx` 中，组件归属页面按以下优先级判断：

```
组件归属判断流程:
    │
    ▼
[1] 如果 component.type ∈ commonComponentTypes → 归入"通用组件"
    │
    ▼（否）
[2] 如果 component.flowId === 'common' → 归入"通用组件"
    │
    ▼（否）
[3] 调用 matchFlowNode(component.flowId, flowNodes)
    │
    ├── 命中 → 归入对应 node.name 页面
    │
    └── 未命中 → 归入"未知页面"（⚠️ 需修复的现状）
```

### 通用组件类型白名单

```typescript
const COMMON_COMPONENT_TYPES = [
  'modal',
  'Modal',
  'button',
  'Button',
  'tooltip',
  'Tooltip',
  'dropdown',
  'Dropdown',
  'badge',
  'Badge',
  'icon',
  'Icon',
  'avatar',
  'Avatar',
  'loading',
  'Loading',
  'spinner',
  'Spinner',
];
```

### ComponentTree.tsx 分组实现（伪代码）

```typescript
function getComponentGroup(
  component: CanvasComponent,
  flowNodes: BusinessFlowNode[]
): string {
  // [1] 通用组件类型白名单
  if (COMMON_COMPONENT_TYPES.includes(component.type)) {
    return '通用组件';
  }

  // [2] flowId === 'common'
  if (component.flowId === 'common') {
    return '通用组件';
  }

  // [3] 走 matchFlowNode 匹配
  const matchResult = matchFlowNode(component.flowId, flowNodes);
  if (matchResult) {
    return matchResult.node.name;
  }

  // [4] 未匹配
  return '未知页面';
}
```

### 分组渲染逻辑

ComponentTree 渲染时，对每个组件调用 `getComponentGroup()`，将组件挂到对应分组下：

```
ComponentTree
├── 登录流程
│   ├── 登录表单
│   └── 用户名输入框
├── 订单管理
│   └── 订单卡片
├── 通用组件        ← type/flowId 命中的组件
│   ├── 确认弹窗
│   ├── 提交按钮
│   └── 加载指示器
└── 未知页面        ← 兜底，应尽量减少
    └── 游离组件
```

---

## API/接口

### 工具函数

```typescript
/**
 * 判断组件是否为通用组件
 * @param component - 画布组件
 * @returns true 表示通用组件，false 表示业务组件
 */
function isCommonComponent(component: CanvasComponent): boolean;

/**
 * 获取组件在组件树中的分组名称
 * @param component - 画布组件
 * @param flowNodes - BusinessFlowNode 列表
 * @returns 分组名称（页面名称、"通用组件" 或 "未知页面"）
 */
function getComponentGroup(
  component: CanvasComponent,
  flowNodes: BusinessFlowNode[]
): string;
```

### 类型定义

```typescript
interface CanvasComponent {
  id: string;
  name: string;
  type: string;
  flowId: string;
}
```

---

## 实现步骤

1. **提取 isCommonComponent 工具函数**
   - 从 ComponentTree.tsx 渲染逻辑中提取
   - 支持 type 白名单 + flowId === 'common' 双判断

2. **提取 getComponentGroup 工具函数**
   - 组合 isCommonComponent + matchFlowNode
   - 统一组件归属逻辑

3. **补充回归测试用例**（见验收测试章节）

4. **确保现有渲染逻辑不变**
   - 分组渲染顺序：`业务页面` → `通用组件` → `未知页面`
   - 通用组件节点始终可见（即使为空）

---

## 验收测试

> 引用 PRD 验收标准：AC3.1、AC3.2、AC3.3

### AC3.1: 组件 type='modal' → 归入"通用组件"

```typescript
import { isCommonComponent, getComponentGroup } from './ComponentTree';
import type { CanvasComponent, BusinessFlowNode } from './types';

const flowNodes: BusinessFlowNode[] = [
  { nodeId: 'flow-abc-123', name: '登录流程' },
];

const modalComponent: CanvasComponent = {
  id: 'comp-001',
  name: '确认弹窗',
  type: 'modal',
  flowId: 'flow-abc-123',
};

// AC3.1: modal 类型为通用组件
expect(isCommonComponent(modalComponent)).toBe(true);

// AC3.1: 归入"通用组件"，不归入 flowId 对应的页面
const group1 = getComponentGroup(modalComponent, flowNodes);
expect(group1).toBe('通用组件');
expect(group1).not.toBe('登录流程');
```

### AC3.2: 组件 type='button' → 归入"通用组件"

```typescript
const buttonComponent: CanvasComponent = {
  id: 'comp-002',
  name: '提交按钮',
  type: 'Button', // 大写变体
  flowId: 'flow-abc-123',
};

// AC3.2: button 类型为通用组件（大小写不敏感）
expect(isCommonComponent(buttonComponent)).toBe(true);

const group2 = getComponentGroup(buttonComponent, flowNodes);
expect(group2).toBe('通用组件');
expect(group2).not.toBe('登录流程');
```

### AC3.3: 组件 flowId='common' → 归入"通用组件"

```typescript
const commonFlowIdComponent: CanvasComponent = {
  id: 'comp-003',
  name: '加载指示器',
  type: 'loading',
  flowId: 'common',
};

expect(isCommonComponent(commonFlowIdComponent)).toBe(true);

const group3 = getComponentGroup(commonFlowIdComponent, flowNodes);
expect(group3).toBe('通用组件');
```

### 扩展：其他通用组件类型

```typescript
const commonTypes = [
  'tooltip', 'Tooltip',
  'dropdown', 'Dropdown',
  'badge', 'Badge',
  'icon', 'Icon',
  'avatar', 'Avatar',
  'loading', 'Loading',
  'spinner', 'Spinner',
];

commonTypes.forEach(type => {
  const comp: CanvasComponent = {
    id: `comp-${type}`,
    name: `${type} 组件`,
    type,
    flowId: 'flow-abc-123', // 有意的错误 flowId
  };

  // 通用组件类型优先，不使用 flowId
  expect(isCommonComponent(comp)).toBe(true);
  expect(getComponentGroup(comp, flowNodes)).toBe('通用组件');
});
```

### 回归：业务组件仍正确归入页面

```typescript
const businessComponent: CanvasComponent = {
  id: 'comp-010',
  name: '登录表单',
  type: 'form',
  flowId: 'flow-abc-123',
};

// 业务组件归入对应页面
const group4 = getComponentGroup(businessComponent, flowNodes);
expect(group4).toBe('登录流程');
```

### 回归：matchFlowNode 失败时归入"未知页面"

```typescript
const orphanComponent: CanvasComponent = {
  id: 'comp-011',
  name: '游离组件',
  type: 'custom',
  flowId: 'invalid-flow-id',
};

const group5 = getComponentGroup(orphanComponent, flowNodes);
expect(group5).toBe('未知页面'); // 兜底，非崩溃
```

---

## 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 新增通用组件类型未加入白名单 | 中 | 维护白名单注释；考虑从配置文件加载；UI 审查时覆盖 |
| isCommonComponent 与 matchFlowNode 判断顺序错误 | 高 | 明确 type 白名单优先于 flowId 匹配；通过回归测试保护 |
| 分组渲染逻辑因 React key 冲突导致 UI 异常 | 低 | 回归测试 + 手动 UI 验证 |
| 回归测试覆盖不足导致漏测 | 中 | 覆盖所有白名单类型 + flowId='common' + 边界场景 |
