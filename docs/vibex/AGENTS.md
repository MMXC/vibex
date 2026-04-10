# AGENTS.md — VibeX 认证重定向项目编码规范

> **项目**: vibex
> **版本**: 1.0
> **日期**: 2026-04-11

---

## 1. 项目约束

### 1.1 变更范围（红线内）

本次迭代 **仅限** 以下文件：

| 文件 | 允许操作 |
|------|----------|
| `src/services/api/client.ts` | 修改 401 响应拦截器 |
| `src/hooks/useAuth.tsx` | 新增 `auth:401` 事件监听 |
| `src/app/auth/page.tsx` | 新增 `validateReturnTo()` + returnTo 逻辑 |
| `src/services/oauth/oauth.ts` | OAuth returnTo 透传 |
| `src/lib/__tests__/validateReturnTo.test.ts` | 新增（可创建） |
| `src/app/auth/page.test.tsx` | 扩展（可创建） |
| `src/hooks/__tests__/useAuth.test.tsx` | 扩展 |
| `tests/e2e/login-state-fix.spec.ts` | 新增（可创建） |
| `src/services/api/__tests__/client-auth-401.test.ts` | 新增（可创建） |

### 1.2 禁止变更范围

以下文件/模块 **不得修改**（本次迭代锁死）：

- `src/lib/api-retry.ts`（重试逻辑已有）
- `src/lib/circuit-breaker.ts`（熔断器已有）
- `src/services/api/modules/*.ts`（API 模块层已有）
- `src/stores/authStore.ts`（Zustand store，暂不接入本迭代）
- `src/components/oauth/OAuthConnectButton.tsx`（UI 组件，暂不修改）
- `src/lib/canvas/canvasLogger.ts`（日志系统已有）

### 1.3 技术栈锁定

| 技术 | 版本要求 | 约束理由 |
|------|----------|----------|
| Next.js | 16.2.0 | PRD 指定 |
| React | 19.x | Next.js 16.2 依赖 |
| TypeScript | strict | 非功能性要求 |
| Axios | ^1.x | 现有 httpClient 依赖 |
| Vitest | latest | 现有测试框架 |
| Playwright | latest | 现有 E2E 框架 |

---

## 2. 代码规范

### 2.1 AuthError 使用规范

```typescript
// ✅ 正确：在 client.ts 401 拦截器中抛出
const returnTo = window.location.pathname + window.location.search;
return Promise.reject(new AuthError('登录已过期，请重新登录', 401, returnTo));

// ❌ 错误：抛出普通 Error（丢失 isAuthError 和 returnTo）
return Promise.reject(new Error('登录已过期'));

// ❌ 错误：returnTo 格式不合法
new AuthError('...', 401, 'https://evil.com') // 禁止！
new AuthError('...', 401, '//evil.com')      // 禁止！
```

### 2.2 事件广播规范

```typescript
// ✅ 正确：使用 CustomEvent，payload 包含 returnTo
window.dispatchEvent(
  new CustomEvent('auth:401', { detail: { returnTo: '/canvas/project/123' } })
);

// ❌ 错误：不传 returnTo（无法恢复用户路径）
window.dispatchEvent(new CustomEvent('auth:401'));

// ❌ 错误：事件名不一致
window.dispatchEvent(new CustomEvent('unauthorized')); // 必须用 'auth:401'
```

### 2.3 Auth 页面守卫规范

```typescript
// ✅ 正确：在 useAuth useEffect 中检查
useEffect(() => {
  const handler = (e: Event) => {
    // Auth 页面守卫
    if (window.location.pathname === '/auth') {
      return; // 不跳转，避免循环
    }
    sessionStorage.setItem('auth_return_to', returnTo);
    router.push('/auth');
  };
  window.addEventListener('auth:401', handler);
  return () => window.removeEventListener('auth:401', handler);
}, [router]);

// ❌ 错误：忘记守卫，导致 /auth 循环
useEffect(() => {
  window.addEventListener('auth:401', handler); // 无 pathname 检查！
  // ...
}, []);
```

### 2.4 validateReturnTo 规范

**必须包含以下 5 种校验**（顺序敏感）：

```typescript
function validateReturnTo(returnTo: string | null): string {
  // 1. null / 空值
  if (!returnTo) return '/dashboard';
  // 2. 必须以 / 开头（防止 'dashboard' 或 'evil.com')
  if (!returnTo.startsWith('/')) return '/dashboard';
  // 3. 协议前缀（https://, http://, javascript:, data:）
  if (/^(https?|javascript:|data:)/i.test(returnTo)) return '/dashboard';
  // 4. 协议相对 URL（//evil.com）
  if (/^\/\//.test(returnTo)) return '/dashboard';
  // 5. 路径遍历（/../ 或 /.. 结尾）
  if (returnTo.includes('/../') || returnTo.endsWith('/..')) return '/dashboard';
  return returnTo;
}
```

### 2.5 logout 标记规范

```typescript
// logout 时必须设置标记
sessionStorage.setItem('auth_is_logout', '1');
await apiService.logout();
sessionStorage.removeItem('auth_token');
// ...
sessionStorage.removeItem('auth_is_logout'); // finally 中清理

// client.ts 拦截器中必须检查
const isLogoutAction = sessionStorage.getItem('auth_is_logout') === '1';
if (isLogoutAction) {
  sessionStorage.removeItem('auth_is_logout');
  // 不 dispatch auth:401
} else {
  // dispatch auth:401
}
```

### 2.6 类型规范

```typescript
// ✅ 正确：使用现有 AuthError 类型
import { AuthError } from '@/services/api/client';
throw new AuthError('Unauthorized', 401, '/canvas');

// ❌ 错误：any 类型
const returnTo: any = sessionStorage.getItem('auth_return_to');

// ❌ 错误：as any 绕过类型检查
router.push(returnTo as any);
```

---

## 3. 安全红线（🚨 绝对禁止）

### 🚨 红线 1: 禁止开放重定向

```
禁止实现任何未经 validateReturnTo() 校验的重定向逻辑
```

- ❌ `router.push(userControlledUrl)` — 未校验时禁止
- ❌ `window.location.href = userInput` — 禁止外部 URL 直接跳转
- ❌ `sessionStorage.setItem('auth_return_to', input)` — 不校验直接存
- ❌ `new AuthError('...', 401, userInput)` — 未校验的 returnTo
- ✅ 所有 returnTo 路径必须经过 `validateReturnTo()` 校验

### 🚨 红线 2: 禁止跳过 Auth 页面守卫

```
禁止移除 pathname === '/auth' 的守卫条件
```

- ❌ 为了"简化代码"删除守卫
- ❌ 在 auth/page.tsx 中触发 `dispatchEvent('auth:401')`
- ❌ 在 auth/page.tsx 中主动调用 `router.push('/auth')`

### 🚨 红线 3: 禁止混淆 logout 与 401

```
logout 和 401 必须是独立的处理路径，不能合并
```

- ❌ logout 后不清除 `auth_is_logout` 标记
- ❌ logout 时不清除 `auth_token`
- ❌ 401 拦截器不区分 `isLogoutAction`

### 🚨 红线 4: 禁止修改已有安全逻辑

```
现有 token 存储、跨标签页同步、API 错误转换逻辑不得改动
```

- ❌ 删除 `useAuth.tsx` 中的 `handleStorageChange`
- ❌ 删除 `client.ts` 中的 `transformError`
- ❌ 修改 `sessionStorage` vs `localStorage` 的 token 存储策略

---

## 4. Git 提交规范

### 4.1 Commit Message 格式

```
<type>(<scope>): <subject>

# 示例
feat(auth-redirect): add AuthError class with isAuthError and returnTo
feat(auth-redirect): dispatch auth:401 event on 401 response
feat(auth-redirect): listen auth:401 and redirect to /auth
feat(auth-redirect): add validateReturnTo whitelist validation
feat(auth-redirect): AuthForm reads returnTo after login success
fix(auth-redirect): add auth page guard to prevent redirect loop
test(auth-redirect): add E2E tests TC-004~TC-008
test(auth-redirect): add validateReturnTo unit tests
```

### 4.2 分支命名

```
feature/vibex-auth-redirect
fix/vibex-auth-redirect-xxx
test/vibex-auth-redirect-e2e
```

### 4.3 PR 规范

PR 必须包含：
- [ ] 关联的 Story ID（VibeX-401-1 等）
- [ ] 变更文件清单
- [ ] 新增/修改的测试用例说明
- [ ] 安全校验截屏（validateReturnTo 恶意 URL 测试通过）
- [ ] `pnpm build` + `pnpm vitest run` + `pnpm playwright test` 全绿

---

## 5. 代码审查清单（Reviewer 用）

### 5.1 必查项

- [ ] `client.ts` 401 拦截器抛出的是 `AuthError` 而非 `Error`
- [ ] `auth:401` 事件 payload 包含 `detail.returnTo`
- [ ] `useAuth.tsx` 中有 pathname === '/auth' 守卫
- [ ] `validateReturnTo()` 包含全部 5 种校验（null、以/开头、协议、//、../）
- [ ] logout 时设置了 `auth_is_logout` 标记
- [ ] sessionStorage key 名称正确：`auth_return_to`、`auth_is_logout`、`auth_token`
- [ ] `sessionStorage.removeItem('auth_return_to')` 在登录成功后被调用
- [ ] 新增代码无 `any` 类型
- [ ] `pnpm build` 通过
- [ ] Vitest 测试全绿

### 5.2 安全专项检查

- [ ] 无 `router.push(userInput)` 不经校验的调用
- [ ] `validateReturnTo` 测试覆盖 9 个恶意 case
- [ ] TC-008 E2E 测试通过（logout 不触发 redirect）
- [ ] `/auth` 循环测试在 E2E 中覆盖

### 5.3 PR 描述检查

- [ ] 关联了正确的 Story/Epic
- [ ] 说明清楚了为什么需要这些改动
- [ ] 更新了 changelog（如果需要）

---

*编码规范: ✅ 完成*
*Next: Dev 按规范实现 → Reviewer 按清单审查*
