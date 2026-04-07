# Implementation Plan — Vibex Dev Proposals (2026-04-10)

**Project**: vibex-dev-proposals-vibex-proposals-20260410  
**Author**: Architect Agent  
**Date**: 2026-04-10  
**Status**: Ready for Review

---

## 1. Sprint Overview

| Sprint | Duration | Focus | Stories | Est. Effort |
|--------|----------|-------|---------|-------------|
| Sprint 0 (Pre-work) | 0.5h | Infrastructure & scaffolding | D-P2-6 CI gate, lib scaffolding | 0.5h |
| Sprint 1 | 3.5h | Core Bug Fixes (PRD ST-01~04) | ST-01, ST-02, ST-03, ST-04 | 3.5h |
| Sprint 2 | 2h | Auth & Input Validation | D-P0-1, D-P0-3 | 2h |
| Sprint 3 | 2h | Error Handling & Logging | D-P0-2, ST-05, ST-06, D-P1-2 | 2h |
| Sprint 4 | 3h | Frontend Quality (P1) | D-P1-1, D-P1-4, D-P1-5, D-P1-6 | 3h |
| Sprint 5 | 2h | Frontend Architecture (P2) | D-P1-3, D-P2-1, D-P2-3 | 2h |
| Sprint 6 | 1.5h | Backend Quality & CI | D-P2-2, D-P2-4, D-P2-5, D-P2-6, ST-07, ST-08, ST-09 | 1.5h |
| Sprint 7 | 1h | Documentation & Polish | ST-10, D-P3-1, D-P3-2 | 1h |

**Total Estimated**: ~15.5h (≈ 4 developer days)

---

## 2. Sprint 0: Infrastructure & Scaffolding (0.5h)

**Goal**: Set up shared infrastructure that all other sprints depend on.

### Task 0.1: Create shared logger library

**Files**: `vibex-backend/src/lib/logger.ts`, `vibex-fronted/src/lib/logger.ts`

```typescript
// vibex-backend/src/lib/logger.ts
// - devDebug / logger with 4 levels (debug/info/warn/error)
// - sanitizeLogMeta() function that redacts: entityId, token, usage, sk-, password, secret, key
// - LOG_LEVEL env variable support
// - Console output colored with [LEVEL] prefix

// vibex-fronted/src/lib/logger.ts  
// - Same interface, console.log/warn/error based
// - NEXT_PUBLIC_LOG_LEVEL support
// - Should strip console in production build
```

**Acceptance**: `pnpm --filter vibex-backend exec vitest run __tests__/lib/logger.test.ts` passes

### Task 0.2: Create auth middleware

**Files**: `vibex-backend/src/lib/apiAuth.ts`

```typescript
// - withAuth(handler) HOC
// - getAuthUser(request, jwtSecret) JWT verification
// - AuthUser interface with userId, email, role
// - AuthContext interface with { auth, env }
// - Exported public routes list for reference
```

**Acceptance**: Unauthenticated requests return 401, authenticated requests pass `auth` to handler

### Task 0.3: Create unified DB client

**Files**: `vibex-backend/src/lib/db.ts` (extend existing)

```typescript
// - Extend existing getDBClient() with isWorkers flag
// - createD1Client() wrapper for D1 → Prisma-compatible interface
// - DBClient interface: { prepare(sql), query<T>(sql, params?) }
// - PrismaPoolManager already exists — ensure it's properly exported
```

**Acceptance**: `getDBClient(env, true)` returns D1 client, `getDBClient(env, false)` returns Prisma client

### Task 0.4: Add backend CI test gate

**Files**: `.github/workflows/test.yml`

```yaml
# Add backend-test job alongside existing frontend-test job
- name: Backend Tests
  run: pnpm --filter vibex-backend run test:ci
```

**Acceptance**: GitHub Actions runs backend tests on every PR

### Task 0.5: Create validation schemas

**Files**: `vibex-backend/src/schemas/canvas.ts` (create)

```typescript
// - generateCanvasSchema (projectId UUID, pageIds non-empty array, options optional)
// - generateContextsSchema (requirementText max 5000 chars, projectId optional UUID)
// - chatMessageSchema (message 1-2000 chars, history optional array)
// - Export all from index.ts
```

**Acceptance**: Zod schemas reject invalid input with descriptive error messages

---

## 3. Sprint 1: Core Bug Fixes (3.5h)

### Task 1.1: ST-01 — Fix streaming response `this` binding

**File**: `vibex-backend/src/services/llm.ts`

```typescript
// In createStreamingResponse():
// BEFORE (broken):
async createStreamingResponse(options, onChunk?) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of this.streamChat(options)) { // this === undefined!
        controller.enqueue(new TextEncoder().encode(...));
        onChunk?.(chunk);
      }
      controller.close();
    },
  });
}

// AFTER (fixed):
async createStreamingResponse(options, onChunk?) {
  const thisLLMService = this; // ← Bind before ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of thisLLMService.streamChat(options)) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
          onChunk?.(chunk);
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

**Test**: Write `__tests__/services/llm.test.ts` with 2 test cases  
**Acceptance**: Stream starts without ReferenceError, produces chunks

### Task 1.2: ST-02 — Unified Workers DB client (8+ routes)

**Files**: All API route files in `vibex-backend/src/app/api/v1/*`

**Search & replace pattern**:
```bash
# Find all direct PrismaClient instantiations
grep -r "new PrismaClient()" vibex-backend/src/app/api/
# Replace each with:
# import { getDBClient } from '@/lib/db';
# const prisma = getDBClient(env, isWorkers);
```

**Affected routes** (at least 8):
- `app/api/v1/chat/route.ts`
- `app/api/v1/canvas/generate/route.ts`
- `app/api/v1/canvas/generate-contexts/route.ts`
- `app/api/v1/canvas/generate-components/route.ts`
- `app/api/v1/canvas/generate-flows/route.ts`
- `app/api/v1/canvas/stream/route.ts`
- `app/api/v1/canvas/status/route.ts`
- `app/api/v1/canvas/export/route.ts`
- `app/api/v1/canvas/project/route.ts`
- `app/api/v1/ai-ui-generation/route.ts`
- `app/api/v1/domain-model/[projectId]/route.ts`
- `app/api/v1/prototype-snapshots/route.ts`
- `app/api/v1/prototype-snapshots/[id]/route.ts`
- `app/api/v1/agents/route.ts`
- `app/api/v1/agents/[id]/route.ts`
- `app/api/v1/pages/route.ts`
- `app/api/v1/pages/[id]/route.ts`

**Acceptance**: `wrangler deploy --dry-run` shows no PrismaClient bundle warnings, `pnpm --filter vibex-backend run test` passes

### Task 1.3: ST-03 — Fix `getRelationsForEntities` multi-ID query

**File**: `vibex-backend/src/services/requirement-analyzer.ts`

```typescript
// BEFORE (broken):
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  // Only handles single entityId
  const { results } = await listEntityRelations(this.env, {
    whereClause: 'sourceEntityId = ? OR targetEntityId = ?',
    params: [entityIds[0], entityIds[0]],
  });
  return results as EntityRelation[];
}

// AFTER (fixed):
private async getRelationsForEntities(entityIds: string[]): Promise<EntityRelation[]> {
  if (entityIds.length === 0) return [];
  const placeholders = entityIds.map(() => '?').join(',');
  return listEntityRelations(this.env, {
    whereClause: `sourceEntityId IN (${placeholders}) OR targetEntityId IN (${placeholders})`,
    params: entityIds,
  });
}
```

**Test**: `__tests__/services/requirement-analyzer.test.ts` — create 3 entities with relations, verify all returned  
**Acceptance**: 3 entity IDs → 2+ relations returned (all involving at least one of the input entities)

### Task 1.4: ST-04 — Replace in-memory Map with D1 KV cache

**File**: `vibex-backend/src/services/requirement-analyzer.ts`

```typescript
// Replace private cache = new Map<string, CachedResult>();

private async getCache(key: string): Promise<CachedResult | null> {
  const { results } = await this.env.CACHE_KV.prepare(
    'SELECT value FROM cache WHERE key = ? AND expires_at > ?'
  ).bind(key, Date.now()).all();
  return results[0] ? JSON.parse(results[0].value) : null;
}

private async setCache(key: string, value: CachedResult): Promise<void> {
  const ttl = parseInt(this.env.CACHE_TTL_SECONDS ?? '3600');
  const expiresAt = Date.now() + ttl * 1000;
  await this.env.CACHE_KV.prepare(
    'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)'
  ).bind(key, JSON.stringify(value), expiresAt).run();
}

// Note: Ensure CACHE_KV binding in wrangler.toml / wrangler.json
```

**Migration**: Add to `schema.prisma` or create D1 migration:
```sql
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
```

**Test**: Cold start simulation (new service instance) → cache miss  
**Acceptance**: After cold start, `getCache('reqA')` returns null (isolated from previous warm instance)

---

## 4. Sprint 2: Auth & Input Validation (2h)

### Task 2.1: D-P0-1 — Add auth to all unprotected routes

**Files**: All 16+ route files from Task 1.2

**Pattern for each route**:
```typescript
// BEFORE:
export async function POST(request: NextRequest, { env }: { env: CloudflareEnv }) {
  // No auth check — anyone can call
}

// AFTER:
export const POST = withAuth(async (request: NextRequest, { auth, env }: AuthContext) => {
  // auth.userId, auth.email available
});
```

**Public routes (DO NOT add auth)**:
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/health`

**Acceptance**: `curl -X POST /api/v1/chat` without token → 401, with valid token → proceeds

### Task 2.2: D-P0-3 — Add input validation to canvas routes

**Files**: `app/api/v1/canvas/generate/route.ts`, `generate-contexts/route.ts`, `generate-components/route.ts`, `generate-flows/route.ts`

```typescript
// Add to each route:
import { generateCanvasSchema, generateContextsSchema } from '@/schemas/canvas';

export const POST = withAuth(async (req, { auth, env }) => {
  try {
    const body = await req.json();
    // Validate before processing
    const data = generateCanvasSchema.parse(body); // throws ZodError if invalid
    // ... proceed with data.projectId, data.pageIds
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 });
    }
    throw err; // Re-throw non-validation errors
  }
});
```

**Acceptance**: `curl -X POST /api/v1/canvas/generate -d '{"projectId": "not-a-uuid"}'` → 400 with validation errors

---

## 5. Sprint 3: Error Handling & Logging (2h)

### Task 5.1: D-P0-2 + ST-05 — Replace empty catch blocks

**Files** (priority order):
1. `app/api/v1/chat/route.ts` — SSE stream JSON parse errors
2. `app/api/v1/canvas/snapshots.ts` — 6+ empty catches
3. `app/api/v1/ai-ui-generation/route.ts` — empty catch
4. `app/api/v1/canvas/export/route.ts` — empty catch
5. `routes/v1/canvas/snapshots.ts` — empty catches

**Pattern**:
```typescript
// BEFORE:
} catch { }

// AFTER:
} catch (err) {
  logger.error('chat_stream_parse_error', { error: err, conversationId: id });
  // Either continue gracefully or return error
  return NextResponse.json({ error: 'Stream parse failed' }, { status: 500 });
}
```

**Acceptance**: No empty `catch {}` blocks remaining in source files, all catch blocks call `logger.error()`

### Task 5.2: D-P1-2 — Frontend error handling

**Files**: `StreamingMessage.tsx`, `RecentProjects.tsx`, `OAuthConnectButton.tsx`, `ConflictDialog/index.tsx`, `CanvasPage.tsx`

```typescript
// BEFORE:
try { /* ... */ } catch { }

// AFTER:
try { /* ... */ } catch (err) {
  console.error('ComponentName: action failed', err); // Use logger in production
  toast.error('Failed to load projects. Please try again.');
}
```

**Acceptance**: User sees toast notification on error, console has error logged

### Task 5.3: ST-06 — Enable PrismaPoolManager

**File**: `vibex-backend/src/lib/db.ts` (ensure usage in routes)

```typescript
// In routes that do heavy DB operations:
import { PrismaPoolManager } from '@/lib/db';

const pool = new PrismaPoolManager({ maxConnections: 10 });
const prisma = pool.acquire();
// ... use prisma ...
pool.release(prisma);

// Or use the simplified API:
const prisma = getPrismaFromPool();
try {
  // ... operations ...
} finally {
  returnPrismaToPool(prisma);
}
```

**Test**: Write test for pool reuse (same connection returned after release)  
**Acceptance**: Pool connection reuse rate ≥ 80% under load

### Task 5.4: Add ESLint rule for no-empty-catch

**File**: `.eslintrc.js` (backend)

```javascript
{
  rules: {
    'no-empty': ['error', { allowEmptyCatch: false }],
    '@typescript-eslint/no-implicit-any-catch': 'error',
  }
}
```

**Acceptance**: `pnpm --filter vibex-backend run lint` fails if new empty catch blocks are added

---

## 6. Sprint 4: Frontend Quality — P1 (3h)

### Task 6.1: D-P1-1 — Remove `as any` from component source

**Files**:
- `components/visualization/CardTreeNode/CardTreeNode.tsx`
- `components/canvas/edges/RelationshipEdge.tsx`
- `components/ui/FlowNodes.tsx`
- `components/page-tree-diagram/nodes/PageNode.tsx`

**Pattern**:
```typescript
// Define proper interfaces extending @xyflow/react types
import type { NodeProps, EdgeProps } from '@xyflow/react';

interface CardTreeNodeData { label: string; icon?: string; status?: 'active' | 'inactive'; }
type CardTreeNodeProps = NodeProps<CardTreeNodeData>;

const CardTreeNode = ({ data, selected, id }: CardTreeNodeProps) => {
  return <div className={data.status}>{data.label}</div>;
};
```

**Test**: Write unit tests for each component  
**Acceptance**: `pnpm --filter vibex-fronted run typecheck` passes, no `as any` in source files

### Task 6.2: D-P1-4 — XSS sanitization for MermaidRenderer

**Files** (4 instances):
- `components/visualization/MermaidRenderer/MermaidRenderer.tsx`
- `components/preview/MermaidRenderer/MermaidRenderer.tsx`
- `components/ui/MermaidPreview.tsx`
- `components/mermaid/MermaidRenderer.tsx`

**Pattern**:
```typescript
import DOMPurify from 'dompurify';

function renderMermaid(code: string): string {
  // Render to SVG
  const { svg } = mermaid.render(`mermaid-${id}`, code);
  // Sanitize before rendering
  const clean = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
  return clean;
}
```

**Test**: `__tests__/MermaidRenderer.test.tsx` — inject `<script>alert(1)</script>` in mermaid code, verify no script executes  
**Acceptance**: Script tags stripped from rendered output

### Task 6.3: D-P1-5 — Fix ReactFlow hook usage

**Files**:
- `CardTreeNode.tsx` — Remove `useReactFlow()` call (it's a Node, not a provider context holder)
- `DomainRelationGraph.tsx` — Remove nested `ReactFlowProvider` wrapper
- `FlowEditor.tsx` — Remove nested `ReactFlowProvider` wrapper

**Pattern for Node components**:
```typescript
// BEFORE: useReactFlow() inside Node component — WRONG
const { setNodes } = useReactFlow(); // May be undefined in Node context

// AFTER: Use props passed to Node
const CardTreeNode = ({ data, id, selected }: CardTreeNodeProps) => {
  // Operate on data via props, not global ReactFlow instance
  // If need to update parent: use a callback prop or store
};
```

**Pattern for parent components**:
```typescript
// DomainRelationGraph.tsx, FlowEditor.tsx:
// Remove ReactFlowProvider wrapper — page-level already provides it
// OR ensure single ReactFlowProvider at page level (design/page.tsx)
```

**Acceptance**: ReactFlow renders correctly without "Cannot find ReactFlow context" errors

### Task 6.4: D-P1-6 — Replace console.log with logger

**Files**: All stores and homepage components with console.log

```typescript
// Replace all console.log / console.warn with:
import { logger } from '@/lib/logger';
logger.debug('store action', { action: 'updateProject', projectId });
```

**Build-time strip** (in `next.config.js` / production):
```javascript
config.optimization.minimizer[0] = new TerserPlugin({
  terserOptions: { compress: { drop_console: process.env.NODE_ENV === 'production' } },
});
```

**Acceptance**: Zero `console.log` in production bundle (verified via `grep -r "console.log" dist/`)

---

## 7. Sprint 5: Frontend Architecture — P2 (2h)

### Task 7.1: D-P1-3 — Split CanvasPage.tsx (981 lines → 5 components)

**File**: `components/canvas/CanvasPage.tsx`

**Step 1**: Identify logical sections in the 981-line file:
- Lines ~1-100: Imports + types
- Lines ~100-250: State definitions (CanvasPage state)
- Lines ~250-400: Toolbar + Header section
- Lines ~400-550: LeftDrawer / TreePanel section
- Lines ~550-700: Main canvas / PreviewPanel section
- Lines ~700-800: QueuePanel section
- Lines ~800-900: Modals (PreviewModal, ShortcutsModal)
- Lines ~900-981: Lifecycle methods (useEffect hooks)

**Step 2**: Create sub-components:
```
components/canvas/
  CanvasPage.tsx         # Orchestrator, ~150 lines (state coordination)
  CanvasHeader.tsx       # ~100 lines (Toolbar + TabBar)
  CanvasTreePanel.tsx    # ~150 lines (LeftDrawer tree)
  CanvasPreviewPanel.tsx # ~150 lines (preview area)
  CanvasQueuePanel.tsx   # ~100 lines (queue)
  CanvasShortcuts.tsx   # ~50 lines (shortcut help)
```

**Step 3**: Extract shared state to context:
```typescript
// contexts/CanvasContext.tsx
interface CanvasContextValue {
  projectId: string;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  // ... shared state
}
```

**Acceptance**: All existing functionality works, each sub-component is independently testable

### Task 7.2: D-P2-1 — Merge Zustand stores

**Files**: `stores/designStore.ts` + `stores/simplifiedFlowStore.ts`

**Analysis** (before merging):
1. Read both files completely
2. Identify overlapping state keys and actions
3. Identify unique responsibilities

**Merge strategy**:
```typescript
// New: stores/flowDesignStore.ts (replaces both)
// Keep unique keys from each, deduplicate overlaps
// Use Zustand slices pattern for organization:
export const useFlowDesignStore = create<FlowDesignState>()(
  (...a) => ({
    ...createDesignSlice(...a),    // From designStore
    ...createFlowSlice(...a),      // From simplifiedFlowStore
  })
);
```

**Migration**: Update all imports from `designStore` and `simplifiedFlowStore`  
**Acceptance**: All CanvasPage sub-components work with merged store, no breaking changes

### Task 7.3: D-P2-3 — Remove nested ReactFlowProvider

**Files**: `DomainRelationGraph.tsx`, `FlowEditor.tsx`, `CardTreeRenderer.tsx`

```typescript
// Remove ReactFlowProvider from these components
// Ensure page-level (design/page.tsx) wraps with single ReactFlowProvider
// If components are used outside design page, add optional ReactFlowProvider wrapper:
const ReactFlowProvider = lazy(() => import('@xyflow/react').then(m => ({ default: m.ReactFlowProvider }));
```

**Acceptance**: ReactFlow context is consistent across all pages

---

## 8. Sprint 6: Backend Quality & CI (1.5h)

### Task 8.1: D-P2-2 — Fix chat history not passed to LLM

**File**: `app/api/v1/chat/route.ts`

```typescript
// Add after body parsing:
const historyMessages: ChatMessage[] = (history || []).map(h => ({
  role: h.role as 'user' | 'assistant',
  content: h.content,
}));
const messages: ChatMessage[] = [...historyMessages, { role: 'user', content: message }];

// Pass messages (not just current message) to LLM:
const response = await llmService.chat(messages);
```

**Test**: `__tests__/lib/api/chat.test.ts` — send 3-message history, verify LLM receives all 4 messages  
**Acceptance**: Multi-turn conversations maintain context

### Task 8.2: D-P2-4 + D-P3-2 — Fix backend `as any`

**File**: `lib/errorHandler.ts`

```typescript
// Change: details?: any → details?: unknown
// Change: return c.text(JSON.stringify(response), statusCode as any)
//     → return c.text(JSON.stringify(response), { status: statusCode as number })
```

**Test**: Verify error responses still have correct HTTP status codes  
**Acceptance**: `pnpm --filter vibex-backend run typecheck` passes

### Task 8.3: D-P2-5 — Remove eslint-disable hooks rule

**File**: `stores/ddd/init.ts`

```typescript
// Find and remove:
// eslint-disable-next-line react-hooks/rules-of-hooks
// Restructure to call hooks at top level, or move hook calls to component files
```

**Acceptance**: `pnpm --filter vibex-fronted run lint` passes without disable comments

### Task 8.4: ST-07 — Implement Flow execution (4 TODO stubs)

**File**: `lib/prompts/flow-execution.ts`

Implement the 4 `TODO:` comment blocks with actual logic:
1. Step execution (LLM call)
2. Code execution (eval/sandbox)
3. Wait/delay step
4. Result aggregation

**Test**: `__tests__/lib/flow-execution.test.ts` with 3 scenarios (LLM, wait, failure)  
**Acceptance**: `/api/flows/execute` returns non-null step outputs, no `{ success: true, data: null }`

### Task 8.5: ST-08 — Add clarificationId index

**File**: `migrations/xxx_add_clarification_index.sql`

```sql
-- NEW: Create migration file
-- Check current migration filename pattern first
-- Typically: YYYYMMDDHHMMSS_migration_name.sql

-- Add index on Entity.clarificationId (frequently queried in requirement analysis)
CREATE INDEX IF NOT EXISTS idx_entity_clarification_id ON Entity(clarificationId);

-- Also add index on Clarification.entityId (reverse lookup)
CREATE INDEX IF NOT EXISTS idx_clarification_entity_id ON Clarification(entityId);
```

**Apply locally**:
```bash
cd vibex-backend
pnpm exec prisma migrate dev --name add_clarification_index
```

**Verify**:
```bash
# Check index exists
sqlite3 .prisma/client/dev.db "EXPLAIN QUERY PLAN SELECT * FROM Entity WHERE clarificationId = 'test';"
# Should show "USING INDEX idx_entity_clarification_id"
```

### Task 8.6: ST-09 — Fix login/route.ts duplicate code

**File**: `app/api/auth/login/route.ts`

```typescript
// BEFORE (broken — same path concatenated twice):
const content = readFile(path1) + readFile(path2); // path1 === path2

// AFTER (fixed):
const path = normalizePath(inputPath); // Deduplicate
const content = readFile(path);
```

**Verify**: File length < 200 lines after fix  
**Acceptance**: Login endpoint still functions correctly

---

## 9. Sprint 7: Documentation & Polish (1h)

### Task 9.1: ST-10 — Add Workers development guide to AGENTS.md

**File**: `vibex-backend/AGENTS.md`

```markdown
## Cloudflare Workers 开发规范

### DB 访问
- 始终使用 `getDBClient()` 而非直接实例化 `PrismaClient`
- Workers 环境使用 D1 binding (`env.D1_DB`)，本地使用 Prisma SQLite
- `getDBClient(env, isWorkers)` 第二个参数由构建时环境检测决定

### 缓存策略
- 禁止使用内存 `Map()` 做持久化缓存，使用 `env.CACHE_KV` (D1 KV)
- 冷启动后内存清空，缓存需重新预热
- 缓存 key 格式：`{scope}:{id}:{hash}`，设置 TTL

### Auth 认证
- 所有 `/api/v1/*` 路由必须使用 `withAuth()` 包装
- 公开路由仅：`/api/v1/auth/login`、`/api/v1/auth/register`、`/api/v1/health`
- JWT secret 从 `env.JWT_SECRET` 读取，绝不硬编码

### 输入校验
- 所有用户输入必须经过 Zod schema 验证
- 拒绝非法输入并返回 400 + 具体错误信息
- 验证在 auth 之后、业务逻辑之前执行

### 日志规范
- 禁止 `console.log` 生产敏感信息（entityId、token、usage）
- 使用 `logger.error(ctx, { sanitized: 'meta' })` 记录错误
- 生产构建自动移除 console.* 调用

### 流式响应
- 使用 `ReadableStream` + `TextEncoder` 构造 SSE 流
- 在 `ReadableStream` 构造前提前绑定 `this` 引用
- 始终在 catch 块中调用 `controller.error(e)` 而非静默忽略
```

**Acceptance**: `grep -c "getDBClient\|isWorkers\|CACHE_KV" AGENTS.md` ≥ 3

### Task 9.2: D-P3-1 — Canvas E2E tests

**Files**: `vibex-fronted/tests/canvas/` (create), `playwright-canvas-crash-test.config.cjs`

**Test scenarios**:
1. Create new project → Canvas loads
2. Add node to canvas → Node appears
3. Drag node → Position updates
4. Delete node → Node removed
5. Export canvas → Download triggered

**Acceptance**: All 5 scenarios pass in CI

### Task 9.3: D-P3-2 — Type `error.details` as `unknown`

**File**: `lib/errorHandler.ts`

```typescript
// Already covered in Task 8.2, verify:
// details?: any → details?: unknown
// Usage: if (typeof error.details === 'object' && error.details !== null) { ... }
```

---

## 10. Regression & Validation Checklist

### Pre-Merge Gates

- [ ] `pnpm --filter vibex-backend run typecheck` passes
- [ ] `pnpm --filter vibex-backend run lint` passes
- [ ] `pnpm --filter vibex-backend run test` passes (>80% coverage)
- [ ] `pnpm --filter vibex-fronted run typecheck` passes
- [ ] `pnpm --filter vibex-fronted run lint` passes
- [ ] `pnpm --filter vibex-fronted run test` passes (>70% coverage)
- [ ] `pnpm --filter vibex-fronted run test:e2e` passes
- [ ] `wrangler deploy --dry-run` succeeds (no PrismaClient bundle warnings)

### Manual Verification

- [ ] Chat API: Send message with 3-turn history → LLM responds contextually
- [ ] Canvas generate: POST with valid projectId UUID → 200 + data
- [ ] Canvas generate: POST with invalid projectId → 400 + validation error
- [ ] Unauthenticated request to any protected route → 401
- [ ] Flow execute: POST with test flow → Returns step outputs (not null)
- [ ] Mermaid renderer: Inject `<script>alert(1)</script>` → Script stripped from output
- [ ] Canvas page: Load → Renders without ReactFlow context errors
- [ ] Production logs: Verify no entityId/token/usage/sk- in output

---

## 11. Rollback Procedures

| Story | Rollback Action |
|-------|----------------|
| ST-02: DB client | Revert to `new PrismaClient()` in affected routes, redeploy |
| ST-04: D1 KV cache | Revert `RequirementAnalyzerService` to `Map()` cache |
| D-P0-1: Auth | Remove `withAuth()` wrapper, routes become public |
| D-P1-3: CanvasPage split | Revert to single 981-line file (keep refactored files in branch) |
| D-P2-1: Store merge | Revert imports to original store files |
| ST-08: Index | `prisma migrate rollback` or `DROP INDEX idx_entity_clarification_id` |

---

## 12. Dependency Graph

```
Sprint 0 (scaffolding)
  ├─ logger.ts ─────────────────────────┐
  ├─ apiAuth.ts ───────────────────────┤
  ├─ db.ts (extend) ───────────────────┤
  ├─ CI gate ──────────────────────────┤
  └─ schemas/canvas.ts ────────────────┤
       └─ Sprint 2 (D-P0-3)
            └─ Sprint 2 (D-P0-1) ───┐
                                    │
Sprint 1 ───────────────────────────┘
  ├─ ST-01: LLM streaming fix
  ├─ ST-02: DB client unification ──┐
  ├─ ST-03: Multi-ID relations ─────┤
  └─ ST-04: D1 KV cache ─────────────┤
                                      │
Sprint 3 ─────────────────────────────┘
  ├─ D-P0-2: Empty catch (backend)
  ├─ D-P1-2: Empty catch (frontend)
  ├─ ST-06: Pool manager
  └─ ESLint rule

Sprint 4 (frontend P1)
  ├─ D-P1-1: as any removal
  ├─ D-P1-4: DOMPurify
  ├─ D-P1-5: ReactFlow hooks
  └─ D-P1-6: Console → logger

Sprint 5 (frontend architecture)
  ├─ D-P1-3: CanvasPage split ─────────────────────┐
  ├─ D-P2-1: Store merge ──────────────────────────┤
  └─ D-P2-3: ReactFlowProvider nesting ───────────┘
                                                    │
Sprint 6 ──────────────────────────────────────────┘
  ├─ D-P2-2: Chat history fix
  ├─ D-P2-4: errorHandler as any
  ├─ D-P2-5: eslint-disable removal
  ├─ ST-07: Flow execution
  ├─ ST-08: Index
  └─ ST-09: Duplicate code

Sprint 7 (docs & polish)
  ├─ ST-10: AGENTS.md
  ├─ D-P3-1: Canvas E2E
  └─ D-P3-2: error.details unknown
```
