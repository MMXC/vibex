# Vibex Dev Security — Implementation Plan

**项目**: vibex-dev-security-20260410  
**日期**: 2026-04-10  
**架构师**: Architect  
**状态**: 待执行

---

## 概述

基于 `dev-proposals.md` 的 17 项提案，按安全优先级和依赖关系组织为 3 个 Sprint。

| Sprint | 周期 | 主题 | P0 | P1 | P2 | P3 |
|--------|------|------|-----|-----|-----|-----|
| Sprint 1 | 1 周 | 认证与输入校验 | 3 | 1 | 0 | 0 |
| Sprint 2 | 1 周 | XSS 防护与错误处理 | 1 | 3 | 1 | 0 |
| Sprint 3 | 0.5 周 | 收尾与验证 | 0 | 1 | 2 | 2 |

---

## Sprint 1: 认证 + 输入校验 (P0 漏洞)

**目标**: 消除未经授权 API 访问和输入校验缺失的安全漏洞。

### Sprint 1.1 — 统一 Auth Middleware (D-P0-1)

**提案**: D-P0-1  
**优先级**: P0  
**工时**: 2 天

**任务分解**:

```
Day 1 AM:  创建 shared/src/middleware/auth.ts
           - getAuthUser() 从 Authorization header 提取 JWT
           - withAuth() wrapper 函数
           - 定义 AuthUser 类型
Day 1 PM:  创建 shared/src/middleware/validate.ts
           - withValidation() generic wrapper
           - 导出公共路由列表 PUBLIC_ROUTES
Day 2 AM:  为 chat, canvas/*, ai-ui-generation 路由添加 withAuth
           (11 个文件)
Day 2 PM:  为 domain-model, prototype-snapshots, agents, pages 路由添加 withAuth
           (6 个文件)
           验证所有路由有 auth 或在 PUBLIC_ROUTES 中
```

**验收标准**:
- [ ] `GET /api/v1/canvas/generate` 无 token → 401
- [ ] `POST /api/v1/chat` 无 token → 401
- [ ] `GET /api/health` 无 token → 200
- [ ] `POST /api/auth/login` 无 token → 200
- [ ] 有 token 的请求正常通过

**依赖**: 无  
**并行**: 可与 Sprint 1.2 并行

---

### Sprint 1.2 — 输入校验 (D-P0-3)

**提案**: D-P0-3  
**优先级**: P0  
**工时**: 2 天

**任务分解**:

```
Day 1 AM:  定义 shared/src/validation/schemas.ts
           - projectIdSchema (UUID)
           - canvasGenerateSchema
           - canvasGenerateContextsSchema
           - canvasGenerateComponentsSchema
           - canvasGenerateFlowsSchema
Day 1 PM:  实现 shared/src/middleware/validate.ts
           - withValidation() 整合 Zod
Day 2 AM:  canvas/generate, canvas/generate-contexts,
           canvas/generate-components, canvas/generate-flows
           路由添加 withValidation
Day 2 PM:  编写集成测试覆盖校验拒绝场景
```

**验收标准**:
- [ ] `projectId: "not-a-uuid"` → 400 + validation details
- [ ] `pageIds: []` (空数组) → 400
- [ ] `requirements` 超过 5000 chars → 400
- [ ] 合法输入正常通过

**依赖**: Sprint 1.1 (auth middleware 需先就绪)  
**并行**: 可与 Sprint 1.1 并行开发 schema，独立集成

---

### Sprint 1.3 — Token Storage Migration (D-P0 延续)

**提案**: 来自 architecture.md ADR-001  
**优先级**: P0  
**工时**: 0.5 天

**任务分解**:

```
0.5 day:  搜索所有 localStorage.setItem('auth_token')
          替换为 sessionStorage.setItem('auth_token')
          搜索所有 localStorage.getItem('auth_token')
          替换为 sessionStorage.getItem('auth_token')
          验证 auth hook 全部使用 sessionStorage
```

**验收标准**:
- [ ] DevTools 检查：auth_token 在 sessionStorage，不在 localStorage
- [ ] 页面刷新后 token 保持
- [ ] 关闭标签页后 token 清除
- [ ] 登录流程 E2E 测试通过

**依赖**: 无  
**并行**: 可在任何时间独立执行

---

### Sprint 1.4 — 空 Catch 块错误处理 (D-P0-2)

**提案**: D-P0-2  
**优先级**: P0  
**工时**: 1 天

**任务分解**:

```
0.5 day:  创建 shared/src/lib/logger.ts
          - logger.debug/info/warn/error
          - 支持 LOG_LEVEL 环境变量
          - 结构化日志输出 (JSON)
0.5 day:  替换以下文件中的空 catch:
          - chat/route.ts (SSE 流解析)
          - canvas/snapshots.ts (6 处)
          - ai-ui-generation/route.ts
          - canvas/export/route.ts
          每个 catch 必须记录 error + 上下文
```

**验收标准**:
- [ ] `grep -r "catch {" --include="*.ts" src/` 无空 catch 结果
- [ ] `grep -r "catch (err) {}" --include="*.ts" src/` 无结果
- [ ] 错误响应包含有意义的信息

**依赖**: 无

---

## Sprint 2: XSS 防护 + 错误处理

**目标**: 修复 XSS 漏洞，完善前端错误处理。

### Sprint 2.1 — MermaidRenderer XSS 修复 (D-P1-4)

**提案**: D-P1-4  
**优先级**: P1  
**工时**: 1.5 天

**任务分解**:

```
Day 1 AM:  安装依赖: npm install dompurify @types/dompurify
           配置 DOMPurify allowed tags/attrs for SVG
Day 1 PM:  创建 shared/src/lib/sanitize.ts
           - sanitizeSvg()
           - sanitizeHtml()
           - 导出配置常量
Day 2 AM:  修复 4 个 MermaidRenderer 文件:
           - components/visualization/MermaidRenderer/
           - components/preview/MermaidRenderer/
           - components/ui/MermaidPreview.tsx
           - components/mermaid/MermaidRenderer.tsx
           每个用 sanitizeSvg() 包装 dangerouslySetInnerHTML
Day 2 PM:  添加 CSP header 到 next.config.js
           编写 DOMPurify 单元测试
```

**验收标准**:
- [ ] `<script>alert(1)</script>` SVG 内容经 sanitizeSvg 后无 `<script>`
- [ ] 4 个 MermaidRenderer 文件全部修复
- [ ] CSP header 在 response headers 中
- [ ] Playwright XSS 测试通过

**依赖**: Sprint 1.1 (auth) 无直接依赖  
**并行**: 可与 Sprint 2.3 并行

---

### Sprint 2.2 — 前端空 Catch 修复 (D-P1-2)

**提案**: D-P1-2  
**优先级**: P1  
**工时**: 0.5 天

**任务分解**:

```
0.5 day:  修复 5 个前端文件:
          - StreamingMessage.tsx (line 106)
          - RecentProjects.tsx (line 36)
          - OAuthConnectButton.tsx (line 42, 80)
          - ConflictDialog/index.tsx (line 76)
          - CanvasPage.tsx (line 530, 820)
          每个用 console.error 替代空 catch
          关键操作加 toast/notification
```

**验收标准**:
- [ ] `grep -r "catch.*{.*}" --include="*.tsx" src/` 前端无空 catch
- [ ] OAuth 连接失败显示错误提示

**依赖**: 无

---

### Sprint 2.3 — CORS 配置规范化

**提案**: 来自 architecture.md  
**优先级**: P1  
**工时**: 0.5 天

**任务分解**:

```
0.5 day:  更新 vibex-backend/src/middleware/cors.ts
           - 从环境变量加载 allowed origins
           - 禁止 wildcard origin
           - 验证 credentials 配置正确
           - 添加 ALLOWED_ORIGINS 环境变量文档
```

**验收标准**:
- [ ] `curl -X OPTIONS -H "Origin: evil.com"` → 403
- [ ] `curl -X OPTIONS -H "Origin: vibex.app"` → 200
- [ ] 文档中明确列出所有 allowed origins

**依赖**: 无

---

### Sprint 2.4 — 前端 Console.log 清理 (D-P1-6)

**提案**: D-P1-1 (相关: D-P1-6)  
**优先级**: P1  
**工时**: 0.5 天

**任务分解**:

```
0.5 day:  创建 shared/src/lib/logger.ts (frontend)
           替换 89 处 console.log
           配置 LOG_LEVEL 环境变量
           配置 terser 在 production build 移除 console
```

**验收标准**:
- [ ] `grep -r "console\." --include="*.ts" --include="*.tsx" src/stores src/components` 无生产级 console 调用
- [ ] `npm run build` 输出不含 console 语句

**依赖**: 无

---

## Sprint 3: 收尾 + 类型安全 + CI

**目标**: 修复类型安全问题，完善 CI 覆盖。

### Sprint 3.1 — TypeScript 类型清理 (D-P1-1, D-P2-4, D-P3-2)

**提案**: D-P1-1, D-P2-4, D-P3-2  
**优先级**: P1/P2/P3  
**工时**: 1.5 天

**任务分解**:

```
Day 1 AM:  ReactFlow 组件类型修复:
           - CardTreeNode.tsx: 定义 CardTreeNodeProps
           - RelationshipEdge.tsx: 定义 EdgeProps
           - FlowNodes.tsx: 定义 NodeProps
           - PageNode.tsx: 定义 NodeProps
           替换 4 个文件中的 `as any`
Day 1 PM:  Backend 类型修复:
           - errorHandler.ts: `as any` → 正确 Hono 类型
           - `details?: any` → `details?: unknown`
Day 2 AM:  测试 mock 类型:
           - 使用 vi.mocked() + 正确类型替代 as any
```

**验收标准**:
- [ ] 组件源码中 `as any` 数量 ≤ 0
- [ ] `npm run build` TypeScript 类型检查通过

**依赖**: 无

---

### Sprint 3.2 — Backend CI 测试覆盖 (D-P2-6)

**提案**: D-P2-6  
**优先级**: P2  
**工时**: 0.5 天

**任务分解**:

```
0.5 day:  更新 .github/workflows/test.yml
           添加 backend-test job
           配置 pnpm --filter vibex-backend run test
           验证 backend 测试在 CI 中通过
```

**验收标准**:
- [ ] GitHub Actions 显示 backend-test job 通过
- [ ] backend 测试失败 → PR 无法合并

**依赖**: Sprint 1 (backend auth 必须先工作)

---

### Sprint 3.3 — E2E 安全测试 (D-P3-1 相关)

**提案**: D-P3-1 相关  
**优先级**: P3  
**工时**: 0.5 天

**任务分解**:

```
0.5 day:  补充 Playwright 安全测试:
           - auth-token-sessionstorage.spec.ts
           - xss-mermaid.spec.ts
           - api-auth-bypass.spec.ts
           - input-validation.spec.ts
```

**验收标准**:
- [ ] 4 个安全 E2E 测试全部通过
- [ ] 安全测试加入 CI pipeline

---

## 总工时估算

| Sprint | 任务 | 工时 |
|--------|------|------|
| Sprint 1 | Auth Middleware | 2d |
| Sprint 1 | Input Validation | 2d |
| Sprint 1 | Token Migration | 0.5d |
| Sprint 1 | Error Handling | 1d |
| Sprint 2 | XSS Prevention | 1.5d |
| Sprint 2 | Frontend Errors | 0.5d |
| Sprint 2 | CORS Config | 0.5d |
| Sprint 2 | Console Cleanup | 0.5d |
| Sprint 3 | TypeScript Fixes | 1.5d |
| Sprint 3 | Backend CI | 0.5d |
| Sprint 3 | E2E Security | 0.5d |
| **总计** | | **10.5d** |

---

## 风险与依赖

| 风险 | 影响 | 缓解 |
|------|------|------|
| Sprint 1.1 影响面大 | 16+ 路由改造，可能 break 现有功能 | 先写集成测试，CI 通过后再合并 |
| DOMPurify SSR 兼容 | Next.js SSR 可能缺少 DOM | 用 isomorphic-dompurify 或客户端清洗 |
| JWT_SECRET 缺失 | 服务无法启动 | CI 添加 secret 检查，prod 用 Vault |
| ReactFlow 类型复杂 | 泛型不匹配可能导致类型错误 | 先在小文件试验，再推广 |

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

