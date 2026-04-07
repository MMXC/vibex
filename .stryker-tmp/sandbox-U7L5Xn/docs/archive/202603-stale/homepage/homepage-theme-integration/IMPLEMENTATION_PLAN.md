# Implementation Plan: Homepage Theme Integration

**Project**: `homepage-theme-integration`

---

## Dev Checklist

### Task 1: Integrate ThemeWrapper into page.tsx
**File**: `src/app/page.tsx`
**Estimated**: 0.5h

```tsx
import { ThemeWrapper } from '@/components/ThemeWrapper';
import HomePage from '@/components/homepage/HomePage';

export default function Page() {
  return (
    <ThemeWrapper>
      <HomePage />
    </ThemeWrapper>
  );
}
```

### Task 2: Add ThemeToggle to Navbar
**File**: `src/components/homepage/Navbar/Navbar.tsx`
**Estimated**: 0.5h

```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

// Add to toolbar/container section:
<div className={styles.toolbar}>
  <ThemeToggle />
  {/* existing toolbar items */}
</div>
```

### Task 3: Fix jest.setup.ts
**File**: `jest.setup.ts`
**Estimated**: 0.5h

Add default fetch mock to prevent test leakage:

```typescript
// Ensure global.fetch has a default mock for all tests
if (!global.fetch) {
  global.fetch = jest.fn();
}

(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ theme: 'dark' }),
});
```

### Task 4: Verify
```bash
npm test -- --watchAll=false --testPathPattern="theme-binding|ThemeWrapper|ThemeToggle"
npm run build  # ensure no TS errors
```

---

## Reviewer Checklist

- [ ] `ThemeWrapper` wraps `HomePage` in page.tsx, not inside HomePage.tsx
- [ ] `ThemeToggle` renders in Navbar (visible to user)
- [ ] `jest.setup.ts` mock resolves theme-binding test failures
- [ ] No new DOM wrapper adding layout breaks
- [ ] No FOUC on theme initialization
