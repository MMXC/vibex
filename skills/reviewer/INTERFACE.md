# Reviewer Skills Interface

> Standard interface for all reviewer skills. Ensures consistent output across design, architecture, security, and performance reviews.

## Skill Registry

| Skill | Agent Skill | Status | Output Conforms |
|-------|------------|--------|----------------|
| design | `agent-design-lens-reviewer` | Available | ✅ (dimensional rating) |
| architecture | `agent-architecture-strategist` | Available | ⚠️ (custom format) |
| security | `agent-security-reviewer` | Available | ⚠️ (custom format) |
| performance | `agent-performance-reviewer` | Available | ⚠️ (custom format) |

## Standard ReviewerSkill Interface

All reviewer skills MUST accept `ReviewInput` and return `ReviewOutput`.

### ReviewInput

```typescript
interface ReviewInput {
  project: string;          // Project name
  docPath: string;          // Path to document to review
  docContent: string;       // Full document content
  reviewType: string;       // 'design' | 'architecture' | 'security' | 'performance'
  templatePath: string;      // Path to review template (e.g., docs/templates/review-design.md)
  options?: {
    focusAreas?: string[];  // Optional: override default focus areas
    depth?: 'quick' | 'standard' | 'deep';
  };
}
```

### ReviewOutput

```typescript
interface ReviewOutput {
  verdict: 'pass' | 'conditional' | 'reject';  // Required
  findings: Finding[];       // All identified issues
  blockers: string[];         // Critical issues that must be resolved (verdict != pass)
  suggestions: string[];     // Non-blocking improvements
  confidence: number;        // 0.0 – 1.0, reviewer's confidence in the verdict
  metadata: {
    reviewer: string;        // Agent/skill name
    reviewType: string;
    date: string;            // ISO date
    duration?: number;        // Seconds spent on review
    templateUsed: string;    // Which review template was used
  };
}

interface Finding {
  dimension: string;         // e.g., 'auth', 'data-model', 'interaction-states'
  score: number;             // 0–10
  description: string;      // What was found
  location?: string;         // File/section reference
  severity: 'critical' | 'major' | 'minor' | 'info';
}
```

### Verdict Rules

| Verdict | Condition |
|---------|-----------|
| `pass` | All dimensions ≥ 7/10, no blockers |
| `conditional` | Any dimension 4–6/10, or SLA timeout (auto-proceed) |
| `reject` | Any dimension < 4/10, or critical blocker identified |

## Mapping Existing Skills

### agent-design-lens-reviewer ✅

Already produces dimensional ratings (0–10). Output can be mapped:
- `findings[]` ← dimensional ratings
- `blockers` ← dimensions scored < 4/10
- `suggestions` ← dimensions scored 4–6/10
- `confidence` ← implicit in consistency of rating

**Action**: Add `ReviewOutput` wrapper in the `document-review` skill that invokes this agent.

### agent-architecture-strategist ⚠️

Currently outputs prose + PR comments. Needs:
- [ ] Add structured `ReviewOutput` wrapper
- [ ] Map existing output to `findings[]` with `score` field
- [ ] Add `verdict` field based on severity of issues

### agent-security-reviewer ⚠️

Currently outputs security findings without scoring. Needs:
- [ ] Add 0–10 dimensional scoring
- [ ] Map severity to `blockers[]` / `suggestions[]`
- [ ] Add `verdict` field

### agent-performance-reviewer ⚠️

Currently focuses on code diffs. For proposal reviews (Unit 1 templates):
- [ ] Add proposal review mode that uses `review-performance.md`
- [ ] Add 0–10 scoring for performance dimensions
- [ ] Add `verdict` and `confidence` fields

## Integration: Trigger → Dispatch → Review → Track

```
1. Trigger  : scripts/review-trigger.js <doc-path>
             → ["architecture", "design"]

2. Dispatch : reviewer claims task via team-tasks
             → task_manager.py claim <project> review-<skill>

3. Review   : reviewer uses docs/templates/review-<skill>.md
             → outputs ReviewOutput

4. Track    : append to docs/reviews/INDEX.md
             → adoption tracked over time
```

## Next Steps

- [ ] `document-review` skill to invoke trigger and dispatch reviews
- [ ] Each compound-engineering reviewer skill to add `ReviewOutput` wrapper
- [ ] SLA timer integration with review task lifecycle

---

*Reviewer Skills Interface | reviewer agent | 2026-04-14*
