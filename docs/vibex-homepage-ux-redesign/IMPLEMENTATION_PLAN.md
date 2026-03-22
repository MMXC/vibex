# Implementation Plan: Vibex Homepage UI/UX Redesign

**Project**: `vibex-homepage-ux-redesign`

---

## Phase 1: Design System Foundation (P0) — ~3h

### Task 1.1: Expand design-tokens.css
**File**: `src/styles/design-tokens.css`
**Agent**: dev

Add missing tokens (see architecture.md §4.1):
- Color palette (primary, accent, neutral, semantic)
- Typography scale
- Spacing (4px grid)
- Radius (6px/12px)
- Global `:focus-visible`

### Task 1.2: Create EmptyState component
**File**: `src/components/ui/EmptyState.tsx`
**Agent**: dev

```tsx
// See architecture.md §4.2 for full spec
export function EmptyState({ icon, title, description, action }) { ... }
```

Export from `src/components/ui/index.ts`

### Task 1.3: Verify Skeleton.tsx
**File**: `src/components/ui/Skeleton.tsx`
**Agent**: dev

Run existing tests, verify works for Dashboard loading states.

### Task 1.4: Add lucide-react
**File**: `package.json`
**Agent**: dev

```bash
cd /root/.openclaw/vibex/vibex-fronted
npm install lucide-react
```

---

## Phase 2: Visual Noise Removal (P0) — ~1h

### Task 2.1: Remove dashboard noise
**File**: `src/app/dashboard/dashboard.module.css`
**Agent**: dev

Remove all `.glowOrb`, `.cardGlow`, `.projectCard:hover .cardGlow` blocks.

### Task 2.2: Remove gridOverlay
**Files**: `src/app/flow/flow.module.css`, `src/app/chat/chat.module.css`
**Agent**: dev

Remove `.gridOverlay` blocks. Remove `<div className={styles.gridOverlay} />` from page.tsx files.

---

## Phase 3: Icon & Accessibility (P1) — ~3h

### Task 3.1: Sidebar — Lucide + aria-label
**File**: `src/components/layout/Sidebar.tsx`
**Agent**: dev

Replace emoji with Lucide icons. Add aria-label to every icon button.

### Task 3.2: Navbar — Lucide + aria-label
**File**: `src/components/layout/Navbar.tsx`
**Agent**: dev

Same as Task 3.1.

### Task 3.3: Global focus-visible
**File**: `src/styles/globals.css`
**Agent**: dev

```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring, #3b82f6);
  outline-offset: 2px;
}
```

---

## Phase 4: Content & Layout (P1) — ~2h

### Task 4.1: Sidebar navigation grouping
**File**: `src/components/layout/Sidebar.tsx`
**Agent**: dev

Group 11 nav items into ≥2 groups with visual separators.

### Task 4.2: Homepage column width constraints
**File**: `src/components/homepage/HomePage.tsx`
**Agent**: dev

Set explicit widths: left ≤ 220px, right ≤ 260px.

### Task 4.3: Dashboard EmptyState
**File**: `src/app/dashboard/page.tsx`
**Agent**: dev

Add `<EmptyState>` when project list is empty.

---

## Phase 5: Accessibility Audit (P2) — ~2h

### Task 5.1: Color contrast fixes
**Files**: Multiple CSS files
**Agent**: dev

Run Lighthouse, fix all contrast failures. Target: ≥ 4.5:1 for body text, ≥ 3:1 for large text.

### Task 5.2: Keyboard navigation
**Files**: DropdownMenu, Modal, BottomPanel
**Agent**: dev

Verify Tab order, add keyboard handlers (↑↓ Enter Esc).

### Task 5.3: ParticleBackground motion safety
**File**: `src/components/ParticleBackground.tsx`
**Agent**: dev

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) return null; // or static fallback
```

---

## Dev Checklist

| # | Task | Output | Phase |
|---|------|--------|-------|
| 1.1 | Expand design-tokens.css | Full token set | P1 |
| 1.2 | Create EmptyState | Component + export | P1 |
| 1.3 | Verify Skeleton | Tests pass | P1 |
| 1.4 | Add lucide-react | package.json updated | P1 |
| 2.1 | Remove dashboard noise | Clean CSS | P2 |
| 2.2 | Remove gridOverlay | Clean flow/chat | P2 |
| 3.1 | Sidebar Lucide | Accessible icons | P3 |
| 3.2 | Navbar Lucide | Accessible icons | P3 |
| 3.3 | Global :focus-visible | globals.css | P3 |
| 4.1 | Sidebar grouping | Nav hierarchy | P4 |
| 4.2 | Homepage widths | Explicit constraints | P4 |
| 4.3 | Dashboard EmptyState | Empty state | P4 |
| 5.1 | Contrast fixes | Lighthouse ≥ 90 | P5 |
| 5.2 | Keyboard nav | Tab + shortcuts | P5 |
| 5.3 | Reduced motion | ParticleBackground | P5 |

---

## Reviewer Checklist

- [ ] No `glowOrb`, `cardGlow`, `gridOverlay` anywhere in codebase
- [ ] Every Lucide icon has aria-label on parent button
- [ ] All color combinations pass WCAG AA (4.5:1 body, 3:1 large)
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Lighthouse Accessibility ≥ 90
- [ ] `prefers-reduced-motion` disables all animations
