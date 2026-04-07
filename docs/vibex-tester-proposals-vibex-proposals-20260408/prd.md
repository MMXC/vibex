# PRD: VibeX 测试质量提升方案

**项目**: vibex-tester-proposals-vibex-proposals-20260408  
**状态**: Draft  
**版本**: 1.0  
**日期**: 2026-04-08  
**Owner**: PM Agent  

---

## 1. 执行摘要

### 背景

VibeX 是一个 DDD Canvas 生成平台，前端使用 Next.js + React + TypeScript，后端使用 Cloudflare Workers (Hono) + D1。项目现有测试资产包括 97 个测试文件（~13.3 万行）、35+ E2E Playwright 测试、6 个 Canvas Store 单元测试（覆盖率 100%）及 6 个 Canvas Hook 单元测试（E1-E6）。

当前核心问题：35+ E2E 测试因 `@ci-blocking` 标记全部在 CI 中跳过，GitHub Actions E2E CI 缺失，导致 PR 合入无自动化保障；关键 Hook（`useAIController`、`useAutoSave`）无单元测试；Stryker 突变测试在 pnpm workspace 环境下阻塞无法运行。

### 目标

通过分阶段实施，在 9 人天内重建 E2E CI 能力、补全关键 Hook 单元测试、建立稳定性监控机制，并在 Week 3 决策是否接受 Stryker 替代指标。

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| E2E 测试 @ci-blocking 数量 | 35+ | ≤ 10 |
| GitHub Actions E2E workflow | 不存在 | 存在且通过率 ≥ 95% |
| useAIController 测试覆盖率 | 0% | ≥ 80% |
| useAutoSave 测试覆盖率 | 0% | ≥ 75% |
| 合约测试数量 | 1 个文件 | ≥ 3 个文件 |
| daily-stability.md 记录数 | 0 条 | ≥ 7 条/周 |

---

## 2. Feature List

| ID | 功能名称 | 描述 | 根因关联 | 优先级 | 工时(人天) |
|----|---------|------|---------|--------|-----------|
| F1 | 修复 @ci-blocking E2E 测试 | 识别并修复可稳定的 E2E 测试，移除 @ci-blocking 标记，恢复 ≥10 个测试到 CI | T-P0-1 | P0 | 2 |
| F2 | 修复 Playwright canvas-e2e 项目路径 | 修正 playwright.config.ts 中 canvas-e2e 项目的 testDir 指向 | T-P0-2 | P0 | 0.5 |
| F3 | 创建 GitHub Actions E2E CI | 新建 .github/workflows/e2e.yml，支持 push/PR/schedule 触发，含 Slack 通知 | T-P1-1 | P1 | 1 |
| F4 | useAIController 单元测试 | 为 AI 生成控制逻辑编写 ≥15 个测试用例，覆盖率 ≥ 80% | T-P1-3 | P1 | 1.5 |
| F5 | useAutoSave 单元测试 | 为自动保存逻辑编写 ≥15 个测试用例，覆盖率 ≥ 75%，mock navigator.sendBeacon | T-P1-3 | P1 | 1.5 |
| F6 | 稳定性监控集成 | 将 test-stability-report.sh 集成到 CI，自动更新 daily-stability.md | T-P2-1 | P2 | 0.5 |
| F7 | waitForTimeout 清理 | 扫描并替换所有硬编码 waitForTimeout 为确定性等待模式 | T-P2-3 | P2 | 0.5 |
| F8 | flows API 合约测试 | 为 /v1/canvas/flows 添加 flows.contract.spec.ts，≥5 个用例 | T-P3-1 | P3 | 1 |
| F9 | MSW 试点引入 | 在 sync.contract.spec.ts 中试点 MSW，统一 API mock 策略 | T-P2-2 | P2 | 1 |
| F10 | Stryker 方案决策 | Week 3 评估：接受替代指标（E2 66 + store 100%）或迁移 Vitest | T-P1-2 | P1 | 0.5 |
| F11 | 核心库测试补充 | template-applier.ts、requirementValidator.ts 各补充边界测试 | T-P3-2 | P3 | 1 |

**总工时**: 11 人天（含 F10 决策时间 0.5 天）

---

## 3. Epic 拆分表

### Epic 1: E2E CI 重建（4.5 人天）

| Story | 功能 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 修复 @ci-blocking E2E 测试 | 2d | `@ci-blocking` 标记数量从 35+ 降至 ≤10；E2E 测试 pass rate ≥ 95% |
| S1.2 | 修复 canvas-e2e 项目路径 | 0.5d | `npx playwright test --project=canvas-e2e` 正常列出并运行 Canvas 测试，无报错 |
| S1.3 | 创建 GitHub Actions E2E workflow | 1d | workflow 在 push main 和 PR 时触发，失败时发送 Slack 通知，上传 playwright-report |
| S1.4 | waitForTimeout 清理 | 0.5d | `grep -rn "waitForTimeout" tests/ --include="*.ts" \| grep -v "flaky"` 返回 0 条 |
| S1.5 | 稳定性监控 CI 集成 | 0.5d | 每次 E2E 运行后执行 test-stability-report.sh，daily-stability.md 有数据记录 |

### Epic 2: 关键 Hook 单元测试（3 人天）

| Story | 功能 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | useAIController 测试 | 1.5d | ≥15 个测试用例；覆盖率 branches ≥ 80%；使用 vi.stubGlobal mock AI API |
| S2.2 | useAutoSave 测试 | 1.5d | ≥15 个测试用例；覆盖率 stmts ≥ 75%；navigator.sendBeacon 使用 vi.stubGlobal mock，无硬编码 |

### Epic 3: 测试有效性与质量指标（1.5 人天）

| Story | 功能 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | MSW 试点引入 | 1d | sync.contract.spec.ts 迁移到 MSW；handlers 提取到 tests/fixtures/msw/ |
| S3.2 | Stryker 方案决策 | 0.5d | 决策文档记录（接受替代指标 or 迁移 Vitest）；若接受替代，记录 E2 contract tests ≥ 20 |

### Epic 4: 合约测试与核心库（2 人天）

| Story | 功能 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | flows API 合约测试 | 1d | tests/contract/flows.contract.spec.ts 存在；≥5 个合约测试用例；依赖 Zod schema |
| S4.2 | 核心库测试补充 | 1d | template-applier.ts 和 requirementValidator.ts 各有 ≥5 个边界测试用例 |

---

## 4. 验收标准

### Epic 1: E2E CI 重建

#### S1.1 修复 @ci-blocking E2E 测试
```
expect(
  execSync("grep -r '@ci-blocking' tests/ --include='*.ts' | wc -l").toString().trim()
).toBeLessThanOrEqual(10);

expect(
  execSync("CI=true npx playwright test --reporter=dot 2>&1 | tail -1").toString()
).toMatch(/passed/);
```

#### S1.2 修复 canvas-e2e 项目路径
```
expect(
  execSync("npx playwright test --project=canvas-e2e --list 2>&1").toString()
).not.toMatch(/does not exist|ENOTDIR/);
```

#### S1.3 创建 GitHub Actions E2E workflow
```
expect(fs.existsSync(".github/workflows/e2e.yml")).toBe(true);
expect(
  execSync("grep -c 'pull_request\\|push\\|schedule' .github/workflows/e2e.yml").toString().trim()
).toBeGreaterThanOrEqual(2);
expect(
  execSync("grep -c 'slack\\|notify\\|report' .github/workflows/e2e.yml").toString().trim()
).toBeGreaterThanOrEqual(1);
```

#### S1.4 waitForTimeout 清理
```
expect(
  execSync("grep -rn 'waitForTimeout' tests/ --include='*.ts' | grep -v 'flaky-helpers\\|FIXME\\|comment'").toString().trim()
).toBe("");
```

#### S1.5 稳定性监控 CI 集成
```
expect(fs.existsSync("scripts/test-stability-report.sh")).toBe(true);
expect(
  execSync("bash scripts/test-stability-report.sh && grep -c '20[0-9][0-9]-[0-9][0-9]' daily-stability.md").toString().trim()
).toBeGreaterThanOrEqual(1);
```

### Epic 2: 关键 Hook 单元测试

#### S2.1 useAIController 测试
```
expect(fs.existsSync("src/hooks/canvas/useAIController.test.ts")).toBe(true);
const output = execSync("pnpm vitest run src/hooks/canvas/useAIController.test.ts --coverage 2>&1").toString();
expect(output).toMatch(/branches.*\d+(\.\d+)?%/);
expect(output).toMatch(/all hooks.*\d+ tests? passed/);
```

#### S2.2 useAutoSave 测试
```
expect(fs.existsSync("src/hooks/canvas/useAutoSave.test.ts")).toBe(true);
expect(
  execSync("grep -c 'vi.stubGlobal' src/hooks/canvas/useAutoSave.test.ts").toString().trim()
).toBeGreaterThanOrEqual(1);
const output = execSync("pnpm vitest run src/hooks/canvas/useAutoSave.test.ts --coverage 2>&1").toString();
expect(output).toMatch(/statements.*\d+(\.\d+)?%/);
```

### Epic 3: 测试有效性与质量指标

#### S3.1 MSW 试点引入
```
expect(fs.existsSync("tests/fixtures/msw/")).toBe(true);
expect(
  execSync("grep -c 'msw' tests/contract/sync.contract.spec.ts").toString().trim()
).toBeGreaterThanOrEqual(1);
```

#### S3.2 Stryker 方案决策
```
expect(fs.existsSync("docs/decisions/stryker-decision.md")).toBe(true);
const content = execSync("cat docs/decisions/stryker-decision.md").toString();
expect(content).toMatch(/Vitest|Stryker|alternative|替代/);
```

### Epic 4: 合约测试与核心库

#### S4.1 flows API 合约测试
```
expect(fs.existsSync("tests/contract/flows.contract.spec.ts")).toBe(true);
expect(
  execSync("grep -c 'test(\\|it(\\|spec(' tests/contract/flows.contract.spec.ts").toString().trim()
).toBeGreaterThanOrEqual(5);
```

#### S4.2 核心库测试补充
```
expect(fs.existsSync("src/lib/template-applier.test.ts")).toBe(true);
expect(fs.existsSync("src/lib/validator/requirementValidator.test.ts")).toBe(true);
expect(
  execSync("grep -c 'test(\\|it(' src/lib/template-applier.test.ts").toString().trim()
).toBeGreaterThanOrEqual(5);
expect(
  execSync("grep -c 'test(\\|it(' src/lib/validator/requirementValidator.test.ts").toString().trim()
).toBeGreaterThanOrEqual(5);
```

---

## 5. Definition of Done

### DoD for Epic 1: E2E CI 重建
- [ ] `@ci-blocking` 标记数量 ≤ 10
- [ ] `npx playwright test --project=canvas-e2e --list` 无报错
- [ ] `.github/workflows/e2e.yml` 存在于仓库根目录
- [ ] E2E 测试 pass rate ≥ 95%（CI 环境下）
- [ ] `waitForTimeout` 残留数量 = 0
- [ ] `daily-stability.md` 至少有本周运行记录

### DoD for Epic 2: 关键 Hook 单元测试
- [ ] `useAIController.test.ts` 存在，≥15 个测试用例
- [ ] useAIController 分支覆盖率 ≥ 80%
- [ ] `useAutoSave.test.ts` 存在，≥15 个测试用例
- [ ] useAutoSave 语句覆盖率 ≥ 75%
- [ ] sendBeacon mock 使用 `vi.stubGlobal` 而非硬编码
- [ ] 所有新测试在 `pnpm vitest run` 下通过

### DoD for Epic 3: 测试有效性与质量指标
- [ ] MSW handlers 提取到 `tests/fixtures/msw/`
- [ ] `sync.contract.spec.ts` 改用 MSW mock
- [ ] Stryker 决策文档已创建（docs/decisions/stryker-decision.md）
- [ ] 决策包含明确的实验结果和结论

### DoD for Epic 4: 合约测试与核心库
- [ ] `tests/contract/flows.contract.spec.ts` 存在，≥5 个用例
- [ ] `template-applier.test.ts` 存在，≥5 个边界测试用例
- [ ] `requirementValidator.test.ts` 存在，≥5 个验证测试用例
- [ ] 所有新测试在 `pnpm vitest run` 下通过

### 总体 DoD
- [ ] 4 个 Epic 全部完成
- [ ] 所有验收标准断言通过
- [ ] PR 包含新增的测试文件和 CI 配置
- [ ] `daily-stability.md` 本周内有 ≥1 条记录
- [ ] 决策文档（Stryker）已创建并经过团队确认
- [ ] 文档更新：`TESTING_STRATEGY.md` 反映新增的测试规范
- [ ] 代码无 lint 错误（`pnpm eslint tests/`）
- [ ] 关键变更已通知到 #dev 频道

---

## 6. 范围决策

### In Scope
- E2E 测试 CI 重建（Playwright + GitHub Actions）
- 关键 Hook 单元测试（useAIController、useAutoSave）
- 合约测试扩展（flows API）
- 核心库测试补充（template-applier、requirementValidator）
- 稳定性监控集成

### Out of Scope
- 迁移 Jest → Vitest（不作为本项目目标，但 Stryker 决策时可触发）
- 所有 Hook 的完整测试覆盖（仅限 P1 指定的 2 个 Hook）
- 完整的 MSW 推广（仅试点 sync.contract.spec.ts）
- daily-stability.md 的历史数据补录
- Stryker 本身在 pnpm workspace 的根因修复（仅做决策）

### 依赖
- Dev Agent: 提供 Playwright 调试环境支持
- Architect Agent: 确认 MSW 架构方案
- Reviewer Agent: 代码审查新增测试文件

---

*本文档由 PM Agent 生成于 2026-04-08*
