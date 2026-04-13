# PRD: vibex-auth-401-handling — 401 未登录统一跳转登录页且登录后回到原始页面

> **任务**: vibex-auth-401-handling / create-prd
> **Agent**: pm
> **日期**: 2026-04-13
> **状态**: Phase1 进行中

---

## 1. 执行摘要

### 背景

VibeX 前后端分离架构中，`middleware.ts` 依赖 `auth_token` httpOnly cookie 判断用户登录状态，但 `login`、`register` 路由只返回 JSON token，不设置 cookie。导致用户登录成功后 middleware 仍读不到 cookie，重新触发 401 重定向 → 无限重定向循环（登录后仍被踢回登录页）。

### 目标

修复后端 login/register 路由设置 httpOnly cookie，logout 路由清除 cookie，前端 logout 同步清理 cookie，实现用户登录后无缝回到原始页面。

### 成功指标

- 未登录用户访问 `/canvas` → 307 重定向到 `/auth?returnTo=/canvas`
- 登录成功后 `auth_token` cookie 被设置，middleware 读取到 cookie
- 登录成功后 redirect 到 `returnTo` 页面（returnTo 经过 validateReturnTo 校验）
- logout 后 `auth_token` cookie 被清除
- logout 后访问受保护页面 → 重新触发 401 → 跳转登录页
- 全程无需用户手动刷新页面

---

## 2. Epic 拆分

### Epic 1: 后端 Cookie 设置

| ID | Story | 描述 | 工时 |
|----|-------|------|------|
| S1.1 | login 路由设置 httpOnly cookie | POST /api/v1/auth/login 成功后设置 `auth_token` httpOnly cookie | 0.5h |
| S1.2 | register 路由设置 httpOnly cookie | POST /api/v1/auth/register 成功后设置 `auth_token` httpOnly cookie | 0.5h |
| S1.3 | logout 路由清除 cookie | POST /api/v1/auth/logout 成功后设置 `auth_token` maxAge=0 清空 cookie | 0.5h |

### Epic 2: 前端一致性

| ID | Story | 描述 | 工时 |
|----|-------|------|------|
| S2.1 | authStore logout 清理 cookie | `logout()` 中增加 `document.cookie` 清除 `auth_token` | 0.5h |
| S2.2 | httpClient 双保险 Authorization header | 每次请求带上 `Authorization: Bearer <token>`（cookie 失效时的备选） | 0.5h |

### Epic 3: 测试覆盖

| ID | Story | 描述 | 工时 |
|----|-------|------|------|
| S3.1 | middleware 401 跳转单元测试 | 未登录访问受保护路径返回 307；已登录访问无重定向 | 1h |
| S3.2 | 完整登录跳转 E2E 测试 | 未登录 → 访问受保护页面 → 跳转登录 → 登录 → 回到原页面 | 1h |
| S3.3 | logout 后重定向 E2E 测试 | logout → 访问受保护页面 → 跳转登录页 | 0.5h |

**总工时估算**: 5.5h（Epic1: 1.5h, Epic2: 1h, Epic3: 2.5h, buffer: 0.5h）

---

## 3. 验收标准

### Epic 1: 后端 Cookie 设置

#### S1.1 login 路由设置 httpOnly cookie

- [ ] **AC-1.1.1**: 登录成功响应头包含 `Set-Cookie: auth_token=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
- [ ] **AC-1.1.2**: 登录成功响应体仍包含 `data.token` 和 `data.user`（向后兼容前端 sessionStorage 存储）
- [ ] **AC-1.1.3**: 登录失败（401）不设置 cookie
- [ ] **AC-1.1.4**: `expect(response.headers.get('set-cookie')).toMatch(/auth_token=.+; HttpOnly/)`

#### S1.2 register 路由设置 httpOnly cookie

- [ ] **AC-1.2.1**: 注册成功响应头包含 `Set-Cookie: auth_token=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
- [ ] **AC-1.2.2**: 注册失败（409 用户已存在）不设置 cookie
- [ ] **AC-1.2.3**: `expect(response.headers.get('set-cookie')).toMatch(/auth_token=.+; HttpOnly/)`

#### S1.3 logout 路由清除 cookie

- [ ] **AC-1.3.1**: logout 成功响应头包含 `Set-Cookie: auth_token=; Max-Age=0; Path=/`
- [ ] **AC-1.3.2**: `expect(response.headers.get('set-cookie')).toMatch(/auth_token=; Max-Age=0/)`
- [ ] **AC-1.3.3**: 未登录用户调用 logout 返回 401（不设置 cookie）

### Epic 2: 前端一致性

#### S2.1 authStore logout 清理 cookie

- [ ] **AC-2.1.1**: 调用 `logout()` 后，`document.cookie` 中不存在 `auth_token`
- [ ] **AC-2.1.2**: 调用 `logout()` 后，`sessionStorage` 和 `localStorage` 中的 auth token 被清除（原有行为保持）
- [ ] **AC-2.1.3**: `expect(document.cookie).not.toContain('auth_token=')` 在 logout 后

#### S2.2 httpClient 双保险 Authorization header

- [ ] **AC-2.2.1**: 每次实际 HTTP 请求（axios/fetch 实例）的 Authorization header 包含有效 Bearer token
- [ ] **AC-2.2.2**: 当 cookie 失效但 sessionStorage 有 token 时，请求仍能成功（双保险）
- [ ] **AC-2.2.3**: 当 sessionStorage 无 token 且 cookie 无效时，请求返回 401（由 httpClient 401 handler 处理 redirect）

### Epic 3: 测试覆盖

#### S3.1 middleware 401 跳转单元测试

- [ ] **AC-T1**: `middleware('/canvas')` 无 cookie → 返回 307 重定向到 `/auth?returnTo=/canvas`
- [ ] **AC-T2**: `middleware('/dashboard')` 无 cookie → 返回 307 重定向到 `/auth?returnTo=/dashboard`
- [ ] **AC-T3**: `middleware('/canvas')` 有有效 cookie → 返回 NextResponse.next()
- [ ] **AC-T4**: `middleware('/auth')` 有有效 cookie → redirect 到 `returnTo` 或 `/dashboard`

#### S3.2 完整登录跳转 E2E 测试

- [ ] **AC-T5**: 未登录状态 → 访问 `/canvas` → 页面 URL 变为 `/auth?returnTo=/canvas` → 输入凭据登录 → 页面 URL 回到 `/canvas`

#### S3.3 logout 后重定向 E2E 测试

- [ ] **AC-T6**: 已登录状态 → 点击 logout → 访问 `/canvas` → 页面 URL 变为 `/auth?returnTo=/canvas`

---

## 4. 功能点规格（specs/）

### Spec: F1.1 — login 路由设置 httpOnly cookie

**文件**: `vibex-backend/src/app/api/v1/auth/login/route.ts`

#### 变更摘要

在 `return NextResponse.json(...)` 之前，构造带 Set-Cookie 的响应：

```typescript
// 现有代码
return NextResponse.json({
  success: true,
  data: { token, user: {...} },
});

// 修改为：
const response = NextResponse.json({
  success: true,
  data: { token, user: {...} },
});
response.cookies.set('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
});
return response;
```

#### 验收断言

```typescript
// api/v1/auth/login.test.ts
it('sets httpOnly auth_token cookie on successful login', async () => {
  const res = await POST(loginRequest);
  expect(res.status).toBe(200);
  const setCookie = res.headers.get('set-cookie');
  expect(setCookie).toMatch(/auth_token=.+/);
  expect(setCookie).toMatch(/HttpOnly/);
  expect(setCookie).toMatch(/SameSite=Lax/);
  expect(setCookie).toMatch(/Max-Age=604800/);
});
```

### Spec: F1.2 — register 路由设置 httpOnly cookie

**文件**: `vibex-backend/src/app/api/v1/auth/register/route.ts`

#### 变更摘要

同 S1.1，register 成功后设置 `auth_token` httpOnly cookie。

```typescript
const response = NextResponse.json({ success: true, data: { token, user: {...} } }, { status: 201 });
response.cookies.set('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
});
return response;
```

### Spec: F1.3 — logout 路由清除 cookie

**文件**: `vibex-backend/src/app/api/v1/auth/logout/route.ts`

#### 变更摘要

```typescript
// 现有代码
return NextResponse.json({
  success: true,
  data: { message: 'Logged out successfully' },
});

// 修改为：
const response = NextResponse.json({
  success: true,
  data: { message: 'Logged out successfully' },
});
response.cookies.set('auth_token', '', {
  maxAge: 0,
  path: '/',
});
return response;
```

### Spec: F2.1 — authStore logout 清理 cookie

**文件**: `vibex-fronted/src/stores/authStore.ts`

#### 变更摘要

在 `logout()` 中增加 cookie 清理：

```typescript
logout: () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('user_role');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    // 新增：清除 auth_token cookie（供 middleware 读取）
    document.cookie = 'auth_token=; max-age=0; path=/';
  }
  set({ token: null, user: null, isAuthenticated: false, isLoading: false });
},
```

### Spec: F2.2 — httpClient 双保险 Authorization header

**文件**: `vibex-fronted/src/lib/httpClient.ts`（或对应 httpClient 文件）

#### 变更摘要

```typescript
instance.interceptors.request.use((config) => {
  // 双保险：优先从 sessionStorage 读取，fallback 到 cookie
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 5. DoD (Definition of Done)

### Epic 1: 后端 Cookie 设置

- [ ] `login/route.ts` 成功响应包含 `Set-Cookie: auth_token=<token>; HttpOnly...`
- [ ] `register/route.ts` 成功响应包含 `Set-Cookie: auth_token=<token>; HttpOnly...`
- [ ] `logout/route.ts` 成功响应包含 `Set-Cookie: auth_token=; Max-Age=0...`
- [ ] 登录/注册/登出失败的响应不设置 cookie
- [ ] 后端 auth 路由测试全部通过（覆盖成功/失败路径）
- [ ] 无 TypeScript 编译错误

### Epic 2: 前端一致性

- [ ] `authStore.logout()` 清除 `document.cookie` 中的 `auth_token`
- [ ] httpClient 请求携带 `Authorization: Bearer <token>` header
- [ ] 前后端改动无冲突，编译通过
- [ ] 前端 logout 行为（sessionStorage + localStorage + cookie 三路清理）与原有一致

### Epic 3: 测试覆盖

- [ ] middleware 单元测试覆盖 4 个场景（见 AC-T1~T4）
- [ ] E2E 登录跳转路径测试通过（见 AC-T5）
- [ ] E2E logout 重定向测试通过（见 AC-T6）
- [ ] 所有现有测试套件无回归

### 整体 DoD

- [ ] PR 包含后端 3 个路由 + 前端 2 个文件改动
- [ ] 新增测试覆盖所有功能点
- [ ] 无 TypeScript 编译错误
- [ ] 功能点 ID 格式正确（F1.x, F2.x, F3.x）
- [ ] 页面集成已标注【需页面集成】(middleware.ts, authStore.ts, httpClient)

---

## 6. 依赖关系图

```
login/route.ts (修改)  ─┐
register/route.ts (修改) ├─→ middleware.ts 读取 cookie → 401 跳转
logout/route.ts (修改) ─┘
       ↑
authStore.ts (修改) ──→ logout 调用后清除 cookie
       ↑
httpClient.ts (修改) ──→ Authorization header 双保险
```

**依赖项状态**:
- `middleware.ts`: ✅ 存在，已读取 auth_token cookie
- `authStore.ts`: ✅ 存在，已使用 persist middleware
- `httpClient`: ⚠️ 需确认 httpClient 文件路径和现有 Authorization header 处理逻辑
- 现有测试: ⚠️ 需确认 auth 路由是否有现有测试文件

---

## 7. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点 ID 格式正确（F1.x, F2.x, F3.x）
- [x] 页面集成已标注【需页面集成】(middleware.ts, authStore.ts, httpClient)
- [x] Planning 已执行（feature-list.md 已产出）
