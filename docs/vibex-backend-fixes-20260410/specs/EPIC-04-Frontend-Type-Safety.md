# Epic 4: Frontend Type Safety

**Epic ID**: EPIC-04  
**Priority**: P1  
**Estimated**: 2.5h  
**Stories**: ST-12, ST-13, ST-14, ST-17

---

## ST-12: Remove `as any` from Component Source

### Context

4 frontend component files use `as any` type casts on props, blocking TypeScript strict mode and creating silent runtime errors.

### Fixes

**CardTreeNode.tsx**
```typescript
// ❌ BEFORE
import type { NodeProps } from '@xyflow/react';
const CardTreeNode = (props: any) => { ... }

// ✅ AFTER
import type { NodeProps } from '@xyflow/react';
interface CardTreeNodeData {
  label: string;
  icon?: string;
  status?: 'active' | 'inactive';
  onDelete?: () => void;
}
type CardTreeNodeProps = NodeProps<CardTreeNodeData>;
const CardTreeNode = ({ data, selected, id }: CardTreeNodeProps) => {
  return <div className={data.status}>{data.label}</div>;
};
```

**FlowNodes.tsx, PageNode.tsx, RelationshipEdge.tsx**
- Same pattern: define proper interfaces, remove `as any`

### Acceptance Tests

```bash
# No 'as any' in component source
grep -rn "as any" vibex-fronted/src/components/visualization/
# → should return empty

# TypeScript passes
pnpm --filter vibex-fronted run typecheck
```

### Files Changed
- `vibex-fronted/src/components/visualization/CardTreeNode/CardTreeNode.tsx`
- `vibex-fronted/src/components/ui/FlowNodes.tsx`
- `vibex-fronted/src/components/page-tree-diagram/nodes/PageNode.tsx`
- `vibex-fronted/src/components/canvas/edges/RelationshipEdge.tsx`

---

## ST-13: DOMPurify SVG Sanitization

### Context

4 `MermaidRenderer` instances render LLM-generated code via `dangerouslySetInnerHTML`. Without sanitization, injected `<script>` tags execute in the browser.

### Fix Pattern

```typescript
// MermaidRenderer.tsx
import DOMPurify from 'dompurify';

function renderMermaid(code: string, id: string): string {
  try {
    const { svg } = mermaid.render(`mermaid-${id}`, code);
    return DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'foreignObject'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
  } catch (err) {
    logger.error('mermaid_render_failed', { error: err });
    return `<div class="mermaid-error">Failed to render diagram</div>`;
  }
}

// In JSX:
<div dangerouslySetInnerHTML={{ __html: renderMermaid(code, id) }} />
```

### Affected Files (4 instances)
1. `components/visualization/MermaidRenderer/MermaidRenderer.tsx`
2. `components/preview/MermaidRenderer/MermaidRenderer.tsx`
3. `components/ui/MermaidPreview.tsx`
4. `components/mermaid/MermaidRenderer.tsx`

### Acceptance Tests

```typescript
// __tests__/MermaidRenderer.test.tsx
it('strips script tags from mermaid output', () => {
  const code = 'graph TD; A-->B; <script>alert(1)</script>';
  const html = renderMermaid(code, 'test');
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('alert(1)');
});

it('strips event handler attributes', () => {
  const code = 'graph TD; A-->B; <svg onload="alert(1)">';
  const html = renderMermaid(code, 'test');
  expect(html).not.toContain('onload=');
});

it('does not execute injected script (dom-based test)', async () => {
  let alertCalled = false;
  window.alert = () => { alertCalled = true; };
  const { container } = render(<MermaidRenderer code="alert(1)" id="xss-test" />);
  expect(alertCalled).toBe(false);
});
```

### Files Changed
- All 4 MermaidRenderer files listed above

---

## ST-14: Fix ReactFlow Hook Usage

### Context

Node components incorrectly call `useReactFlow()` (which requires a `ReactFlowProvider` context). Node components receive data via props and should not use the global context. Additionally, some parent components wrap themselves in `ReactFlowProvider` when the page already provides one.

### Fix 1: Remove `useReactFlow()` from Node components

```typescript
// ❌ CardTreeNode.tsx — WRONG
const CardTreeNode = (props: any) => {
  const { setNodes } = useReactFlow(); // Should NOT use in Node
  // ...
};

// ✅ CardTreeNode.tsx — CORRECT
const CardTreeNode = ({ data, selected, id }: CardTreeNodeProps) => {
  // Use data from props only
  // If need to update parent: pass onClick callback via data prop
};
```

### Fix 2: Remove nested ReactFlowProvider

```typescript
// ❌ DomainRelationGraph.tsx — WRONG
export const DomainRelationGraph = () => {
  return (
    <ReactFlowProvider>
      <ReactFlow nodes={nodes} edges={edges} />
    </ReactFlowProvider>
  );
};

// ✅ DomainRelationGraph.tsx — CORRECT (page provides it)
// OR: make it conditional
import { ReactFlowProvider } from '@xyflow/react';
const OptionalProvider = ({ children }: { children: React.ReactNode }) => {
  // Only wrap if not already inside a provider
  try { useReactFlow(); return <>{children}</>; }
  catch { return <ReactFlowProvider>{children}</ReactFlowProvider>; }
};
```

### Acceptance Tests

```bash
# No "Cannot find ReactFlow context" errors in console
# → Verified via gstack browser screenshot after canvas load

# No useReactFlow in Node files
grep -rn "useReactFlow" vibex-fronted/src/components/visualization/*/CardTreeNode.tsx | expect empty
```

### Files Changed
- `vibex-fronted/src/components/visualization/CardTreeNode/CardTreeNode.tsx`
- `vibex-fronted/src/components/ui/DomainRelationGraph.tsx`
- `vibex-fronted/src/components/ui/FlowEditor.tsx`

---

## ST-17: Console → Logger Replacement

### Context

Frontend stores and homepage components use `console.log`/`console.warn` which may leak entityId/token in development and production browser consoles.

### Fix

```typescript
// Replace all console.log / console.warn in stores with:
import { logger } from '@/lib/logger';

// ❌ BEFORE
console.log('store action', { entityId, action });
console.warn('deprecated method');

// ✅ AFTER
logger.debug('store action', { action }); // No entityId
logger.warn('deprecated_method', { replacement: 'newMethod' });
```

### Production Strip (next.config.js)

```javascript
// next.config.js — production build strips console.*
config.optimization.minimizer.push(new TerserPlugin({
  terserOptions: { compress: { drop_console: process.env.NODE_ENV === 'production' } },
}));
```

### Acceptance