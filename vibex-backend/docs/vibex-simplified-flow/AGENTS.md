# AGENTS.md: Vibex Simplified Flow — Backend

**Project**: `vibex-simplified-flow` (Backend)
**Workdir**: `/root/.openclaw/vibex/vibex-backend`

---

## Dev Responsibilities

### Epic 1: Infrastructure
- [x] `src/types/simplified-flow.ts` — Shared types
- [x] `src/routes/step-state.ts` — Autosave API
- [x] `src/routes/project-snapshot.ts` — Snapshot API
- [x] `src/routes/projects.ts` — Extended for snapshot
- [x] `src/index.ts` — Route registration

### Epic 2: DataStructure
- [ ] `prisma/schema.prisma` — Add StepState, ChangeLog models
- [ ] `prisma/migrations/003_step_state_tables.sql` — D1 migration
- [ ] Update StepState route to use D1 instead of in-memory store

### Epic 3: BusinessDomainAPI
- [ ] Extend SPEC-01 with CRUD persistence
- [ ] Add domain->DB mapping

### Epic 4: FlowAPI
- [ ] Extend SPEC-02 with CRUD persistence
- [ ] Add flow->DB mapping

---

## Commands

```bash
# Backend build
cd /root/.openclaw/vibex/vibex-backend && pnpm run build

# Backend tests  
cd /root/.openclaw/vibex/vibex-backend && pnpm test

# Frontend build (needed for full verification)
cd /root/.openclaw/vibex/vibex-fronted && pnpm run build
```

---

## Specs Reference

All API specs: `/root/.openclaw/vibex/docs/vibex-simplified-flow/specs/`

| Spec | File | Status |
|------|------|--------|
| SPEC-01 | business-domain-generate | ✅ Streaming done |
| SPEC-02 | flow-generate | ✅ Streaming done |
| SPEC-03 | project-snapshot | ✅ Endpoint done |
| SPEC-04 | step-state | ✅ API done |
| SPEC-05 | project-convert | ⏳ PENDING |
| SPEC-06 | project-clone | ⏳ PENDING |
| SPEC-07 | project-rollback | ⏳ PENDING |
| SPEC-08 | ui-nodes-generate | ⏳ PENDING |
| SPEC-09 | templates | ⏳ PENDING |
