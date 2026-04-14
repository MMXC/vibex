# Design Review Template

> Use this template when reviewing design documents (PRD, feature specs, story specs).

## Review Scope

| Field | Value |
|-------|-------|
| Project | `{{project}}` |
| Document | `{{doc_path}}` |
| Reviewer | `{{reviewer}}` |
| Date | `{{date}}` |
| Skill | `design` |

---

## 1. PRD Completeness

Check that the document contains all required PRD sections.

### Sections Checklist

| Section | Status | Notes |
|---------|--------|-------|
| Background / Problem Statement | ✅/❌/N/A | |
| Goals & Non-Goals | ✅/❌/N/A | |
| User Stories / Use Cases | ✅/❌/N/A | |
| Acceptance Criteria | ✅/❌/N/A | |
| Constraints | ✅/❌/N/A | |
| Success Metrics | ✅/❌/N/A | |
| Out of Scope | ✅/❌/N/A | |

### Findings
<!-- Document missing sections or vague definitions -->

---

## 2. Feature List

### Complete Feature List

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| 1 | | P0/P1/P2 | |

### Findings
<!-- Unclear priorities, missing features, or unclear scope -->

---

## 3. Acceptance Criteria Quality

### Criteria Analysis

| Criterion | Specific? | Testable? | Notes |
|-----------|-----------|-----------|-------|
| | ✅/❌ | ✅/❌ | |

### Findings
<!-- Vague ACs ("user-friendly", "works well"), missing edge cases -->

---

## 4. Interaction State Coverage

| State | Covered? | Notes |
|-------|----------|-------|
| Default / Empty | ✅/❌ | |
| Loading | ✅/❌ | |
| Error | ✅/❌ | |
| Success | ✅/❌ | |
| Partial / Intermediate | ✅/❌ | |
| Edge case | ✅/❌ | |

### Findings
<!-- Missing states that will cause implementation to guess -->

---

## 5. Unresolved Design Decisions

| # | Decision | Blocked? | Owner |
|---|----------|----------|-------|
| 1 | | P0/P1 | |

### Findings
<!-- TBDs, vague descriptions, "how should this work?" moments -->

---

## Verdict

| Dimension | Score | Notes |
|-----------|-------|-------|
| PRD Completeness | /10 | |
| Feature Clarity | /10 | |
| AC Quality | /10 | |
| Interaction States | /10 | |
| Design Decisions | /10 | |

**Overall: APPROVE / CONDITIONAL / REJECT**

---

## Blockers (if any)

- [ ] Blocker 1
- [ ] Blocker 2

## Suggestions

- [ ] Suggestion 1
- [ ] Suggestion 2

---

*Design Review | reviewer | {{date}}*
