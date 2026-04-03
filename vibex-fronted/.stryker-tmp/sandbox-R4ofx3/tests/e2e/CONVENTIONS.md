# Playwright E2E Test Conventions

## Naming
- File: `<feature>-<epic>.spec.ts`
- Test: `E2E-N: <Description>` (e.g., `E2E-1: Normal flow`)

## Structure
```typescript
test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });
  
  test('E2E-1: Description', async ({ page }) => {
    // Arrange
    // Act  
    // Assert
  });
});
```

## CI-Blocking Tests (required)
- Must cover critical user flows
- Named `E2E-*` (no skip/only)
- Run on every PR

## Page Objects
- Helper functions at top of file
- No page object classes (simple approach)
