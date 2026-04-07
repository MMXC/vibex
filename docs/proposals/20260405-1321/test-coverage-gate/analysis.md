# Analysis: CI Coverage Gate Enforcement

**项目**: test-coverage-gate  
**作者**: Analyst  
**日期**: 2026-04-05  
**状态**: ✅ 完成

---

## 1. Problem Statement

CI 不强制执行覆盖率阈值。虽然存在覆盖率检查脚本和 GitHub Actions 工作流，但存在以下根本性问题：

1. **测试框架配置错位**: Vitest 是实际测试运行器，但 `jest.config.ts` 中配置了 `coverageThreshold`（Vitest 不读取该文件）
2. **CI 门控失效**: `coverage-check.yml` 仅在 push 到 main/develop 时触发，PR 来自 fork 时不运行
3. **阈值设定脱离实际**: 85% 阈值远高于当前覆盖率（79.06%），导致阈值形同虚设
4. **基线数据缺失**: `coverage/baseline.json` 不存在，`coverage-diff.js` 无法进行退化检测

**影响**: 代码覆盖率持续在低位徘徊（历史波动范围 53.8%-79.06%），无自动机制阻止覆盖率下降的代码合并。

---

## 2. Current State

### 2.1 测试基础设施

| 组件 | 现状 | 说明 |
|------|------|------|
| 测试运行器 | **Vitest** (实际) | `package.json` scripts: `vitest run` |
| Jest | 存在但**未使用** | `jest.config.ts` 配置了 coverageThreshold，但 Vitest 不读取 |
| 覆盖率工具 | `@vitest/coverage-v8` | Vitest 内置集成 |
| 配置文件 | **缺失** | 无 `vitest.config.ts`，Vitest 使用默认行为 |
| 测试文件数量 | 364 个 | `.test.ts` / `.test.tsx` 文件 |

### 2.2 当前覆盖率数据

| 指标 | 当前值 | CI 阈值 | 差距 |
|------|--------|---------|------|
| Lines | 79.06% | 85% | -5.94% ❌ |
| Branches | 62.11% | 85% | -22.89% ❌ |
| Functions | 67.62% | 85% | -17.38% ❌ |
| Statements | 75.13% | 85% | -9.87% ❌ |

**来源**: `coverage/coverage-summary.json` (最近一次运行)

### 2.3 覆盖率历史趋势

```
日期         Lines    Branches  Functions
2026-03-05   62.61%   51.10%    53.59%
2026-03-05   62.61%   51.10%    53.59%
2026-03-05   62.74%   51.57%    53.72%
2026-03-08   62.43%   52.02%    53.86%
2026-03-11   65.32%   59.05%    58.85%
2026-03-12   68.26%   59.32%    62.07%
2026-03-12   72.91%   58.82%    75.00%
2026-03-15   53.80%   35.51%    40.47%  ← 重大退化
2026-03-17   64.63%   53.83%    63.92%
(当前)       79.06%   62.11%    67.62%
```

**观察**: 
- 2026-03-15 出现剧烈退化（Lines 从 72.91% 跌至 53.80%），但无自动阻断
- 覆盖率波动剧烈，无稳定上升趋势
- 当前值为历史最高，但仍低于 85% 阈值 5.94 个百分点

### 2.4 CI 工作流现状

**文件**: `.github/workflows/coverage-check.yml`

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:          # ← PR 仅在同仓库触发，fork PR 不触发
    branches: [main, develop]
```

**工作流步骤**:
1. `npm test -- --coverage` — 运行测试生成覆盖率报告
2. `node scripts/coverage-diff.js --fetch` — 对比基线，blockThreshold=5%
3. `node scripts/check-coverage.js` — 85% 阈值门控（`process.exit(1)` 阻断）

**问题**:
- Fork PR 不触发此工作流（`pull_request` 事件在 fork 上默认禁用所有步骤）
- 即便触发，当前覆盖率 79.06% < 85%，CI 会失败
- 基线文件不存在，`coverage-diff.js` 首次运行无法比较

### 2.5 现有脚本分析

**check-coverage.js** (THRESHOLD=85%):
- ✅ 以 `process.exit(1)` 阻断低于 85% 的合并
- ✅ 保存历史记录到 `coverage-history/coverage-history.jsonl`
- ❌ 阈值 85% 远超当前覆盖率，CI 必然持续失败

**coverage-diff.js** (blockThreshold=5%):
- ✅ 对比基线，退化 >5% 时 `process.exit(1)` 阻断
- ❌ 基线文件不存在，首次运行无基线可对比
- ✅ 支持 `--fetch` 从 main 分支拉取基线

**jest.config.ts coverageThreshold**:
- ⚠️ 配置了 85% 全局阈值
- ❌ **Vitest 不读取 Jest 配置**，此配置完全不生效

---

## 3. Solution Options

### Option A: Vitest Native Threshold (推荐)

**方案**: 创建 `vitest.config.ts`，配置 Vitest 原生覆盖率阈值。

**核心工作**:
1. 创建 `vitest.config.ts`，配置 `@vitest/coverage-v8` provider 和阈值
2. 设置渐进式阈值：初始 75% (当前实际水平)，逐步提升
3. 保留 CI 脚本作为第二层门控（双保险）
4. 建立基线：`node scripts/coverage-diff.js --update-baseline`
5. 修复 CI 门控：对 fork PR 使用独立 job

**Work Estimate**:
- 配置 vitest.config.ts: 1h
- CI 双门控整合: 1h
- 基线建立 + 测试: 1h
- **Total: 3h**

**优点**:
- Vitest 原生支持，开发时立即反馈（`vitest run` 直接阻断低覆盖率）
- 开发者体验最佳，无需等待 CI
- 与 CI 脚本形成双保险
- Vitest 文档完善，配置简单

**缺点**:
- 需要迁移现有的 Jest 配置语义到 Vitest
- 渐进式阈值需要人工维护提升节奏

---

### Option B: CI Script Only (保留现有脚本)

**方案**: 不创建 vitest.config.ts，依赖 CI 脚本强制执行。

**核心工作**:
1. 建立基线：`--update-baseline`
2. 将 `coverage-check.yml` 改为所有 PR 触发（包括 fork）
3. 临时降低阈值到 80%，逐步提升

**Work Estimate**:
- CI fork 支持修复: 2h
- 基线建立 + 阈值调整: 1h
- **Total: 3h**

**优点**:
- 无需新增配置文件
- 现有脚本已完整可用

**缺点**:
- 开发者本地无法感知覆盖率问题，只能等 CI 反馈
- 反馈循环慢，影响开发效率
- fork PR 仍可能绕过检查（取决于 CI 配置）
- 当前 79% 覆盖率低于任何合理阈值，调整阈值治标不治本

---

### Option C: Codecov 集成

**方案**: 使用 Codecov 等第三方覆盖率服务。

**核心工作**:
1. 注册 Codecov 账号，获取 token
2. 修改 CI 流程，添加 `codecov` 上传步骤
3. 在 Codecov dashboard 配置覆盖率阈值和 PR 评论
4. 设置 PR status check

**Work Estimate**:
- Codecov 注册 + CI 配置: 1h
- Token 安全管理 (GitHub Secrets): 1h
- Dashboard 配置: 1h
- **Total: 3h**

**优点**:
- 无需维护覆盖率基础设施
- 支持 PR 评论、趋势图、退化告警
- 全球最流行的开源项目覆盖率服务
- 免费版支持私有仓库

**缺点**:
- 引入外部依赖，服务不可用时 CI 失去门控
- 需要额外的 token 管理
- 功能与现有脚本重叠

---

## 4. Recommended Solution

### **推荐: Option A (Vitest Native Threshold)**

**理由**:
1. **开发者体验最优**: Vitest 在本地直接阻断低覆盖率，无需等待 CI
2. **最小阻力**: 不引入外部服务依赖
3. **渐进式阈值**: 避免一次性要求 85% 导致 CI 永久失败
4. **双重门控**: Vitest 本地 + CI 脚本，双保险更安全

**渐进式阈值策略**:
```
Phase 1 (立即): Lines 75%, Branches 60%, Functions 65%, Statements 73%
Phase 2 (2周后): Lines 78%, Branches 63%, Functions 68%, Statements 76%
Phase 3 (4周后): Lines 80%, Branches 66%, Functions 70%, Statements 78%
Phase 4 (目标):  Lines 85%, Branches 70%, Functions 75%, Statements 85%
```

**注**: Branch 覆盖率目标降低（70% vs 85%）是因为分支覆盖天然难以达到行覆盖率水平。Canvas 组件等复杂 UI 模块应维持单独的低阈值配置。

---

## 5. Acceptance Criteria

### 5.1 功能性验收

| # | 标准 | 验证方法 |
|---|------|----------|
| AC1 | PR 覆盖率下降 >5% 自动被 GitHub 阻断合并 | 创建覆盖率故意降低 6%+ 的 PR，验证 GitHub 保护规则生效 |
| AC2 | 本地 `vitest run` 在覆盖率低于阈值时 exit code != 0 | 手动降低阈值，运行 `npm test`，验证退出码 |
| AC3 | Fork PR 也能触发覆盖率门控 | 从 fork 创建 PR，验证 CI coverage-check job 运行 |
| AC4 | 覆盖率报告自动上传并可查看 | PR 评论或 CI artifact 包含覆盖率详情链接 |
| AC5 | 基线文件存在且在 main 分支 | `git show main:coverage/baseline.json` 返回有效 JSON |

### 5.2 非功能性验收

| # | 标准 | 验证方法 |
|---|------|----------|
| NF1 | CI 覆盖率检查在 5 分钟内完成 | 记录 CI 运行时间 |
| NF2 | 阈值调整有 changelog 记录 | 查看项目 changelog |
| NF3 | 覆盖率低于阈值的 PR 有明确的失败信息 | 查看 CI 日志中的 check-coverage.js 输出 |

---

## 6. Risk Assessment

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|----------|
| **渐进式阈值停滞** | 🔴 高 | 团队忽略阈值提升，永久停留在低覆盖率 | 季度审查 + 自动化提醒 |
| **Branch 覆盖率误报** | 🟡 中 | Canvas 等复杂组件分支覆盖率低，正常代码被判为不合格 | 对复杂模块设置单独的低阈值 |
| **CI 覆盖率慢** | 🟡 中 | 覆盖率报告拖慢 CI 速度 (>5min) | 使用 V8 provider + 缓存 |
| **Fork PR 无法访问 Secrets** | 🟡 中 | fork PR 无法使用 Codecov token | 使用 Codecov 的开源计划（无需 token）或改用 check-coverage.js |
| **基线被人为篡改** | 🟢 低 | 有人提交前更新基线绕过门控 | 基线更新需要独立 PR + reviewer 审批 |
| **Vitest/Vitest Coverage V8 版本冲突** | 🟢 低 | 依赖版本问题 | 锁定 `@vitest/coverage-v8` 版本 |

---

## 7. Implementation Plan

### Phase 1: 基础配置 (3h)
- [ ] 创建 `vitest.config.ts`，配置 `@vitest/coverage-v8` 和初始阈值 (75%)
- [ ] 将 `jest.config.ts` 的模块级阈值迁移到 `vitest.config.ts`
- [ ] 初始化基线: `node scripts/coverage-diff.js --update-baseline`
- [ ] 验证本地 `npm test` 在覆盖率低于阈值时失败

### Phase 2: CI 门控强化 (2h)
- [ ] 修改 `coverage-check.yml`，对 fork PR 也触发覆盖率达到证
- [ ] 将 `npm run coverage:check` 集成到 `pre-submit.yml` (在 lint 之后运行)
- [ ] 配置 GitHub branch protection: 强制 coverage check 通过才能合并
- [ ] 验证 fork PR 创建后 CI coverage job 运行

### Phase 3: 可观测性 (1h)
- [ ] 配置 Codecov PR 评论（或保留现有 check-coverage.js 输出）
- [ ] 设置覆盖率历史趋势图（现有 `coverage-history/coverage-history.jsonl` 基础上）
- [ ] 添加 Slack 通知: 覆盖率退化 >2% 时告警

**Total Estimate: 6h**

---

## 8. Reference: Existing Learnings

### vibex-e2e-test-fix (2026-04-05)
该项目修复了 E2E 测试稳定性问题。关键教训：
- **测试框架边界必须清晰**: Jest/Vitest 混用导致问题，本项目存在相同问题（Jest config 存在但 Vitest 运行）
- **Scope drift 必须控制**: Architect 在 IMPLEMENTATION_PLAN 中引入了 PRD 之外的 Epic，导致任务链断裂
- **虚假完成必须检测**: 项目 status=completed 但子任务全部 pending

**本项目应用**: 确保 Vitest 配置为唯一测试框架，删除或标记 `jest.config.ts` 为废弃状态。

---

## Appendix: Key Files Reference

| 文件 | 路径 | 状态 |
|------|------|------|
| Vitest 配置 | `/vibex-fronted/vitest.config.ts` | ❌ 不存在，需创建 |
| Jest 配置 | `/vibex-fronted/jest.config.ts` | ⚠️ 存在但未使用，标记废弃 |
| 覆盖率配置 | `/vibex-fronted/coverage.config.js` | ✅ 已存在 |
| 检查脚本 | `/vibex-fronted/scripts/check-coverage.js` | ✅ 已存在，阈值需调整 |
| 差分脚本 | `/vibex-fronted/scripts/coverage-diff.js` | ✅ 已存在，基线需建立 |
| CI 工作流 | `/vibex-fronted/.github/workflows/coverage-check.yml` | ✅ 已存在，需修复 fork PR 支持 |
| 基线文件 | `/vibex-fronted/coverage/baseline.json` | ❌ 不存在，需创建 |
| 覆盖率报告 | `/vibex-fronted/coverage/coverage-summary.json` | ✅ 存在 |
| 历史记录 | `/vibex-fronted/coverage-history/coverage-history.jsonl` | ✅ 存在 |
