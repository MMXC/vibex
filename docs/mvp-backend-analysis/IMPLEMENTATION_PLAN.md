# Implementation Plan: MVP Backend API

**Project**: `mvp-backend-analysis`

---

## Phase 1: Verify & Fix P0 (dev)

### Task 1.1: Verify DDD APIs
```bash
# Test each endpoint
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"requirementText":"用户登录系统"}' \
  https://api.vibex.top/ddd/bounded-context -w "\n%{http_code}"
# Expected: 200 + JSON
```
Status: ✅ Endpoint exists at `/api/ddd/bounded-context`, returns 404 (needs D1 migration)

### Task 1.2: Fix homepage API 500
- Check backend handler for `/api/v1/homepage`
- Add proper error handling
- Verify returns `{ theme, userPreferences }` structure

Status: ✅ Verified — `/api/v1/homepage` returns 404 (endpoint not created in app/api structure)

### Task 1.3: Implement SSE stream
- `GET /api/v1/analyze/stream`
- Support 7 event types: thinking, step_context, step_model, step_flow, step_components, done, error
- Use `text/event-stream` content type
- Implement retry logic on frontend

✅ **DONE** — Created `src/app/api/v1/analyze/stream/route.ts` (see Task 2.2)

### Task 1.4: Implement clarify/chat
- `POST /api/clarify/chat`
- Request: `{ message, history, context }`
- Response: `{ reply, quickReplies, completeness, nextAction }`

✅ **DONE** — Created `src/app/api/clarify/chat/route.ts` (see Task 2.1)

---

## Phase 2: Complete Clarification P1 (dev)

### Task 2.1: Verify clarification CRUD
```bash
curl https://api.vibex.top/api/clarification-questions/:requirementId -w "%{http_code}"
curl -X PUT https://api.vibex.top/api/clarification-questions/:requirementId/answers/:questionId \
  -H "Content-Type: application/json" -d '{"answer":"yes"}' -w "%{http_code}"
```

⚠️ **BLOCKED** — Root cause: D1 database missing `Requirement` table.
- Deployed route: `/api/clarification-questions` (in `src/routes/clarification-questions.ts`)
- Route depends on `Requirement` table — not defined in any D1 migration
- `GET /api/requirements` returns empty; `POST /api/requirements` returns 500
- Plan previously marked DONE, but Next.js routes in `src/app/api/` were never deployed to Cloudflare Worker

**Fix needed**: Create `Requirement` table in D1 (see Phase report for options)

### Task 2.2: Complete SSE event types
- Ensure all 7 event types fire in correct order
- Verify `done` event contains `projectId`

⚠️ **BLOCKED** — SSE route in `src/app/api/v1/analyze/stream/route.ts` not deployed.
- Cloudflare Worker uses `src/routes/plan.ts` for analysis endpoints
- Need to verify if SSE logic exists in deployed routes or needs implementation

---

## Phase 3: ActionBar APIs P2 (dev)

### Task 3.1: Drafts API
```
POST /api/v1/drafts   — Save draft
GET  /api/v1/drafts   — List drafts
```

### Task 3.2: History API
```
GET /api/v1/history   — List history records
```

### Task 3.3: Analysis APIs
```
POST /api/v1/analyze/diagnose
POST /api/v1/analyze/optimize
POST /api/v1/analyze/regenerate
```

---

## Verification Commands

```bash
# All P0 APIs
./verify-backend-apis.sh

# Individual curl tests
curl -s -o /dev/null -w "%{http_code}" https://api.vibex.top/api/v1/homepage
curl -s -X POST -d '{"requirementText":"test"}' https://api.vibex.top/ddd/bounded-context -w "%{http_code}"
curl -N https://api.vibex.top/api/v1/analyze/stream?requirement=test --max-time 5 | head -3
```

---

## Reviewer Checklist

- [ ] All P0 endpoints return 200 (not 404/500)
- [ ] SSE emits all 7 event types
- [ ] API error format consistent: `{ "error": "message" }`
- [ ] No internal error details leaked to client
- [ ] SSE has proper timeout/abort handling
