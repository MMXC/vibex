# Spec: 通用组件组置顶

**Spec 版本**: 1.0  
**对应 PRD Epic**: Epic 2 — 组件树分组增强  
**对应 Story**: S2.3  
**对应功能点**: F2.4  
**验收标准**: AC5  

---

## 1. 概述

保持现有通用组件组（`isCommon=true`）置顶的行为不变，增强其分组元数据：
- `pageId` = `'__common__'`
- `label` = `'🔧 通用组件'`

此行为不改变现有 UI 排序逻辑，仅确保 `groupByFlowId()` 输出的 `ComponentGroup` 包含正确的元数据字段。

---

## 2. 详细设计

### 2.1 核心语义

| 属性 | 值 | 说明 |
|------|------|------|
| `isCommon` | `true` | 标识通用组件组（flowId = `'__common__'`）|
| `pageId` | `'__common__'` | 固定值，与 flowId 一致 |
| `label` | `'🔧 通用组件'` | UI 显示用标签，固定前缀 emoji |
| `componentCount` | ≥ 0 | 通用组件数量 |

### 2.2 sortGroups() 排序函数

**文件**: `packages/vibex-component-tree/src/utils/sortGroups.ts`（新建或集成到 `groupByFlowId.ts`）

```typescript
function sortGroups(groups: ComponentGroup[]): ComponentGroup[] {
  return groups.sort((a, b) => {
    // 通用组件组置顶
    if (a.isCommon && !b.isCommon) return -1;
    if (!a.isCommon && b.isCommon) return 1;
    // 其他组按 pageId 字母序（或原始顺序）保持不变
    return 0;
  });
}
```

### 2.3 groupByFlowId 中的通用组处理

```typescript
// 在 groupByFlowId 映射逻辑中
const groups: ComponentGroup[] = Array.from(map.entries()).map(([flowId, nodes]) => {
  const isCommon = flowId === '__common__';
  return {
    label: isCommon ? '🔧 通用组件' : getPageLabel(nodes[0], flowMap),  // ✅ F2.4
    pageId: flowId,
    componentCount: nodes.length,
    isCommon,
    components: nodes,
  };
});

return sortGroups(groups);
```

---

## 3. API/接口

### 3.1 sortGroups 函数

```typescript
// 签名
function sortGroups(groups: ComponentGroup[]): ComponentGroup[]
```

**排序规则**:
1. `isCommon === true` 的组排在最前面
2. 其他组保持原有相对顺序

### 3.2 与其他规格的交互

| 规格 | 交互点 |
|------|--------|
| `specs/02-component-group-enhancement.md` | `sortGroups()` 在 `groupByFlowId()` 末尾调用 |
| `specs/03-json-preview.md` | JSON 弹窗中通用组件组作为 `pages[0]`（因为置顶） |

---

## 4. 实现步骤

### Step 1: 实现 sortGroups 函数

1. 新建 `sortGroups.ts` 或在 `groupByFlowId.ts` 中内联实现
2. 导出函数供测试

### Step 2: 集成到 groupByFlowId

1. 在 `groupByFlowId()` 返回前调用 `sortGroups()`
2. 确保通用组件组 label 为 `'🔧 通用组件'`

### Step 3: 添加单元测试

参考 `specs/05-unit-tests.md` 中 `sortGroups` 相关测试用例。

### Step 4: 验证 JSON 预览

1. 构建含通用组件组的 groups 数据
2. 调用 `buildPagesData()` 确认 `pages[0].pageId === '__common__'`
3. 参考 `specs/03-json-preview.md` 验收测试

---

## 5. 验收测试

> **引用 PRD**: AC5 + F2.4

### 5.1 通用组件组 label 为 🔧 通用组件

```typescript
// ✅ AC5: isCommon=true 时，label 为「🔧 通用组件」
const groupsMixed: ComponentGroup[] = [
  {
    label: '页面A',
    pageId: 'flow-a',
    componentCount: 2,
    isCommon: false,
    components: [],
  },
  {
    label: '🔧 通用组件',
    pageId: '__common__',
    componentCount: 3,
    isCommon: true,
    components: [],
  },
  {
    label: '页面B',
    pageId: 'flow-b',
    componentCount: 1,
    isCommon: false,
    components: [],
  },
];

const sorted = sortGroups(groupsMixed);

expect(sorted[0].isCommon).toBe(true);                          // ✅ F2.4
expect(sorted[0].label).toBe('🔧 通用组件');                    // ✅ AC5
expect(sorted[0].pageId).toBe('__common__');                   // ✅ AC5
expect(sorted[0].componentCount).toBe(3);                      // ✅ F2.3 (componentCount)
```

### 5.2 通用组件组置顶

```typescript
// ✅ AC5: 通用组件组排在第一位
expect(sorted[0].pageId).toBe('__common__');
expect(sorted[1].pageId).toBe('flow-a');
expect(sorted[2].pageId).toBe('flow-b');
```

### 5.3 仅通用组件组时

```typescript
// ✅ 边界情况：只有一个通用组件组
const onlyCommon: ComponentGroup[] = [
  {
    label: '🔧 通用组件',
    pageId: '__common__',
    componentCount: 5,
    isCommon: true,
    components: [],
  },
];

const sortedOnly = sortGroups(onlyCommon);
expect(sortedOnly).toHaveLength(1);
expect(sortedOnly[0].isCommon).toBe(true);
```

### 5.4 无通用组件组时

```typescript
// ✅ 边界情况：没有通用组件组，顺序不变
const noCommon: ComponentGroup[] = [
  { label: 'A', pageId: 'flow-a', componentCount: 1, isCommon: false, components: [] },
  { label: 'B', pageId: 'flow-b', componentCount: 1, isCommon: false, components: [] },
];

const sortedNoCommon = sortGroups(noCommon);
expect(sortedNoCommon[0].pageId).toBe('flow-a');
expect(sortedNoCommon[1].pageId).toBe('flow-b');
```

### 5.5 componentCount 正确统计

```typescript
// ✅ F2.3: componentCount 不因置顶逻辑受影响
const commonWithCount = sorted[0];
expect(commonWithCount.componentCount).toBe(3);
expect(commonWithCount.componentCount).toBeGreaterThan(0);  // ✅ F2.3
```

### 5.6 JSON 预览中通用组在 pages[0]

```typescript
// ✅ 与 specs/03 联动
import { buildPagesData } from './buildPagesData';

const jsonData = buildPagesData(sorted);
expect(jsonData.pages[0].pageId).toBe('__common__');
expect(jsonData.pages[0].pageName).toBe('🔧 通用组件');
```

---

## 6. 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| `sortGroups` 中 `isCommon` 判断与 `flowId === '__common__'` 不一致 | 低 | 使用统一的 `isCommon` 标志位，不再重复判断 flowId |
| 排序函数 O(n log n) 略增 groupByFlowId 开销 | 低 | n 通常 ≤ 20（页面数），可忽略不计 |
| 通用组件组 label 含 emoji 可能导致文本对齐问题 | 低 | CSS 使用 flex + gap，emoji 不参与宽度计算 |
