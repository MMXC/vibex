# Tester Proposals 2026-04-08

**项目**: vibex-tester-proposals-vibex-proposals-20260408
**视角**: Tester（测试视角）
**日期**: 2026-04-08

---

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 |
|----|------|-------------|--------|
| T-P0-1 | Bug | `@ci-blocking` 测试全部跳过 — E2E 覆盖率归零 | P0 |
| T-P0-2 | Bug | Playwright `canvas-e2e` 项目指向不存在的 `./e2e` 目录 | P0 |
| T-P1-1 | Feature | GitHub Actions E2E CI 缺失 — 测试全靠手动触发 | P1 |
| T-P1-2 | Feature | Mutation Testing (Stryker) 在 pnpm workspace 环境下无法运行 | P1 |
| T-P1-3 | Bug | 关键 Hook 无单元测试 — `useAIController` / `useAutoSave` 等 | P1 |
| T-P2-1 | Feature | `daily-stability.md` 空无一字 — 稳定性指标未记录 | P2 |
| T-P2-2 | Feature | 无 Mock Service Worker (MSW) 集成 — API mock 不规范 | P2 |
| T-P2-3 | Bug | E2E 测试中硬编码 `waitForTimeout` 模式仍存在 | P2 |
| T-P3-1 | Feature | 合约测试覆盖率不足 — 仅 E4 有 `sync.contract.spec.ts` | P3 |
| T-P3-2 | Feature | `requirementValidator`、`template-applier` 等核心库无测试 | P3 |

---

## 详细提案

### T-P0-1: `@ci-blocking` 测试全部跳过 — E2E 覆盖率归零

**问题描述**:
现有 35+ 个 E2E 测试文件大量使用 `@ci-blocking` 标记，导致 CI 环境中这些测试被 `grepInvert: /@ci-blocking/` 规则静默跳过。核心用户流程（冲突解决、撤销/重做、注册流程、canvas 质量检查、Vue 组件集成）完全没有 CI 保障。

**影响范围**:
- `tests/e2e/conflict-resolution.spec.ts` — 5 个冲突解决流程测试（全部跳过）
- `tests/e2e/undo-redo.spec.ts` — 撤销重做测试（跳过）
- `tests/e2e/auth/register.spec.ts` — 注册流程测试（跳过）
- `tests/e2e/canvas-quality-ci.spec.ts` — Canvas 质量 CI 测试（跳过）
- `tests/e2e/vue-components.spec.ts` — Vue 组件测试（跳过）
- `tests/a11y/canvas.spec.ts`、`tests/a11y/export.spec.ts`、`tests/a11y/homepage.spec.ts` — 无障碍测试（跳过）

**建议方案**:
1. **优先级排序**: 识别哪些 `@ci-blocking` 是"可修复的"（如 mock 数据不完整）vs"无法修复的"（如依赖真实 AI API）
2. **修复一批**: 针对稳定可修复的测试，移除 `@ci-blocking` 标记，至少恢复 10+ 个测试到 CI
3. **长期治理**: 建立 E2E 测试稳定性 SLA，目标：pass rate ≥ 95%，flaky ≤ 1/run
4. **CI 可执行性检查**: 将 `@ci-blocking` 标记改为 `test.skip()` + 维护 `skip-reasons.md` 清单

**验证方法**:
```bash
# 运行所有 E2E 测试（不跳过 @ci-blocking）
grep -r "@ci-blocking" tests/ --include="*.ts" | wc -l
# 当前应 > 0，长期目标: 0
npx playwright test --grep "@ci-blocking" --reporter=line
# 至少 50% 应能稳定通过
```

---

### T-P0-2: Playwright `canvas-e2e` 项目指向不存在的 `./e2e` 目录

**问题描述**:
`playwright.config.ts` 中定义了 `canvas-e2e` 项目，`testDir` 指向 `./e2e`，但该目录不存在。所有 Canvas E2E 测试实际运行在默认 `chromium` 项目中，与其他 E2E 测试混在一起，无法独立调度。

**影响范围**:
- Canvas 相关 E2E 测试无法单独运行
- CI 中无法针对 Canvas 功能做独立测试计划
- 测试输出混淆（Canvas 测试 vs 普通 E2E 测试）

**建议方案**:
1. 创建 `/tests/e2e/canvas/` 子目录（已在 `testDir: './tests/e2e'` 目录下存在）
2. 修改 `playwright.config.ts` 中 `canvas-e2e` 的 `testDir` 指向 `./tests/e2e`
3. 或确认实际 Canvas E2E 测试位置，统一文件组织

**验证方法**:
```bash
ls tests/e2e/canvas/  # 应包含 canvas-specific E2E 测试
npx playwright test --project=canvas-e2e  # 应运行 canvas 测试而非报错
```

---

### T-P1-1: GitHub Actions E2E CI 缺失 — 测试全靠手动触发

**问题描述**:
项目有完善的 Playwright 测试基础设施（35+ 测试文件，retries、重试机制、截图/视频录制），但没有 GitHub Actions workflow。E2E 测试依赖开发者手动触发，无法在 PR 阶段自动发现退化。

**影响范围**:
- 所有 E2E 测试（用户认证、冲突解决、导航、AI 生成流程等）
- 任何 PR 合入 main 分支时无法自动验证

**建议方案**:
1. 创建 `.github/workflows/e2e.yml`，触发条件：
   - `push: [main, develop]`
   - `pull_request: [main]`
   - `schedule: cron: '0 2 * * *'` (每日凌晨)
2. 步骤: checkout → setup-node → npm ci → playwright install → playwright test
3. 配置 Slack 通知：失败时发送到 #dev 频道
4. 产物: 上传 `playwright-report/` 和 `test-results/`

**验证方法**:
```bash
# 本地模拟 CI 环境
CI=true npx playwright test --reporter=list
# CI workflow 应在 push main 后 30min 内完成
# 查看 GitHub Actions 页面确认 E2E workflow 存在且通过
```

---

### T-P1-2: Mutation Testing (Stryker) 在 pnpm workspace 环境下无法运行

**问题描述**:
`stryker.conf.json` 已配置，1492 mutants 已通过 instrumenter 验证，但运行时因 pnpm workspace 的 shaken `node_modules` 结构导致 `@stryker-mutator/jest-runner` 无法加载。详见 `test-quality-report.md`（2026-04-03/04）。

**影响范围**:
- 无法验证测试套件的有效性（mutation kill rate）
- 测试覆盖率的替代指标（contextStore 110 tests）无法验证测试本身质量

**建议方案**:
**方案 A（推荐）**: 在 CI Docker 容器中运行 Stryker（npm 隔离环境）
**方案 B**: 迁移前端到 Vitest，使用 `@stryker-mutator/vitest-runner`
**方案 C**: 接受替代指标（E2 contract 66 tests + store 覆盖率 100%），放弃 Stryker

**验证方法**:
```bash
# 方案 A: 在独立容器运行
docker run --rm -v $(pwd):/app node:20 bash -c "cd /app && npm install @stryker-mutator/core @stryker-mutator/jest-runner && npx stryker run"
# 应输出 kill rate 报告
```

---

### T-P1-3: 关键 Hook 无单元测试 — `useAIController` / `useAutoSave` 等

**问题描述**:
Canvas 核心 hooks 有测试（E1-E6 阶段已完成 `useCanvasRenderer` 97.29%、`useDndSortable`、`useDragSelection`、`useCanvasSearch`、`useTreeToolbarActions`、`useVersionHistory`），但以下关键 hooks 仍无测试：

| Hook | 风险等级 | 风险描述 |
|------|---------|---------|
| `useAIController` | 🔴 高 | AI 生成控制逻辑，状态机复杂，无测试 |
| `useAutoSave` | 🔴 高 | 自动保存逻辑，`navigator.sendBeacon` 依赖 |
| `useCanvasExport` | 🔴 高 | 导出功能，多格式支持逻辑 |
| `useCanvasEvents` | 🟡 中 | Canvas 事件分发逻辑 |
| `useCanvasSnapshot` | 🟡 中 | 快照创建逻辑 |
| `useCollaboration` | 🟡 中 | 协作模式逻辑 |
| `useKeyboardShortcuts` | 🟡 中 | 快捷键绑定 |
| `useFlowVisualization` | 🟢 低 | 可视化渲染 |

**建议方案**:
1. 为 `useAIController` 和 `useAutoSave` 建立完整测试套件（各 ≥15 个测试用例）
2. 使用 MSW (Mock Service Worker) 模拟 API 响应
3. 对 `navigator.sendBeacon` 使用 `vi.stubGlobal()` mock
4. 覆盖率目标: AIController ≥ 80%，AutoSave ≥ 75%

**验证方法**:
```bash
pnpm vitest run src/hooks/canvas/useAIController.test.ts
# 覆盖率报告: stmts >= 80%
pnpm vitest run src/hooks/canvas/useAutoSave.test.ts
# 覆盖率报告: stmts >= 75%
```

---

### T-P2-1: `daily-stability.md` 空无一字 — 稳定性指标未记录

**问题描述**:
`daily-stability.md` 格式已定义，但 `Daily Log` 部分完全空白（无历史数据）。`scripts/test-stability-report.sh` 脚本存在但从未执行。

**影响范围**:
- 无法追踪 E2E 测试稳定性趋势（flaky 率、pass rate）
- 无法发现间歇性失败的测试用例
- 无法向团队展示测试健康度

**建议方案**:
1. 在 GitHub Actions E2E workflow（提案 T-P1-1）中集成稳定性报告生成
2. `scripts/test-stability-report.sh` 应在每次 E2E 运行后执行
3. 将结果追加到 `daily-stability.md`
4. 设置告警：pass rate < 95% 或 flaky > 1 时发送 Slack 通知

**验证方法**:
```bash
# 手动执行报告生成
bash scripts/test-stability-report.sh
# daily-stability.md 应有数据行
grep -c "20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]" daily-stability.md
# 应 >= 1
```

---

### T-P2-2: 无 Mock Service Worker (MSW) 集成 — API mock 不规范

**问题描述**:
当前 E2E 测试使用 `page.route()` 直接拦截 HTTP 请求（Playwright 原生），单元测试使用 `vi.mock()` 或 `jest.mock()`。缺乏统一的 MSW 层，导致：
- 单元测试和 E2E 测试的 API mock 策略不一致
- 无法在浏览器真实环境中测试 API 合约
- `sync.contract.spec.ts` 依赖 `page.route()` mock 数据，与实际 API 行为可能脱节

**影响范围**:
- `tests/contract/sync.contract.spec.ts` — 合约测试准确性
- 所有依赖 API mock 的 E2E 测试

**建议方案**:
1. 引入 MSW (Mock Service Worker) `@mswjs/msw` 和 `@mswjs/interceptors`
2. 统一 mock 策略：E2E 测试用 MSW browser worker，单元测试用 MSW node handler
3. 从 `sync.contract.spec.ts` 提取共享的 mock handlers 到 `tests/fixtures/msw/`
4. 确保 mock 数据与 Zod schema 一致

**验证方法**:
```bash
# MSW handlers 应存在于 tests/fixtures/msw/
ls tests/fixtures/msw/
# E2E 测试通过 MSW 拦截而非 page.route
grep -c "page.route" tests/e2e/*.spec.ts
# 应逐年下降（替换为 MSW）
```

---

### T-P2-3: E2E 测试中硬编码 `waitForTimeout` 模式仍存在

**问题描述**:
`TESTING_STRATEGY.md` 明确禁止 `waitForTimeout(1000)` 模式，规定使用 `waitForResponse()`、`waitForLoadState()` 替代。但部分测试文件仍有 `waitForTimeout` 残留：

- `conflict-resolution.spec.ts` 使用 `waitForTimeout(500)` 和 `waitForTimeout(1000)`
- `auto-save.spec.ts` 可能存在 `waitForTimeout`

**影响范围**:
- 测试不稳定（时间依赖）
- CI 环境中更容易超时
- 与测试策略文档矛盾

**建议方案**:
1. 全局扫描 `waitForTimeout` 出现位置
2. 逐一替换为确定性等待模式：
   - `waitForTimeout(X)` → `page.waitForResponse(predicate, { timeout: X })`
   - `waitForTimeout(X)` → `page.waitForSelector(selector, { state: 'visible', timeout: X })`
   - `waitForTimeout(X)` → `waitForFunction` 或 `waitForLoadState('networkidle')`
3. 建立 lint 规则检测新出现的 `waitForTimeout`

**验证方法**:
```bash
grep -rn "waitForTimeout" tests/ --include="*.ts" | grep -v "flaky-helpers\|comment"
# 应返回 0 个结果
```

---

### T-P3-1: 合约测试覆盖率不足 — 仅 E4 有 `sync.contract.spec.ts`

**问题描述**:
`TESTING_STRATEGY.md` 定义了 6 个合约测试端点（`/v1/canvas/snapshots` GET/POST、GET/:id、POST /restore、GET/rollback、POST /rollback），但只有 E4 snapshot API 有合约测试（`sync.contract.spec.ts`），其他端点无合约测试。

**影响范围**:
- `/v1/canvas/flows` 端点（E1/E2 CRUD API）无合约测试
- API 响应 schema 变更时无自动检测

**建议方案**:
1. 为 `/v1/canvas/flows` 端点添加 `flows.contract.spec.ts`
2. 使用 Zod schema 生成 mock 数据，确保前端 mock 与后端 schema 一致
3. 在 CI 中集成合约测试（条件：schemas 变更时触发）

**验证方法**:
```bash
npx playwright test tests/contract/
# 应覆盖至少 3 个主要 API 端点
# Contract tests: >= 20
```

---

### T-P3-2: 核心库无测试覆盖

**问题描述**:
以下核心业务逻辑库完全无测试：

| 库文件 | 风险描述 |
|--------|---------|
| `src/lib/template-applier.ts` | 模板应用逻辑，格式化错误不会被发现 |
| `src/lib/proposals/parser.ts` | 需求解析逻辑 |
| `src/lib/validator/requirementValidator.ts` | 需求验证逻辑 |
| `src/lib/dialogue/CompletenessScorer.ts` | AI 完整性评分逻辑 |
| `src/lib/canvas/stores/messageBridge.ts` | Canvas 跨 store 通信逻辑 |
| `src/stores/guidanceStore.ts` | 引导流程 store |
| `src/stores/homePageStore.ts` | 首页状态 store |
| `src/stores/deliveryStore.ts` | 交付状态 store |
| `src/stores/smartRecommenderStore.ts` | 智能推荐 store |

**建议方案**:
按风险优先级补充测试：
1. `template-applier.ts` — 模板替换边界（空值、超长文本、特殊字符）
2. `requirementValidator.ts` — 各类无效输入的拒绝逻辑
3. `messageBridge.ts` — 跨 store 消息传递
4. 其他 store 按需补充

**验证方法**:
```bash
# 检查覆盖缺口
npx vitest run --coverage --coverageThreshold='{"global":{"branches":60}}'
# 覆盖率报告应无低于阈值的文件
```

---

## 附录：当前测试资产总览

| 资产 | 数量/状态 | 备注 |
|------|-----------|------|
| E2E 测试文件 | 35+ | 含 97 个 TypeScript 测试文件 |
| Store 测试 | 6 个 canvas stores | 覆盖率 100%（canvas stores）|
| Hook 单元测试 | 6 个 canvas hooks | E1-E6 阶段完成 |
| Contract 测试 | 1 个（E4 sync） | 需扩展到 E1/E2 |
| 突变测试 | Stryker 配置存在 | 阻塞：pnpm workspace |
| E2E CI | 缺失 | 需创建 GitHub Actions |
| daily-stability.md | 空 | 需集成到 CI |
| MSW | 未引入 | 需统一 mock 策略 |

---

*本提案由 Tester Agent 生成于 2026-04-08*
