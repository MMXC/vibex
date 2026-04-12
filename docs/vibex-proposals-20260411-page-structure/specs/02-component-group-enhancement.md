# Spec: 组件树分组增强（pageId + componentCount）

**Spec 版本**: 1.0  
**对应 PRD Epic**: Epic 2 — 组件树分组增强  
**对应 Stories**: S2.1, S2.2  
**对应功能点**: F2.1, F2.2, F2.3  
**验收标准**: AC2, AC3, AC4  

---

## 1. 概述

增强组件树分组逻辑，为 `ComponentGroup` 类型新增 `pageId` 和 `componentCount` 两个元数据字段，使分组信息更完整，支持后续 JSON 预览功能的数据结构构建。

核心变更点：
1. `getPageLabel()` 函数优先使用 `node.pageName`，fallback 到 `BusinessFlowNode.name`
2. `ComponentGroup` 类型新增 `pageId`（从 groupId 提取）和 `componentCount` 字段
3. `groupByFlowId()` 函数输出携带新增字段

---

## 2. 详细设计

### 2.1 getPageLabel() — 页面标签生成

**文件**: `packages/vibex-component-tree/src/utils/getPageLabel.ts`（或等价路径）

**现有 fallback 逻辑分析**（PRD Section 6 依赖）:

```typescript
// 当前逻辑（简化）
function getPageLabel(node: ComponentNode, flowMap: Map<string, BusinessFlowNode>): string {
  const flow = flowMap.get(node.flowId);
  return flow?.name ?? '未知页面';
}
```

**变更后逻辑**:

```typescript
function getPageLabel(node: ComponentNode, flowMap: Map<string, BusinessFlowNode>): string {
  // 优先级1: node.pageName（用户自定义）
  if (node.pageName) {
    return node.pageName;
  }
  // 优先级2: BusinessFlowNode.name
  const flow = flowMap.get(node.flowId);
  if (flow?.name) {
    return flow.name;
  }
  // 优先级3: 兜底 label
  return node.label ?? '未知页面';
}
```

### 2.2 ComponentGroup 类型增强

**文件**: `packages/types/src/component.ts`（或等价路径）

```typescript
// 变更前
interface ComponentGroup {
  label: string;
  isCommon: boolean;
  components: ComponentNode[];
}

// 变更后
interface ComponentGroup {
  label: string;           // 展示用的页面名称（来自 getPageLabel）
  pageId: string;          // 🆕 从 groupId 提取，用于唯一标识分组
  componentCount: number;  // 🆕 该分组下组件数量
  isCommon: boolean;
  components: ComponentNode[];
}
```

### 2.3 groupByFlowId() 函数增强

**文件**: `packages/vibex-component-tree/src/utils/groupByFlowId.ts`（或等价路径）

**现有 groupByFlowId 逻辑分析**（PRD Section 6 依赖）:

```typescript
// 当前逻辑（简化）
function groupByFlowId(components: ComponentNode[]): ComponentGroup[] {
  const map = new Map<string, ComponentNode[]>();
  for (const node of components) {
    const list = map.get(node.flowId) ?? [];
    list.push(node);
    map.set(node.flowId, list);
  }
  return Array.from(map.entries()).map(([flowId, nodes]) => ({
    label: getPageLabel(nodes[0], flowMap),  // 使用 fallback 逻辑
    isCommon: flowId === '__common__',
    components: nodes,
  }));
}
```

**变更后逻辑**:

```typescript
function groupByFlowId(
  components: ComponentNode[],
  flowMap: Map<string, BusinessFlowNode>
): ComponentGroup[] {
  const map = new Map<string, ComponentNode[]>();

  for (const node of components) {
    const list = map.get(node.flowId) ?? [];
    list.push(node);
    map.set(node.flowId, list);
  }

  const groups: ComponentGroup[] = Array.from(map.entries()).map(([flowId, nodes]) => ({
    label: getPageLabel(nodes[0], flowMap),
    pageId: flowId,                              // 🆕 直接使用 flowId 作为 pageId
    componentCount: nodes.length,                 // 🆕 统计组件数量
    isCommon: flowId === '__common__',
    components: nodes,
  }));

  // 通用组件组置顶（详见 specs/04）
  return sortGroups(groups);
}
```

---

## 3. API/接口

### 3.1 getPageLabel

```typescript
// 签名
function getPageLabel(
  node: ComponentNode,
  flowMap: Map<string, BusinessFlowNode>
): string
```

**参数说明**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `node` | `ComponentNode` | 组件节点，可能含 pageName |
| `flowMap` | `Map<string, BusinessFlowNode>` | flowId → BusinessFlowNode 映射 |

**返回值**: `string` — 页面展示名称

### 3.2 groupByFlowId

```typescript
// 签名
function groupByFlowId(
  components: ComponentNode[],
  flowMap: Map<string, BusinessFlowNode>
): ComponentGroup[]
```

**返回值**: `ComponentGroup[]` — 分组后的组件组数组，每个组包含 pageId + componentCount

### 3.3 ComponentGroup 消费方

| 消费方 | 用途 |
|--------|------|
| `ComponentTree.tsx` | 渲染分组列表 |
| JSON 预览弹窗 | 构建 `pages` 数组数据结构 |

---

## 4. 实现步骤

### Step 1: 修改 getPageLabel()

1. 在函数体开头增加 `if (node.pageName) return node.pageName;` 检查
2. 保留现有 BusinessFlowNode.name fallback
3. 添加兜底返回值

### Step 2: 修改 ComponentGroup 类型定义

1. 在接口中添加 `pageId: string` 和 `componentCount: number`
2. 更新 JSDoc 注释

### Step 3: 修改 groupByFlowId()

1. 在分组结果映射时计算 `componentCount: nodes.length`
2. 将 `flowId` 直接赋值给 `pageId`
3. 调用 `sortGroups()` 实现通用组件置顶

### Step 4: 更新 ComponentTree.tsx

1. 分组标题使用 `getPageLabel()` 的返回值
2. 确保页面集成时传入正确的 flowMap

### Step 5: 添加单元测试

参考 `specs/05-unit-tests.md` 中的 `getPageLabel` 和 `groupByFlowId` 测试用例。

---

## 5. 验收测试

> **引用 PRD**: AC2, AC3, AC4 + F2.1, F2.2, F2.3

### 5.1 getPageLabel — pageName 优先

```typescript
// ✅ AC2: 有 pageName 时返回 pageName
const flowMap = new Map<string, BusinessFlowNode>();
flowMap.set('flow-1', { id: 'flow-1', name: 'BusinessFlow页面' });

const nodeWithPageName: ComponentNode = {
  id: 'node-1',
  type: 'component',
  label: 'Button',
  flowId: 'flow-1',
  pageName: '首页自定义名称',
};

expect(getPageLabel(nodeWithPageName, flowMap)).toBe('首页自定义名称');
```

### 5.2 getPageLabel — 无 pageName fallback

```typescript
// ✅ AC3: 无 pageName 且无 BusinessFlowNode 时返回兜底 label
const emptyFlowMap = new Map<string, BusinessFlowNode>();

const nodeNoFallback: ComponentNode = {
  id: 'node-2',
  type: 'component',
  label: '兜底标签',
  flowId: 'flow-unknown',
};

expect(getPageLabel(nodeNoFallback, emptyFlowMap)).toBe('兜底标签');
```

### 5.3 getPageLabel — 无 pageName 但有 BusinessFlowNode

```typescript
// ✅ F2.1: 无 pageName 时 fallback 到 BusinessFlowNode.name
const flowMap2 = new Map<string, BusinessFlowNode>();
flowMap2.set('flow-2', { id: 'flow-2', name: '业务流页面名' });

const nodeWithoutPageName: ComponentNode = {
  id: 'node-3',
  type: 'component',
  label: 'Button',
  flowId: 'flow-2',
};

expect(getPageLabel(nodeWithoutPageName, flowMap2)).toBe('业务流页面名');
```

### 5.4 ComponentGroup pageId + componentCount

```typescript
// ✅ AC4: 分组结果包含 pageId + componentCount
const components: ComponentNode[] = [
  { id: 'c1', type: 'comp', label: 'C1', flowId: 'flow-a' },
  { id: 'c2', type: 'comp', label: 'C2', flowId: 'flow-a' },
  { id: 'c3', type: 'comp', label: 'C3', flowId: 'flow-b' },
];
const flowMap3 = new Map<string, BusinessFlowNode>();
flowMap3.set('flow-a', { id: 'flow-a', name: '页面A' });
flowMap3.set('flow-b', { id: 'flow-b', name: '页面B' });

const groups = groupByFlowId(components, flowMap3);

const groupA = groups.find(g => g.pageId === 'flow-a');
expect(groupA).toBeDefined();
expect(groupA!.componentCount).toBe(2);         // ✅ F2.3
expect(groupA!.pageId).toBe('flow-a');           // ✅ F2.2
expect(groupA!.label).toBe('页面A');             // ✅ F2.1

const groupB = groups.find(g => g.pageId === 'flow-b');
expect(groupB!.componentCount).toBe(1);
```

### 5.5 groupByFlowId 保留现有行为

```typescript
// ✅ 向后兼容：flowId 分组逻辑不变
const singleGroup = groups.find(g => g.pageId === 'flow-a');
expect(singleGroup!.components).toHaveLength(2);
expect(singleGroup!.components[0].id).toBe('c1');
```

---

## 6. 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| `pageId` 直接使用 `flowId` 可能与未来 page 实体 ID 冲突 | 中 | PRD 约定 pageId = flowId，后续如需解耦再引入独立 pageId 映射 |
| componentCount 不含嵌套组件数量 | 低 | 当前需求为直接子组件计数，若需递归统计可扩展 |
| groupByFlowId 性能：O(n) 遍历，n 为组件总数 | 低 | 当前实现 O(n)，无需优化 |
| sortGroups() 引入排序导致组件顺序变化 | 低 | 排序仅影响组间顺序，组内组件顺序保持不变 |
