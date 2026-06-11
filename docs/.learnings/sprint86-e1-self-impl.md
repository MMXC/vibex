# Sprint86-E1 Self-Impl Learnings — 2026-06-11

## Situation
Dev agent (`dev-e1-画布评论标注系统`) ghosted after 20 minutes (`running_agents=null`). No branch, no files produced. Variant W' — backend-only self-impl.

## Pre-Discovery Findings
**Frontend infrastructure ALREADY on main:**
- `commentStore.ts` (S49-E5 + S50-E3 + S69-E4 + S71-E2) — full Zustand store with IndexedDB persistence, event system, reactions, WS broadcasting
- `CommentThread.tsx` — floating comment panel (S69-E4 + S71-E2)
- `NodeCommentBadge.tsx`, `NodeCommentPanel.tsx` — node comment UI
- `MentionInput.tsx` (S68-E2) — @mention input with autocomplete
- `parseMentions.ts` (S51-E5) — @mention parsing utility
- `commentStore.test.ts`, `commentStore.realtime.test.ts` — existing frontend tests

**Missing only backend:**
- D1 `comments` table (no table exists)
- Backend API routes (no routes exist)

## Self-Impl Scope
Backend-only: 6 files (D1 migration + 3 API routes + 2 test files)
12 Jest tests, all passing.

## Key Pattern: Variant W' (Backend-Only)
When pre-discovery reveals frontend infrastructure already exists:
- Skip frontend implementation entirely
- Only implement backend (D1 schema + API routes)
- Tests are backend Jest (not frontend vitest)
- Frontend `commentStore.ts` already handles IndexedDB persistence + WS events

## D1 Pattern
- Next.js App Router backend (NOT pure CF Workers)
- `NextRequest`/`NextResponse` (NOT `Request`/`Response`)
- `params: Promise<{id: string}>` — MUST `await context.params`
- `safeError` from `@/lib/log-sanitizer` (NOT `@/lib/logger/safeError`)
- `generateId()` zero args
- D1 BOOLEAN = `INTEGER DEFAULT 0` (0=false, 1=true)

## Files Created
1. `vibex-backend/migrations/0018_comments.sql` — comments + comment_reactions tables
2. `vibex-backend/src/app/api/canvas/[id]/comments/route.ts` — GET + POST
3. `vibex-backend/src/app/api/canvas/[id]/comments/[commentId]/read/route.ts` — POST mark resolved
4. `vibex-backend/src/app/api/canvas/[id]/comments/[commentId]/reactions/route.ts` — POST add reaction
5. `vibex-backend/src/app/api/canvas/[id]/comments/route.test.ts` — 9 tests
6. `vibex-backend/src/app/api/canvas/[id]/comments/[commentId]/read/route.test.ts` — 3 tests

## Cascade
- Feat commit: 7ff80a655 (epic/s86-e1-canvas-comments → main)
- CHANGELOG commit: 603fbcaf8 (epic/s86-e1-canvas-comments → main)
- Fast-forward: epic synced to main
- Dev → Tester → Reviewer → Reviewer-push cascade: all done
- Next: dev-e2 dispatched

## Lessons
1. Always enumerate `origin/main` before assuming a DoD item is missing
2. S86-E1 DoD listed "frontend + backend" but frontend was fully done in S49-E5 → S71-E2
3. Variant W' backend-only is efficient — skip frontend, only implement the missing layer
