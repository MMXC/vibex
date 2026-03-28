# Analysis: vibex-pre-existing-test-failures

## Problem Statement
Two test suites in vibex-fronted are failing before the BC card layout feature was implemented:
- `CardTreeView.test.tsx` (7 tests failing)
- `Navbar.test.tsx` (3 tests failing)

## Root Cause Analysis

### CardTreeView.test.tsx
- **File**: `src/components/homepage/CardTree/__tests__/CardTreeView.test.tsx`
- **Last modified**: commit `71c9433e fix: remove unused imports in CardTree components` (before feature work)
- **Failure mode**: Tests expect `mock-cardtree-renderer` data-testid but the component doesn't render it
- **Analysis**: Test mocks for CardTreeRenderer are not properly set up; tests use `forceEnabled` but mocks for `CardTreeRenderer` are missing

### Navbar.test.tsx
- **File**: `src/components/homepage/Navbar/__tests__/Navbar.test.tsx`
- **Last modified**: commit `811b218c feat(vibex-homepage-api-alignment): Epic2 - CardTree integration with Feature Flag`
- **Failure mode**: Tests expect `start-cta-btn` data-testid which doesn't exist in the rendered output
- **Analysis**: Navbar component was refactored but tests were not updated to match the new DOM structure

## Impact
- 10 tests failing (10/2669 = 0.37%)
- Prevents 100% test pass requirement for any feature that modifies the full test suite

## Proposed Fixes

### CardTreeView.test.tsx
1. Add proper mock for `CardTreeRenderer` in test setup
2. Update data-testid expectations to match actual component behavior

### Navbar.test.tsx
1. Update test to look for the correct data-testid or element
2. Fix auth guard mock to match current component implementation

## Effort Estimate
- CardTreeView: ~30 minutes
- Navbar: ~20 minutes
