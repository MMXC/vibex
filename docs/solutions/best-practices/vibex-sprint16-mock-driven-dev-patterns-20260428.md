---
title: Sprint 16 — Mock-Driven Dev Patterns + Design-to-Code Traceability
date: 2026-04-28
category: docs/solutions/best-practices/
module: VibeX Canvas
problem_type: best_practice
component: frontend_stimulus
severity: medium
applies_when:
  - Integrating external services (Firebase, Supabase, etc.) before backend is ready
  - Maintaining design tokens across Figma → Code pipeline
  - Building version/snapshot systems for mutable documents
  - Developing MCP tools that need standardized documentation
  - Implementing code generation with type safety requirements
tags: [mock-driven-development, design-to-code, firebase, version-history, mcp-tools, code-generation]
---

# Sprint 16 — Mock-Driven Dev Patterns + Design-to-Code Traceability

## Context

Sprint 16 shipped 6 Epics spanning mock infrastructure, design-to-code sync, version history, and MCP tool governance. The sprint established recurring patterns that apply across the VibeX stack — mock-first development, token drift detection, snapshot safety nets, and MCP documentation standards.

## Guidance

### 1. Mock-First Development (FirebaseMock Pattern)

Build mock layers **before** real backend integration. The FirebaseMock singleton implements a 4-state machine matching real Firebase behavior:

```typescript
type FirebaseState = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'RECONNECTING';
```

**Key patterns:**

- **State machine parity**: Client and server mock implementations must mirror each other identically
- **Graceful degradation**: Cold start detection (<500ms) triggers local-only fallback
- **Exponential backoff**: `1s base → 30s max, 3 attempts` for reconnection
- **Degraded simulation**: Inject latency (2s) to simulate real-world conditions
- **Cold start measurement**: `measureColdStart()` enables auto-detection

**ConflictBubble component** surfaces state to users:
```typescript
// 4-state banner: Offline / Reconnecting / Synced / Slow connection
// Auto-dismiss after 2s when CONNECTED
role="status" aria-live="polite" // accessibility required
```

**When to apply**: Any external service (Firebase, Supabase, REST API) — build mock first, integrate real later.

### 2. Design-to-Code Traceability (Design Review → Drift Detection)

Bridging Figma design tokens and code tokens requires three layers:

```
Figma Design Tokens → driftDetector → ConflictResolutionDialog → Code Tokens
```

**driftDetector pattern:**
```typescript
detectDrift(designTokens, codeTokens, scenario?)
// Returns: { added, removed, modified } token changes
// 3 scenarios: A (renamed), B (refactored), C (no drift)
// isDriftAcceptable() threshold check prevents false positive spam
```

**ConflictResolutionDialog**: 3-panel diff UI (Design / Token / Code) with Accept buttons per panel. Cyberpunk glassmorphism styling. User makes informed decisions.

**batchExporter** scales to 50+ component exports:
```typescript
batchExport(tasks, concurrency, onProgress)
// Promise.allSettled with configurable concurrency
// Memory leak prevention via result clearing
// export50Components() helper
```

**When to apply**: Design system maintenance, Figma-to-code workflows, any multi-source token sync.

### 3. Version Snapshots with Safety Nets (Canvas Version History)

Auto-snapshot systems need guards against common failure modes:

```typescript
// 30s debounce prevents snapshot storms on rapid changes
// Manual snapshot via createSnapshot() for explicit saves
// Pre-restore backup: always create backup BEFORE restore
restoreSnapshot(id) {
  await createSnapshot({ type: 'pre-restore-backup', projectId });
  await applySnapshot(id);
}

// Max 50 snapshots with pruning prevents storage bloat
// null projectId rejection at API level prevents silent failures
if (!projectId) throw new Error('projectId required');
```

**VersionHistoryPanel UX**:
- Manual section (📌 icon) vs Auto-save section (⏱️ icon) — visually distinct
- Restore confirmation dialog before destructive action
- Empty state with 30s hint (not always visible — debounce means users wait)
- `data-testid` coverage for all interactive elements

**When to apply**: Any mutable document with history/revision needs, canvas snapshots, config versioning.

### 4. MCP Tool Documentation Standard (S16-P2-2)

Every MCP tool doc must include **all** of these sections:

| Section | Content |
|---------|---------|
| Overview | Purpose, when to use |
| Input | Parameters with types, required vs optional |
| Output | Return format, examples |
| Error | Error codes, severity levels, when they occur |
| Issue Severity | How to classify and respond to issues |
| Examples | Basic + edge case examples |
| CLI | Command-line usage |
| Testing | How to test the tool |

**Error code standard (E100-E108):**
```typescript
const ERROR_CODES = {
  E100: 'Invalid input parameters',
  E101: 'Resource not found',
  E102: 'Permission denied',
  // ... up to E108
};
```

**Retry strategy**: Exponential backoff `1s → 30s` for transient failures. Log each retry attempt.

**Naming conventions**: `kebab-case` tool names, `semver` versioning, sunset date required for deprecation.

**⚠️ DoD gaps found in S16-P2-2**:
- `INDEX.md` (tool registry index) — NOT implemented
- `generate-tool-index.ts` (auto-generate index) — NOT implemented
- `GET /health` endpoint in `index.ts` — NOT implemented

**When to apply**: Any MCP tool development. The template enforces consistency across all tools.

### 5. Code Generator Type Safety

Separate prop interfaces per component type enable type-safe generation:

```typescript
interface FlowStepProps {
  stepName: string;
  actor: string;
  pre: string;
  post: string;
  stepId: string;
}

interface APIEndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  operationId: string;
}

interface StateMachineProps {
  states: string[];
  transitions: Array<{ from: string; event: string; to: string }>;
  initialState: string;
  stateMachineId: string;
}

// Union type for type-safe generation
type ComponentSpec = FlowStepProps | APIEndpointProps | StateMachineProps;
```

**Benefits**:
- Type errors caught at compile time, not runtime
- Each component type has its own validation logic
- Optional fields handled explicitly
- Unit tests validate type coercion

**When to apply**: Any code generation / metaprogramming system, template-based code factories.

## Why This Matters

**Mock-first** accelerates parallel development — frontend doesn't wait for backend. But mocks must mirror real behavior exactly, or integration will surface surprises.

**Design-to-code** prevents token drift from accumulating silently. Without driftDetector, design system decays over time with no visibility.

**Snapshot safety nets** prevent data loss. Pre-restore backup + null checks are cheap insurance against destructive operations.

**MCP documentation standard** ensures tools are maintainable. Without a template, docs drift and become useless.

**Type-safe codegen** catches errors at compile time. Without it, generated code silently produces wrong types.

## Examples

### Mock-First: Adding a new external service
```typescript
// 1. Define state machine
type ServiceState = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'RECONNECTING';

// 2. Implement mock with exponential backoff
class ServiceMock {
  private state: ServiceState = 'DISCONNECTED';
  private attempts = 0;

  async connect() {
    this.state = 'RECONNECTING';
    await this.backoff();
    this.state = 'CONNECTED';
    this.attempts = 0;
  }

  private async backoff() {
    const delay = Math.min(1000 * 2 ** this.attempts, 30000);
    await sleep(delay);
    this.attempts++;
  }
}

// 3. Cold start detection
const coldStart = await measureColdStart();
if (coldStart > 500) {
  // Fall back to local-only mode
}
```

### Snapshot with Safety Net
```typescript
async function restoreVersion(id: string, projectId: string) {
  if (!projectId) throw new Error('projectId required'); // null guard

  // Pre-restore backup
  await createSnapshot({
    type: 'pre-restore-backup',
    projectId,
    description: `Auto-backup before restore to ${id}`
  });

  // Max 50 snapshots
  const count = await getSnapshotCount(projectId);
  if (count >= 50) {
    await pruneOldest(projectId);
  }

  // Restore
  await applySnapshot(id);
}
```

## Related

- `docs/vibex-sprint16/firebase-config-path.md` — Firebase config env vars and connection flow
- `docs/vibex-sprint16/design-to-code-verification.md` — 3-scenario test matrix and FP rate table
- `docs/vibex-sprint16/mcp-tool-governance/` — All 6 MCP tool docs
- `docs/solutions/best-practices/qa-sprint-delivery-integration-mock-data-detection-2026-04-18.md` — Sprint QA mock data patterns
