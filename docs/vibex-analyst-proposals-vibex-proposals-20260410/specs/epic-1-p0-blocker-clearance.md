# Spec: Epic 1 — P0 Blocker Clearance

**Epic ID**: E-A1
**Epic Name**: P0 Blocker Clearance
**Parent**: vibex-analyst-proposals-vibex-proposals-20260410
**Stories**: S1.1, S1.2, S1.3
**Total Estimated Hours**: 4h
**Priority**: P0 (Sprint Day 1, highest priority)

---

## Story S1.1: Migrate Slack Token to Environment Variable

**ID**: S1.1
**Title**: GitHub Secret Scanning Fix
**Proposal**: A-P0-1
**Estimated Hours**: 1h
**Assignee**: Dev

### Problem Statement

`scripts/task_manager.py` contains a hardcoded Slack User Token (`xoxp-...`). GitHub's secret scanning blocks any commit containing this pattern, making it impossible to push changes to the file. This blocks the entire team's workflow.

### Technical Specification

#### Current State
```python
# scripts/task_manager.py (line ~15)
SLACK_TOKEN = "xoxp-12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # HARDCODED
```

#### Target State
```python
# scripts/task_manager.py
import os
SLACK_TOKEN = os.environ.get('SLACK_TOKEN', '')
```

#### Files to Modify
1. `scripts/task_manager.py` — Replace hardcoded token with `os.environ.get`
2. `.env.example` — Add `SLACK_TOKEN=` line (if file exists; create if not)
3. `.gitignore` — Ensure `.env` is ignored (verify)
4. `docs/ENVIRONMENT.md` (or README) — Document SLACK_TOKEN requirement

#### Acceptance Criteria

```
Given: a developer modifies scripts/task_manager.py
When:  they run git push
Then:  push succeeds without GitHub secret scanning failure
  AND: grep -r "xoxp-" scripts/task_manager.py returns empty

Given: CI/CD pipeline runs without SLACK_TOKEN environment variable set
When:  task_manager.py is executed
Then:  SLACK_TOKEN is empty string (not null/undefined)
  AND: no exception thrown due to missing token

Given: a new developer clones the repository
When:  they inspect .env.example
Then:  the file contains SLACK_TOKEN= line
  AND: the file does NOT contain any actual token value
```

### Implementation Notes

- Use `os.environ.get('SLACK_TOKEN', '')` — empty string as fallback (fail gracefully in dev)
- NEVER log the token value, even in debug mode
- CI/CD: configure GitHub Actions secrets or deployment secret manager to inject `SLACK_TOKEN`
- Verify: after change, run `git push` of a test commit touching only task_manager.py

---

## Story S1.2: ESLint no-explicit-any Cleanup

**ID**: S1.2
**Title**: TypeScript Type Safety Baseline
**Proposal**: A-P0-2
**Estimated Hours**: 2h
**Assignee**: Dev

### Problem Statement

`tsc --noEmit` reports explicit `any` types in 9+ TypeScript files across `packages/` and `services/`. This erodes type safety, makes refactoring risky, and masks potential bugs. The `no-explicit-any` ESLint rule exists but is not enforced.

### Technical Specification

#### Step 1: Audit
```bash
# Find all explicit any types
grep -rn " : any\| :any\|: any\|:any" packages/ services/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  | grep -v "@ts-ignore" \
  | grep -v "// eslint-disable"
```

#### Step 2: Classification
| Type | Fix Strategy | Example |
|------|-------------|---------|
| Simple `any` | Replace with specific type | `value: any` → `value: string` |
| Object `any` | `Record<string, unknown>` or interface | `data: any` → `data: Record<string, unknown>` |
| Array `any` | `unknown[]` or typed array | `items: any[]` → `items: Component[]` |
| Function return `any` | Explicit return type | `function x(): any` → `function x(): void` |
| Parameter `any` | Infer from call site or use `unknown` | `arg: any` → `arg: unknown` |

#### Step 3: Enforcement
Ensure `eslint.config.js` (or `.eslintrc.js`) includes:
```javascript
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'error'
  }
}
```

#### Files to Audit (known files from analysis)
Files in `packages/` and `services/` containing explicit `any` — exact list to be confirmed via audit step.

#### Acceptance Criteria

```
Given: tsc --noEmit is run on the entire codebase
When:  the command completes
Then:  exit code is 0
  AND: no "error TS7006: Parameter 'xxx' has an implicit 'any' type" messages
  AND: no "error TS7017: Unreachable code detected" related to any

Given: pnpm lint is run
When:  the command completes
Then:  exit code is 0
  AND: no "@typescript-eslint/no-explicit-any" errors

Given: a developer introduces a new explicit any in a changed file
When:  they open a PR
Then:  CI lint step fails
```

### Implementation Notes

- Do NOT suppress all existing `any` at once with `// @ts-ignore` — that defeats the purpose
- If a type genuinely cannot be determined (e.g., third-party dynamic response), use `unknown` instead of `any`
- Run `tsc --noEmit` before and after to measure progress
- Track cleaned files count as a sanity check (should be ≥ 9 files)

---

## Story S1.3: generate-components flowId E2E Verification

**ID**: S1.3
**Title**: AI Component FlowId Association Verification
**Proposal**: A-P0-3
**Estimated Hours**: 1h
**Assignee**: Tester

### Problem Statement

The fix for AI-generated components with incorrect `flowId` was committed in `5f3a2d` but **never verified with an E2E test**. Without a regression test, future changes could reintroduce the bug where components attach to `unknown` flow.

### Technical Specification

#### New Test File
```
tests/e2e/generate-components-flowid.test.ts
```

#### Test Scenario
```typescript
import { test, expect } from '@playwright/test';
import { canvasApi } from '@/api/canvas';

test('AI generates components with correct flowId', async ({ page }) => {
  // Setup: navigate to a project with at least one Flow node
  await page.goto('/canvas/project/test-project-e2e');
  
  // Create a flow node if none exists
  const flowNode = await createTestFlowNode(page, 'flow-e2e-test');
  
  // Trigger AI component generation for this specific flow
  await page.click('[data-testid="generate-components"]');
  await page.fill('[data-testid="flow-selector"]', flowNode.id);
  
  const response = await canvasApi.generateComponents({
    flowId: flowNode.id,
    // ... other params
  });
  
  // Assert: all generated components have the correct flowId
  expect(response.components.length).toBeGreaterThan(0);
  const allCorrectFlowId = response.components.every(
    (c: Component) => c.flowId === flowNode.id
  );
  expect(allCorrectFlowId).toBe(true);
  
  // UI assertion: components appear under the correct Flow node in Canvas
  await page.goto(`/canvas/project/test-project-e2e`);
  const componentCount = await page.locator(
    `[data-testid="flow-node-${flowNode.id}"] [data-testid="component-item"]`
  ).count();
  expect(componentCount).toBe(response.components.length);
});
```

#### Integration with canvasApi
Verify that `canvasApi.generateComponents()` correctly passes `flowId` to the backend and stores it in the response.

#### Acceptance Criteria

```
Given: an AI component generation request with flowId="flow-123"
When:  the request completes successfully
Then:  response.components[].flowId === "flow-123" for ALL components
  AND: the Canvas UI shows components under the "flow-123" Flow node
  AND: no component has flowId === "unknown" or null

Given: the E2E test runs in CI
When:  the test fails (flowId mismatch)
Then:  CI pipeline fails with clear error message
  AND: the bug is NOT silently merged
```

### Implementation Notes

- Use Playwright for cross-browser E2E
- The test should be isolated (clean up created flow nodes after test)
- Add to existing E2E suite: `pnpm test:e2e`
- Run against staging environment for realistic data

---

## Epic 1 DoD Checklist

- [ ] S1.1: `grep -r "xoxp-" scripts/task_manager.py` returns empty
- [ ] S1.1: `.env.example` has `SLACK_TOKEN=` line
- [ ] S1.1: `git push` succeeds after modifying task_manager.py
- [ ] S1.2: `npx tsc --noEmit` passes with exit code 0
- [ ] S1.2: `pnpm lint` passes with no explicit-any errors
- [ ] S1.2: At least 9 files cleaned of explicit `any`
- [ ] S1.3: `tests/e2e/generate-components-flowid.test.ts` exists and passes
- [ ] S1.3: All AI-generated components have correct flowId (E2E verified)
- [ ] All 3 proposals updated in TRACKING.md via `proposal_tracker.py update <id> done`
- [ ] PRs created and reviewed for each story
