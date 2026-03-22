# Changelog

## [Unreleased]

### Backend Core

#### 2026-03-23

- **Epic1-Infrastructure**: Backend Core for Simplified Flow
  - Shared Type Definitions: `src/types/simplified-flow.ts` (BusinessDomain, Feature, FlowNode, FlowEdge, UINode, StepState, etc.)
  - Step State API: `src/routes/step-state.ts` (POST/GET/DELETE /api/step-state, optimistic locking)
  - Project Snapshot API: `src/routes/project-snapshot.ts` (GET /api/projects with snapshot)
  - Route Registration: /api/step-state registered in `src/index.ts`
  - Backend Tests: 436 tests passed
  - Commit: `7e0b669c`

- **Epic2-DataStructure**: Prisma Schema Extension for Simplified Flow
  - Prisma Schema Extension: `prisma/schema.prisma` (StepState, ChangeLog, BusinessDomain, UINode models)
  - Project Model Extensions: status, version, isTemplate, parentDraftId fields
  - D1 Migration: `prisma/migrations/003_step_state_tables.sql`
  - Backend Tests: 436 tests passed
  - Commit: `9f17483e`
