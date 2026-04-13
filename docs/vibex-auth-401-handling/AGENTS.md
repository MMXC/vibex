# 研发指令：vibex-auth-401-handling（v2）

> **项目**: vibex-auth-401-handling
> **角色**: architect
> **日期**: 2026-04-13
> **状态**: v2（修复 8 个 blocker）

---

## 1. 变更摘要

**目标**: 后端 login/register 设置 httpOnly cookie，logout 清除两个 cookie（含 Secure 属性），前端 logout 同步清理。

**约束**:
1. 无新增依赖
2. 响应体不变
3. 两个 cookie 均需清理（auth_token + auth_session）
4. logout 的 Set-Cookie 必须带 Secure（HTTPS 下生效）
5. 移除 TS 重复 imports
6. TypeScript 编译通过

---

## 2. 代码修改清单

### 2.1 login/route.ts

**文件**: `vibex-backend/src/app/api/v1/auth/login/route.ts`

**变更 1 — 移除重复 import**:
```diff
- import { hashPassword, verifyPassword, generateToken, getAuthUser } from '@/lib/auth';
+ import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
```
`getAuthUser` 未被使用。

**变更 2 — 设置 httpOnly cookie**:
```diff
  return NextResponse.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, ... },
    },
  });
+ const response = NextResponse.json({
+   success: true,
+   data: {
+     token,
+     user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, ... },
+   },
+ });
+ response.cookies.set('auth_token', token, {
+   httpOnly: true,
+   secure: process.env.NODE_ENV === 'production',
+   sameSite: 'lax',
+   maxAge: 60 * 60 * 24 * 7,
+   path: '/',
+   ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
+ });
+ return response;
- return NextResponse.json({...});
```

**验证**:
```bash
curl -v -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' 2>&1 | grep -i set-cookie
# 期望: set-cookie: auth_token=...; HttpOnly; SameSite=Lax; Max-Age=604800
```

---

### 2.2 register/route.ts

**文件**: `vibex-backend/src/app/api/v1/auth/register/route.ts`

**变更 1 — 移除重复 import**:
```diff
- import { getAuthUserFromRequest } from '@/lib/authFromGateway';
  // （此 import 未使用，删除）
```

**变更 2 — 设置 httpOnly cookie**（同 login，status 201）:
```diff
  return NextResponse.json({ success: true, data: { token, user: {...} } }, { status: 201 });
+ const response = NextResponse.json({ success: true, data: { token, user: {...} } }, { status: 201 });
+ response.cookies.set('auth_token', token, {
+   httpOnly: true,
+   secure: process.env.NODE_ENV === 'production',
+   sameSite: 'lax',
+   maxAge: 60 * 60 * 24 * 7,
+   path: '/',
+   ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
+ });
+ return response;
```

---

### 2.3 logout/route.ts

**文件**: `vibex-backend/src/app/api/v1/auth/logout/route.ts`

**变更 — 清除两个 Cookie（含 Secure）**:
```diff
  return NextResponse.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
+ const response = NextResponse.json({
+   success: true,
+   data: { message: 'Logged out successfully' },
+ });
+ // 清除 auth_token（含 Secure，HTTPS 下必须）
+ response.cookies.set('auth_token', '', {
+   maxAge: 0,
+   path: '/',
+   secure: process.env.NODE_ENV === 'production',
+   ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
+ });
+ // 清除 auth_session（middleware 也读此 cookie，必须清理）
+ response.cookies.set('auth_session', '', {
+   maxAge: 0,
+   path: '/',
+   secure: process.env.NODE_ENV === 'production',
+   ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
+ });
+ return response;
- return NextResponse.json({...});
```

**⚠️ 关键点**: `secure` 属性必须加。HTTPS 环境下带 `Secure` 属性设置的 cookie，必须带 `Secure` 才能清除。

---

### 2.4 authStore.ts

**文件**: `vibex-fronted/src/stores/authStore.ts`

**变更 — logout 清理两个 cookie**:
```diff
  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_id');
      sessionStorage.removeItem('user_role');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
+     // 清除 auth_token cookie（httpOnly 部分由后端 logout 清除，前端处理残留）
+     document.cookie = 'auth_token=; max-age=0; path=/';
+     // 清除 auth_session cookie（middleware 也读此 cookie）
+     document.cookie = 'auth_session=; max-age=0; path=/';
    }
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },
```

**⚠️ document.cookie 局限性**: 只能删除非 httpOnly cookie。httpOnly cookie 的真实清除依赖后端 logout 路由（`Set-Cookie: auth_token=; Max-Age=0`）。前端这行只处理残留。

---

### 2.5 httpClient（无需修改）

`vibex-fronted/src/services/api/client.ts` 的 `Authorization: Bearer <token>` 拦截器已存在，双保险 3 场景见 architecture.md 7.6 节。

---

### 2.6 validateReturnTo（无需修改）

实现在 `vibex-fronted/src/app/auth/page.tsx`，无需修改。

---

## 3. 测试用例清单

### 3.1 单元测试（6 个文件）

| 文件 | 框架 | 数量 | 关键断言 |
|------|------|------|---------|
| `login.test.ts` | Vitest | 3 TC | Set-Cookie 含 HttpOnly/SameSite/Max-Age |
| `register.test.ts` | Vitest | 3 TC | 同上，409 不设 cookie |
| `logout.test.ts` | Vitest | 4 TC | 两个 cookie 清除，含/不含 Secure 场景 |
| `authStore.test.ts` | Vitest | 2 TC | logout 后两个 document.cookie 不含 auth |
| `middleware.test.ts` | Vitest | 8 TC | 307 + 4 场景 |
| `validateReturnTo.test.ts` | Vitest | 17 TC | 12 已有 + 5 fuzzing |

### 3.2 E2E 测试

**文件**: `vibex-fronted/tests/e2e/auth-redirect.spec.ts`（新建）

```
TC-E2E-1: 登录 → 跳转 → httpOnly cookie
TC-E2E-2: logout → 两个 cookie 均清除
TC-E2E-3: logout → 访问受保护页 → 重新跳转
```

---

## 4. 审查检查单

### 功能验收（10 项）

- [ ] login 成功响应包含 `Set-Cookie: auth_token=...; HttpOnly`
- [ ] register 成功响应包含 `Set-Cookie: auth_token=...; HttpOnly`
- [ ] logout 响应包含 `Set-Cookie: auth_token=; Max-Age=0`
- [ ] logout 响应包含 `Set-Cookie: auth_session=; Max-Age=0`
- [ ] logout 的 Set-Cookie 带 `Secure`（prod 环境）
- [ ] authStore logout 清理 `auth_session` cookie（document.cookie）
- [ ] 未登录访问 `/canvas` → 307 → `/auth?returnTo=/canvas`
- [ ] 登录成功 → 回到 returnTo 页面
- [ ] logout 后访问 `/canvas` → 重新 307 跳转
- [ ] `validateReturnTo` 拦截绝对 URL（已测试）

### 回归检查（6 项）

- [ ] `pnpm build` 无错误
- [ ] `pnpm tsc --noEmit` 无 TS 错误（无重复 imports）
- [ ] 现有 E2E 测试无回归
- [ ] httpClient Authorization header 仍然有效（双保险）
- [ ] authStore persist 行为不变（sessionStorage）
- [ ] logout 路由仍返回 401 给未登录用户

### 性能检查（4 项）

- [ ] Set-Cookie header < 200 bytes
- [ ] middleware 读 cookie 路径不变（O(1)）
- [ ] logout 响应体大小不变
- [ ] 无新增网络请求

### 安全检查（6 项）

- [ ] `httpOnly: true`（防 XSS 读取 token）
- [ ] `secure: true`（prod 环境，防中间人）
- [ ] `sameSite: 'lax'`（防部分 CSRF）
- [ ] `validateReturnTo` 拦截开放重定向（12+ TC）
- [ ] 两个 cookie 均在 logout 时清除（无后门）
- [ ] CSRF 风险已评估（当前 SameSite=Lax，详见 architecture.md）

### 代码质量检查（6 项）

- [ ] login/register 的 `cookies.set` 使用相同的 cookie 配置
- [ ] logout 两个 cookie 使用相同的清除配置
- [ ] `COOKIE_DOMAIN` 环境变量向后兼容（undefined 时同域）
- [ ] `logout` 的 `secure` 属性与 login/register 保持一致
- [ ] authStore logout 的 `document.cookie` 局限性已在注释中说明
- [ ] 无硬编码的 token/secret

---

## 5. 提交规范

```
fix(auth): E1 - set httpOnly auth_token cookie in login/register/logout

- login/route.ts: add Set-Cookie: auth_token (HttpOnly; SameSite=Lax; Max-Age=604800)
- register/route.ts: same as login (201)
- logout/route.ts: clear auth_token + auth_session with Secure (HTTPS required)
- authStore.ts: logout() clears document.cookie for both auth tokens
- Remove unused imports (getAuthUser, getAuthUserFromRequest)
- Add COOKIE_DOMAIN env var for cross-subdomain deployment
- E1 Epic 1/2/3 completed

Fixes: vibex-auth-401-handling infinite redirect loop
Closes: #auth-cookie-issue
```

---

## 6. 关键参考文件

| 文件 | 操作 |
|------|------|
| `vibex-fronted/src/middleware.ts` | 只读，不改 |
| `vibex-fronted/src/stores/authStore.ts` | 改：logout 加两个 cookie 清除 |
| `vibex-fronted/src/services/api/client.ts` | 不改（双保险已存在）|
| `vibex-fronted/src/app/auth/page.tsx` | 不改（validateReturnTo 已实现）|
| `vibex-backend/src/app/api/v1/auth/login/route.ts` | 改：Set-Cookie + 移除重复 import |
| `vibex-backend/src/app/api/v1/auth/register/route.ts` | 改：Set-Cookie + 移除重复 import |
| `vibex-backend/src/app/api/v1/auth/logout/route.ts` | 改：清除两个 cookie + Secure 属性 |
