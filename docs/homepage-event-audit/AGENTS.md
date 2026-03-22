# AGENTS.md: Homepage Event Binding Audit & Fix

**Project**: `homepage-event-audit`

---

## Agent Responsibilities

### dev
- **Phase 1 (P0)**: HomePage.tsx stub wiring, useHomePage.ts handlers, BottomPanel handleSend, API client
- **Phase 2 (P1)**: FloatingMode integration, SSE timeout, error boundary

### tester
- **Unit tests**: All 14 callback paths covered with Jest
- **E2E tests**: Cypress tests for button → API flow

### reviewer
- Verify no empty stubs remain
- Verify SSE streams still work
- Review API client signatures

---

## Workflow

```
Phase 1 (P0): dev → tester → reviewer
Phase 2 (P1): dev → tester → reviewer
Phase 3 (P2, optional): TBD based on Phase 2 results
```
