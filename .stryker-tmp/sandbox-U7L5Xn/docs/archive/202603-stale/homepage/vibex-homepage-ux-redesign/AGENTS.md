# AGENTS.md: Vibex Homepage UI/UX Redesign

**Project**: `vibex-homepage-ux-redesign`

---

## Agent Responsibilities

### dev
- **Phase 1**: Design tokens, EmptyState, Skeleton verification, lucide-react
- **Phase 2**: Remove visual noise (glowOrb, cardGlow, gridOverlay)
- **Phase 3**: Lucide icon replacement + aria-label
- **Phase 4**: Sidebar grouping, homepage layout, EmptyState integration
- **Phase 5**: Accessibility audit, keyboard nav, reduced motion

### tester
- Run Lighthouse CI accessibility audit after each phase
- Verify `npm test` passes after each phase
- Verify `npm run build` succeeds
- Check contrast ratios with automated tools

### reviewer
- Review design token expansion for consistency
- Confirm no visual regressions after removing effects
- Verify Lucide replacement is complete (no emoji remaining in nav)
- Approve accessibility improvements

---

## Workflow

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
  (P0)      (P0)      (P1)      (P1)      (P2)
```

Each phase: dev → tester → reviewer → merge
