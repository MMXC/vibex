# AGENTS.md: Homepage Theme Integration

**Project**: `homepage-theme-integration`

---

## Agent Responsibilities

### dev
- Integrate `ThemeWrapper` into `src/app/page.tsx`
- Add `ThemeToggle` to Navbar
- Fix `jest.setup.ts` fetch mock

### tester
- Verify `theme-binding.test.tsx` passes 23/23
- Verify layout no regressions
- Verify theme toggle works manually

### reviewer
- Review integration point (page.tsx vs HomePage.tsx)
- Confirm no layout breaks
- Approve jest.setup.ts fix
