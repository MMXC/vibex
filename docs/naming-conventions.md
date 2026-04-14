# VibeX Naming Conventions

> **Project**: vibex-dev-proposals E3  
> **Date**: 2026-04-14  
> **Status**: Draft

## Hooks

### Zustand Store Hooks

Pattern: `use{Entity}Store`

| Good | Bad |
|------|-----|
| `useAuthStore` | `useAuth` |
| `useGuidanceStore` | `useGetGuidance` |
| `useNavigationStore` | `useNav` |
| `usePreviewStore` | `usePreview` |

**Rationale**: Zustand store hooks follow `use{Entity}Store`. These are NOT React hooks in the traditional sense — they are store accessors. The `Store` suffix distinguishes them from query/mutation hooks.

### React Query Hooks (future)

Pattern: `use{Entity}{Query|Mutation}`

| Good | Bad |
|------|-----|
| `useProjectQuery` | `useProject` |
| `useFlowMutation` | `useCreateFlow` |

### Naming Convention Enforcement

```javascript
// .eslintrc or eslint.config.mjs
{
  "rules": {
    "naming-convention/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["PascalCase"],
        "prefix": ["use"],
        "filter": {
          "regex": "^use[A-Z]",
          "match": true
        }
      }
    ]
  }
}
```

**Grandfathered hooks** (existing violations allowed without eslint-disable):
- Any hook exported from `src/stores/` (these are store accessors, not React hooks)

## Stores

### File Naming

Pattern: `{entity}Store.ts` or `{entity}Slice.ts`

| Good | Bad |
|------|-----|
| `guidanceStore.ts` | `guidance.ts` |
| `contextSlice.ts` | `slice.ts` |

### Slice Pattern (recommended for new stores)

```typescript
// stores/projectSlice.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ProjectSlice {
  projectId: string | null;
  setProjectId: (id: string) => void;
}

export const useProjectSlice = create<ProjectSlice>()(
  immer((set) => ({
    projectId: null,
    setProjectId: (id) => set({ projectId: id }),
  }))
);
```

### Store Index

All stores must be exported from `src/stores/index.ts`:

```typescript
export { useAuthStore } from './authStore';
export { useGuidanceStore } from './guidanceStore';
// ... all stores
```

## TODO Comments

All TODO comments must reference a GitHub issue:

```typescript
// ✅ Good
// TODO: #123 — add caching layer

// ❌ Bad
// TODO: add caching layer
```

Known bugs use `FIXME` without issue reference:

```typescript
// ✅ Good
// FIXME: memory leak in deepClone

// ❌ Bad
// TODO: fix memory leak
```
