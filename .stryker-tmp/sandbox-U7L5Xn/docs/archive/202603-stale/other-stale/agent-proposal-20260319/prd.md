# PRD: Agent 自检提案综合实施计划 2026-03-19

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目** | agent-proposal-20260319 |
| **类型** | 跨 Agent 协作 / 提案实施 |
| **目标** | 综合 Dev/Analyst/Architect/PM/Reviewer/Tester 六个 Agent 自检提案，形成统一实施路线图 |
| **完成标准** | 提案优先级排序完成，关键 P0 项目启动 |
| **上游来源** | proposals/20260319_023634/{dev,analyst,architect,reviewer}-proposals.md, workspace-{pm,tester,reviewer}/proposals/20260319/{pm,tester,reviewer}-proposals.md |

---

## 2. 问题陈述

六个 Agent 通过自检发现了系统性问题，需要协调实施：

| 来源 Agent | 核心问题 | 优先级 |
|------------|----------|--------|
| Reviewer | Auth token XSS 劫持风险 | 🔴 P0 |
| Dev | 92 处 `as any` 类型断言 | 🔴 P0 |
| Reviewer | Lint 1 个 error 阻塞构建 | 🔴 P0 |
| Architect | 流程串行等待导致交付延迟 30-40% | 🟡 P1 |
| Dev | 分支覆盖率仅 53.83% | 🟡 P1 |
| Reviewer | SSE 数据 XSS 防护不完整 | 🟡 P1 |
| Architect | API 单体架构无分层 | 🟡 P1 |
| Dev | API 响应契约不统一 | 🟡 P2 |

---

## 3. Epic 拆分

### Epic 1: 安全修复 (P0)

**Story F1.1**: Auth Token 安全迁移 — Reviewer P0
- 将 `localStorage` 迁移到 `sessionStorage`
- **验收标准**:
  - `expect(sessionStorage.getItem('auth_token')).not.toBeNull()` // 登录后
  - `expect(localStorage.getItem('auth_token')).toBeNull()` // 旧存储清除
  - `expect(await e2e('登录后令牌在 sessionStorage')).toBe(true)`
- **涉及文件**: `src/services/api/client.ts`, `src/services/api/modules/auth.ts`
- **页面集成**: 【需页面集成】LoginPage (/login), AuthContext

**Story F1.2**: Lint Error 修复 — Reviewer P0 / Dev P0
- 修复 `npm run lint` 报告的 1 个 error
- **验收标准**:
  - `expect(exec('npm run lint 2>&1').exitCode).toBe(0)`
  - `expect(exec('npm run build').exitCode).toBe(0)`
- **页面集成**: 【无需页面集成】构建/工具链

**Story F1.3**: SSE XSS 防护加固 — Reviewer P1
- 修复 `console.error` 中直接输出原始数据的问题
- **验收标准**:
  - `expect(source).not.toContain('userInput')` // 不输出原始用户数据
  - `expect(grep('stream-service.ts', 'Failed to parse SSE data:').length).toBe(0)`
- **涉及文件**: `src/services/ddd/stream-service.ts`

### Epic 2: 类型安全 (P0)

**Story F2.1**: 类型断言清理 — Dev P0
- 清理 92 处 `as any`，建立统一 API 响应类型
- **验收标准**:
  - `expect(exec('grep -rn "as any" src --include="*.ts" | wc -l').toBeLessThan(10))`
  - `expect(exec('npm run type-check').exitCode).toBe(0)`
  - `expect(exec('npm test').exitCode).toBe(0)`
- **涉及文件**: `src/services/api/modules/*.ts`, `src/services/api/client.ts`
- **页面集成**: 【需页面集成】components/ (UI 组件), hooks/ (状态逻辑)

### Epic 3: 流程优化 (P1)

**Story F3.1**: 并行架构设计流程 — Architect P0
- 重构为 Analyst → [并行] → Architect + PM
- **验收标准**:
  - `expect(workflowDoc).toContain('并行')`
  - `expect(architectureDraft).toBeDefined()` // Architect 草案提前输出

**Story F3.2**: API 分层拆分标准 — Architect P1
- 定义 BFF → Domain Services → Infrastructure 分层
- **验收标准**:
  - `expect(apiDoc).toContain('Gateway')`
  - `expect(apiDoc).toContain('Domain Services')`

### Epic 4: 测试质量 (P1)

**Story F4.1**: 分支覆盖率提升至 70% — Dev P1
- 优先补测 `flowMachine.ts`, API 模块错误响应, `PreviewCanvas`
- **验收标准**:
  - `expect(branchCoverage).toBeGreaterThanOrEqual(70)`
  - `expect(exec('npx jest --coverage').exitCode).toBe(0)`
- **涉及文件**: `src/components/flow-container/flowMachine.ts`, `src/services/api/modules/*.ts`

**Story F4.2**: 统一 API 响应契约 — Dev P2
- 使用 `ApiResponse<T>` 统一前后端接口
- **验收标准**:
  - `expect(isSuccessResponse(result)).toBe(true)` // 所有 API 调用使用类型守卫

### Epic 5: 质量基础设施 (P2)

**Story F5.1**: CI 质量门禁 — Dev P3
- 添加 `as any` 数量监控、分支覆盖率门槛
- **验收标准**:
  - `expect(ciConfig).toContain('as any')` // 阈值检查
  - `expect(ciConfig).toContain('coverageThreshold')` // 覆盖率门槛

**Story F5.2**: 架构文档自动化 — Architect P1
- tsdoc + API Extractor 自动生成文档
- **验收标准**:
  - `expect(docsExist).toBe(true)` // CI 自动渲染验证

---

## 4. 优先级矩阵

| 优先级 | Story | 来源 Agent | 工作量 | 依赖 |
|--------|-------|------------|--------|------|
| 🔴 P0 | F1.1 Auth token → sessionStorage | Reviewer | 1天 | 无 |
| 🔴 P0 | F1.2 Lint error 修复 | Reviewer/Dev | 0.5天 | 无 |
| 🔴 P0 | F2.1 类型断言清理 | Dev | 2天 | 无 |
| 🟡 P1 | F1.3 SSE XSS 防护 | Reviewer | 0.5天 | F1.1 |
| 🟡 P1 | F3.1 并行设计流程 | Architect | 0.5天 | 无 |
| 🟡 P1 | F4.1 分支覆盖率 70% | Dev | 2天 | F2.1 |
| 🟡 P1 | F3.2 API 分层标准 | Architect | 1天 | 无 |
| 🟡 P1 | F4.2 API 响应契约 | Dev | 1.5天 | F2.1 |
| 🟢 P2 | F5.1 CI 质量门禁 | Dev | 0.5天 | F2.1 |
| 🟢 P2 | F5.2 文档自动化 | Architect | 1天 | F3.2 |

---

## 5. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 登录 | 存储 token | sessionStorage 有值，localStorage 无值 |
| AC1.2 | `npm run lint` | 执行 | 退出码为 0，无 error |
| AC1.3 | `npm run build` | 执行 | 退出码为 0 |
| AC2.1 | `grep "as any" src/` | 扫描 | 使用次数 < 10 |
| AC2.2 | `npm run type-check` | 执行 | 退出码为 0 |
| AC3.1 | 流程文档 | 更新 | 包含并行设计说明 |
| AC4.1 | 分支覆盖率 | Jest 报告 | ≥ 70% |
| AC5.1 | CI 配置 | 检查 | 包含类型和覆盖率门槛 |

---

## 6. 非功能需求

- **安全性**: XSS 风险消除，类型安全提升
- **性能**: 类型检查 < 60s，Lint < 30s
- **可靠性**: CI 质量门禁防止退化
- **可维护性**: API 响应契约统一

---

## 7. DoD

- [ ] F1.1 Auth token sessionStorage 迁移完成
- [ ] F1.2 Lint error 修复，build 成功
- [ ] F2.1 `as any` < 10，type-check 通过
- [ ] F1.3 SSE XSS 防护加固
- [ ] F3.1 并行设计流程文档更新
- [ ] F4.1 分支覆盖率 ≥ 70%
- [ ] 所有 P0 项目已启动或完成
