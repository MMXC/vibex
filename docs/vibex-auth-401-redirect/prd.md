# VibeX 401 自动重定向 — PRD

**项目**: vibex-auth-401-redirect
**阶段**: create-prd
**PM**: pm
**日期**: 2026-04-13
**来源**: analysis.md (analyze-requirements)
**Planning 输出**: docs/vibex-auth-401-redirect/plan/feature-list.md
**产出**: `/root/.openclaw/vibex/docs/vibex-auth-401-redirect/prd.md`

---

## 1. 执行摘要

### 背景

当前 VibeX 前端的 `canvasApi.ts`（旧 API 层）与 `client.ts`（axios 新层）是两套并行的 API 层。`vibex-auth-401-handling` Epic 已为 `client.ts` 实现了完整的 `auth:401` CustomEvent 机制，但 `canvasApi.ts` 从未被纳入——它在 401 时只 clear token + throw Error，从不 dispatch 事件。同时 `AuthProvider` 未在 `layout.tsx` 中挂载，导致 `useAuth.tsx` 中的 `auth:401` 监听器成为死代码。用户未登录时点击"发送需求"，API 返回 401 后无任何跳转，用户体验断裂。

### 目标

实现「401 自动重定向 + 登录成功 returnTo」完整流程：未登录用户点击发送需求 → API 返回 401 → 自动跳转 `/auth?returnTo=<当前页>` → 登录成功后回到原页面。

### 成功指标

- AC-1: API 401 响应后 100% 自动跳转 `/auth?returnTo=<当前页>`
- AC-2: returnTo 包含查询参数时登录后回正确页面
- AC-3: AuthProvider 挂载无副作用，`pnpm build` + `pnpm test` 全通过
- AC-4: 登录成功后返回原页面
- AC-5: logout 不触发 redirect
- AC-6: 所有 canvasApi.ts 调用点（snapshot/restore 等）均受益
- AC-7: returnTo 为外部域名时 fallback 到 `/auth`

---

## 2. Epic 拆分

### Epic 1: canvasApi.ts 401 事件分发修复

| Story ID | 描述 | 工时 | 验收标准 |
|---|---|---|---|
| **S1.1** | `handleResponseError` 401 分支修复：dispatch auth:401 事件 + location.href 双重跳转 | 1h | 见下方 expect() 条目 |
| **S1.2** | returnTo 白名单校验：必须以 `/` 开头，非外部域名 | 0.5h | `validateReturnTo('//evil.com') === '/auth'` |

**Epic 1 总工时**: 1.5h

---

### Epic 2: AuthProvider 挂载与全局监听

| Story ID | 描述 | 工时 | 验收标准 |
|---|---|---|---|
| **S2.1** | `layout.tsx` 挂载 AuthProvider，使 `auth:401` 监听器生效 | 0.5h | `pnpm build` + `pnpm test` 全通过 |

**Epic 2 总工时**: 0.5h

---

### Epic 3: LeftDrawer 兜底 + 测试

| Story ID | 描述 | 工时 | 验收标准 |
|---|---|---|---|
| **S3.1** | LeftDrawer catch 兜底：401 时手动跳转，监听 auth:401 兜底 | 0.5h | 清除 token → 点击发送需求 → 跳转 `/auth` |
| **S3.2** | 现有 returnTo 登录跳转验证：`auth/page.tsx` 读 returnTo 而非硬编码 | 0.5h | `/auth?returnTo=/canvas` 登录后跳转 `/canvas` |
| **S3.3** | E2E 测试覆盖：新增 auth-redirect 场景覆盖 AC-1~AC-7 | 1.5h | AC-1~AC-7 全部通过 |

**Epic 3 总工时**: 2.5h

---

### 工时汇总

| Epic | 工时 |
|---|---|
| Epic 1: canvasApi.ts 401 事件分发修复 | 1.5h |
| Epic 2: AuthProvider 挂载与全局监听 | 0.5h |
| Epic 3: LeftDrawer 兜底 + 测试 | 2.5h |
| **合计** | **4.5h** |

---

## 3. 验收标准

### S1.1 — canvasApi.ts handleResponseError 修复

```typescript
// 修改前（canvasApi.ts:144-157）
function handleResponseError(res: Response, defaultMsg: string): never {
  if (res.status === 401) {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    throw new Error('Unauthorized'); // 无事件分发，无跳转
  }
}

// 修改后：
function handleResponseError(res: Response, defaultMsg: string): never {
  if (res.status === 401) {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    const returnTo = window.location.pathname + window.location.search;
    // 与 client.ts 保持一致的事件分发
    window.dispatchEvent(new CustomEvent('auth:401', { detail: { returnTo } }));
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
    throw new Error('登录已过期，请重新登录'); // 不执行
  }
}

// AC-1: 未登录点击发送需求，自动跳转 /auth?returnTo=...
test('AC-1: 401 后自动跳转（E2E）', async ({ page }) => {
  await page.goto('/canvas');
  await page.evaluate(() => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  });
  await page.click('button:has-text("发送需求")');
  await expect(page).toHaveURL(/\/auth\?returnTo=\/canvas/);
});

// AC-6: snapshot/restore 等调用点同样受益
test('AC-6: version history 401 跳转（E2E）', async ({ page }) => {
  await page.goto('/canvas');
  await page.evaluate(() => localStorage.removeItem('auth_token'));
  await page.click('button:has-text("历史版本")');
  // 触发 canvasApi.getSnapshots() → 401 → 跳转
  await expect(page).toHaveURL(/\/auth/);
});
```

### S1.2 — returnTo 白名单校验

```typescript
// validateReturnTo() 函数
function validateReturnTo(returnTo: string | null): string {
  if (!returnTo) return '/canvas';
  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }
  return '/auth'; // 恶意 URL fallback
}

// AC-7: 开放重定向防护
test('AC-7: returnTo 白名单（单元测试）', async () => {
  expect(validateReturnTo('//evil.com')).toBe('/auth');
  expect(validateReturnTo('https://evil.com')).toBe('/auth');
  expect(validateReturnTo('/canvas')).toBe('/canvas');
  expect(validateReturnTo('/canvas?project=123')).toBe('/canvas?project=123');
  expect(validateReturnTo(null)).toBe('/canvas');
  expect(validateReturnTo('')).toBe('/canvas');
});

// AC-2: returnTo 含查询参数
test('AC-2: returnTo 含查询参数（E2E）', async ({ page }) => {
  await page.goto('/canvas?project=123');
  await page.evaluate(() => localStorage.removeItem('auth_token'));
  await page.click('button:has-text("发送需求")');
  await page.waitForURL(/\/auth\?returnTo=\/canvas%3Fproject%3D123/);
  // 登录后
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL(/\/canvas\?project=123/);
});
```

### S2.1 — AuthProvider 挂载

```typescript
// layout.tsx 新增 AuthProvider
import { AuthProvider } from '@/hooks/useAuth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <ToastProvider>
            {/* ... rest unchanged */}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

// AC-3: 无副作用
test('AC-3: AuthProvider 挂载无副作用', async () => {
  const { stdout, stderr } = await exec('pnpm build');
  expect(stdout).not.toContain('error');
  const { stdout: testOut } = await exec('pnpm test');
  expect(testOut).not.toContain('FAIL');
});
```

### S3.1 — LeftDrawer catch 兜底

```typescript
// LeftDrawer.tsx 新增:
useEffect(() => {
  const handler = (e: Event) => {
    const returnTo = (e as CustomEvent<{ returnTo: string }>).detail?.returnTo ?? '/canvas';
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
  };
  window.addEventListener('auth:401', handler);
  return () => window.removeEventListener('auth:401', handler);
}, []);

try {
  const result = await canvasApi.generateContexts({...});
} catch (err) {
  if (err instanceof Error && err.message.includes('401')) {
    window.location.href = `/auth?returnTo=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
  // ... logger + toast
}

// AC-5: logout 不触发 redirect
test('AC-5: logout 不触发 redirect（E2E）', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('button:has-text("登出")');
  // 不应跳转到 /auth
  await expect(page).not.toHaveURL(/\/auth/);
});
```

### S3.2 — 现有 returnTo 登录跳转验证

```typescript
// auth/page.tsx 已有 returnTo 读取逻辑（需验证）
// 分析报告中指出 auth/page.tsx:42 硬编码 router.push('/dashboard')
// 实际检查：如果 returnTo 逻辑已实现则标记为 verified，否则改为读 sessionStorage

// AC-4: 登录成功后返回原页面
test('AC-4: 登录后返回原页面（E2E）', async ({ page }) => {
  await page.goto('/canvas');
  await page.evaluate(() => localStorage.removeItem('auth_token'));
  await page.click('button:has-text("发送需求")');
  await page.waitForURL(/\/auth/);
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL('/canvas');
});
```

---

## 4. DoD (Definition of Done)

### Epic 1 完成条件
- [ ] `canvasApi.ts` 的 `handleResponseError` 401 分支已 dispatch `auth:401` 事件
- [ ] `canvasApi.ts` 的 401 分支已添加 `window.location.href` 跳转
- [ ] `validateReturnTo()` 函数已实现白名单校验
- [ ] AC-1: 未登录点击发送需求自动跳转 `/auth?returnTo=...`
- [ ] AC-6: version history 401 同样跳转

### Epic 2 完成条件
- [ ] `layout.tsx` 已挂载 `AuthProvider`
- [ ] `auth:401` 监听器在 App 级别生效（非死代码）
- [ ] AC-3: `pnpm build` + `pnpm test` 全通过

### Epic 3 完成条件
- [ ] `LeftDrawer.tsx` 已添加 `auth:401` 事件监听兜底
- [ ] `LeftDrawer.tsx` catch 块已添加 401 手动跳转
- [ ] `auth/page.tsx` returnTo 逻辑已验证（读 returnTo 而非硬编码）
- [ ] AC-2: returnTo 含查询参数正确处理
- [ ] AC-4: 登录成功后返回原页面
- [ ] AC-5: logout 不触发 redirect
- [ ] AC-7: returnTo 白名单校验通过
- [ ] E2E 测试（AC-1~AC-7）全部通过

### 项目整体 DoD
- [ ] 所有 Epic 完成条件全部满足
- [ ] changelog 已更新

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|---|---|---|---|---|
| F1.1 | canvasApi.ts 401 事件分发 | `handleResponseError` 401 分支 dispatch auth:401 + location.href | `expect(page).toHaveURL(/\/auth\?returnTo=/)` | 无 |
| F1.2 | returnTo 白名单校验 | returnTo 以 `/` 开头验证，外部域名 fallback `/auth` | `expect(validateReturnTo('//evil.com')).toBe('/auth')` | 无 |
| F2.1 | AuthProvider 挂载 | `layout.tsx` 挂载使 auth:401 监听器生效 | `pnpm build` + `pnpm test` 全通过 | 【需页面集成】 |
| F3.1 | LeftDrawer catch 兜底 | catch 块 401 手动跳转 + auth:401 监听 | E2E: 清除 token → 点击 → 跳转 | 【需页面集成】 |
| F4.1 | 其他 canvasApi 调用点覆盖 | snapshot/restore 等调用点通过 Layer 1 修复自动受益 | E2E: version history 401 跳转 | 无 |
| F5.1 | 登录后 returnTo 跳转 | `auth/page.tsx` 读 returnTo 而非硬编码 `/dashboard` | `expect(page).toHaveURL(originalPath)` | 【需页面集成】 |
| F6.1 | E2E 测试覆盖 | 新增 auth-redirect.spec.ts 覆盖 AC-1~AC-7 | AC-1~AC-7 全通过 | 无 |

---

## 6. 依赖关系图

```
Layer 1: canvasApi.ts 修复 (F1.1, F1.2)
  → 所有调用 canvasApi.ts 的地方均受益（snapshot/restore/generateContexts）
  → 触发 auth:401 事件 + 双重跳转

Layer 2: AuthProvider 挂载 (F2.1)
  → auth:401 监听器生效（不再是死代码）
  → 所有 auth:401 事件触发时全局生效

Layer 3: LeftDrawer 兜底 (F3.1)
  → 任何遗漏路径的最后防线
  → auth:401 监听 + catch 手动跳转

F5.1 登录后跳转 (F5.1)
  → auth/page.tsx 读取 sessionStorage returnTo
  → 登录成功后回到原页面

F6.1 E2E 测试 (F6.1)
  ← 所有 Epic 完成后验证

无外部依赖，无需协调后端或其他团队
```

---

## 7. 关键代码位置索引

| 文件 | 行 | 用途 |
|---|---|---|
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | 144-157 | `handleResponseError` — 401 时只 throw，缺事件分发 |
| `vibex-fronted/src/lib/client.ts` | 214-236 | 参考实现：正确的 401 → auth:401 + location.href |
| `vibex-fronted/src/app/layout.tsx` | 全部 | AuthProvider 未挂载（死代码根因） |
| `vibex-fronted/src/hooks/useAuth.tsx` | 60-77 | `auth:401` 监听器（AuthProvider 未挂载故永不执行） |
| `vibex-fronted/src/components/canvas/leftDrawer/LeftDrawer.tsx` | catch 块 | 仅有 logger + toast，缺 401 兜底跳转 |
| `vibex-fronted/src/app/auth/page.tsx` | 42 | 登录后硬编码 `router.push('/dashboard')`，需改为读 returnTo |

---

## 8. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点汇总表格式正确
- [x] 已执行 Planning（Feature List 已产出）
- [x] 页面集成标注完整（【需页面集成】）
- [x] 无遗漏验收标准（AC-1~AC-7 全覆盖）

---

*Planning 输出: `docs/vibex-auth-401-redirect/plan/feature-list.md`*
*基于 Analyst 报告: `docs/vibex-auth-401-redirect/analysis.md`*
*推荐方案: 方案 A（三层联动防御）*