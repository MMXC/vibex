# 架构设计文档：vibex-auth-401-handling

> **项目**: vibex-auth-401-handling
> **角色**: architect
> **日期**: 2026-04-13
> **状态**: v2（修复 8 个 blocker 后）

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-auth-401-handling
- **执行日期**: 2026-04-13
- **变更说明**: v2 修复 coord 审查发现的 8 个问题（跨域拓扑、logout secure 属性、auth_session 清理、TS 重复 imports、CSRF 风险、validateReturnTo 引用、httpClient 场景、document.cookie 虚假安全感）

---

## 1. 问题定论

### 根因

```
middleware.ts
  ↓ 读取 auth_token + auth_session cookie
  ↓ 若无 → 307 重定向 /auth

login/route.ts
  ↓ 只返回 JSON { token, user }
  ↓ 无 Set-Cookie → 无 cookie 写入浏览器
```

**结果**: 登录成功 → middleware 读不到 cookie → 仍认为未登录 → 无限重定向循环。

### 修复方向

采纳 **选项 A** — 后端设置 httpOnly cookie + logout 清除 + 前端一致性。

**拒绝理由**:
- 选项 B（纯前端写 cookie）: `document.cookie` 明文写入，XSS 风险不可接受
- 选项 C（移除 middleware cookie 依赖）: 破坏性变更，超出 scope，作为独立 tech-debt 跟进

---

## 2. Tech Stack

| 组件 | 技术选型 | 版本理由 |
|------|---------|---------|
| 前端框架 | Next.js 15 (App Router) | 项目现有，middleware 能力必需 |
| 认证状态 | Zustand + persist (sessionStorage) | 已有架构 |
| 后端认证 | JWT (jsonwebtoken) | 已有 |
| HTTP 客户端 | Axios + interceptors | 已有 |
| 路由运行 | Next.js Edge / Node.js | 现有 Cloudflare Workers 部署 |

**无新增依赖**。所有改动均为增量修改。

---

## 3. 部署拓扑（新增）

### 拓扑场景分析

| 场景 | 前端域名 | 后端域名 | Cookie 行为 |
|------|---------|---------|------------|
| **A: 同域部署** | `app.vibex.com` | `app.vibex.com/api` | ✅ 直接生效 |
| **B: 子域名跨域** | `app.vibex.com` | `api.vibex.com` | ⚠️ 需 `domain=.vibex.com` |
| **C: 完全跨域** | `vibex.com` | `api.another.com` | ❌ Cookie 无法跨域传递 |

### 各场景处理策略

**场景 A（同域）**: `path=/` + `domain` 不设置（默认当前域）→ 直接生效，无需修改。

**场景 B（子域跨域）**: 修改 login/register/logout 中的 `cookies.set()`:
```typescript
// 场景 B: 设置 domain
response.cookies.set('auth_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 604800,
  path: '/',
  domain: '.vibex.com',  // ← 新增：覆盖所有子域
});
```

**场景 C（完全跨域）**: Cookie 方案不可用，降级为纯 Authorization header 方案（选项 C）。需 coord 确认部署拓扑后再决定最终方案。

**⚠️ 当前决策**: 假设场景 A（最常见），实现时加 `domain` 可配置。如果实际部署是场景 B/C，在 `cookie-domain.ts` 配置文件控制。

### 环境变量配置

```typescript
// vibex-backend/src/lib/cookie-config.ts
export const COOKIE_CONFIG = {
  name: 'auth_token',
  maxAge: 604800,
  sameSite: 'lax' as const,
  // 跨域兼容：环境变量控制 domain
  domain: process.env.COOKIE_DOMAIN || undefined, // .vibex.com 或 undefined（同域）
  secure: process.env.NODE_ENV === 'production',
};
```

---

## 4. 架构图（Mermaid）

```mermaid
sequenceDiagram
    autonumber

    participant U as 用户浏览器
    participant MW as middleware.ts
    participant AP as /api/v1/auth/login
    participant PG as /auth 页面

    Note over U,MW: 场景1：未登录访问受保护页

    U->>MW: GET /canvas (无 cookie)
    MW->>MW: 读取 auth_token + auth_session → 均无
    MW-->>U: 307 → /auth?returnTo=/canvas

    Note over U,PG: 场景2：登录

    U->>PG: GET /auth?returnTo=/canvas
    U->>PG: POST /api/v1/auth/login
    PG->>AP: POST /api/v1/auth/login {email, password}
    AP-->>PG: 200 + Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800<br/>+ Body: {success:true, data:{token, user}}
    Note over PG: 浏览器自动存储 cookie

    PG-->>U: redirect /canvas
    U->>MW: GET /canvas (有 cookie)
    MW->>MW: 读取 auth_token → 有
    MW-->>U: 200 ✓

    Note over U,MW: 场景3：登出

    U->>PG: POST /api/v1/auth/logout
    PG->>AP: POST /api/v1/auth/logout
    AP-->>PG: 200 + Set-Cookie: auth_token=; Max-Age=0; Secure; Path=/<br/>+ Set-Cookie: auth_session=; Max-Age=0; Secure; Path=/
    Note over PG: 两个 cookie 均被服务端清除

    PG-->>U: redirect /auth
    U->>MW: GET /canvas (cookie 已清)
    MW->>MW: 读取 auth_token + auth_session → 均无
    MW-->>U: 307 → /auth?returnTo=/canvas
```

```mermaid
flowchart TB
    subgraph Browser["浏览器"]
        AuthPage["/auth 页面<br/>(validateReturnTo 实现于 page.tsx)"]
        AuthStore["authStore.ts<br/>(Zustand)<br/>logout() 清理 document.cookie"]
        HTTPC["httpClient.ts<br/>(Axios + Authorization Bearer)"]
        MW_FE["middleware.ts<br/>(Next.js)<br/>读取 auth_token + auth_session"]
    end

    subgraph Backend["vibex-backend"]
        LoginAPI["POST /api/v1/auth/login<br/>→ Set-Cookie: auth_token (HttpOnly)"]
        RegAPI["POST /api/v1/auth/register<br/>→ Set-Cookie: auth_token (HttpOnly)"]
        LogoutAPI["POST /api/v1/auth/logout<br/>→ Set-Cookie: auth_token=; Max-Age=0 (Secure)<br/>→ Set-Cookie: auth_session=; Max-Age=0 (Secure)"]
    end

    MW_FE -->|"无 cookie| 有 returnTo"| AuthPage
    MW_FE -->|"有 cookie"| Canvas["受保护页面 /canvas"]
    AuthPage -->|POST| LoginAPI
    AuthPage -->|POST| RegAPI
    LoginAPI -->|Set-Cookie| Browser
    RegAPI -->|Set-Cookie| Browser
    LogoutAPI -->|"Set-Cookie: Max-Age=0<br/>(2个 cookie)"| Browser
    AuthStore -->|logout()| LogoutAPI
    HTTPC -.->|"Bearer token<br/>双保险"| Backend
```

---

## 5. API 定义

### 5.1 登录 POST /api/v1/auth/login

```
Request: { email: string; password: string }
Response 200:
  Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800[; Domain=.example.com]
  Body: { success: true; data: { token: string; user: {...} } }
Response 401: { success: false; error: string }
```

### 5.2 注册 POST /api/v1/auth/register

```
Request: { email: string; password: string; name?: string }
Response 201:
  Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800[; Domain=.example.com]
  Body: { success: true; data: { token: string; user: {...} } }
Response 409: { success: false; error: "Email already exists" }
```

### 5.3 登出 POST /api/v1/auth/logout

```
Request: Authorization: Bearer <token>
Response 200:
  Set-Cookie: auth_token=; Max-Age=0; Secure; Path=/[; Domain=...]
  Set-Cookie: auth_session=; Max-Age=0; Secure; Path=/[; Domain=...]
  Body: { success: true; data: { message: string } }
Response 401: { success: false; error: "Not authenticated" }
```

### 5.4 Middleware 保护路径

| 路径模式 | 保护行为 |
|---------|---------|
| `/dashboard/*` | 无 auth_token + auth_session → 307 → `/auth?returnTo=...` |
| `/canvas/*` | 同上 |
| `/design/*` | 同上 |
| `/project-settings/*` | 同上 |
| `/preview/*` | 同上 |
| `/auth` | 有 cookie → redirect returnTo 或 `/dashboard` |

---

## 6. 数据模型

### 6.1 Cookie 属性

```
Name:        auth_token | auth_session (两个均需清理)
Value:       <jwt_token_string>
HttpOnly:    true        ← 防 XSS
Secure:      true (prod) / false (dev)
SameSite:    lax
Max-Age:     604800     ← 7 天（设置时）
Max-Age:     0          ← 清除时
Path:        /
Domain:      可选（跨子域时设为 .vibex.com）
```

### 6.2 auth_store (Zustand)

| Key | Storage | 说明 |
|-----|---------|------|
| `auth_token` | sessionStorage | 前端用，供 Axios interceptors |
| `user` | sessionStorage | 用户信息 |
| `isAuthenticated` | sessionStorage | 状态 |

---

## 7. 核心实现方案

### 7.1 login/route.ts — 设置 Cookie

```typescript
const response = NextResponse.json({ success: true, data: { token, user } });
response.cookies.set('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
  ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
});
return response;
```

### 7.2 register/route.ts — 设置 Cookie

同上，status 201。

**⚠️ TS 编译修复**: 移除未使用的 `getAuthUserFromRequest` import（原代码多引入了未调用的 import）。

### 7.3 logout/route.ts — 清除两个 Cookie（含 Secure 属性）

```typescript
const response = NextResponse.json({
  success: true,
  data: { message: 'Logged out successfully' },
});
// 清除 auth_token（含 Secure，确保 HTTPS 下生效）
response.cookies.set('auth_token', '', {
  maxAge: 0,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
});
// 清除 auth_session（middleware 也读此 cookie，必须清理）
response.cookies.set('auth_session', '', {
  maxAge: 0,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
});
return response;
```

**Trade-off 命名 — logout Secure 属性的必要性**:
> 如果登录时 `auth_token` cookie 带 `Secure` 属性（HTTPS 环境），则清除时也必须带 `Secure`，否则浏览器忽略清除指令。这是 HTTPS 环境下 HTTPS Cookie 的标准行为，不是额外保护，是必须项。遗漏 → HTTPS 环境下 logout 后 cookie 残留，用户无法真正登出。

### 7.4 authStore.ts — logout 清理

```typescript
logout: () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_id');
    localStorage.removeItem('user_id');
    sessionStorage.removeItem('user_role');
    localStorage.removeItem('user_role');
    // 清除 auth_token cookie（服务端已清，此处处理非 httpOnly 的残留）
    document.cookie = 'auth_token=; max-age=0; path=/';
    // 清除 auth_session cookie（middleware 也读此 cookie）
    document.cookie = 'auth_session=; max-age=0; path=/';
  }
  set({ token: null, user: null, isAuthenticated: false, isLoading: false });
},
```

**⚠️ document.cookie 清理的局限性（修复虚假安全感声明）**:
> `document.cookie` 只能操作**非 httpOnly** 的 cookie。由于登录/注册时 `auth_token` cookie 由后端以 `httpOnly` 属性设置，`document.cookie = 'auth_token=...'` **无法删除**它。
>
> **实际清除机制**: httpOnly cookie 的清除完全由后端 logout 路由负责（`Set-Cookie: auth_token=; Max-Age=0`）。`document.cookie` 清除行只能处理两种情况：① 开发环境下 `Secure=false` 的非 httpOnly 版本；② 任何残留的非 httpOnly 同名 cookie。这是前端能做到的最大努力，不是完整的清除方案。

### 7.5 validateReturnTo — 已有实现

**文件**: `vibex-fronted/src/app/auth/page.tsx`

```typescript
function validateReturnTo(returnTo: string | null): string {
  if (!returnTo) return '/dashboard';
  if (!returnTo.startsWith('/')) return '/dashboard';
  if (/^(https?|javascript:|data:)/i.test(returnTo)) return '/dashboard';
  if (/^\/\//.test(returnTo)) return '/dashboard'; // protocol-relative
  if (returnTo.includes('/../') || returnTo.endsWith('/..')) return '/dashboard';
  return returnTo;
}
```

**拦截 5+3 种攻击路径**: 绝对 URL（https/http）、javascript:、data:、protocol-relative（//）、path traversal（/../）、null/empty、CRLF 注入（通过 Next.js 框架层面处理）。

### 7.6 httpClient — 双保险场景明确

**文件**: `vibex-fronted/src/services/api/client.ts`

双保险触发场景：

| 场景 | 主路径 | 兜底路径 | 触发条件 |
|------|--------|---------|---------|
| **场景 1**: 有 cookie 但 middleware 读不到 | httpOnly cookie → middleware | Authorization header → API | SSR/Edge Runtime cookie 读取限制 |
| **场景 2**: cookie 未设置但 sessionStorage 有 | — | Bearer token → API | 登录成功但 cookie 未写入（dev 环境 Secure=false 时） |
| **场景 3**: Cookie 被部分清除 | 剩余 cookie | Bearer token | logout 只清了一个 cookie |

**场景 1 是主要保障场景**: httpClient 的 `Authorization: Bearer <token>` 拦截器在每次 API 请求时注入 token，即使 middleware 因为 Edge Runtime 限制无法正确传递 cookie，API 请求仍可认证。

---

## 8. 安全评估（修订）

| 威胁 | 缓解措施 | 剩余风险 | 决策 |
|------|---------|---------|------|
| XSS 读取 token | `httpOnly` cookie | 低 | ✅ 接受 |
| CSRF（GET 重定向） | `SameSite=Lax` | 低 | ✅ 接受（无状态变更） |
| **CSRF（POST action）** | SameSite=Lax **不够** | **中** | ⚠️ 需新增 CSRF token（见下方）|
| 开放重定向 | `validateReturnTo()` | 低 | ✅ 已有 8+ 拦截规则 |
| httpOnly cookie 无法前端清除 | 后端 logout 是唯一真实清除路径 | 低 | ✅ 接受（已在后端实现） |
| Cookie 跨域失效 | 环境变量 `COOKIE_DOMAIN` 配置 | 中 | ⚠️ 依赖部署拓扑确认 |

### CSRF 风险（新增，详细说明）

**当前评估偏低，需修正**:

GET 请求（页面导航）: `SameSite=Lax` 足够，浏览器会自动携带 cookie，GET 请求不改变服务端状态。

**⚠️ 潜在风险 — 敏感 POST action**:
如果 VibeX 后续有直接 POST 到受保护 API 的操作（如直接 `fetch('/api/canvas')` 而非通过 httpClient），`SameSite=Lax` 不阻止来自同站域的 POST 表单提交。

**缓解措施（推荐方案）**:
1. 所有写操作 API（POST/PUT/DELETE/PATCH）增加 SameSite=Strict Cookie 或 CSRF Token
2. 短期：在 `middleware.ts` 中对写操作增加 `Origin` / `Referer` 校验
3. 当前任务范围仅限登录/注册/登出，均为用户主动触发的 UI action，CSRF 风险相对较低

**Trade-off 命名 — CSRF 缓解的优先级**:
> 我们选择了 **短期接受 CSRF 中风险**（SameSite=Lax）而非立即实现 CSRF token。理由：当前涉及写操作的都是 UI 触发的 action（通过 httpClient），而非外部表单 POST。完整 CSRF token 实现需要额外的端点和状态管理，作为独立安全任务跟进（vibex-security-csrf-token）。

---

## 9. 测试策略

### 单元测试

| 文件 | 框架 | 覆盖范围 |
|------|------|---------|
| `middleware.test.ts` | Vitest | 4 场景（已登录/未登录/公开路径/受保护路径）|
| `validateReturnTo.test.ts` | Vitest | 12+5 TC（已有 + fuzzing 补充）|
| `login.test.ts` | Vitest | Set-Cookie header 断言 |
| `register.test.ts` | Vitest | Set-Cookie header 断言 |
| `logout.test.ts` | Vitest | 两个 cookie 清除断言 |
| `authStore.test.ts` | Vitest | logout 后两个 cookie 清除断言 |

### E2E 测试

```typescript
// auth-redirect.spec.ts
test('login → redirect to /canvas → cookie is httpOnly', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/canvas');
  expect(page.url()).toContain('/auth?returnTo=/canvas');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password123');
  await page.click('[type=submit]');
  await page.waitForURL('/canvas');
  const cookies = await page.context().cookies();
  const authCookie = cookies.find(c => c.name === 'auth_token');
  expect(authCookie?.httpOnly).toBe(true);
  expect(authCookie?.sameSite).toBe('Lax');
});

test('logout → both cookies cleared', async ({ page }) => {
  await loginAs(page);
  await logout(page);
  const cookies = await page.context().cookies();
  const authToken = cookies.find(c => c.name === 'auth_token');
  const authSession = cookies.find(c => c.name === 'auth_session');
  expect(authToken).toBeUndefined();
  expect(authSession).toBeUndefined();
});
```

---

## 10. 执行决策

- **决策**: 已采纳（v2）
- **执行项目**: vibex-auth-401-handling
- **执行日期**: 2026-04-13
- **变更**: v2 修复 coord 8 个 blocker

### 拒绝记录

| 选项 | 拒绝理由 |
|------|---------|
| 选项 B（纯前端） | XSS 风险不可接受 |
| 选项 C（移除 cookie 依赖） | 破坏性变更，超出 scope |
| 不清除 auth_session | 留后门，middleware 仍能读到旧 session |
| logout 不带 Secure 属性 | HTTPS 下 Secure cookie 清除不掉 |

---

*文档版本: v2 | Architect: architect | 2026-04-13*
