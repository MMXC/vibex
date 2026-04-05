# Analysis: vibex-internal-tools

**Project:** vibex-internal-tools  
**Stage:** analyze-requirements  
**Author:** analyst  
**Date:** 2026-04-05  
**Status:** ✅ Complete

---

## 1. Reviewer Dedup — 任务去重机制

### Current State

项目已有 dedup 实现，位于 `/root/.openclaw/vibex/scripts/dedup/`，包含两个核心模块：

- **`dedup.py`** — 基于 Jaccard 相似度的关键词匹配算法（F1-F4）
  - 阈值：`0.7`（block）/ `0.4`（warn）
  - 关键词提取：支持中英文bigram
  - 主入口：`check_duplicate_projects(name, goal)`

- **`dedup_rules.py`** — 规则过滤器（F6.1）
  - 规则1：`exact_name_match` — 完全相同项目名
  - 规则2：`prefix_date_match` — 相同前缀 + 7天内创建
  - 规则3：`high_risk_term_match` — 高风险词命中 + 关键词重叠 >= 2
  - 主入口：`check_with_rules(name, goal)`

两套机制并存（相似度算法 + 规则引擎），但**均未被集成到实际工作流中**，属于孤立的工具脚本。

### Problem Statement

当前 dedup 工具存在以下问题：

1. **未集成到 reviewer agent** — reviewer 评审提案时不会自动触发 dedup 检查，可能导致重复项目被批准
2. **两套机制职责不清** — 相似度算法和规则引擎未统一，何时用哪个不明确
3. **无自动告警** — 检查结果不会推送到 Slack 或任务状态更新
4. **高风险词表过时** — `HIGH_RISK_TERMS` 固定硬编码，无法动态扩展

### Solution Options

**Option A: 集成 dedup 到 reviewer agent 工作流（轻量）**
- 在 reviewer agent 的评审流程中，调用 `check_with_rules()` 发起 dedup 检查
- 将 `has_match=True` 的结果注入到评审意见中
- 保留两套机制：规则引擎做快速过滤，相似度算法做兜底
- **工时估算:** 1-2h（修改 reviewer prompt + 调用脚本）

**Option B: 合并为单一 dedup 服务 + Webhook 集成（完整）**
- 将 dedup.py 和 dedup_rules.py 合并为统一 API：`/api/dedup/check`
- 在提案提交阶段（proposal validator）触发 Webhook 调用
- 实现动态高风险词表（从历史提案中学习）
- 将 dedup 结果写入任务 JSON 的 `dedup` 字段，reviewer 直接读取
- **工时估算:** 4-6h（API + Webhook + 词表动态化）

### Recommended Solution

**Option A** — 快速集成到 reviewer 工作流。

理由：
1. 现有代码质量良好，复用价值高
2. reviewer 是提案审批的关键节点，在此拦截最有效
3. Option B 涉及 API 设计和 Webhook 改造，工时是 Option A 的 3-4 倍

### Acceptance Criteria

- [ ] reviewer agent 评审时自动调用 dedup 脚本
- [ ] 高风险匹配（`severity=high`）时，评审意见包含 "⚠️ 潜在重复项目" 提示
- [ ] dedup 结果写入任务 JSON 的 `dedup` 字段
- [ ] 提案创建后自动触发 dedup，Slack 频道收到摘要通知

---

## 2. Tester Loop — 自动化测试迭代

### Current State

`/root/.openclaw/vibex/vibex-fronted/scripts/` 下有 3 个测试相关脚本：

| 脚本 | 功能 | 状态 |
|------|------|------|
| `flaky-detector.sh` | 对所有测试跑 N 次，统计 flaky test | **存在，但有 bug**（Python 分析部分逻辑断裂，无法正确生成 flaky-tests.json） |
| `test-stability-report.sh` | 运行 Playwright 并生成 Markdown 稳定性报告 | 独立脚本，未集成到 CI |
| `parse-playwright-report.py` | 解析 Playwright JSON 输出，提取 flaky count | 可用 |

**核心缺失：没有自动化 retry loop**。现有工具均为一次性诊断工具，不具备以下能力：
- 测试失败时自动重试（N 次）
- 失败后自动分类（flaky vs 真失败）
- 失败重试后仍失败才报告

### Problem Statement

1. **flaky-detector.sh 逻辑断裂** — Python 分析部分使用环境变量传参失败，最终只生成空的 flaky-tests.json
2. **无自动化 retry** — CI/CD pipeline 没有 "fail → retry → retry again → then fail" 的标准流程
3. **失败原因不透明** — 测试失败后没有清晰的诊断信息（是 flaky、网络、环境还是代码问题）
4. **未集成到 CI** — flaky-detector 和 stability-report 都是手动触发的独立脚本

### Solution Options

**Option A: 修复 flaky-detector + 标准化 CI retry 策略（轻量）**
- 修复 flaky-detector.sh 的 Python 分析逻辑（改用文件传递参数而非环境变量）
- 在 CI pipeline 中增加 Playwright 内置 retry：`retries: 2`
- 为 `test:e2e:ci` 增加 "fail → retry once → report" 的双轮策略
- **工时估算:** 2-3h（修复脚本 + CI 配置）

**Option B: 构建 tester loop 服务（完整）**
- 编写 Python tester_loop.py：
  - 接收测试结果 JSON
  - 对失败测试执行 N 次 retry
  - 区分 flaky（pass on retry）/真失败（consistent fail）
  - 生成结构化诊断报告（包含日志片段、环境信息）
- 将 flaky-detector 的逻辑整合进来，统一入口
- 集成到 CI pipeline：test → parse → tester_loop(retry) → report
- **工时估算:** 5-7h（Python 服务 + CI 集成 + 报告增强）

**Option C: 纯 Playwright 配置方案（最简）**
- 充分利用 Playwright 内置能力：`retries: 2` + `workers: 4` + `timeout: 30s`
- 在 playwright.config.ts 中配置自动 retry
- 依赖 Playwright 自身的 flaky 检测（`config.reporter` 的 JSON 模式）
- **工时估算:** 0.5h（仅配置变更）

### Recommended Solution

**Option A** — 修复现有脚本 + CI retry 标准化。

理由：
1. flaky-detector.sh 已经有正确的 N 次执行逻辑，bug 在后处理阶段，修补成本低
2. Playwright 内置 retry 适合作为第一道防线，tester_loop 作为诊断层
3. Option C 虽然成本最低，但不足以解决"诊断透明度"问题

### Acceptance Criteria

- [ ] flaky-detector.sh 正确生成 flaky-tests.json（修复 Python 分析逻辑）
- [ ] Playwright CI 配置启用 `retries: 2`
- [ ] tester_loop（修复后版本）被 `test:e2e:ci` 调用
- [ ] 失败测试自动 retry，结果写入 test-results/retry-report.json
- [ ] 真失败（非 flaky）触发 Slack 告警

---

## 3. Test Command Unification — npm 脚本整合

### Current State

`vibex-fronted/package.json` 中的 scripts 共 27 条，按功能分布如下：

**Test 相关（14 条，严重碎片化）：**
```
test           → vitest run          # 与 test:unit 完全重复
test:unit      → vitest run          # 别名
vitest         → vitest run          # 别名
test:unit:watch → vitest             # 唯一 watch 脚本
test:unit:coverage → vitest --coverage
test:e2e       → playwright          # 标准 E2E
test:e2e:ci    → playwright install + test  # 混合了两个职责
test:e2e:local → BASE_URL=localhost playwright
test:a11y      → playwright a11y config   # 独立配置
test:contract  → vitest unit (非 contract)
test:json      → vitest --reporter=json    # 仅 CI 用
test:all       → test:unit + test:e2e
test:ci        → test:unit + test:e2e:ci   # 别名
test:notify    → node test-notify.js       # 通知脚本，非测试
pretest        → node pre-test-check.js    # 别名
pretest-check  → node pre-test-check.js    # 完全重复
```

**Coverage 相关（3 条）：**
```
coverage:check    → node check-coverage.js
coverage:diff     → node coverage-diff.js
coverage:history  → bash save-coverage-history.sh
test:unit:coverage → vitest --coverage  # 与 coverage:check 功能部分重叠
```

**Lint 相关（2 条）：**
```
lint       → eslint + prettier (排除了 tests/**)
lint:css   → stylelint
```

**其他（8 条）：**
```
dev, build, start, storybook, build-storybook,
prepare (husky), scan:vuln, report:vuln, scan:css,
generate:types, pre-commit-check
```

### Problem Statement

1. **重复别名** — `test` / `test:unit` / `vitest` 三条完全等价，`pretest` / `pretest-check` 完全等价
2. **命名歧义** — `test:contract` 实际跑 unit test，`test:e2e:ci` 混合了 install + test 两个职责
3. **职责边界不清** — `test:notify` 不是测试但混在 test 组
4. **pretest 污染** — `pretest` 在 test 前自动执行，但其职责（pre-test-check）与测试本身无关
5. **coverage 分散** — `test:unit:coverage` 和 `coverage:check` 功能部分重叠，入口不统一

### Solution Options

**Option A: 清理重复 + 语义化重命名（轻量）**
- 删除重复别名：`test` → 指向 `test:unit`，保留 `test:unit`；删除 `vitest`、`pretest-check`
- 重命名语义错误：`test:contract` → `test:unit:verbose`；`test:e2e:ci` → `install-deps && test:e2e`（拆分为 prep + run 两步）
- 将 `test:notify` 移入 `scripts/test/` 目录，移除 npm scripts 层级
- **工时估算:** 1-2h（清理 + 重命名 + 文档）

**Option B: 重新设计 scripts 架构（完整）**
- 按职责分组：移除扁平命名，采用层级前缀：`ci:test`, `ci:lint`, `dev:dev`, `dev:storybook`
- 将 pretest 钩子逻辑移入 husky pre-commit（显式调用而非隐式）
- 创建统一的入口脚本 `scripts/run.js` 作为所有复杂逻辑的代理
- 统一 coverage 入口：删除 `test:unit:coverage`，保留 `coverage:check`
- **工时估算:** 4-6h（架构重构 + 迁移 + CI 适配）

**Option C: 最小干预 + 文档化（最保守）**
- 不修改任何 scripts，只在 `CONTRIBUTING.md` 中说明各脚本的用途和关系图
- 提供 `scripts/audit-scripts.js` 工具脚本，用于输出脚本关系地图
- **工时估算:** 0.5h（仅文档）

### Recommended Solution

**Option A** — 清理重复 + 语义化重命名。

理由：
1. 当前碎片化程度高但改动风险可控，删除别名不会破坏任何依赖方
2. 命名语义化有助于新开发者理解脚本职责
3. Option B 改造成本高，涉及 CI/CD pipeline 适配，风险较大

### Acceptance Criteria

- [ ] `test`/`test:unit`/`vitest` 三合一，保留 `test:unit`
- [ ] `pretest`/`pretest-check` 合一，保留 `pretest`
- [ ] `test:contract` 重命名为 `test:unit:verbose`
- [ ] `test:e2e:ci` 拆分为 `install:playwright` + `test:e2e`（两步链式）
- [ ] `test:notify` 移入 `scripts/test/` 目录，从 npm scripts 移除
- [ ] coverage 统一入口：`coverage:check`，`test:unit:coverage` 标记为 deprecated alias
- [ ] 更新 `CONTRIBUTING.md` 中的 scripts 文档，附上关系图

---

## Summary

| Topic | Recommended | Complexity | Est. Hours |
|-------|-------------|------------|------------|
| Reviewer Dedup | Option A — 集成到 reviewer 工作流 | Low | 1-2h |
| Tester Loop | Option A — 修复 flaky-detector + CI retry | Medium | 2-3h |
| Test Commands | Option A — 清理重复 + 语义化重命名 | Low | 1-2h |
| **Total** | | | **4-7h** |
