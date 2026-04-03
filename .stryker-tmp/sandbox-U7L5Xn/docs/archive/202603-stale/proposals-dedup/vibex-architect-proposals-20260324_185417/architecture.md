# Architecture Design: vibex-architect-proposals-20260324_185417

**Project**: vibex-architect-proposals-20260324_185417  
**Architect**: Architect Agent  
**Date**: 2026-03-24  
**Status**: In Progress  
**Depends On**: analysis.md (analyst), prd.md (pm)

---

## 1. Context & Scope

### 1.1 Background

This project captures the Architect agent's proposals from the 2026-03-24 proposal collection cycle. Three proposals were submitted covering toolchain stability, frontend quality, and architecture debt. After PM's PRD refinement and Epic clustering, these proposals map to 4 Epics spanning 3 Sprints.

### 1.2 Scope of This Document

This document provides:
- Architecture impact analysis for each Epic
- Technical implementation approach
- Data model changes
- API definitions where applicable
- Testing strategy

### 1.3 Out of Scope

- Individual Epic project architecture (each Epic has its own design doc)
- Dev/tester/reviewer specific implementation details

---

## 2. Epic Architecture Impact

### 2.1 Epic 1: Toolchain Hemostasis (Sprint 0)

**Goal**: Fix blocking toolchain issues to unlock all agents.

```mermaid
flowchart LR
    subgraph "Before: Broken Chain"
        A[task_manager list] -->|timeout| B[blocked]
        C[heartbeat] -->|stale state| D[ghost tasks]
    end
    subgraph "After: Stable Chain"
        A2[task_manager list] -->|5s| B2[ok]
        C2[heartbeat] -->|consistent| D2[clean state]
    end
```

#### Technical Changes

| Component | Change | Risk |
|-----------|--------|------|
| `task_manager.py` | Add 5s timeout to all subprocess calls | Low |
| `task_manager.py` | Add deadlock detection (max 3 retries) | Low |
| `heartbeat/*.sh` | Add state snapshot consistency check | Low |
| `verify-fake-completion.sh` | Validate git commit exists before marking done | Low |

#### Data Model: Task State Machine

```
                    ┌──────────────────────────────────────┐
                    │                                      │
     ┌───────────────▼───────────────┐                   │
     │        pending                 │                   │
     └───────────────┬───────────────┘                   │
                     │ claim()                            │
     ┌───────────────▼───────────────┐                   │
     │        in_progress            │                   │
     └───────────────┬───────────────┘                   │
         ┌───────────┼───────────┐                       │
         │           │           │                       │
         ▼           ▼           ▼                       │
    ┌────────┐  ┌─────────┐  ┌─────────┐                │
    │  done  │  │ failed  │  │ blocked │                │
    └────────┘  └─────────┘  └─────────┘                │
```

**State Transition Rules**:
- `pending → in_progress`: Only when claimed by an agent
- `in_progress → done`: Must have git commit + verification passed
- `in_progress → failed`: Verification failed or uncaught exception
- `blocked → in_progress`: After blocker resolved
- Any state → `pending`: On explicit reset (coord only)

#### Verification Contract

```python
# task_manager.py contract
def claim(project, task_id) -> Task:
    # MUST return within 5 seconds
    # MUST validate git status before allowing claim
    # MUST prevent duplicate claims
    pass

def list() -> List[Task]:
    # MUST return within 5 seconds
    # MUST filter out stale in_progress (> 15 min without update)
    pass
```

### 2.2 Epic 2: Frontend Quality (Sprint 1)

**Goal**: Elevate frontend reliability through dedup, tests, and CI integration.

```mermaid
flowchart TB
    subgraph "ErrorBoundary Landscape (Before)"
        EB1[ErrorBoundary A] 
        EB2[ErrorBoundary B] 
        EB3[ErrorBoundary C]
        EB1 -.->|duplicate| EB2
    end
    
    subgraph "ErrorBoundary Landscape (After)"
        EB_DEDUP[Single ErrorBoundary\nwith feature flags]
    end
    
    subgraph "Testing Pyramid"
        E2E[E2E Tests\nPlaywright]
        UNIT[Unit Tests\nJest - CardTreeNode]
        API[API Tests\nMock Service Worker]
    end
    
    E2E --> CI[GitHub Actions]
    UNIT --> CI
```

#### Component Deduplication Strategy

| Pattern | Before | After | Migration |
|---------|--------|-------|-----------|
| ErrorBoundary | 3 copies in codebase | 1 canonical + feature flags | Incremental, keep working copies until validated |
| CardTreeNode | No tests | 85%+ coverage | Add tests incrementally, never break working features |
| API Error Handling | Inline try/catch | Centralized error type | `ErrorType` enum in `@/types` |

#### Data Model: Frontend Test Results

```typescript
interface TestCoverage {
  component: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  threshold: number; // 85 for CardTreeNode
}

interface ErrorBoundary {
  id: string;
  location: string;
  fallback: ReactNode;
  onError: (error: Error, info: ErrorInfo) => void;
  isCanonical: boolean; // true = keep, false = deprecated
}
```

### 2.3 Epic 3: Architecture Debt (Sprint 2) ⚠️ HIGH RISK

**Goal**: Refactor confirmationStore (461 lines) into manageable modules.

```mermaid
flowchart TB
    subgraph "Batch 1: Extraction"
        CS[confirmationStore.ts 461 lines]
        CS --> ST1[state.ts<br/>~100 lines]
        CS --> AC1[actions.ts<br/>~100 lines]
        ST1 --> TEST1[Batch1 Tests]
        AC1 --> TEST1
    end
    
    subgraph "Batch 2: Refinement"
        ST1 --> SEL2[selectors.ts<br/>~80 lines]
        AC1 --> EP2[effects.ts<br/>~80 lines]
        EP2 --> TEST2[Batch2 Tests]
    end
    
    subgraph "Batch 3: Polish"
        SEL2 --> HOOKS[Custom hooks<br/>~50 lines]
        EP2 --> HOOKS
        HOOKS --> TEST3[Batch3 Tests]
    end
    
    subgraph "Backward Compatibility Layer"
        CS --> PROXY[useConfirmationStore Proxy<br/>wraps new modules]
    end
```

#### Batch Execution Contract

| Batch | Deliverable | Regression Risk | Rollback Strategy |
|-------|-------------|-----------------|-------------------|
| 1 | `state.ts` + `actions.ts` extracted | Medium | Revert `useConfirmationStore` import path |
| 2 | `selectors.ts` + `effects.ts` | Low | Keep batch 1 stable |
| 3 | Custom hooks | Low | Hooks are additive |

**Non-Negotiable Requirements**:
- Each batch must pass all existing tests before moving to next
- `useConfirmationStore` proxy MUST remain functional throughout
- localStorage migration script must handle both old and new format
- Architect must review each batch PR before merge

#### ADR-001 & ADR-002

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | ConfirmationStore Split Strategy | Draft → Proposed |
| ADR-002 | Error Type Standardization | Draft → Proposed |

### 2.4 Epic 4: AI Agent Governance (Sprint 1-2)

**Goal**: Improve agent collaboration through standardized proposal lifecycle and knowledge sharing.

```mermaid
flowchart LR
    subgraph "Proposal Lifecycle"
        P1[Proposal\nSubmission] --> P2[Analyst\nReview]
        P2 --> P3[PM\nPRD]
        P3 --> P4[Architect\nDesign]
        P4 --> P5[Coord\nDecision]
        P5 --> P6[Epic\nCreation]
    end
    
    subgraph "Knowledge Base"
        P6 --> KB[Shared Docs\n/proposals/YYYYMMDD/]
        KB --> RETRIEVE[All Agents\nCan Search]
    end
```

#### Proposal Format Standard

```typescript
interface Proposal {
  id: string;           // P0-1, P1-2, etc.
  title: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  estimatedHours: 'S' | 'M' | 'L';
  riskLevel: 'Low' | 'Medium' | 'High';
  owner: AgentRole;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  epic?: string;
  acceptanceCriteria: string[];
}
```

---

## 3. Implementation Sequence

```mermaid
gantt
    title Epic Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Sprint 0
    Epic1 task_manager fix     :epic1-1, 2026-03-24, 2d
    Epic1 page.test.tsx       :epic1-2, after epic1-1, 1d
    Epic1 dedup production     :epic1-3, after epic1-2, 1d
    section Sprint 1
    Epic1 heartbeat stability  :epic1-4, 2026-03-27, 1d
    Epic1 HEARTBEAT tracking   :epic1-5, after epic1-4, 1d
    Epic2 parallel             :epic2, 2026-03-27, 3d
    Epic4 parallel             :epic4, 2026-03-27, 2d
    section Sprint 2
    Epic3 Batch 1             :epic3-1, 2026-03-30, 2d
    Epic3 Batch 2             :epic3-2, after epic3-1, 2d
    Epic3 Batch 3             :epic3-3, after epic3-2, 2d
```

---

## 4. Testing Strategy

### 4.1 Toolchain Testing (Epic 1)

**Framework**: pytest + bash

| Test Case | Method | Pass Criteria |
|-----------|--------|---------------|
| `list` command response time | Timer | < 5000ms |
| `claim` prevents duplicate | State check | Only one agent per task |
| Deadlock detection | Timeout inject | Triggers after 3 retries |
| Heartbeat state consistency | Cross-check | All agents see same state |

```python
def test_list_under_5_seconds():
    start = time.time()
    result = subprocess.run(['python3', 'task_manager.py', 'list'], timeout=5)
    elapsed = time.time() - start
    assert elapsed < 5.0, f"list took {elapsed}s, expected < 5s"
    assert result.returncode == 0
```

### 4.2 Frontend Testing (Epic 2)

**Framework**: Jest + React Testing Library + Playwright

| Test Case | Framework | Pass Criteria |
|-----------|-----------|---------------|
| CardTreeNode renders | RTL | `expect(screen.getByText('...')).toBeInTheDocument()` |
| ErrorBoundary catches error | RTL | `expect(screen.getByText('fallback')).toBeInTheDocument()` |
| E2E: CardTree interaction | Playwright | No console errors, < 2s |
| Coverage threshold | Jest --coverage | Statements ≥ 85% |

### 4.3 Architecture Debt Testing (Epic 3)

**Framework**: Jest + Integration Tests

| Test Case | Method | Pass Criteria |
|-----------|--------|---------------|
| confirmationStore backward compat | Integration | Existing `useConfirmationStore` callers work |
| localStorage migration | Unit | Old format → new format, no data loss |
| Each batch standalone | Unit | Batch 1, 2, 3 pass independently |

```python
# Example migration test
def test_localStorage_migration():
    old_data = {"confirmations": [...], "version": "1.0"}
    migrated = migrate(old_data)
    assert migrated["version"] == "2.0"
    assert "confirmations" in migrated
    assert len(migrated["confirmations"]) == len(old_data["confirmations"])
```

---

## 5. Risk Register

| Risk | Epic | Probability | Impact | Mitigation |
|------|------|-------------|--------|------------|
| confirmationStore batch regression | Epic 3 | High | High | Proxy layer, incremental batches, full test suite per batch |
| ErrorBoundary dedup breaks existing error handling | Epic 2 | Medium | Medium | Feature flags, keep old copies until validated |
| task_manager timeout false positives | Epic 1 | Low | Low | Deadlock detection + retry logic |
| localStorage migration data loss | Epic 3 | Medium | High | Migration script with rollback, data validation |

---

## 6. Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | ADR-002 ErrorType enum: should it replace all inline error types? | architect | 2026-03-27 |
| 2 | Epic 3 batch size: is 3 batches optimal or should we do 5 smaller batches? | architect | 2026-03-30 |
| 3 | Epic 4 MEMORY.md: should all agents update one shared MEMORY or maintain separate? | coord | 2026-03-27 |
