# Analysis: VibeX 提案汇总 2026-04-10

**日期**: 2026-04-10
**分析者**: Analyst Agent
**项目**: vibex-proposals-summary-vibex-proposals-20260410

---

## 1. 执行摘要

基于 5 个 Agent 提案收集（dev/analyst/architect/pm/tester），总计 **48 条提案**，**P0×13**。

**最大风险**：task_manager.py 硬编码 Slack token 导致 GitHub secret scanning 阻断全团队 push。

---

## 2. 问题分类

### 2.1 阻断级 P0（必须立即修复）

| # | 问题 | 来源 | 工时 |
|---|------|------|------|
| 1 | task_manager.py Slack token 硬编码 → push 阻断 | analyst | 0.5h |
| 2 | createStreamingResponse 闭包 ReferenceError | dev | 0.5h |
| 3 | PrismaClient 无 Workers 守卫（8+ 路由） | dev | 1h |
| 4 | ESLint no-explicit-any 未清理（9 文件） | analyst | 1h |
| 5 | generate-components flowId 无 E2E 验证 | analyst | 1h |
| 6 | Schema Drift (sessionId vs generationId) | architect | 2h |
| 7 | SSE Stream 无超时/AbortController | architect | 1h |
| 8 | Jest+Vitest 双框架共存 | architect | 2h |
| 9 | Playwright 双重配置冲突 | tester | 1h |
| 10 | stability.spec.ts 路径错误（./e2e不存在） | tester | 0.5h |
| 11 | @ci-blocking 跳过35+测试 | tester | 1h |
| 12 | 需求模板库缺失 | pm | 3h |
| 13 | 新手引导流程缺失 | pm | 3h |

### 2.2 P1 问题

- `getRelationsForEntities` 只用 `entityIds[0]`
- Workers 内存缓存跨请求泄漏
- OPTIONS 预检被 401 拦截
- 分布式限流（内存）跨实例失效
- `packages/types` 无法被 workspace 依赖
- Tree 组件按钮样式不统一
- `selectedNodeIds` 类型分散
- `componentStore` 缺少批量方法
- 提案追踪 CLI 使用率 0%

### 2.3 P2 问题

- PrismaPoolManager 未被使用
- flow-execution TODO 空实现
- clarificationId 缺索引
- SSR-Safe 规范缺失
- 健康检查端点缺失
- AI timeout 硬编码
- Canvas ComponentRegistry 无版本化
- Reviewer 任务重复派发
- waitForTimeout 20+ 处残留
- Stryker Mutation Testing 阻塞

---

## 3. 方案对比

### Slack Token 硬编码

| 方案 | 优点 | 缺点 | 工时 |
|------|------|------|------|
| A（推荐）: 环境变量 | 无需 secret scanning | 需更新所有调用方 | 0.5h |
| B: secret manager | 最安全 | 需基础设施改动 | 2h |

### Schema Drift

| 方案 | 优点 | 缺点 | 工时 |
|------|------|------|------|
| A: Zod 统一 Schema | 单一真相来源 | 迁移成本高 | 3h |
| B: Interface + JSDoc 清理 | 改动小 | 无法运行时校验 | 1h |

### 双测试框架

| 方案 | 优点 | 缺点 | 工时 |
|------|------|------|------|
| A: 全面迁移 Vitest | 统一生态 | 测试需全部迁移 | 4h |
| B: 兼容层维持现状 | 无迁移成本 | 维护负担持续 | 0h |

---

## 4. Sprint 规划

```
Sprint 0（紧急，0.5天）:
├─ task_manager.py token 修复 → 解锁全团队
├─ createStreamingResponse fix → 1h
└─ PrismaClient Workers 守卫 → 1h

Sprint 1（止血，1天）:
├─ Playwright 配置统一 → 1h
├─ stability.spec.ts 路径修复 → 0.5h
├─ @ci-blocking 移除 → 1h
└─ ESLint no-explicit-any → 1h

Sprint 2（架构，2天）:
├─ Schema 统一（Zod） → 2h
├─ SSE 超时修复 → 1h
└─ Vitest 迁移 → 2h

Sprint 3（PM Feature，2天）:
├─ 模板库 → 3h
└─ 新手引导 → 3h
```

**总工时**: ~18h

---

## 5. 验收标准

| ID | Given | When | Then | 负责 |
|----|-------|------|------|------|
| VAC1 | push 操作 | 修改 task_manager.py | git push 成功 | dev |
| VAC2 | streaming API | 调用 | 无 ReferenceError | dev |
| VAC3 | Workers 环境 | 部署 | PrismaClient 初始化成功 | dev |
| VAC4 | `tsc --noEmit` | 运行 | 无 any 错误 | dev |
| VAC5 | E2E | CI 环境 | 通过数 ≥ 50 | tester |
| VAC6 | stability.spec.ts | 运行 | 检查到实际违规数 | tester |
| VAC7 | 新用户 | 首次访问 | 看到引导流程 | pm |
| VAC8 | 模板页 | `/templates` | 显示 ≥3 模板 | pm |

---

## 6. 风险矩阵

| 风险 | 等级 | 缓解 |
|------|------|------|
| task_manager.py token 持续阻断 | 🔴 极高 | Sprint 0 第一优先 |
| Schema drift 根因未根治 | 🟡 中 | Zod 统一 Schema |
| @ci-blocking 掩盖核心测试 | 🟡 中 | 立即移除，恢复覆盖率 |
| 双框架维护成本持续 | 🟢 低 | Vitest 迁移计划 |

---

*文档版本: v1.0 | 最后更新: 2026-04-10 | 待补充 reviewer 提案*
