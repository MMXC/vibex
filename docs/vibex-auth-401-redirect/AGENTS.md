# VibeX 401 自动重定向 — 开发约束

**项目**: vibex-auth-401-redirect
**阶段**: AGENTS.md
**Architect**: Architect
**日期**: 2026-04-13

---

## 1. 变更范围

### 允许修改的文件

| 文件 | 允许修改内容 |
|------|------------|
| `src/lib/canvas/api/canvasApi.ts` | `handleResponseError` 401 分支（行 ~144-157）；新增 `validateReturnTo` 或引用 |
| `src/app/layout.tsx` | 新增 `<AuthProvider>` 包裹 `<ToastProvider>` |
| `src/components/canvas/leftDrawer/LeftDrawer.tsx` | 新增 `useEffect` auth:401 监听器；catch 块 401 分支 |
| `src/app/auth/page.tsx` | 验证 `validateReturnTo` 函数存在且对齐；无需大改 |
| `src/lib/auth/validateReturnTo.ts` | **新建**共享校验函数 |
| `src/lib/canvas/api/__tests__/canvasApi-401.test.ts` | **新建**单元测试 |
| `src/lib/auth/__tests__/validateReturnTo.test.ts` | **新建**单元测试 |
| `e2e/auth-redirect.spec.ts` | **新建**E2E 测试 |
| `src/types/auth-401.d.ts` | **新建**Global type augmentation |

### 禁止修改的文件

| 文件 | 禁止原因 |
|------|---------|
| `src/hooks/useAuth.tsx` | `auth:401` 监听器已存在且正确，只需 AuthProvider 挂载激活 |
| `src/stores/authStore.ts` | logout 逻辑已有完整实现，不得改动 |
| `src/lib/canvas/stores/uiStore.ts` | 与本 Epic 无关 |
| `src/lib/canvas/stores/contextStore.ts` | 与本 Epic 无关 |
| `src/services/api/modules/auth.ts` | auth API 层，与 401 跳转无关 |

### 变更边界说明

- **只改 API 层和页面层**，不触碰数据模型（stores/zustand）
- **不修改 token 存储方式**（sessionStorage + localStorage 双写保留）
- **不修改后端 API**，401 响应格式不变

---

## 2. 代码规范

### 2.1 canvasApi.ts 修复规范

**位置**: `src/lib/canvas/api/canvasApi.ts`，`handleResponseError` 函数

```typescript
// ✅ 正确：与 client.ts 对齐的事件分发模式
if (res.status === 401) {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    const returnTo = window.location.pathname + window.location.search;
    window.dispatchEvent(
      new CustomEvent('auth:401', { detail: { returnTo } })
    );
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
  }
  throw new Error('登录已过期，请重新登录'); // 保留，阻止 never 类型警告
}
```

```typescript
// ❌ 错误：事件分发缺失
if (res.status === 401) {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
  }
  throw new Error('登录已过期，请重新登录');
  // 缺少事件分发 + location.href
}
```

```typescript
// ❌ 错误：使用 router.push（在 API 层禁止）
// API 层必须用 window.location.href（同步），不能用 router.push（异步）
router.push('/auth');
```

### 2.2 validateReturnTo 规范

```typescript
// ✅ 必须拦截以下所有场景
validateReturnTo('//evil.com')           // → '/canvas'  ✅
validateReturnTo('https://evil.com')      // → '/canvas'  ✅
validateReturnTo('javascript:alert(1)')   // → '/canvas'  ✅
validateReturnTo('/canvas/../..')         // → '/canvas'  ✅
validateReturnTo('/canvas/../auth')        // → '/canvas'  ✅
validateReturnTo(null)                    // → '/canvas'  ✅
validateReturnTo('')                       // → '/canvas'  ✅

// ✅ 必须通过以下场景
validateReturnTo('/canvas')               // → '/canvas'  ✅
validateReturnTo('/canvas?project=123')  // → '/canvas?project=123'  ✅
validateReturnTo('/canvas#section')       // → '/canvas#section'  ✅
```

**关键约束**:
- `validateReturnTo` 必须是**纯函数**（无副作用，相同输入 → 相同输出）
- 必须在所有读取 `returnTo` 的地方使用（canvasApi.ts 跳转时、auth/page.tsx 读 URL 时、登录成功跳转时）
- 不得在 validateReturnTo 中调用 `router.push` 或 `window.location.href`

### 2.3 AuthProvider 挂载规范

```tsx
// ✅ 正确：在 layout.tsx 根布局中包裹
<body>
  <AuthProvider>
    <ToastProvider>
      {/* 现有内容不变 */}
    </ToastProvider>
  </AuthProvider>
</body>
```

```tsx
// ❌ 错误：在子组件中挂载（无法全局生效）
function LeftDrawer() {
  return (
    <AuthProvider>
      {/* 只能在 LeftDrawer 内生效 */}
    </AuthProvider>
  );
}
```

### 2.4 LeftDrawer 兜底规范

```typescript
// ✅ 正确：useEffect 独立监听（与 AuthProvider 解耦）
useEffect(() => {
  const handler = (e: Event) => {
    if (window.location.pathname === '/auth') return;
    const returnTo = (e as CustomEvent<{ returnTo: string }>).detail?.returnTo ?? '/canvas';
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
  };
  window.addEventListener('auth:401', handler);
  return () => window.removeEventListener('auth:401', handler);
}, []); // 空依赖：监听器在组件生命周期内保持注册

// ✅ 正确：catch 兜底
} catch (err) {
  if (err instanceof Error && err.message.includes('401')) {
    window.location.href = `/auth?returnTo=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
  // ... 原有 logger + toast
}
```

```typescript
// ❌ 错误：在 catch 中 dispatch 事件（已由 canvasApi.ts 处理，可能导致重复）
} catch (err) {
  if (err instanceof Error && err.message.includes('401')) {
    window.dispatchEvent(new CustomEvent('auth:401', { ... })); // 不要在 catch 中重复 dispatch
    window.location.href = '/auth?...';
  }
}
```

### 2.5 命名规范

| 实体 | 命名规范 | 示例 |
|------|---------|------|
| 401 跳转事件 | `auth:401` | `window.dispatchEvent(new CustomEvent('auth:401', {...}))` |
| sessionStorage key | `auth_return_to` | `sessionStorage.setItem('auth_return_to', returnTo)` |
| returnTo 参数 | `returnTo` | 局部变量、函数参数 |
| 校验函数 | `validateReturnTo` | `export function validateReturnTo(...)` |
| E2E 测试文件 | `auth-redirect.spec.ts` | `e2e/auth-redirect.spec.ts` |
| 单元测试文件 | `<file>-401.test.ts` | `canvasApi-401.test.ts` |

---

## 3. 安全红线

### 3.1 开放重定向（Open Redirect）— 最高优先级

**威胁**: 攻击者构造 `/auth?returnTo=https://evil.com`，登录成功后跳转到钓鱼站点。

**必须实现的防护**（任一不满足 → 拒绝合并）:

- [ ] `validateReturnTo` 拒绝所有以 `//`、`https://`、`http://` 开头的 URL
- [ ] `validateReturnTo` 拒绝所有 `javascript:`、`data:` 协议
- [ ] `validateReturnTo` 拒绝路径穿越（`/../` 或 `/..` 结尾）
- [ ] 双重解码校验（decodeURIComponent 后再验一次）
- [ ] `auth/page.tsx` 在读取 URL 参数后立即调用 `validateReturnTo`
- [ ] E2E 测试 `AC-7` 覆盖 `//evil.com` 和 `https://evil.com` 场景

### 3.2 logout 不触发 redirect

**威胁**: logout 触发 401，导致用户登出后被强制跳转登录页。

**必须实现的防护**:
- [ ] `useAuth.tsx` 行 60-77 的 `auth:401` 监听器已有 `pathname === '/auth'` 守卫（**不修改此守卫**）
- [ ] logout 与 401 流程完全独立（logout 清理 token，401 由 API 错误触发）
- [ ] E2E 测试 `AC-5` 覆盖 logout 场景

### 3.3 凭证清除顺序

**必须先清除 token，再分发事件/跳转**:
```typescript
// ✅ 正确顺序
sessionStorage.removeItem('auth_token');  // 先清除
localStorage.removeItem('auth_token');    // 先清除
window.dispatchEvent(...);                // 后分发
window.location.href = ...;               // 后跳转
```

```typescript
// ❌ 错误顺序（可能造成 token 残留）
window.dispatchEvent(...);
window.location.href = ...;
sessionStorage.removeItem('auth_token');  // 太晚了
```

### 3.4 SSR 守卫

**所有涉及 `window` 的代码必须有 `typeof window !== 'undefined'` 守卫**:
```typescript
if (typeof window !== 'undefined') {
  // 允许访问 window, sessionStorage, localStorage, location
}
```

---

## 4. Git 提交规范

### 4.1 Commit Message 格式

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**type 枚举**: `feat` | `fix` | `refactor` | `test` | `docs` | `chore`

### 4.2 提交模板

| 场景 | 示例 |
|------|------|
| canvasApi.ts 401 修复 | `feat(auth): canvasApi.ts dispatch auth:401 + location.href on 401` |
| validateReturnTo 新增 | `feat(auth): add validateReturnTo with open-redirect protection` |
| AuthProvider 挂载 | `feat(auth): mount AuthProvider in layout.tsx to activate 401 listener` |
| LeftDrawer 兜底 | `feat(auth): add auth:401 listener + catch 401 fallback in LeftDrawer` |
| E2E 测试新增 | `test(auth): add auth-redirect.spec.ts covering AC-1~AC-7` |
| 单元测试新增 | `test(auth): add validateReturnTo unit tests + canvasApi-401 tests` |
| Bugfix | `fix(auth): prevent logout from triggering 401 redirect` |

### 4.3 分支命名

```
feat/vibex-401-redirect         # 功能分支
fix/vibex-401-logout-loop       # Bugfix 分支
```

---

## 5. Code Review 清单

### 5.1 PR 提交前自检

- [ ] `pnpm build` 无任何 error 或 warning
- [ ] `pnpm test` 全绿（Vitest）
- [ ] `npx playwright test e2e/auth-redirect.spec.ts` 全绿
- [ ] `npx tsc --noEmit` 无 TypeScript 错误
- [ ] 所有安全红线（Section 3）已通过
- [ ] 新增代码有对应的测试（Vitest 单元测试或 Playwright E2E）
- [ ] `validateReturnTo` 的每个拒绝场景（//、https://、javascript:、/../）都有单元测试

### 5.2 Reviewer 重点检查

**安全**（必须逐条确认）:
- [ ] `validateReturnTo` 函数实现完整，覆盖所有攻击向量
- [ ] `canvasApi.ts` 401 分支包含事件分发 + location.href 双重跳转
- [ ] `auth/page.tsx` 读取 returnTo 后调用了 validateReturnTo
- [ ] logout 流程不会触发 401 跳转（通过 E2E AC-5 验证）

**正确性**:
- [ ] `AuthProvider` 在 `layout.tsx` 中正确挂载（包裹 ToastProvider）
- [ ] LeftDrawer 兜底的 `auth:401` 监听器有 cleanup 函数
- [ ] 401 跳转的 returnTo 包含查询参数（`window.location.pathname + window.location.search`）

**无副作用**:
- [ ] `AuthProvider` 挂载后 `pnpm build` + `pnpm test` 全通过（AC-3）
- [ ] 未修改 `useAuth.tsx` 的监听器逻辑
- [ ] 未修改其他 store（authStore, uiStore, contextStore）

**测试覆盖**:
- [ ] E2E 测试文件存在：`e2e/auth-redirect.spec.ts`
- [ ] 单元测试覆盖 validateReturnTo 全部场景
- [ ] 单元测试覆盖 canvasApi.ts 401 分支行为

### 5.3 Reviewer 禁止批准的情形

- [ ] `validateReturnTo` 存在已知绕过（如未检查 `//` 协议相对 URL）
- [ ] 未实现 `auth:401` 事件分发
- [ ] 未实现 `location.href` 跳转
- [ ] 存在未覆盖安全红线的测试用例
- [ ] `pnpm build` 有任何错误

---

## 6. 参考实现索引

| 参考点 | 文件 | 行 | 说明 |
|--------|------|-----|------|
| ✅ 正确实现（参考） | `src/lib/api/client.ts` | ~214-236 | auth:401 CustomEvent + location.href |
| ✅ 正确实现（参考） | `src/hooks/useAuth.tsx` | ~60-77 | auth:401 监听器 |
| ✅ 正确实现（参考） | `src/app/auth/page.tsx` | ~10-42 | validateReturnTo + returnTo 读+跳转 |
| ⚠️ 待修复 | `src/lib/canvas/api/canvasApi.ts` | ~144-157 | 缺事件分发 |
| ⚠️ 待修复 | `src/app/layout.tsx` | — | AuthProvider 未挂载 |
| ⚠️ 待修复 | `src/components/canvas/leftDrawer/LeftDrawer.tsx` | catch 块 | 缺 401 兜底 |
