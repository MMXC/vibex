# 实现计划：vibex-auth-401-handling（v2）

> **项目**: vibex-auth-401-handling
> **角色**: architect
> **日期**: 2026-04-13
> **状态**: v2（修复 8 个 blocker）

---

## 变更记录（v1 → v2）

| Blocker | 修复内容 |
|---------|---------|
| B1: 跨域拓扑未确认 | 新增第 3 节「部署拓扑策略」，环境变量 `COOKIE_DOMAIN` 控制 |
| B2: logout 缺 secure | logout 的 `cookies.set` 增加 `secure: process.env.NODE_ENV === 'production'` |
| B3: auth_session 未清理 | logout + authStore.logout 均增加清除 `auth_session` cookie |
| B4: TS 重复 imports | register/route.ts 移除未使用的 `getAuthUserFromRequest` import |
| B5: document.cookie 虚假安全感 | logout 实现说明增加局限性声明，明确 httpOnly cookie 清除依赖后端 |
| B6: CSRF 风险低估 | 新增 CSRF 风险分析，标记为 P1 安全任务待跟进 |
| B7: validateReturnTo 未提供 | 确认实现在 `auth/page.tsx`，文档引用路径已补全 |
| B8: httpClient 双保险场景不清晰 | 明确 3 种触发场景（见 architecture.md 7.6 节）|

---

## 1. Epic 概览

| Epic | 名称 | 工时 | 前置 |
|------|------|------|------|
| **Epic 1** | 后端 Cookie 设置 | 1.5h | 无 |
| **Epic 2** | 前端一致性 | 0.5h | Epic 1 |
| **Epic 3** | 测试覆盖 | 2.5h | Epic 1+2 |
| **Epic 4** | CSRF Token（安全增强） | — | P1，待独立任务 |
| **合计** | | **4.5h** | |

---

## 2. Epic 1: 后端 Cookie 设置

### Story 1.1: login 路由设置 httpOnly cookie

**文件**: `vibex-backend/src/app/api/v1/auth/login/route.ts`

**变更**:
```typescript
// 改前：
return NextResponse.json({ success: true, data: { token, user } });

// 改后：
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

**⚠️ 同步修复**: 移除顶部未使用的 import：
```typescript
// 删除这行（未使用）：
import { getAuthUser } from '@/lib/auth';
```

**AC 验收标准**:
- [x] **AC-1.1.1**: `expect(response.headers.get('set-cookie')).toMatch(/auth_token=.+; HttpOnly/i)` ✅
- [x] **AC-1.1.2**: `expect(response.headers.get('set-cookie')).toMatch(/SameSite=Lax/i)` ✅
- [x] **AC-1.1.3**: `expect(response.headers.get('set-cookie')).toMatch(/Max-Age=604800/i)` ✅
- [x] **AC-1.1.4**: 登录失败（401）不设置 cookie ✅
- [x] **AC-1.1.5**: `pnpm tsc --noEmit` 无编译错误 ✅

---

### Story 1.2: register 路由设置 httpOnly cookie

**文件**: `vibex-backend/src/app/api/v1/auth/register/route.ts`

**变更**: 同 S1.1（201 状态码保持），同时**移除未使用的 import**：
```typescript
// 删除（未使用）：
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
```

**AC 验收标准**:
- [x] **AC-1.2.1**: `expect(response.headers.get('set-cookie')).toMatch(/auth_token=.+; HttpOnly/i)` ✅
- [x] **AC-1.2.2**: 注册失败（409）不设置 cookie ✅
- [x] **AC-1.2.3**: `pnpm tsc --noEmit` 无编译错误 ✅

---

### Story 1.3: logout 路由清除两个 Cookie（含 Secure）

**文件**: `vibex-backend/src/app/api/v1/auth/logout/route.ts`

**变更**:
```typescript
const response = NextResponse.json({
  success: true,
  data: { message: 'Logged out successfully' },
});

// 清除 auth_token（含 Secure，HTTPS 环境必须）
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

**AC 验收标准**:
- [x] **AC-1.3.1**: `expect(response.headers.get('set-cookie')).toMatch(/auth_token=; Max-Age=0/i)` ✅
- [x] **AC-1.3.2**: `expect(response.headers.get('set-cookie')).toMatch(/auth_session=; Max-Age=0/i)` ✅
- [x] **AC-1.3.3**: logout 前有 Secure cookie → 清除响应也带 Secure（关键！）: `expect(setCookieClear).toMatch(/Secure/i)` 当 `NODE_ENV === 'production'` ✅
- [x] **AC-1.3.4**: 未登录用户 logout → 401，不设置 cookie ✅

---

## 3. Epic 2: 前端一致性

### Story 2.1: authStore logout 清理两个 Cookie

**文件**: `vibex-fronted/src/stores/authStore.ts`

**变更**:
```typescript
logout: () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('user_role');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    // 清除 auth_token cookie（httpOnly 部分由后端 logout 清除，前端处理残留）
    document.cookie = 'auth_token=; max-age=0; path=/';
    // 清除 auth_session cookie（middleware 也读此 cookie）
    document.cookie = 'auth_session=; max-age=0; path=/';
  }
  set({ token: null, user: null, isAuthenticated: false, isLoading: false });
},
```

**⚠️ 局限性声明**: `document.cookie` 无法删除 `httpOnly` cookie。httpOnly cookie 的真实清除完全由后端 logout 路由负责。此处清除行只处理非 httpOnly 残留。

**AC 验收标准**:
- [ ] **AC-2.1.1**: logout 后 `document.cookie` 不含 `auth_token=`
- [ ] **AC-2.1.2**: logout 后 `document.cookie` 不含 `auth_session=`
- [ ] **AC-2.1.3**: sessionStorage/localStorage 的 token 清除（原有行为保持）

### Story 2.2: httpClient（无需修改）

确认 `vibex-fronted/src/services/api/client.ts` 已有 `Authorization: Bearer <token>` 拦截器，3 种双保险场景见 architecture.md 7.6 节。

---

## 4. Epic 3: 测试覆盖

### Story 3.1: middleware 单元测试

**文件**: `vibex-fronted/src/__tests__/middleware.test.ts`

**覆盖场景**（8 TC）:

| TC | 输入 | 预期 |
|----|------|------|
| T1 | `GET /canvas` 无 cookie | 307 `/auth?returnTo=/canvas` |
| T2 | `GET /dashboard/subpath` 无 cookie | 307 `/auth?returnTo=/dashboard/subpath` |
| T3 | `GET /canvas` 有 auth_token cookie | 200 `next()` |
| T4 | `GET /canvas` 有 auth_session cookie | 200 `next()` |
| T5 | `GET /auth` 有 cookie 无 returnTo | 302 `/dashboard` |
| T6 | `GET /auth?returnTo=/canvas` 有 cookie | 302 `/canvas` |
| T7 | `GET /_next/static/file.js` | 200 放行 |
| T8 | `GET /api/auth/*` 无 cookie | 200 放行 |

### Story 3.2: validateReturnTo fuzzing（已有 12 TC，补充 5 TC）

**文件**: `vibex-fronted/src/app/auth/validateReturnTo.test.ts`

**补充 TC**:
- T13: null byte → `/dashboard`
- T14: 编码 traversal `/canvas/..%2F..` → `/dashboard`
- T15: 编码 // `%2f%2fevil.com` → `/dashboard`
- T16: 纯空格路径 → `/dashboard`
- T17: CRLF 注入 `\n` → `/dashboard`

### Story 3.3: E2E 登录跳转（3 scenarios）

**文件**: `vibex-fronted/tests/e2e/auth-redirect.spec.ts`

```
TC-E2E-1: 完整登录跳转
  1. 清除所有 cookies + storage
  2. 访问 /canvas → /auth?returnTo=/canvas
  3. 登录 → 回到 /canvas
  4. 验证 auth_token cookie httpOnly=true

TC-E2E-2: logout 清除两个 cookie
  1. 登录
  2. logout
  3. 验证 auth_token + auth_session 均不存在于 cookies

TC-E2E-3: 登出后访问受保护页 → 重新跳转
  1. 已登录
  2. logout
  3. 访问 /canvas → /auth?returnTo=/canvas
```

---

## 5. 工期甘特图

```
Day 1          Day 2
|--------------|--------------|
[S1.1 login]   [S1.2 register] [S1.3 logout]  ← Epic 1 (1.5h，并行)
              ↑
              [S2.1 authStore]                ← Epic 2 (0.5h)
                           ↑
              [S3.1 middleware test]          ← Epic 3 (1.0h)
              [S3.2 validateReturnTo fuzzing]  ← Epic 3 (0.5h)
              [S3.3 E2E auth redirect]         ← Epic 3 (1.0h)
```

---

## 6. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| R1: 跨域 cookie 设置失败 | 中 | 高 | 环境变量 `COOKIE_DOMAIN` 配置，默认同域 |
| R2: HTTPS 下 Secure cookie 清除不掉 | 低 | 高 | logout 的 cookies.set 同步加 Secure 属性 |
| R3: auth_session 残留后门 | 低 | 高 | logout 清除两个 cookie，middleware 同时检查 |
| R4: document.cookie 清除无效 | 中 | 低 | 接受（httpOnly 清除依赖后端，前端清理是额外保险） |
| R5: TS 编译失败 | 低 | 高 | 先 `pnpm tsc --noEmit`，移除重复 imports |
| R6: CSRF 风险 | 低 | 中 | SameSite=Lax + P1 安全任务跟进 |

---

## 7. 执行决策

- **决策**: 已采纳（v2）
- **执行项目**: vibex-auth-401-handling
- **执行日期**: 2026-04-13

---

*文档版本: v2 | Architect: architect | 2026-04-13*
