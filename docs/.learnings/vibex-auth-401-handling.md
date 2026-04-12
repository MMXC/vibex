# 项目经验沉淀：vibex-auth-401-handling

> 项目完成时间：2026-04-13
> 项目目标：修复 401 未登录无限重定向循环
> 核心教训：架构层断裂不能靠试错发现，必须在设计阶段做系统建模

---

## 1. 核心根因（Root Cause）

**问题链路**：
```
login/register API
  ↓ 只返回 JSON { token, user }
  ↓ 无 Set-Cookie

middleware.ts
  ↓ 依赖 auth_token httpOnly cookie 判断登录状态
  ↓ 读不到 cookie
  ↓ 307 重定向 /auth

用户：登录成功 → 立刻被踢回登录页 → 无限循环
```

**根因分类**：架构性断裂（Architectural Disconnect）—— 两个组件（API 层 + middleware 层）对同一认证状态的读写方式不一致，一个写 JSON，一个读 Cookie。

---

## 2. 审查发现的关键缺陷（coord-decision 捕获）

### Blocker 级（必须修复才能开发）

| 缺陷 | 发现阶段 | 影响 |
|------|---------|------|
| 前后端部署拓扑未确认 | CEO 审查 | 跨域时 cookie 方案可能完全不 work |
| logout 清除 cookie 缺 `secure` 属性 | 工程审查 | HTTPS 环境下清除无效，用户登不掉 |
| `auth_session` cookie 未纳入清理 | 工程审查 | middleware 读两个 cookie，logout 只清一个留后门 |
| login/register 有重复 imports | 工程审查 | TS 编译失败，dev 直接撞墙 |

### 重要级（不阻断但需修正）

| 缺陷 | 发现阶段 | 影响 |
|------|---------|------|
| `document.cookie` 清除给虚假安全感 | 设计审查 | httpOnly cookie 无法被 JS 删除，前端清除行无法真正清理 |
| logout CSRF 风险被低估 | 设计审查 | 攻击者可强制用户登出造成业务中断 |
| `validateReturnTo` 实现未提供 | 设计审查 | 安全组件实现缺失，安全防护形同虚设 |
| httpClient 双保险场景不清晰 | 设计审查 | 两个保险机制服务不同场景，文档不透明 |

---

## 3. 架构设计经验

### 经验 1：认证状态必须单一数据源

**教训**：cookie（middleware 读取）和 JSON token（API 返回）两套并存是架构反模式。

**正确做法**：认证状态只有唯一数据源，所有层（middleware、API、frontend）共享同一个认证机制。

**下次如何避免**：架构设计阶段必须画出认证数据流图，标注每个组件的读/写操作，确保只有一个写入点。

### 经验 2：Cookie 清除必须匹配 Cookie 属性

**教训**：`Set-Cookie` 的清除指令必须完整匹配原 Cookie 的所有属性，特别是 `Secure`。

**正确代码**：
```typescript
// 清除时必须带 Secure（HTTPS 环境）
response.cookies.set('auth_token', '', {
  maxAge: 0,
  secure: process.env.NODE_ENV === 'production', // ← 必须和设置时一致
  sameSite: 'lax',
  path: '/',
});
```

**下次如何避免**：制定 Cookie 清单（含属性表），所有 Cookie 操作（设置/清除/读取）都要对照清单检查属性。

### 经验 3：httpOnly cookie 的 JS 清除是假象

**教训**：`document.cookie` 无法删除 `httpOnly` cookie，这是被广泛误解的 API 行为。

**正确做法**：httpOnly cookie 的唯一真实清除路径是服务端 Set-Cookie + Max-Age=0，前端 JS 清除只能处理非 httpOnly 的残留。

**下次如何避免**：在架构文档中明确标注每个 Cookie 的清除路径，区分"服务端清除"和"前端清理"的责任边界。

### 经验 4：logout 必须清除所有相关 cookie

**教训**：middleware 检查 `auth_token` 和 `auth_session` 两个 cookie，logout 只清一个会留后门。

**正确做法**：制定所有认证相关 cookie 的清单（包含名称、来源、读取方），logout 时全部清除。

**下次如何避免**：创建 Auth Cookie Registry 文档，列出所有 auth 相关 cookie 及其用途，所有认证变更都要更新。

### 经验 5：跨域 Cookie 是架构决策，不是实现细节

**教训**：跨域 Cookie 设置（`domain` 属性）与部署拓扑强相关，不能在实现阶段才处理。

**正确做法**：架构设计阶段必须确认部署拓扑（单域/子域/跨域），将 `COOKIE_DOMAIN` 作为环境变量从一开始就纳入设计。

---

## 4. 审查流程经验

### coord-decision 的价值

本次 coord-decision 发现 8 个问题，其中 4 个 Blocker 都在开发前捕获，避免了：
- 在跨域拓扑未知的情况下开发（架构假设缺失）
- TS 编译失败导致 dev 直接卡住（重复 imports）
- HTTPS 环境下 logout 完全失效（Secure 属性缺失）

**结论**：架构审查阶段的多视角评审（CEO + 设计 + 工程）是值得的。Phase1 的成本比 Phase2 的返工低得多。

### 审查分工经验

| 审查维度 | 最适合的视角 | 发现的关键问题 |
|---------|------------|-------------|
| 业务价值 + 根因 | CEO | 跨域拓扑未确认（架构假设缺失）|
| 架构 + 安全 | 设计审查 | CSRF 风险低估、document.cookie 虚假安全感 |
| 代码 + 文件路径 | 工程审查 | 重复 imports、auth_session 遗漏、Secure 缺失 |

**结论**：三个视角互补，缺一不可。

---

## 5. 测试策略经验

### 单元测试 vs E2E 的边界

| 层级 | 覆盖范围 | 限制 |
|------|---------|------|
| 后端 auth 路由测试 | Set-Cookie header、Cookie 属性、401/409 错误处理 | 不测试浏览器行为 |
| middleware 单元测试 | 认证重定向逻辑、路径匹配 | 需要 mock NextRequest |
| validateReturnTo fuzzing | 开放重定向攻击向量 | 不涉及网络层 |
| authStore 测试 | 前端状态管理 | 不测试服务端 Cookie |
| E2E 测试 | 完整用户旅程 + Cookie 实际设置 | 需要全栈环境，脆弱 |

**结论**：E2E 测试依赖完整的测试环境（前后端同时运行），在 CI 不完整时优先保证单元测试覆盖率。

---

## 6. 技术债

| 技术债 | 来源 | 优先级 |
|--------|------|--------|
| logout CSRF Token | Epic 4 P1，当前仅用 SameSite=Lax | P1 |
| 跨域部署拓扑确认 | 依赖实际部署环境确认 | P1（上线前必须）|
| `document.cookie` 清除冗余代码 | 当前无法删除 httpOnly cookie，代码无实际作用 | P2 |
| sessionStorage 与 Cookie 双保险混乱 | httpClient 的 Bearer header 场景与 middleware 不重叠 | P3 |

---

## 7. 快速参考

### Cookie 设置检查清单（新开发必须对照）

- [ ] `httpOnly: true`（防 XSS）
- [ ] `secure: process.env.NODE_ENV === 'production'`（HTTPS 必须）
- [ ] `sameSite: 'lax'`（允许同站导航携带）
- [ ] `maxAge` 或 `expires` 设置合理过期时间
- [ ] `path: '/'`（根路径）
- [ ] `domain` 与部署拓扑匹配（环境变量控制）
- [ ] logout 清除时 `secure` 属性必须与设置时一致
- [ ] 确认 middleware 读取的 cookie 名称与设置的一致

### 认证架构建模清单（新功能必须做）

1. 画出认证数据流图（用户 → middleware → API → DB）
2. 标注每个节点的读/写操作
3. 确认只有一个写入点（Single Source of Truth）
4. 列出所有认证相关 Cookie（含名称、属性、来源）
5. 确认 logout 清除所有相关 Cookie
6. 验证跨域场景下的 Cookie 行为
7. CSRF 风险评估（即使是 SameSite=Lax）
