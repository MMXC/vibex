# 可行性分析: 认证报错重定向至登录页，登录成功后跳转回原页面

**项目**: vibex / analyze-requirements  
**Analyst**: Analyst  
**日期**: 2026-04-11  
**状态**: ✅ 分析完成

---

## 一、Research — 历史相关经验

### 1.1 docs/learnings/ 相关条目

| 历史项目 | 相关性 | 教训 |
|---------|--------|------|
| `canvas-cors-preflight-500` | 间接：401 在 OPTIONS 请求中的处理 | Hono 路由顺序影响 401 响应路径；预检请求不带 Authorization，auth 层处理不当会产生死锁 |
| `vibex-e2e-test-fix` | 直接：login-state-fix.spec.ts 已存在 | TC-001~003 覆盖了"登录抽屉"场景，但未覆盖"401 触发重定向"和"returnTo 原页面"两个关键路径 |

### 1.2 Git History — Auth 相关改动轨迹

```
b4cb4956 feat(test): E0.2 create centralized auth mock factory
f343ac66 feat(api): TanStack Query API Client (vibex-third E1-S1 修正)
b22c5277 feat(api): 统一 API Client 指标跟踪 (vibex-third E1-S1)
1d3870bb feat(analytics): analytics 前端 SDK (E3-S3)
a0a70c7b feat(vibex-dev-proposals-20260410_111231): E2 code cleanup
```

**关键发现**: Auth 相关代码没有 redirect/returnTo 的历史 commit，说明此功能为全新需求。

### 1.3 当前 Auth 架构（关键代码）

**httpClient 401 处理**（`src/services/api/client.ts:194`）：
```typescript
if (error.response?.status === 401) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }
  // ⚠️ 无 router.push('/auth') — 401 只清除了 token，未跳转
}
return Promise.reject(transformError(error));
```

**AuthForm 登录后跳转**（`src/app/auth/page.tsx:42`）：
```typescript
await authApi.login({ email, password });
router.push('/dashboard');  // ⚠️ 硬编码 /dashboard，未考虑 returnTo
```

**结论**：历史经验表明 auth 系统经过多次迭代（sessionStorage 安全迁移、AES-256-GCM OAuth 加密），但 redirect 逻辑从未实现。

---

## 二、需求理解

**业务目标**：用户访问受保护页面（如 `/project/xxx`）时，若 session 过期或 token 无效，触发 401 错误。应自动跳转至 `/auth` 页面，登录成功后**回到原页面**（而非硬编码的 `/dashboard`）。

---

## 三、JTBD（Jobs To Be Done）

| ID | JTBD | 用户故事 |
|----|------|---------|
| JTBD-1 | **401 感知重定向** | "当我正在某个页面操作时 session 过期，我希望能被自动带到登录页，而不是看到错误提示后手动点登录" |
| JTBD-2 | **returnTo 原页面** | "登录成功后，我希望能回到我刚才在操作的页面，而不是从头开始" |
| JTBD-3 | **OAuth 场景兼容** | "我通过 OAuth（Google/GitHub）登录，登录完成后也要能回到原页面" |
| JTBD-4 | **SPA + Next.js App Router 兼容** | "我在 Next.js App Router 环境下使用，SPA 路由跳转不能破坏浏览器历史记录" |

---

## 四、技术方案分析（至少 2 个）

### 方案 A：Auth Context + Axios Interceptor（推荐）

**架构**：全局 AuthContextProvider 包裹 App，监听 Axios 401 事件，触发 redirect。

```
用户操作 → API 调用 → 401 → httpClient 清 token
         → error 抛出 → AuthContext 监听 → 保存 returnTo → router.push('/auth')
         → 登录成功 → router.push(returnTo)
```

**核心实现**：

1. **httpClient 抛出带特殊标记的 401 错误**
   ```typescript
   // client.ts 改造
   if (error.response?.status === 401) {
     const authError = new Error('登录已过期，请重新登录');
     (authError as any).isAuthError = true;
     (authError as any).returnTo = window.location.pathname + window.location.search;
     throw authError;
   }
   ```

2. **AuthContext 监听 401 跳转**
   ```typescript
   // 全局 error boundary / 监听
   useEffect(() => {
     const handle401 = (event: CustomEvent) => {
       const { returnTo } = event.detail;
       sessionStorage.setItem('auth_return_to', returnTo);
       router.push('/auth');
     };
     window.addEventListener('auth:401', handle401 as EventListener);
     return () => window.removeEventListener('auth:401', handle401 as EventListener);
   }, []);
   ```

3. **AuthForm 登录成功后读 returnTo**
   ```typescript
   const returnTo = sessionStorage.getItem('auth_return_to') || '/dashboard';
   sessionStorage.removeItem('auth_return_to');
   router.push(returnTo);
   ```

**Pros**：
- 改动集中在 httpClient + auth/page.tsx 两处
- 事件驱动，组件间耦合低
- sessionStorage 存储 returnTo，不依赖 URL 参数（更安全）

**Cons**：
- 需要区分"主动登出"（不应触发 redirect）和"401 被动过期"（应触发 redirect）
- 当前 httpClient 401 处理未区分这两种情况

**工期**：1-2 days  
**复杂度**：中

---

### 方案 B：Next.js Middleware（重架构）

**架构**：Next.js 中间件层在所有请求到达页面之前检查 auth 状态。

```
Middleware: NextAuth-like pattern
  → 检查 cookie/sessionStorage 的 auth_token
  → token 过期 → 重写响应 → redirect to /auth?returnTo=xxx
```

**核心实现**：
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  
  if (!token && !isAuthPage) {
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    return NextResponse.redirect(new URL(`/auth?returnTo=${encodeURIComponent(returnTo)}`));
  }
  
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard'));
  }
}
```

**Pros**：
- 服务端层面保护，不需要每个 API 调用处理 401
- 更好的 SEO 和首屏体验（服务端直接 redirect）

**Cons**：
- Next.js App Router + 前后端混合架构下，middleware 和 SPA 路由跳转容易冲突
- sessionStorage 无法从 middleware 访问（需要改用 cookie）
- 工期较长（涉及后端 auth token 验证逻辑改造）
- **与现有 httpClient 401 处理重复**：双重保护可能产生环路

**工期**：3-5 days（涉及后端 token 验证改造）  
**复杂度**：高

---

### 方案对比

| 维度 | 方案 A（Auth Context + Interceptor） | 方案 B（Middleware） |
|------|--------------------------------------|---------------------|
| 工期 | 1-2 days | 3-5 days |
| 复杂度 | 中 | 高 |
| 改动范围 | 前端 httpClient + auth/page | 前端 + 后端 cookie 改造 |
| 兼容性 | SPA 友好 | SSR 友好 |
| 风险 | 需区分主动登出/被动过期 | 双重 401 检测可能环路 |
| 推荐度 | **⭐⭐⭐⭐** | **⭐⭐** |

---

## 五、风险评估（Risk Matrix）

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|----------|
| R1: 登录成功后 returnTo 为空（sessionStorage 未设置） | 低 | 中 | 设置默认 fallback `/dashboard` |
| R2: returnTo 指向 /auth 自身（循环 redirect） | 低 | 高 | 登录页本身不触发 401 检测；添加 `if (isAuthPage) return` |
| R3: returnTo 为外部域名（开放重定向） | 低 | 高 | 校验 returnTo 必须以 `/` 开头，白名单路径 |
| R4: 主动 logout 触发 401 redirect（误触发） | 中 | 中 | httpClient 抛出 `isLogoutAction` 标记；logout 调用前设置 `skipAuthRedirect = true` |
| R5: OAuth callback 页面 401 处理冲突 | 低 | 中 | OAuth callback 不走 SPA router，使用 URL 参数传递 returnTo |
| R6: Token 过期但用户无操作（静默过期） | 高 | 中 | **非本需求范围**，需要 refresh token 机制（见 R6 建议） |

---

## 六、依赖分析（Dependency Analysis）

```
前端:
  ├─ httpClient (src/services/api/client.ts)      ← 核心改动点
  ├─ auth/page.tsx (AuthForm)                     ← 读取 returnTo
  ├─ LoginDrawer.tsx                              ← 同步改造（第三方登录也有 returnTo）
  └─ e2e 测试 (login-state-fix.spec.ts)           ← 新增 TC

后端:
  └─ 无（token 验证在后端已是标准 JWT，401 状态码已是标准返回）
```

**外部依赖**：无新外部依赖。

---

## 七、验收标准（Acceptance Criteria）

| ID | 场景 | 验收条件 | 测试方法 |
|----|------|---------|---------|
| AC-1 | API 401 触发 redirect | 调用任意受保护 API（token 过期），应自动跳转 `/auth` | E2E: 直接访问需要 token 的 API，观察 redirect |
| AC-2 | returnTo 保存正确 | 在 `/project/123` 触发 401，登录页 URL 应保留 `returnTo` 或 sessionStorage | Playwright: 监听 `router.push` 事件 |
| AC-3 | 登录成功后返回原页面 | 从 `/project/123` → 401 → `/auth` → 登录 → 应跳转 `/project/123` | E2E: 完整链路测试 |
| AC-4 | 登录页自身不触发 redirect | 在 `/auth` 页面，httpClient 401 不应再次 redirect | 单元测试: 守卫条件 `isAuthPage` |
| AC-5 | returnTo 校验 | returnTo 若为 `//evil.com` 应 fallback 到 `/dashboard` | 单元测试: 白名单校验逻辑 |
| AC-6 | logout 不触发 redirect | 主动点击 logout，token 清除后不触发 `/auth` redirect | E2E: logout button click flow |
| AC-7 | OAuth 登录 returnTo | Google/GitHub OAuth 登录完成也应回到原页面 | E2E: OAuth flow |
| AC-8 | 默认 fallback | returnTo 未设置时，fallback `/dashboard` | 单元测试 |

---

## 八、驳回红线检查

| 红线 | 状态 | 说明 |
|------|------|------|
| 需求模糊无法实现 | ✅ 通过 | 需求清晰：401 触发 redirect + returnTo 恢复 |
| 缺少验收标准 | ✅ 通过 | 8 条 AC 覆盖核心场景 |
| 未执行 Research | ✅ 通过 | 已搜索 learnings + git history |

---

## 九、执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks vibex / login-redirect-epic
- **执行日期**: 2026-04-11
- **推荐方案**: 方案 A（Auth Context + Axios Interceptor）
- **Epic 划分**:
  - E1: httpClient 401 → redirect 事件机制
  - E2: auth/page.tsx + LoginDrawer.tsx 读取 returnTo
  - E3: E2E 测试覆盖（TC-004 ~ TC-008）
  - E4: returnTo 白名单校验（安全加固）

---

## 十、附：当前代码关键位置索引

| 文件 | 行 | 用途 |
|------|----|------|
| `src/services/api/client.ts` | 78, 194 | 401 错误转换 + token 清除 |
| `src/app/auth/page.tsx` | 42 | 登录成功后硬编码 `router.push('/dashboard')` |
| `src/components/ui/LoginDrawer.tsx` | 61-62 | 第三方登录 drawer，returnTo 同步 |
| `src/stores/authStore.ts` | - | Zustand auth 状态，token 检查逻辑 |
| `src/lib/ErrorClassifier.ts` | - | 错误分类器，401 映射到 `AUTH_001` |
| `tests/e2e/login-state-fix.spec.ts` | - | 现有 login-state E2E 测试 |
