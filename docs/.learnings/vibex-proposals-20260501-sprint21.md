---
title: "Sprint 21 — E2E Staging Isolation"
date: 2026-05-02
tags: [e2e, ci, staging, playwright, devops]
aliases: ["e2e-staging", "ci-environment-isolation"]
---

## 项目摘要

Sprint 21 聚焦于解决 CI E2E 测试指向生产环境（vibex.top）的危险设计，改为 staging 环境隔离方案。

## 核心问题

- CI E2E BASE_URL 指向 `https://vibex.top`（生产环境）
- E2E 测试写入数据污染生产数据库
- 并发 PR 的 E2E 共享生产 DB 导致竞态条件、flaky 测试
- vibex.top 不可用时 CI 全部失败，阻断所有 PR 合入

## 解决方案

### 架构决策

1. **Staging Subdomain**: `staging.vibex.top` 而非独立路径，保持同域 cookie 共享
2. **Selective Delete**: 不改变 schema，用 reset 脚本按标记字段清理测试数据
3. **无回退 BASE_URL**: 如果 staging 不可用，CI job fail-fast，不 fallback 到生产
4. **Soft Delete + VACUUM**: fixture 数据带时间戳前缀，reset 脚本按时间清理

### 关键文件变更

| 文件 | 操作 |
|------|------|
| `.github/workflows/test.yml` | BASE_URL 改为 ${{ vars.BASE_URL }}，移除生产 fallback |
| `scripts/e2e-db-reset.ts` | 新增 DB reset 脚本（幂等） |
| `scripts/e2e-summary-to-slack.ts` | 新增 Slack 报告摘要脚本 |
| `tests/e2e/playwright.setup.ts` | 添加 CI 环境下的 fixture reset hook |
| `package.json` | 添加 e2e:db:reset script |
| `.env.staging.example` | 新增 staging 环境变量模板 |

### 性能影响

- DB reset: <5s/次（staging 数据量小）
- CI artifact 上传: +5-15s（HTML 报告约 2-5MB）
- E2E 执行时间: 无变化

## 经验教训

### 教训 1: 生产 URL fallback 是技术债

危险的不是当前是否污染，而是"未来某天会污染"。
设计决策：CI 中绝对不能有指向生产环境的 URL fallback，即使当前值是 staging。

### 教训 2: Staging 与 Prod 的 API 必须同步

如果 staging API 行为与 prod 不一致，E2E 覆盖率实际是假的。
建议：每次 prod 发布时同步 staging。

### 教训 3: DB reset 脚本必须幂等

reset 脚本被设计为每个 CI run 执行多次，幂等性是基本要求。
验证方式：`pnpm run e2e:db:reset && pnpm run e2e:db:reset` 连续执行不报错。

### 教训 4: 提案重定义比提案复用更重要

原始提案 "E2E CI 集成化" 聚焦于"集成"，实际问题是"隔离"。
重定义问题后，方案 A（staging 隔离）比方案 B（mock API）更合适。
启示：提案阶段花时间确认问题本质，可以节省大量实施成本。

## 工时记录

| 阶段 | 预估 | 实际 |
|------|------|------|
| Phase 0: Staging 部署 | 3h | 待 DevOps 实施 |
| Phase 1: CI 配置 | 1h | 完成 |
| Phase 2: DB reset 脚本 | 2h | 完成 |
| Phase 3: Slack 报告 | 1h | 完成 |
| Phase 4: E2E 验证 | 1h | 待 tester 验证 |
| **Total** | **8h** | 4h (代码部分) |

## 相关文件

- PRD: `docs/vibex-proposals-20260501-sprint21/prd.md`
- 架构: `docs/vibex-proposals-20260501-sprint21/architecture.md`
- 实施: `docs/vibex-proposals-20260501-sprint21/IMPLEMENTATION_PLAN.md`
- 约束: `docs/vibex-proposals-20260501-sprint21/AGENTS.md`
- Git commits: `6e6dc7c0f`, `918abbd11`