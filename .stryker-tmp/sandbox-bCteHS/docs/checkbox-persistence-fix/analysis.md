# 需求分析报告: checkbox-persistence-fix

**任务**: checkbox confirmed 状态未持久化到 JSON
**分析师**: analyst
**日期**: 2026-04-02

---

## 问题概述

checkbox confirmed 状态仅存于 Zustand 内存，导致继续组件树时请求体可能包含未勾选节点。

---

## 根因分析

### Direction 1: 节点 JSON schema 是否有 confirmed 字段？

**历史**：`confirmed` 字段存在于旧版 schema，通过 Migration 2→3 已迁移。

**Migration 2→3** (`canvasStore.ts` lines 100-108):
```ts
const migrateNodes = (nodes: any[]): any[] =>
  nodes.map((n: any) => {
    const confirmed = n.confirmed;
    const { confirmed: _confirmed, ...rest } = n;
    return { ...rest, isActive: confirmed ?? true };
  });
```

**关键缺陷**: `confirmed: true` 只映射到 `isActive: true`，但 `status` 字段未设置（默认为 `'pending'`）。

### Direction 2: 三棵树节点数据结构是否统一？

| 树 | 确认字段 | 持久化 | 问题 |
|----|---------|---------|------|
| BoundedContextNode | `status` + `isActive` | ✅ Zustand persist | Migration 后丢失 `status` |
| BusinessFlowNode | `status` + `isActive` | ✅ Zustand persist | Migration 后丢失 `status` |
| ComponentNode | `status` | ✅ Zustand persist | 无 Migration 问题 |

### Direction 3: confirmed 状态是否写回了节点数据？

**`confirmContextNode`** (`canvasStore.ts` line 759):
```ts
confirmContextNode: (nodeId) => {
  set((s) => {
    const newNodes = s.contextNodes.map((n) =>
      n.nodeId === nodeId
        ? { ...n, isActive: true, status: 'confirmed' as const }
        : n
    );
    return { contextNodes: newNodes };
  });
  useContextStore.getState().confirmContextNode(nodeId);  // 同步到 contextStore
},
```

✅ Zustand `set()` 更新节点，`persist` middleware 会写入 localStorage。

### Direction 4: prompt 构造用的是 Zustand 状态还是 JSON 字段？

**`generateComponentFromFlow`** (line 1033):
```ts
// E2: Only send confirmed nodes to the API
const confirmedContexts = contextNodes.filter((ctx) => ctx.status === 'confirmed');
const confirmedFlows = flowNodes.filter((f) => f.status === 'confirmed');
```

✅ 使用 Zustand store 中的 `status === 'confirmed'`。

---

## 核心 Bug 定位

### Bug 1: Migration 后 status 丢失（P0）

**场景**: 用户在 Migration 2→3 之前确认了节点，升级后刷新页面。

**数据流**:
```
旧存储: { contextNodes: [{ ..., confirmed: true }] }
    ↓ Migration 2→3
新节点: { ..., isActive: true }  ← status 未设置，默认为 'pending'
    ↓ 刷新后
store: status = 'pending'  ← confirmed 状态丢失！
    ↓ 过滤
generateComponentFromFlow: ctx.status === 'confirmed' → false ❌
    ↓ 结果
API 请求不包含该节点
```

**修复**: Migration 中将 `confirmed: true` 映射为 `status: 'confirmed'`:
```ts
if (version < 3) {
  const migrateNodes = (nodes: any[]): any[] =>
    nodes.map((n: any) => {
      const confirmed = n.confirmed;
      const { confirmed: _confirmed, ...rest } = n;
      return {
        ...rest,
        isActive: confirmed ?? true,
        status: confirmed ? 'confirmed' : (n.status ?? 'pending'),
      };
    });
  // ...
}
```

### Bug 2: BusinessFlowNode 的 status/isActive 双字段语义不清（P1）

**现状**: `BusinessFlowNode` 有 `status`（视觉）+ `isActive`（应该是 API 过滤），但 `generateComponentFromFlow` **只用 `status === 'confirmed'` 过滤，未使用 `isActive`**。

```ts
// 当前：只用 status
const confirmedFlows = flowNodes.filter((f) => f.status === 'confirmed');

// 语义上应该用 isActive（是否参与生成）
const activeFlows = flowNodes.filter((f) => f.isActive !== false);
```

**修复**: 统一过滤逻辑，建议只用 `status === 'confirmed'`（视觉状态决定 API 行为）。

---

## 技术方案

### 方案 A: 修复 Migration + 统一过滤（推荐）

**修复 1**: Migration 2→3 增加 `status` 映射

```ts
// canvasStore.ts runMigrations
if (version < 3) {
  const migrateNodes = (nodes: any[]): any[] =>
    nodes.map((n: any) => {
      const confirmed = n.confirmed;
      const { confirmed: _confirmed, ...rest } = n;
      return {
        ...rest,
        isActive: confirmed ?? true,
        // 关键修复：confirmed → status
        status: confirmed ? 'confirmed' : (rest.status ?? 'pending'),
      };
    });
  // ...
}
```

**修复 2**: `generateComponentFromFlow` 保持现状（只用 `status === 'confirmed'` 过滤）

### 方案 B: 清理双字段，统一用 status

删除 `isActive` 字段，统一用 `status` 控制视觉和 API 行为。

**工作量**: 高（影响所有树的节点创建逻辑）

---

## 工作量估算

| 任务 | 估算 |
|------|------|
| 修复 Migration 2→3 | 15min |
| 验收测试（Migration 场景）| 30min |
| **总计** | **45min** |

---

## 验收标准

1. [ ] Migration 2→3 执行后，旧的 `confirmed: true` 节点 `status === 'confirmed'`
2. [ ] 刷新页面后，checkbox 视觉状态与刷新前一致
3. [ ] `generateComponentFromFlow` 请求体只包含 `status === 'confirmed'` 的节点
4. [ ] 三棵树节点确认状态统一通过 `status` 字段管理

---

## 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| Migration 重复执行导致数据损坏 | 低 | Migration 有 version 检查，只会执行一次 |
| 修复 Migration 影响已有正确数据的用户 | 极低 | 仅影响 Migration 2→3 期间确认过的节点 |
