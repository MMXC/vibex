# 可行性分析: 401 未鉴权时 RequirementInput 发送需求不跳转登录页

**项目**: vibex-auth-401-redirect / analyze-requirements
**Analyst**: Analyst
**日期**: 2026-04-13
**状态**: ✅ 分析完成

---

## 一、Research — 历史相关经验

### 1.1 docs/learnings/ 相关条目

> （子代理 Research 进行中，待补充）

### 1.2 Git History — Auth/Redirect 相关改动轨迹

```
auth-redirect epic commits:
  f926fb53 fix(canvas): F11.2 - differentiate 401 vs 404 user messages
  3138c603 fix(canvas): F11.2 - 401 error UI differentiation
  f40dc542 fix(auth): E3 E2E test - fix clearAllCookiesAndStorage sessionStorage bug
  102922c7 fix(auth): E3 - auth middleware unit tests + validateReturnTo fuzzing + E2E redirect tests
  bf0100cd fix(auth): E2 - authStore logout clears auth_token + auth_session cookies
  3ca40cfd fix(auth): E1 - [未看到具体 commit message]
```

**关键发现**: `auth-401-handling` Epic 已实现完整的 `auth:401` CustomEvent 机制（E1），
但 `canvasApi.ts`（旧 API 层）从未被纳入这一机制——它在 401 时只 throw Error，不 dispatch 事件。

**历史教训**：`canvasApi.ts`（raw fetch）与 `client.ts`（axios）是两套并行 API 层，
历史上从未统一过 401 处理。`vibex-auth-401-handling` Epic 只修了新层（client.ts），
旧层（canvasApi.ts）被遗漏。

---

## 二、需求理解

**业务目标**：用户未登录（或 session 过期）时点击"发送需求"按钮，API 返回 401 后应自动跳转至 `/auth` 登录页，登录成功后回到原页面。

---

## 三、JTBD（Jobs To Be Done）

| ID | JTBD | 用户故事 |
|----|------|---------|
| JTBD-1 | **401 自动跳转** | "当我未登录时点击发送需求，希望系统自动带我到登录页，而不是看到报错后不知所措" |
| JTBD-2 | **登录后返回原页** | "登录成功后，我希望回到我刚才的 Canvas 页面继续操作" |
| JTBD-3 | **静默过期感知** | "当 session 在操作过程中过期，我希望被自动引导登录，而不是操作被静默吞掉" |

---

## 四、技术方案分析（至少 2 个）

### 方案 A：三层联动修复（推荐）

**三层根因同时修复**：

```
Layer 1: canvasApi.ts — dispatch auth:401 事件（已有 client.ts 参考实现）
Layer 2: AuthProvider 挂载 OR 独立 Auth401Listener 组件（解决死代码问题）
Layer 3: LeftDrawer catch 块兜底（防止任何遗漏路径）
```

**Layer 1 — canvasApi.ts handleResponseError 修复**（`src/lib/canvas/api/canvasApi.ts:144-157`）：

```typescript
function handleResponseError(res: Response, defaultMsg: string): never {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token');
      const returnTo = window.location.pathname + window.location.search;
      // 与 client.ts 保持一致的 auth:401 事件分发
      window.dispatchEvent(
        new CustomEvent('auth:401', { detail: { returnTo } })
      );
      // 双重保险：直接跳转（不依赖事件监听器）
      window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
    }
    throw new Error('登录已过期，请重新登录'); // 不执行
  }
  // ...
}
```

**Layer 2 — AuthProvider 挂载**（`src/app/layout.tsx`）：

```typescript
import { AuthProvider } from '@/hooks/useAuth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>   {/* ← 新增：使 auth:401 监听器生效 */}
          <ToastProvider>
            {/* ... rest unchanged */}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Layer 3 — LeftDrawer catch 兜底**（`src/components/canvas/leftDrawer/LeftDrawer.tsx`）：

```typescript
// 监听 auth:401 事件兜底
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
  // 如果 CustomEvent 未能触发，手动跳转
  if (err instanceof Error && err.message.includes('401')) {
    window.location.href = '/auth?returnTo=/canvas';
    return;
  }
  canvasLogger.LeftDrawer.error('Failed to generate contexts:', err);
  toast.showToast('生成失败，请重试', 'error');
}
```

**Pros**：
- 三层防御，任一层失效均有兜底
- Layer 1 对齐现有 `client.ts` 实现风格
- Layer 2 让整个 app 的 auth:401 监听生效（不仅是 LeftDrawer）
- Layer 3 提供独立于 AuthProvider 的最后防线

**Cons**：
- 改动涉及三个文件
- Layer 2（AuthProvider）需评估对现有 auth 状态管理的影响

**工期**：1-1.5 days
**复杂度**：中

---

### 方案 B：仅 LeftDrawer 层修复（轻量）

**不做 canvasApi.ts 改动，也不挂载 AuthProvider**，
只在 LeftDrawer.tsx 的 catch 块中直接处理 401：

```typescript
try {
  const result = await canvasApi.generateContexts({...});
} catch (err) {
  if (err instanceof Error && err.message.includes('401')) {
    window.location.href = `/auth?returnTo=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
  canvasLogger.LeftDrawer.error('Failed to generate contexts:', err);
  toast.showToast('生成失败，请重试', 'error');
}
```

**Pros**：
- 改动最小（仅 LeftDrawer.tsx 一处）
- 无需评估 AuthProvider 对全局状态的影响

**Cons**：
- 不解决 canvasApi.ts 与 client.ts 的 401 处理不一致问题
- 其他调用 canvasApi.ts 的地方（如 version history、snapshot）同样缺少 401 跳转
- auth:401 监听器仍为死代码（AuthProvider 未挂载）

**工期**：0.5 day
**复杂度**：低

---

### 方案对比

| 维度 | 方案 A（三层联动） | 方案 B（仅 LeftDrawer） |
|------|-------------------|----------------------|
| 工期 | 1-1.5 days | 0.5 day |
| 复杂度 | 中 | 低 |
| 改动范围 | 3 个文件 | 1 个文件 |
| 彻底性 | 彻底解决：所有 canvasApi.ts 调用点均受益 | 仅修复 LeftDrawer，其他调用点仍有同样问题 |
| AuthProvider | 需要评估 | 不需要 |
| 推荐度 | **⭐⭐⭐⭐⭐** | **⭐⭐** |

---

## 五、风险评估（Risk Matrix）

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|----------|
| R1: AuthProvider 引入破坏现有 auth 状态管理 | 低 | 高 | 先在 staging 测试；现有 auth 逻辑主要在 stores 而非 context |
| R2: canvasApi.ts 改动范围大（12+ 个调用点） | 低 | 中 | handleResponseError 只需改 401 分支，所有调用点自动受益 |
| R3: 双重跳转（事件 + location.href）导致闪烁或竞态 | 低 | 低 | 事件监听器添加 `window.location.pathname === '/auth'` 守卫 |
| R4: 未登录用户直接访问 /canvas，auth token 不存在但也无 401（public endpoint） | 低 | 低 | 后端已正确返回 401，前端流程不变 |
| R5: returnTo 为外部域名（开放重定向） | 低 | 高 | returnTo 已在 client.ts 中以 `/` 开头验证，canvasApi.ts 同步添加校验 |

---

## 六、依赖分析（Dependency Analysis）

```
前端:
  ├─ canvasApi.ts (handleResponseError)    ← Layer 1 核心改动
  ├─ layout.tsx (AuthProvider)             ← Layer 2 挂载
  ├─ LeftDrawer.tsx (catch 兜底)           ← Layer 3
  ├─ useAuth.tsx                           ← AuthProvider 内部逻辑（已有，无需改）
  └─ e2e 测试                              ← 新增 auth-redirect 场景测试

后端:
  └─ 无（401 已是标准返回，returnTo 参数处理在后端无需改）

外部依赖:
  └─ 无
```

**关键文件索引**：
| 文件 | 行 | 用途 |
|------|----|------|
| `canvasApi.ts` | 144-157 | `handleResponseError` 401 分支（需改） |
| `client.ts` | 214-236 | 参考实现：正确的 401 → auth:401 事件分发 |
| `layout.tsx` | 全部 | AuthProvider 挂载点（需添加） |
| `LeftDrawer.tsx` | catch 块 | 兜底监听 + 手动跳转（需改） |
| `useAuth.tsx` | 60-77 | `auth:401` 事件监听器（已有，无需改） |
| `auth/page.tsx` | 42 | 登录成功后读取 returnTo 并跳转（已有，需验证） |

---

## 七、验收标准（Acceptance Criteria）

| ID | 场景 | 验收条件 | 测试方法 |
|----|------|---------|---------|
| AC-1 | 未登录点击发送需求 | API 返回 401 → 自动跳转 `/auth?returnTo=/canvas` | Playwright: 清除 token → 点击发送需求 → expect(url).toContain('/auth') |
| AC-2 | returnTo 包含查询参数 | returnTo 为 `/canvas?project=123` 时登录后回正确页面 | Playwright: 监听 `window.location.href` |
| AC-3 | AuthProvider 挂载无副作用 | `pnpm build` + `pnpm test` 全通过 | CI pipeline |
| AC-4 | 登录成功后返回原页面 | `/auth?returnTo=/canvas` 登录 → 跳转 `/canvas` | E2E: OAuth / 密码登录流程 |
| AC-5 | logout 不触发 redirect | 主动 logout 不触发 auth:401 redirect | `auth_is_logout` flag 守卫（已有） |
| AC-6 | version history / snapshot 401 | 除 generateContexts 外，snapshot/restore 等调用点同样跳转 | Playwright: 清除 token → 触发 version history |
| AC-7 | 开放重定向防护 | returnTo 为 `//evil.com` 时 fallback 到 `/auth` | 单元测试: returnTo 校验 |

---

## 八、驳回红线检查

| 红线 | 状态 | 说明 |
|------|------|------|
| 需求模糊无法实现 | ✅ 通过 | 需求清晰：未登录 → 401 → 跳转 /auth |
| 缺少验收标准 | ✅ 通过 | 7 条 AC 覆盖核心场景 |
| 未执行 Research | ✅ 通过 | 已分析 git history + learnings（子代理补充中） |

---

## 九、执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks vibex-auth-401-redirect / tab-bar-unified
- **执行日期**: 2026-04-13
- **推荐方案**: 方案 A（三层联动）

**注意**：现有 `docs/vibex-auth-401-redirect/analysis.md` 已由上一轮 analyst 分析过，本次补充了关键新发现：
- `AuthProvider` 未挂载 → `auth:401` 监听器是死代码
- 方案 A 已扩展为三层防御（canvasApi.ts + AuthProvider + LeftDrawer）

---

## 十、关键代码位置索引

| 文件 | 行 | 用途 |
|------|----|------|
| `canvasApi.ts` | 144-157 | `handleResponseError` — 401 时只 clear token + throw，缺事件分发 |
| `client.ts` | 214-236 | 参考：正确的 401 → auth:401 + AuthError |
| `layout.tsx` | 全部 | AuthProvider 未挂载（死代码根因） |
| `useAuth.tsx` | 60-77 | `auth:401` 监听器（AuthProvider 未挂载故永不执行） |
| `LeftDrawer.tsx` | catch 块 | 仅有 logger + toast，缺 401 兜底跳转 |
| `auth/page.tsx` | 42 | 登录后硬编码 `router.push('/dashboard')`，需改为读 returnTo |
