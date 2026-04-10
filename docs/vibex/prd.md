# VibeX 认证重定向 — PRD

**项目**: vibex
**状态**: 已规划
**PM**: pm
**日期**: 2026-04-11
**产出**: `/root/.openclaw/vibex/docs/vibex/prd.md`

---

## 1. 执行摘要

### 背景
当前 VibeX 前端 httpClient 在收到 401 错误时仅清除 token，未自动跳转至登录页；AuthForm 登录成功后硬编码跳转到 `/dashboard`，未考虑用户原本的页面路径。这导致用户操作中被登出后体验断裂，需要手动返回原页面。

### 目标
实现「401 自动重定向 + 登录成功 returnTo」完整流程，用户在任意受保护页面因 session 过期被登出后，能无缝恢复到原页面操作。

### 成功指标
- API 401 响应后 100% 自动跳转 `/auth`
- 登录成功后 returnTo 恢复成功率 ≥ 95%
- 登录页自身不触发 redirect 循环
- E2E 测试 AC-1 ~ AC-8 全通过
- 无开放重定向安全漏洞

---

## 2. Epic 拆分

### Epic 1: 401 重定向核心机制

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | httpClient 401 标记扩展 | httpClient 收到 401 时抛出带 `isAuthError=true` 和 `returnTo` 的错误对象，区分主动登出 | - `expect(error.isAuthError).toBe(true)`<br>- `expect(error.returnTo).toMatch(/^\//)` |
| **1.2** | Auth 事件广播 | httpClient 清除 token 后 dispatch `window` 自定义事件 `auth:401`，携带 returnTo | - `expect(event.type).toBe('auth:401')`<br>- `expect(event.detail.returnTo).toBeDefined()` |
| **1.3** | 全局 401 监听与跳转 | App 根组件或 AuthContext 监听 `auth:401`，存 sessionStorage，跳转 `/auth` | - `expect(sessionStorage.getItem('auth_return_to')).toBeTruthy()`<br>- `expect(router.push).toHaveBeenCalledWith('/auth')` |

**Epic 1 总工时**: 5h

---

### Epic 2: 登录成功跳转逻辑

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **2.1** | AuthForm returnTo 读取 | AuthForm 登录成功后从 sessionStorage 读 returnTo，校验后跳转；无则 fallback `/dashboard` | - `expect(router.push).toHaveBeenCalledWith(expect.stringMatching(/^\//))`<br>- `expect(router.push).not.toHaveBeenCalledWith('/dashboard')`（有 returnTo 时）<br>- `expect(router.push).toHaveBeenCalledWith('/dashboard')`（无 returnTo 时） |
| **2.2** | LoginDrawer returnTo | 第三方登录 drawer（Google/GitHub）同步支持 returnTo | - OAuth callback 后走同一 returnTo 逻辑 |
| **2.3** | Auth 页面守卫 | `/auth` 路由本身不触发 401 redirect 检测，避免循环 | - `expect(inAuthPage).toBe(true)` 时 skip redirect |
| **2.4** | returnTo 白名单校验 | returnTo 必须以 `/` 开头且非外部域名，否则 fallback `/dashboard` | - `expect(validateReturnTo('//evil.com')).toBe('/dashboard')`<br>- `expect(validateReturnTo('/dashboard')).toBe('/dashboard')`<br>- `expect(validateReturnTo('/canvas')).toBe('/canvas')` |

**Epic 2 总工时**: 2.5h（2.4 安全项可并行）

---

### Epic 3: 测试覆盖

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **3.1** | E2E 测试扩展 | 在 `tests/e2e/login-state-fix.spec.ts` 新增 TC-004~TC-008 | - TC-004: 401 触发 redirect<br>- TC-005: returnTo 保存正确<br>- TC-006: 登录成功返回原页面<br>- TC-007: OAuth returnTo<br>- TC-008: logout 不触发 redirect |
| **3.2** | returnTo 白名单单元测试 | 校验函数 `validateReturnTo()` 覆盖正常路径和攻击路径 | - `expect(validateReturnTo('https://evil.com')).toBe('/dashboard')`<br>- `expect(validateReturnTo('/canvas?project=1')).toBe('/canvas?project=1')` |

**Epic 3 总工时**: 3h

---

## 3. 验收标准

### Story 1.1 — httpClient 401 标记

```
expect(new AuthError('Unauthorized', 401).isAuthError).toBe(true)
expect(new AuthError('Unauthorized', 401).returnTo).toMatch(/^\//)
expect(() => { throw new AuthError('Unauthorized', 401) }).toThrow()
```

### Story 1.3 — 全局监听跳转

```
// 在测试中 mock router.push，触发 401
trigger401();
expect(router.push).toHaveBeenCalledWith('/auth');
expect(sessionStorage.getItem('auth_return_to')).toBe('/canvas/project/123');
```

### Story 2.1 — 登录后 returnTo

```
// 场景 A: 有 returnTo
sessionStorage.setItem('auth_return_to', '/canvas/project/123');
login();
expect(router.push).toHaveBeenCalledWith('/canvas/project/123');
expect(sessionStorage.getItem('auth_return_to')).toBeNull();

// 场景 B: 无 returnTo
sessionStorage.removeItem('auth_return_to');
login();
expect(router.push).toHaveBeenCalledWith('/dashboard');

// 场景 C: returnTo 为恶意 URL
sessionStorage.setItem('auth_return_to', '//evil.com');
login();
expect(router.push).toHaveBeenCalledWith('/dashboard');
```

### Story 3.1 — E2E TC-006

```
test('登录成功后返回原页面（TC-006）', async ({ page }) => {
  await page.goto('/canvas/project/123');
  // mock 401 response
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('auth:401', { detail: { returnTo: '/canvas/project/123' } }));
  });
  await expect(page).toHaveURL(/\/auth/);
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL('/canvas/project/123');
});
```

---

## 4. DoD (Definition of Done)

Epic 1 完成条件：
- [ ] `client.ts` 中 401 错误携带 `isAuthError` 和 `returnTo`
- [ ] `auth:401` 事件能正常 dispatch 和 listen
- [ ] `AuthContext` 或 App 根组件处理事件并跳转

Epic 2 完成条件：
- [ ] `auth/page.tsx` 登录后读取 sessionStorage returnTo
- [ ] LoginDrawer 同步支持 returnTo
- [ ] `/auth` 页面守卫条件生效
- [ ] `validateReturnTo()` 白名单校验通过单元测试

Epic 3 完成条件：
- [ ] TC-004~TC-008 E2E 测试全部通过
- [ ] `validateReturnTo()` 单元测试覆盖边界情况

项目整体 DoD：
- [ ] AC-1 ~ AC-8 全部满足
- [ ] 安全测试（白名单）通过
- [ ] `pnpm build` + `pnpm test` 均通过
- [ ] changelog 已更新

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | httpClient 401 标记 | 401 抛出 AuthError，含 isAuthError + returnTo | `expect(error.isAuthError).toBe(true)` | 无 |
| F1.2 | Auth 事件广播 | dispatch `auth:401` 事件 | `expect(event.type).toBe('auth:401')` | 无 |
| F1.3 | 全局 401 监听 | App 根组件监听事件，存 sessionStorage，跳转 | `expect(router.push).toHaveBeenCalledWith('/auth')` | ✅ App 根 |
| F2.1 | AuthForm returnTo | 登录成功后读 returnTo，校验后跳转 | `expect(router.push).toHaveBeenCalledWith(originalPath)` | ✅ /auth |
| F2.2 | LoginDrawer returnTo | 第三方登录同步 returnTo | 同 F2.1 | ✅ LoginDrawer |
| F2.3 | Auth 守卫 | /auth 页面跳过 401 检测 | `expect(inAuthPage).toBe(true)` 时 skip | ✅ /auth |
| F2.4 | 白名单校验 | validateReturnTo() 防止开放重定向 | AC-5 expect 全覆盖 | 无 |
| F3.1 | E2E 测试 | TC-004~TC-008 覆盖 | 5 个 E2E test 全 pass | 无 |
| F3.2 | 白名单单元测试 | validateReturnTo() 覆盖边界 | 边界 case 全 pass | 无 |

---

## 6. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 循环 redirect（/auth → 401 → /auth） | 低 | 高 | F2.3 Auth 守卫 |
| 开放重定向 | 低 | 高 | F2.4 白名单校验 |
| logout 误触发 redirect | 中 | 中 | httpClient 区分 isLogoutAction |
| OAuth callback 冲突 | 低 | 中 | OAuth callback 使用 URL 参数传递 returnTo |

---

## 7. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点汇总表格式正确
- [x] 已执行 Planning（Feature List 已产出）
- [x] 安全风险已覆盖（白名单校验）

---

*Planning 输出: `plan/feature-list.md`*  
*基于 Analyst 报告: `analysis.md`*  
*推荐方案: 方案 A（Auth Context + Axios Interceptor）*
