# Architecture Evolution Roadmap

> **Project**: vibex-architect-proposals E3  
> **Date**: 2026-04-14  
> **Status**: Planning

## Current State

### Backend (Hono + D1)
- 61 routes with mixed error formats
- apiError() + STATUS_MAP now available (v2)
- Route replacement is the remaining work

### Frontend (Next.js 15)
- 318 test suites, 3618 tests
- 57 failed test files (pre-existing)
- 3531 passing tests

## Sprint 2 Priorities

### 1. Route Error Replacement
Replace 61 raw `NextResponse.json()` calls with `apiError()`:
```typescript
// Before
return NextResponse.json({ error: 'Not found' }, { status: 404 });

// After  
return NextResponse.json(apiError('Not found', ERROR_CODES.NOT_FOUND));
```

### 2. Test Coverage Baseline
Establish coverage baseline on critical paths:
- `/app/api/v1/` routes
- `/lib/` utilities
- `/stores/` Zustand stores

### 3. Vitest Failed Files Audit
Audit 57 failed test files — categorize as:
- Pre-existing configuration issues
- Import/path errors
- Missing mocks

## Recommendations

1. **API versioning**: Add `/v2/` prefix to new routes
2. **Error code registry**: Centralize ERROR_CODES in a JSON file
3. **Coverage gates**: `|| fail` if coverage drops below 60%
