# IMPLEMENTATION_PLAN: VibeX Backend Fixes 2026-04-10

> **项目**: vibex-backend-fixes-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 0 | Day 1 | Auth 中间件 + XSS 修复 | 6h |
| Sprint 1 | Day 2 | 输入校验 + 错误处理 | 6h |

**总工时**: 12h | **团队**: 1 Dev

---

## 2. Sprint 0: Auth + XSS（6h）

### Task 0.1: 创建 Auth 中间件（3h）

**Step 1: 创建错误类型体系**

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('AUTH_ERROR', message, 401);
    this.name = 'AuthError';
  }
}
```

**Step 2: 创建 JWT 验证**

```typescript
// lib/auth/jwt.ts
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('Invalid token format');
  
  const payload = JSON.parse(atob(parts[1]));
  const expiresAt = payload.exp * 1000;
  
  if (Date.now() > expiresAt) {
    throw new AuthError('Token expired');
  }
  
  if (payload.iat * 1000 > Date.now()) {
    throw new AuthError('Token not yet valid');
  }
  
  return payload as JWTPayload;
}
```

**Step 3: 创建 Auth 中间件**

```typescript
// lib/middleware/auth.ts
export function withAuth(
  handler: (request: Request, env: Env, ctx: Context, auth: AuthUser) => Promise<Response>
) {
  return async (request: Request, env: Env, ctx: Context): Promise<Response> => {
    // 豁免路由检查
    const url = new URL(request.url);
    if (isPublicPath(url.pathname)) {
      return c.next();
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized', code: 'MISSING_TOKEN' }, 401);
    }

    const token = authHeader.slice(7);
    try {
      const payload = await verifyJWT(token, env.JWT_SECRET);
      const auth: AuthUser = { userId: payload.sub, email: payload.email, roles: payload.roles ?? [] };
      return handler(request, env, ctx, auth);
    } catch (error) {
      if (error instanceof AuthError) {
        return c.json({ error: 'Unauthorized', code: error.code }, 401);
      }
      throw error;
    }
  };
}
```

**Step 4: 应用到所有受保护路由**

```typescript
// app/api/v1/chat/route.ts
const chatRoute = new Hono();

chatRoute.post('/', withAuth(async (c, env, ctx, auth) => {
  const { projectId, message } = await c.req.json();
  // business logic...
  return c.json({ response: '...' });
}));
```

**验证命令**:
```bash
# 无 token 应返回 401
curl -X POST http://localhost:8787/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"projectId":"1","message":"hi"}' | jq '.code'
# 应输出: "MISSING_TOKEN"

# 豁免路由无需 token
curl http://localhost:8787/health | jq '.status'
# 应输出: "ok"
```

---

### Task 0.2: XSS 修复（3h）

**Step 1: 安装 DOMPurify**

```bash
cd vibex-fronted && pnpm add dompurify
```

**Step 2: 创建 SafeHTML 组件**

```typescript
// components/SafeHTML.tsx
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

interface SafeHTMLProps {
  html: string;
  className?: string;
}

export function SafeHTML({ html, className }: SafeHTMLProps) {
  const sanitized = typeof window !== 'undefined'
    ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
    : html;
  
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

**Step 3: 替换 MermaidRenderer**

```typescript
// Before
<div dangerouslySetInnerHTML={{ __html: renderedHtml }} />

// After
<SafeHTML html={renderedHtml} />
```

**验证命令**:
```bash
# 注入 XSS payload
curl -X POST http://localhost:8787/api/v1/canvas/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId":"1","prompt":"<img src=x onerror=alert(1)>"}'

# 检查输出是否被 sanitized
# 应该没有 onerror 属性
```

---

## 3. Sprint 1: Validation + Error Handling（6h）

### Task 1.1: 创建 Zod Schema（2h）

**创建统一 Schema 文件**:

```typescript
// lib/schemas/index.ts
export * from './canvas';
export * from './chat';
export * from './project';

// lib/schemas/canvas.ts
import { z } from 'zod';

export const GenerateComponentsSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  prompt: z.string().min(1).max(5000),
  context: z.object({
    existingNodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
    })).optional(),
  }).optional(),
  options: z.object({
    count: z.number().int().min(1).max(20).optional(),
  }).optional(),
}).strict();
```

### Task 1.2: 创建 Validation 中间件（2h）

```typescript
// lib/middleware/validate.ts
export function validateBody<T extends z.ZodSchema>(
  schema: T,
  options: { strict?: boolean } = {}
) {
  return async (request: Request, env: Env, ctx: Context): Promise<Response> => {
    if (['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes(request.method)) {
      return c.next();
    }

    try {
      const body = await request.json();
      const result = schema.safeParse(body);
      
      if (!result.success) {
        return c.json({
          error: 'Validation Error',
          code: 'INVALID_REQUEST',
          details: result.error.flatten().fieldErrors,
        }, 400);
      }
      
      ctx.set('validatedBody', result.data);
      return c.next();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json({ error: 'Invalid JSON', code: 'MALFORMED_JSON' }, 400);
      }
      throw error;
    }
  };
}
```

### Task 1.3: 全局错误处理器（2h）

```typescript
// lib/errorHandler.ts
export function createErrorHandler() {
  return async (error: Error, event: TraceEvent): Promise<void> => {
    if (error instanceof AppError) {
      console.error(`[${error.code}] ${error.message}`, {
        statusCode: error.statusCode,
        details: error.details,
        path: event.path,
      });
      return; // Hono 会自动生成响应
    }

    // 未知错误
    console.error('[UNHANDLED]', error);
    throw error;
  };
}

// 在 gateway.ts 中注册
app.onError(createErrorHandler());
```

---

## 4. 验收标准总表

| Task | 验收标准 | 命令 |
|------|---------|------|
| 0.1 | 无 token 返回 401 | `curl -X POST /api/v1/chat` |
| 0.1 | 豁免路由无需 token | `curl /health` |
| 0.1 | JWT 过期返回 401 | `curl -H "Authorization: Bearer expired-token"` |
| 0.2 | XSS payload 被 sanitized | 检查输出无 `onerror` |
| 1.1 | 无效 projectId 返回 400 | 发送 `{"projectId": ""}` |
| 1.1 | 缺少必填字段返回 400 | 发送 `{"prompt": "hi"}` |
| 1.2 | 空 body 返回 400 | `curl -d '{}'` |
| 1.3 | 所有 catch 有 instanceof | `grep -rn "instanceof" src/app/api/` |

---

## 5. 回滚计划

| Task | 回滚步骤 | 时间 |
|------|---------|------|
| 0.1 Auth | 删除中间件，恢复无认证 | <5 min |
| 0.2 XSS | 回退到 dangerouslySetInnerHTML | <5 min |
| 1.1 Schema | 删除 schema 文件 | <5 min |
| 1.2 Validation | 删除中间件 | <5 min |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
