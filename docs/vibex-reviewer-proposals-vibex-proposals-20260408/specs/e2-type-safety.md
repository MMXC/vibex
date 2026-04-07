# Spec: Epic E2 — 类型安全修复

## 1. Store accessor interface

```typescript
// src/hooks/ddd/types.ts
export interface DDDRestoreStore<S = unknown> {
  getState(): S;
  setState(state: Partial<S> | ((prev: S) => S)): void;
  subscribe(listener: (state: S) => void): () => void;
}
```

## 2. 修复 useDDDStateRestore

```typescript
// src/hooks/ddd/useDDDStateRestore.ts
import type { DDDRestoreStore } from './types';

checkDDDStateRestore<DDDRestoreStore>(
  pathname,
  useContextStore,
  useModelStore,
  useDesignStore
);
// ✅ 不再需要 as any
```

## 3. DDD store 类型导出

```typescript
// stores/ddd/index.ts
export type { DDDContextStore } from './contextSlice';
export type { DDDModelStore } from './modelSlice';
export type { DDDDesignStore } from './designStore';
```

## 4. 验收标准

```bash
# 无 as any
grep -c 'as any' src/hooks/ddd/useDDDStateRestore.ts
# 期望: 0

# TypeScript 编译
cd frontend && npx tsc --noEmit
# 期望: 0 errors
```
