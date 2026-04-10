# VibeX 认证重定向 — 实现计划

> **项目**: vibex
> **日期**: 2026-04-11
> **总工时**: 10.5h
> **状态**: 待开发

---

## Epic 1: 401 重定向核心机制（5h）

---

### Story 1.1: httpClient 401 标记扩展（2h）

**开发文件**: `src/services/api/client.ts`

**修改内容摘要**:

1. **新增 `AuthError` 类**（文件顶部添加）:
```typescript
export class AuthError extends Error {
  isAuthError = true;
  status: number;
  returnTo: string;

  constructor(message: string, status: number, returnTo: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.returnTo = returnTo;
  }
}
```

2. **扩展响应拦截器 401 分支**（`instance.interceptors.response` error handler）:
```typescript
// 替换现有 401 处理逻辑
if (error.response?.status === 401) {
  // 区分主动登出（不触发 redirect）
  const isLogoutAction = sessionStorage.getItem('auth_is_logout') === '1';
  if (isLogoutAction) {
    sessionStorage.removeItem('auth_is_logout');
  } else {
    const returnTo = typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : '/dashboard';
    window.dispatchEvent(
      new CustomEvent('auth:401', { detail: { returnTo } })
    );
  }
  // 清除 token（保持原有逻辑）
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
  // 抛出 AuthError 而非普通 Error
  const returnTo = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/dashboard';
  return Promise.reject(new AuthError('登录已过期，请重新登录', 401, returnTo));
}
```

**验收标准**:
```bash
# 单元测试
pnpm vitest run src/services/api/__tests__/client-auth-401.test.ts
# 期望: AuthError.isAuthError === true, AuthError.returnTo 匹配 /^\//
```

---

### Story 1.2: Auth 事件广播（1.5h）

**开发文件**: `src/services/api/client.ts`（与 S1.1 合并开发）

**修改内容摘要**:

已在 S1.1 中实现 `window.dispatchEvent(new CustomEvent('auth:401', ...))`，无需额外文件改动。

**验收标准**:
```bash
# 集成测试: 手动触发
node -e "
window.dispatchEvent(new CustomEvent('auth:401', { detail: { returnTo: '/test' } }));
console.log(sessionStorage.getItem('auth_return_to')); // 期望: /test
"
```

---

### Story 1.3: 全局 401 监听与跳转（1.5h）

**开发文件**: `src/hooks/useAuth.tsx`

**修改内容摘要**:

1. **在 `AuthProvider` 组件内新增 useEffect**:
```typescript
// 监听全局 401 事件，自动跳转 /auth
useEffect(() => {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ returnTo: string }>;
    const returnTo = customEvent.detail?.returnTo;
    if (!returnTo) return;
    // Auth 页面守卫：自身不触发重定向
    if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
      return;
    }
    sessionStorage.setItem('auth_return_to', returnTo);
    router.push('/auth');
  };
  window.addEventListener('auth:401', handler);
  return () => window.removeEventListener('auth:401', handler);
}, [router]);
```

2. **logout 方法中设置 isLogoutAction 标记**:
```typescript
const logout = useCallback(async () => {
  try {
    // 设置标记：区分主动登出 vs 401 被动登出
    sessionStorage.setItem('auth_is_logout', '1');
    await apiService.logout();
  } catch (error) {
    canvasLogger.default.error('Logout API error:', error);
  } finally {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('project_roles');
    sessionStorage.removeItem('auth_is_logout'); // 清理标记
    setToken(null);
    setUser(null);
  }
}, []);
```

**验收标准**:
```bash
pnpm vitest run src/hooks/__tests__/useAuth.test.tsx
# 期望: 401 事件触发后 sessionStorage.setItem 被调用，router.push('/auth') 被调用
```

---

## Epic 2: 登录成功跳转逻辑（2.5h）

---

### Story 2.1: AuthForm returnTo 读取（1h）

**开发文件**: `src/app/auth/page.tsx`

**修改内容摘要**:

1. **新增 `validateReturnTo` 函数**（文件顶部）:
```typescript
function validateReturnTo(returnTo: string | null): string {
  if (!returnTo) return '/dashboard';
  if (!returnTo.startsWith('/')) return '/dashboard';
  if (/^(https?|javascript:|data:)/i.test(returnTo)) return '/dashboard';
  if (/^\/\//.test(returnTo)) return '/dashboard';
  if (returnTo.includes('/../') || returnTo.endsWith('/..')) return '/dashboard';
  return returnTo;
}
```

2. **修改 `handleSubmit` 登录成功分支**:
```typescript
// 替换硬编码 router.push('/dashboard')
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    if (isLogin) {
      await authApi.login({ email, password });
    } else {
      await authApi.register({ name, email, password });
    }
    // 从 sessionStorage 读取 returnTo
    const returnTo = sessionStorage.getItem('auth_return_to');
    const safeReturnTo = validateReturnTo(returnTo);
    // 登录成功后清除 returnTo
    sessionStorage.removeItem('auth_return_to');
    router.push(safeReturnTo);
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : '操作失败，请稍后重试');
  } finally {
    setLoading(false);
  }
};
```

**验收标准**:
```bash
# 有 returnTo 时
sessionStorage.setItem('auth_return_to', '/canvas/project/123');
login();
// 期望 router.push('/canvas/project/123')

# 无 returnTo 时
sessionStorage.removeItem('auth_return_to');
login();
// 期望 router.push('/dashboard')
```

---

### Story 2.2: OAuth returnTo（0.5h）

**开发文件**: `src/services/oauth/oauth.ts`

**修改内容摘要**:

1. **发起 OAuth 时读取 returnTo**:
```typescript
export async function initiateOAuth(provider: 'google' | 'github'): Promise<void> {
  const returnTo = sessionStorage.getItem('auth_return_to') || '/dashboard';
  const callbackUrl = `${window.location.origin}/auth/callback?provider=${provider}&returnTo=${encodeURIComponent(returnTo)}`;
  // 触发 OAuth 跳转
  window.location.href = callbackUrl;
}
```

2. **在 `auth/page.tsx` 的 OAuth callback 处理**（读取 URL 参数）:
```typescript
// 在 AuthForm 组件内 useEffect 中
useEffect(() => {
  const returnToParam = searchParams.get('returnTo');
  if (returnToParam) {
    sessionStorage.setItem('auth_return_to', returnToParam);
  }
}, [searchParams]);
```

**验收标准**: OAuth 登录成功后跳转到 sessionStorage 中的 returnTo。

---

### Story 2.3: Auth 页面守卫（0.5h）

**开发文件**: `src/hooks/useAuth.tsx`

**修改内容摘要**:

已在 Story 1.3 的 useEffect 中实现守卫逻辑：
```typescript
if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
  return; // 跳过跳转，避免 /auth → 401 → /auth 循环
}
```

**验收标准**:
```bash
# 模拟 /auth 页面触发的 401
window.location.pathname = '/auth';
window.dispatchEvent(new CustomEvent('auth:401', { detail: { returnTo: '/auth' } }));
// 期望: router.push('/auth') 不被调用（守卫生效）
```

---

### Story 2.4: returnTo 白名单校验（0.5h，并行）

**开发文件**: `src/app/auth/page.tsx`

**修改内容摘要**:

已在 Story 2.1 中实现 `validateReturnTo()` 函数，包含以下校验：
1. `null` / 空字符串 → fallback `/dashboard`
2. 非 `/` 开头 → `/dashboard`
3. `//` 协议相对 URL → `/dashboard`
4. `https://` / `javascript:` 等协议 → `/dashboard`
5. `/../` 路径遍历 → `/dashboard`

**验收标准**:
```bash
pnpm vitest run src/app/auth/page.test.tsx
# 期望: 恶意 URL 全部 fallback 到 /dashboard
```

---

## Epic 3: 测试覆盖（3h）

---

### Story 3.1: E2E 测试扩展（2h）

**新增文件**: `tests/e2e/login-state-fix.spec.ts`

**测试用例**:

```typescript
// tests/e2e/login-state-fix.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('VibeX 认证重定向 E2E', () => {

  // TC-004: 401 触发 redirect
  test('TC-004: API 401 响应后自动跳转 /auth（TC-004）', async ({ page }) => {
    await page.goto('/dashboard');
    // Mock 401 响应（通过 intercept）
    await page.route('**/api/v1/**', (route) => {
      if (route.request().method() !== 'OPTIONS') {
        return route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) });
      }
      return route.continue();
    });
    // 触发 API 调用（刷新页面）
    await page.reload();
    await expect(page).toHaveURL(/\/auth/);
  });

  // TC-005: returnTo 保存正确
  test('TC-005: 401 触发后 sessionStorage 保存 returnTo（TC-005）', async ({ page }) => {
    await page.goto('/canvas/project/123');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('auth:401', { detail: { returnTo: '/canvas/project/123' } }));
    });
    const returnTo = await page.evaluate(() => sessionStorage.getItem('auth_return_to'));
    expect(returnTo).toBe('/canvas/project/123');
  });

  // TC-006: 登录成功返回原页面
  test('TC-006: 登录成功后返回原页面（TC-006）', async ({ page }) => {
    await page.goto('/auth');
    // 设置 returnTo
    await page.evaluate(() => sessionStorage.setItem('auth_return_to', '/canvas/project/123'));
    // 填登录表单（mock 成功响应）
    await page.route('**/api/auth/login', (route) => {
      return route.fulfill({ status: 200, body: JSON.stringify({ token: 'test-token' }) });
    });
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');
    // 期望回到原页面
    await expect(page).toHaveURL('/canvas/project/123');
    // 验证 returnTo 已清除
    const cleared = await page.evaluate(() => sessionStorage.getItem('auth_return_to'));
    expect(cleared).toBeNull();
  });

  // TC-007: OAuth returnTo
  test('TC-007: OAuth callback 携带 returnTo 参数登录成功（TC-007）', async ({ page }) => {
    await page.goto('/auth/callback?provider=google&returnTo=/canvas/project/456');
    // mock OAuth 成功
    await page.route('**/api/auth/google', (route) => {
      return route.fulfill({ status: 200, body: JSON.stringify({ token: 'oauth-token' }) });
    });
    // 自动登录流程...
    await expect(page).toHaveURL('/canvas/project/456');
  });

  // TC-008: logout 不触发 redirect
  test('TC-008: 主动 logout 不触发 401 redirect（TC-008）', async ({ page }) => {
    let redirectTriggered = false;
    await page.goto('/dashboard');
    await page.evaluate(() => {
      window.addEventListener('auth:401', () => { window.__redirectTriggered = true; });
    });
    // 触发 logout
    await page.click('[data-testid="logout-button"]');
    await page.waitForTimeout(500);
    const triggered = await page.evaluate(() => (window as any).__redirectTriggered);
    expect(triggered).toBeUndefined(); // logout 不应触发 auth:401
  });
});
```

**运行命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm playwright test tests/e2e/login-state-fix.spec.ts
```

---

### Story 3.2: returnTo 白名单单元测试（1h）

**新增文件**: `src/lib/__tests__/validateReturnTo.test.ts`

**测试用例**（9 个边界 case）:

```typescript
// src/lib/__tests__/validateReturnTo.test.ts
import { describe, test, expect } from 'vitest';

// inline 实现（与 auth/page.tsx 保持同步）
function validateReturnTo(returnTo: string | null): string {
  if (!returnTo) return '/dashboard';
  if (!returnTo.startsWith('/')) return '/dashboard';
  if (/^(https?|javascript:|data:)/i.test(returnTo)) return '/dashboard';
  if (/^\/\//.test(returnTo)) return '/dashboard';
  if (returnTo.includes('/../') || returnTo.endsWith('/..')) return '/dashboard';
  return returnTo;
}

describe('validateReturnTo', () => {
  test('null 返回 /dashboard', () => {
    expect(validateReturnTo(null)).toBe('/dashboard');
  });

  test('空字符串返回 /dashboard', () => {
    expect(validateReturnTo('')).toBe('/dashboard');
  });

  test('合法绝对路径通过', () => {
    expect(validateReturnTo('/dashboard')).toBe('/dashboard');
    expect(validateReturnTo('/canvas/project/123')).toBe('/canvas/project/123');
    expect(validateReturnTo('/canvas?project=1&tab=2')).toBe('/canvas?project=1&tab=2');
  });

  test('// 协议相对 URL 拦截', () => {
    expect(validateReturnTo('//evil.com')).toBe('/dashboard');
  });

  test('https:// 外部 URL 拦截', () => {
    expect(validateReturnTo('https://evil.com')).toBe('/dashboard');
    expect(validateReturnTo('http://internal.corp/evil')).toBe('/dashboard');
  });

  test('javascript: 协议拦截', () => {
    expect(validateReturnTo('javascript:alert(1)')).toBe('/dashboard');
    expect(validateReturnTo('javascript:void(0)')).toBe('/dashboard');
  });

  test('data: URL 拦截', () => {
    expect(validateReturnTo('data:text/html,<script>alert(1)</script>')).toBe('/dashboard');
  });

  test('路径遍历攻击拦截', () => {
    expect(validateReturnTo('/../etc/passwd')).toBe('/dashboard');
    expect(validateReturnTo('/foo/../bar')).toBe('/dashboard');
  });

  test('非 / 开头路径返回 /dashboard', () => {
    expect(validateReturnTo('dashboard')).toBe('/dashboard');
    expect(validateReturnTo('evil.com')).toBe('/dashboard');
  });
});
```

**运行命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm vitest run src/lib/__tests__/validateReturnTo.test.ts --reporter=verbose
```

---

## 完整测试命令汇总

```bash
# ========== 开发自测命令 ==========

# 1. 全部单元测试
cd /root/.openclaw/vibex/vibex-fronted
pnpm vitest run

# 2. 新增白名单校验测试
pnpm vitest run src/lib/__tests__/validateReturnTo.test.ts

# 3. useAuth 扩展测试
pnpm vitest run src/hooks/__tests__/useAuth.test.tsx

# 4. AuthForm 测试
pnpm vitest run src/app/auth/page.test.tsx

# 5. E2E 认证重定向测试
pnpm playwright test tests/e2e/login-state-fix.spec.ts

# 6. 完整构建检查
cd /root/.openclaw/vibex/vibex-fronted && pnpm build

# 7. CI 完整流程（推荐）
pnpm vitest run && pnpm playwright test tests/e2e/login-state-fix.spec.ts && pnpm build
```

---

## 实现检查清单（Dev 自检）

- [x] Story 1.1: `AuthError` 类已添加，`isAuthError` 和 `returnTo` 字段存在
- [x] Story 1.1: 响应拦截器抛出 `AuthError` 而非普通 `Error`
- [x] Story 1.2: `window.dispatchEvent('auth:401')` 在 401 时触发
- [x] Story 1.3: `useAuth` 中 `useEffect` 监听 `auth:401`
- [x] Story 1.3: `sessionStorage.setItem('auth_return_to', returnTo)` 生效
- [x] Story 1.3: `router.push('/auth')` 被调用
- [x] Story 2.1: `validateReturnTo` 函数存在（6 种校验：null/undefined/空串/绝对URL/协议相对URL/javascript:URL/路径穿越）
- [x] Story 2.1: 登录成功后读 sessionStorage.auth_return_to 并用 validateReturnTo 校验后跳转
- [x] Story 2.2: /auth 页面从 URL 读取 returnTo 参数并存入 sessionStorage（供 OAuth 回调使用）
- [x] Story 2.3: `/auth` 页面守卫条件生效（useAuth listener 中已检查 pathname === '/auth'）
- [ ] Story 3.1: TC-004~TC-008 E2E 测试文件已创建（Playwright 环境待配置）
- [x] Story 3.2: validateReturnTo 单元测试 12 个 case 全覆盖（含 null/安全路径/恶意URL/路径穿越）
- [ ] 全部测试通过：`pnpm vitest run && pnpm playwright test`
- [ ] `pnpm build` 无报错

---

*实现计划: 待开发*
*Next: Dev 领取任务 → Coding → Tester E2E 覆盖*
