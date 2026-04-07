# Requirements Analysis: VibeX 测试基础设施深化方案

**项目**: vibex-tester-proposals-vibex-proposals-20260410
**分析师**: Tester Agent
**日期**: 2026-04-10
**类型**: 测试质量深化分析（对比 2026-04-08 快照）

---

## 1. 业务场景分析

### 1.1 背景与当前状态

VibeX 是 DDD Canvas 生成平台，前端 Next.js + React + TypeScript，后端 Cloudflare Workers (Hono) + D1。前端项目位于 `vibex-fronted/`，使用 pnpm workspace。

**2026-04-08 → 2026-04-10 期间的重要进展**：
- ✅ GitHub Actions E2E CI 创建完成（`.github/workflows/test.yml`）
- ✅ Vitest Jest 兼容层创建（`tests/unit/setup.tsx`）
- ✅ 多个 Canvas Hook 获得测试（useCanvasRenderer、useDndSortable、useDragSelection、useCanvasSearch、useVersionHistory、useCanvasEvents、useCanvasState）
- ✅ `@ci-blocking` 标记从根配置移除（grepInvert 消失）
- ⚠️ `stability.spec.ts` 路径错误导致稳定性检查失效
- ⚠️ Playwright 双重配置冲突
- ⚠️ 关键 Hook 测试被 exclude

**测试资产规模（2026-04-10）**：
- 58 个 E2E spec 文件
- 7 个 Canvas Hook 测试（__tests__/ 下 6 个 + 根目录 useAIController.test.tsx）
- 1 个 Contract 测试文件（sync.contract.spec.ts，318 行）
- Stryker 配置存在但阻塞
- GitHub Actions E2E CI ✅

### 1.2 核心痛点（2026-04-10 版）

| 痛点 | 根因 | 影响 | 紧迫度 |
|------|------|------|--------|
| `stability.spec.ts` 路径错误，稳定性检查形同虚设 | 检查 `./e2e/` 而非 `./tests/e2e/` | 无法发现 `waitForTimeout` 违规 | P0 |
| Playwright 双重配置，CI 实际 expect timeout=10s 而非 30s | 根配置与 tests/e2e/ 配置冲突 | 断言超时阈值不符合 F1.3 标准 | P0 |
| 35+ E2E 测试因 grepInvert 在 CI 中跳过 | tests/e2e/playwright.config.ts 仍有 grepInvert | CI 核心用户流程保障缺失 | P0 |
| useAIController/useAutoSave 测试被 exclude | Jest 语法不兼容 Vitest / 原因未明 | 高风险 AI 和自动保存逻辑无 CI 保障 | P1 |
| waitForTimeout 仍有 20+ 处残留 | 历史遗留，未彻底清理 | 测试不稳定，CI 环境更易超时 | P2 |
| canvas-e2e project testDir 指向不存在目录 | 配置错误 | Canvas 独立测试计划无法执行 | P2 |
| Stryker mutation testing 阻塞 | pnpm workspace shaken node_modules | 无法验证测试有效性 | P2 |
| Contract 测试仅 1 个文件 | 优先级低，历史欠账 | flows API 变更无自动检测 | P3 |

### 1.3 关键发现：从 2026-04-08 到 2026-04-10

**已改善**：
- E2E CI 从无到有（test.yml）
- Vitest 兼容层建立
- Hook 测试覆盖率扩大
- @ci-blocking 在根配置消失

**新发现/恶化**：
- `stability.spec.ts` 的检查路径错误是**结构性缺陷**，之前被掩盖
- Playwright 双重配置问题之前未被识别为根因级别的冲突
- `useAutoSave.test.ts` 被 exclude 的根因仍未定位

### 1.4 历史经验教训（来自 docs/learnings/）

1. **E2E 跳过失控** (`vibex-e2e-test-fix`): `@ci-blocking` 无人追踪，变成永久跳过 → 本次需建立维护机制
2. **Vitest/Jest 混用** (`canvas-testing-strategy`): Vitest 配置文件的 include/exclude 必须与 Jest 完全隔离 → 当前双重配置是同类问题
3. **配置形同虚设** (本轮新发现): 测试检查不存在路径永远 PASS，掩盖实际问题 → 需添加存在性验证
4. **Mock Store 真实性** (`canvas-testing-strategy`): mock 对象过于简化 → useAIController/useAutoSave 修复时注意

---

## 2. 技术方案选项

### 方案 A: 统一 Playwright 配置 + 修复稳定性检查（推荐）

**核心理念**: 消除配置混乱，建立单一配置源，修复检查路径。

**S1: 统一 Playwright 配置（P0，0.5天）**
- 迁移 `tests/e2e/playwright.config.ts` 的 `webServer`、`grepInvert: undefined` 到根配置
- 删除 `tests/e2e/playwright.config.ts`
- 修改 CI workflow 使用根配置
- 验证 expect timeout = 30000ms 在 CI 中生效

**S2: 修复 stability.spec.ts 路径（P0，0.5天）**
- 修改检查路径从 `./e2e/` 到 `./tests/e2e/`
- 添加目录存在性断言，目录不存在时测试 FAIL
- 修正 F1.2 的 canvas-e2e 测试路径

**S3: 清理 waitForTimeout（P1，1天）**
- 替换 20+ 处 waitForTimeout 为确定性等待（见 T-P1-3）
- 添加 ESLint 规则检测新增的 waitForTimeout
- 验证 stability F1.1 在正确路径上通过

**S4: 激活被 exclude 的 Hook 测试（P1，1天）**
- 运行 `useAutoSave.test.ts` 手动查看失败原因
- 修复 `navigator.sendBeacon` / `localStorage` mock 问题
- 升级 `useAIController.test.tsx` 从 `jest.*` 到 `vi.*`
- 从 vitest.config.ts 移除 exclude 规则

**S5: 修复 canvas-e2e project（P2，0.5天）**
- 修改 testDir 从 `./e2e` 到 `./tests/e2e`
- 验证 `playwright test --project=canvas-e2e` 找到测试

**S6: 扩展 Contract 测试（P3，1天）**
- 添加 `flows.contract.spec.ts`
- 参考 `sync.contract.spec.ts` 模式（Zod schema validation + Playwright）

**S7: Stryker 方案决策（P2，0.5天）**
- 评估方案 A（Docker CI）、B（接受替代指标）、C（Vitest runner）
- 做出明确决策并记录

**预估总工时**: 5 人天

**优点**:
- 消除配置冲突，减少维护负担
- 修复检查路径后，稳定性监控真正生效
- 对现有测试资产破坏性最小

**缺点**:
- 不解决 daily-stability.md 缺失（需单独 Epic）
- 不引入 MSW

---

### 方案 B: 重构测试配置 + 引入 MSW（激进）

**核心理念**: 以引入 MSW 为契机，重构整个测试配置体系，同时建立 daily-stability.md。

**Phase 1（P0-P1）**: 与方案 A 相同（统一配置 + 修复路径）

**Phase 2（P1-P2）**: 引入 MSW（3天）
- 安装 `@mswjs/msw` + `@mswjs/interceptors`
- 从 `sync.contract.spec.ts` 提取共享 mock handlers 到 `tests/fixtures/msw/`
- 替换 3 个测试文件中的 `page.route()` 为 MSW
- 添加 MSW lint 规则

**Phase 3（P2）**: 建立 daily-stability.md（1天）
- 创建 `docs/daily-stability.md`
- 在 CI workflow 中集成 `scripts/test-stability-report.sh`
- 设置 pass rate < 90% 告警

**Phase 4（P3）**: 扩展 Contract 测试 + Stryker 决策

**预估总工时**: 9 人天

**优点**:
- 统一 mock 策略，测试更可靠
- daily-stability.md 建立，稳定性可追踪
- 为未来 Contract 测试扩展打好基础

**缺点**:
- 工作量是方案 A 的近 2 倍
- MSW 引入有迁移成本和风险
- 时间窗口内可能无法完成所有 P0 修复

---

### 方案 C: 最小可行修复（保守）

**核心理念**: 只修复 P0 阻断性问题，不追求完整性。

**S1**: 统一 Playwright 配置（0.5天）
**S2**: 修复 stability.spec.ts 路径（0.5天）
**S3**: 移除 grepInvert（0.1天）
**S4**: 修复 canvas-e2e testDir（0.1天）

**预估总工时**: 1.2 人天

**优点**:
- 快速止血
- 最小破坏性

**缺点**:
- waitForTimeout、Hook 测试、daily-stability 问题全部搁置
- 6 个月后会面临同样问题

---

## 3. 初步风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 修复 stability.spec.ts 路径后，F1.1 可能暴露大量 waitForTimeout 违规 | 高 | 中 | 提前运行扫描，估算修复工作量 |
| 删除 tests/e2e/playwright.config.ts 可能破坏本地开发体验 | 中 | 高 | 在删除前在本地验证根配置完整性 |
| useAutoSave.test.ts exclude 根因复杂，修复可能超预期 | 中 | 中 | 先运行测试看具体错误，再评估 |
| 移除 grepInvert 后 CI 失败率上升 | 高 | 高 | 设置 pass rate 目标 90%，允许分批恢复 |
| MSW 引入破坏现有 page.route() 测试 | 中 | 中 | 方案 B Phase 2 先做试点验证 |

---

## 4. 验收标准（具体可测试）

### 4.1 配置统一

```bash
# AC1: tests/e2e/playwright.config.ts 不存在
test -f vibex-fronted/tests/e2e/playwright.config.ts && echo "FAIL" || echo "PASS"

# AC2: CI 使用根配置，expect timeout = 30000
grep -A1 "expect:" vibex-fronted/playwright.config.ts
# 输出应包含: timeout: 30000

# AC3: CI workflow 不使用 tests/e2e/playwright.config.ts
grep "tests/e2e/playwright.config.ts" .github/workflows/test.yml && echo "FAIL" || echo "PASS"
```

### 4.2 稳定性检查修复

```bash
# AC4: stability.spec.ts 检查正确路径
grep "E2E_DIR" vibex-fronted/tests/e2e/stability.spec.ts
# 应指向 ./tests/e2e/ 而非 ./e2e/

# AC5: canvas-e2e testDir 存在
grep "canvas-e2e" vibex-fronted/playwright.config.ts | grep "testDir"
# 应指向 ./tests/e2e 而非 ./e2e

# AC6: stability.spec.ts 运行不报错（路径正确）
cd vibex-fronted && npx playwright test stability.spec.ts --project=chromium
# 应能正常运行（非 "0 tests found"）
```

### 4.3 E2E 测试恢复

```bash
# AC7: grepInvert 不存在于任何活跃配置
grep "grepInvert" vibex-fronted/playwright.config.ts && echo "FAIL" || echo "PASS"

# AC8: waitForTimeout 清理
grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ \
  --include="*.spec.ts" | grep -v "flaky\|comment\|FIXME"
# 应返回 0 行

# AC9: CI E2E 测试数量 >= 40（不跳过 @ci-blocking 后）
CI=true npx playwright test --list 2>/dev/null | grep "·" | wc -l
# >= 40
```

### 4.4 Hook 测试激活

```bash
# AC10: useAutoSave.test.ts 不被 exclude
grep "useAutoSave" vibex-fronted/tests/unit/vitest.config.ts
# 应无 exclude 匹配

# AC11: useAutoSave 测试通过
cd vibex-fronted && npx vitest run src/hooks/canvas/__tests__/useAutoSave.test.ts --reporter=verbose
# 0 failures

# AC12: useAIController 测试通过
cd vibex-fronted && npx vitest run src/hooks/canvas/useAIController.test.tsx --reporter=verbose
# 0 failures
```

### 4.5 Canvas E2E Project

```bash
# AC13: canvas-e2e 项目能找到测试
npx playwright test --project=canvas-e2e --list 2>/dev/null | grep "·" | wc -l
# >= 1
```

---

## 5. 推荐实施计划

### 推荐方案: A（统一配置 + 修复稳定性检查）

**Week 1（5 人天）**：

| Day | 任务 | 产出 |
|-----|------|------|
| Day 1 AM | 统一 Playwright 配置（合并两个配置文件，删除重复） | `vibex-fronted/playwright.config.ts`（唯一配置）|
| Day 1 PM | 修复 stability.spec.ts 路径 + 目录存在性检查 | 修复后的 `stability.spec.ts` |
| Day 2 | 清理 waitForTimeout（conflict-resolution、conflict-dialog、auto-save） | 20+ 替换完成 |
| Day 3 | 修复 useAutoSave.test.ts（调查 exclude 原因 + 修复） | 测试激活并通过 |
| Day 4 | 修复 useAIController.test.tsx（jest → vi 迁移） | 测试激活并通过 |
| Day 5 | 修复 canvas-e2e testDir + CI 端到端验证 | CI E2E 通过率 >= 90% |

**Week 2（2 人天）**：

| Day | 任务 | 产出 |
|-----|------|------|
| Day 1-2 | flows.contract.spec.ts 添加 + Stryker 决策 | 新合约测试 + 决策记录 |

---

## 6. 决策点

1. **daily-stability.md**: 方案 A 不包含，是否作为单独 Epic？
2. **MSW 引入**: 是否在 Week 2 评估后推进？
3. **Stryker**: 接受替代指标（E2 contract + store coverage）还是继续投入 Docker 方案？
4. **@ci-blocking 清理节奏**: 是本次全部移除（Week 1 Day 1）还是分批评估？

---

## 附录：关键文件路径索引

| 文件 | 当前状态 | 需修改 |
|------|---------|--------|
| `vibex-fronted/playwright.config.ts` | 根配置（expect=30000，无 grepInvert）| 接收 tests/e2e/ 的 webServer |
| `vibex-fronted/tests/e2e/playwright.config.ts` | 内部配置（expect=10000，有 grepInvert）| 删除 |
| `vibex-fronted/tests/e2e/stability.spec.ts` | 路径错误（./e2e/ 不存在）| 修复路径 |
| `vibex-fronted/src/hooks/canvas/__tests__/useAutoSave.test.ts` | 存在但被 exclude | 修复后启用 |
| `vibex-fronted/src/hooks/canvas/useAIController.test.tsx` | 存在但用 jest 语法 | 迁移到 vi 语法 |
| `vibex-fronted/tests/unit/vitest.config.ts` | exclude useAutoSave | 移除 exclude |

---

*本分析由 Tester Agent 生成于 2026-04-10*
*对比基准: vibex-tester-proposals-vibex-proposals-20260408*
*参考: stability.spec.ts, playwright.config.ts, git log (2026-04-08~2026-04-10)*
