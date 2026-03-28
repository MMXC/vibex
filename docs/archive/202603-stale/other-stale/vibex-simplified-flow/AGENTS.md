# AGENTS.md: Vibex Simplified Flow

**Project**: `vibex-simplified-flow`

---

## Agent Responsibilities

### dev
- **Phase 1**: Term translation layer (termMap.ts, useTermTranslation.ts), Zustand store, Feature Flag
- **Phase 2**: Backend API `/ddd/business-domain` + API verification first (per PRD constraint)
- **Phase 3**: Step 1 components (DomainCard, FlowChart, node editing)
- **Phase 4**: Step 2 & 3 + old routes Feature Flag guards
- **Phase 5**: Final wiring + E2E support

### tester
- **Phase 2**: Verify `/ddd/business-domain` API returns valid response with no DDD terms
- **Phase 5**: Cypress E2E for 3-step flow + regression (flag=false)

### reviewer
- Review term translation completeness
- Confirm old routes have proper Feature Flag guards
- Approve E2E test coverage

---

## Key Constraint (per PRD)

**Test API before frontend**: Verify `/ddd/business-domain` returns valid, translated data before building Step 1 components.

---

## Workflow

```
Phase 1 → Phase 2 (API first!) → Phase 3 → Phase 4 → Phase 5
   P0            P0                  P0       P1         P0
```
