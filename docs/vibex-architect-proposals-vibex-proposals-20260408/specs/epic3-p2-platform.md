# Spec — Epic 3: P2 平台基础设施

**Project:** vibex-architect-proposals-vibex-proposals-20260408
**Epic:** Epic 3 — P2 Platform Foundation
**Sprint:** Sprint 3 (6.5d)
**Status:** Draft
**Date:** 2026-04-08

---

## 概述

Epic 3 完善平台级基础设施，为后续功能迭代提供可扩展的 API 层、清晰的路由语义和统一的认证逻辑：

1. API Client 统一封装层 — 消除 15+ 模块文件的重复 fetch 逻辑
2. 路由重命名 — 消除 `/ddd` vs `/diagnosis` 语义混淆
3. Auth 中间件统一 — 消除 auth 逻辑双重实现

**前置依赖:** Epic 1（类型安全是封装前提）+ Epic 2（路由拆分后更易统一命名）

---

## Story 3.1 — Ar-P2-1: API Client 统一封装

### 背景

前端 `services/api/modules/` 下有 15+ 模块文件，每个独立实现 fetch 调用，重复以下逻辑：
- 请求拦截（添加 Authorization header）
- 错误处理（401 → 跳转登录，5xx → retry，4xx → throw）
- Loading 状态管理（分散在各组件）

### 实现方案

**目标目录结构：**
```
vibex-fronted/src/services/api/
├── client.ts           # 统一 HTTP client（新建）
├── modules/           # 现有模块（重构）
│   ├── user.ts
│   ├── project.ts
│   ├── flow.ts
│   └── ...
├── hooks/             # React + API 集成（新建）
│   ├── useProject.ts
│   ├── useProjects.ts
│   └── ...
└── types.ts           # 统一 API 类型
```

**文件: `vibex-fronted/src/services/api/client.ts`**

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.vibex.top';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    count?: number;
    page?: number;
    total?: number;
  };
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

class ApiClient {
  private baseUrl: string;
  private retryConfig: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
    this.retryConfig = { maxRetries: 3, baseDelay: 500, maxDelay: 5000 };
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = 0
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      // Retry on 5xx errors
      if (response.status >= 500 && retries < this.retryConfig.maxRetries) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, retries),
          this.retryConfig.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries + 1);
      }

      return response;
    } catch (error) {
      if (retries < this.retryConfig.maxRetries) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, retries),
          this.retryConfig.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  private getAuthHeader(): Record<string, string> {
    // Read from auth store or cookie
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
    return {};
  }

  private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...additionalHeaders,
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 401) {
      // Redirect to login (only in browser)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiErrorResponse('UNAUTHORIZED', 'Authentication required');
    }

    if (response.status === 403) {
      throw new ApiErrorResponse('FORBIDDEN', 'Insufficient permissions');
    }

    if (response.status === 404) {
      throw new ApiErrorResponse('NOT_FOUND', 'Resource not found');
    }

    if (response.status >= 400 && response.status < 500) {
      const body = await response.json().catch(() => ({}));
      throw new ApiErrorResponse('CLIENT_ERROR', body.error ?? 'Request failed', body.details);
    }

    if (response.status >= 500) {
      throw new ApiErrorResponse('SERVER_ERROR', 'Internal server error', { status: response.status });
    }

    // 2xx success
    return response.json();
  }

  async get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: 'GET',
      headers: this.buildHeaders(options?.headers as Record<string, string>),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: 'POST',
      headers: this.buildHeaders(options?.headers as Record<string, string>),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: 'PUT',
      headers: this.buildHeaders(options?.headers as Record<string, string>),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: 'DELETE',
      headers: this.buildHeaders(options?.headers as Record<string, string>),
    });
    return this.handleResponse<T>(response);
  }
}

class ApiErrorResponse extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
export { ApiErrorResponse as ApiError };
```

**文件: `vibex-fronted/src/services/api/types.ts`**

```typescript
// Shared API types
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  count: number;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiSingleResponse<T> {
  data: T;
}

// Module-specific types (partial examples)
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface Flow {
  id: string;
  projectId: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}
```

**文件: `vibex-fronted/src/services/api/hooks/useProject.ts`**

```typescript
// TanStack Query + apiClient integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Project } from '../types';

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.get<{ project: Project }>(`/api/projects/${projectId}`),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiClient.post<{ project: Project }>('/api/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, ...data }: { projectId: string; name?: string; description?: string }) =>
      apiClient.put<{ project: Project }>(`/api/projects/${projectId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
}
```

**重构示例 — `services/api/modules/project.ts`（Before → After）**

```typescript
// ❌ Before: duplicated error handling, retry, loading
import { useState } from 'react';
import { useEffect } from 'react';

export function useProject(projectId: string) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(data => { setProject(data); setLoading(false); })
      .catch(e => { setError(e); setLoading(false); });
  }, [projectId]);

  return { project, loading, error };
}

// ✅ After: unified via useProject hook
export { useProject, useCreateProject, useUpdateProject } from '../hooks/useProject';
```

### 验收标准

- [ ] `services/api/client.ts` 存在并导出 `get/post/put/delete` 方法
- [ ] `services/api/hooks/useProject.ts` 使用 TanStack Query
- [ ] 每个 module 文件（user.ts, flow.ts 等）使用 `apiClient` 而非直接 `fetch()`
- [ ] `grep -rn "fetch(" services/api/modules/ --include="*.ts" | grep -v client.ts | grep -v test` → 0 results
- [ ] 重复错误处理代码减少 ≥ 50%（通过行数对比测量）

---

## Story 3.2 — Ar-P2-2: 路由重命名

### 背景

当前 `/ddd` 和 `/diagnosis` 路径语义重叠：
- `/ddd` — DDD 限界上下文、域模型、业务流程
- `/diagnosis` — 需求诊断

新开发者难以区分，导航时容易跳转到错误模块。

### 实现方案

**路由重命名映射：**

| 当前路径 | 新路径 | 理由 | 废弃截止 |
|---------|--------|------|---------|
| `/ddd` | `/ddd/contexts` | 明确限界上下文是 DDD 子模块 | 30 天后 alias 删除 |
| `/ddd/domain` | `/ddd/domain-model` | 避免与 `/domain-entities` 混淆 | 30 天后 alias 删除 |
| `/diagnosis` | `/requirement/diagnosis` | 诊断属于需求流程的子模块 | 30 天后 alias 删除 |

**后端路由别名（向后兼容）：**

```typescript
// routes/v1/alias.ts — 30 天废弃 alias
// 2026-04-08 添加，2026-05-08 删除

// /ddd → /ddd/contexts alias
app.get('/api/v1/ddd', (c) => {
  // Log deprecation warning
  console.warn('[DEPRECATED] /api/v1/ddd → /api/v1/ddd/contexts. Remove by 2026-05-08.');
  return c.redirect('/api/v1/ddd/contexts', 301);
});

// /diagnosis → /requirement/diagnosis alias
app.get('/api/v1/diagnosis', (c) => {
  console.warn('[DEPRECATED] /api/v1/diagnosis → /api/v1/requirement/diagnosis. Remove by 2026-05-08.');
  return c.redirect('/api/v1/requirement/diagnosis', 301);
});
```

**前端路由别名：**

```typescript
// next.config.js 或 app/router.ts
const deprecatedRoutes = [
  { from: '/ddd', to: '/ddd/contexts', deadline: '2026-05-08' },
  { from: '/ddd/domain', to: '/ddd/domain-model', deadline: '2026-05-08' },
  { from: '/diagnosis', to: '/requirement/diagnosis', deadline: '2026-05-08' },
];

// Redirect middleware
export function middleware(request: NextRequest) {
  for (const route of deprecatedRoutes) {
    if (request.nextUrl.pathname === route.from) {
      console.warn(`[DEPRECATED] ${route.from} → ${route.to}. Remove by ${route.deadline}.`);
      return NextResponse.redirect(new URL(route.to, request.url), 301);
    }
  }
}
```

**Migration Guide 模板（`docs/migration/routes-rename-20260408.md`）：**

```markdown
# Route Rename Migration Guide (2026-04-08)

## Timeline

- **2026-04-08**: 新路由生效，旧路由返回 301 + warning log
- **2026-05-08**: 旧路由 alias 删除（CI 拒绝包含旧路径的 PR）

## Breaking Changes

| Old Route | New Route | Migration |
|-----------|-----------|-----------|
| `GET /api/v1/ddd` | `GET /api/v1/ddd/contexts` | 自动 301 redirect |
| `GET /api/v1/ddd/domain` | `GET /api/v1/ddd/domain-model` | 自动 301 redirect |
| `GET /api/v1/diagnosis` | `GET /api/v1/requirement/diagnosis` | 自动 301 redirect |

## Checklist for Migration

- [ ] 更新前端路由跳转代码（`router.push('/ddd/contexts')`）
- [ ] 更新 API 调用代码（`/api/ddd` → `/api/ddd/contexts`）
- [ ] 更新 API 文档书签
- [ ] 更新 Postman/Insomnia collections
- [ ] 确认 301 redirect 在各环境测试通过
```

**更新 `api-contract.yaml`：**

```yaml
# api-contract.yaml — 相关条目更新
paths:
  /v1/ddd/contexts:   # 从 /v1/ddd 重命名
    get:
      summary: List DDD bounded contexts
      tags: [ddd-contexts]  # 新 tag
  /v1/ddd/domain-model:  # 从 /v1/ddd/domain 重命名
    get:
      summary: Get domain model
      tags: [ddd-domain]
  /v1/requirement/diagnosis:  # 从 /v1/diagnosis 重命名
    post:
      summary: Run requirement diagnosis
      tags: [requirement]
```

### 验收标准

- [ ] `api-contract.yaml` 反映所有重命名路由（无旧路径）
- [ ] 新路由 `GET /api/v1/ddd/contexts` 返回 200
- [ ] 旧路由 `GET /api/v1/ddd` 返回 301 + warning header
- [ ] Migration guide 存在且包含完整 checklist
- [ ] `curl -I https://api.vibex.top/api/v1/ddd` → 301
- [ ] CI 检查拒绝包含旧路径的 PR（通过 `grep` 检查）

---

## Story 3.3 — Ar-P2-3: Auth 中间件统一

### 背景

Auth 逻辑分散在两处：
1. `middleware/auth.ts` — 全局 JWT 验证中间件
2. `routes/auth/*` — 独立 auth 路由处理器

导致 token 验证逻辑可能不一致，修改 JWT 规则时需同步两处。

### 实现方案

**文件: `lib/auth.ts`**（新建，唯一 auth 核心逻辑）

```typescript
import { Hono } from 'hono';
import { SignJWT, jwtVerify } from 'hono/jwt';
import { hash, compare } from 'bcryptjs';
import type { Context, Next } from 'hono';
import type { Env } from './types'; // Cloudflare Bindings type

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
}

export interface JWTPayload {
  sub: string;      // userId
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

// --- Token Operations ---

export async function generateToken(user: User, env: Env): Promise<string> {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(env.JWT_SECRET));
}

export async function verifyToken(token: string, env: Env): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET), {
      algorithms: ['HS256'],
    });
    
    const typed = payload as unknown as JWTPayload;
    if (!typed.sub || !typed.email) return null;

    return {
      id: typed.sub,
      email: typed.email,
      name: typed.name,
      role: typed.role as User['role'],
      createdAt: '', // Not stored in JWT
    };
  } catch {
    return null;
  }
}

// --- Password Operations ---

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}

// --- Auth Middleware (replaces middleware/auth.ts) ---

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token, c.env);

  if (!user) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' }, 401);
  }

  // Attach user to context for downstream handlers
  c.set('user', user);
  return next();
}

// --- Optional Auth Middleware (for routes that accept guest) ---

export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = await verifyToken(token, c.env);
    if (user) c.set('user', user);
  }
  return next();
}
```

**更新 `middleware/auth.ts`**：

```typescript
// middleware/auth.ts — 重导出，保持向后兼容
// 2026-05-01 后删除此文件，统一使用 lib/auth.ts

export { authMiddleware, optionalAuthMiddleware } from '../lib/auth';
// @deprecated 2026-04-08 — migrate to lib/auth.ts
```

**更新 `routes/auth/login.ts`**：

```typescript
// routes/auth/login.ts
import { Hono } from 'hono';
import { generateToken, verifyPassword } from '../../lib/auth'; // UNIQUE source
import type { Env } from '../types';

const loginRouter = new Hono();

loginRouter.post('/', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'BAD_REQUEST', message: 'email and password required' }, 400);
  }

  // DB lookup
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, role, password_hash FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' }, 401);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' }, 401);
  }

  const token = await generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
  }, c.env);

  return c.json({ data: { token, user: { id: user.id, email: user.email, name: user.name } } }, 200);
});

export default loginRouter;
```

**Auth 单元测试（`lib/auth.test.ts`）：**

```typescript
import { describe, test, expect, beforeAll } from 'vitest';
import { generateToken, verifyToken, hashPassword, verifyPassword } from './auth';

// Mock env
const mockEnv = { JWT_SECRET: 'test-secret-key-for-testing-only' };

describe('Auth Utilities', () => {
  test('generateToken returns a valid JWT string', async () => {
    const user = { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user', createdAt: '' };
    const token = await generateToken(user, mockEnv as any);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT format
  });

  test('verifyToken returns user for valid token', async () => {
    const user = { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user', createdAt: '' };
    const token = await generateToken(user, mockEnv as any);
    const verified = await verifyToken(token, mockEnv as any);
    expect(verified?.id).toBe('user-1');
    expect(verified?.email).toBe('test@example.com');
  });

  test('verifyToken returns null for invalid token', async () => {
    const verified = await verifyToken('invalid.token.here', mockEnv as any);
    expect(verified).toBeNull();
  });

  test('verifyToken returns null for expired token', async () => {
    // Generate token with 0 second expiry (already expired)
    const user = { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user', createdAt: '' };
    const expiredToken = await new SignJWT({ sub: user.id, email: user.email, name: user.name, role: user.role })
      .setExpirationTime('0s')
      .sign(new TextEncoder().encode(mockEnv.JWT_SECRET));
    const verified = await verifyToken(expiredToken, mockEnv as any);
    expect(verified).toBeNull();
  });

  test('hashPassword and verifyPassword work correctly', async () => {
    const password = 'secure-password-123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  test('verifyPassword handles empty hash', async () => {
    await expect(verifyPassword('password', '')).resolves.toBe(false);
  });

  test('generateToken includes all user fields', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'admin', createdAt: '2026-01-01' };
    const token = await generateToken(user, mockEnv as any);
    const verified = await verifyToken(token, mockEnv as any);
    expect(verified?.role).toBe('admin');
  });

  test('tokens from different secrets do not verify', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'A', role: 'user', createdAt: '' };
    const token = await generateToken(user, mockEnv as any);
    const verified = await verifyToken(token, { ...mockEnv, JWT_SECRET: 'different-secret' } as any);
    expect(verified).toBeNull();
  });
});
```

### 验收标准

- [ ] `lib/auth.ts` 是所有 auth 逻辑的唯一来源
- [ ] `middleware/auth.ts` 重导出 `lib/auth` 并标记 `@deprecated`
- [ ] `routes/auth/login.ts` 使用 `lib/auth` 的 `generateToken` + `verifyPassword`
- [ ] Auth 单元测试 ≥ 10 个，覆盖所有 edge cases（包括空 token、过期 token、错误 secret）
- [ ] `pnpm test:unit lib/auth.test.ts --run` 全通过

---

## 技术债务追踪

Epic 3 完成后：

- [ ] 更新 `api-contract.yaml` 反映路由重命名
- [ ] 发布 Migration Guide（`docs/migration/routes-rename-20260408.md`）
- [ ] 更新 `docs/learnings/` 反映新的 auth 架构
- [ ] 建立 `lib/` 目录规范（所有共享 utilities 放在 `lib/` 下）
