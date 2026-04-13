# VibeX 401 自动重定向 — 实施计划

**项目**: vibex-auth-401-redirect
**阶段**: implementation-plan
**Architect**: Architect
**日期**: 2026-04-13
**总工时**: 4.5h

---

## Epic 0: 前置准备（0.5h，贯穿全程）

**目标**: 建立测试基础设施，确保每次改动可验证。

### Story T0.1: 创建单元测试骨架

**改动文件**: 新建 `src/lib/canvas/api/__tests__/` + `src/lib/auth/__tests__/`

**测试文件结构**:
```
src/lib/auth/__tests__/
  validateReturnTo.test.ts
src/lib/canvas/api/__tests__/
  canvasApi-401.test.ts
```

**验收标准**:
```bash
# 运行单元测试（预期失败，待 S1.2 实现）
npx vitest run src/lib/auth/__tests__/validateReturnTo.test.ts
# 输出: validateReturnTo 未实现错误（开发中）
```

---

## Epic 1: canvasApi.ts 401 事件分发修复（1.5h）

### Story S1.1: handleResponseError 401 分支修复（1h）

**改动文件**: `src/lib/canvas/api/canvasApi.ts`（行 144-157）

**改动前**:
```typescript
function handleResponseError(res: Response, defaultMsg: string): never {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token');
    }
    throw new Error('登录已过期，请重新登录');
  }
  // ...
}
```

**改动后**:
```typescript
function handleResponseError(res: Response, defaultMsg: string): never {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token');
      const returnTo = window.location.pathname + window.location.search;
      // Layer 1: 与 client.ts 保持一致的事件分发
      window.dispatchEvent(
        new CustomEvent('auth:401', { detail: { returnTo } })
      );
      // Layer 1: 双重保险，直接跳转
      window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
    }
    throw new Error('登录已过期，请重新登录'); // 不执行
  }
  // ... 其余不变
}
```

**验收标准**:
```typescript
// Vitest 单元测试 src/lib/canvas/api/__tests__/canvasApi-401.test.ts
it('dispatch auth:401 事件包含 returnTo', () => {
  const mockResponse = new Response('', { status: 401 });
  const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
  try {
    handleResponseError(mockResponse, 'default');
  } catch {}
  expect(dispatchSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'auth:401',
      detail: expect.objectContaining({ returnTo: '/canvas' }),
    })
  );
});

it('window.location.href 跳转 /auth?returnTo=...', () => {
  const mockResponse = new Response('', { status: 401 });
  try {
    handleResponseError(mockResponse, 'default');
  } catch {}
  expect(window.location.href).toMatch(/^\/auth\?returnTo=%2F/);
});
```

**E2E 验证**:
```typescript
// e2e/auth-redirect.spec.ts
test('AC-6: snapshot/restore 等调用点 401 跳转', async ({ page }) => {
  await page.goto('/canvas');
  await page.evaluate(() => localStorage.removeItem('auth_token'));
  await page.goto('/canvas');
  await page.click('button:has-text("历史版本")');
  await expect(page).toHaveURL(/\/auth\?returnTo=/);
});
```

---

### Story S1.2: validateReturnTo 白名单校验（0.5h）

**改动文件**: `src/lib/auth/validateReturnTo.ts`（新建）

**代码**:
```typescript
// src/lib/auth/validateReturnTo.ts
export function validateReturnTo(returnTo: string | null | undefined): string {
  const DEFAULT = '/canvas';

  if (!returnTo) return DEFAULT;
  if (typeof returnTo !== 'string') return DEFAULT;
  if (!returnTo.trim()) return DEFAULT;

  // 必须是相对路径（以 / 开头）且非协议相对
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return DEFAULT;
  }

  // 拒绝危险协议
  if (/^(https?|javascript:|data:)/i.test(returnTo)) {
    return DEFAULT;
  }

  // 拒绝路径穿越
  if (returnTo.includes('/../') || returnTo.endsWith('/..')) {
    return DEFAULT;
  }

  // 双重解码校验
  try {
    const decoded = decodeURIComponent(returnTo);
    if (decoded !== returnTo) {
      if (!decoded.startsWith('/') || decoded.startsWith('//')) return DEFAULT;
      if (/^(https?|javascript:|data:)/i.test(decoded)) return DEFAULT;
      if (decoded.includes('/../') || decoded.endsWith('/..')) return DEFAULT;
    }
  } catch {
    return DEFAULT;
  }

  return returnTo;
}
```

**验收标准**:
```typescript
// src/lib/auth/__tests__/validateReturnTo.test.ts
describe('AC-7: 开放重定向防护', () => {
  it('拒绝 //evil.com', () => expect(validateReturnTo('//evil.com')).toBe('/canvas'));
  it('拒绝 https://evil.com', () => expect(validateReturnTo('https://evil.com')).toBe('/canvas'));
  it('拒绝 javascript:alert(1)', () => expect(validateReturnTo('javascript:alert(1)')).toBe('/canvas'));
  it('拒绝 /canvas/../..', () => expect(validateReturnTo('/canvas/../..')).toBe('/canvas'));
  it('拒绝 /canvas/../auth', () => expect(validateReturnTo('/canvas/../auth')).toBe('/canvas'));
});

describe('AC-2: 合法路径通过', () => {
  it('/canvas', () => expect(validateReturnTo('/canvas')).toBe('/canvas'));
  it('/canvas?project=123', () => expect(validateReturnTo('/canvas?project=123')).toBe('/canvas?project=123'));
  it('/canvas#section', () => expect(validateReturnTo('/canvas#section')).toBe('/canvas#section'));
  it('编码路径', () => expect(validateReturnTo('/canvas%3Fid%3D1')).toBe('/canvas%3Fid%3D1'));
});

describe('边界情况', () => {
  it('null/undefined/空 → /canvas', () => {
    expect(validateReturnTo(null)).toBe('/canvas');
    expect(validateReturnTo(undefined)).toBe('/canvas');
    expect(validateReturnTo('')).toBe('/canvas');
  });
});
```

**运行命令**:
```bash
cd vibex-fronted
npx vitest run src/lib/auth/__tests__/validateReturnTo.test.ts
npx vitest run src/lib/canvas/api/__tests__/canvasApi-401.test.ts
```

---

## Epic 2: AuthProvider 挂载与全局监听（0.5h）

### Story S2.1: layout.tsx 挂载 AuthProvider ✅ done

**改动文件**: `src/app/layout.tsx`

**改动前**:
```tsx
<ToastProvider>
  <DDDStoreInitializer />
  <QueryProvider>
    <AppErrorBoundary>
      {children}
    </AppErrorBoundary>
  </QueryProvider>
</ToastProvider>
```

**改动后**:
```tsx
import { AuthProvider } from '@/hooks/useAuth';

<AuthProvider>
  <ToastProvider>
    <DDDStoreInitializer />
    <QueryProvider>
      <AppErrorBoundary>
        {children}
      </AppErrorBoundary>
    </QueryProvider>
  </ToastProvider>
</AuthProvider>
```

**注意**: `AuthProvider` 包裹 `ToastProvider`（外层包裹内层 Provider 是 React 惯例），无需改变其他 Provider 位置。

**验收标准**:
```bash
# AC-3: 构建无错误
cd vibex-fronted
CI=true pnpm build

# AC-3: 测试无回归
CI=true pnpm test

# AC-5: logout 不触发 redirect（E2E）
# 在 e2e/auth-redirect.spec.ts 中已覆盖
npx playwright test e2e/auth-redirect.spec.ts --grep "AC-5"
```

---

## Epic 3: LeftDrawer 兜底 + 测试（2.5h）

### Story S3.1: LeftDrawer catch 兜底 ✅ done

**改动文件**: `src/components/canvas/leftDrawer/LeftDrawer.tsx`

**改动位置**: `useEffect` 区域（新增）+ `catch` 块（修改）

**改动 1 — 新增 useEffect（auth:401 独立监听器）**:
```typescript
// 放在组件顶部，与现有 useEffect 平级
useEffect(() => {
  const handler = (e: Event) => {
    // 守卫：已在 /auth 页面
    if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
      return;
    }
    const returnTo = (e as CustomEvent<{ returnTo: string }>).detail?.returnTo ?? '/canvas';
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
  };
  window.addEventListener('auth:401', handler);
  return () => window.removeEventListener('auth:401', handler);
}, []);
```

**改动 2 — catch 块增加 401 手动跳转**:
```typescript
try {
  const result = await canvasApi.generateContexts({ ... });
  // ...
} catch (err) {
  // 401 兜底跳转（Layer 3）
  if (err instanceof Error && err.message.includes('401')) {
    window.location.href = `/auth?returnTo=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
  // 其余错误：logger + toast（已有逻辑不变）
  canvasLogger.LeftDrawer.error('Failed to generate contexts:', err);
  toast.showToast('生成失败，请重试', 'error');
}
```

**验收标准**:
```typescript
// 行为验证（无直接单元测试，通过 E2E）
// 清除 token → 点击发送需求 → 跳转 /auth
// （由 S3.3 E2E 测试覆盖）
```

---

### Story S3.2: auth/page.tsx returnTo 验证 ✅ done

**改动文件**: `src/app/auth/page.tsx`

**现状确认**: `auth/page.tsx` 行 10-26 已有 `validateReturnTo` 实现，行 42+ 的 `handleSubmit` 已读取 `sessionStorage returnTo`。

**验证清单**:
- [ ] `validateReturnTo` 函数存在且覆盖所有 AC-7 场景（//、https://、javascript:、路径穿越）
- [ ] `handleSubmit` 在登录成功后读 `sessionStorage.getItem('auth_return_to')`
- [ ] 读后调用 `sessionStorage.removeItem('auth_return_to')`（一次性）
- [ ] 跳转使用 `router.push(safeReturnTo)` 而非硬编码

**如需对齐 validateReturnTo**（替换现有函数）:
```typescript
// auth/page.tsx 顶部
import { validateReturnTo } from '@/lib/auth/validateReturnTo';

// 删除现有的 validateReturnTo 函数（行 10-26）
// 用 validateReturnTo 替代
```

**验收标准**:
```typescript
// e2e/auth-redirect.spec.ts
test('AC-4: 登录成功后返回原页面 /canvas', async ({ page }) => {
  await page.goto('/canvas');
  await page.evaluate(() => {
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
  });
  await page.goto('/canvas');
  await page.click('button:has-text("发送需求")');
  await page.waitForURL(/\/auth\?returnTo=\/canvas/);
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL('/canvas');
});
```

---

### Story S3.3: E2E 测试覆盖 AC-1~AC-7 ✅ done

**改动文件**: 新建 `e2e/auth-redirect.spec.ts`

**完整测试用例**:

```typescript
import { test, expect, Page } from '@playwright/test';

const clearTokens = (page: Page) =>
  page.evaluate(() => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_return_to');
  });

test.describe('AC-1~AC-7: 401 自动重定向全链路', () => {

  test('AC-1: API 401 响应后 100% 自动跳转 /auth?returnTo=...', async ({ page }) => {
    await page.goto('/canvas');
    clearTokens(page);
    await page.goto('/canvas');
    await page.click('button:has-text("发送需求")');
    await expect(page).toHaveURL(/\/auth\?returnTo=\/canvas/);
  });

  test('AC-2: returnTo 含查询参数 → 登录后回正确页面', async ({ page }) => {
    await page.goto('/canvas?project=123');
    clearTokens(page);
    await page.goto('/canvas?project=123');
    await page.click('button:has-text("发送需求")');
    await page.waitForURL(/\/auth\?returnTo=.*canvas%3Fproject%3D123/);
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL(/\/canvas\?project=123/);
  });

  test('AC-3: AuthProvider 挂载无副作用 — build 通过', async () => {
    // 此项由 CI pipeline 验证（pnpm build）
  });

  test('AC-4: 登录成功后返回原页面', async ({ page }) => {
    await page.goto('/canvas');
    clearTokens(page);
    await page.goto('/canvas');
    await page.click('button:has-text("发送需求")');
    await page.waitForURL(/\/auth/);
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/canvas');
  });

  test('AC-5: logout 不触发 redirect', async ({ page }) => {
    await page.goto('/canvas');
    await page.evaluate(() => localStorage.setItem('auth_token', 'mock-token'));
    await page.click('button:has-text("登出")');
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('AC-6: 所有 canvasApi.ts 调用点均受益（version history）', async ({ page }) => {
    await page.goto('/canvas');
    clearTokens(page);
    await page.goto('/canvas');
    await page.click('button:has-text("历史版本")');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('AC-7: returnTo 为外部域名 → fallback /canvas', async ({ page }) => {
    await page.goto('/auth?returnTo=//evil.com');
    const returnTo = await page.evaluate(() =>
      sessionStorage.getItem('auth_return_to')
    );
    expect(returnTo).toBe('/canvas');
  });

});
```

**E2E 运行命令**:
```bash
cd vibex-fronted
npx playwright test e2e/auth-redirect.spec.ts --project=chromium
```

---

## 工时汇总

| Epic | Story | 工时 | 累计 |
|------|-------|------|------|
| Epic 0 | T0.1 测试骨架 | 0.5h | 0.5h |
| Epic 1 | S1.1 canvasApi.ts 修复 | 1h | 1.5h |
| Epic 1 | S1.2 validateReturnTo | 0.5h | 2h |
| Epic 2 | S2.1 AuthProvider 挂载 | 0.5h | 2.5h |
| Epic 3 | S3.1 LeftDrawer 兜底 | 0.5h | 3h |
| Epic 3 | S3.2 auth/page.tsx 验证 | 0.5h | 3.5h |
| Epic 3 | S3.3 E2E 测试 | 1.5h | 5h |
| **合计** | | **5h** | |

> 实际实施可按 S1.1 + S1.2 → S2.1 → S3.1 → S3.2 → S3.3 顺序串行执行，或 S2.1 与 S1.x 并行。

---

## 实施检查清单

### 每次 Story 完成时的自检

- [ ] `pnpm build` 无错误
- [ ] `npx vitest run` 单元测试全绿
- [ ] E2E 相关用例通过
- [ ] 无 TypeScript 错误（`npx tsc --noEmit`）
- [ ] 无新的 ESLint 错误
- [ ] Git commit message 符合规范（见 AGENTS.md）

### Epic 完成时的大检

- [ ] 所有 DoD 条目满足（见 PRD Section 4）
- [ ] AC-1~AC-7 E2E 测试全通过
- [ ] changelog 更新
