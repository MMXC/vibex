# IMPLEMENTATION_PLAN: VibeX Canvas 组件树分组修复

> **项目**: vibex-component-tree-grouping
> **创建日期**: 2026-03-30
> **基于**: PRD v1 + Architecture
> **代码文件**: `vibex-fronted/src/components/canvas/ComponentTree.tsx`
> **后端文件**: `vibex-backend/src/routes/v1/canvas/index.ts`

---

## 1. 现状分析

### 1.1 问题快照

```
当前分组逻辑:
AI 生成组件 → flowId = undefined → flowId = 'mock' → inferIsCommon() = true
                                            ↓
                                    所有组件 → "🔧 通用组件" 虚线框
```

### 1.2 文件位置索引

| 元素 | 文件 | 行号 |
|------|------|------|
| `inferIsCommon()` | ComponentTree.tsx | L45-53 |
| `getPageLabel()` | ComponentTree.tsx | L87-92 |
| `groupByFlowId()` | ComponentTree.tsx | L101-163 |
| `COMMON_FLOW_IDS` | ComponentTree.tsx | L44 |
| AI prompt | backend canvas/index.ts | L286-318 |
| `fetchComponentTree` | canvasApi.ts | L198 |

---

## 2. Epic 1: 分组逻辑多维判断 — 3h

### Story 1.1: inferIsCommon 多维判断 (1.5h)

**修改**: `ComponentTree.tsx`

```typescript
// 旧
const COMMON_FLOW_IDS = new Set(['mock', 'manual', 'common', '__ungrouped__', '']);

export function inferIsCommon(node: ComponentNode): boolean {
  if (COMMON_FLOW_IDS.has(node.flowId) || !node.flowId) {
    return true;
  }
  return false;
}

// 新
const COMMON_COMPONENT_TYPES = new Set([
  'modal', 'button', 'input', 'select', 'checkbox', 'radio',
  'badge', 'tag', 'tooltip', 'dropdown', 'avatar', 'spinner',
]);

export function inferIsCommon(
  node: ComponentNode,
  flowNodes?: BusinessFlowNode[]
): boolean {
  // 1. flowId 为通用标识
  if (COMMON_FLOW_IDS.has(node.flowId) || !node.flowId) {
    return true;
  }

  // 2. 组件类型为通用
  if (COMMON_COMPONENT_TYPES.has(node.type)) {
    return true;
  }

  // 3. flowId 为有效业务流程 ID
  if (flowNodes && flowNodes.length > 0) {
    const flowExists = flowNodes.some(f => f.nodeId === node.flowId);
    if (flowExists) return false;
  }

  return false;
}
```

### Story 1.2: getPageLabel 修复 (0.5h)

```typescript
// getPageLabel 移除 'common' 特殊处理
function getPageLabel(flowId: string, flowNodes: BusinessFlowNode[]): string {
  if (!flowId || flowId === 'mock' || flowId === 'manual') {
    return '未知页面';
  }
  const found = flowNodes.find((f) => f.nodeId === flowId);
  return found ? `📄 ${found.name}` : '❓ 未知页面';
}
```

### Story 1.3: 单元测试 (1h)

```typescript
// ComponentTree.test.ts (新建)

describe('inferIsCommon', () => {
  const flowNodes = [
    { nodeId: 'flow-1', name: '订单流程' },
    { nodeId: 'flow-2', name: '用户流程' },
  ];

  test('flowId=mock → true', () => {
    expect(inferIsCommon({ flowId: 'mock', type: 'page' }, [])).toBe(true);
  });

  test('flowId=有效值 → false', () => {
    expect(inferIsCommon({ flowId: 'flow-1', type: 'page' }, flowNodes)).toBe(false);
  });

  test('type=modal → true（不受 flowId 影响）', () => {
    expect(inferIsCommon({ flowId: 'flow-1', type: 'modal' }, flowNodes)).toBe(true);
  });

  test('无 flowId → true', () => {
    expect(inferIsCommon({ flowId: '', type: 'page' }, [])).toBe(true);
  });
});
```

**DoD**:
- [ ] `inferIsCommon()` 支持多维判断
- [ ] `COMMON_COMPONENT_TYPES` 覆盖常见通用组件
- [ ] 测试覆盖率 ≥ 80%

---

## 3. Epic 2: Backend AI flowId 修复 — 4h

### Story 2.1: 修改 AI prompt (2h)

**修改**: `backend routes/v1/canvas/index.ts` L286-318

```typescript
// 在 prompt 中增加 flowId 要求
const prompt = `
为每个组件指定 flowId：
- flowId 必须是 BusinessFlowNode.nodeId 之一
- 如果组件属于特定流程，使用该流程的 nodeId
- 跨流程复用的组件使用 'common'
- 模拟/手动创建的组件使用 'mock' 或 'manual'

输出格式：
{
  "data": [{
    "nodeId": "comp-xxx",
    "flowId": "flow-node-1",  // ← 必须
    "name": "组件名",
    "type": "page"
  }]
}
`;
```

### Story 2.2: 后端数据验证 (1h)

```typescript
// 确保 AI 输出的 flowId 有效
const validFlowIds = flows.map(f => f.nodeId);
const filteredComponents = componentResult.data.filter(
  c => validFlowIds.includes(c.flowId) || COMMON_FLOW_IDS.has(c.flowId)
);
```

### Story 2.3: 前端 fallback 优化 (1h)

**修改**: `canvasApi.ts` L198

```typescript
// 旧
flowId: comp.flowId ?? 'mock'

// 新：如果 flowId 不在有效 flowIds 中，设为空（让前端推断）
flowId: validFlowIds.includes(comp.flowId) ? comp.flowId : ''
```

**DoD**:
- [ ] AI prompt 包含 flowId 输出要求
- [ ] 后端验证 flowId 有效性
- [ ] 前端正确处理无效 flowId

---

## 4. Epic 3: 手动重分组 UI — 6h

### Story 3.1: 右键重分组菜单 (2h)

```typescript
// ComponentTree.tsx

<ContextMenu
  trigger="right-click"
  items={[
    { label: '移至通用组件', action: () => moveToCommon(nodeId) },
    { label: '移至...', submenu: flowNodes.map(f => ({
      label: f.name,
      action: () => moveToFlow(nodeId, f.nodeId)
    }))},
    { label: '标记页面类型', submenu: [
      { label: '列表页面', action: () => setDomainType(nodeId, 'list') },
      { label: '详情页面', action: () => setDomainType(nodeId, 'detail') },
      { label: '表单页面', action: () => setDomainType(nodeId, 'form') },
    ]},
  ]}
/>
```

### Story 3.2: drag-drop 重分组 (2h)

```typescript
// 允许拖拽组件到不同分组
<DraggableItem draggableId={node.nodeId}>
  <ComponentNodeCard node={node} />
</DraggableItem>

<Droppable droppableId={groupId}>
  {groupNodes.map(node => (
    <DraggableItem key={node.nodeId} draggableId={node.nodeId} />
  ))}
</Droppable>
```

### Story 3.3: 状态持久化 (2h)

```typescript
// 用户手动调整的分组 → 持久化到 backend
await canvasApi.updateComponentGroup({
  nodeId,
  flowId: newFlowId,
  domainType: newDomainType,
});
```

**DoD**:
- [ ] 右键菜单可以重分组
- [ ] 拖拽可以移动组件到不同分组
- [ ] 分组调整保存到后端

---

## 5. 总工时

| Epic | 任务 | 工时 |
|------|------|------|
| Epic 1 | 分组逻辑多维判断 | 3h |
| Epic 2 | Backend AI flowId 修复 | 4h |
| Epic 3 | 手动重分组 UI | 6h (P1) |
| **合计** | | **7-13h** |

---

## 6. 文件清单

**修改文件 (Frontend)**:
- `vibex-fronted/src/components/canvas/ComponentTree.tsx`
- `vibex-fronted/src/lib/canvas/api/canvasApi.ts`

**修改文件 (Backend)**:
- `vibex-backend/src/routes/v1/canvas/index.ts`

**新增文件**:
- `vibex-fronted/src/components/canvas/ComponentTree.test.ts`
