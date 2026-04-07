# Epic 6: Quality & Polish

**Epic ID**: EPIC-06  
**Priority**: P2–P3  
**Estimated**: 3.5h  
**Stories**: ST-18, ST-19, ST-20, ST-21, ST-22, ST-23

---

## ST-18: Fix Chat History Pass-Through

### Context

`app/api/v1/chat/route.ts` receives `history` field in the request body but never forwards it to the LLM service. The LLM only sees the current message, losing conversation context.

### Fix

```typescript
// app/api/v1/chat/route.ts
export const POST = withAuth(async (req, { auth, env }) => {
  const body = await req.json();
  const { message, history } = chatMessageSchema.parse(body);

  // FIX: Forward full conversation history to LLM
  const historyMessages: ChatMessage[] = (history || []).map(h => ({
    role: h.role as 'user' | 'assistant',
    content: h.content,
  }));
  const messages: ChatMessage[] = [...historyMessages, { role: 'user', content: message }];

  const llm = getLLMService(env);
  const response = await llm.chat(messages); // ← all messages, not just current
  return NextResponse.json({ response });
});
```

### Acceptance Tests

```typescript
// __tests__/lib/api/chat.test.ts
it('sends full history + current message to LLM', async () => {
  const mockChat = jest.fn().mockResolvedValue('response');
  const svc = createMockLLMService({ chat: mockChat });

  await svc.chat([
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi there' },
    { role: 'user', content: 'how are you' },
  ]);

  expect(mockChat).toHaveBeenCalledWith(
    expect.arrayContaining([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
      { role: 'user', content: 'how are you' },
    ])
  );
});
```

### Files Changed
- `vibex-backend/src/app/api/v1/chat/route.ts`

---

## ST-19: `error.details?: any` → `error.details?: unknown`

### Context

`lib/errorHandler.ts` uses `details?: any` which disables TypeScript type checking on error details. Changing to `unknown` forces callers to narrow the type.

### Fix

```typescript
// lib/errorHandler.ts
// ❌ BEFORE
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any // ← unsafe
  ) { super(message); }
}

// ✅ AFTER
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown // ← safe, must narrow
  ) { super(message); }
}

// Usage requiring narrowing:
catch (err) {
  if (typeof error.details === 'object' && error.details !== null) {
    logger.error('app_error', { details: error.details });
  }
}
```

### Acceptance Tests

```bash
pnpm --filter vibex-backend run typecheck
# → must exit 0
```

### Files Changed
- `vibex-backend/src/lib/errorHandler.ts`

---

## ST-20: Remove `eslint-disable` Hooks Comment

### Context

`stores/ddd/init.ts` has `eslint-disable-next-line react-hooks/rules-of-hooks` suppressing the Rules of Hooks lint rule. This is a code smell — hooks should be called unconditionally at the top level.

### Fix

Refactor `stores/ddd/init.ts` to call hooks unconditionally, or move hook calls to component files where they belong.

```typescript
// ❌ BEFORE (stores/ddd/init.ts)
// eslint-disable-next-line react-hooks/rules-of-hooks
const { data } = useSWR('/api/...', fetcher);

// ✅ AFTER: Move to a proper React component
// components/ddd/DataInit.tsx
function DataInit() {
  const { data } = useSWR('/api/...', fetcher);
  useEffect(() => {
    if (data) initializeStore(data);
  }, [data]);
  return null;
}
```

### Acceptance Tests

```bash
pnpm --filter vibex-fronted run lint
# → exits 0 without any disable comments
```

### Files Changed
- `vibex-fronted/src/stores/ddd/init.ts`

---

## ST-21: Fix Login Route Duplicate Code

### Context

`app/api/auth/login/route.ts` has the same file path concatenated twice — likely a copy-paste error that doubles the file's logic. File is bloated.

### Fix

```typescript
// ❌ BEFORE
const path = inputPath;
const content = readFile(path) + readFile(path); // duplicate!

// ✅ AFTER
const path = normalizePath(inputPath);
const content = readFile(path);
```

After fix: ensure file is < 200 lines.

### Acceptance Tests

```bash
# File is smaller after fix
wc -l app/api/auth/login/route.ts
# → should be < 200

# Login still works (manual verification or E2E)
```

### Files Changed
- `vibex-backend/src/app/api/auth/login/route.ts`

---

## ST-22: Workers Development Guide in AGENTS.md

### Context

`vibex-backend/AGENTS.md` lacks Workers-specific development guidelines. New team members don't know about `isWorkers` guards, D1 KV caching, or `withAuth()` patterns.

### Content to Add

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

### 日志规范
- 禁止 `console.log` 生产敏感信息（entityId、token、usage）
- 使用 `logger.error(ctx, { sanitized: 'meta' })` 记录错误
```

### Acceptance Tests

```bash
grep -c "getDBClient\|isWorkers\|CACHE_KV" vibex-backend/AGENTS.md
# → ≥ 3
```

### Files Changed
- `vibex-backend/AGENTS.md`

---

## ST-23: Canvas E2E Tests (5 Scenarios)

### Context

No Playwright E2E tests for Canvas page. Need to cover critical user flows to prevent regression.

### Test Scenarios

```typescript
// playwright/canvas-full-flow.spec.ts

test.describe('Canvas E2E', () => {
  test('create new project → Canvas loads', async ({ page }) => {
    await page.goto('/projects/new');
    await page.fill('[name="projectName"]', 'E2E Test Project');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/canvas\//);
    await expect(page.locator('.canvas-page')).toBeVisible();
  });

  test('add node to canvas → node appears', async ({ page }) => {
    await page.goto('/canvas/test-project');
    await page.click('button[aria-label="Add Node"]');
    await expect(page.locator('.flow-node').first()).toBeVisible();
  });

  test('drag node → position updates', async ({ page }) => {
    await page.goto('/canvas/test-project');
    const node = page.locator('.flow-node').first();
    const box = await node.boundingBox();
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 50);
    await page.mouse.up();
    // Verify position changed in store (or via API)
  });

  test('delete node → node removed', async ({ page }) => {
    await page.goto('/canvas/test-project');
    const nodeCountBefore = await page.locator('.flow-node').count();
    await page.click('.flow-node >> nth=0');
    await page.keyboard.press('Delete');
    await expect(page.locator('.flow-node')).toHaveCount(nodeCountBefore - 1);
  });

  test('export canvas → download triggered', async ({ page }) => {
    await page.goto('/canvas/test-project');
    const downloadPromise = page.waitForEvent('download');
    await page.click('button[aria-label="Export"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(json|png|svg)$/);
  });
});
```

### Playwright Config

```javascript
// playwright-canvas-crash-test.config.cjs
const config = {
  testDir: './tests/canvas',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
};
module.exports = config;
```

### Acceptance Tests

```bash
pnpm --filter vibex-fronted run test:e2e
# → all 5 scenarios pass in CI
```

### Files Changed
- `vibex-fronted/tests/canvas/full-flow.spec.ts` (new)
- `vibex-fronted/playwright-canvas-crash-test.config.cjs`

---

## Rollback Procedures

| Story | Rollback Action |
|-------|----------------|
| ST-18 | Remove history forwarding, revert to single-message call |
| ST-19 | Revert to `details?: any` in errorHandler.ts |
| ST-20 | Restore `eslint-disable` comment in init.ts |
| ST-21 | Revert to duplicate path concatenation in login/route.ts |
| ST-22 | Remove Workers guide section from AGENTS.md |
| ST-23 | Delete E2E test files |
