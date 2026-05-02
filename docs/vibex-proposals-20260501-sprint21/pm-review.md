# VibeX Sprint 21 PM Review — 提案产品评审报告

**Agent**: pm
**日期**: 2026-05-02
**项目**: vibex-proposals-20260501-sprint21
**任务**: pm-review
**分析依据**: `/root/.openclaw/vibex/docs/vibex-proposals-20260501-sprint21/analysis.md`
**产出路径**: `/root/.openclaw/vibex/docs/vibex-proposals-20260501-sprint21/prd.md`

---

## 1. PM 评审结论

### 逐提案评审

| 提案 | Analyst 结论 | PM 评审 | PM 决策 |
|------|-------------|---------|---------|
| P001 Design-to-Code DoD | ✅ 已完成 | 代码 + INDEX.md 已验证，analyst 驳回正确 | **REJECTED** — 无产品问题 |
| P002 TypeScript 严格模式 | ✅ 已完成 | tsc --noEmit 0 errors，analyst 驳回正确 | **REJECTED** — 无产品问题 |
| P003 Workbench 生产化 | ✅ 技术完成 | 功能完成，等待 `NEXT_PUBLIC_WORKBENCH_ENABLED=true` 发版 | **BLOCKED** — 需 coord 确认发版计划 |
| P004 Canvas 虚拟化 | ✅ 已完成 | 实现完成，benchmark 存在 | **REJECTED** — 无产品问题 |
| P005 E2E CI 集成化 | ⚠️ 部分完成，风险高 | 问题真实：生产环境跑 E2E = 数据污染 + 竞态 | **REJECTED — 重新定义范围** |
| P006 Claude Code Agent | ✅ 已完成 | 真实接入 + 40 unit tests 通过，analyst 驳回正确 | **REJECTED** — 无产品问题 |

### 决策理由

**P001/P002/P004/P006** 无产品问题，analyst 证据充分，驳回正确。

**P003** 技术完成但未发版，属于发布管理决策而非开发任务。建议 coord 确认 beta 发布计划。

**P005** 是唯一真实产品问题，但原始提案范围 "E2E CI 集成化" 掩盖了本质问题：**在生产环境跑 E2E 测试是危险设计**。正确的问题是 "E2E 测试环境隔离"。

---

## 2. 重新定义 P005 — E2E 测试环境隔离

### 问题定义（产品视角）

**当前状态**: CI gate 中的 E2E 测试使用 `BASE_URL=https://vibex.top`（生产环境）

**危险点**:
1. E2E 测试数据写入生产数据库（污染真实用户数据）
2. 并发 E2E 测试之间产生竞态条件（测试结果不可信）
3. 外部依赖（vibex.top）不稳定导致 CI 频繁 flaky（阻断合入）
4. 无法在 CI 中模拟用户数据隔离场景

**影响范围**: 所有 PR 合入质量门禁，所有 E2E 测试用例

**优先级判断**: 这是 P0 — 当前 CI gate 正在对生产环境造成实质性风险

### 验收标准（可测试）

```gherkin
Feature: E2E 测试环境隔离

  Scenario: E2E 测试使用隔离环境
    Given CI pipeline 执行 E2E job
    Then BASE_URL 不是 vibex.top（生产域名）
    And 使用 staging 或 mock 环境

  Scenario: E2E 测试之间数据隔离
    Given 每个 E2E spec 使用独立 fixture
    Then 测试 A 的数据不影响测试 B 的结果
    And 并发执行不会产生竞态

  Scenario: CI flaky 率可接受
    Given 连续 10 次 CI E2E 执行
    Then 成功率 >= 95%
    And 失败原因可从 E2E 报告中定位

  Scenario: E2E 报告可访问
    Given E2E job 执行完成
    Then HTML 报告在 CI artifact 中
    And 可以通过 Slack 机器人访问摘要
```

### 方案对比（产品决策）

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A（推荐） | 引入 staging 环境，CI 使用 staging BASE_URL | 最真实，可覆盖完整链路 | 成本较高，需维护 staging 部署 |
| B | 使用 Playwright mock API mode（不依赖外部服务） | 速度快，不污染任何环境 | 无法测试真实后端交互 |
| C | 在当前配置下接受风险（不推荐） | 无迁移成本 | 持续对生产造成风险 |

**PM 推荐**: 方案 A。原因：E2E 的价值在于端到端真实，覆盖 staging 成本合理。

### 依赖关系

```
P005-A 依赖
├── 条件1: staging 环境存在（infrastructure）
├── 条件2: staging 有数据隔离机制
└── 条件3: BASE_URL env var 支持注入
```

---

## 3. 产出：PM PRD

详见 `prd.md`

### 功能清单（PM 评审通过）

| 功能 ID | 标题 | 优先级 | 决策 |
|---------|------|--------|------|
| P005-R | E2E 测试环境隔离 | P0 | 进入 Sprint 21 |
| P003-R | Workbench 发版确认 | P1 | BLOCKED，等待 coord |

---

## 4. 检查单

- [x] analyst 报告已读，理解每个提案的验证结果
- [x] P001-P006 逐项给出 PM 决策
- [x] P005 重新定义问题范围（从 "集成化" 到 "环境隔离"）
- [x] P005 有可测试的验收标准（expect 断言）
- [x] P005 有方案对比（产品决策）
- [x] 产出 PRD 文档
- [ ] 等待 coord 确认 P003 发版计划

---

## 5. 执行决策

- **决策**: 提案清单大范围驳回（5/6），P005 重新定义范围
- **执行项目**: vibex-proposals-20260501-sprint21
- **执行日期**: 待 coord 确认后启动 Sprint 21 阶段一
- **Sprint 21 实际内容**: P005-R（E2E 环境隔离）+ P003-R 发版确认
