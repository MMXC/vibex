# PRD: vibex-proposals-20260412 Sprint Plan

**Project**: vibex-proposals-20260412  
**Stage**: pm-review  
**PM**: PM  
**Date**: 2026-04-07  
**Status**: Complete

---

## 1. 执行摘要

### 背景

2026-04-12 Sprint 收集了来自 Analyst、Reviewer、Tester、Architect 共 20+ 个提案。核心问题：
- Auth Mock 失效导致 94 个测试失败，CI 门禁完全失效
- 提案状态追踪机制缺失导致同一主题多次重复出现
- TypeScript 编译错误阻塞 CI/CD
- Canvas 三栏缺少独立 ErrorBoundary

### 目标

| Sprint | 目标 | 工时 |
|--------|------|------|
| Sprint 0 (紧急) | TypeScript 修复 + Auth Mock 修复 | 5h |
| Sprint 1 (04/12-04/14) | 提案追踪机制 + CI 守卫 + ErrorBoundary | 6.3h |
| Sprint 2 (04/15-04/18) | 类型系统统一 + 测试优化 + 流程标准化 | 11.5h |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| TypeScript 编译 | 0 error |
| Auth Mock 测试 | 94 tests: 79 passed, 0 failed |
| 提案状态追踪 | INDEX.md 100% 覆盖 |
| Canvas ErrorBoundary | 三栏独立恢复 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E0 | 紧急修复 | 5h | P0 | S0.1, S0.2 |
| E1 | 测试基础设施修复 | 4.5h | P0 | S1.1, S1.2 |
| E2 | 提案状态追踪 | 2h | P0 | S2.1, S2.2 |
| E3 | CI/CD 守卫增强 | 1.5h | P0 | S3.1, S3.2 |
| E4 | 架构增强 | 9.5h | P1 | S4.1, S4.2, S4.3, S4.4, S4.5 |
| E5 | 测试重构优化 | 6h | P1 | S5.1, S5.2, S5.3 |
| E6 | 流程标准化 | 1.5h | P1 | S6.1, S6.2 |
| E7 | 文档与工具 | 2h | P2 | S7.1, S7.2 |

**总工时**: 32h

---

### Epic 0: 紧急修复（P0 — Sprint 0）

**目标**: 解除 CI/CD 阻塞，恢复开发流程。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S0.1 | TypeScript 编译错误修复 | 2h | pnpm tsc --noEmit → 0 error |
| S0.2 | Auth Mock 全面修复 | 3h | 94 tests → 79 passed, 0 failed |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F0.1 | EntityAttribute.required 修复 | 类型冲突修复 | `expect(tsErrors).toBe(0)` | 否 |
| F0.2 | NextResponse 值导入修复 | import type → import | `expect(tsErrors).toBe(0)` | 否 |
| F0.3 | Function 泛型约束修复 | `(...args: any) => any` | `expect(tsErrors).toBe(0)` | 否 |
| F0.4 | Auth Mock Factory | 统一 mock factory | `expect(tests).toBe(79)` | 否 |

---

### Epic 1: 测试基础设施修复

**目标**: 修复 Token 日志泄露，恢复 CI 门禁功能。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | Token 日志泄露修复 | 1.5h | grep 无未包装 console.* |
| S1.2 | safeError 覆盖验证 | 0.5h | 覆盖所有 token 日志点 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Token 日志扫描 | `/api/chat` 和 `/api/pages` 无 console.* | `expect(grepResult).toBeEmpty()` | 否 |
| F1.2 | safeError 覆盖验证 | 100% 覆盖 | `expect(coverage).toBe(100%)` | 否 |

---

### Epic 2: 提案状态追踪

**目标**: 建立提案从提交到实现的完整状态追踪。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | INDEX.md 状态字段 | 100% 覆盖 | 所有提案有 status 字段 |
| S2.2 | 状态更新 SOP | pending/progress/done/rejected | SOP 文档化 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | INDEX.md status 字段 | 所有提案添加 status | `expect(indexed).toBe(100%)` | 否 |
| F2.2 | 状态更新触发 | 提案状态变更时更新 | `expect(updated).toBe(true)` | 否 |

---

### Epic 3: CI/CD 守卫增强

**目标**: 增强 CI 守卫，防止问题再次发生。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | grepInvert 自动化验证 | 1h | 配置变更记录在 CHANGELOG |
| S3.2 | WebSocket 配置集中管理 | 0.5h | WEBSOCKET_CONFIG 作为唯一配置源 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | grepInvert CI 守卫 | 配置变更自动验证 | `expect(changelog).toContain()` | 否 |
| F3.2 | WEBSOCKET_CONFIG 集中 | 所有 WebSocket 超时值从配置读取 | `expect(configSource).toBeDefined()` | 否 |

---

### Epic 4: 架构增强（P1）

**来源**: Architect 提案

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | Canvas 三栏 Error Boundary | 1h | 三栏独立恢复 |
| S4.2 | packages/types API Schema 落地 | 2h | 类型安全覆盖 |
| S4.3 | API v0→v1 迁移收尾 | 2h | 所有 v0 添加 Deprecation Header |
| S4.4 | frontend types 对齐 | 3h | 引用 @vibex/types |
| S4.5 | groupByFlowId 记忆化优化 | 1.5h | 性能提升 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | Canvas ErrorBoundary | ContextTree/FlowTree/ComponentTree 包裹 | `expect(recovery).toBe(true)` | 【需页面集成】TreePanel |
| F4.2 | @vibex/types 引用 | backend/frontend 引用共享类型 | `expect(imports).toBe('@vibex/types')` | 否 |
| F4.3 | v0 Deprecation Header | 所有 v0 路由添加 Sunset | `expect(header).toContain('Sunset')` | 否 |
| F4.4 | frontend types re-export | types.ts 引用 @vibex/types | `expect(duplicateTypes).toBe(0)` | 否 |
| F4.5 | flowNodeIndex 缓存 | Map 索引替代 O(n) find | `expect(lookupTime).toBeLessThan(1)` | 否 |

---

### Epic 5: 测试重构优化

**目标**: 提升测试稳定性和可维护性。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | waitForTimeout 重构 | 4h | 87 处 → ≤ 10 处 |
| S5.2 | flowId E2E 测试 | 2h | all passed |
| S5.3 | JsonTreeModal 单元测试 | 1h | coverage > 80% |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | waitForTimeout 重构 | 87 处 → ≤ 10 处 | `expect(instances).toBeLessThanOrEqual(10)` | 否 |
| F5.2 | flowId E2E 测试 | 真实场景覆盖 | `expect(tests).toPass()` | 【需页面集成】E2E |
| F5.3 | JsonTreeModal UT | 单元测试补充 | `expect(coverage).toBeGreaterThan(80%)` | 否 |

---

### Epic 6: 流程标准化

**目标**: 建立 SOP，减少重复提案。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S6.1 | 需求澄清 SOP | AGENTS.md 中标准化流程 | SOP 文档化 |
| S6.2 | console.* pre-commit hook | ESLint 拦截 | 拦截生效 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | 需求澄清 SOP | 定义需求澄清步骤 | `expect(sop).toBeDefined()` | 否 |
| F6.2 | console.* pre-commit | ESLint 规则拦截 | `expect(blocked).toBe(true)` | 否 |

---

### Epic 7: 文档与工具（P2）

**目标**: 文档化演进路线，便于新成员上手。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S7.1 | 画布演进路线图 | docs/canvas-roadmap.md | 文档存在 |
| S7.2 | CHANGELOG 自动化 | commit 时自动更新 | CI 集成 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F7.1 | canvas-roadmap.md | 画布演进路线图 | `expect(doc).toExist()` | 否 |
| F7.2 | CHANGELOG 自动化 | commit 时自动更新 | `expect(ci).toContain('changelog')` | 否 |

---

## 3. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC0.1 | 运行 tsc | `pnpm tsc --noEmit` | 0 error | P0 |
| AC0.2 | 运行 backend tests | `npm test` | 79 passed, 0 failed | P0 |
| AC1.1 | 扫描 api 目录 | `grep -rn "console\."` | 无未包装 | P0 |
| AC2.1 | INDEX.md | 检查状态字段 | 100% 覆盖 | P0 |
| AC3.1 | grepInvert 配置 | 变更时 | CHANGELOG 记录 | P0 |
| AC4.1 | Canvas 三栏 | 某栏崩溃 | 独立恢复，其他栏正常 | P1 |
| AC4.2 | API 路由 | v0 路由 | Deprecation Header | P1 |
| AC5.1 | waitForTimeout | 扫描 e2e | ≤ 10 处 | P1 |
| AC5.2 | flowId E2E | playwright test | all passed | P1 |
| AC6.1 | AGENTS.md | 检查需求澄清 SOP | 存在且完整 | P1 |
| AC7.1 | canvas-roadmap | 文档检查 | 存在且完整 | P2 |

---

## 4. DoD (Definition of Done)

### Sprint 0 完成标准 (紧急)

- [ ] TypeScript 编译 0 error
- [ ] Auth Mock 修复完成，94 tests 全部 pass
- [ ] pnpm tsc --noEmit 纳入 CI pre-check

### Sprint 1 完成标准

- [ ] Token 日志泄露修复，safeError 覆盖 100%
- [ ] INDEX.md 状态字段 100% 覆盖
- [ ] WEBSOCKET_CONFIG 作为唯一配置源
- [ ] grepInvert CI 守卫上线
- [ ] Canvas 三栏 ErrorBoundary 上线

### Sprint 2 完成标准

- [ ] @vibex/types 引用覆盖所有 API 路由
- [ ] v0 路由全部添加 Deprecation Header
- [ ] waitForTimeout 重构 ≤ 10 处
- [ ] flowId E2E 测试通过
- [ ] 需求澄清 SOP 文档化
- [ ] console.* pre-commit hook 上线

---

## 5. Sprint 排期

| Sprint | 日期 | 范围 | 工时 |
|--------|------|------|------|
| Sprint 0 (紧急) | 即时 | E0 | 5h |
| Sprint 1 | 04/12-04/14 | E1 + E2 + E3 + E4.1 | 6.3h |
| Sprint 2 | 04/15-04/18 | E4.2-4.5 + E5 + E6 + E7 | 11.5h |

**总计**: 22.8h（约 3 个 sprint）

---

## 6. 提案来源

| 来源 | 提案数 | 主要内容 |
|------|--------|----------|
| Analyst | 3 | 提案追踪、需求澄清 SOP、画布路线图 |
| Architect | 6 | ErrorBoundary、types 对齐、v0→v1 迁移 |
| Reviewer | 6 | CI 守卫、WebSocket 配置、Health 版本 |
| Tester | 5 | Auth Mock、waitForTimeout、flowId E2E |

---

*PRD Version: 2.0*  
*整合了 Analyst + Architect + Reviewer + Tester 提案*  
*Created by: PM Agent*  
*Last Updated: 2026-04-07*
