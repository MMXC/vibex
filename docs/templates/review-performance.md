# Performance Review Template

> Use this template when reviewing performance aspects of proposals, tech specs, or feature docs.

## Review Scope

| Field | Value |
|-------|-------|
| Project | `{{project}}` |
| Document | `{{doc_path}}` |
| Reviewer | `{{reviewer}}` |
| Date | `{{date}}` |
| Skill | `performance` |

---

## 1. Lighthouse / Core Web Vitals

### Targets

| Metric | Target | Proposal Value | Gap |
|--------|--------|-----------------|-----|
| LCP | < 2.5s | | |
| FID / INP | < 100ms | | |
| CLS | < 0.1 | | |
| FCP | < 1.8s | | |
| TTFB | < 800ms | | |

### Findings
<!-- No Lighthouse targets, unreachable targets -->

---

## 2. Bundle Size

### Bundle Analysis

| Bundle | Current | Target | Strategy |
|--------|---------|--------|----------|
| Main JS | | < 200KB | |
| CSS | | < 50KB | |
| Total initial | | < 300KB | |

### Analysis

| Aspect | Status | Notes |
|--------|--------|-------|
| Code splitting defined | ✅/❌ | |
| Lazy loading strategy | ✅/❌ | |
| Tree shaking enabled | ✅/❌ | |
| Dependency audit | ✅/❌ | |

### Findings
<!-- No bundle budget, heavy deps, no code splitting -->

---

## 3. API Latency

### Endpoint SLAs

| Endpoint | Target | Under load? | Notes |
|----------|--------|-------------|-------|
| | < 200ms | ✅/❌ | |

### Latency Risks

| Aspect | Status | Notes |
|--------|--------|-------|
| N+1 queries identified | ✅/❌ | |
| Index strategy defined | ✅/❌ | |
| Caching layer specified | ✅/❌ | |
| Connection pooling | ✅/❌ | |
| CDN / edge strategy | ✅/❌ | |

### Findings
<!-- Missing SLA, no caching plan, N+1 risks -->

---

## 4. Database Queries

### Query Complexity

| Query | Complexity | Optimization | Notes |
|-------|-----------|--------------|-------|
| | O(n²) | ✅/❌ | |

### DB Performance

| Aspect | Status | Notes |
|--------|--------|-------|
| Query plan analysis | ✅/❌ | |
| Index strategy | ✅/❌ | |
| Pagination (cursor vs offset) | ✅/❌ | |
| Read replica strategy | ✅/❌ | |
| Batch operations | ✅/❌ | |

### Findings
<!-- Full table scans, missing indexes, unbounded queries -->

---

## 5. Load & Scale

### Scale Targets

| Metric | Value | Notes |
|--------|-------|-------|
| Concurrent users | | |
| Requests/sec | | |
| Data volume growth | | |

### Scalability

| Aspect | Status | Notes |
|--------|--------|-------|
| Horizontal scaling possible | ✅/❌ | |
| Stateless design | ✅/❌ | |
| Queue/async strategy | ✅/❌ | |
| Failover defined | ✅/❌ | |

### Findings
<!-- Stateful by default, no queue strategy, no failover -->

---

## Verdict

| Dimension | Score | Notes |
|-----------|-------|-------|
| Web Vitals | /10 | |
| Bundle Size | /10 | |
| API Latency | /10 | |
| DB Queries | /10 | |
| Scalability | /10 | |

**Overall: APPROVE / CONDITIONAL / REJECT**

---

## Blockers (if any)

- [ ] Blocker 1

## Suggestions

- [ ] Suggestion 1

---

*Performance Review | reviewer | {{date}}*
