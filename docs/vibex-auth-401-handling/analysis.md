# 分析报告：vibex-auth-401-handling — 401 未登录统一跳转到登录页且登录后回到登录前页

> **任务**: vibex-auth-401-handling / analyze-requirements
> **Agent**: analyst
> **日期**: 2026-04-13
> **状态**: Phase1 进行中

---

## 1. 问题描述（Problem Statement）

### 核心问题
未登录用户访问受保护页面（如 `/canvas`、`/dashboard`）时，401 响应后应统一跳转登录页，登录完成后应回到原始页面。

### 当前实现现状（基于 Git History）

| Epic | 状态 | 说明 |
|------|------|------|
| E1 Epic 1：401 redirect core mechanism | ✅ 已实现 | `src/middleware.ts`、httpClient 401 handler、`auth:401` 事件 |
| E1 Epic 2：returnTo redirect with validateReturnTo | ✅ 已实现 | `validateReturnTo` 函数、登录后 redirect |
| **关键缺口**：登录后 Cookie 设置 | ❌ 未实现 | 见下方根因分析 |

---

## 2. Research 成果

### 2.1 历史经验（Learnings）

#### KB-auth-001：登录状态未持久化（P0，已解决）
- **根因**：`useState(false)` 无 localStorage/Zustand persist → 刷新后状态丢失
- **修复**：Zustand `persist` 中间件 + `auth-storage` key
- **对本任务启示**：authStore 已使用 persist，需确认 persist 配置是否正确

#### KB-auth-002：预览组件未订阅 auth 状态变化（P0，已解决）
- **根因**：Preview 组件未订阅 `useAuthStore` 状态
- **对本任务启示**：所有涉及 auth 状态的组件必须显式订阅 store

#### canvas-cors-preflight-500：OPTIONS 401 级联
- **根因**：OPTIONS 请求无 Authorization header → 被 authMiddleware 拦截 → 401 → 被前端当错误处理 → 500
- **修复**：`protected_.options('/*')` 注册在 `authMiddleware` 之前
- **对本任务启示**：CORS preflight 与 auth 的交互需要测试覆盖

#### vibex-dev-security-20260410：API Auth 实现
- 16 个 API 路由需要 auth，免登录路由：`/health`、`/auth/login`、`/auth/register`、`/auth/logout`
- `apiAuth.ts` 中间件工具：`checkAuth()`、`withAuth()`、`optionalAuth()`、`requireAuth()`
- JWT 通过 `getAuthUser()` / `authMiddleware` 验证
- **对本任务启示**：API 层 auth 已完整，前端 401 handler 是最后缺失一环

### 2.2 Git History 分析

| Commit | 内容 | 关联 |
|--------|------|------|
| `3b98caf9` | feat(auth): E1 — 401 redirect core mechanism | httpClient 401 → dispatch `auth:401` event |
| `32bb53b8` | docs: E1 Epic2 returnTo redirect (validateReturnTo) | validateReturnTo 实现 + changelog 更新 |

**无更多 auth 相关 commit**：说明 E1 Epic 1/2 实现后没有后续完善。

---

## 3. 根因分析（Critical Finding）

### 🔴 核心缺陷：Cookie 设置缺失

通过代码审查发现了一个**架构性断裂**：

**Step 1 — middleware.ts 读取 Cookie**
```typescript
// src/middleware.ts
const authToken =
  request.cookies.get('auth_token')?.value ||
  request.cookies.get('auth_session')?.value;
```

**Step 2 — login 路由返回 JSON token，无 Cookie**
```typescript
// src/app/api/v1/auth/login/route.ts
return NextResponse.json({
  success: true,
  data: { token, user: {...} },  // ← 只返回 JSON，无 Set-Cookie
});
```

**结果**：登录成功后，middleware 读取不到 `auth_token` cookie → 仍然认为未登录 → 再次重定向到 `/auth` → **无限重定向循环**（用户登录后仍被踢回登录页）。

### 其他缺口

| 缺口 | 说明 |
|------|------|
| `logout` 端点不清 Cookie | `/api/v1/auth/logout/route.ts` 未设置 `Set-Cookie` 清空 `auth_token` |
| `register` 端点无 Cookie | 注册成功后同 login，无 httpOnly cookie 设置 |
| 前端 logout 清理不完整 | `useAuthStore.logout()` 清理 sessionStorage，但 middleware 仍能读到旧 cookie |

---

## 4. 业务场景分析

### 用户旅程
```
未登录用户 A → 访问 /canvas
    ↓ middleware 检查 cookie → 无 → 重定向 /auth?returnTo=/canvas
用户 A → 登录页看到 returnTo 参数
用户 A → 登录
    ↓ 登录成功
→ 回到 /canvas（预期行为）
```

### 目标用户
- **首次访问用户**：从未登录，需注册/登录后继续访问
- **会话过期用户**：之前登录过，token 过期后访问受保护页面
- **多设备用户**：需保证 cookie 跨标签页有效

---

## 5. Jobs-To-Be-Done (JTBD)

### JTBD-1：未登录访问受保护页面时自动跳转登录页
**作为一个** 未登录用户，**我想要** 访问 `/canvas` 时自动跳转到登录页，**以便** 完成登录后继续工作。

**验收标准**：
- [ ] AC-1：未登录用户直接访问 `/canvas`，middleware 返回 307 重定向到 `/auth?returnTo=/canvas`
- [ ] AC-2：同样的保护适用于 `/dashboard`、`/design`、`/project-settings`、`/preview`
- [ ] AC-3：已登录用户访问 `/canvas` 无任何重定向

### JTBD-2：登录后自动回到原始页面
**作为一个** 登录用户，**我想要** 登录后自动回到 `returnTo` 指定页面，**以便** 无缝衔接工作。

**验收标准**：
- [ ] AC-4：登录成功后，读取 `auth_return_to`，验证后 redirect 到原页面
- [ ] AC-5：`validateReturnTo` 阻止开放重定向攻击（5 种绕过方式均被拦截）
- [ ] AC-6：注册成功后同样 redirect 到 `returnTo`
- [ ] AC-7：登录成功后，middleware 读取到 `auth_token` cookie，后续访问不再重定向

### JTBD-3：登出后正确清理状态
**作为一个** 已登录用户，**我想要** 登出后清除所有认证状态，**以便** 安全退出。

**验收标准**：
- [ ] AC-8：调用 logout 后，`sessionStorage` 和 `localStorage` 中的 auth token 被清除
- [ ] AC-9：logout 后，middleware 读取不到 `auth_token` cookie
- [ ] AC-10：logout 后访问受保护页面，重新触发 401 → 跳转登录页

---

## 6. 技术方案选项

### 选项 A：修复 Cookie 设置 + 前端一致性（推荐）

**核心思路**：登录成功后，后端设置 httpOnly cookie，前端保持 Authorization header 双保险。

**实现步骤**：

**Step 1：修改 login/register 路由设置 Cookie**
```typescript
// login/route.ts — 在 return 前添加 Set-Cookie
const response = NextResponse.json({ success: true, data: { token, user: {...} } });
response.cookies.set('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
});
return response;
```

**Step 2：修改 logout 路由清除 Cookie**
```typescript
const response = NextResponse.json({ success: true });
response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
return response;
```

**Step 3：前端 logout 清理 + 通知 middleware**
```typescript
// logout 函数：
sessionStorage.removeItem('auth_token');
localStorage.removeItem('auth_token');
document.cookie = 'auth_token=; max-age=0; path=/'; // 清除 cookie
```

**Step 4：前端 httpClient 保留 Authorization header 双保险**
```typescript
// 每次请求带上 Authorization header（cookie 失效时的备选）
instance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**优点**：
- 解决架构性断裂，middleware 和前端行为一致
- httpOnly cookie 防 XSS
- 7 天有效期无需频繁登录

**缺点**：
- 需要修改后端 login/register/logout 三个路由
- 跨域 cookie 需配置 domain
- 测试覆盖量大

**涉及文件**：
- `vibex-backend/src/app/api/v1/auth/login/route.ts`
- `vibex-backend/src/app/api/v1/auth/register/route.ts`
- `vibex-backend/src/app/api/v1/auth/logout/route.ts`
- `vibex-fronted/src/stores/authStore.ts`（logout 清理）

---

### 选项 B：纯前端方案（Cookie 不变）

**思路**：不修改后端，前端在登录成功后手动写入 cookie。

```typescript
// useAuth.tsx — 登录成功后写入 cookie
if (isLogin) {
  await authApi.login({ email, password });
  // 手动设置 cookie（供 middleware 读取）
  document.cookie = `auth_token=${token}; path=/; max-age=${7*24*60*60}`;
}
```

**优点**：不修改后端，改动集中在前端
**缺点**：token 明文写入 document.cookie，XSS 风险高；登录响应中 token 可能不在 JSON 中直接返回

**结论**：❌ 不推荐，安全风险不可接受。

---

### 选项 C：移除 middleware Cookie 依赖，改为 Authorization header（更大重构）

**思路**：middleware 读取请求头 `Authorization: Bearer <token>` 而非 cookie。

**优点**：架构更现代，符合 RESTful 标准
**缺点**：需要修改 middleware、login/register、logout；Next.js middleware 对 Authorization header 处理有特殊规则；破坏性变更

**结论**：❌ 超出当前任务 scope，作为独立 tech-debt 项目跟进。

---

## 7. 可行性评估

| 维度 | 评估 | 说明 |
|------|------|------|
| 技术复杂度 | ✅ 低-中 | 后端 3 个路由改 Set-Cookie，前端 logout 清理 |
| 影响范围 | ⚠️ 中 | 后端 auth routes + 前端 authStore |
| 测试覆盖 | ⚠️ 需补充 | middleware 测试 + E2E 登录跳转测试 |
| 回归风险 | 🟡 中 | logout 清理路径有改动，需测试 |
| 安全收益 | ✅ 高 | httpOnly cookie 防 XSS，returnTo 防开放重定向 |

**结论**：方案可行，推荐选项 A。

---

## 8. 风险矩阵

| 风险 ID | 风险描述 | 可能性 | 影响 | 风险等级 | 缓解措施 |
|---------|---------|--------|------|---------|---------|
| R1 | 跨域 cookie 设置失败（前后端不同域） | 中 | 高 | 🔴 高 | 配置相同 domain 或改用子域名 |
| R2 | 现有登录用户 token 与新 cookie 不兼容 | 中 | 中 | 🟡 中 | cookie 优先级高于 token，双保险 |
| R3 | logout 后 Cookie 清理时机问题 | 低 | 中 | 🟡 中 | 确保 logout API 在前端清理之前完成 |
| R4 | `validateReturnTo` 仍有漏放路径 | 低 | 高 | 🟡 中 | 补充 fuzzing 测试覆盖 |
| R5 | 注册后 redirect 逻辑与登录不一致 | 低 | 低 | 🟢 低 | 注册成功后走相同 redirect 逻辑 |

---

## 9. 工期估算

| 工作项 | 预估工时 | 说明 |
|--------|---------|------|
| Step 1：login/register 设置 httpOnly cookie | 1h | 3 个文件 |
| Step 2：logout 清除 cookie | 0.5h | 1 个文件 |
| Step 3：前端 logout 清理完善 | 0.5h | authStore.ts |
| Step 4：测试覆盖（middleware + E2E） | 2h | validateReturnTo + 跳转 E2E |
| 合计 | **4h** | |

---

## 10. 验收标准（完整）

### 必选验收标准

- [ ] **AC-1**：未登录访问 `/canvas` → middleware 307 重定向到 `/auth?returnTo=/canvas`
- [ ] **AC-2**：`/dashboard`、`/design`、`/project-settings`、`/preview` 同样保护
- [ ] **AC-3**：已登录用户访问受保护路径无重定向
- [ ] **AC-4**：登录成功后 redirect 到 `returnTo` 指定页面
- [ ] **AC-5**：`validateReturnTo` 拦截 5 种开放重定向：`null`、`https://evil.com`、`//evil.com`、`javascript:`、`/../`
- [ ] **AC-6**：登录成功后 `auth_token` cookie 被设置（httpOnly）
- [ ] **AC-7**：登录后 middleware 读取到 `auth_token`，后续页面访问不再重定向
- [ ] **AC-8**：logout 调用后 `auth_token` cookie 被清除
- [ ] **AC-9**：logout 后访问 `/canvas` 重新触发 401 → 跳转登录页
- [ ] **AC-10**：注册成功后同样 redirect 到 `returnTo`

### 测试验收

- [ ] **AC-T1**：`validateReturnTo.test.ts` 覆盖所有 5 种攻击路径 + 正常路径
- [ ] **AC-T2**：`middleware.test.ts` 覆盖未登录跳转 + 已登录放行
- [ ] **AC-T3**：E2E 测试：未登录 → 访问 `/canvas` → 跳转登录 → 登录 → 回到 `/canvas`
- [ ] **AC-T4**：E2E 测试：注册 → redirect 到 `returnTo`
- [ ] **AC-T5**：E2E 测试：logout → 访问受保护页面 → 跳转登录页

---

## 11. 待澄清问题

- [ ] **Q1**：后端 Cloudflare Workers 的 cookie domain 设置策略？前后端是否同域？
- [ ] **Q2**：现有登录用户的 `sessionStorage` token 是否需要迁移到 cookie？是否有无感知的迁移方案？
- [ ] **Q3**：logout 是否应该调用后端 `/api/v1/auth/logout` 端点，还是纯前端清理即可？

---

## 12. 执行决策

- **决策**: 待评审
- **执行项目**: vibex-auth-401-handling
- **执行日期**: 待定
