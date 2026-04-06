# Epic 5: Frontend Architecture

**Epic ID**: EPIC-05  
**Priority**: P1–P2  
**Estimated**: 3h  
**Stories**: ST-15, ST-16

---

## ST-15: Split CanvasPage.tsx (981 lines → 5 sub-components)

### Context

`CanvasPage.tsx` is a 981-line monolith containing state, layout, multiple panels, toolbars, modals, and lifecycle hooks. This makes it:
- Untestable (too many concerns in one file)
- Unmaintainable (hard to locate code for specific features)
- Unmergeable (git conflicts on any canvas change)

### Sub-Component Breakdown

```
components/canvas/
  CanvasPage.tsx         # Orchestrator, ~150 lines (state coordination + layout)
  CanvasHeader.tsx       # ~100 lines (Toolbar + TabBar)
  CanvasTreePanel.tsx    # ~150 lines (LeftDrawer tree panel)
  CanvasPreviewPanel.tsx # ~150 lines (preview area)
  CanvasQueuePanel.tsx   # ~100 lines (queue panel)
  CanvasShortcuts.tsx   # ~50 lines (shortcut help modal)
```

### Migration Strategy

**Step 1**: Create `CanvasContext.tsx` for shared state

```typescript
// contexts/CanvasContext.tsx
import { createContext, useContext } from 'react';
export interface CanvasContextValue {
  projectId: string;
  activeTab: 'design' | 'preview';
  setActiveTab: (tab: 'design' | 'preview') => void;
  selectedNodeIds: Set<string>;
  setSelectedNodeIds: (ids: Set<string>) => void;
  // ... other shared state
}
export const CanvasContext = createContext<CanvasContextValue | null>(null);
export const useCanvasContext = () => {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvasContext must be used within CanvasProvider');
  return ctx;
};
```

**Step 2**: Extract each section into sub-component

**Step 3**: Rewrite `CanvasPage.tsx` as orchestrator

```typescript
// CanvasPage.tsx (refactored)
import { CanvasProvider } from '@/contexts/CanvasContext';
import { CanvasHeader } from './CanvasHeader';
import { CanvasTreePanel } from './CanvasTreePanel';
import { CanvasPreviewPanel } from './CanvasPreviewPanel';
import { CanvasQueuePanel } from './CanvasQueuePanel';

export function CanvasPage({ projectId }: { projectId: string }) {
  return (
    <CanvasProvider projectId={projectId}>
      <div className="canvas-page">
        <CanvasHeader />
        <div className="canvas-body">
          <CanvasTreePanel />
          <CanvasPreviewPanel />
          <CanvasQueuePanel />
        </div>
      </div>
    </CanvasProvider>
  );
}
```

### Acceptance Tests

```typescript
// __tests__/components/canvas/CanvasPage.test.tsx
it('renders all sub-components', () => {
  render(<CanvasPage projectId="test-id" />);
  expect(screen.getByRole('heading')).toBeInTheDocument(); // Header
  expect(screen.getByTestId('tree-panel')).toBeInTheDocument();
  expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
});

it('maintains state coordination between sub-components', async () => {
  render(<CanvasPage projectId="test-id" />);
  // Click node in tree → selectedNodeIds updates → preview reflects selection
  const node = screen.getByTestId('tree-node-1');
  await userEvent.click(node);
  expect(screen.getByTestId('preview-panel')).toHaveAttribute('data-selected-node-id', '1');
});
```

### Files Changed
- `vibex-fronted/src/components/canvas/CanvasPage.tsx` (refactor)
- `vibex-fronted/src/components/canvas/CanvasHeader.tsx` (new)
- `vibex-fronted/src/components/canvas/CanvasTreePanel.tsx` (new)
- `vibex-fronted/src/components/canvas/CanvasPreviewPanel.tsx` (new)
- `vibex-fronted/src/components/canvas/CanvasQueuePanel.tsx` (new)
- `vibex-fronted/src/components/canvas/CanvasShortcuts.tsx` (new)
- `vibex-fronted/src/contexts/CanvasContext.tsx` (new)

---

## ST-16: Merge Zustand Stores

### Context

Two Zustand stores (`designStore.ts` and `simplifiedFlowStore.ts`) share overlapping state keys. This causes:
- Dual source of truth for canvas state
- Confusion about which store to use
- Potential synchronization bugs

### Analysis

Before merging, analyze both stores to identify:
1. **Overlapping keys**: `selectedNodeIds`, `activeFlowId`
2. **Unique to designStore**: `designNodes`, `designEdges`, `designMode`
3. **Unique to simplifiedFlowStore**: `flowNodes`, `flowEdges`, `simplifiedMode`
4. **Actions that need merging**: `selectNode`, `addNode`, `removeNode`

### Merge Strategy: Zustand Slices

```typescript
// stores/flowDesignStore.ts
interface DesignSlice {
  designNodes: Node[];
  designEdges: Edge[];
  designMode: 'tree' | 'canvas';
  addDesignNode: (node: Node) => void;
}

interface FlowSlice {
  flowNodes: Node[];
  flowEdges: Edge[];
  simplifiedMode: 'simple' | 'full';
  addFlowNode: (node: Node) => void;
}

export const useFlowDesignStore = create<DesignSlice & FlowSlice>()(
  (...a) => ({
    ...createDesignSlice(...a),
    ...createFlowSlice(...a),
  })
);
```

### Migration

```bash
# Update all imports:
# ❌ FROM: import { useDesignStore } from '@/stores/designStore';
# ❌ FROM: import { useSimplifiedFlowStore } from '@/stores/simplifiedFlowStore';
# ✅ TO: import { useFlowDesignStore } from '@/stores/flowDesignStore';

# Bulk find-and-replace across vibex-fronted/src/
```

### Acceptance Tests

```typescript
// __tests__/stores/flowDesignStore.test.ts
it('has all designStore keys', () => {
  const store = useFlowDesignStore.getState();
  expect(store.designNodes).toBeDefined();
  expect(store.designEdges).toBeDefined();
  expect(store.designMode).toBeDefined();
});

it('has all simplifiedFlowStore keys', () => {
  const store = useFlowDesignStore.getState();
  expect(store.flowNodes).toBeDefined();
  expect(store.flowEdges).toBeDefined();
  expect(store.simplifiedMode).toBeDefined();
});

it('selectNode updates selectedNodeIds in both contexts', () => {
  const { selectNode } = useFlowDesignStore.getState();
  selectNode('node-1');
  expect(useFlowDesignStore.getState().selectedNodeIds).toContain('node-1');
});
```

### Files Changed
- `vibex-fronted/src/stores/flowDesignStore.ts` (new, replaces both)
- All files importing `designStore` or `simplifiedFlowStore`

---

## Rollback Procedures

| Story | Rollback Action |
|-------|----------------|
| ST-15 | Revert to single 981-line CanvasPage.tsx (keep sub-component files for reference) |
| ST-16 | Revert imports to original store files, delete merged store |
