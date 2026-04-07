# Epic 2: Auth & Input Validation

**Epic ID**: EPIC-02  
**Priority**: P1 — High  
**Estimated**: 3h  
**Stories**: ST-05, ST-06

---

## ST-05: Auth Middleware on All Routes

### Context

16+ API routes lack authentication checks. Any unauthenticated user can call Canvas generate, chat, snapshots, and other sensitive endpoints.

### Solution: `withAuth()` Middleware

```typescript
// lib/apiAuth.ts

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthContext {
  auth: AuthUser;
  env: CloudflareEnv;
}

export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<Response>;

export async function getAuthUser(request: Request, jwtSecret: string): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // In production: verify JWT signature with jwtSecret
    if (!payload.userId || !payload.exp || payload.exp < Date.now() / 1000) return null;
    return { userId: payload.userId, email: payload.email, role: payload.role ?? 'user' };
  } catch {
    return null;
  }
}

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context: { env: CloudflareEnv }) => {
    const authUser = await getAuthUser(request, context.env.JWT_SECRET);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request, { ...context, auth: authUser });
  };
}
```

### Public Routes (No Auth)
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/health`

### Route Pattern (After)

```typescript
// app/api/v1/chat/route.ts
export const POST = withAuth(async (request: NextRequest, { auth, env }: AuthContext) => {
  // auth.userId, auth.email available
  const userId = auth.userId;
  // ... proceed
});
```

### Acceptance Tests

```typescript
// __tests__/routes/auth.test.ts
it('returns 401 without Authorization header', async () => {
  const res = await POST(new Request('http://localhost/api/v1/chat', {
    method: 'POST',
    body: JSON.stringify({ message: 'hello' }),
  }));
  expect(res.status).toBe(401);
});

it('returns 401 with invalid Bearer token', async () => {
  const res = await POST(new Request('http://localhost/api/v1/chat', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer invalid.token.here' },
    body: JSON.stringify({ message: 'hello' }),
  }));
  expect(res.status).toBe(401);
});

it('proceeds with valid Bearer token', async () => {
  const token = createTestJWT({ userId: 'user-123', email: 'test@example.com' });
  const res = await POST(new Request('http://localhost/api/v1/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ message: 'hello' }),
  }));
  expect(res.status).not.toBe(401);
});
```

### Files Changed
- `vibex-backend/src/lib/apiAuth.ts` (new)
- All 16+ protected API routes (add `withAuth()` wrapper)

---

## ST-06: Zod Input Validation on Canvas Routes

### Context

Canvas generate routes accept arbitrary JSON without validating projectId format, pageIds array size, or text length. Invalid input causes downstream crashes.

### Schema Definitions

```typescript
// schemas/canvas.ts
import { z } from 'zod';

export const generateCanvasSchema = z.object({
  projectId: z.string().uuid('Invalid projectId: must be UUID format'),
  pageIds: z.array(z.string().uuid()).min(1, 'At least one pageId required'),
  options: z.object({
    includeRelations: z.boolean().optional().default(true),
    mode: z.enum(['fast', 'full']).optional().default('full'),
  }).optional(),
});

export const generateContextsSchema = z.object({
  requirementText: z.string().min(1, 'Requirement text required').max(5000, 'Max 5000 characters'),
  projectId: z.string().uuid().optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message required').max(2000, 'Max 2000 characters'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

export const generateComponentsSchema = z.object({
  flowId: z.string().uuid('flowId must be UUID'),
  contextIds: z.array(z.string().uuid()).min(1),
  prompt: z.string().max(1000).optional(),
});

export const generateFlowsSchema = z.object({
  projectId: z.string().uuid(),
  requirementText: z.string().min(1).max(5000),
});
```

### Route Integration Pattern

```typescript
// app/api/v1/canvas/generate/route.ts
import { generateCanvasSchema } from '@/schemas/canvas';
import { ZodError } from 'zod';

export const POST = withAuth(async (req, { auth, env }) => {
  try {
    const body = await req.json();
    const data = generateCanvasSchema.parse(body); // throws ZodError if invalid
    // ... proceed with data.projectId, data.pageIds, data.options
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      );
    }
    throw err;
  }
});
```

### Acceptance Tests

```typescript
// __tests__/routes/canvas-validation.test.ts
it('rejects invalid projectId (not UUID)', async () => {
  const res = await post('/api/v1/canvas/generate', { projectId: 'not-a-uuid', pageIds: [] });
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBe('Validation failed');
  expect(body.details.some((e: any) => e.path === 'projectId')).toBe(true);
});

it('rejects empty pageIds array', async () => {
  const res = await post('/api/v1/canvas/generate', { projectId: uuid(), pageIds: [] });
  expect(res.status).toBe(400);
});

it('accepts valid input', async () => {
  const res = await post('/api/v1/canvas/generate', {
    projectId: uuid(), pageIds: [uuid()],
  });
  expect(res.status).not.toBe(400);
});
```

### Files Changed
- `vibex-backend/src/schemas/canvas.ts` (new)
- `vibex-backend/src/app/api/v1/canvas/generate/route.ts`
- `vibex-backend/src/app/api/v1/canvas/generate-contexts/route.ts`
- `vibex-backend/src/app/api/v1/canvas/generate-components/route.ts`
- `vibex-backend/src/app/api/v1/canvas/generate-flows/route.ts`

---

## Rollback Procedures

| Story | Rollback Action |
|-------|----------------|
| ST-05 | Remove `withAuth()` wrapper from all routes, routes become public |
| ST-06 | Remove Zod parse calls, routes accept raw `req.json()` |
