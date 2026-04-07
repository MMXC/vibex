# Requirements Analysis: VibeX 测试质量提升方案

**项目**: vibex-tester-proposals-vibex-proposals-20260408
**分析师**: Tester Agent
**日期**: 2026-04-08
**参考流程**: /ce:plan Research

---

## 1. 业务场景分析

### 1.1 背景

VibeX 是一个 DDD Canvas 生成平台，前端使用 Next.js + React + TypeScript，后端使用 Cloudflare Workers (Hono) + D1。前端项目位于 `vibex-fronted/`，使用 pnpm workspace 管理。

当前测试资产规模：
- **97 个测试文件**（TypeScript），测试代码行数约 13.3 万行，源文件约 11.2 万行
- **35+ E2E Playwright 测试**，分布在 `tests/e2e/`
- **6 个 Canvas Store 单元测试**（覆盖率 100%）
- **6 个 Canvas Hook 单元测试**（E1-E6）
- **1 个合约测试文件**（`sync.contract.spec.ts`）
- **突变测试配置**（Stryker，已配置但阻塞）

### 1.2 当前测试分层

```
┌──────────────────────────────────────────────────────┐
│  E2E Tests (Playwright) — 35+ tests                  │
│  • 用户完整流程: auth, project-flow, undo-redo       │
│  • 冲突解决、导航、AI 生成、视觉回归                 │
│  • 问题: @ci-blocking 全部跳过，CI 覆盖率归零         │
└──────────────────────────────────────────────────────┘
                        ↑
┌──────────────────────────────────────────────────────┐
│  Integration Tests (Jest/Vitest)                     │
│  • React 组件交互 (Testing Library)                   │
│  • Canvas stores (contextStore 110 tests)            │
│  • Canvas hooks (useCanvasRenderer 97.29%)            │
│  • API modules (7个 domain entity tests)              │
└──────────────────────────────────────────────────────┘
                        ↑
┌──────────────────────────────────────────────────────┐
│  Contract Tests (Playwright) — 1 file                │
│  • E4 SyncProtocol API (Zod schema validation)       │
│  • 问题: 仅 E4，其他端点无合约测试                     │
└──────────────────────────────────────────────────────┘
```

### 1.3 核心痛点识别

| 痛点 | 影响 | 紧迫性 |
|------|------|--------|
| E2E 测试全部 @ci-blocking 跳过 | CI 无 E2E 保障，PR 合入风险高 | P0 |
| 突变测试（Stryker）阻塞 | 无法验证测试有效性，测试套件质量未知 | P1 |
| 关键 Hook 无测试 | AI/自动保存逻辑无保障，重构风险高 | P1 |
| GitHub Actions E2E CI 缺失 | 全靠手动触发，无法在 PR 阶段发现问题 | P1 |
| 稳定性指标未记录 | 无法追踪 flaky 趋势，历史问题反复 | P2 |
| 合约测试覆盖率低 | API 变更无自动检测，前后端脱节风险 | P3 |

### 1.4 历史经验教训

从 `docs/learnings/` 沉淀的经验：

1. **Mock Store 真实性** (`canvas-testing-strategy`): 测试中的 mockStore 过于简化，导致测试通过但实际运行报错。防范措施：使用 `vi.mock()` 的 `mockReturnValue` 而非硬编码 mock 对象。
2. **E2E 跳过失控** (`vibex-e2e-test-fix`): `test.skip` 和 `@ci-blocking` 无人追踪，变成永久跳过。需要建立维护机制。
3. **Vitest/Jest 混用** (`canvas-testing-strategy`): Vitest 配置文件的 include/exclude 必须与 Jest 完全隔离。
4. **Route 顺序敏感** (`canvas-api-completion`): Hono route 匹配优先级必须测试覆盖。
5. **PRD vs 实现 scope drift** (`vibex-e2e-test-fix`): IMPLEMENTATION_PLAN 的 scope 必须严格对照 PRD，不得超出。

---

## 2. 技术方案选项

### 方案 A: 分阶段重构测试基础设施（推荐）

**核心理念**: 优先解决 P0/P1 问题，建立 CI 基础设施，再逐步补充测试覆盖。

**Phase 1: 恢复 E2E CI（P0，1天）**
- 修复 `@ci-blocking` 测试，优先恢复可稳定运行的测试
- 修复 Playwright `canvas-e2e` 项目路径问题
- 创建 `.github/workflows/e2e.yml`

**Phase 2: 补充关键 Hook 测试（P1，3天）**
- `useAIController` 单元测试（≥15 cases）
- `useAutoSave` 单元测试（≥15 cases，mock `navigator.sendBeacon`）
- 引入 MSW 统一 API mock 策略

**Phase 3: 完善测试有效性指标（P1，2天）**
- 解决 Stryker 在 pnpm workspace 阻塞问题
- 或接受替代指标：E2 contract tests (66) + store coverage (100%)

**Phase 4: 扩大合约测试覆盖（P2，2天）**
- 为 `/v1/canvas/flows` 添加 `flows.contract.spec.ts`
- 从 `sync.contract.spec.ts` 提取共享 mock handlers

**Phase 5: 稳定性监控（P2，1天）**
- 集成 `scripts/test-stability-report.sh` 到 CI
- 建立 daily-stability.md 自动更新机制

**预估总工时**: 9 人天

**优点**:
- 分阶段可交付，每阶段有可见成果
- 优先解决阻塞性问题（E2E CI）
- 风险可控，每阶段可回退

**缺点**:
- 总工期较长（9天）
- Phase 3 Stryker 问题可能无法完全解决

---

### 方案 B: 激进重构 — 全面迁移 Vitest + 独立 E2E CI

**核心理念**: 趁前端尚未完全稳定，一次性解决 Jest/Vitest 混用问题和 pnpm workspace 阻塞。

**E1: 迁移 Jest → Vitest（2天）**
- 将所有 `jest.fn()` → `vi.fn()`
- 统一测试配置到 `vitest.config.ts`
- 解决 pnpm workspace 阻塞 Stryker（迁移到 `vitest-runner`）
- 风险：大规模语法迁移，可能引入新问题

**E2: 创建 GitHub Actions E2E CI（1天）**
- 同方案 A Phase 1

**E3: 批量补充 Hook 测试（4天）**
- 一次性补充所有无测试 Hook
- 建立 Hook 测试模板

**E4: 合约测试全覆盖（2天）**
- 为所有 API 端点创建合约测试
- 统一 MSW mock 策略

**预估总工时**: 9 人天（但 E1 风险高）

**优点**:
- 一劳永逸解决 pnpm workspace + Jest 阻塞
- 测试框架统一，维护成本低
- Vitest 在 HMR 和性能上优于 Jest

**缺点**:
- E1 大规模迁移风险高
- 可能与当前开发节奏冲突（重构期间功能开发暂停）
- 回退成本高

---

### 方案 C: 保守渐进 — 最小化干预

**核心理念**: 不改变现有测试基础设施，仅补充最关键的测试和 CI 集成。

**E1: 补充 2 个关键 Hook 测试（P1，2天）**
- `useAIController` + `useAutoSave`
- 目标：覆盖率 ≥ 75%

**E2: 创建 GitHub Actions E2E CI（P1，1天）**
- 包含 Slack 通知

**E3: 修复 @ci-blocking 测试（P0，1天）**
- 修复 5 个冲突解决相关测试
- 恢复 30% E2E 测试到 CI

**E4: 稳定性监控（P2，0.5天）**
- 集成 `test-stability-report.sh`

**E5: 合约测试补充（P3，1天）**
- 为 flows API 添加合约测试

**预估总工时**: 5.5 人天

**优点**:
- 最小投入，最大影响
- 低风险，不破坏现有测试
- 快速见效（2天内可交付 Phase 1）

**缺点**:
- 不解决 Stryker/pnpm workspace 问题
- E2E 覆盖率提升有限（仅恢复 30%）
- 无 MSW 统一 mock 策略

---

## 3. 可行性评估

| 维度 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| 技术可行性 | ✅ 高 | ⚠️ 中（大规模迁移风险） | ✅ 高 |
| 资源需求 | 9人天 | 9人天 | 5.5人天 |
| 业务影响 | 逐步改善 | 高风险重构 | 快速见效 |
| 长期可维护性 | ✅ 高 | ✅ 最高 | ⚠️ 中 |
| 测试有效性保障 | 部分（Stryker 阻塞） | ✅ 完整（Stryker 可用） | ❌ 无（Stryker 仍阻塞） |
| 推荐程度 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

**推荐**: 采用方案 A（分阶段重构）为主，吸收方案 C 的快速见效策略。

---

## 4. 初步风险识别

### 高风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| Stryker pnpm workspace 阻塞无法解除 | 高（历史已发生） | 中（替代指标可接受） | 接受替代指标，或方案 B 迁移 Vitest |
| @ci-blocking 测试修复后仍不稳定 | 高（历史债务复杂） | 高（flaky 测试污染 CI） | 建立 flaky 治理机制（retries + 标记） |
| useAIController 依赖外部 AI API mock 困难 | 中 | 中 | 使用 MSW mock，优先测试状态机逻辑 |

### 中风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| GitHub Actions E2E 环境不稳定 | 中 | 中 | retries=3 + workers=1 |
| MSW 引入增加测试复杂度 | 低 | 中 | 先试点再推广 |
| 合约测试 mock 数据与实际 API 不一致 | 低 | 高 | 依赖 Zod schema 单一来源 |

### 低风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| daily-stability.md 报告格式不兼容 | 低 | 低 | 预定义格式，已有脚本 |

---

## 5. 验收标准（具体可测试）

### 5.1 E2E CI 恢复（P0）

```bash
# 验收标准 1: @ci-blocking 标记大幅减少
grep -r "@ci-blocking" tests/ --include="*.ts" | wc -l
# 当前: 35+ → 目标: ≤10

# 验收标准 2: GitHub Actions E2E workflow 存在且通过
test -f .github/workflows/e2e.yml
# push main 后 workflow 状态: success

# 验收标准 3: canvas-e2e 项目配置正确
npx playwright test --project=canvas-e2e --list
# 应列出 canvas E2E 测试，无报错

# 验收标准 4: E2E 测试 pass rate >= 95%
CI=true npx playwright test --reporter=dot
# 允许 flaky ≤ 1 / run
```

### 5.2 关键 Hook 测试（P1）

```bash
# 验收标准 5: useAIController 覆盖率 >= 80%
pnpm vitest run src/hooks/canvas/useAIController.test.ts \
  --coverage --coverageReporters=text-summary
# 输出中 branches >= 80%

# 验收标准 6: useAutoSave 覆盖率 >= 75%
pnpm vitest run src/hooks/canvas/useAutoSave.test.ts \
  --coverage --coverageReporters=text-summary
# 输出中 stmts >= 75%

# 验收标准 7: useAutoSave 测试中无硬编码 sendBeacon mock
grep -n "sendBeacon" tests/unit/hooks/canvas/useAutoSave.test.ts | wc -l
# 应使用 vi.stubGlobal('navigator', { sendBeacon: vi.fn() })
```

### 5.3 测试有效性（P1）

```bash
# 验收标准 8: 突变测试可运行（或替代指标达标）
# 方案 A1: Stryker 运行成功
docker run --rm -v $(pwd):/app node:20 bash -c \
  "cd /app && npm install @stryker-mutator/core @stryker-mutator/jest-runner && npx stryker run"
# 输出中 mutation score >= 60% (low threshold)
# 或：
# 方案 A2: 替代指标达标
grep -c "test\|Test" tests/contract/*.ts
# >= 20 contract tests
```

### 5.4 稳定性监控（P2）

```bash
# 验收标准 9: daily-stability.md 有数据记录
bash scripts/test-stability-report.sh
grep -c "20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]" docs/daily-stability.md
# >= 1 条记录

# 验收标准 10: waitForTimeout 清理
grep -rn "waitForTimeout" tests/e2e/*.spec.ts \
  | grep -v "flaky\|comment\|FIXME"
# 返回 0 条结果
```

### 5.5 合约测试（P3）

```bash
# 验收标准 11: flows API 合约测试存在
test -f tests/contract/flows.contract.spec.ts
# 文件包含 >= 5 个合约测试用例

# 验收标准 12: 测试命名规范检查通过
npx eslint tests/ --ext .ts,.tsx \
  --rule '@typescript-eslint/no-explicit-any: error'
# 0 errors
```

---

## 6. 实施建议

### 推荐实施顺序

```
Week 1:
  Day 1-2: 创建 E2E GitHub Actions CI（方案 A Phase 1）
  Day 3-4: 修复 @ci-blocking 测试，优先恢复 10+ 测试
  Day 5: 修复 Playwright canvas-e2e 项目路径

Week 2:
  Day 1-2: useAIController + useAutoSave 单元测试（方案 A Phase 2）
  Day 3: 引入 MSW 试点（选 1 个测试文件）
  Day 4-5: daily-stability.sh 集成 + waitForTimeout 清理

Week 3:
  Day 1-2: flows API 合约测试
  Day 3: Stryker 方案决策（接受替代 vs 迁移 Vitest）
  Day 4-5: 验收测试 + 文档更新
```

### 决策点

1. **Stryker vs 替代指标**: Week 3 评估，如果方案 A（CI Docker）仍失败，接受替代指标
2. **MSW 推广节奏**: 先在 1 个测试文件中试点，验证后再推广到全部
3. **@ci-blocking 清理**: 按"修复后 pass rate >= 95%"标准验收，不追求 100% 恢复

---

*本分析由 Tester Agent 生成于 2026-04-08*
*参考: canvas-testing-strategy, vibex-e2e-test-fix, test-quality-report learnings*
