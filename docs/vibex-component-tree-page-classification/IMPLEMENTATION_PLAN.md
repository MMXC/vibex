# IMPLEMENTATION_PLAN: VibeX Canvas 组件树页面分类修复

> **项目**: vibex-component-tree-page-classification
> **创建日期**: 2026-03-30
> **基于**: PRD v1 + Architecture
> **代码文件**: `vibex-fronted/src/components/canvas/ComponentTree.tsx`

---

## 1. 现状分析

### 1.1 问题快照

```
getPageLabel() 当前逻辑:
flowId → flowNodes.find(nodeId === flowId) → 找不到 → "未知页面"
```

### 1.2 文件位置索引

| 元素 | 文件 | 行号 |
|------|------|------|
| `getPageLabel()` | ComponentTree.tsx | L87-92 |
| `inferIsCommon()` | ComponentTree.tsx | L45-53 |
| `COMMON_FLOW_IDS` | ComponentTree.tsx | L44 |
| AI prompt | backend canvas/index.ts | L286-318 |

---

## 2. Epic 1: getPageLabel Fallback 逻辑 — 2h

### Story 1.1: 实现 fallback 匹配 (1h)

**修改**: `ComponentTree.tsx` — `getPageLabel()`

```typescript
// 增强 getPageLabel
function getPageLabel(
  flowId: string,
  flowNodes: BusinessFlowNode[]
): string {
  // 0. 通用组件
  if (!flowId || COMMON_FLOW_IDS.has(flowId)) {
    return '🔧 通用组件';
  }

  // 1. 精确匹配
  const exact = flowNodes.find(f => f.nodeId === flowId);
  if (exact) return `📄 ${exact.name}`;

  // 2. Prefix 匹配
  const prefixMatch = flowNodes.find(f =>
    flowId.startsWith(f.nodeId) || f.nodeId.startsWith(flowId)
  );
  if (prefixMatch) return `📄 ${prefixMatch.name}`;

  // 3. Name 模糊匹配
  const normalizedFlowId = flowId.toLowerCase().replace(/[\s-_]/g, '');
  const nameMatch = flowNodes.find(f => {
    const normalizedName = f.name.toLowerCase().replace(/[\s-_]/g, '');
    return normalizedName.includes(normalizedFlowId) ||
           normalizedFlowId.includes(normalizedName);
  });
  if (nameMatch) return `📄 ${nameMatch.name}`;

  // 4. 兜底
  return `❓ ${flowId}`;
}
```

### Story 1.2: 单元测试 (1h)

```typescript
// ComponentTree.test.ts

describe('getPageLabel', () => {
  const flowNodes = [
    { nodeId: 'flow-1', name: '订单流程' },
    { nodeId: 'flow-2', name: '用户认证流程' },
  ];

  test('精确匹配', () => {
    expect(getPageLabel('flow-1', flowNodes)).toBe('📄 订单流程');
  });

  test('prefix 匹配', () => {
    expect(getPageLabel('flow-1-v2', flowNodes)).toBe('📄 订单流程');
  });

  test('name 模糊匹配', () => {
    expect(getPageLabel('order', flowNodes)).toBe('📄 订单流程');
  });

  test('flowId=mock → 通用组件', () => {
    expect(getPageLabel('mock', flowNodes)).toBe('🔧 通用组件');
  });

  test('无匹配 → 兜底', () => {
    expect(getPageLabel('xyz-unknown', flowNodes)).toBe('❓ xyz-unknown');
  });
});
```

**DoD**:
- [x] getPageLabel 支持 4 层 fallback (通用标识 → 精确 → prefix → 模糊 → ❓兜底)
- [x] 测试覆盖率 ≥ 80% (ComponentTreeGrouping.test.ts: 29 tests pass)
- [ ] gstack screenshot 验证：组件正确分类到页面 (P2，需UI验证)

---

## 3. Epic 2: 与 vibex-component-tree-grouping 协同 — 共享

> 本项目的 getPageLabel 修复与 `vibex-component-tree-grouping` 的 `inferIsCommon()` 修复共享以下内容，建议 Dev 在同一 PR 中处理：

### 共享修复点

1. **Backend AI prompt** — 增加 flowId 要求（两个项目都依赖）
2. **COMMON_FLOW_IDS** — 统一管理常量
3. **flowNodes 匹配逻辑** — 抽取为共享函数

```typescript
// 共享匹配函数
export function matchFlowNode(
  flowId: string,
  flowNodes: BusinessFlowNode[]
): BusinessFlowNode | null {
  // 1. 精确匹配
  const exact = flowNodes.find(f => f.nodeId === flowId);
  if (exact) return exact;

  // 2. Prefix 匹配
  const prefixMatch = flowNodes.find(f =>
    flowId.startsWith(f.nodeId) || f.nodeId.startsWith(flowId)
  );
  if (prefixMatch) return prefixMatch;

  // 3. Name 模糊匹配
  const normalizedFlowId = flowId.toLowerCase().replace(/[\s-_]/g, '');
  return flowNodes.find(f => {
    const normalizedName = f.name.toLowerCase().replace(/[\s-_]/g, '');
    return normalizedName.includes(normalizedFlowId) ||
           normalizedFlowId.includes(normalizedName);
  }) || null;
}
```

---

## 4. 总工时

| Epic | 任务 | 工时 |
|------|------|------|
| Epic 1 | getPageLabel Fallback | 2h |
| Epic 2 | 与 component-tree-grouping 协同 | 共享 |
| **合计** | | **2h + 共享** |

---

## 5. 文件清单

**修改文件**:
- `vibex-fronted/src/components/canvas/ComponentTree.tsx`

**新增文件**:
- `vibex-fronted/src/components/canvas/ComponentTree.test.ts`（与 component-tree-grouping 共享）
