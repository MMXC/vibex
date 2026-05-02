# VibeX Sprint 21 PRD — E2E 测试环境隔离

**Agent**: pm
**日期**: 2026-05-02
**功能 ID**: P005-R
**优先级**: P0
**状态**: PM 评审通过，待 Architect 评审

---

## 1. 用户故事

### 故事 1: QA 工程师
**作为** QA 工程师
**我想要** E2E 测试在隔离环境中运行
**这样** 测试数据不会污染生产数据库，测试结果可信

**验收标准**:
- CI 中 E2E job 的 BASE_URL 不包含 vibex.top 域名
- 测试执行后生产数据库无新增测试数据
- 并发 E2E 测试之间无竞态条件

---

### 故事 2: 开发者
**作为** 开发者
**我想要** CI E2E 不依赖生产环境稳定性
**这样** 我的 PR 合入不被外部服务故障阻断

**验收标准**:
- CI E2E 成功率 >= 95%（连续 10 次）
- 失败原因从 E2E 报告可定位，不依赖外部日志
- 即使 vibex.top 不可用，CI E2E 仍能执行

---

### 故事 3: DevRel / PM
**作为** DevRel / PM
**我想要** E2E 报告可访问
**这样** 可以追踪测试健康度，不只是 artifact 中的 HTML

**验收标准**:
- E2E 报告在 CI artifact 中（HTML + JSON 摘要）
- Slack 机器人可回复 "当前 CI E2E 状态" 的摘要查询
- 报告包含 flaky 测试标记

---

## 2. 验收标准（详细）

### AC-1: 环境隔离

| ID | 验收标准 | 测试方式 |
|----|---------|---------|
| AC-1.1 | BASE_URL 不包含 vibex.top 域名 | CI env inspection |
| AC-1.2 | staging 环境存在且可访问 | HTTP health check |
| AC-1.3 | staging 有数据隔离机制（独立 DB schema 或 fixture reset） | integration test |

### AC-2: 测试稳定性

| ID | 验收标准 | 测试方式 |
|----|---------|---------|
| AC-2.1 | 连续 10 次 CI E2E 成功率 >= 95% | CI history analysis |
| AC-2.2 | 每个 spec 使用独立 fixture，无共享状态 | code review + isolation test |
| AC-2.3 | 重试机制：flaky test 自动重试 <= 2 次 | CI config review |

### AC-3: 报告可访问性

| ID | 验收标准 | 测试方式 |
|----|---------|---------|
| AC-3.1 | E2E 报告生成到 CI artifact | CI artifact inspection |
| AC-3.2 | Slack 命令可查询最近一次 E2E 结果摘要 | manual + integration test |

### AC-4: 功能覆盖（回归）

| ID | 验收标准 | 测试方式 |
|----|---------|---------|
| AC-4.1 | Canvas 关键路径 E2E（创建/编辑/删除卡片）在 staging 通过 | e2e test run |
| AC-4.2 | Workbench 关键路径 E2E（开启 session）通过 | e2e test run |
| AC-4.3 | 当前 merge gate 中的 E2E 测试在 staging 等价通过 | diff analysis |

---

## 3. 方案设计

### 方案 A: Staging 环境 + CI 隔离（推荐）

**架构**:
```
CI E2E job
  └── BASE_URL = $STAGING_BASE_URL (非 vibex.top)
        └── staging.vibex.top (或 dedicated staging env)
              └── Database: separate schema or test DB
```

**实施步骤**:
1. 部署 staging 环境（独立 subdomain 或 docker-compose）
2. 配置 staging DB（独立 schema，测试数据初始化脚本）
3. 修改 `.github/workflows/test.yml` E2E job 的 BASE_URL
4. 每个 Playwright spec 添加 `test.beforeEach` fixture reset
5. 集成 E2E 报告到 CI artifact + Slack 摘要生成
6. 验证 Canvas + Workbench 关键路径通过

**成本**: 2-4h（staging 部署）+ 1h（CI 配置）+ 1h（report）+ 1h（验证）= 5-7h

### 方案 B: Playwright Mock API Mode

**架构**:
```
CI E2E job
  └── BASE_URL = localhost:3000 (本地 mock)
        └── MSW (Mock Service Worker) intercepts API calls
              └── 独立 mock 数据文件 per spec
```

**成本**: 3-5h（setup）+ 2h（迁移 spec）+ 1h（验证）= 6-8h

**缺点**: 无法测试真实后端交互，不推荐作为 primary

---

## 4. 依赖关系

| 依赖 | 类型 | 责任人 |
|------|------|--------|
| staging 环境部署 | infrastructure | DevOps / Architect |
| staging DB 隔离方案 | infrastructure | DevOps |
| BASE_URL 环境变量注入 | CI 配置 | Dev |

---

## 5. Definition of Done

- [ ] staging 环境可访问且 health check 通过
- [ ] CI E2E job BASE_URL 不是 vibex.top
- [ ] Canvas 关键路径 E2E 在 staging 通过
- [ ] 连续 3 次 CI E2E 无 flaky 失败
- [ ] E2E 报告在 CI artifact 中可下载
- [ ] PM 确认 staging 环境隔离方案满足安全要求
- [ ] 当前 merge gate 中的 E2E 测试在 staging 等价通过

---

## 6. 附录：原始 P005 问题记录

原始提案 "E2E CI 集成化" 的问题本质是：
- CI 中已有 E2E job ✅
- PR 合入已有 E2E gate ✅
- **但 BASE_URL 指向生产环境 = 危险设计** ❌

重新定义后的 P005-R 聚焦于 "环境隔离"，这是真正的产品问题。
