# Architecture: vibex-pre-existing-test-failures

## Approach
Minimal test fix approach — only update test files to match current component behavior.

## Changes
1. `src/components/homepage/CardTree/__tests__/CardTreeView.test.tsx` — Add mocks, fix data-testid
2. `src/components/homepage/Navbar/__tests__/Navbar.test.tsx` — Fix assertions to match DOM

## Testing
- Run specific test files to verify fixes
- Run full test suite to confirm 100% pass
