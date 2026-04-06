# Tester Proposals 2026-04-10

**项目**: vibex-tester-proposals-vibex-proposals-20260410
**视角**: Tester（测试视角）
**日期**: 2026-04-10
**状态**: 新增提案（对比 2026-04-08 快照）

---

## 提案列表

| ID | 类别 | 问题/优化点 | 优先级 | 对比04-08变化 |
|----|------|-------------|--------|--------------|
| T-P0-1 | Bug | Playwright 双重配置混乱 — `tests/e2e/playwright.config.ts` 的 expect timeout=10s vs 根配置=30s | P0 | 🆕 深层问题 |
| T-P0-2 | Bug | `stability.spec.ts` 检查 `./e2e/**/*.spec.ts` — 目录不存在，测试形同虚设 | P0 | 🆕 深层问题 |
| T-P0-3 | Bug | `@ci-blocking` grepInvert 在 `tests/e2e/playwright.config.ts` 中仍激活 — CI E2E 跳过 35+ 测试 | P0 | ⚠️ 仍未修复 |
| T-P1-1 | Feature | `useAIController.test.tsx` 存在但被 Vitest exclude — Jest 风格文件无法被 Vitest 运行 | P1 | 🆕 发现 |
| T-P1-2 | Feature | `useAutoSave.test.ts` 存在但被 exclude — 关键 save 逻辑无 CI 保障 | P1 | ⚠️ 仍未修复 |
| T-P1-3 | Bug | `waitForTimeout` 仍有 20+ 处残留 — 主要在 conflict-resolution、conflict-dialog、auto-save | P2 | ⚠️ 部分未清理 |
| T-P2-1 | Feature | canvas-e2e project 的 `testDir: './e2e'` 不存在 — 项目形同虚设 | P2 | 🆕 发现 |
| T-P2-2 | Feature | Mutation Testing (Stryker) 在 pnpm workspace 阻塞 | P2 | ⚠️ 仍未修复 |
| P3-1 | Feature | Contract 测试仅 1 个文件 (sync.contract.spec.ts)，flows API 无合约测试 | P3 | ⚠️ 仍未修复 |
| P3-2 | Feature | 核心库无测试：template-applier.ts、requirementValidator.ts、smartRecommenderStore.ts | P3 | ⚠️ 仍未修复 |

---

## 详细提案

### T-P0-1: Playwright 双重配置导致 timeout 不一致

**问题描述**:
项目存在两个 Playwright 配置文件，产生冲突：

| 配置 | 文件位置 | expect timeout | grepInvert | 用途 |
|------|---------|---------------|------------|------|
| 根配置 | `vibex-fronted/playwright.config.ts` | **30000ms** | 无 | 备用 |
| 内部配置 | `vibex-fronted/tests/e2e/playwright.config.ts` | **10000ms** | `/@ci-blocking/` (CI时) | CI实际使用 |

GitHub Actions workflow (`.github/workflows/test.yml`) 使用：
```bash
pnpm --filter vibex-fronted run test:e2e:ci
# → 执行 tests/e2e/playwright.config.ts
# → expect timeout = 10000ms（违反 F1.3 标准）
```

**影响范围**:
- CI 中所有断言超时仅 10s（根配置要求 30s）
- 慢网络/CI 环境下断言更容易超时失败
- `stability.spec.ts` 的 F1.3 检查的是根配置，与 CI 实际运行配置不一致

**建议方案**:
1. 统一使用根配置 `vibex-fronted/playwright.config.ts` 作为唯一配置
2. 从 `tests/e2e/playwright.config.ts` 迁移 `webServer`、`grepInvert` 到根配置
3. CI workflow 改为 `playwright test --config=vibex-fronted/playwright.config.ts`
4. 删除重复的 `tests/e2e/playwright.config.ts`

**验证方法**:
```bash
# 验证 CI 实际使用配置
CI=true npx playwright test --config=vibex-fronted/playwright.config.ts \
  --grep "expect timeout" 2>/dev/null || true
# 根配置 expect timeout 应 >= 30000
```

---

### T-P0-2: `stability.spec.ts` 检查路径错误 — 目录不存在

**问题描述**:
`tests/e2e/stability.spec.ts` 定义：
```ts
const E2E_DIR = resolve(__dirname, '../../e2e');
const testFiles = globSync('e2e/**/*.spec.ts', { cwd: resolve(__dirname, '../..') });
```

路径 `./e2e/` 在项目中**不存在**（E2E 测试实际在 `vibex-fronted/tests/e2e/`）。

结果：F1.1 检查（`waitForTimeout` 清理）永远返回 0 个结果，因为目录不存在，测试形同虚设。

**影响范围**:
- F1.1: `waitForTimeout` 检查无法发现实际的违规（分布在 `tests/e2e/*.spec.ts`）
- F1.2: canvas-e2e 测试路径 `./e2e/` 同样不存在
- 稳定性指标体系根本性失效

**建议方案**:
1. 修改 `stability.spec.ts` 中的路径：
   ```ts
   const E2E_DIR = resolve(__dirname, './tests/e2e');
   ```
2. 或在根 `playwright.config.ts` 中建立统一路径常量
3. 添加目录存在性检查，目录不存在时测试应 FAIL 而非 PASS

**验证方法**:
```bash
ls tests/e2e/  # 目录存在确认
# stability.spec.ts 应检查 tests/e2e/*.spec.ts
grep -c "waitForTimeout" tests/e2e/*.spec.ts
# 当前: 20+ 处，应: 0
```

---

### T-P0-3: `@ci-blocking` grepInvert 仍在 CI 配置中激活

**问题描述**:
`tests/e2e/playwright.config.ts` 仍有：
```ts
grepInvert: process.env.CI ? /@ci-blocking/ : undefined,
```

GitHub Actions CI E2E job 仍在跳过所有带 `@ci-blocking` 标记的测试（35+ 个测试）。

**影响范围**:
- `conflict-resolution.spec.ts` — 冲突解决流程（用户核心路径）
- `undo-redo.spec.ts` — 撤销重做
- `canvas-quality-ci.spec.ts` — Canvas 质量检查
- 所有 a11y 测试（canvas、export、homepage）

**建议方案**:
1. **快速修复**: 注释掉 `grepInvert`，让所有测试在 CI 运行
2. **长期方案**: 评估 `@ci-blocking` 测试的可修复性，逐批移除标记
3. 建立 pass rate 目标：≥ 90% 才允许 merge

**验证方法**:
```bash
# 确认 grepInvert 是否激活
grep "grepInvert" vibex-fronted/tests/e2e/playwright.config.ts
# 应无输出（已移除）或显式设为 undefined

# 确认实际运行测试数量
CI=true npx playwright test --list 2>/dev/null | grep "·" | wc -l
# 应 >= 50（不是 15）
```

---

### T-P1-1: `useAIController.test.tsx` 被 Vitest exclude

**问题描述**:
`useAIController.test.tsx` 使用 Jest 风格（`jest.mock()`），Vitest 无法直接运行。被 `vitest.config.ts` 的 `exclude` 规则排除：
```
exclude: ['**/src/hooks/canvas/__tests__/useCanvasExport.test.ts',
          '**/src/hooks/canvas/__tests__/useAutoSave.test.ts']
```
注：`useAIController.test.tsx` 在 `src/hooks/canvas/` 根目录（不在 `__tests__/`），不在 exclude 列表，但使用 `jest.fn()` / `jest.mock()`，Vitest 不兼容。

**影响范围**:
- `useAIController.test.tsx` — AI 生成控制逻辑（高风险），使用 Jest globals
- 2026-04-06 的 `setup.tsx` 提供了 Jest globals 兼容层，但 `useAIController.test.tsx` 仍用 `jest.*` 而非 `vi.*`

**建议方案**:
1. 升级 `useAIController.test.tsx` 使用 `vi.fn()` / `vi.mock()`（Vitest 原生）
2. 在 `tests/unit/setup.ts` 中已配置 Jest globals 兼容，但该文件仅对 `tests/unit/` 目录生效
3. 将 `src/hooks/canvas/*.test.tsx` 纳入 Vitest 兼容层

**验证方法**:
```bash
# useAIController 测试应能被 Vitest 运行
cd vibex-fronted && npx vitest run src/hooks/canvas/useAIController.test.tsx
# 应输出测试结果（非 "no tests found"）
```

---

### T-P1-2: `useAutoSave.test.ts` 存在但被 exclude

**问题描述**:
`src/hooks/canvas/__tests__/useAutoSave.test.ts` 存在（10553 字节），但被 `vitest.config.ts` 显式排除：
```ts
exclude: [
  '**/src/hooks/canvas/__tests__/useAutoSave.test.ts',
]
```

原因可能是测试文件不完整或依赖未 mock。但 `navigator.sendBeacon` 自动保存逻辑没有 CI 保障。

**影响范围**:
- `useAutoSave.ts` — 11KB，核心自动保存逻辑（`navigator.sendBeacon`）
- 任何自动保存相关改动无法通过自动化测试验证

**建议方案**:
1. 调查 exclude 原因（运行测试看具体失败信息）
2. 修复测试中的 mock 问题（`navigator.sendBeacon`、`localStorage` 等）
3. 移除 exclude 规则，恢复 CI 测试

**验证方法**:
```bash
cd vibex-fronted
# 手动运行被排除的测试，查看失败原因
npx vitest run src/hooks/canvas/__tests__/useAutoSave.test.ts 2>&1
# 修复后应通过，移除 exclude 规则
```

---

### T-P1-3: `waitForTimeout` 仍有 20+ 处残留

**问题描述**:
`waitForTimeout` 扫描结果（从 `vibex-fronted/tests/e2e/`）：
- `conflict-resolution.spec.ts`: 8 处（500ms ~ 2000ms）
- `conflict-dialog.spec.ts`: 6 处（500ms ~ 3000ms）
- `auto-save.spec.ts`: 5 处（500ms ~ 2500ms）
- `homepage-tester-report.spec.ts`: 1 处（2000ms）
- `login-state-fix.spec.ts`: 2 处（1000ms ~ 2000ms）

**建议方案**:
1. `conflict-resolution.spec.ts`: `waitForTimeout(1000)` → `page.waitForResponse('/api/...')` 或 `page.waitForSelector('.conflict-dialog', {state: 'visible'})`
2. `conflict-dialog.spec.ts`: 同样替换为 `waitForSelector` + 网络等待
3. `auto-save.spec.ts`: `waitForTimeout(2500)` → `page.waitForResponse(/\/api\/.*snapshot/, {timeout: 5000})`
4. `login-state-fix.spec.ts`: `waitForTimeout(2000)` → `page.waitForLoadState('networkidle')`

**验证方法**:
```bash
grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ \
  --include="*.ts" | grep -v "flaky\|comment\|FIXME"
# 应返回 0 行
```

---

### T-P2-1: canvas-e2e project `testDir: './e2e'` 不存在

**问题描述**:
根 `vibex-fronted/playwright.config.ts` 定义：
```ts
{ name: 'canvas-e2e', testDir: './e2e', use: {...devices['Desktop Chrome']} }
```
`./e2e` 目录不存在，canvas-e2e 项目无法找到任何测试文件。

**建议方案**:
1. 修改 `testDir: './tests/e2e'` 指向实际目录
2. 或创建 `e2e/` 目录并将 Canvas 相关测试移入
3. 统一文件组织结构

**验证方法**:
```bash
# 验证 canvas-e2e 项目能找到测试
npx playwright test --project=canvas-e2e --list 2>/dev/null | grep "·" | wc -l
# 应 >= 1（非 0）
```

---

### T-P2-2: Mutation Testing (Stryker) 在 pnpm workspace 阻塞

**问题描述**:
`stryker.conf.json` 已配置（1492 mutants），但 pnpm workspace 的 shaken `node_modules` 导致 `@stryker-mutator/jest-runner` 无法运行。

**建议方案**:
- **方案 A（推荐）**: 在 CI Docker 容器中运行（npm 隔离环境）
- **方案 B**: 接受替代指标：E2 contract (66 tests) + store coverage (100%)
- **方案 C**: 迁移到 `@stryker-mutator/vitest-runner`（需 Vitest 生态成熟）

**验证方法**:
```bash
docker run --rm -v $(pwd):/app node:20 bash -c \
  "cd /app && npm install && npx stryker run"
# 或：
# 替代指标检查
grep -c "test\|Test" vibex-fronted/tests/contract/*.ts
# >= 20
```

---

### P3-1: Contract 测试覆盖率不足

**问题描述**:
仅有 `sync.contract.spec.ts`（318 行），`/v1/canvas/flows` API 无合约测试。

**建议方案**:
添加 `flows.contract.spec.ts`，覆盖 flows CRUD API 响应 schema。

---

### P3-2: 核心库无测试覆盖

**问题描述**:
以下库无测试：`template-applier.ts`、`requirementValidator.ts`、多个 store（`guidanceStore`、`homePageStore`、`deliveryStore`、`smartRecommenderStore`）。

**建议方案**:
按风险优先级补充边界测试（空值、超长文本、特殊字符）。

---

## 附录：当前测试资产总览（2026-04-10）

| 资产 | 数量/状态 | 对比04-08 |
|------|-----------|-----------|
| E2E 测试文件 | 58 个 spec | +23 新增 |
| GitHub Actions E2E CI | ✅ 存在 (test.yml) | 🆕 新增 |
| @ci-blocking 跳过 | ⚠️ 仍在 tests/e2e config | ❌ 未修复 |
| Vitest Jest 兼容层 | ✅ setup.tsx 存在 | 🆕 新增 |
| Hook 单元测试 | 7 个文件（__tests__/ 下 6 个 + useAIController） | ↑ 改善 |
| useAIController | ⚠️ 存在但 excluded（jest 语法） | 🆕 发现 |
| useAutoSave | ⚠️ 存在但 excluded | ⚠️ 未修复 |
| Contract 测试 | 1 个（318 行） | ⚠️ 未扩展 |
| Mutation 测试 | Stryker 配置存在但阻塞 | ⚠️ 未修复 |
| daily-stability.md | ❌ 文件不存在 | ❌ 仍缺失 |
| stability.spec.ts | ⚠️ 检查路径错误（./e2e/ 不存在） | 🆕 发现 |
| Playwright 双重配置 | ⚠️ 根配置 + tests/e2e/ 配置冲突 | 🆕 发现 |
| waitForTimeout 残留 | ⚠️ 20+ 处 | ⚠️ 部分清理 |
| MSW | ❌ 未引入 | ❌ 仍缺失 |

---

*本提案由 Tester Agent 生成于 2026-04-10*
*对比基准: vibex-tester-proposals-vibex-proposals-20260408*
