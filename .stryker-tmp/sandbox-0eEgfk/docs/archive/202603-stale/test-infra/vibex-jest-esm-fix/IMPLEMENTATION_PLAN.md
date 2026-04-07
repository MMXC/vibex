# Implementation Plan: vibex-jest-esm-fix

> **Ralph Planning Format** — Phase → Task → Spec mapping

---

## Phase 1: Jest Setup & Configuration (Epic 1 — P0)

### Task 1.1: Create jest.setup.ts
**Spec**: F1.1 (Jest setup file)
**Agent**: dev
**Working Dir**: `/root/.openclaw/vibex/vibex-backend`

**Acceptance Criteria**:
- [ ] File `jest.setup.ts` exists at `<rootDir>/jest.setup.ts`
- [ ] Content includes `jest.spyOn(console, 'error').mockImplementation(() => {})`
- [ ] File is TypeScript-compatible (ts-jest handles it)

**Implementation**:
```typescript
// jest.setup.ts
// Global mock: silence console.error during all test runs
jest.spyOn(console, 'error').mockImplementation(() => {});

// Optional: clear mocks after each test to avoid memory leaks
// (Jest auto-clears between tests, so not strictly needed)
```

**Verification**:
```bash
test -f /root/.openclaw/vibex/vibex-backend/jest.setup.ts
grep -q 'mockImplementation' /root/.openclaw/vibex/vibex-backend/jest.setup.ts
```

---

### Task 1.2: Update jest.config.js
**Spec**: F1.2 (Jest config update)
**Agent**: dev
**Working Dir**: `/root/.openclaw/vibex/vibex-backend`

**Acceptance Criteria**:
- [ ] `jest.config.js` contains `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`
- [ ] No other config values changed
- [ ] Config validates (`npx jest --showConfig` exits 0)

**Implementation**:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // ... existing config ...
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],  // ADD THIS LINE
};
```

**Verification**:
```bash
grep -q 'setupFilesAfterEnv' /root/.openclaw/vibex/vibex-backend/jest.config.js
cd /root/.openclaw/vibex/vibex-backend && npx jest --showConfig | grep setupFilesAfterEnv
```

---

### Task 1.3: Run tests and verify clean output
**Spec**: F1.3 (Test output verification) + F1.4 (All tests pass)
**Agent**: tester
**Working Dir**: `/root/.openclaw/vibex/vibex-backend`

**Acceptance Criteria**:
- [ ] `npm test` exits with code 0
- [ ] Output contains: `Test Suites: 55 passed` (or higher)
- [ ] Output contains: `Tests: 436 passed` (or higher)
- [ ] Output does NOT contain: `Error fetching projects`, `Error creating project`

**Verification**:
```bash
cd /root/.openclaw/vibex/vibex-backend && npm test 2>&1 | tee /tmp/test-output.txt
echo "Exit code: $?"
grep -E "Test Suites:.*passed" /tmp/test-output.txt
grep -E "Tests:.*passed" /tmp/test-output.txt
! grep -E "(Error fetching projects|Error creating project)" /tmp/test-output.txt && echo "✅ No console.error noise"
```

---

## Phase 2: Documentation (Epic 2 — P2)

### Task 2.1: Write CONFIG_COMPARISON.md
**Spec**: F2.1 (ESM config comparison doc)
**Agent**: dev (can be combined with Phase 1)
**Working Dir**: `/root/.openclaw/vibex/docs/vibex-jest-esm-fix/`

**Acceptance Criteria**:
- [ ] `CONFIG_COMPARISON.md` exists
- [ ] Documents current CommonJS config (ts-jest preset, no "type": "module")
- [ ] Documents ESM migration path (ts-jest/default-esm preset, .mjs handling)
- [ ] Includes effort estimate: 1-2 person-days
- [ ] Includes risk assessment: Medium

**Implementation**: Write comparison document covering:
1. Current state (CommonJS)
2. Target state (ESM)
3. Migration steps checklist
4. Risk matrix

**Verification**:
```bash
test -f /root/.openclaw/vibex/docs/vibex-jest-esm-fix/CONFIG_COMPARISON.md
grep -q "CommonJS" /root/.openclaw/vibex/docs/vibex-jest-esm-fix/CONFIG_COMPARISON.md
grep -q "ESM" /root/.openclaw/vibex/docs/vibex-jest-esm-fix/CONFIG_COMPARISON.md
```

---

## Summary

| Phase | Task | Spec | Agent | Priority |
|-------|------|------|-------|----------|
| 1 | Create jest.setup.ts | F1.1 | dev | P0 |
| 1 | Update jest.config.js | F1.2 | dev | P0 |
| 1 | Verify test results | F1.3, F1.4 | tester | P0 |
| 2 | Write CONFIG_COMPARISON.md | F2.1 | dev | P2 |

**Estimated total effort**: 1-2 hours (mostly Phase 1 verification)
**Files changed**: 2 files (+1 new, +1 modified)
**Dependencies added**: 0
