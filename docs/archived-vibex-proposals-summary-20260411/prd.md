# VibeX 提案汇总 PRD — 2026-04-11

**项目**: vibex-proposals-summary-vibex-proposals-20260411
**版本**: v1.0
**日期**: 2026-04-11
**汇总者**: PM Agent
**状态**: Draft → Ready for Review
**来源**: 6 Agent 提案（Dev / Analyst / Architect / PM / Tester / Reviewer）

---

## 1. 执行摘要

### 1.1 背景

2026-04-11 周期提案收集完成，6 个 Agent 共识别出 **58 条改进提案**，形成当前周期最完整的 VibeX 技术债与 Feature 地图。

**历史遗留 P0 问题**（连续 2-3 轮未执行）：
- `task_manager.py` Slack token 硬编码 → GitHub secret scanning 阻断所有相关 commit
- `@ci-blocking` 跳过 35+ 测试 → CI 门禁形同虚设
- ESLint `no-explicit-any` 9 文件未清理
- Playwright CI timeout = 10s（非标准 30s）

**新增 P0 风险**：
- WebSocket ConnectionPool 无连接数限制 → OOM 风险
- API v0/v1 双路由 50+ 文件重复维护
- PrismaClient Workers 守卫缺失，8+ 路由无法部署

### 1.2 提案总览

| 来源 Agent | 提案数 | P0 | P1 | P2 |
|-----------|--------|-----|-----|-----|
| Dev | 7+ | 2 | 3 | 2+ |
| Analyst | 11 | 4 | 5 | 2 |
| Architect | 7 | 2 | 2 | 3 |
| PM | 10 | 3 | 3 | 4 |
| Tester | 9 | 4 | 3 | 2 |
| Reviewer | 14 | 3 | 5 | 6 |
| **合计** | **58+** | **18** | **21** | **19+** |

### 1.3 目标

在 **5 个 Sprint（约 5 周）** 内，消除所有 18 条 P0 提案，建立类型安全、测试门禁、架构统一基线，并完成核心 PM Feature。

### 1.4 成功指标

| 指标 | 当前值 | Sprint 5 目标 |
|------|--------|--------------|
| P0 遗留数 | 18 | **0** |
| ESLint `any` 文件数 | 9 | **0** |
| `@ci-blocking` 跳过测试数 | 35+ | **0** |
| API 路由重复文件数 | 50+ | **0**（v0 废弃） |
| waitForTimeout 残留 | 87 | **0** |
| 类型安全覆盖率 | 0% | **≥ 80%**（packages/types） |

---

## 2. Epic 总览表

> 合并去重 6 个 Agent PRD 中的所有 Epic，按主题归类，去除跨 Agent 重复项。

| # | Epic ID | Epic 名称 | 来源 | 优先级 | 工时 | Stories | 依赖 |
|---|---------|---------|------|--------|------|---------|------|
| 1 | E-P0-1 | **P0 Tech Debt 紧急修复**（Slack token / ESLint any / Workers 守卫 / @ci-blocking 清理） | Dev+Analyst 合并 | P0 | 8h | 8 | 无 |
| 2 | E-P0-2 | **API v0/v1 双路由治理** | Architect | P0 | 4h | 3 | 无 |
| 3 | E-P0-3 | **WebSocket ConnectionPool 连接治理** | Architect | P0 | 6h | 3 | 无 |
| 4 | E-P0-4 | **需求输入质量提升**（AI 智能补全 / 项目搜索 / flowId E2E） | PM | P0 | 10h | 3 | 无 |
| 5 | E-P0-5 | **测试基础设施修复**（grepInvert / Playwright 配置 / stability 路径） | Tester | P0 | 1.75h | 3 | 无 |
| 6 | E-P1-1 | **日志基础设施与健壮性**（console→logger / devDebug 统一 / ai-service JSON 降级） | Dev | P1 | 9h | 4 | E-P0-1 |
| 7 | E-P1-2 | **Auth 中间件统一**（Hono/Next.js 双路由收敛） | Architect | P1 | 4h | 3 | E-P0-2 |
| 8 | E-P1-3 | **类型安全修复**（`as any` / 空 catch / `e: any` / ESLint 强制规则） | Reviewer | P1 | 5.5h | 6 | E-P0-1 |
| 9 | E-P1-4 | **测试质量提升**（flowId E2E / WebSocket logger 测试 / snapshot 合约 / waitForTimeout 清理） | Tester | P1 | 8.25h | 5 | E-P0-5 |
| 10 | E-P1-5 | **企业协作场景**（团队协作 UI / 版本历史 / Tree 按钮统一） | PM | P1 | 13h | 3 | E-P0-4 |
| 11 | E-P1-6 | **提案追踪闭环**（CLI CI 集成 / Task Manager 增强） | Analyst | P1 | 2h | 1 | E-P0-1 |
| 12 | E-P1-7 | **packages/types 类型共享** | Architect | P1 | 3h | 3 | E-P0-2 |
| 13 | E-P2-1 | **体验优化**（快捷键 / 离线提示 / 导入导出 / AI 评分） | PM | P2 | 8h | 4 | E-P1-5 |
| 14 | E-P2-2 | **CompressionEngine 质量保障**（qualityScore 指标 / 降级策略） | Architect | P2 | 5h | 3 | E-P1-2 |
| 15 | E-P2-3 | **Prompts 安全 AST 扫描** | Architect | P2 | 4h | 3 | E-P1-1 |
| 16 | E-P2-4 | **MCP Server 可观测性** | Architect | P2 | 3h | 2 | E-P1-2 |
| 17 | E-P2-5 | **代码一致性提升**（unwrap 合并 / eslint-disable 清理 / TODO 评估） | Reviewer | P2 | 4h | 3 | E-P1-3 |
| 18 | E-P2-6 | **工具强制约束**（ESLint 严格规则 / CI 拦截） | Reviewer | P2 | 3h | 3 | E-P2-5 |
| 19 | E-P2-7 | **P2 Tech Debt 基础设施**（Registry 版本化 / Reviewer 去重） | Analyst | P2 | 5h | 2 | E-P1-6 |

**Epic 总计**: 19 个 | **总工时**: ~107h（关键路径 ~68h）| **团队**: 2 Dev 并行

---

## 3. 优先级矩阵

### P0 — 紧急止血（18 条，必须在 Sprint 0-1 完成）

| # | 提案 | 来源 | 工时 | 责任人 | 验收方式 |
|---|------|------|------|--------|---------|
| P0-1 | Slack token 环境变量迁移 | Analyst | 0.5h | Dev | `grep "xoxp-" task_manager.py == 0` |
| P0-2 | ESLint `no-explicit-any` 9 文件清理 | Analyst | 1h | Dev | `tsc --noEmit` 无 any 错误 |
| P0-3 | `@ci-blocking` 批量移除（35+ 测试） | Tester | 1h | Tester | `grep @ci-blocking == 0` |
| P0-4 | Playwright timeout 统一（10s→30s） | Tester | 0.5h | Tester | `grep timeout 30000` |
| P0-5 | WebSocket ConnectionPool 连接数限制 | Architect | 1.5h | Dev | `pool.connect(1001) → 503` |
| P0-6 | WebSocket 死连接 5min 清理 | Architect | 3h | Dev | `deadConnection.isAlive == false` |
| P0-7 | WebSocket 健康检查端点 | Architect | 1.5h | Dev | `GET /api/ws/health → 200` |
| P0-8 | API v0 Deprecation header | Architect | 4h | Dev | `v0 endpoints → Deprecation header` |
| P0-9 | PrismaClient Workers 守卫（8+ 路由） | Analyst | 1h | Dev | `wrangler deploy` 成功 |
| P0-10 | connectionPool.ts console.log 泄露（4 处） | Dev | 1h | Dev | `grep console.log == 0` |
| P0-11 | project-snapshot.ts 假数据（5 个 TODO） | Dev | 3h | Dev | API 返回 D1 真实数据 |
| P0-12 | AI 智能补全（需求输入质量） | PM | 5h | Dev+PM | `triggerRate ≥ 80%` |
| P0-13 | 项目搜索过滤 | PM | 3h | Dev+PM | `searchResponse < 200ms` |
| P0-14 | flowId E2E 验证 | PM+Tester | 2h | Tester | `e2e test 100% pass` |
| P0-15 | stability.spec.ts 路径修复 | Tester | 0.25h | Tester | `violationCount > 0` |
| P0-16 | 删除 `grepInvert` Playwright 配置 | Tester | 0.5h | Tester | `testCount ≥ 50` |
| P0-17 | 删除双重 Playwright 配置 | Tester | 1h | Dev | `tests/e2e/playwright.config.ts` 不存在 |
| P0-18 | generate-components flowId E2E | Tester | 2h | Tester | `body.flowId` 为 UUID v4 |

### P1 — 重要改进（21 条，Sprint 2-3 完成）

| # | 提案 | 来源 | 工时 | 责任人 |
|---|------|------|------|--------|
| P1-1 | devDebug → logger.debug 统一 | Dev | 2h | Dev |
| P1-2 | 路由 console.error 结构化 | Dev | 2h | Dev |
| P1-3 | connectionPool 异常处理增强（熔断） | Dev | 2h | Dev |
| P1-4 | ai-service JSON 解析降级策略 | Dev | 2h | Dev |
| P1-5 | 遗留备份文件清理 | Dev | 1h | Dev |
| P1-6 | 提案追踪 CLI CI 集成 | Analyst | 2h | Analyst |
| P1-7 | Tree Toolbar 按钮样式归一（≤2 种） | Analyst | 0.5h | Dev |
| P1-8 | 消除 `as any` 类型断言（5 文件） | Reviewer | 4h | Dev |
| P1-9 | 修复空 catch 块（2 处高风险） | Reviewer | 1h | Dev |
| P1-10 | 修复 `e: any` 异常参数（6 处） | Reviewer | 0.5h | Dev |
| P1-11 | Auth middleware Hono/Next.js 行为一致 | Architect | 2h | Dev |
| P1-12 | Hono routes 文件清理（≤10 个） | Architect | 1h | Dev |
| P1-13 | packages/types 启用类型共享 | Architect | 3h | Dev |
| P1-14 | WebSocket logger 回归测试 | Tester | 1h | Tester |
| P1-15 | project-snapshot 合约测试 | Tester | 1h | Tester |
| P1-16 | 团队协作空间 UI | PM | 6h | Dev+PM |
| P1-17 | 版本历史对比（快照+回滚） | PM | 5h | Dev+PM |
| P1-18 | Tree 按钮样式统一 | PM | 2h | Dev |
| P1-19 | 合并 API unwrap 模块 | Reviewer | 2h | Dev |
| P1-20 | 压缩质量 qualityScore 指标 | Architect | 3h | Dev |

### P2 — 优化改进（19 条，Sprint 4-5 完成）

| # | 提案 | 来源 | 工时 | 责任人 |
|---|------|------|------|--------|
| P2-1 | waitForTimeout 87 处清理 | Tester | 4h | Tester |
| P2-2 | ai-service JSON 解析单元测试 | Tester | 1h | Tester |
| P2-3 | canvas-e2e project 路径修复 | Tester | 0.25h | Tester |
| P2-4 | eslint-disable 清理（减少 50%） | Reviewer | 1h | Dev |
| P2-5 | TODO 注释评估处理 | Reviewer | 1h | Dev |
| P2-6 | ESLint 严格规则配置（CI 强制） | Reviewer | 3h | Dev |
| P2-7 | qualityScore < 70 降级全量上下文 | Architect | 2h | Dev |
| P2-8 | 压缩引擎 keyConceptsPreserved 保留 | Architect | 1h | Dev |
| P2-9 | Prompts AST 扫描替代正则 | Architect | 4h | Dev |
| P2-10 | MCP Server /health 端点 | Architect | 1.5h | Dev |
| P2-11 | MCP Server structured logging | Architect | 1.5h | Dev |
| P2-12 | 快捷键系统（Ctrl+S/Z/Enter） | PM | 2h | Dev+PM |
| P2-13 | 离线模式提示 | PM | 1h | Dev+PM |
| P2-14 | 需求导入导出（md/json/yaml） | PM | 3h | Dev+PM |
| P2-15 | AI 生成评分（1-5 星） | PM | 2h | Dev+PM |
| P2-16 | ComponentRegistry 版本化（热更新） | Analyst | 3h | Dev |
| P2-17 | Reviewer 任务去重 | Analyst | 2h | Analyst |
| P2-18 | 遗留文件清理 + TODO 收尾 | Dev | 1h | Dev |
| P2-19 | CHANGELOG 更新 | Dev | 1h | Dev |

---

## 4. Sprint 排期建议

> 团队 2 Dev 并行执行，Sprint 周期 1 周（5 个工作日），单 Sprint 容量 16h/人 = 32h 团队容量。

### Sprint 0：紧急止血（1 天，5 人并行）

| 任务 | 负责人 | 工时 |
|------|--------|------|
| P0-1 Slack token 迁移 | Dev | 0.5h |
| P0-2 ESLint any 清理（9 文件） | Dev | 1h |
| P0-3 @ci-blocking 移除（35+ 测试） | Tester | 1h |
| P0-4 Playwright timeout 30s | Tester | 0.5h |
| P0-15 stability.spec.ts 路径修复 | Tester | 0.25h |
| P0-16 删除 grepInvert | Tester | 0.5h |
| P0-17 删除双重 Playwright 配置 | Dev | 1h |
| P0-9 PrismaClient Workers 守卫 | Dev | 1h |
| **Sprint 0 合计** | | **5.75h** |

**交付**: 4 个历史遗留 P0 归零，CI 门禁恢复正常。

---

### Sprint 1：P0 功能上线（1 周，32h）

| 任务 | 负责人 | 工时 |
|------|--------|------|
| P0-5/6/7 WebSocket 连接治理 | Dev | 6h |
| P0-8 API v0 Deprecation | Dev | 4h |
| P0-10 connectionPool console.log 清理 | Dev | 1h |
| P0-11 project-snapshot 真实数据 | Dev | 3h |
| P0-12 AI 智能补全 | Dev+PM | 5h |
| P0-13 项目搜索过滤 | Dev+PM | 3h |
| P0-14 flowId E2E | Tester | 2h |
| P0-18 generate-components flowId E2E | Tester | 2h |
| **Sprint 1 合计** | | **26h** |

**交付**: 所有 18 条 P0 问题归零，PM 核心 Feature 上线，WebSocket 稳定性保障。

---

### Sprint 2：P1 基础建设（1 周，32h）

| 任务 | 负责人 | 工时 |
|------|--------|------|
| P1-1 devDebug → logger 统一 | Dev | 2h |
| P1-2 路由 console.error 结构化 | Dev | 2h |
| P1-3 connectionPool 熔断 | Dev | 2h |
| P1-4 ai-service JSON 降级 | Dev | 2h |
| P1-5 遗留文件清理 | Dev | 1h |
| P1-11/12 Auth 统一 + Hono 清理 | Dev | 3h |
| P1-13 packages/types 类型共享 | Dev | 3h |
| P1-8 `as any` 清理（5 文件） | Dev | 4h |
| P1-9/10 空 catch + `e: any` 修复 | Dev | 1.5h |
| P1-14 WebSocket logger 测试 | Tester | 1h |
| P1-15 project-snapshot 合约测试 | Tester | 1h |
| P1-7 Tree Toolbar 归一 | Dev | 0.5h |
| P1-6 CLI CI 集成 | Analyst | 2h |
| **Sprint 2 合计** | | **25h** |

**交付**: 日志体系统一，类型安全达标，Auth 中间件行为一致性，packages/types 共享上线。

---

### Sprint 3：P1 PM Feature（1 周，32h）

| 任务 | 负责人 | 工时 |
|------|--------|------|
| P1-16 团队协作空间 UI | Dev+PM | 6h |
| P1-17 版本历史对比 + 回滚 | Dev+PM | 5h |
| P1-18 Tree 按钮样式统一 | Dev | 2h |
| P1-20 Compression qualityScore | Dev | 3h |
| P1-19 unwrap 模块合并 | Dev | 2h |
| P2-1 waitForTimeout 清理（~60 处） | Tester | 4h |
| P2-2 ai-service 单元测试 | Tester | 1h |
| P2-3 canvas-e2e 路径修复 | Tester | 0.25h |
| **Sprint 3 合计** | | **~23.25h** |

**交付**: 企业协作 Feature 上线，压缩引擎质量可量化，waitForTimeout 大幅减少。

---

### Sprint 4：P2 安全 + 架构（1 周，32h）

| 任务 | 负责人 | 工时 |
|------|--------|------|
| P2-1 waitForTimeout 清理（剩余 ~27 处） | Tester | 2h |
| P2-9 Prompts AST 安全扫描 | Dev | 4h |
| P2-10/11 MCP Server /health + structured log | Dev | 3h |
| P2-7 qualityScore < 70 降级 | Dev | 2h |
| P2-8 keyConceptsPreserved | Dev | 1h |
| P2-4 eslint-disable 清理 | Dev | 1h |
| P2-5 TODO 评估 | Dev | 1h |
| P2-6 ESLint 严格规则 + CI | Dev | 3h |
| P2-12 快捷键系统 | Dev+PM | 2h |
| P2-13 离线模式提示 | Dev+PM | 1h |
| P2-14 导入导出 | Dev+PM | 3h |
| P2-15 AI 生成评分 | Dev+PM | 2h |
| **Sprint 4 合计** | | **~25h** |

**交付**: 安全扫描升级，MCP 可观测，P2 功能全部上线。

---

### Sprint 5：收尾 + 基础设施（1 周，32h）

| 任务 | 负责人 | 工时 |
|------|--------|------|
| P2-16 ComponentRegistry 版本化 | Dev | 3h |
| P2-17 Reviewer 任务去重 | Analyst | 2h |
| P2-18/19 遗留清理 + CHANGELOG | Dev | 2h |
| 全量回归测试（E2E + unit） | Tester | 4h |
| 全量 tsc + lint 验证 | Dev | 2h |
| PRD 总结 + 文档更新 | PM | 2h |
| Sprint 5 演示 + 回顾 | 全员 | 1h |
| Buffer（机动） | | 6h |
| **Sprint 5 合计** | | **~22h** |

**交付**: 所有 19 个 Epic 完成，代码质量恢复到基准线，文档同步更新。

---

### 关键路径（Critical Path）

```
Sprint 0 (止血) → Sprint 1 (P0 功能) → Sprint 2 (类型安全) → Sprint 3 (协作 Feature)
                      ↓                    ↓
              E-P0-3 WebSocket    E-P1-2 Auth 统一
```

**里程碑**：
- Sprint 0 结束：历史 P0 遗留归零，CI 门禁恢复正常
- Sprint 1 结束：全部 18 条 P0 完成（58 条中 18 条完成）
- Sprint 2 结束：类型安全 + 架构统一（~39 条完成）
- Sprint 3 结束：企业协作 Feature 上线（~52 条完成）
- Sprint 4 结束：安全 + P2 功能完成（全部 58+ 条完成）
- Sprint 5 结束：全部 Epic 完成，文档同步

---

## 5. 验收标准汇总（所有 expect() 断言）

> 按 Epic 分组，汇总所有 Agent PRD 中的验收断言。

### E-P0-1: P0 Tech Debt 紧急修复

```python
# P0-1: Slack Token 迁移
assert "xoxp-" not in read("scripts/task_manager.py")
assert "os.environ" in read("scripts/task_manager.py")
assert "SLACK_TOKEN=" in read(".env.example")
```

```bash
# P0-2: ESLint no-explicit-any
tsc --noEmit
eslint --rule 'typescript/no-explicit-any: error' packages/ services/ --max-warnings 0
```

```bash
# P0-3: @ci-blocking 移除
grep -rn "@ci-blocking" --include="*.test.ts" --include="*.spec.ts"
# 预期: 无输出
npm run test  # 100% 通过
```

```bash
# P0-9: PrismaClient Workers 守卫
wrangler deploy  # 无 PrismaClient 加载错误
curl -s https://api.example.com/api/generate-components -w "%{http_code}" | grep "200\|201"
```

### E-P0-2: API v0/v1 双路由治理

```typescript
// v0 Deprecation header
expect(headers['Deprecation']).toBeTruthy();
expect(headers['Sunset']).toBeTruthy();

// v1 路由覆盖完整性
expect(v1Endpoints).toContainAllKeys(Object.keys(v0Endpoints));

// Contract test 仅在 v1 运行
expect(contractTestTargets).toEqual(['v1']);
expect(contractTestTargets).not.toContain('v0');
```

### E-P0-3: WebSocket ConnectionPool 连接治理

```typescript
// 连接数限制（超限返回 503）
expect(await pool.connect(1001)).toMatchObject({ status: 503 });

// 死连接 5min 清理
expect(deadConnection.isAlive).toBe(false);
expect(pool.activeConnections).toBeLessThanOrEqual(maxConnections);

// 健康检查端点
const res = await fetch('/api/ws/health');
expect(res.status).toBe(200);
expect(body).toMatchObject({
  activeConnections: expect.any(Number),
  maxConnections: expect.any(Number)
});
```

### E-P0-4: 需求输入质量提升

```typescript
// AI 智能补全
expect(keywordDetector.detect('模糊输入')).toBeTruthy();
expect(clarifyResponseTime).toBeLessThan(1000);
expect(triggerRate).toBeGreaterThan(0.8);

// 项目搜索过滤
expect(searchResponseTime).toBeLessThan(200);
expect(filterByName('proj')).toMatchObject(expected);

// flowId E2E
expect(flowIdE2E.test.ts).toPass();
expect(ComponentRegistry.get(flowId)).toBeDefined();
```

### E-P0-5: 测试基础设施修复

```typescript
// grepInvert 删除
expect(grepContent).not.toContain('grepInvert');
expect(testCount).toBeGreaterThanOrEqual(50);

// Playwright 配置统一
expect(fileExists('tests/e2e/playwright.config.ts')).toBe(false);
expect(timeoutValue).toBe(30000);

// stability.spec.ts 路径
expect(violationCount).toBeGreaterThan(0);
expect(globPattern).toContain('tests/e2e');
```

### E-P1-1: 日志基础设施与健壮性

```typescript
// connectionPool console.log → logger
expect(logger.info).toHaveBeenCalledWith('connection_added', expect.objectContaining({ connectionId: expect.any(String) }));
expect(grep('console.', 'connectionPool.ts')).toHaveLength(0);

// devDebug 统一
// Given: LOG_LEVEL=info, When: devDebug() 调用, Then: 无输出
// Given: LOG_LEVEL=debug, When: devDebug() 调用, Then: logger.debug() 被调用

// ai-service JSON 降级
const markdownJson = '```json\n{"key": "value"}\n```';
expect(parseJSONWithRetry(markdownJson)).resolves.toEqual({ key: "value" });

// connectionPool 熔断
// Given: handleMessage 连续失败 5 次, When: 第 5 次 catch, Then: health check 触发
```

### E-P1-3: 类型安全修复

```typescript
// AC1: as any 消除（不含测试文件）
const asAnyCount = execSync("grep -rn 'as any' vibex-fronted/src vibex-backend/src --include='*.ts' --include='*.tsx' | grep -v 'test' | grep -v '.spec.' | wc -l");
expect(parseInt(asAnyCount)).toBe(0);

// AC2: 空 catch 消除
const emptyCatchCount = execSync("grep -rn '} catch {' src services vibex-backend/src --include='*.ts' --include='*.tsx' | grep -v 'console.error\\|logger\\|log\\|Sentry\\|report' | wc -l");
expect(parseInt(emptyCatchCount)).toBe(0);

// AC3: unwrap 模块合并
const unwrapFiles = execSync("find . -name 'api-unwrap.ts' -o -name 'unwrappers.ts' | grep -v node_modules").toString().trim().split('\n');
expect(unwrapFiles.filter(f => f.includes('src/'))).toHaveLength(1);

// AC4: TypeScript 编译通过
expect(execSync("cd vibex-fronted && npx tsc --noEmit").toString()).not.toContain('error TS');

// AC5: ESLint 无错误
expect(parseInt(lintExitCode)).toBe(0);
```

### E-P1-4: 测试质量提升

```typescript
// generate-components flowId E2E
test('generate-components should include flowId in request', async ({ page }) => {
  const body = JSON.parse(request.postData());
  expect(body.flowId).toBeDefined();
  expect(body.flowId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

// project-snapshot 合约测试
test('GET /api/projects/:id/snapshots returns valid snapshot array', async ({ request }) => {
  expect(response.status()).toBe(200);
  expect(Array.isArray(body)).toBe(true);
  for (const snapshot of body) {
    expect(snapshot).toHaveProperty('id');
    expect(snapshot).toHaveProperty('createdAt');
    expect(snapshot).toHaveProperty('data');
  }
});

// waitForTimeout 清理验收
grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ --include="*.ts" | grep -v "stability.spec.ts" | wc -l
# 预期: 0
```

### E-P1-7: packages/types 类型共享

```typescript
// S3-S1: packages/types 导出
expect(require('@vibex/types')).toBeDefined();

// S3-S2: vibex-backend 依赖共享类型
expect(buildResult.exitCode).toBe(0);

// S3-S3: vibex-fronted 移除重复类型
expect(buildResult.exitCode).toBe(0);
expect(duplicateTypeCount).toBe(0);
```

### E-P2-2: CompressionEngine 质量保障

```typescript
// qualityScore 范围验证
expect(report.qualityScore).toBeGreaterThanOrEqual(0);
expect(report.qualityScore).toBeLessThanOrEqual(100);

// qualityScore < 70 降级全量上下文
expect(report.qualityScore).toBeLessThan(70);
expect(report.compressedTokens).toBe(report.originalTokens);

// keyConceptsPreserved
expect(report.keyConceptsPreserved).toContain('Order');
expect(report.keyConceptsPreserved).toContain('Payment');
```

### E-P2-3: Prompts 安全 AST 扫描

```typescript
// AST 精准检测 eval
const report = analyzeCodeSecurity('eval("alert(1)")');
expect(report.unsafeEval.length).toBeGreaterThan(0);

// 误报率 < 1%（合法代码 0% 误报）
const safeReports = testSafeCode.map(analyzeCodeSecurity);
expect(safeReports.filter(r => r.hasUnsafe).length).toBe(0);

// 性能 < 50ms/文件
expect(Date.now() - start).toBeLessThan(50);
```

### E-P2-4: MCP Server 可观测性

```typescript
// /health 端点
const res = await fetch('http://localhost:3100/health');
expect(res.status).toBe(200);
expect(body).toMatchObject({ status: 'ok', version: expect.any(String) });

// Structured logging
expect(JSON.parse(logOutput)).toMatchObject({
  tool: expect.any(String),
  duration: expect.any(Number),
  success: expect.any(Boolean)
});
```

---

## 6. Definition of Done（DoD）

### 通用 DoD（每个 Epic 必须满足）

- [ ] 所有 Story 代码已合并到 main 分支
- [ ] 每个 Story 有对应的单元/集成测试，断言通过率 100%
- [ ] `npx tsc --noEmit` 无 TypeScript 错误
- [ ] `npm run lint` 无 lint 错误/warning
- [ ] PR 通过 Code Review，至少 1 人 approve
- [ ] E2E 回归测试通过率 100%
- [ ] 相关文档同步更新（README / API docs / CHANGELOG）
- [ ] 架构决策记录（ADR）已写入 `docs/adr/`（适用架构变更 Epic）

### Epic 级别 DoD

| Epic | 附加 DoD |
|------|---------|
| E-P0-1 | `grep "xoxp-" task_manager.py == 0`；`wrangler deploy` 成功；`grep @ci-blocking == 0` |
| E-P0-2 | 所有 v0 端点返回 Deprecation header；v1 覆盖所有 v0 业务端点 |
| E-P0-3 | WebSocket 连接数 ≤ maxConnections；死连接 5min 内关闭；`GET /api/ws/health` 返回 200 |
| E-P0-4 | AI 智能补全触发率 ≥ 80%；搜索响应 < 200ms；flowId E2E 100% 通过 |
| E-P0-5 | CI 运行 ≥ 50 个测试；stability.spec.ts 检测到 > 0 条违规；tests/e2e/playwright.config.ts 不存在 |
| E-P1-1 | `grep "console." connectionPool.ts == 0`；markdown JSON 正确解析；熔断机制可触发 |
| E-P1-2 | Hono routes ≤ 10 个；Auth middleware 行为一致；`src/routes/` 仅含网关路由 |
| E-P1-3 | `grep "as any" src/ == 0`（不含测试文件）；空 catch 块均有日志；`tsc --noEmit` 无错误 |
| E-P1-4 | flowId E2E 存在且通过；snapshot 合约测试存在且通过；waitForTimeout == 0 |
| E-P1-5 | 团队协作 UI 支持多用户并发编辑；版本历史可查看/对比/回滚；Tree 按钮样式 ≤ 2 种 |
| E-P1-6 | CLI 使用率 ≥ 80%（连续 3 个 Sprint）；TRACKING.md 无需手动编辑 |
| E-P1-7 | `@vibex/types` 被 backend/frontend 依赖；build 通过；无重复类型定义 |
| E-P2-1 | qualityScore 指标上线；qualityScore < 70 降级全量上下文 |
| E-P2-2 | CompressionReport 含 qualityScore 字段；keyConceptsPreserved 字段存在 |
| E-P2-3 | AST 扫描误报率 < 1%；性能 < 50ms/文件 |
| E-P2-4 | MCP /health 可访问；structured log 为 JSON 格式 |
| E-P2-5 | unwrap 模块合并为 1 个入口；eslint-disable 减少 50%；所有 TODO 有 ticket 引用 |
| E-P2-6 | `@typescript-eslint/no-explicit-any: error` 生效；CI lint job 阻断 merge |
| E-P2-7 | ComponentRegistry 支持版本+hash 热更新；Reviewer 去重率 ≥ 90% |

---

## 7. 风险登记

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| P0 再次遗留（历史重演，连续 2-3 轮未执行） | 极高 | Sprint 0 必须全部完成，coord 每日追踪，Day 5 前归零 |
| waitForTimeout 87 处清理破坏现有测试 | 高 | 分批清理（每批 ≤ 10 处），修复后才移下一批，CI 全量验证 |
| API v0 废弃影响已有集成方 | 中 | 渐进废弃，30 天观察期，保留 v1 兜底，监控使用率 |
| ESLint 严格规则阻断 CI | 中 | 先 warn 级别引入，确认后升为 error，预留 2h 修复时间 |
| Hono → Next.js Auth 迁移破坏登录 | 高 | 方案三分层治理，暂不移除 Hono，白名单豁免 |
| packages/types 引入循环依赖 | 低 | 先在 auth 模块试点，确认后推广至全项目 |
| 提案闭环执行率低 | 中 | CI 强制集成，PR 合并前必须通过 CLI 更新状态，否则 CI 失败 |
| 4 个 P0 连续 3 轮未执行（执行率 0%） | 极高 | Sprint 0 强制执行，coord 盯死，每日站会汇报 |

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
