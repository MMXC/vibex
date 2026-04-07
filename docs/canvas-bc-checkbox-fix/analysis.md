# Analysis: canvas-bc-checkbox-fix — confirmContextNode 类型错误修复

**任务**: canvas-bc-checkbox-fix/analyze-requirements
**分析师**: analyst
**日期**: 2026-04-02
**工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

**问题**: `BoundedContextNode` 类型接口没有 `confirmed` 字段，但 `BoundedContextTree.tsx` 第 435 行在创建新节点时错误地设置了 `confirmed: false`，导致 TypeScript 类型错误。

**根因**: 遗留代码残留。`confirmed` 字段已在 Migration 2→3 中迁移为 `isActive`，但 `handleGenerate` 中的 mock 生成代码仍使用旧字段名。

**修复**: 删除 `BoundedContextTree.tsx:435` 的 `confirmed: false` 赋值，工时 < 5 分钟。

---

## 2. 问题定位

### 2.1 TypeScript 错误位置

**文件**: `src/components/canvas/BoundedContextTree.tsx`
**行号**: 435（`handleGenerate` 函数内）
**错误代码**:

```typescript
// handleGenerate 函数中，创建 BoundedContextNode 时：
const newNodes: BoundedContextNode[] = drafts.map((d, i) => ({
  nodeId: `ctx-${Date.now()}-${i}`,
  name: d.name,
  description: d.description,
  type: d.type,
  confirmed: false,   // ❌ TypeScript 错误：BoundedContextNode 没有 confirmed 字段
  status: 'pending' as const,
  children: [],
}));
```

### 2.2 类型定义

**`BoundedContextNode` 接口**（`src/lib/canvas/types.ts:34`）:

```typescript
export interface BoundedContextNode {
  nodeId: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  /** Whether node is active (participates in generation). Default true. */
  isActive?: boolean;
  status: NodeStatus;       // 'pending' | 'generating' | 'confirmed' | 'error'
  parentId?: string;
  children: string[];
  relationships?: ContextRelationship[];
  // ❌ 没有 confirmed 字段
}
```

**注意**: `isActive` 和 `status` 已是表示确认状态的标准字段。

---

## 3. 根因分析

### 3.1 Migration 2→3 已处理 `confirmed` → `isActive` 迁移

在 `canvasStore.ts:111-118`:

```typescript
if (version < 3) {
  // Migration 2→3: confirmed → isActive (Epic 3)
  const migrateNodes = (nodes: any[]): any[] =>
    nodes.map((n: any) => {
      const confirmed = n.confirmed;
      const { confirmed: _confirmed, ...rest } = n;
      return { ...rest, isActive: confirmed ?? true };
    });
  // ...
}
```

**Migration 处理的是持久化数据**（从 localStorage 加载时）。但 **mock 生成的新节点** 不经过 migration，直接创建时使用了旧字段名。

### 3.2 状态字段映射

| 旧字段 | 新字段 | 说明 |
|--------|--------|------|
| `confirmed: false` | `isActive: false` | 是否激活参与生成 |
| `confirmed: true` | `isActive: true` | 同上 |
| — | `status: 'pending'/'confirmed'/'error'/'generating'` | 节点状态 |

### 3.3 ContextCard 中的 checkbox 逻辑

`BoundedContextTree.tsx:239` 和 `:250`:

```typescript
// Status indicator (green checkmark when confirmed)
checked={node.isActive !== false && node.status !== 'pending'}

// isActive checkbox
checked={node.isActive !== false}
```

**依赖的是 `isActive` 和 `status`**，不是 `confirmed`。`confirmed: false` 在新节点创建时虽然设置了 TypeScript 错误，但运行时实际上没有被使用（因为 `ContextCard` 读取 `isActive`）。

---

## 4. 推荐修复方案

### 方案 A：删除 `confirmed` 字段（最小修复）— ⭐ 推荐

**改动**: 删除 `handleGenerate` 中的 `confirmed: false`

**修复后代码**:

```typescript
const newNodes: BoundedContextNode[] = drafts.map((d, i) => ({
  nodeId: `ctx-${Date.now()}-${i}`,
  name: d.name,
  description: d.description,
  type: d.type,
  // confirmed: false,  // ✅ 已删除 — BoundedContextNode 无此字段
  status: 'pending' as const,
  children: [],
}));
```

**工时**: < 5 分钟
**风险**: 无。新节点 `isActive` 默认为 `undefined`（真值），等价于 `confirmed: true` 的行为。

---

### 方案 B：显式设置 `isActive: false`

如果 mock 生成的结果默认应该是"未激活"状态：

```typescript
const newNodes: BoundedContextNode[] = drafts.map((d, i) => ({
  nodeId: `ctx-${Date.now()}-${i}`,
  name: d.name,
  description: d.description,
  type: d.type,
  isActive: false,  // 显式设置为未激活
  status: 'pending' as const,
  children: [],
}));
```

**工时**: < 5 分钟
**风险**: 低。但改变了默认行为（从激活变为未激活），需要确认产品意图。

---

## 5. 推荐方案

**推荐方案 A**：删除 `confirmed: false`

**理由**:
1. TypeScript 类型直接报错，必须修复
2. `BoundedContextNode` 原本就没有 `confirmed` 字段
3. Migration 已将 `confirmed` 迁移为 `isActive`，代码库应与之一致
4. 默认 `isActive: undefined` = 激活状态，与产品期望一致（生成后默认参与下一步）
5. 极低风险，改动极小

**产品行为确认**: 如果期望 mock 生成后节点默认为是"已激活"状态（绿色高亮），方案 A 正确。如果期望默认为是"未激活"状态（需要用户手动激活），使用方案 B。

---

## 6. 验收标准

| ID | 验收条件 | 测试方式 |
|----|----------|----------|
| AC1 | `npx tsc --noEmit 2>&1 | grep "BoundedContextTree" | wc -l` 返回 0 | TypeScript 编译无错误 |
| AC2 | `grep -n "confirmed:" src/components/canvas/BoundedContextTree.tsx` 无结果（新增节点代码处） | 代码检查 |
| AC3 | `grep "confirmed:" src/components/canvas/BoundedContextTree.tsx` 仅匹配 migration 相关代码 | 代码检查 |
| AC4 | 手动测试：点击"Generate"按钮后，生成的卡片 checkbox 状态正确 | UI 测试 |
| AC5 | `npx playwright test` E2E 测试通过 | CI 测试 |

---

## 7. 风险评估

| 风险 | 影响 | 缓解 |
|------|------|------|
| 误删其他位置的 `confirmed` | 低 | grep 确认仅修改 handleGenerate |
| 行为改变 | 低 | 方案 A 等价于 `isActive: undefined`（真值）= 激活状态 |

---

## 8. 下一步

1. **确认产品意图**: mock 生成后节点默认激活（方案 A）还是未激活（方案 B）
2. **修复**: 删除 `confirmed: false` 或替换为 `isActive: false`
3. **验证**: `npx tsc --noEmit` 无错误
4. **测试**: Playwright E2E 测试通过
