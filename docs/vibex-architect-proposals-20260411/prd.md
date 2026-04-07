# PRD: VibeX 架构提案实施计划

**项目**: vibex-architect-proposals-vibex-proposals-20260411
**版本**: v1.0
**日期**: 2026-04-11
**负责人**: PM
**状态**: Draft

---

## 1. 执行摘要

### 1.1 背景

VibeX 当前存在 7 个架构层面的技术债与风险，涉及 API 路由分裂、WebSocket 连接稳定性、类型共享缺失、双路由系统冲突、上下文压缩质量、提示词安全、MCP 可观测性等方面。这些问题直接影响开发效率（P0-P1）和长期可维护性（P2）。

### 1.2 目标

通过 7 个 Epic 的实施，消除 P0 级别的生产稳定性风险，统一技术栈，消除类型孤岛，建立可观测性基线。全部实施后，预期：

- API 路由维护成本降低 50%（废弃 v0 路由）
- WebSocket 服务可用性 ≥99.9%（连接限制 + 死连接清理）
- 类型共享覆盖 ≥80% 的核心类型（Schema drift 归零）
- Auth 中间件行为一致性达到 100%（双路由系统统一）
- 压缩质量可量化（qualityScore 指标上线）
- 安全扫描误报率 <1%
- MCP Server 可监控（健康检查就绪）

### 1.3 成功指标

| 指标 | 基线 | 目标 |
|------|------|------|
| API 路由重复文件数 | 50+ | 0 |
| WebSocket 死连接数/天 | 未监控 | <10 |
| packages/types 被依赖数 | 0 | ≥5 |
| Hono routes 文件残留 | ~20 | 0 |
| 压缩质量评分覆盖率 | 0% | 100% |
| eval 检测误报率 | 未测 | <1% |
| MCP 健康检查可访问 | No | Yes |

### 1.4 工时汇总

| 优先级 | Epic 数 | 总工时 |
|--------|---------|--------|
| P0 | 2 | 10h |
| P1 | 2 | 7h |
| P2 | 3 | 12h |
| **合计** | **7** | **29h** |

---

## 2. Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F01 | API v0 渐进废弃 | v0 路由添加 Deprecation header，监控使用率，5% 以下后移除 | A-P0-1 | 4h |
| F02 | WebSocket 连接治理 | 添加 maxConnections 限制、5min 死连接清理、心跳机制、健康检查端点 | A-P0-2 | 6h |
| F03 | packages/types 集成 | workspace 内启用类型共享，vibex-backend/vibex-fronted 依赖共享类型包 | A-P1-1 | 3h |
| F04 | Hono/Next.js 路由分层 | 明确双路由边界，Hono 做外部网关，Next.js 做内部路由，Auth 行为一致 | A-P1-2 | 4h |
| F05 | CompressionEngine 质量评分 | 引入 qualityScore 指标，<70 分时降级全量上下文 | A-P2-1 | 5h |
| F06 | Prompts 安全 AST 扫描 | 用 @babel/parser AST 解析替代字符串匹配，精准检测 eval/new Function | A-P2-2 | 4h |
| F07 | MCP Server 可观测性 | 添加 /health 端点 + structured logging | A-P2-3 | 3h |

---

## 3. Epic 拆分

### Epic 1: API v0/v1 双路由治理
**Story**: E1-S1 — 添加 v0 Deprecation header
- 工时: 2h
- 验收标准:
  ```typescript
  // GET /api/agents 返回头中包含
  expect(headers['Deprecation']).toBeTruthy()
  expect(headers['Sunset']).toBeTruthy()
  ```

**Story**: E1-S2 — v1 路由覆盖完整性验证
- 工时: 1h
- 验收标准:
  ```typescript
  // 所有 v0 端点都有对应的 v1 实现
  expect(v1Endpoints).toContainAllKeys(Object.keys(v0Endpoints))
  ```

**Story**: E1-S3 — Contract test 仅在 v1 运行
- 工时: 1h
- 验收标准:
  ```typescript
  expect(contractTestTargets).toEqual(['v1'])
  expect(contractTestTargets).not.toContain('v0')
  ```

---

### Epic 2: WebSocket ConnectionPool 连接治理
**Story**: E2-S1 — 连接数限制实现
- 工时: 2h
- 验收标准:
  ```typescript
  // 超过 maxConnections 时返回 503
  expect(await pool.connect(1001)).toMatchObject({ status: 503 })
  ```

**Story**: E2-S2 — 死连接 5min 清理 + 心跳
- 工时: 3h
- 验收标准:
  ```typescript
  // 5min 无活动连接被关闭
  expect(deadConnection.isAlive).toBe(false)
  expect(pool.activeConnections).toBeLessThanOrEqual(maxConnections)
  ```

**Story**: E2-S3 — 健康检查端点
- 工时: 1h
- 验收标准:
  ```typescript
  const res = await fetch('/api/ws/health')
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body).toMatchObject({ activeConnections: expect.any(Number), maxConnections: expect.any(Number) })
  ```

---

### Epic 3: packages/types 类型共享
**Story**: E3-S1 — packages/types 导出配置
- 工时: 1h
- 验收标准:
  ```typescript
  // package.json exports 字段正确配置
  expect(require('@vibex/types')).toBeDefined()
  ```

**Story**: E3-S2 — vibex-backend 依赖共享类型
- 工时: 1h
- 验收标准:
  ```typescript
  // API routes 中可 import @vibex/types
  // 编译通过，无类型错误
  expect(buildResult.exitCode).toBe(0)
  ```

**Story**: E3-S3 — vibex-fronted 依赖共享类型
- 工时: 1h
- 验收标准:
  ```typescript
  // 移除手写重复类型，编译通过
  expect(buildResult.exitCode).toBe(0)
  expect(duplicateTypeCount).toBe(0)
  ```

---

### Epic 4: Hono/Next.js 双路由收敛
**Story**: E4-S1 — 路由分层边界定义
- 工时: 1h
- 验收标准:
  ```typescript
  // src/routes/ 仅包含外部网关路由（auth/cors/rate-limit）
  // src/app/api/ 包含所有内部业务路由
  expect(honoRoutes.length).toBeLessThanOrEqual(10)
  expect(nextRoutes.length).toBeGreaterThan(honoRoutes.length)
  ```

**Story**: E4-S2 — Auth middleware 行为一致性
- 工时: 2h
- 验收标准:
  ```typescript
  // Hono auth middleware 和 Next.js middleware 对同一 token 返回相同结果
  expect(honoAuthResult).toEqual(nextAuthResult)
  ```

**Story**: E4-S3 — src/routes/ 目录清理
- 工时: 1h
- 验收标准:
  ```typescript
  // 非网关路由文件从 src/routes/ 移除或迁移
  expect(legacyRoutesCount).toBe(0)
  ```

---

### Epic 5: Context CompressionEngine 质量保障
**Story**: E5-S1 — CompressionReport 质量评分实现
- 工时: 2h
- 验收标准:
  ```typescript
  const report = engine.compress(messages)
  expect(report).toMatchObject({
    qualityScore: expect.any(Number),
    originalTokens: expect.any(Number),
    compressedTokens: expect.any(Number),
  })
  expect(report.qualityScore).toBeGreaterThanOrEqual(0)
  expect(report.qualityScore).toBeLessThanOrEqual(100)
  ```

**Story**: E5-S2 — qualityScore < 70 降级全量上下文
- 工时: 2h
- 验收标准:
  ```typescript
  // qualityScore < 70 时，回退到完整上下文
  const report = engine.compress(lowQualityMessages)
  expect(report.qualityScore).toBeLessThan(70)
  expect(report.compressedTokens).toBe(report.originalTokens)
  ```

**Story**: E5-S3 — keyConceptsPreserved 领域概念保留
- 工时: 1h
- 验收标准:
  ```typescript
  // 关键领域概念在压缩后被保留
  expect(report.keyConceptsPreserved).toContain('Order')
  expect(report.keyConceptsPreserved).toContain('Payment')
  ```

---

### Epic 6: Prompts 安全 AST 扫描
**Story**: E6-S1 — @babel/parser AST 解析替代正则
- 工时: 2h
- 验收标准:
  ```typescript
  const report = analyzeCodeSecurity('eval("alert(1)")')
  expect(report.unsafeEval.length).toBeGreaterThan(0)
  ```

**Story**: E6-S2 — 误报率 <1% 测试集验证
- 工时: 1h
- 验收标准:
  ```typescript
  // 合法代码（不含 eval/new Function）误报率为 0
  const safeReports = testSafeCode.map(analyzeCodeSecurity)
  expect(safeReports.filter(r => r.hasUnsafe).length).toBe(0)
  ```

**Story**: E6-S3 — AST 解析性能验证
- 工时: 1h
- 验收标准:
  ```typescript
  const start = Date.now()
  analyzeCodeSecurity(largeCodeFile)
  expect(Date.now() - start).toBeLessThan(50)
  ```

---

### Epic 7: MCP Server 可观测性
**Story**: E7-S1 — MCP /health 端点
- 工时: 1.5h
- 验收标准:
  ```typescript
  const res = await fetch('http://localhost:3100/health')
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body).toMatchObject({ status: 'ok', version: expect.any(String) })
  ```

**Story**: E7-S2 — Structured logging 输出
- 工时: 1.5h
- 验收标准:
  ```typescript
  // 日志为 JSON 格式，包含 tool/duration/success 字段
  expect(JSON.parse(logOutput)).toMatchObject({
    tool: expect.any(String),
    duration: expect.any(Number),
    success: expect.any(Boolean)
  })
  ```

---

## 4. 功能点汇总表（含页面/集成标注）

| 功能 ID | 页面/模块 | 集成点 | 备注 |
|---------|----------|--------|------|
| F01 | 全局 API 层 | vibex-backend/src/app/api/ | CI/CD pipeline 同步更新 |
| F02 | 实时协作服务 | vibex-backend/src/services/websocket/ | ConnectionPool + MessageRouter |
| F03 | 类型系统 | packages/types/, vibex-backend/, vibex-fronted/ | 需 build packages/types |
| F04 | 路由层 | src/routes/, src/app/api/ | Auth middleware 同步 |
| F05 | 上下文管理 | services/context/CompressionEngine.ts | 影响 LLM 调用成本 |
| F06 | 安全模块 | lib/prompts/code-review.ts, code-generation.ts | 新增 @babel/parser 依赖 |
| F07 | MCP 服务 | packages/mcp-server/ | 独立部署，不影响主服务 |

---

## 5. 验收标准

| ID | 标准 | 验证方式 |
|----|------|---------|
| AC01 | v0 所有端点返回 Deprecation header | Contract test |
| AC02 | v1 覆盖所有 v0 业务端点 | API coverage test |
| AC03 | WebSocket maxConnections 限制生效 | Integration test |
| AC04 | 死连接 5min 内关闭 | Unit test (mock timer) |
| AC05 | /api/ws/health 返回连接统计 | HTTP test |
| AC06 | @vibex/types 可被 backend/frontend 依赖 | Build test |
| AC07 | Hono routes 文件数 ≤10 | File count check |
| AC08 | Auth middleware 行为一致 | Integration test |
| AC09 | CompressionEngine 输出 qualityScore | Unit test |
| AC10 | qualityScore < 70 降级全量上下文 | Unit test |
| AC11 | eval/new Function 检测误报率 <1% | Test suite (n=1000) |
| AC12 | AST 解析性能 <50ms/文件 | Benchmark |
| AC13 | MCP /health 端点可访问 | HTTP test |
| AC14 | Structured log 为 JSON 格式 | Log parsing test |

---

## 6. DoD（Definition of Done）

每个 Story 的 DoD：
1. **代码实现** — 功能代码已合并到 main 分支
2. **单元测试** — 覆盖实现逻辑，断言通过率 100%
3. **集成测试** — 与上下游系统联调通过
4. **类型检查** — `pnpm type-check` 通过，无 TS 错误
5. **Linting** — `pnpm lint` 无 error/warning
6. **文档更新** — 相关 README/API 文档同步更新
7. **Code Review** — 至少 1 人 review 通过

Epic DoD：
- 所有 Story DoD 完成
- Epic-level 集成测试通过
- 架构决策记录（ADR）已写入 `docs/adr/`

---

## 7. 实施计划（Sprint 排期）

> 基于 29h 总工时，假设团队 2 人并行，每 sprint 容量 16h

| Sprint | Epic | Stories | 工时 | 交付物 |
|--------|------|---------|------|--------|
| **Sprint 1** (P0 紧急) | Epic 1: API v0/v1 治理 | E1-S1, E1-S2, E1-S3 | 4h | v0 Deprecation 上线，v1 路由完整 |
| **Sprint 1** (P0 紧急) | Epic 2: WebSocket 连接治理 | E2-S1, E2-S2, E2-S3 | 6h | 连接限制 + 健康检查端点上线 |
| **Sprint 2** (P1 重要) | Epic 3: 类型共享 | E3-S1, E3-S2, E3-S3 | 3h | @vibex/types 被依赖方使用 |
| **Sprint 2** (P1 重要) | Epic 4: 双路由收敛 | E4-S1, E4-S2, E4-S3 | 4h | 路由边界清晰，Auth 一致 |
| **Sprint 3** (P2 优化) | Epic 5: 压缩质量 | E5-S1, E5-S2, E5-S3 | 5h | qualityScore 指标上线 |
| **Sprint 3** (P2 优化) | Epic 6: 安全扫描 | E6-S1, E6-S2, E6-S3 | 4h | AST 扫描替换正则匹配 |
| **Sprint 4** (P2 优化) | Epic 7: MCP 可观测 | E7-S1, E7-S2 | 3h | MCP 健康检查 + structured log |
| **Buffer** | 预留 | 回归测试 + 问题修复 | 4h | - |

**里程碑**：
- Sprint 1 结束时（10h）：P0 风险归零
- Sprint 2 结束时（21h）：类型安全 + 路由统一
- Sprint 3 结束时（30h）：P2 功能上线
- Sprint 4 结束时（37h）：全部功能完成（含 buffer）

---

## 8. 风险与依赖

| 风险 | 缓解 |
|------|------|
| v0 迁移影响已有集成方 | 渐进废弃，保留 30 天观察期 |
| packages/types 引入循环依赖 | 先在 auth 模块试点 |
| Hono → Next.js Auth 迁移破坏现有登录 | 方案三分层治理，暂不移除 Hono |
| @babel/parser 依赖增加 bundle size | 仅用于 AST 分析，tree-shaking 友好 |

**无外部依赖** — 所有工作可在团队内部完成。
