# PRD: VibeX 测试基础设施深化方案

**项目**: vibex-tester-proposals-vibex-proposals-20260410
**版本**: 1.0
**日期**: 2026-04-10
**类型**: 测试质量深化
**状态**: Draft

---

## 1. 执行摘要

### 1.1 背景

VibeX 是 DDD Canvas 生成平台，前端 Next.js + React + TypeScript，后端 Cloudflare Workers (Hono) + D1。前端测试资产规模：58 个 E2E spec、7 个 Canvas Hook 测试、1 个 Contract 测试文件（318 行）。

2026-04-08 → 2026-04-10 期间，新增 GitHub Actions E2E CI、Vitest Jest 兼容层、多个 Canvas Hook 测试。但更深层的结构性问题在此次深入分析中暴露：

1. **Playwright 双重配置冲突**：CI 实际使用 `tests/e2e/playwright.config.ts`（expect=10s），与根配置（30s）冲突
2. **stability.spec.ts 检查路径错误**：检查 `./e2e/` 而非 `./tests/e2e/`，目录不存在导致检查形同虚设
3. **@ci-blocking grepInvert 仍在激活**：CI 跳过 35+ 核心用户流程测试
4. **关键 Hook 测试被 exclude**：`useAIController` 和 `useAutoSave` 无法在 CI 中运行

这些问题共同导致：CI 测试覆盖率虚高（跳过核心路径）、稳定性监控失效（检查不存在目录）、配置矛盾（timeout 阈值不一致）。

### 1.2 目标

1. **消除 Playwright 配置混乱**：建立单一配置源，CI 使用根配置
2. **修复稳定性监控**：stability.spec.ts 指向正确路径，监控真正生效
3. **恢复 E2E 测试覆盖率**：移除 grepInvert，CI 运行全部 58 个测试
4. **激活 Hook 测试**：修复被 exclude 的 useAutoSave/useAIController 测试

### 1.3 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| Playwright 配置文件数量 | 2（冲突） | 1 |
| stability.spec.ts 路径正确性 | ❌ 检查不存在目录 | ✅ 检查 `./tests/e2e/` |
| E2E CI 运行测试数量 | ~15（有 grepInvert 跳过） | ≥ 50 |
| Hook 测试激活率 | 5/7 运行 | 7/7 运行 |
| waitForTimeout 残留数 | 20+ | 0 |
| CI E2E pass rate | 未知（核心路径被跳过） | ≥ 90% |

---

## 2. Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F1.1 | Playwright 配置统一 | 合并两个配置文件，删除 tests/e2e/playwright.config.ts，CI 使用根配置 | T-P0-1 | 0.5d |
| F1.2 | stability.spec.ts 路径修复 | 修正检查路径从 `./e2e/` 到 `./tests/e2e/`，添加目录存在性断言 | T-P0-2 | 0.5d |
| F1.3 | grepInvert 移除 | 从配置中移除 grepInvert，让所有 @ci-blocking 测试在 CI 运行 | T-P0-3 | 0.1d |
| F2.1 | waitForTimeout 清理 | 替换 20+ 处 waitForTimeout 为确定性等待（网络响应、状态选择器） | T-P1-3 | 1d |
| F3.1 | useAIController 测试激活 | 迁移 jest.* 语法到 vi.*，纳入 Vitest 运行范围 | T-P1-1 | 1d |
| F3.2 | useAutoSave 测试激活 | 调查并修复被 exclude 原因，恢复 CI 保障 | T-P1-2 | 1d |
| F4.1 | canvas-e2e project 修复 | 修正 testDir 从 `./e2e` 到 `./tests/e2e` | T-P2-1 | 0.5d |
| F5.1 | flows.contract.spec.ts | 新增 flows API 合约测试，参考 sync.contract.spec.ts 模式 | P3-1 | 0.5d |
| F5.2 | Stryker 方案决策 | 评估 Docker CI / 替代指标 / Vitest runner，产出决策记录 | P3-2 | 0.5d |

**总工时**: 6 人天（Epic 1-5 并行 Sprint 1 + Epic 5 单独 Sprint 2）

---

## 3. Epic 拆分

### Epic 1: Playwright 配置统一与 CI 修复

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 合并 Playwright 配置 | 0.5d | tests/e2e/playwright.config.ts 不存在；根配置包含原内部配置的 webServer；CI workflow 使用根配置 |
| S1.2 | 移除 grepInvert | 0.1d | grepInvert 不存在于任何活跃 Playwright 配置 |
| S1.3 | 端到端 CI 验证 | 0.5d | `CI=true npx playwright test` 使用根配置（expect timeout=30000ms） |

### Epic 2: 稳定性监控修复

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | 修复 stability.spec.ts 路径 | 0.5d | E2E_DIR 指向 `./tests/e2e/`；目录不存在时测试 FAIL；stability.spec.ts 运行时无 "0 tests found" |
| S2.2 | 验证 F1.1/F1.2/F1.3 通过 | 0.25d | stability.spec.ts 全部 F1 检查运行成功 |

### Epic 3: waitForTimeout 清理

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 清理 conflict-resolution.spec.ts | 0.25d | 8 处 waitForTimeout 替换为 waitForResponse/waitForSelector；0 残留 |
| S3.2 | 清理 conflict-dialog.spec.ts | 0.25d | 6 处 waitForTimeout 替换；0 残留 |
| S3.3 | 清理 auto-save.spec.ts | 0.25d | 5 处 waitForTimeout 替换；0 残留 |
| S3.4 | 清理其他 spec 文件 | 0.25d | homepage-tester-report.spec.ts、login-state-fix.spec.ts 中 3 处替换；添加 ESLint 规则检测新增 |

### Epic 4: Hook 测试激活

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | useAIController 测试修复 | 1d | jest.* 语法迁移到 vi.*；`npx vitest run useAIController.test.tsx` 0 failures |
| S4.2 | useAutoSave 测试修复 | 1d | 调查 exclude 根因；修复 sendBeacon/localStorage mock；`npx vitest run useAutoSave.test.ts` 0 failures |
| S4.3 | 从 vitest.config.ts 移除 exclude | 0.25d | useAutoSave 和 useCanvasExport 不在 exclude 列表中 |

### Epic 5: canvas-e2e 修复与 Contract 扩展

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S5.1 | canvas-e2e testDir 修复 | 0.5d | testDir 从 `./e2e` 改为 `./tests/e2e`；`playwright test --project=canvas-e2e --list` 找到 ≥1 测试 |
| S5.2 | flows.contract.spec.ts 新增 | 0.5d | 文件存在；使用 Zod schema validation；覆盖 flows CRUD API |
| S5.3 | Stryker 方案决策 | 0.5d | docs/decisions/stryker-approach.md 存在；明确选择 A/B/C 并记录理由 |

---

## 4. 验收标准（逐 Story）

### S1.1: 合并 Playwright 配置

```bash
# AC1: tests/e2e/playwright.config.ts 不存在
test -f vibex-fronted/tests/e2e/playwright.config.ts && echo "FAIL" || echo "PASS"

# AC2: 根配置包含原内部配置的 webServer
grep "webServer" vibex-fronted/playwright.config.ts && echo "PASS"

# AC3: CI workflow 使用根配置
grep "playwright.config.ts" .github/workflows/test.yml
# 不应指向 tests/e2e/playwright.config.ts
```

### S1.2: 移除 grepInvert

```bash
# AC4: grepInvert 不存在于任何配置
grep "grepInvert" vibex-fronted/playwright.config.ts vibex-fronted/tests/e2e/playwright.config.ts 2>/dev/null
# 应无输出
```

### S1.3: CI 配置验证

```bash
# AC5: expect timeout = 30000
grep -A1 "expect:" vibex-fronted/playwright.config.ts
# 输出包含 timeout: 30000
```

### S2.1: stability.spec.ts 路径修复

```bash
# AC6: E2E_DIR 指向正确路径
grep "E2E_DIR" vibex-fronted/tests/e2e/stability.spec.ts
# 包含 ./tests/e2e/ 而非 ./e2e/

# AC7: 目录存在性检查存在
grep "existsSync\|isDirectory\|assert" vibex-fronted/tests/e2e/stability.spec.ts
# 有至少一个存在性检查

# AC8: stability.spec.ts 运行时正常
cd vibex-fronted && npx playwright test stability.spec.ts --project=chromium 2>&1
# 不包含 "0 tests found" 或 "no tests found"
```

### S3.1-S3.4: waitForTimeout 清理

```bash
# AC9: 无 waitForTimeout 残留（排除注释和 FIXME）
grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ \
  --include="*.spec.ts" \
  -v "flaky\|comment\|FIXME\|//\|/\*"
# 返回 0 行

# AC10: ESLint 规则检测新增
grep "waitForTimeout" vibex-fronted/.eslintrc* 2>/dev/null
# 或: rules 数组中有对应规则
```

### S4.1: useAIController 测试修复

```bash
# AC11: 无 jest.* 语法
grep "jest\." vibex-fronted/src/hooks/canvas/useAIController.test.tsx
# 应无输出（使用 vi.* 替代）

# AC12: 测试通过
cd vibex-fronted && npx vitest run src/hooks/canvas/useAIController.test.tsx --reporter=verbose
# 0 failures
```

### S4.2: useAutoSave 测试修复

```bash
# AC13: 测试通过
cd vibex-fronted && npx vitest run src/hooks/canvas/__tests__/useAutoSave.test.ts --reporter=verbose
# 0 failures
```

### S4.3: 移除 exclude

```bash
# AC14: useAutoSave 不在 exclude 列表
grep "useAutoSave" vibex-fronted/tests/unit/vitest.config.ts
# 应无 exclude 匹配
```

### S5.1: canvas-e2e testDir 修复

```bash
# AC15: testDir 指向正确目录
grep -A5 "name: 'canvas-e2e'" vibex-fronted/playwright.config.ts | grep "testDir"
# 包含 ./tests/e2e

# AC16: canvas-e2e 项目找到测试
npx playwright test --project=canvas-e2e --list 2>/dev/null | grep "·" | wc -l
# >= 1
```

### S5.2: flows.contract.spec.ts

```bash
# AC17: flows.contract.spec.ts 存在且通过
test -f vibex-fronted/tests/contract/flows.contract.spec.ts && echo "PASS"
cd vibex-fronted && npx playwright test tests/contract/flows.contract.spec.ts
# 0 failures
```

### S5.3: Stryker 决策

```bash
# AC18: 决策记录存在
test -f vibex-fronted/docs/decisions/stryker-approach.md && echo "PASS"
```

---

## 5. Definition of Done

### Epic 1 Done
- [ ] `tests/e2e/playwright.config.ts` 文件已删除
- [ ] `vibex-fronted/playwright.config.ts` 包含 webServer 和所有必要配置
- [ ] `.github/workflows/test.yml` 使用根配置
- [ ] AC1-AC5 全部通过

### Epic 2 Done
- [ ] `stability.spec.ts` 中 E2E_DIR 指向 `./tests/e2e/`
- [ ] 目录不存在时测试 FAIL（添加断言）
- [ ] `stability.spec.ts` 运行成功（找到测试）
- [ ] AC6-AC8 全部通过

### Epic 3 Done
- [ ] `tests/e2e/*.spec.ts` 中无 waitForTimeout 残留
- [ ] ESLint 规则能检测新增的 waitForTimeout
- [ ] AC9-AC10 全部通过

### Epic 4 Done
- [ ] `useAIController.test.tsx` 使用 vi.* 语法
- [ ] `useAutoSave.test.ts` 运行通过（不被 exclude）
- [ ] vitest.config.ts 中移除对应 exclude 规则
- [ ] AC11-AC14 全部通过

### Epic 5 Done
- [ ] canvas-e2e testDir 修正
- [ ] flows.contract.spec.ts 存在并通过
- [ ] Stryker 决策文档存在
- [ ] AC15-AC18 全部通过

### 全局 DoD
- [ ] GitHub Actions CI E2E job 通过率 ≥ 90%
- [ ] 所有修改已 commit 到 main 分支
- [ ] PR 经过至少 1 人 review

---

## 6. 功能点汇总表（含页面集成标注）

| 功能点 | 涉及文件/目录 | 页面集成 | 类型 |
|--------|-------------|---------|------|
| Playwright 配置统一 | playwright.config.ts, tests/e2e/playwright.config.ts | 无（CI 配置） | CI |
| stability.spec.ts 路径修复 | tests/e2e/stability.spec.ts | 无（稳定性监控） | CI |
| grepInvert 移除 | playwright.config.ts, tests/e2e/playwright.config.ts | 无（CI 配置） | CI |
| waitForTimeout 清理 | tests/e2e/conflict-resolution.spec.ts, conflict-dialog.spec.ts, auto-save.spec.ts 等 | 无（E2E 测试） | E2E |
| useAIController 测试修复 | src/hooks/canvas/useAIController.test.tsx | 无（单元测试） | Unit |
| useAutoSave 测试修复 | src/hooks/canvas/__tests__/useAutoSave.test.ts, tests/unit/vitest.config.ts | 无（单元测试） | Unit |
| canvas-e2e project 修复 | playwright.config.ts | 无（CI 配置） | CI |
| flows.contract.spec.ts | tests/contract/flows.contract.spec.ts | 无（Contract 测试） | Contract |
| Stryker 决策 | stryker.conf.json, docs/decisions/stryker-approach.md | 无（配置/文档） | Config |

> **说明**: 本次所有改动均为测试基础设施层面，不涉及前端 UI 页面或 API 接口的改动。所有功能点无需用户交互验证。

---

## 7. 实施计划（Sprint 排期）

### Sprint 1: 止血与配置统一（5 人天）

| Day | Epic | Story | 产出 |
|------|------|-------|------|
| Day 1 AM | Epic 1 | S1.1 + S1.2 + S1.3 | 单一 Playwright 配置；grepInvert 移除 |
| Day 1 PM | Epic 2 | S2.1 + S2.2 | stability.spec.ts 路径修复；F1 检查通过 |
| Day 2 | Epic 3 | S3.1 + S3.2 + S3.3 + S3.4 | waitForTimeout 清理完成；ESLint 规则 |
| Day 3 | Epic 4 | S4.1 | useAIController 测试激活并通过 |
| Day 4 | Epic 4 | S4.2 + S4.3 | useAutoSave 测试激活；exclude 移除 |
| Day 5 | Epic 5 | S5.1 | canvas-e2e testDir 修复；CI 端到端验证（E2E pass rate ≥ 90%） |

**Sprint 1 结束条件**: Epic 1-4 DoD 全部达成；CI E2E 通过率 ≥ 90%

### Sprint 2: 扩展与决策（1.5 人天）

| Day | Epic | Story | 产出 |
|------|------|-------|------|
| Day 6 | Epic 5 | S5.2 | flows.contract.spec.ts 新增 |
| Day 7 | Epic 5 | S5.3 | Stryker 决策文档 |

**Sprint 2 结束条件**: Epic 5 DoD 全部达成；全量 DoD 达成

### Sprint 排期概览

```
Week 1
Mon  Day 1  Epic1(S1.1-1.3) + Epic2(S2.1-2.2)
Tue  Day 2  Epic3(S3.1-3.4) waitForTimeout清理
Wed  Day 3  Epic4(S4.1) useAIController修复
Thu  Day 4  Epic4(S4.2-4.3) useAutoSave激活
Fri  Day 5  Epic5(S5.1) canvas-e2e修复 + CI验证

Week 2
Mon  Day 6  Epic5(S5.2) flows.contract.spec.ts
Tue  Day 7  Epic5(S5.3) Stryker决策 + 收尾
```

### 关键风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 移除 grepInvert 后 CI 失败率上升 | 高 | 高 | 设置 pass rate ≥ 90% 目标；允许分批修复失败的 @ci-blocking 测试 |
| useAutoSave.exclude 根因复杂 | 中 | 中 | Day 3 专门安排诊断时间，超时则记录根因后延后 |
| stability.spec.ts 修复后暴露大量 waitForTimeout | 高 | 中 | Day 2 已安排清理，提前扫描估算修复量 |

---

## 8. 非功能需求

- **兼容性**: 所有修改不影响本地开发体验（本地 `pnpm run test:e2e` 正常）
- **CI 性能**: E2E CI job 执行时间 ≤ 30 分钟（当前 ~15 分钟，增加测试后可能延长，需监控）
- **测试稳定性**: waitForTimeout 清理后，CI 稳定性应提升（无网络/CI 慢速导致的 timeout）
- **向后兼容**: 删除 `tests/e2e/playwright.config.ts` 前，本地开发需验证根配置完整性

---

## 9. 决策点（待确认）

1. **daily-stability.md**: 是否作为后续 Epic 单独处理？（方案 A 不包含）
2. **MSW 引入**: 是否在 Sprint 2 之后评估引入？
3. **@ci-blocking 清理节奏**: 全部移除（本次）还是分批评估（后续）？
4. **Stryker 决策**: Docker CI / 替代指标 / Vitest runner 三选一

---

*本 PRD 由 PM Agent 生成于 2026-04-10*
*输入: docs/vibex-tester-proposals-vibex-proposals-20260410/analysis.md, tester.md*
