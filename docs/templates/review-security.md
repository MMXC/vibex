# Security Review Template

> Use this template when reviewing security aspects of proposals, tech specs, or feature docs.

## Review Scope

| Field | Value |
|-------|-------|
| Project | `{{project}}` |
| Document | `{{doc_path}}` |
| Reviewer | `{{reviewer}}` |
| Date | `{{date}}` |
| Skill | `security` |

---

## 1. Authentication & Authorization

### Auth Matrix

| Endpoint / Action | Auth Required | Role Required | Notes |
|-------------------|---------------|----------------|-------|
| | ✅/❌ | | |

### Auth Quality

| Aspect | Status | Notes |
|--------|--------|-------|
| Auth method explicit (JWT/Session/OAuth) | ✅/❌ | |
| Token refresh strategy | ✅/❌ | |
| Session expiry defined | ✅/❌ | |
| Role/permission model defined | ✅/❌ | |
| IDOR risks assessed | ✅/❌ | |

### Findings
<!-- Missing auth, unclear roles, IDOR vectors -->

---

## 2. Data Security

### Data Classification

| Data | Classification | At Rest | In Transit | Notes |
|------|---------------|---------|------------|-------|
| | PII/Secret/Public | ✅/❌ | ✅/❌ | |

### Data Handling

| Aspect | Status | Notes |
|--------|--------|-------|
| Encryption at rest | ✅/❌ | |
| Encryption in transit (TLS) | ✅/❌ | |
| Secret management (env vars, vault) | ✅/❌ | |
| PII handling (masking, logging) | ✅/❌ | |
| Data retention defined | ✅/❌ | |

### Findings
<!-- Plaintext secrets, PII in logs, no encryption -->

---

## 3. Input Validation

### Validation Coverage

| Input | Validation | Sanitization | Notes |
|-------|-----------|---------------|-------|
| | ✅/❌ | ✅/❌ | |

### Validation Patterns

| Aspect | Status | Notes |
|--------|--------|-------|
| SQL injection prevention | ✅/❌ | |
| XSS prevention | ✅/❌ | |
| CSRF protection | ✅/❌ | |
| File upload validation | ✅/❌ | |
| Rate limiting | ✅/❌ | |

### Findings
<!-- Raw SQL, unsanitized HTML, no rate limits -->

---

## 4. Dependency Security

### Vulnerable Dependencies

| Dependency | Version | Known CVE | Action Needed |
|------------|---------|----------|---------------|
| | | ✅/❌ | |

### Supply Chain Risks

| Aspect | Status | Notes |
|--------|--------|-------|
| Lock file committed | ✅/❌ | |
| Third-party code audited | ✅/❌ | |
| Minimal permissions (CI/CD) | ✅/❌ | |

### Findings
<!-- Outdated deps, no lock file, excessive CI permissions -->

---

## Verdict

| Dimension | Score | Notes |
|-----------|-------|-------|
| Auth/Authz | /10 | |
| Data Security | /10 | |
| Input Validation | /10 | |
| Dependencies | /10 | |

**Overall: APPROVE / CONDITIONAL / REJECT**

---

## Blockers (if any)

- [ ] Blocker 1 (Critical: e.g., "Plaintext password storage")

## Suggestions

- [ ] Suggestion 1

---

*Security Review | reviewer | {{date}}*
