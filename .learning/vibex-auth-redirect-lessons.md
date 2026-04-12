# VibeX 认证重定向项目 — 经验教训总结

**项目**: vibex-auth-redirect
**分析日期**: 2026-04-11
**项目周期**: 1 天（分析 → PRD → 架构 → 实现 → 测试）
**核心功能**: 401 自动重定向 + 登录成功 returnTo

---

## 一、做得好的地方

### 1.1 提案流程严谨

- **多方案对比**: Analysis 阶段提出了 2 个方案（A: Auth Context + Interceptor vs B: Next.js Middleware），从工期、复杂度、风险等维度打分，推荐方案 A。最终 Architecture 阶段还做了 ADR 升级（改用 Window CustomEvent 总线），进一步优化了方案。
- **驳回红线检查**: Analysis 末尾有「驳回红线」检查，需求模糊/缺少验收标准/未执行 Research 三项均通过，减少了无效提案进入开发。
- **Epic/Story 粒度合理**: PRD 将需求拆为 3 个 Epic、9 个 Story，每个 Story 有明确的工时估算（小时级）和可写的 `expect()` 断言。

### 1.2 PRD 质量高

- **验收标准可执行**: PRD 中的 Story 验收标准直接是 Playwright/Vitest 的 `expect()` 语句，Dev 可以直接拿来做 TDD。这是 PRD 质量的黄金标准。
- **安全风险优先处理**: 在 Story 2.4（Epic 2 中）前置了 Open Redirect 白名单校验（`validateReturnTo`），而不是事后打补丁。整个设计从一开始就嵌入了安全思维。
- **DoD 清晰**: 每个 Epic 有明确的「完成条件」checklist，Dev 自检有据可依。

### 1.3 技术方案设计优秀

- **Window CustomEvent 总线优于直接 router.push**: Architecture 阶段的 ADR-001 决策改用事件总线解耦 httpClient 和路由逻辑，优于 PRD 原始推荐的「Axios Interceptor 直接跳转」。这个决策理由充分（解耦、可测试、可扩展）。
- **returnTo 存储选型正确**: 用 `sessionStorage` 而非 URL 参数传递 returnTo，避免了 OAuth callback URL 长度限制和浏览器历史污染，同时防止了 query string 泄露。
- **logout 标记分离**: `auth_is_logout` flag 巧妙区分「主动登出」和「被动 401」，避免了 logout 后 pending requests 触发 redirect 的边缘 case。

### 1.4 编码规范文档化（AGENTS.md）

- **4 条安全红线**: AGENTS.md 明确定义了禁止事项（开放重定向、跳过守卫、混淆 logout 与 401、修改已有安全逻辑），Reviewer 有标准可循。
- **文件变更白名单**: 明确列出允许修改的 9 个文件，防止 scope creep。
- **validateReturnTo 校验顺序规范**: 文档化了 5 种校验的顺序（null → 非/开头 → 协议前缀 → // → ../），实现与文档一致。

### 1.5 实现完成度高

| 组件 | 状态 | 说明 |
|------|------|------|
| `AuthError` 类 | ✅ 已实现 | `client.ts` 中抛出含 `isAuthError` + `returnTo` 的错误 |
| `auth:401` 事件广播 | ✅ 已实现 | `client.ts` 401 拦截器中 `window.dispatchEvent` |
| `useAuth` 全局监听 | ✅ 已实现 | `useAuth.tsx` 中 `useEffect` 监听并 `router.push('/auth')` |
| `validateReturnTo` | ✅ 已实现 | `auth/page.tsx` 顶部，含 5 种校验 |
| AuthForm returnTo | ✅ 已实现 | 读 sessionStorage → validate → router.push |
| OAuth returnTo | ✅ 已实现 | URL 参数读入 + sessionStorage 持久化 |
| Auth 页面守卫 | ✅ 已实现 | `useAuth` 中 pathname === '/auth' 时 skip |
| logout 标记 | ✅ 已实现 | `auth_is_logout` flag 在 logout 和 401 处理中生效 |
| 单元测试 | ✅ 已实现 | `validateReturnTo.test.ts` 覆盖 9 个边界 case |
| Changelog | ✅ 已更新 | changelog/page.tsx 记录了所有 Epic 的完成状态 |

---

## 二、需要改进的地方

### 2.1 E2E 测试未实际编写

**问题**: PRD 中规划了 TC-004~TC-008 共 5 个 E2E 测试用例，详细到可以直接写 Playwright 代码，但最终只有 `validateReturnTo` 的单元测试被创建，`tests/e2e/login-state-fix.spec.ts` 中的 TC-004~TC-008 测试体是「设计文档」而非「实际可运行的测试」。

**影响**: 功能虽然实现，但端到端行为没有自动化验证覆盖。遗留 bug（如 `/auth` 循环守卫遗漏）无法被自动检测。

**下次做法**: 
- E2E 测试文件必须和功能代码一起提交，不能只写到 PRD 里
- 可以用 Playwright 的 `page.route()` 做 401 mock，直接测试完整链路

### 2.2 文档与实现路径不一致

**问题**: PRD 中描述的文件路径与实际代码不符：
- PRD: `src/lib/httpClient.ts` → 实际: `src/services/api/client.ts`
- PRD: `src/contexts/AuthContext.tsx` → 实际: `src/hooks/useAuth.tsx`

Architecture 阶段做了路径修正（Section 8），但修正信息散布在 Architecture 文档中，没有同步回 PRD，导致后续阅读者容易困惑。

**下次做法**: 
- 文档路径应与实际文件结构实时同步
- 或在文档开头加「路径说明」章节，明确哪些路径是规划 vs 实际

### 2.3 文档投入与功能规模不匹配

**问题**: 这是一个约 1 天工时的功能，但产生了 5 份详细文档（analysis.md、prd.md、architecture.md、IMPLEMENTATION_PLAN.md、AGENTS.md），加上 changelog 记录，总计超过 1500 行文档。文档写作本身成为了关键路径。

**反思**: 
- 对于简单功能（单一 Epic、<5 个 Story），可以合并 PRD + Architecture + IMPLEMENTATION_PLAN 为一份文档
- 「文档即代码」：验收标准直接是测试代码，不需要双重维护

### 2.4 OAuth 实现细节模糊

**问题**: Story 2.2（OAuth returnTo）在 PRD 中只有 0.5h 工时估算和一句话描述，实际实现分散在 `auth/page.tsx` 的 URL 参数读取 + sessionStorage 持久化，但 `src/services/oauth/oauth.ts` 是否被修改未验证。OAuth callback 的完整链路（provider → callback URL → returnTo 透传 → 登录 → 恢复）没有完整验证。

**下次做法**: 
- OAuth 场景需要单独的流程图和数据流说明
- OAuth callback 的 E2E 测试（TC-007）必须实际写出并运行

### 2.5 测试文件路径不规范

**问题**: `validateReturnTo.test.ts` 放在了 `src/app/auth/validateReturnTo.test.ts`，而非规范的 `src/lib/__tests__/validateReturnTo.test.ts`（按 architecture.md 中的设计）。虽然功能正常，但与既定的测试目录结构不一致。

**下次做法**: 
- 纯工具函数测试应放在 `src/lib/__tests__/` 下
- UI 组件测试放在 `src/app/<page>/` 或 `src/components/__tests__/`

### 2.6 完成后无正式验收报告

**问题**: 项目完成后没有 `COMPLETION.md` 或类似的验收报告，只有 changelog 中的一行记录。没有人在实现后对照 PRD 的 DoD checklist 做正式核对。

**下次做法**: 
- 完成时必须有完成报告，对照 DoD checklist 逐项打勾
- 包括：测试运行结果（vitest + playwright）、build 结果、安全测试截屏

---

## 三、可复用的模式

### 3.1 Window CustomEvent 总线模式

**适用场景**: 需要跨多个不相关的模块广播「认证状态变更」等横切关注点。

**为什么好用**:
- 解耦事件发送方（httpClient）和监听方（useAuth）
- httpClient 不需要引入 router 依赖
- 其他模块（如 WebSocket、analytics）可以独立监听 `auth:401` 做清理

**标准写法**:
```typescript
// 发送方（client.ts）
window.dispatchEvent(new CustomEvent('auth:401', { 
  detail: { returnTo: window.location.pathname + window.location.search } 
}));

// 监听方（useAuth.tsx）
useEffect(() => {
  const handler = (e: Event) => {
    const { returnTo } = (e as CustomEvent).detail;
    // ...
  };
  window.addEventListener('auth:401', handler as EventListener);
  return () => window.removeEventListener('auth:401', handler);
}, []);
```

### 3.2 validateReturnTo 白名单校验模式

**适用场景**: 任何用户可控的 redirect 目标 URL（包括 returnTo、oauth_callback、deeplink）。

**标准校验顺序**（顺序敏感）:
1. `null` / 空字符串 → fallback
2. 必须以 `/` 开头
3. 禁止协议前缀（`https://`, `http://`, `javascript:`, `data:`）
4. 禁止协议相对 URL（`//evil.com`）
5. 禁止路径遍历（`/../`）

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

### 3.3 AuthError 专用错误类模式

**适用场景**: 需要在 401 错误上附加额外元数据（returnTo、isAuthError 标记）供上层使用。

```typescript
export class AuthError extends Error {
  readonly isAuthError = true;
  status: number;
  returnTo: string;
  // ...
}
```

### 3.4 ADR（Architecture Decision Record）模式

**适用场景**: 对 PRD 原始方案进行优化调整时，记录决策上下文和理由。

**标准 ADR 格式**:
- **状态**: 已采纳 / 已驳回
- **上下文**: 原来是什么方案
- **决策**: 改成什么
- **理由**: 至少 3 条权衡点

ADR-001（Window CustomEvent 总线）就是这个项目最值得保留的遗产。

### 3.5 PRD Story 中直接写 expect() 断言

**适用场景**: 所有功能 PRD。

**为什么好用**: Dev 可以直接拿验收标准做 TDD，Reviewer 可以直接对照断言检查，不需要「翻译」环节。

### 3.6 登录状态分离标记（auth_is_logout flag）

**适用场景**: logout 和 401 都需要清除 token 但行为不同的系统。

```typescript
// logout 时
sessionStorage.setItem('auth_is_logout', '1');
// → API 调用 → 清除 token

// 401 拦截器中
if (sessionStorage.getItem('auth_is_logout') === '1') {
  sessionStorage.removeItem('auth_is_logout');
  // 不 dispatch auth:401
} else {
  window.dispatchEvent(new CustomEvent('auth:401', { detail: { returnTo } }));
}
```

### 3.7 SessionStorage key 命名约定

| Key | 用途 | 生命周期 |
|-----|------|---------|
| `auth_token` | JWT Token | 登录时写入，logout/401 时清除 |
| `auth_return_to` | 401 前的页面路径 | 触发时写入，登录成功后清除 |
| `auth_is_logout` | 主动登出标记 | logout 时写入，下一次 401 检查后清除 |

---

## 四、下次避免的坑

### 4.1 不要在文档里「设计」E2E 测试，要直接写出来

E2E 测试是验收的最后一道防线，必须和代码一起交付。规划到文档里的测试用例永远存在「最后没时间写」的风险。

**操作建议**: 
- 每个 Epic 的最后一个 Story 固定是 E2E 测试
- E2E 测试文件必须在 PR 中存在，Reviewer 必须检查
- 用 `page.route()` mock API 响应，不需要依赖真实后端

### 4.2 不要为小功能写太多文档

1 天工时的功能不需要 5 份文档。文档层级应该和功能复杂度匹配：

| 功能规模 | 文档数量 | 建议 |
|---------|---------|------|
| 单一功能（1 Epic） | 1 份 | PRD + Architecture + IMPLEMENTATION 合并 |
| 中等功能（2-3 Epic） | 2 份 | PRD + Architecture/IMPLEMENTATION |
| 大型功能（多 Epic，多团队） | 3-4 份 | PRD + Architecture + IMPLEMENTATION + AGENTS |

### 4.3 不要混用 sessionStorage 和 URL 参数传递 returnTo

这个项目混用了两种方式：
- 401 → sessionStorage（`auth_return_to`）
- OAuth callback → URL 参数（`?returnTo=xxx`）

虽然最终都通过 `validateReturnTo` 校验，但 OAuth 的 URL 参数透传路径没有 E2E 测试验证，属于潜在的未覆盖路径。

**建议**: 统一用 sessionStorage，OAuth callback 落地后立即写入 sessionStorage，然后 redirect 到 `/auth`。

### 4.4 不要在没有 CI 的情况下声称「测试通过」

Architecture 文档中规划了 CI 集成（auth-redirect.yml），但最终没有执行。`pnpm build` 是否通过、`pnpm vitest run` 的输出结果，都没有记录。

**操作建议**: 
- 完成时必须运行完整测试命令并截屏/记录结果
- CI 配置（如果需要）应该作为 Epic 的一部分

### 4.5 不要忘记 Auth 页面守卫

这是最容易引入循环 redirect 的地方。`window.location.pathname === '/auth'` 的守卫条件必须在 `useAuth` 的全局监听中实现，且必须有单元测试覆盖。

### 4.6 不要忽视 OAuth 的特殊性

OAuth 登录后 token 可能是从 cookie 设置的（而非 localStorage/sessionStorage），和普通登录的 token 来源不同。需要确认 `useAuth` 的 token 同步机制在 OAuth 场景下也能触发 `auth:401` 的正确处理。

---

## 五、总结

| 维度 | 评分 | 说明 |
|------|------|------|
| 分析质量 | ⭐⭐⭐⭐⭐ | 多方案对比、红线检查、历史经验检索 |
| PRD 质量 | ⭐⭐⭐⭐⭐ | expect() 直接可执行、安全优先、DoD 清晰 |
| 架构设计 | ⭐⭐⭐⭐⭐ | ADR 决策、事件总线设计、完整数据流图 |
| 实现完成度 | ⭐⭐⭐⭐ | 核心功能全部实现，但 E2E 测试缺失 |
| 文档适度性 | ⭐⭐ | 文档量与功能规模不匹配（过度文档化）|
| 安全设计 | ⭐⭐⭐⭐⭐ | validateReturnTo 白名单、logout 标记分离、Auth 守卫 |
| 测试覆盖 | ⭐⭐⭐ | 单元测试有，E2E 测试停留在规划阶段 |
| 完成后验收 | ⭐⭐ | 无正式 completion report，changelog 不够详细 |

**总体评价**: 这是一个「分析-设计-实现」质量很高的项目，PRD 和 Architecture 的水准可以作为团队标杆。最大的短板是测试交付（E2E 测试写了等于没写）和文档过度（5 份文档服务 1 天工时的功能）。核心经验是：**把 E2E 测试当代码写，别当文档写；把文档和功能一起交付，别写完文档就交差。**

---

*经验教训分析: Coord Agent（/ce:compound）*
