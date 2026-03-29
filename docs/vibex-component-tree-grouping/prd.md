# PRD: VibeX Canvas 组件树分组修复 — 所有组件归入"通用组件"

> **项目**: vibex-component-tree-grouping
> **日期**: 2026-03-30
> **PM**: PM Agent
> **状态**: Draft

---

## 1. Executive Summary

### 1.1 问题描述

Canvas 组件树中，**所有 AI 生成的组件均被归入"🔧 通用组件"虚线框**，无法按页面/流程正确分组。用户无法从组件树直观区分不同业务流程的组件。

### 1.2 根因分析

**双层根因**：

1. **Backend 层面** — `vibex-backend/src/routes/v1/canvas/index.ts` L286-318：`generate-components` 路由的 AI prompt 未要求输出 `flowId` 字段，AI 响应中无 `flowId`，导致 `comp.flowId` 始终为 `undefined`，回退到 `flows[0]?.id`。

2. **Frontend 层面** — `vibex-fronted/src/lib/canvas/api/canvasApi.ts` L198：`fetchComponentTree` 将回退值 `flows[0]?.id` 错误地映射为前端 `COMMON_FLOW_IDS` 中的值（如 `'mock'`），或 flowId 为空时被赋值为 `'mock'`，触发 `inferIsCommon()` 返回 `true`。

**代码路径**：
```
Backend AI prompt (无 flowId 字段要求)
  → componentResult.data[].flowId = undefined
  → flowId: comp.flowId || flows[0]?.id || 'unknown'
  → Frontend fetchComponentTree: flowId: comp.flowId ?? 'mock'
  → inferIsCommon(node) → COMMON_FLOW_IDS.has('mock') = true
  → 所有组件进入"🔧 通用组件"虚线框
```

### 1.3 关键文件

| 文件 | 关键行 | 问题 |
|------|--------|------|
| `vibex-backend/src/routes/v1/canvas/index.ts` | L286-318 | AI prompt 未要求 flowId，响应无 flowId |
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | L198 | `flowId: comp.flowId ?? 'mock'` 默认值是 COMMON_FLOW_IDS |
| `vibex-fronted/src/components/canvas/ComponentTree.tsx` | L45 | `COMMON_FLOW_IDS = new Set(['mock', 'manual', 'common', ...])` |
| `vibex-fronted/src/components/canvas/ComponentTree.tsx` | L51-53 | `inferIsCommon()` 以 flowId 唯一判断 |

### 1.4 修复方案概览

| Epic | 描述 | 优先级 | 工时 |
|------|------|--------|------|
| Epic1 | 修复分组逻辑：不以 flowId 唯一判断，使用 domainType/componentType 多维判断 | P0 | 3h |
| Epic2 | 修复 AI 组件生成：prompt 要求 flowId，backend 正确传递 flowId | P0 | 4h |
| Epic3 | 添加手动重分组 UI：允许用户拖拽/右键重分配组件到正确分组 | P1 | 6h |

**总工时：13h（约 2 天）**

---

## 2. Epic 1: 修复分组逻辑 (P0)

**问题**：`inferIsCommon()` 以 flowId 唯一判断通用组件，flowId 错误时所有组件进入通用组。

**解决方案**：改为多维判断 —— flowId + componentType + domainType 综合判断。

### 2.1 详细设计

**修改文件**：`vibex-fronted/src/components/canvas/ComponentTree.tsx`

**当前代码（L45-60）**：
```tsx
const COMMON_FLOW_IDS = new Set(['mock', 'manual', 'common', '__ungrouped__', '']);

export function inferIsCommon(node: ComponentNode): boolean {
  if (COMMON_FLOW_IDS.has(node.flowId) || !node.flowId) {
    return true;
  }
  if (node.type === 'modal') {
    return true;
  }
  return false;
}
```

**新代码**：
```tsx
const COMMON_FLOW_IDS = new Set(['mock', 'manual', '__ungrouped__', '']);
// 移除 'common' — 它可能是有效的 flowId（对应名为"common"的业务流程）

/**
 * E2.1: 推断组件是否为通用组件
 * 规则（多维判断）：
 * 1. flowId ∈ COMMON_FLOW_IDS → 通用
 * 2. type ∈ ['modal', 'button', 'input', 'select', 'checkbox', 'badge'] → 通用
 * 3. domainType === 'common' → 通用
 * 4. flowId 为有效业务流程 ID（非 COMMON_FLOW_IDS 且存在于 flowNodes）→ 非通用
 * 5. 其他情况 → 非通用（页面级组件）
 */
export function inferIsCommon(
  node: ComponentNode,
  flowNodes?: BusinessFlowNode[]
): boolean {
  // 1. flowId 为通用标识
  if (COMMON_FLOW_IDS.has(node.flowId) || !node.flowId) {
    return true;
  }

  // 2. type 为通用组件类型（跨页面复用）
  const COMMON_COMPONENT_TYPES = new Set([
    'modal', 'button', 'input', 'select', 'checkbox', 'radio',
    'badge', 'tag', 'tooltip', 'dropdown', 'avatar', 'spinner',
  ]);
  if (COMMON_COMPONENT_TYPES.has(node.type)) {
    return true;
  }

  // 3. domainType === 'common'
  if ((node as any).domainType === 'common') {
    return true;
  }

  // 4. flowId 为有效的业务流程 ID（在 flowNodes 中存在）
  if (flowNodes && flowNodes.length > 0) {
    const flowExists = flowNodes.some(f => f.nodeId === node.flowId);
    if (flowExists) {
      return false; // 有效流程 ID → 非通用
    }
  }

  // 5. 兜底：flowId = 'common' 不再自动视为通用（可能是名为"common"的流程）
  // 已在步骤1排除，此处不再处理

  return false;
}
```

**`groupByFlowId` 签名变更**：
```tsx
// 添加 flowNodes 参数
export function groupByFlowId(
  nodes: ComponentNode[],
  flowNodes: BusinessFlowNode[]
): ComponentGroup[] {
  // ...
  for (const node of nodes) {
    if (inferIsCommon(node, flowNodes)) { // 传递 flowNodes
      commonNodes.push(node);
    } else {
      pageNodes.push(node);
    }
  }
  // ...
}
```

**`getPageLabel` 修复**：
```tsx
function getPageLabel(flowId: string, flowNodes: BusinessFlowNode[]): string {
  // 移除 flowId === 'common' 的特殊处理（它可能是有效流程）
  if (!flowId || flowId === 'mock' || flowId === 'manual') {
    return '未知页面';
  }
  const found = flowNodes.find((f) => f.nodeId === flowId);
  return found ? `📄 ${found.name}` : '未知页面';
}
```

### 2.2 Story

#### Story 1.1: inferIsCommon 多维判断

**作为** Canvas 组件树开发者
**我希望** `inferIsCommon()` 能综合 flowId、componentType、flowNodes 多维判断
**以便** 即使 flowId 错误（如 AI 未正确填充），组件类型也能作为分组的可靠依据

**验收标准**（Vitest）：
```ts
// vitest ComponentTree.test.ts

describe('inferIsCommon', () => {
  const flowNodes = [
    { nodeId: 'flow-1', name: '订单流程', type: 'process' },
    { nodeId: 'flow-2', name: '用户流程', type: 'process' },
  ];

  it('flowId ∈ COMMON_FLOW_IDS → true', () => {
    const node = { nodeId: 'n1', flowId: 'mock', name: '组件', type: 'page' };
    expect(inferIsCommon(node, flowNodes)).toBe(true);
  });

  it('type 为通用组件类型（modal）→ true', () => {
    const node = { nodeId: 'n1', flowId: 'flow-1', name: '弹窗', type: 'modal' };
    expect(inferIsCommon(node, flowNodes)).toBe(true);
  });

  it('flowId 为有效流程 ID 且 type 为 page → false', () => {
    const node = { nodeId: 'n1', flowId: 'flow-1', name: '订单页', type: 'page' };
    expect(inferIsCommon(node, flowNodes)).toBe(false);
  });

  it('flowId 为有效流程 ID（flowNodes 中存在）→ false（不论 type）', () => {
    const node = { nodeId: 'n1', flowId: 'flow-2', name: '按钮', type: 'button' };
    expect(inferIsCommon(node, flowNodes)).toBe(false);
    // button 即使 type 通用，如果 flowId 指向有效流程，仍归入对应分组
  });

  it('flowId = "common"（不在 COMMON_FLOW_IDS）→ false（可能是名为 common 的流程）', () => {
    const node = { nodeId: 'n1', flowId: 'common', name: '组件', type: 'page' };
    expect(inferIsCommon(node, flowNodes)).toBe(false);
  });

  it('flowId 为空 → true', () => {
    const node = { nodeId: 'n1', flowId: '', name: '组件', type: 'page' };
    expect(inferIsCommon(node, flowNodes)).toBe(true);
  });

  it('flowId 不在 COMMON_FLOW_IDS 且不在 flowNodes 中且 type 非通用 → false（__ungrouped__）', () => {
    const node = { nodeId: 'n1', flowId: 'unknown-id', name: '组件', type: 'page' };
    expect(inferIsCommon(node, flowNodes)).toBe(false);
  });
});
```

#### Story 1.2: groupByFlowId 集成 flowNodes

**作为** Canvas 组件树开发者
**我希望** `groupByFlowId` 接收 `flowNodes` 参数并传递给 `inferIsCommon`
**以便** 分组逻辑能利用 flowNodes 判断 flowId 的有效性

**验收标准**（Vitest）：
```ts
describe('groupByFlowId with flowNodes', () => {
  const flowNodes = [
    { nodeId: 'flow-1', name: '订单流程', type: 'process' },
    { nodeId: 'flow-2', name: '用户流程', type: 'process' },
  ];

  it('flowId=flow-1 的 page 类型组件 → 归入 flow-1 分组（非通用）', () => {
    const nodes: ComponentNode[] = [
      { nodeId: 'n1', flowId: 'flow-1', name: '订单页', type: 'page', props: {}, api: { method: 'GET', path: '/api', params: [] }, children: [], confirmed: false, status: 'pending' },
    ];
    const groups = groupByFlowId(nodes, flowNodes);
    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe('flow-1');
    expect(groups[0].isCommon).toBe(false);
  });

  it('flowId=flow-1 的 modal 类型组件 → 归入通用组件分组', () => {
    const nodes: ComponentNode[] = [
      { nodeId: 'n1', flowId: 'flow-1', name: '订单弹窗', type: 'modal', props: {}, api: { method: 'GET', path: '/api', params: [] }, children: [], confirmed: false, status: 'pending' },
    ];
    const groups = groupByFlowId(nodes, flowNodes);
    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe('__common__');
    expect(groups[0].isCommon).toBe(true);
  });

  it('flowId=flow-1 的 button 类型组件 → 归入 flow-1 分组（flowId 有效）', () => {
    const nodes: ComponentNode[] = [
      { nodeId: 'n1', flowId: 'flow-1', name: '订单按钮', type: 'button', props: {}, api: { method: 'GET', path: '/api', params: [] }, children: [], confirmed: false, status: 'pending' },
    ];
    const groups = groupByFlowId(nodes, flowNodes);
    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe('flow-1');
    expect(groups[0].isCommon).toBe(false);
  });
});
```

### 2.3 DoD (Definition of Done)

- [ ] `inferIsCommon()` 移除 'common' from `COMMON_FLOW_IDS`
- [ ] `inferIsCommon()` 添加 `flowNodes` 参数，验证 flowId 有效性
- [ ] `inferIsCommon()` 添加 componentType 多维判断
- [ ] `getPageLabel()` 移除 `flowId === 'common'` 的特殊处理
- [ ] `groupByFlowId()` 签名更新，传递 `flowNodes` 给 `inferIsCommon()`
- [ ] 所有 Vitest 测试通过（expect 全部 green）
- [ ] gstack browse 截图验证：示例数据下，组件按 flow 正确分组

---

## 3. Epic 2: 修复 AI 组件 flowId 生成 (P0)

**问题**：Backend AI prompt 未要求 flowId 字段，AI 响应无 flowId，组件 flowId 回退到不可预测的值。

**解决方案**：Backend prompt 要求输出 `flowId` 字段，并从输入的 `flows` 数据中为每个组件正确填充 `flowId`。

### 3.1 详细设计

**修改文件**：`vibex-backend/src/routes/v1/canvas/index.ts`

**当前代码问题（AI prompt，L286-318）**：
```
每个组件需包含：
- name: 组件名
- type: 类型
- props: 默认属性
- api: 接口
// ❌ 没有 flowId 字段
```

**新 AI prompt**：
```typescript
const componentPrompt = `基于以下业务流程，生成组件树节点。

流程列表：
${flowSummary}

每个流程 → 多个组件。
每个组件需包含：
- flowId: 所属流程 ID（必须从上述流程列表中选取，例如 "flow-1"、"flow-2"）
- name: 组件名（名词短语，如"订单卡片"、"支付按钮"）
- type: 类型（button|form|table|card|modal|input|list|navigation|page|detail|form）
- props: 默认属性（placeholder/defaultValue/title 等）
- api: 接口 { method: GET|POST|PUT|DELETE, path: "/api/xxx", params: ["id"] }

注意：
- flowId 必须精确匹配上述流程的 id
- 一个流程对应多个组件时，flowId 相同
- 输出 JSON 数组，不要其他文字`
```

**修改 `components` 映射逻辑**：
```typescript
// 当前（有问题）：
const components: ComponentNode[] = componentResult.data.map((comp) => ({
  flowId: comp.flowId || flows[0]?.id || 'unknown', // AI 未返回 flowId
  // ...
}));

// 修改为：
const components: ComponentNode[] = componentResult.data
  .map((comp) => {
    // 验证 flowId 是否在有效 flows 中
    const validFlow = flows.find(f => f.id === comp.flowId || f.name === comp.flowId);
    return {
      flowId: validFlow?.id || flows[0]?.id || 'unknown',
      name: comp.name || '未命名组件',
      // ...
    };
  });
```

**同时修改 Frontend `fetchComponentTree`**（`vibex-fronted/src/lib/canvas/api/canvasApi.ts`）：
```typescript
// 当前（有问题）：
flowId: comp.flowId ?? 'mock', // 'mock' ∈ COMMON_FLOW_IDS

// 修改为：
flowId: comp.flowId || '__ungrouped__', // 不使用 'mock'，避免误判为通用组件
```

### 3.2 Story

#### Story 2.1: Backend AI prompt 增加 flowId 字段要求

**作为** Backend 开发者
**我希望** AI prompt 要求输出 `flowId` 字段
**以便** AI 生成的组件响应包含正确的 flowId

**验收标准**（API 测试）：
```ts
// vitest or manual test
it('AI 生成的组件包含有效 flowId', async () => {
  const flows = [
    { id: 'flow-1', name: '订单流程', contextId: 'ctx-1', steps: [{ name: '下单', actor: '用户' }] },
    { id: 'flow-2', name: '用户流程', contextId: 'ctx-1', steps: [{ name: '登录', actor: '用户' }] },
  ];
  const result = await canvasApi.generateComponents({
    contexts: [{ id: 'ctx-1', name: '交易', description: '', type: '' }],
    flows,
    sessionId: 'test-session',
  });

  expect(result.success).toBe(true);
  result.components.forEach(comp => {
    expect(comp.flowId).toBeDefined();
    expect(['flow-1', 'flow-2', '__ungrouped__']).toContain(comp.flowId);
    // 不应该是 'mock' 或 'common'
    expect(['mock', 'common']).not.toContain(comp.flowId);
  });
});
```

#### Story 2.2: Frontend fetchComponentTree flowId 回退值修正

**作为** Frontend 开发者
**我希望** `fetchComponentTree` 的 flowId 回退值不是 `'mock'`
**以便** 即使 Backend 返回无效 flowId，组件也不会被误判为通用组件

**验收标准**：
```ts
it('flowId 回退为 __ungrouped__（非 COMMON_FLOW_IDS）', () => {
  const rawComponents = [{ name: '测试', type: 'page', flowId: undefined }];
  const mapped = rawComponents.map(comp => ({
    flowId: comp.flowId || '__ungrouped__',
  }));
  expect(mapped[0].flowId).toBe('__ungrouped__');
  // __ungrouped__ ∈ COMMON_FLOW_IDS，所以仍会归入通用组
  // 但这是"未分组"而非"flowId=mock"的误判
});
```

### 3.3 DoD (Definition of Done)

- [ ] Backend AI prompt 更新，增加 `flowId` 字段要求及填写说明
- [ ] Backend `components` 映射逻辑增加 flowId 有效性验证
- [ ] Frontend `fetchComponentTree` flowId 回退值改为 `'__ungrouped__'`（而非 `'mock'`）
- [ ] `COMMON_FLOW_IDS` 包含 `'__ungrouped__'`（已有），`inferIsCommon` 对 `__ungrouped__` 返回 true
- [ ] Backend API 测试通过
- [ ] gstack 端到端测试：AI 生成组件后，组件树按 flow 正确分组

---

## 4. Epic 3: 手动重分组 UI (P1)

**问题**：即使修复了 AI 生成逻辑，历史数据中可能存在 flowId 错误的组件，用户应能手动修正。

**解决方案**：在组件卡片的右键菜单或 InfoPanel 中添加"重分配到分组"操作。

### 4.1 详细设计

**修改文件**：
- `vibex-fronted/src/components/canvas/ComponentTree.tsx` — 添加右键菜单
- `vibex-fronted/src/components/canvas/InfoPanel.tsx` — 添加分组选择器

**UI 方案 A：右键菜单（推荐）**
```
组件卡片右键菜单：
├── ✏️ 编辑组件
├── 🔗 重分配到分组
│   ├── 📄 订单流程 (flow-1)
│   ├── 📄 用户流程 (flow-2)
│   └── 🔧 通用组件
├── 📋 复制组件
├── 🗑️ 删除组件
```

**UI 方案 B：InfoPanel 分组选择器**
在 InfoPanel（选中组件时显示的侧边栏）中添加"所属分组"下拉框，列出所有 flow 分组 + 通用组件选项。

### 4.2 Story

#### Story 3.1: 右键菜单添加"重分配到分组"

**作为** 用户
**我希望** 在组件卡片上右键 → "重分配到分组" → 选择目标分组
**以便** 修正 AI 分配错误或手动调整组件归属

**验收标准**（Playwright）：
```ts
// playwright ComponentTreeRegroup.spec.ts

it('右键菜单重分配组件到正确分组', async ({ page }) => {
  await page.goto('/canvas?project=test');

  // 选中一个在"通用组件"中的组件
  const card = page.locator('[data-testid="component-card"]').first();
  await card.click({ button: 'right' });

  // 等待右键菜单
  const contextMenu = page.locator('[data-testid="context-menu"]');
  await expect(contextMenu).toBeVisible();

  // 点击"重分配到分组"
  await contextMenu.getByText('重分配到分组').hover();
  const submenu = page.locator('[data-testid="submenu"]');
  await expect(submenu).toBeVisible();

  // 选择"订单流程"
  await submenu.getByText('📄 订单流程').click();

  // 验证组件已移动到正确分组
  const orderFlowGroup = page.locator('[data-testid="group-flow-1"]');
  await expect(orderFlowGroup.getByText('订单卡片')).toBeVisible();

  // 验证"通用组件"中不再有此组件
  const commonGroup = page.locator('[data-testid="group-common"]');
  await expect(commonGroup.getByText('订单卡片')).not.toBeVisible();
});
```

#### Story 3.2: 重分配后 store 持久化

**作为** 系统
**我希望** 重分配操作触发 canvasStore 更新并持久化
**以便** 刷新页面后分组状态保持

**验收标准**：
```ts
it('重分配后 node.flowId 更新且 store 同步', async () => {
  const store = useCanvasStore.getState();
  const nodeId = 'comp-test-1';

  // 手动更新 flowId
  store.updateComponentNode(nodeId, { flowId: 'flow-1' });

  const updatedNode = store.componentNodes.find(n => n.nodeId === nodeId);
  expect(updatedNode?.flowId).toBe('flow-1');
});
```

### 4.3 DoD (Definition of Done)

- [ ] 右键菜单或 InfoPanel 提供"重分配到分组"入口
- [ ] 分组选项列出所有有效 flow + 通用组件选项
- [ ] 重分配后组件正确移动到目标分组（UI 更新）
- [ ] `canvasStore.updateComponentNode()` 支持 flowId 更新
- [ ] Playwright 端到端测试通过
- [ ] 重分配操作有 toast 确认提示

---

## 5. Non-Functional Requirements

### 5.1 向后兼容

- Epic1/Epic2 的修改不能破坏现有测试（Vitest 测试覆盖）
- 组件数据结构不变（仅 `inferIsCommon` 逻辑变更）

### 5.2 性能

- `inferIsCommon` 添加 `flowNodes` 参数后，每次分组调用 O(n×m)（n=组件数，m=flowNodes 数），需确保 m ≤ 50（通常场景）

### 5.3 测试覆盖

| 测试类型 | 工具 | 覆盖 Epic |
|----------|------|-----------|
| 单元测试 | Vitest | Epic1, Epic2 |
| 集成测试 | Vitest + canvasStore | Epic1, Epic2 |
| 端到端测试 | Playwright | Epic1, Epic2, Epic3 |

---

## 6. Out of Scope

- AI prompt 的其他优化（组件质量、命名规范等）
- 组件 drag-drop 拖入不同分组（Epic3 仅限右键菜单重分配）
- 批量重分配（多个组件同时重分配）
- 分组折叠/展开状态持久化

---

## 7. Dependencies

| 依赖 | 来源 | 说明 |
|------|------|------|
| `BusinessFlowNode[]` (flowNodes) | canvasStore / API | 分组需要有效的 flowNodes 数据 |
| `canvasStore.updateComponentNode()` | canvasStore | Epic3 需要支持 flowId 字段更新 |
| Playwright 测试环境 | vibex-fronted | E2E 测试基础设施 |

---

## 8. 实施计划

```
Week 1:
├── Day 1-2: Epic1 — 分组逻辑修复（3h）
│   ├── 修改 inferIsCommon() 多维判断
│   ├── 修改 groupByFlowId() 签名
│   └── Vitest 测试
└── Day 3-4: Epic2 — AI flowId 生成修复（4h）
    ├── 修改 Backend AI prompt
    ├── 修改 Backend 组件映射
    ├── 修改 Frontend fetchComponentTree 回退值
    └── API + gstack 验证

Week 2:
├── Day 1-2: Epic3 — 手动重分组 UI（6h）
│   ├── 右键菜单 UI
│   ├── store.updateComponentNode 支持
│   └── Playwright E2E 测试
└── Day 3: 回归测试 + 集成验证
```

---

## 9. 验收总览

| 验收项 | 标准 | 工具 |
|--------|------|------|
| 所有组件不再误入"通用组件" | AI 生成组件后，flowId 有效组件归入对应 flow 分组 | gstack browse 截图 |
| `inferIsCommon` 逻辑正确 | Vitest 全部通过 | Vitest |
| AI flowId 生成正确 | Backend API 测试通过 | Vitest |
| 手动重分组功能可用 | Playwright E2E 通过 | Playwright |
| 现有测试不破坏 | CI 全部 green | GitHub Actions |
