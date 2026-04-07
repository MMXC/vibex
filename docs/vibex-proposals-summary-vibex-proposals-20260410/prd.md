# PRD: VibeX 质量治理与体验提升 2026-04-10

**版本**: v1.0
**状态**: Draft
**日期**: 2026-04-10
**负责人**: PM Agent
**基于**: 48 条 Agent 提案（dev/analyst/architect/pm/tester）

---

## 1. 执行摘要

### 背景

VibeX 项目当前处于高速迭代期，积累了大量技术债和体验缺口。通过 2026-04-10 的全团队提案收集，识别出 **13 个 P0 阻断问题**（其中 P0-1 为全团队 push 阻塞）、**16 个 P1 重要问题**和**16 个 P2/P3 优化项**。

核心痛点：
- **全团队阻塞**: `task_manager.py` 硬编码 Slack token 触发 GitHub secret scanning，任何修改该文件的 commit 均被阻断
- **部署失败**: PrismaClient 无 Cloudflare Workers 守卫，8+ API 路由无法部署
- **运行时崩溃**: `createStreamingResponse` 闭包引用未定义变量，streaming API 间歇性崩溃
- **测试失效**: Playwright 双重配置冲突 + 路径错误 + `@ci-blocking` 跳过 35+ 测试，CI 形同虚设
- **类型安全倒退**: 9 个文件含显式 `any`，重构风险不可评估

### 目标

1. **止血**: 修复全部 13 个 P0 问题（特别是解锁全团队 push 阻塞）
2. **筑基**: 建立类型安全、Schema 统一、测试可靠的工程基础设施
3. **体验**: 交付需求模板库和新人引导，降低使用门槛

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| P0 问题数 | 13 | 0 |
| CI E2E 测试通过率 | < 50%（35+ 被跳过） | ≥ 95% |
| TypeScript `any` 错误数 | 9 | 0 |
| 新用户首次使用完成率 | 未知（无引导） | ≥ 70% |
| 模板库覆盖率 | 0 | ≥ 5 个场景模板 |

---

## 2. Feature List（功能清单）

> 全部 48 条提案汇总。P0 用 ★ 标注。

### 2.1 P0 清单（13条）

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|----------|------|
| ★ P0-1 | task_manager token 硬编码修复 | 将 Slack token 从硬编码改为环境变量，解锁全团队 push | GitHub secret scanning | 0.5h |
| ★ P0-2 | createStreamingResponse 闭包修复 | `services/llm.ts` 中闭包引用未定义变量，修复后 streaming API 正常运行 | ReferenceError | 0.5h |
| ★ P0-3 | PrismaClient Workers 守卫 | 8+ API 路由（login 等）未对 Cloudflare Workers 环境做 PrismaClient 守卫，导致部署失败 | Workers 全局对象限制 | 1h |
| ★ P0-4 | ESLint no-explicit-any 清理 | 9 个文件含显式 `any`，全部替换为具体类型或 `unknown` | 类型安全倒退 | 1h |
| ★ P0-5 | generate-components flowId E2E 验证 | 组件生成时 flowId 未被 E2E 测试验证，组件可能落入 unknown flow | 协作数据错乱 | 1h |
| ★ P0-6 | Schema Drift 修复 | `sessionId` vs `generationId` 前后端命名不一致，建立 Zod 统一 Schema | 契约漂移 | 2h |
| ★ P0-7 | SSE Stream 超时控制 | `AbortController` 未传递，Worker setInterval 被禁用，streaming 无超时保护 | 资源泄漏风险 | 1h |
| ★ P0-8 | Jest+Vitest 双框架迁移 | 两套测试框架共存，维护成本高，CI 混乱，统一迁移到 Vitest | 框架冗余 | 2h |
| ★ P0-9 | 需求模板库 | 新用户不知如何描述需求，提供场景化模板库（≥5 模板） | 输入质量差 | 3h |
| ★ P0-10 | 新手引导流程 | 首次使用无引导，流失率高，提供可交互引导流程 | 首次使用流失 | 3h |
| ★ P0-11 | Playwright 双重配置冲突修复 | 根配置 vs `tests/e2e/` 配置 timeout 不一致（10s vs 30s），CI 断言容易超时 | 配置冲突 | 1h |
| ★ P0-12 | stability.spec.ts 路径错误修复 | `./e2e/` 目录不存在导致检查永远 PASS，`waitForTimeout` 违规被掩盖 | 测试失效 | 0.5h |
| ★ P0-13 | @ci-blocking grepInvert 移除 | `grepInvert: @ci-blocking` 跳过 35+ 核心测试（conflict-resolution、undo-redo、a11y） | CI 覆盖率虚低 | 1h |

### 2.2 P1 清单（16条）

| ID | 功能名 | 描述 | 工时 |
|----|--------|------|------|
| P1-1 | getRelationsForEntities 逻辑修复 | `entityIds[0]` 只能取第一个实体，修复为全量查询 | 1h |
| P1-2 | Workers 内存缓存隔离 | 跨请求内存泄漏，Cloudflare Workers 环境需请求级别隔离 | 1h |
| P1-3 | OPTIONS 预检 CORS 修复 | 预检请求被 401 拦截，OPTIONS 应返回 200 | 0.5h |
| P1-4 | 分布式限流改造 | 内存限流跨实例失效，引入 Redis 限流 | 2h |
| P1-5 | packages/types 可依赖化 | `packages/types` 无法被 workspace 依赖，统一导出 | 1h |
| P1-6 | Tree 组件样式统一 | 按钮样式不一致，统一为 design system 规范 | 1h |
| P1-7 | selectedNodeIds 类型统一 | `selectedNodeIds` 类型分散在多处，统一为 `Set<string>` | 0.5h |
| P1-8 | componentStore 批量方法 | `componentStore` 缺少批量操作（upsertMany、deleteMany） | 1h |
| P1-9 | 提案追踪 CLI 使用激活 | 提案追踪 CLI 使用率 0%，完善工具+文档 | 2h |
| P1-10 | Flow 执行层 TODO 清理 | `flow-execution` 存在空实现 TODO，补充或移除 | 1h |
| P1-11 | clarificationId 数据库索引 | clarificationId 缺少索引，查询性能差 | 0.5h |
| P1-12 | SSR-Safe 规范建立 | 缺少 SSR 环境下安全使用组件的规范文档 | 1h |
| P1-13 | 健康检查端点 | 缺少 `/health` 端点，无法判断服务可用性 | 0.5h |
| P1-14 | AI timeout 配置外化 | AI timeout 硬编码，改为环境变量配置 | 0.5h |
| P1-15 | Canvas ComponentRegistry 版本化 | ComponentRegistry 无版本化，重载后状态不一致 | 1h |
| P1-16 | waitForTimeout 残留清理 | 20+ 处 `waitForTimeout` 残留，统一改为智能等待 | 2h |

### 2.3 P2 清单（16条）

| ID | 功能名 | 描述 | 工时 |
|----|--------|------|------|
| P2-1 | PrismaPoolManager 使用激活 | PrismaPoolManager 定义但未被使用，激活或移除 | 1h |
| P2-2 | Reviewer 任务重复派发修复 | Reviewer agent 任务被重复派发，去重逻辑 | 1h |
| P2-3 | Stryker Mutation Testing 集成 | 补充 mutation testing，提升测试质量 | 4h |
| P2-4 | 错误处理标准化 | 全局统一错误处理（error boundaries） | 2h |
| P2-5 | 国际化（i18n）基础建设 | 多语言支持基础架构 | 3h |
| P2-6 | 主题定制化 | 深色模式、主题变量体系 | 2h |
| P2-7 | API 文档自动化 | OpenAPI/Swagger 文档生成 | 2h |
| P2-8 | 性能监控埋点 | 关键路径性能指标采集 | 2h |
| P2-9 | 持久化状态策略 | 状态持久化方案（localStorage/IndexedDB） | 2h |
| P2-10 | 设计令牌系统 | Design tokens 统一管理颜色/间距/字体 | 2h |
| P2-11 | 组件贡献指南 | 社区/团队组件贡献流程 | 2h |
| P2-12 | CI 缓存优化 | 依赖缓存策略优化，CI 提速 | 1h |
| P2-13 | 数据库迁移流程规范 | migration 审核流程建立 | 1h |
| P2-14 | 日志分级规范 | DEBUG/INFO/WARN/ERROR 分级规范 | 1h |
| P2-15 | 访问权限粒度化 | 从二元权限（有无）到细粒度 RBAC | 4h |
| P2-16 | WebSocket 实时协作 | 多人实时协作基础（长连接） | 6h |

### 2.4 P3 清单（3条）

| ID | 功能名 | 描述 | 工时 |
|----|--------|------|------|
| P3-1 | 移动端适配 | 响应式 + 移动端专项优化 | 8h |
| P3-2 | 离线模式 | Service Worker + 离线缓存 | 5h |
| P3-3 | 开放 API | 第三方集成 Open API | 10h |

---

## 3. Epic 拆分

### Epic 1: 全团队阻塞解锁（E1）

**目标**: 修复 `task_manager.py` Slack token 硬编码问题，恢复全团队正常 push 能力

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| E1-S1 | task_manager.py token 环境变量化 | 0.5h | `process.env.SLACK_BOT_TOKEN` 读取成功；无硬编码 token；推送后 GitHub secret scanning 不报警 |

**页面集成**: 无（工具层修复）

---

### Epic 2: 运行时崩溃修复（E2）

**目标**: 修复 streaming API 运行时崩溃 + Workers 部署失败

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| E2-S1 | createStreamingResponse 闭包修复 | 0.5h | streaming API 调用无 ReferenceError；日志无 "variable is not defined" |
| E2-S2 | PrismaClient Workers 守卫 | 1h | `wrangler deploy` 成功；8+ API 路由 PrismaClient 初始化正确；Workers 环境变量访问安全 |
| E2-S3 | SSE Stream 超时控制 | 1h | `AbortController` 正确传递；streaming 请求超过 60s 自动断开；无 Worker 内存泄漏 |

**页面集成**: `/api/auth/login/*`, `/api/generate/*`, `/api/stream/*`

---

### Epic 3: 类型安全与 Schema 统一（E3）

**目标**: 清理 TypeScript 类型倒退 + 修复 Schema Drift

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| E3-S1 | ESLint no-explicit-any 清理 | 1h | `tsc --noEmit` 无 any 错误；9 个文件全部修复；CI lint 通过 |
| E3-S2 | Schema Drift 修复（Zod 统一） | 2h | `sessionId`/`generationId` 统一为 `generationId`；Zod schema 作为单一真相来源；前后端类型对齐 |
| E3-S3 | selectedNodeIds 类型统一 | 0.5h | 全局 `Set<string>` 类型；无重复类型定义 |
| E3-S4 | getRelationsForEntities 逻辑修复 | 1h | 全量 `entityIds` 查询；单元测试覆盖 |

**页面集成**: 全局类型系统

---

### Epic 4: 测试基础设施（E4）

**目标**: 修复 Playwright 配置冲突 + stability.spec.ts 路径 + 移除 @ci-blocking

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| E4-S1 | Playwright 配置统一 | 1h | 单一 Playwright 配置；timeout 统一为 30s；CI config 不冲突 |
| E4-S2 | stability.spec.ts 路径修复 | 0.5h | 路径指向真实存在的 e2e 目录；违规检查实际执行；非永远 PASS |
| E4-S3 | @ci-blocking grepInvert 移除 | 1h | CI 不再跳过任何测试；所有 35+ 测试正常运行；CI 通过数显著增加 |
| E4-S4 | generate-components flowId E2E 验证 | 1h | E2E 测试验证 flowId 存在且有效；unknown flow 被拒绝 |

**页面集成**: 无（测试层修复）

---

### Epic 5: 测试框架迁移（E5）

**目标**: Jest+Vitest 双框架共存问题，统一到 Vitest

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| E5-S1 | Vitest 迁移 | 2h | Jest 配置移除；所有测试迁移到 Vitest；`vitest run` CI 通过；测试覆盖报告正常生成 |
| E5-S2 | waitForTimeout 残留清理 | 2h | 全部 `waitForTimeout` 替换为智能等待；20+ 处全部处理；无 flaky test 引入 |

**页面集成**: 无（测试层修复）

---

### Epic 6: 开发者体验提升（E6）

**目标**: 修复 P1 开发者体验问题

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| E6-S1 | 提案追踪 CLI 激活 | 2h | CLI 使用率提升；文档完善；关键路径可用 |
| E6-S2 | packages/types 可依赖化 | 1h | workspace 可依赖 `packages/types`；类型导出完整 |
| E6-S3 | componentStore 批量方法 | 1h | `upsertMany`、`deleteMany` 实现；单元测试覆盖 |
| E6-S4 | AI timeout 配置外化 | 0.5h | 环境变量控制 AI timeout；默认 60s |
| E6-S5 | 健康检查端点 | 0.5h | `GET /health` 返回 200；DB 连接检测 |
| E6-S6 | SSR-Safe 规范建立 | 1h | 规范文档；关键组件 SSR 注释 |
| E6-S7 | clarificationId 索引 | 0.5h | 数据库迁移添加索引；查询性能可测量提升 |
| E6-S8 | Flow 执行层 TODO 清理 | 1h | 所有 TODO 有明确负责人或已移除 |
| E6-S9 | Canvas ComponentRegistry 版本化 | 1h | 版本号机制；状态重载一致性 |
| E6-S10 | Options 预检 CORS 修复 | 0.5h | OPTIONS 返回 200 而非 401；CORS 正常 |

**页面集成**: `/api/health`, `/api/generate/*`

---

### Epic 7: 新手引导与模板（E7）

**目标**: 提升新用户首次使用体验

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| E7-S1 | 需求模板库 | 3h | `/templates` 页面显示 ≥5 模板；模板覆盖核心场景（UI 改进/Bug 修复/Feature 开发/重构/调研）；模板点击后填充编辑器 |
| E7-S2 | 新手引导流程 | 3h | 首次访问用户看到引导流程（3-5 步骤）；引导可跳过；完成率 ≥ 70%；引导状态持久化 |

**页面集成**: `/templates`（新建）, `/onboarding`（新建）, 首页首次访问触发

---

## 4. 验收标准（每 Story expect() 断言）

### E1-S1: task_manager.py token 环境变量化
```typescript
// expect(process.env.SLACK_BOT_TOKEN).toBeDefined()
// expect(hardcodedToken).toBeUndefined()
// expect(gitPushSuccess).toBe(true) // GitHub secret scanning 不报警
```

### E2-S1: createStreamingResponse 闭包修复
```typescript
// expect(() => createStreamingResponse(...)).not.toThrow(ReferenceError)
// expect(streamingResponse).toBeDefined()
```

### E2-S2: PrismaClient Workers 守卫
```typescript
// expect(prismaClient).toBeDefined()
// expect(() => new PrismaClient()).not.toThrow() // Workers 环境
// expect(wranglerDeploySuccess).toBe(true)
```

### E2-S3: SSE Stream 超时控制
```typescript
// expect(abortController.signal.aborted).toBe(true) // 60s 后
// expect(workerMemoryStable).toBe(true) // 无泄漏
```

### E3-S1: ESLint no-explicit-any 清理
```typescript
// expect(tscResult.errors.filter(e => e.includes('any'))).toHaveLength(0)
// expect(eslintResult.errorCount).toBe(0)
```

### E3-S2: Schema Drift 修复
```typescript
// expect(zodSchema.parse(apiResponse)).toBeTruthy()
// expect(sessionIdField).toBeUndefined() // 统一为 generationId
```

### E4-S1: Playwright 配置统一
```typescript
// expect(playwrightConfig.timeout).toBe(30000)
// expect(configConflicts).toHaveLength(0)
```

### E4-S2: stability.spec.ts 路径修复
```typescript
// expect(e2eDirectoryExists).toBe(true)
// expect(stabilityCheck.passed).not.toBeAlwaysPassing()
```

### E4-S3: @ci-blocking 移除
```typescript
// expect(skippedTestsCount).toBe(0)
// expect(ciTestCount).toBeGreaterThanOrEqual(beforeSkipCount)
```

### E5-S1: Vitest 迁移
```typescript
// expect(jestConfig).toBeNull()
// expect(vitestRunSuccess).toBe(true)
// expect(coverageReportGenerated).toBe(true)
```

### E7-S1: 需求模板库
```typescript
// expect(templateCount).toBeGreaterThanOrEqual(5)
// expect(templateList).toContain('UI 改进')
// expect(templateList).toContain('Bug 修复')
// expect(templateFillSuccess).toBe(true)
```

### E7-S2: 新手引导流程
```typescript
// expect(onboardingVisible).toBe(true) // 首次用户
// expect(onboardingSkippable).toBe(true)
// expect(onboardingCompletionRate).toBeGreaterThanOrEqual(0.7)
// expect(onboardingStatePersisted).toBe(true)
```

---

## 5. 功能点汇总表（含页面集成标注）

| Epic | 功能 | 页面/路由 | 类型 |
|------|------|----------|------|
| E1 | task_manager token 修复 | 工具层 | P0 Bug |
| E2 | streaming API 修复 | `/api/stream/*` | P0 Bug |
| E2 | PrismaClient Workers 守卫 | `/api/auth/*`, `/api/generate/*` | P0 Bug |
| E2 | SSE 超时控制 | `/api/stream/*` | P0 Bug |
| E3 | ESLint any 清理 | 全局 | P0 Tech Debt |
| E3 | Schema Drift 修复 | 全局 | P0 Bug |
| E3 | selectedNodeIds 类型统一 | 全局组件 | P1 Tech Debt |
| E3 | getRelationsForEntities 修复 | 关系查询 API | P1 Bug |
| E4 | Playwright 配置统一 | CI/测试 | P0 Infra |
| E4 | stability.spec.ts 路径修复 | 测试套件 | P0 Bug |
| E4 | @ci-blocking 移除 | CI/测试 | P0 Infra |
| E4 | flowId E2E 验证 | E2E 测试 | P0 Infra |
| E5 | Vitest 迁移 | 测试套件 | P0 Infra |
| E5 | waitForTimeout 清理 | 测试套件 | P1 Tech Debt |
| E6 | 提案追踪 CLI 激活 | 工具层 | P1 DX |
| E6 | packages/types 可依赖化 | 全局 | P1 Infra |
| E6 | componentStore 批量方法 | 组件管理 | P1 Feature |
| E6 | AI timeout 配置外化 | `/api/generate/*` | P1 Config |
| E6 | 健康检查端点 | `/health` | P1 Infra |
| E6 | SSR-Safe 规范 | 全局组件 | P1 DX |
| E6 | clarificationId 索引 | 数据库 | P1 Perf |
| E6 | Flow 执行层 TODO 清理 | 逻辑层 | P1 Tech Debt |
| E6 | Canvas 版本化 | Canvas 画布 | P1 Tech Debt |
| E6 | OPTIONS CORS 修复 | CORS 中间件 | P1 Bug |
| E7 | 需求模板库 | `/templates`（新） | P0 Feature |
| E7 | 新手引导流程 | `/onboarding`（新） | P0 UX |

---

## 6. 实施计划（Sprint 排期）

### Sprint 0: 紧急止血（0.5 天，4h）

| Epic | Story | 工时 | 负责 |
|------|-------|------|------|
| E1 | E1-S1 task_manager token 修复 | 0.5h | dev |
| E2 | E2-S1 createStreamingResponse 修复 | 0.5h | dev |
| E2 | E2-S2 PrismaClient Workers 守卫 | 1h | dev |
| E2 | E2-S3 SSE 超时控制 | 1h | dev |
| E3 | E3-S1 ESLint any 清理（部分） | 1h | dev |

> **Sprint 0 目标**: 解锁全团队 push + 修复部署阻塞

---

### Sprint 1: 质量筑基（2 天，16h）

| Epic | Story | 工时 | 负责 |
|------|-------|------|------|
| E3 | E3-S1 ESLint any 清理（收尾） | 0.5h | dev |
| E3 | E3-S2 Schema Drift 修复 | 2h | architect |
| E3 | E3-S3 selectedNodeIds 类型统一 | 0.5h | dev |
| E3 | E3-S4 getRelationsForEntities 修复 | 1h | dev |
| E4 | E4-S1 Playwright 配置统一 | 1h | tester |
| E4 | E4-S2 stability.spec.ts 路径修复 | 0.5h | tester |
| E4 | E4-S3 @ci-blocking 移除 | 1h | tester |
| E4 | E4-S4 flowId E2E 验证 | 1h | tester |
| E5 | E5-S1 Vitest 迁移 | 2h | tester |
| E5 | E5-S2 waitForTimeout 清理 | 2h | tester |
| E6 | E6-S10 OPTIONS CORS 修复 | 0.5h | dev |
| E6 | E6-S7 clarificationId 索引 | 0.5h | dev |
| E6 | E6-S8 Flow 执行层 TODO 清理 | 1h | dev |
| E6 | E6-S9 Canvas 版本化 | 1h | dev |

> **Sprint 1 目标**: 类型安全 + 测试可靠 + 基础 P1 清理

---

### Sprint 2: 开发者体验（1.5 天，8h）

| Epic | Story | 工时 | 负责 |
|------|-------|------|------|
| E6 | E6-S1 提案追踪 CLI 激活 | 2h | dev |
| E6 | E6-S2 packages/types 可依赖化 | 1h | architect |
| E6 | E6-S3 componentStore 批量方法 | 1h | dev |
| E6 | E6-S4 AI timeout 配置外化 | 0.5h | dev |
| E6 | E6-S5 健康检查端点 | 0.5h | dev |
| E6 | E6-S6 SSR-Safe 规范建立 | 1h | architect |
| E6 | E6-S1 Workers 内存缓存隔离 | 1h | architect |

> **Sprint 2 目标**: DX 提升 + 关键基础设施完善

---

### Sprint 3: 用户体验（2 天，6h）

| Epic | Story | 工时 | 负责 |
|------|-------|------|------|
| E7 | E7-S1 需求模板库 | 3h | pm + dev |
| E7 | E7-S2 新手引导流程 | 3h | pm + dev |

> **Sprint 3 目标**: 新用户首次体验提升，降低使用门槛

---

### 后续规划（P1/P2/P3）

P1 未完成项（~13h）进入下一迭代：
- P1-2 Workers 内存缓存隔离（已并入 Sprint 2）
- P1-4 分布式限流改造（2h）
- P1-6 Tree 组件样式统一（1h）
- P1-11 国际化基础（3h）

P2/P3 项进入产品路线图单独排期。

---

## 7. DoD（Definition of Done）

### 通用 DoD

- [ ] 代码通过 `tsc --noEmit`（零错误）
- [ ] 代码通过 `eslint`（零 error）
- [ ] 单元测试覆盖新增/修改逻辑
- [ ] E2E 测试通过（CI 环境）
- [ ] PR review 至少 1 人 approve
- [ ] 文档更新（如有 API/配置变更）
- [ ] 无运行时 console.error
- [ ] 类型覆盖完整（无 `as any` 逃逸）

### Epic 专属 DoD

| Epic | 额外 DoD |
|------|----------|
| E1 | GitHub push 验证成功，secret scanning 不报警 |
| E2 | `wrangler deploy` 成功，streaming API 手动测试通过 |
| E3 | Schema 测试覆盖 Zod parse 路径 |
| E4 | CI 测试数恢复至 skip 前水平，flakiness < 5% |
| E5 | Jest 配置完全移除，Vitest coverage 报告正常 |
| E6 | CLI 工具可用，health endpoint 响应正常 |
| E7 | 模板库 ≥ 5 模板，引导完成率 ≥ 70% |

---

## 8. 依赖关系

| 前置依赖 | 被阻塞 Epic/Story |
|----------|-------------------|
| E1-S1（token 修复）| 全部团队成员 push |
| E2-S2（Workers 部署）| 所有 API 路由功能验证 |
| E3-S2（Schema 统一）| E7 模板库数据模型 |
| E4（全完成）| Sprint 1 之后所有测试必须通过 CI |
| Vitest 迁移（E5-S1）| E4-S4 flowId E2E 验证 |

---

## 9. 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| task_manager token 持续阻塞团队 | 🔴 极高 | Sprint 0 第一优先级，0.5h 内修复 |
| Schema 迁移破坏现有功能 | 🟡 中 | Zod schema 测试先行；逐步迁移字段 |
| Vitest 迁移引入测试 regression | 🟡 中 | 迁移前快照所有测试名称；逐文件迁移 |
| 新手引导影响首屏加载速度 | 🟢 低 | 引导组件懒加载；引导状态 localStorage 缓存 |
| @ci-blocking 移除后 CI 失败 | 🟡 中 | 先修复稳定性测试（stability.spec.ts），再移除 grepInvert |

---

*v1.0 | 2026-04-10 | PM Agent | 待 reviewer 提案补充*
