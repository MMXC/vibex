# VibeX Sprint 33 — System Architecture

**Project**: vibex-proposals-sprint33
**Date**: 2026-05-09
**Status**: Technical Design — Architect Review
**Author**: architect

---

## 1. Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend framework | Next.js | 14.x | App Router, Server Components |
| UI components | React 18 | 18.x | Concurrent features, Suspense |
| Canvas engine | `@xyflow/react` | ^12.x | ReactFlow for node-based canvas |
| Styling | CSS Modules | — | Scoped styles, no runtime overhead |
| State management | Zustand | ^5.x | Lightweight, ReactFlow compatible |
| Real-time DB | Firebase RTDB REST API | — | Zero SDK, native fetch + EventSource |
| Presence sync | Server-Sent Events (SSE) | — | RTDB REST listener for real-time |
| Conflict resolution | conflictStore (Zustand) | — | LWW arbitration, existing in codebase |
| Unit testing | Vitest | ^2.x | Vite-native, Jest-compatible |
| E2E testing | Playwright | ^1.x | Cross-browser E2E |
| CI/CD | GitHub Actions | — | `ai-review.yml`, `visual-regression.yml` |

**Key existing components referenced**:
- `vibex-fronted/src/lib/canvas/stores/conflictStore.ts` — existing conflict store (260+ lines)
- `vibex-fronted/src/components/canvas/ConflictBubble.tsx` — existing (75 lines), needs integration
- `vibex-fronted/src/components/ConflictDialog/` — existing ConflictDialog + E2E tests
- `vibex-fronted/src/lib/firebase/presence.ts` — existing presence (440+ lines), SSE-based
- `vibex-fronted/src/components/presence/RemoteCursor.tsx` — existing cursor (68 lines)
- `vibex-fronted/src/types/dds/index.ts` — DDSCard already has `parentId?: string`

---

## 2. Architecture Diagram

```mermaid
graph TD
    subgraph "DDSFlow Page"
        DFF[DDSFlow.tsx<br/>Epic 1+2+3]
        CT[CanvasThumbnail<br/>E4-F1]
        OB[OfflineBanner<br/>E4-F2]
        CB[ConflictBubble<br/>Epic 2]
        RC[RemoteCursor<br/>Epic 3]
        IB[IntentionBubble<br/>Epic 3]
    end

    subgraph "State Stores (Zustand)"
        DDS[DDSCanvasStore<br/>Epic 1]
        CS[conflictStore<br/>Epic 2]
    end

    subgraph "Presence Layer (Epic 3)"
        PS[presence.ts<br/>SSE-based RTDB sync]
        IU[intention update<br/>x/y/type]
    end

    subgraph "Firebase RTDB"
        P[(presence/{canvasId}/{userId}<br/>Epic 3 extension)]
        C[(conflicts/{canvasId}<br/>Epic 2 listener)]
    end

    DFF --> DDS
    DFF --> CB
    DFF --> RC
    DFF --> CT
    DFF --> OB
    RC --> IB
    CB --> CS
    CS -.->|"listen"| C
    PS --> P
    IU --> P

    IB -.->|"read<br/>intention"| PS
    DFF -.->|"filter visibility<br/>collapsedGroups"| DDS
```

**Data flow summaries**:

**Epic 1 (Group/Folder Collapse)**:
```
toggleCollapse(groupId)
  → collapsedGroups.add(groupId) OR collapsedGroups.delete(groupId)
  → localStorage.setItem(`vibex-dds-collapsed-{canvasId}`, [...collapsedGroups])
  → getVisibleNodes() filters nodes where parentId ∈ collapsedGroups
  → filtered nodes hidden via ReactFlow node visibility
```

**Epic 2 (Conflict Visualization)**:
```
RTDB listen: conflicts/{canvasId}
  → conflictStore.setActiveConflict(conflictData)
  → ConflictBubble renders ConflictDialog
  → conflict node: data-conflict="true" + CSS pulse animation
  → user: keep-local / use-remote → conflictStore.resolve* → dismissConflict()
```

**Epic 3 (Intention Bubble)**:
```
mouse action → updateCursor(x, y, nodeId, { type: 'edit'|'select'|'drag' })
  → RTDB PATCH presence/{canvasId}/{userId}/intention
  → SSE listener → presence state update
  → RemoteCursor → IntentionBubble shows (delay 500ms, auto-hide 3s)
```

**Epic 4 (S32 QA Fixes)**:
```
CanvasThumbnail.tsx: add data-testid="canvas-thumbnail" → outer div
OfflineBanner.tsx: add data-sync-progress attribute → progress div
```

---

## 3. API Definitions

### 3.1 DDSCanvasStore — Epic 1 Extensions

```typescript
// File: vibex-fronted/src/stores/dds/DDSCanvasStore.ts

// New state fields
interface DDSCanvasStoreState {
  // ... existing fields
  collapsedGroups: Set<string>;  // groupId → collapsed (true) / expanded (false)
}

// New actions
function toggleCollapse(groupId: string): void
  // Toggles groupId in collapsedGroups
  // Syncs to localStorage key: `vibex-dds-collapsed-{canvasId}`

function isCollapsed(groupId: string): boolean
  // Returns collapsedGroups.has(groupId)

// Visibility filter (used by DDSFlow render)
function getVisibleNodes(allNodes: Node[], collapsedGroups: Set<string>): Node[]
  // Filters: nodes where node.data.parentId ∈ collapsedGroups → hidden
  // Group nodes themselves (parentId === null) are always visible
```

### 3.2 conflictStore — Epic 2 Extensions

```typescript
// File: vibex-fronted/src/lib/canvas/stores/conflictStore.ts
// Existing — no API changes needed for Epic 2

// listen to RTDB conflicts/{canvasId}
// Existing setActiveConflict / resolveKeepLocal / resolveUseRemote
// Existing ConflictBubble integration (already using conflictStore)
```

### 3.3 presence.ts — Epic 3 Extensions

```typescript
// File: vibex-fronted/src/lib/firebase/presence.ts

// Extended PresenceUser
export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    nodeId: string | null;
    timestamp: number;
  };
  intention?: 'edit' | 'select' | 'drag' | 'idle';  // NEW — Epic 3
  lastSeen: number;
}

// Extended updateCursor signature
export function updateCursor(
  canvasId: string,
  userId: string,
  x: number,
  y: number,
  opts?: {
    nodeId?: string;
    type?: 'edit' | 'select' | 'drag' | 'idle';  // NEW — Epic 3
  }
): Promise<void>

// RTDB schema (presence/{canvasId}/{userId})
// Change: add "intention" field to existing presence node
// Change scope: minimal — only presence/{canvasId}/{userId} node
// No impact on project main data
```

### 3.4 IntentionBubble — Epic 3 Component

```typescript
// File: vibex-fronted/src/components/presence/IntentionBubble.tsx

interface IntentionBubbleProps {
  intention: 'edit' | 'select' | 'drag' | 'idle';
  visible: boolean;  // derived from 500ms delay + 3s idle
}

export function IntentionBubble(props: IntentionBubbleProps): JSX.Element | null
  // Returns null when visible === false
  // Renders above RemoteCursor at top: 8px, centered
  // data-testid="intention-bubble"
  // data-intention={intention}
  // Animation: scale(0.9→1) + opacity(0→1), 200ms ease-out
```

### 3.5 RemoteCursor — Epic 3 Extension

```typescript
// File: vibex-fronted/src/components/presence/RemoteCursor.tsx

// New optional prop
interface RemoteCursorProps {
  // ... existing props
  intention?: 'edit' | 'select' | 'drag' | 'idle';  // NEW — Epic 3
}

// Renders IntentionBubble above cursor when intention !== 'idle'
// Position: above cursor avatar, 8px gap, horizontally centered
```

### 3.6 CanvasThumbnail + OfflineBanner — Epic 4

```typescript
// CanvasThumbnail.tsx — add to outer div:
// data-testid="canvas-thumbnail"

// OfflineBanner.tsx — add to progress bar div:
// data-sync-progress="true"
```

---

## 4. Data Model

### 4.1 RTDB Schema Changes

**`presence/{canvasId}/{userId}` — Extension for Epic 3**

```json
{
  "presence": {
    "{canvasId}": {
      "{userId}": {
        "userId": "xxx",
        "name": "Alice",
        "color": "#FF6B6B",
        "cursor": {
          "x": 123,
          "y": 456,
          "nodeId": "node-123",
          "timestamp": 1746754800000
        },
        "intention": "edit",
        "lastSeen": 1746754800000
      }
    }
  }
}
```

**Change scope**: Only `presence/{canvasId}/{userId}/intention` field added. No migration needed — existing documents simply lack the field (defaults to `undefined`/`idle`).

**`conflicts/{canvasId}/{nodeId}` — Existing listener (Epic 2)**

```json
{
  "conflicts": {
    "{canvasId}": {
      "{nodeId}": {
        "localData": { ... },
        "remoteData": { ... },
        "remoteVersion": 2,
        "timestamp": 1746754800000,
        "resolved": false
      }
    }
  }
}
```

No schema change required — ConflictBubble already has the listener structure.

### 4.2 DDSCard — Existing (No Change)

```typescript
// vibex-fronted/src/types/dds/index.ts — already has parentId
interface DDSCard {
  // ... existing fields
  parentId?: string;   // parent user story / bounded context ID
  children?: string[]; // child IDs (tree relationship)
}
```

No migration needed. Epic 1 works with existing data model.

### 4.3 localStorage — Epic 1 Persistence

```
Key:   vibex-dds-collapsed-{canvasId}
Value: JSON.stringify<string[]>(['group-1', 'group-2'])
Type:  string[]
Scope: canvas-specific, cleared on canvas delete
```

---

## 5. Testing Strategy

### 5.1 Test Framework: Vitest 2.x + Playwright

| Epic | Test File | Coverage Target | Key Tests |
|------|-----------|----------------|-----------|
| E1 | `DDSCanvasStore.test.ts` (extend) | > 80% | toggleCollapse, isCollapsed, visibility filter |
| E1 | `DDSFlow.collapse.test.tsx` (new) | > 80% | collapse button, badge, animation, localStorage |
| E2 | `conflictStore.test.ts` (existing) | > 80% | activeConflict, resolveKeepLocal, resolveUseRemote |
| E2 | `DDSFlow.conflict.test.tsx` (new) | > 80% | node highlight, dialog, timeout |
| E3 | `RemoteCursor.intention.test.tsx` (new) | > 80% | bubble show/hide, intention types, delay logic |
| E3 | `presence.test.ts` (extend) | > 80% | updateCursor with intention, SSE updates |
| E4 | `CanvasThumbnail.test.tsx` (extend) | — | data-testid exists |
| E4 | `OfflineBanner.test.tsx` (extend) | — | data-sync-progress exists |

### 5.2 Acceptance Criteria (Test Contract)

| Layer | Command | Pass Condition |
|-------|---------|----------------|
| L1: Type check | `cd vibex-fronted && pnpm run type-check` | exit 0, 0 errors |
| L1: Unit tests | `pnpm run test:unit` | exit 0, all tests pass |
| L1: E1 coverage | `pnpm run test:unit -- DDSCanvasStore --coverage` | collapsedGroups coverage ≥ 80% |
| L1: E3 coverage | `pnpm run test:unit -- RemoteCursor --coverage` | IntentionBubble coverage ≥ 80% |
| L2: data-testid | `grep 'data-testid="canvas-thumbnail"' CanvasThumbnail.tsx` | ≥ 1 match |
| L2: data-sync-progress | `grep 'data-sync-progress' OfflineBanner.tsx` | ≥ 1 match |
| L2: Snapshots | `git ls-files -- '**/__snapshots__/*.snap'` | ≥ 3 files |
| L3: E2E | `pnpm exec playwright test --reporter=line` | exit 0 |

### 5.3 Epic 1 — F1 Coverage Test Examples

```typescript
// DDSCanvasStore.collapse.test.ts (new)

describe('collapsedGroups', () => {
  it('toggleCollapse adds group to collapsedGroups', () => {
    store.getState().toggleCollapse('group-1');
    expect(store.getState().collapsedGroups.has('group-1')).toBe(true);
  });

  it('toggleCollapse removes group when already collapsed', () => {
    store.getState().collapsedGroups = new Set(['group-1']);
    store.getState().toggleCollapse('group-1');
    expect(store.getState().collapsedGroups.has('group-1')).toBe(false);
  });

  it('getVisibleNodes filters by parentId', () => {
    const nodes = [
      { id: 'g1', data: { parentId: null } },
      { id: 'c1', data: { parentId: 'g1' } },
      { id: 'c2', data: { parentId: 'g1' } },
    ] as Node[];
    const collapsed = new Set(['g1']);
    const visible = getVisibleNodes(nodes, collapsed);
    expect(visible.map(n => n.id)).toEqual(['g1']); // only group visible
  });

  it('localStorage persists collapsed groups', () => {
    store.getState().toggleCollapse('group-1');
    const stored = localStorage.getItem('vibex-dds-collapsed-canvas-1');
    expect(JSON.parse(stored ?? '[]')).toContain('group-1');
  });
});
```

### 5.4 Epic 3 — IntentionBubble Test Examples

```typescript
// RemoteCursor.intention.test.tsx (new)

describe('IntentionBubble', () => {
  it('shows bubble after 500ms delay', async () => {
    render(<RemoteCursor intention="edit" position={{x:100,y:100}} />);
    expect(screen.queryByTestId('intention-bubble')).not.toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(screen.getByTestId('intention-bubble')).toBeVisible();
    expect(screen.getByText('正在编辑')).toBeVisible();
  });

  it('hides bubble after 3s idle', async () => {
    vi.useFakeTimers();
    render(<RemoteCursor intention="edit" position={{x:100,y:100}} />);
    await act(async () => { vi.advanceTimersByTime(500); }); // show
    expect(screen.getByTestId('intention-bubble')).toBeVisible();
    await act(async () => { vi.advanceTimersByTime(3000); }); // idle 3s
    expect(screen.queryByTestId('intention-bubble')).not.toBeInTheDocument();
  });

  it('idle intention shows no bubble', () => {
    render(<RemoteCursor intention="idle" position={{x:100,y:100}} />);
    expect(screen.queryByTestId('intention-bubble')).not.toBeInTheDocument();
  });
});
```

---

## 6. Performance Impact Assessment

| Aspect | Impact | Mitigation |
|--------|--------|------------|
| Epic 1: collapse filter | O(n) filter on every toggle, n = node count | Memoize `getVisibleNodes`, only re-run on toggle |
| Epic 2: conflict listener | SSE listener on RTDB, negligible | No mitigation needed |
| Epic 3: intention updates | RTDB write on every mouse event | Throttle `updateCursor` to 100ms (already implemented) |
| Epic 3: bubble re-render | RemoteCursor re-render on intention change | IntentionBubble is sibling, no parent re-render |
| Epic 4: testid attributes | No runtime overhead | Static attributes, zero performance cost |

**Estimated performance budget**:
- DDSFlow render on collapse toggle: < 50ms (virtual DOM diff)
- intention bubble show/hide: < 16ms (single component mount)
- conflict highlight: < 100ms (CSS class + attribute change)

---

## 7. Dependencies

```
Epic 1 (Group/Folder Collapse)
  ├── DDSCanvasStore.ts (add collapsedGroups state)
  ├── DDSFlow.tsx (render collapse button, filter nodes)
  ├── DDSCanvasStore.module.css (collapse animation)
  └── parentId field: ✅ already exists in DDSCard type

Epic 2 (Conflict Visualization)
  ├── ConflictBubble.tsx (already exists, needs integration)
  ├── conflictStore.ts (already exists, already has API)
  ├── ConflictDialog/ (already exists)
  └── RTDB conflicts/{canvasId}: ✅ already has listener

Epic 3 (Intention Bubble)
  ├── presence.ts (add intention field to PresenceUser + updateCursor)
  ├── RemoteCursor.tsx (add intention prop + IntentionBubble)
  ├── IntentionBubble.tsx (new component)
  └── RTDB presence/{canvasId}/{userId}: extend with intention field

Epic 4 (S32 QA Fixes)
  ├── CanvasThumbnail.tsx (add data-testid)
  ├── OfflineBanner.tsx (add data-sync-progress)
  └── baseline screenshots generation
```

---

## 8. Critical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Epic 2 conflict data model | No new RTDB schema | conflicts/{canvasId} already exists, ConflictBubble already has listener |
| Epic 3 intention field placement | PresenceUser.intention (inline) | Simpler than separate node, aligns with cursor object |
| Epic 1 parentId for group detection | Use `parentId === null && children?.length > 0` | Group nodes are parents (have children), not children of others |
| Epic 3 intention update frequency | Throttle updateCursor to 100ms | Already throttled in existing presence.ts |
| Epic 4 testid approach | Static HTML attributes | No runtime cost, E2E-friendly |

---

## 9. NOT in Scope

- P003-C (操作历史时间线): RTDB schema 变更风险高，延后至 Sprint 34
- Group 嵌套层级 > 2 级的 UI 处理
- ConflictBubble 与 OfflineBanner 联动
- 意图类型自定义配置
- 意图历史记录

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint33
- **执行日期**: 2026-05-09