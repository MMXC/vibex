# Architecture: 组件树按页面组织 — flowId 匹配修复

**项目**: vibex-proposals-20260411-page-tree
**阶段**: design-architecture
**Architect**: Architect
**日期**: 2026-04-07

---

## 1. 问题摘要

### 根因
Canvas 组件树按 `flowId` 分组展示，但 AI 生成组件时 flowId 填充不正确：
1. **AI prompt 未强制要求 flowId** — 导致 AI 返回的 flowId 为空或 'common'
2. **matchFlowNode() 模糊匹配不够** — prefix 和名称匹配覆盖不足

### 当前数据流
```
AI 生成组件
  ↓
组件保存到 componentStore (flowId 可能为空/'common'/错误值)
  ↓
ComponentTree 按 flowId 分组
  ↓
错误归入 "通用组件" 或 "未知页面"
```

---

## 2. 技术方案

### 2.1 AI Prompt 强化 flowId 填充

**修改文件**: `src/lib/prompts/ai-generate-components.ts`（或相关 prompt 文件）

```typescript
// 方案: 在 prompt 中明确要求返回 flowId
const COMPONENT_GENERATION_PROMPT = `
  ...
  Respond with JSON array of components.
  Each component MUST include:
  - id: unique identifier
  - name: component name
  - type: component type
  - flowId: MUST be one of the following BusinessFlow nodeIds: ${flowNodeIds.join(', ')}
  - flowId MUST NOT be empty or 'common' unless the component is truly generic (modal, button, etc.)
`;
```

**fallback**: 如果 AI 仍返回空 flowId，后端在保存时做默认值处理。

### 2.2 matchFlowNode() 模糊匹配增强

**修改文件**: `src/components/canvas/ComponentTree.tsx`

```typescript
// 当前匹配层级：
// L1: 精确匹配 nodeId
// L2: Prefix 匹配
// L3: 名称模糊匹配（toLowerCase + replace）

// 增强 L2（prefix 匹配）:
const prefix = flowNodes.find((f) =>
  flowId.startsWith(f.nodeId) || f.nodeId.startsWith(flowId)
);

// 增强 L3（名称模糊匹配）:
const nameMatch = flowNodes.find((f) => {
  const normalizedName = f.name.toLowerCase().replace(/[\s\-_]/g, '');
  const normalizedId = flowId.toLowerCase().replace(/[\s\-_]/g, '');
  return (
    normalizedName.includes(normalizedId) ||
    normalizedId.includes(normalizedName)
  );
});
```

### 2.3 组件树分组逻辑

**COMMON_FLOW_IDS 定义**（已存在，保留）:
```typescript
const COMMON_FLOW_IDS = new Set([
  'mock', 'manual', 'common', '__ungrouped__', ''
]);
```

**分组优先级**:
```
1. flowId ∈ COMMON_FLOW_IDS → 通用组件
2. matchFlowNode(flowId) 匹配成功 → 显示 flowNode.name
3. 兜底 → 显示 flowId 前 12 字符
```

---

## 3. 模块划分

```
src/
  components/canvas/
    ComponentTree.tsx        # matchFlowNode(), getPageLabel() (修改)
  lib/prompts/
    ai-generate-components.ts  # AI prompt 强化 (修改)
  __tests__/
    ComponentTreeGrouping.test.ts  # 新增 matchFlowNode 单元测试 (新增)
```

---

## 4. 数据模型

```typescript
interface BusinessFlowNode {
  nodeId: string;    // 匹配目标: "flow-abc-123"
  name: string;     // 名称: "登录流程"
  flowId: string;   // 同 nodeId
}

interface ComponentNode {
  id: string;
  name: string;
  type: string;
  flowId: string;   // 关键字段: 必须为有效 BusinessFlowNode.nodeId
}
```

---

## 5. 风险评估

| 风险 | 等级 | 缓解 |
|------|------|------|
| AI 仍返回错误 flowId | 中 | matchFlowNode 增强兜底 |
| 模糊匹配误匹配 | 低 | 优先级精确 > prefix > 名称，不影响精确匹配 |
| 修改破坏通用组件分组 | 低 | S1.3 回归验证 |

**性能影响**: 零。matchFlowNode 仅 O(n) 遍历，无新增计算。

---

## 6. 验收标准

| ID | 标准 | 验证 |
|----|------|------|
| AC1.1 | AI prompt 含 flowId 指令 | 检查 prompt 内容 |
| AC2.1 | exact match 正确 | `matchFlowNode('flow-abc', [nodeId='flow-abc'])` → node |
| AC2.2 | prefix match 正确 | `matchFlowNode('flow-abc-1', [nodeId='flow-abc'])` → node |
| AC2.3 | 名称匹配正确 | `matchFlowNode('登录', [name='登录流程'])` → node |
| AC3.1 | 通用组件仍正确 | type=modal → 通用组件 |

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260411-page-tree
- **执行日期**: 2026-04-07
