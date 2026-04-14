# Architecture Review Template

> Use this template when reviewing architecture documents, tech specs, and system design.

## Review Scope

| Field | Value |
|-------|-------|
| Project | `{{project}}` |
| Document | `{{doc_path}}` |
| Reviewer | `{{reviewer}}` |
| Date | `{{date}}` |
| Skill | `architecture` |

---

## 1. Tech Stack Justification

### Stack Components

| Component | Proposed | Sound? | Notes |
|-----------|----------|--------|-------|
| Language/Framework | | ✅/❌ | |
| Database | | ✅/❌ | |
| API Style | | ✅/❌ | |
| Infrastructure | | ✅/❌ | |

### Findings
<!-- Missing justification, over-engineering, tech debt risks -->

---

## 2. API Design

### Endpoint Coverage

| Endpoint | Method | Input | Output | Notes |
|----------|--------|-------|--------|-------|
| | GET/POST/PUT/DELETE | | | |

### API Quality Checklist

| Aspect | Status | Notes |
|--------|--------|-------|
| RESTful conventions | ✅/❌ | |
| Error response format | ✅/❌ | |
| Pagination strategy | ✅/❌ | |
| Auth/authz explicit | ✅/❌ | |
| Rate limiting defined | ✅/❌ | |

### Findings
<!-- Inconsistent naming, missing error codes, unclear versioning -->

---

## 3. Data Model

### Entity Coverage

| Entity | Attributes | Relationships | Notes |
|--------|------------|---------------|-------|
| | | | |

### Schema Quality

| Aspect | Status | Notes |
|--------|--------|-------|
| Primary keys defined | ✅/❌ | |
| Indexes identified | ✅/❌ | |
| Migrations strategy | ✅/❌ | |
| Schema drift risk | ✅/❌ | |

### Findings
<!-- Missing entities, unclear relationships, no migration plan -->

---

## 4. Performance Considerations

| Aspect | Addressed? | Notes |
|--------|------------|-------|
| Query complexity | ✅/❌ | |
| N+1 risks | ✅/❌ | |
| Caching strategy | ✅/❌ | |
| Load estimates | ✅/❌ | |
| Bottleneck identification | ✅/❌ | |

### Findings
<!-- No performance analysis, missing bottlenecks -->

---

## 5. Dependency Analysis

| Dependency | Version | Risk | Notes |
|------------|---------|------|-------|
| | | H/M/L | |

### External Service Risks

| Service | Fallback? | SLA | Notes |
|---------|-----------|-----|-------|
| | ✅/❌ | | |

### Findings
<!-- Circular deps, unversioned deps, no fallback plans -->

---

## Verdict

| Dimension | Score | Notes |
|-----------|-------|-------|
| Tech Stack | /10 | |
| API Design | /10 | |
| Data Model | /10 | |
| Performance | /10 | |
| Dependencies | /10 | |

**Overall: APPROVE / CONDITIONAL / REJECT**

---

## Blockers (if any)

- [ ] Blocker 1

## Suggestions

- [ ] Suggestion 1

---

*Architecture Review | reviewer | {{date}}*
