# VibeX 类型文档

**版本**: v1.0
**日期**: 2026-04-30
**Agent**: dev

---

## 概述

本文档记录 VibeX 项目的公开类型定义，作为所有包的单一真实来源（Single Source of Truth）。

## 包结构

| 包 | 路径 | 描述 |
|----|------|------|
| `@vibex/types` | `packages/types/src/` | 共享类型定义 |
| `@vibex/mcp-server` | `packages/mcp-server/src/` | MCP Server 类型 |

---

## @vibex/types — 共享类型

### CardTree 类型

```typescript
interface CardTreeNode {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'done' | 'failed';
  description?: string;
}

interface CardTreeNodeChild {
  id: string;
  label: string;
  checked: boolean;
}

interface CardTreeVisualization {
  nodes: CardTreeNode[];
}
```

### BoundedContext 类型

```typescript
type BoundedContextType = 'core' | 'supporting' | 'generic' | 'external';

interface BoundedContext {
  id: string;
  name: string;
  type: BoundedContextType;
  relationships: ContextRelationship[];
  description: string;
}

type ContextRelationshipType = 'upstream' | 'downstream' | 'symmetric';

interface ContextRelationship {
  fromContextId: string;
  toContextId: string;
  type: ContextRelationshipType;
}
```

### Dedup 类型

```typescript
type DedupLevel = 'block' | 'warn' | 'pass';

interface DedupCandidate {
  id: string;
  name: string;
  matchScore: number;
}

interface DedupResult {
  total: number;
  duplicates: DedupCandidate[];
  scannedAt: string;
}
```

### Team-Tasks 类型

```typescript
type TaskStage = 'ready' | 'in_progress' | 'blocked' | 'done' | 'failed';

interface TeamTaskProject {
  project: string;
  stages: Record<string, TaskStage>;
}
```

---

## 类型守卫（@vibex/types）

`packages/types/src/guards.ts` 导出以下类型守卫函数：

```typescript
// CardTree
export function isCardTreeNodeStatus(v: unknown): v is CardTreeNodeStatus
export function isCardTreeNode(v: unknown): v is CardTreeNode
export function isCardTreeNodeChild(v: unknown): v is CardTreeNodeChild
export function isCardTreeVisualization(v: unknown): v is CardTreeVisualization

// BoundedContext
export function isBoundedContextType(v: unknown): v is BoundedContextType
export function isContextRelationshipType(v: unknown): v is ContextRelationshipType
export function isContextRelationship(v: unknown): v is ContextRelationship
export function isBoundedContext(v: unknown): v is BoundedContext

// Dedup
export function isDedupLevel(v: unknown): v is DedupLevel
export function isDedupCandidate(v: unknown): v is DedupCandidate
export function isDedupResult(v: unknown): v is DedupResult

// Team-Tasks
export function isTaskStage(v: unknown): v is TaskStage
export function isTeamTaskProject(v: unknown): v is TeamTaskProject
```

---

## Zod Schemas（@vibex/types）

`packages/types/src/schemas/` 目录包含所有类型的 Zod schema：

```typescript
// schemas/common.ts
export const cardTreeNodeSchema: z.ZodType<CardTreeNode>
export const boundedContextSchema: z.ZodType<BoundedContext>
export const dedupResultSchema: z.ZodType<DedupResult>
```

---

## 迁移说明

### Sprint 18 类型 Breaking Changes

**E18-TSFIX-2 变更**：部分 API 函数返回类型从 `T` 改为 `T | null`

受影响的函数：
- `unwrapField<T>(response, field)` → 返回 `T | null`
- `unwrapFieldOrSelf<T>(response, field)` → 返回 `T | null`

**处理方式**：
```typescript
// Before
const data = unwrapField<string>(response, 'agents');

// After
const data = unwrapField<string>(response, 'agents');
if (data === null) return; // handle null case
// data is string here
```

---

## 使用指南

### 在 frontend 中导入类型

```typescript
import type { CardTreeNode, BoundedContext } from '@vibex/types';
```

### 使用类型守卫

```typescript
import { isCardTreeNode, isBoundedContextType } from '@vibex/types';

function handleNode(node: unknown) {
  if (!isCardTreeNode(node)) {
    throw new Error('Invalid node');
  }
  // node is narrowed to CardTreeNode
  console.log(node.title);
}
```
