# Vibex Dev Security — Agent Roles & Responsibilities

**项目**: vibex-dev-security-20260410  
**日期**: 2026-04-10  
**架构师**: Architect

---

## 团队角色定义

| 角色 | Agent | 主要职责 |
|------|-------|----------|
| 🛠️ Dev | dev | 实现所有安全修复代码 |
| 🔍 Reviewer | reviewer | 代码审查、安全验证 |
| 🏛️ Architect | architect | 架构设计、技术决策 |

---

## Dev Agent 职责

### 核心职责

实现 `IMPLEMENTATION_PLAN.md` 中定义的所有安全修复任务。

### 任务领取规则

1. **领取格式**:
   ```
   📌 领取任务: vibex-dev-security-20260410/<sprint-task>
   👤 Agent: dev
   ⏰ 时间: <timestamp>
   🎯 目标: <task description>
   ```

2. **任务映射**:
   - Sprint 1 → dev (auth, validation, token, errors)
   - Sprint 2 → dev (XSS, CORS, console cleanup)
   - Sprint 3 → dev (TypeScript, CI, E2E)

3. **任务粒度**: 每个子任务单独领取，完成后更新状态

### 实现规范

#### Auth Middleware (Sprint 1.1)

- 文件: `shared/src/middleware/auth.ts`
- 导出: `withAuth`, `getAuthUser`, `AuthUser`, `PUBLIC_ROUTES`
- 每个受影响的 route 文件顶部添加 `import { withAuth } from '@/middleware/auth'`
- handler 签名: `(req, { auth }) => Response`
- `auth.userId` 必不为 null

#### Input Validation (Sprint 1.2)

- 文件: `shared/src/validation/schemas.ts`
- 每个 schema 必须有 JSDoc 注释说明校验规则
- 错误响应格式:
  ```json
  {
    "error": "Validation failed",
    "details": { "field": [{ "message": "..." }] }
  }
  ```
- 状态码: 400 (bad request), 401 (unauthorized), 500 (server error)

#### Token Storage (Sprint 1.3)

- 全局搜索: `localStorage.setItem.*auth` 和 `localStorage.getItem.*auth`
- 替换为: `sessionStorage.setItem/getItem`
- 验证: `grep -r "localStorage.*auth" --include="*.ts" --include="*.tsx"` 无结果

#### Error Handling (Sprint 1.4)

- 文件: `shared/src/lib/logger.ts` — 统一 logger
- 每个 catch 必须包含:
  ```typescript
  catch (err) {
    logger.error('context_description', { error: err, ...context });
    // 必须有返回值或重新抛出
  }
  ```

#### XSS Prevention (Sprint 2.1)

- 文件: `shared/src/lib/sanitize.ts`
- `sanitizeSvg(svg: string): string` — 清洗 SVG 内容
- `sanitizeHtml(html: string): string` — 清洗 HTML 内容
- 所有 `dangerouslySetInnerHTML` 调用必须经过 sanitize
- DOMPurify 配置: `USE_PROFILES: { svg: true }`

#### CSP Headers (Sprint 2.1)

- 文件: `next.config.js` / `next.config.ts`
- 添加 `securityHeaders` 数组
- 必须在 ` Content-Security-Policy` 中列出所有必要的域

### 提交流程

1. 每完成一个子任务，提交一个 commit
2. Commit message 格式: `[security] <action>: <description>`
   - 示例: `[security] auth: add withAuth middleware for API routes`
3. Push 后创建 PR，PR 标题: `security: <sprint-name> — <description>`
4. PR 描述必须包含:
   - 做了什么
   - 改动了哪些文件
   - 验收标准自检清单

### 禁止事项

- ❌ 禁止使用 `as any` 绕过类型检查（除非有明确的 TODO 并关联 ticket）
- ❌ 禁止空 catch 块
- ❌ 禁止在 localStorage 中存储任何 token
- ❌ 禁止硬编码 API keys 或 secrets
- ❌ 禁止使用 `dangerouslySetInnerHTML` 直接渲染用户输入或 LLM 输出（必须 sanitize）

---

## Reviewer Agent 职责

### 核心职责

审查所有安全相关 PR，验证修复正确性，识别遗漏风险。

### 审查检查清单

#### 必须检查项 (Security Gate)

每个 PR 必须通过以下检查项:

**认证 (D-P0-1 相关)**:
- [ ] 新增/修改的 API route 是否有 `withAuth` wrapper 或在 PUBLIC_ROUTES 中
- [ ] 是否有测试覆盖无 token → 401 场景
- [ ] `sessionStorage` vs `localStorage` 使用正确

**输入校验 (D-P0-3 相关)**:
- [ ] API body 是否有 Zod schema 校验
- [ ] UUID 格式校验是否存在
- [ ] 长度限制是否存在
- [ ] 无效输入 → 400 响应测试存在

**XSS 防护 (D-P1-4 相关)**:
- [ ] 所有 `dangerouslySetInnerHTML` 是否有对应的 `sanitize*()` 调用
- [ ] DOMPurify 配置是否包含 allowed tags/attrs
- [ ] SVG 内容是否经过 `sanitizeSvg()`

**错误处理 (D-P0-2, D-P1-2 相关)**:
- [ ] 无空 catch 块
- [ ] 每个 catch 有 logger.error 调用
- [ ] 错误响应有意义

**Secrets**:
- [ ] 无 hardcoded secrets
- [ ] API keys 从 env var 读取
- [ ] 前端代码不包含密钥

#### 推荐检查项

- [ ] TypeScript 类型正确，无 `as any`
- [ ] 日志不含敏感信息 (passwords, tokens, PII)
- [ ] CORS 配置无 wildcard
- [ ] CSP policy 合理
- [ ] Rate limiting 存在（高风险 API）

### 审查输出格式

```markdown
## Security Review: <PR Title>

### Findings

#### 🔴 Must Fix
- [file:line] Issue description
- **Impact**: Security risk
- **Recommendation**: Fix approach

#### 🟡 Should Fix
- [file:line] Issue description
- **Impact**: Potential issue
- **Recommendation**: Fix approach

#### 🟢 Approve
- [file:line] What was done well

### Security Gate Status
✅ PASS / ❌ FAIL

### Notes
Additional context for dev agent
```

### 安全审查触发条件

Reviewer 在以下情况主动介入:

1. PR 涉及 `src/middleware/`、`src/lib/auth*`、`src/lib/sanitize*`
2. PR 涉及 API route 文件
3. PR 涉及 token storage (`localStorage`, `sessionStorage`, `cookie`)
4. PR 引入了 `dangerouslySetInnerHTML`
5. PR 修改了认证/授权逻辑

---

## Architect Agent 职责

### 核心职责

架构设计、技术决策、跨任务协调。

### 设计决策范围

1. **ADR 起草**: 重大技术决策必须记录在 architecture.md 的 ADR 部分
2. **依赖管理**: 识别任务间依赖，协调执行顺序
3. **Trade-off 分析**: 每个方案需列出收益和代价
4. **风险识别**: 预判实现风险，提前预警

### 协作流程

```
Architect → Dev: 下发任务 (AGENTS.md 职责定义)
Dev → Reviewer: 提交 PR
Reviewer → Dev: 审查反馈 (Security Gate check)
Dev → Architect: 任务完成报告
Architect → Coord: 状态更新
```

### 状态更新规则

**完成时**:
```
✅ 任务完成: vibex-dev-security-20260410/<task>
📦 产出物: docs/vibex-dev-security-20260410/<file>
🔍 验证: <how verified>
```

**阻塞时**:
```
⚠️ 任务阻塞: vibex-dev-security-20260410/<task>
🔒 原因: <reason>
📋 缺失项: <missing>
❓ 问题: <question>
```

---

## 协作约定

### 沟通渠道

- **任务派发**: `#dev` 频道
- **安全相关**: `#security` 频道
- **架构讨论**: `#architect` 频道

### PR 合并条件

| 检查类型 | 必需 |
|----------|------|
| CI (lint + test) | ✅ |
| Security Review | ✅ (P0/P1) |
| Code Review | ✅ |
| Architecture Review | ✅ (涉及架构变更) |

### 回滚计划

如果 Sprint 中的修改引入生产问题:

1. **Auth middleware break**: 回退到 pre-auth 版本，紧急添加 PUBLIC_ROUTES 豁免
2. **Sanitization break**: 临时降级 DOMPurify 为 allow-all，重发 patch
3. **Token storage break**: 热修复 sessionStorage → localStorage (临时)，然后发布修复

---

## 进度追踪

| Sprint | 任务 | Dev | Reviewer | Architect | 状态 |
|--------|------|-----|----------|-----------|------|
| Sprint 1 | Auth Middleware | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 1 | Input Validation | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 1 | Token Migration | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 1 | Error Handling | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 2 | XSS Prevention | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 2 | Frontend Errors | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 2 | CORS Config | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 2 | Console Cleanup | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 3 | TypeScript Fixes | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 3 | Backend CI | ⏳ | ⏳ | ⏳ | 待领取 |
| Sprint 3 | E2E Security | ⏳ | ⏳ | ⏳ | 待领取 |

状态: ⏳ 待领取 | 🔄 进行中 | ✅ 完成 | ❌ 失败
