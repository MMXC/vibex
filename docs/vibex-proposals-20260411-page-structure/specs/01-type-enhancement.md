# Spec: ComponentNode 类型增强（pageName 字段）

**Spec 版本**: 1.0  
**对应 PRD Epic**: Epic 1 — 类型定义增强  
**对应 Story**: S1.1  
**对应功能点**: F1.1  
**验收标准**: AC1, AC2, AC3  

---

## 1. 概述

为 `ComponentNode` 类型新增可选的 `pageName?: string` 字段，允许用户在组件节点层面覆盖默认的 `BusinessFlowNode.name`，作为页面展示标签的优先来源。

此字段为**纯数据层增强**，不直接触发 UI 变更，后续由 `getPageLabel()` 函数消费。

---

## 2. 详细设计

### 2.1 类型定义变更

**文件**: `packages/types/src/component.ts`（或等价路径，视实际项目结构而定）

```typescript
// 变更前
interface ComponentNode {
  id: string;
  type: string;
  label: string;
  flowId: string;
  businessFlowNodeId?: string;
  children?: ComponentNode[];
  // ... 其他字段
}

// 变更后
interface ComponentNode {
  id: string;
  type: string;
  label: string;
  flowId: string;
  businessFlowNodeId?: string;
  pageName?: string;         // 🆕 新增：可选，覆盖默认 BusinessFlowNode.name
  children?: ComponentNode[];
  // ... 其他字段
}
```

### 2.2 字段语义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pageName` | `string \| undefined` | 否 | 用户指定的页面展示名称，优先于 BusinessFlowNode.name |

### 2.3 向后兼容

- `pageName` 为可选字段，现有 ComponentNode 实例无需修改
- JSON 序列化/反序列化时，无 `pageName` 字段的节点 `pageName` 为 `undefined`
- 不影响现有 `flowId` 分组逻辑

---

## 3. API/接口

### 3.1 类型导出

```typescript
// packages/types/src/index.ts
export interface ComponentNode {
  id: string;
  type: string;
  label: string;
  flowId: string;
  businessFlowNodeId?: string;
  pageName?: string;   // 🆕
  children?: ComponentNode[];
  // ... 其他字段
}
```

### 3.2 消费方

| 消费方 | 用途 |
|--------|------|
| `getPageLabel()` | 优先读取 pageName，fallback 到 BusinessFlowNode.name |
| `groupByFlowId()` | 透传 pageName 到分组输出 |
| `ComponentTree.tsx` | 展示分组标题 |

---

## 4. 实现步骤

### Step 1: 修改类型定义

1. 在 `ComponentNode` 接口中添加 `pageName?: string` 字段
2. 添加 JSDoc 注释说明字段用途

```typescript
/**
 * 可选字段，允许覆盖 BusinessFlowNode.name 作为页面展示标签
 * 优先于 businessFlowNode.name 被 getPageLabel() 使用
 */
pageName?: string;
```

### Step 2: 更新导出

确保类型导出包含新增字段（若类型定义在单独文件，需同步导出）。

### Step 3: 添加单元测试

参考 `specs/05-unit-tests.md` 中 `getPageLabel` 的 pageName 相关测试用例。

### Step 4: 类型检查

```bash
npx tsc --noEmit
```

预期：无新增 TypeScript 编译错误。

---

## 5. 验收测试

> **引用 PRD**: AC1, AC2, AC3 + F1.1

### 5.1 TypeScript 类型检查

```typescript
// ✅ AC1: pageName 为可选字段
const nodeWithoutPageName: ComponentNode = {
  id: 'node-1',
  type: 'component',
  label: 'Button',
  flowId: 'flow-1',
};
expect(nodeWithoutPageName.pageName).toBeUndefined();

// ✅ AC2: pageName 有值时类型正确
const nodeWithPageName: ComponentNode = {
  id: 'node-2',
  type: 'component',
  label: 'Button',
  flowId: 'flow-1',
  pageName: '首页按钮',
};
expect(typeof nodeWithPageName.pageName).toBe('string');
expect(nodeWithPageName.pageName).toBe('首页按钮');
```

### 5.2 getPageLabel 联动（见 specs/05）

```typescript
// ✅ F1.1: 验收标准断言
expect(typeof nodeWithoutPageName.pageName).toBe('string' | 'undefined');
```

---

## 6. 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 现有代码直接使用 `ComponentNode.name` 导致编译错误 | 低 | 确认无直接访问，所有 label 走 `getPageLabel()` |
| pageName 与 businessFlowNode.name 语义混淆 | 低 | JSDoc 清晰标注，文档说明优先级 |
| TypeScript strict mode 下 new field 导致 null 访问问题 | 低 | 严格使用 `?.` 可选链消费 pageName |
