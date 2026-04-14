# Reviews Index

> Tracks all reviewer decisions and Coord adoption. Updated after each review cycle.

## Format

| Column | Description |
|--------|-------------|
| project | Project name (matches directory under `agents/`) |
| design | Design review verdict: pass / conditional / reject / - |
| arch | Architecture review verdict: pass / conditional / reject / - |
| security | Security review verdict: pass / conditional / reject / - |
| perf | Performance review verdict: pass / conditional / reject / - |
| coord | Coord final decision: approved / rejected / pending |
| date | Review completion date (YYYY-MM-DD) |
| notes | Any notable context |

## Legend

- **pass** ✅ — All criteria met, approved
- **conditional** ⚠️ — Approved with caveats; blockers noted
- **reject** ❌ — Rejected; specific blockers must be addressed
- **-** — Not reviewed (not triggered)

---

## Review Log

| project | design | arch | security | perf | coord | date | notes |
|---------|--------|------|----------|------|-------|------|-------|
| vibex-ai-prototype-enhance | pass | - | pass | - | approved | 2026-03-03 | Test env issue (ResizeObserver) noted |
| vibex-backend-build-fix | - | - | - | - | - | - | |
| vibex-card-buttons-expand | - | - | - | - | - | - | |
| vibex-changelog-page | - | - | - | - | - | - | |
| vibex-trash-bin | - | - | - | - | - | - | |
| vibex-register-405-fix | - | - | - | - | - | - | |
| vibex-api-url-regression | - | - | - | - | - | - | |
| vibex-interaction-fix | - | - | - | - | - | - | |
| vibex-build-error-fix | - | - | - | - | - | - | |
| vibex-requirements-404-fix | - | - | - | - | - | - | |
| vibex-trash-bin-ui-fix | - | - | - | - | - | - | |

---

## Adoption Statistics

> Updated manually after each review cycle. Run `scripts/adoption-stats.py` to recalculate.

| Metric | Value |
|--------|-------|
| Total reviews | 1 |
| Reviews adopted by Coord | 1 |
| Coord adoption rate | 100% |
| Conditional rate | 0% |
| Reject rate | 0% |

> **Note**: Low count due to recent system deployment. Stats will become meaningful after 10+ reviews.

---

## Adding New Entries

After a review completes:
1. Create the review report: `docs/reviews/review-report-<project>.md`
2. Fill in the verdict for each skill reviewed
3. Append a new row to the table above
4. After Coord decision, update the `coord` column and add notes

---

*INDEX | reviewer agent | Updated: 2026-04-14*
