# Spec: matchFlowNode() 模糊匹配增强

**关联 PRD**: F1.2（prefix 匹配增强）、F1.3（名称模糊匹配增强）
**关联 Story**: S1.2
**关联验收标准**: AC2.1、AC2.2、AC2.3、AC2.4

---

## 概述

`matchFlowNode()` 是 `ComponentTree.tsx` 中将组件的 `flowId` 与 `BusinessFlowNode` 列表进行匹配的函数。当前实现仅支持精确 nodeId 匹配（L1），当 AI 生成的 `flowId` 不完全等于 nodeId 时，组件无法正确关联到页面，导致"未知页面"问题。

本规格扩展 L2（prefix 匹配）和 L3（名称模糊匹配）兜底逻辑，确保在精确匹配失败后仍有合理的 fallback 路径。

---

## 详细设计

### 匹配层级（L1 → L2 → L3）

```
flowId 输入
    │
    ▼
[L1] 精确 nodeId 匹配（完全相等）
    │ 失败
    ▼
[L2] Prefix 前缀匹配
    │ 失败
    ▼
[L3] 名称模糊匹配
    │ 失败
    ▼
返回 null（组件归入"未知页面"）
```

### L1: 精确匹配
- 直接比较 `flowId === node.nodeId`
- 命中则返回该 node

### L2: Prefix 前缀匹配
- 规则：将 `flowId` 与 `flowNodes` 中每个 `node.nodeId` 做前缀比较
- 示例：`flowId='abc'` → `nodeId='abc-def-ghi'` 匹配成功
- 示例：`flowId='flow-abc'` → `nodeId='flow-abc-123'` 匹配成功
- 排序：按 `nodeId` 升序，返回第一个匹配项（避免随机性）
- 边界：空 `flowId` 或空 `flowNodes` 直接返回 null，不抛异常

### L3: 名称模糊匹配
- 规则：将 `flowId` 与 `flowNodes` 中每个 `node.name` 做包含匹配
- 步骤：
  1. 标准化：将 `flowId` 转为小写，移除空格
  2. 检查 `node.name.toLowerCase()` 是否包含标准化后的 `flowId`
  3. 或检查标准化后的 `flowId` 是否包含在 `node.name.toLowerCase()` 中
- 示例：`flowId='login-flow'` → `name='登录流程'`（不匹配）、`name='LOGIN_FLOW'`（匹配）
- 示例：`flowId='订单'` → `name='订单管理'`（匹配）
- 排序：按 `flowNodes` 原始顺序，返回第一个匹配项

### 通用组件保护
- 如果 `flowId === 'common'`，直接返回 `{ isCommon: true }`，不再走 L2/L3
- 避免误将通用组件匹配到某个页面

---

## API/接口

### 函数签名

```typescript
interface BusinessFlowNode {
  nodeId: string;
  name: string;
}

interface MatchResult {
  node: BusinessFlowNode;
  matchLevel: 'exact' | 'prefix' | 'name';
}

/**
 * 将 flowId 与 BusinessFlowNode 列表进行匹配
 * @param flowId - 组件的 flowId
 * @param flowNodes - BusinessFlowNode 列表
 * @returns MatchResult | null
 */
function matchFlowNode(
  flowId: string,
  flowNodes: BusinessFlowNode[]
): MatchResult | null;
```

---

## 实现步骤

1. **重构 matchFlowNode 函数**
   - 将现有逻辑提取为 L1
   - 增加 L2 prefix 匹配分支
   - 增加 L3 名称模糊匹配分支
   - 统一返回 MatchResult 结构（包含 matchLevel）

2. **通用组件保护**
   - 在函数入口处增加 `if (flowId === 'common') return null`（ComponentTree 侧处理 isCommon 判断）

3. **边界保护**
   - `flowId` 为空字符串时返回 null
   - `flowNodes` 为空数组时返回 null

4. **类型安全**
   - 补充 TypeScript 类型定义

---

## 验收测试

> 引用 PRD 验收标准：AC2.1、AC2.2、AC2.3、AC2.4

```typescript
import { matchFlowNode } from './matchFlowNode';
import type { BusinessFlowNode, MatchResult } from './matchFlowNode';

const mockFlowNodes: BusinessFlowNode[] = [
  { nodeId: 'flow-abc-123', name: '登录流程' },
  { nodeId: 'flow-def-456', name: '订单管理' },
  { nodeId: 'LOGIN_FLOW_ID', name: 'LOGIN_FLOW' },
];

// AC2.1: 精确匹配 nodeId
const result1 = matchFlowNode('flow-abc-123', mockFlowNodes);
expect(result1).not.toBeNull();
expect(result1!.node.nodeId).toBe('flow-abc-123');
expect(result1!.matchLevel).toBe('exact');

// AC2.2: Prefix 前缀匹配
const result2 = matchFlowNode('abc', mockFlowNodes);
expect(result2).not.toBeNull();
expect(result2!.node.nodeId).toBe('flow-abc-123');
expect(result2!.matchLevel).toBe('prefix');

// AC2.2: prefix 匹配多个结果时返回第一个（按 nodeId 排序）
const result2b = matchFlowNode('flow', mockFlowNodes);
expect(result2b).not.toBeNull();
expect(result2b!.node.nodeId).toBe('flow-abc-123'); // 排序后 abc 在 def 前

// AC2.3: 名称精确匹配
const result3 = matchFlowNode('登录流程', mockFlowNodes);
expect(result3).not.toBeNull();
expect(result3!.node.name).toBe('登录流程');
expect(result3!.matchLevel).toBe('name');

// AC2.4: 名称模糊匹配（英文字符相关）
const result4 = matchFlowNode('login-flow', mockFlowNodes);
expect(result4).not.toBeNull();
expect(result4!.node.nodeId).toBe('LOGIN_FLOW_ID');
expect(result4!.matchLevel).toBe('name');

// 名称模糊匹配（中文包含）
const result4b = matchFlowNode('订单', mockFlowNodes);
expect(result4b).not.toBeNull();
expect(result4b!.node.name).toBe('订单管理');
expect(result4b!.matchLevel).toBe('name');

// 边界：flowId 不匹配任何节点
const result5 = matchFlowNode('not-exists', mockFlowNodes);
expect(result5).toBeNull();

// 边界：空 flowId 不抛异常
const result6 = matchFlowNode('', mockFlowNodes);
expect(result6).toBeNull();

// 边界：空 flowNodes 不抛异常
const result7 = matchFlowNode('flow-abc-123', []);
expect(result7).toBeNull();

// 优先级：精确匹配 > prefix > 名称匹配
const flowNodesWithSimilar: BusinessFlowNode[] = [
  { nodeId: 'flow-abc', name: '登录' },
  { nodeId: 'flow-abc-def', name: '登录流程' },
];
const result8 = matchFlowNode('flow-abc', flowNodesWithSimilar);
expect(result8!.node.nodeId).toBe('flow-abc'); // 精确匹配优先
expect(result8!.matchLevel).toBe('exact');
```

---

## 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| L2 prefix 匹配过于宽松导致误匹配 | 中 | 仅在 L1 失败后使用，且需严格前缀关系（`flowId` 短于 `nodeId`） |
| L3 名称匹配与实际业务含义不符 | 中 | 仅作为兜底，且 ComponentTree 侧已通过 `isCommon` 保护关键类型 |
| 多 nodeId 含相同 prefix 时顺序不确定 | 低 | 明确按 nodeId 升序排序取第一个 |
| 回归风险：改动现有逻辑 | 中 | 通过 S1.4 回归测试覆盖；现有 L1 精确匹配保持不变 |
