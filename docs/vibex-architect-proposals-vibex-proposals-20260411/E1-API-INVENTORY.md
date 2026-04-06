# E1 API v1 Inventory

**Generated**: 2026-04-06
**Status**: E1 analysis complete

## Finding: v0 Routes Do Not Exist

v0 routes (`src/app/api/v0/`) do not exist in this codebase. The IMPLEMENTATION_PLAN's E1-S1 (add v0 Deprecation headers) is **not applicable** — there are no v0 routes to deprecate.

## v1 API Surface (30 routes)

### Next.js App Router (`/api/v1/*`)

| Route | Methods | Auth |
|-------|---------|------|
| `/api/v1/agents` | GET, POST | ✅ |
| `/api/v1/agents/[id]` | GET, PUT, DELETE | ✅ |
| `/api/v1/ai-ui-generation` | POST | ✅ |
| `/api/v1/analyze/stream` | GET (SSE) | ✅ |
| `/api/v1/auth/login` | POST | ❌ |
| `/api/v1/auth/logout` | POST | ❌ |
| `/api/v1/auth/register` | POST | ❌ |
| `/api/v1/canvas/export` | POST | ✅ |
| `/api/v1/canvas/generate` | POST | ✅ |
| `/api/v1/canvas/generate-components` | POST | ✅ |
| `/api/v1/canvas/generate-contexts` | POST | ✅ |
| `/api/v1/canvas/generate-flows` | POST | ✅ |
| `/api/v1/canvas/health` | GET | ❌ |
| `/api/v1/canvas/project` | GET | ✅ |
| `/api/v1/canvas/status` | GET | ✅ |
| `/api/v1/canvas/stream` | GET (SSE) | ✅ |
| `/api/v1/chat` | POST | ✅ |
| `/api/v1/domain-model/[projectId]` | GET | ✅ |
| `/api/v1/flows/[flowId]` | GET | ✅ |
| `/api/v1/messages` | GET, POST | ✅ |
| `/api/v1/messages/[messageId]` | GET, PUT, DELETE | ✅ |
| `/api/v1/pages` | GET, POST | ✅ |
| `/api/v1/pages/[id]` | GET, PUT, DELETE | ✅ |
| `/api/v1/projects` | GET, POST | ✅ |
| `/api/v1/projects/[id]` | GET, PUT, DELETE | ✅ |
| `/api/v1/prototype-snapshots` | GET, POST | ✅ |
| `/api/v1/prototype-snapshots/[id]` | GET, DELETE | ✅ |
| `/api/v1/templates` | GET | ❌ |
| `/api/v1/templates/[id]` | GET | ❌ |
| `/api/v1/users/[userId]` | GET | ✅ |

### Hono Gateway (`/v1/*`)

| Route | Description |
|-------|-------------|
| `/v1/gateway` | Main gateway with auth/rate-limit/logger/errorHandler middleware |
| `/v1/flows` | Flows CRUD via Hono |

## Recommendations

1. **No v0 deprecation needed** — v0 doesn't exist
2. **v1 routes fully covered** — 30 routes, all organized under `/api/v1/`
3. **E1-S2 done** — v1 route inventory above serves as coverage verification
4. **Hono gateway** already has: authMiddleware, rateLimit, logger, errorHandler, notFoundHandler

