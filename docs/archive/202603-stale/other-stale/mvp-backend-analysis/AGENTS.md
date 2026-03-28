# AGENTS.md: MVP Backend API

**Project**: `mvp-backend-analysis`

---

## Agent Responsibilities

### dev
- **Phase 1**: Verify DDD APIs, fix homepage 500, implement SSE stream, implement clarify/chat
- **Phase 2**: Complete clarification CRUD, SSE event type validation
- **Phase 3**: Implement ActionBar APIs (drafts, history, analyze/*)

### tester
- Run `verify-backend-apis.sh` for each phase
- Validate API responses match expected schemas
- End-to-end test: frontend 6-step flow completes

### reviewer
- Review SSE event format compliance
- Check error handling consistency
- Verify API path conventions followed

---

## Note

This project is primarily **backend implementation**. Frontend API clients are already implemented. Architect's role here is primarily **analysis and planning** — the architecture doc serves as the specification for backend dev.
