# PRD: VibeX 测试质量改进

**项目**: vibex-tester-quality-20260410
**版本**: v1.0
**日期**: 2026-04-10
**状态**: Draft

---

## 1. 执行摘要

### 背景

VibeX 当前测试基础设施存在 3 个 P0 阻断问题，严重影响 CI 可靠性和测试覆盖可信度：

1. **Playwright 双重配置冲突**: 根配置 `expect.timeout=30s` vs `tests/e2e/playwright.config.ts` 的 `expect.timeout=10s`，CI 实际使用后者，导致 E2E 测试不稳定
2. **stability.spec.ts 形同虚设**: 检查路径 `./e2e/`（不存在），永远 PASS，掩盖了真实违规
3. **@ci-blocking 跳过 35+ 测试**: `grepInvert` 配置使 CI 跳过所有带 `@ci-blocking` 标记的测试，测试覆盖率严重失真

此外存在 Jest/Vitest 双框架维护负担和 20+ 处 `waitForTimeout` 硬编码等待。

### 目标

- CI 100% 运行所有测试用例，无跳过
- stability.spec.ts 真实反映测试稳定性指标
- 消除测试框架双重维护负担
- 移除所有硬编码等待，替换为智能等待策略

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| CI E2E 测试通过数 | <15（大量跳过） | ≥50 |
| stability.spec.ts 实际检查文件数 | 0（路径错误） | >0 |
| @ci-blocking 跳过测试数 | 35+ | 0 |
| waitForTimeout 残留数 | 20+ | 0 |
| 测试框架数量 | 2（Jest+Vitest） | 1（Vitest） |

---

## 2. Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|----------|------|
| F1 | Playwright 配置统一 | 删除 `tests/e2e/playwright.config.ts`，统一使用根配置 | T-P0-1 | 1.5h |
| F2 | stability.spec.ts 路径修复 | 修复检查路径为 `tests/e2e/`，添加目录存在性断言 | T-P0-2 | 1h |
| F3 | @ci-blocking 测试清理 | 移除 grepInvert，评估并制定 @ci-blocking 测试修复计划 | T-P0-3 | 1.5h |
| F4 | Vitest 框架统一 | 迁移 Jest 语法测试到 Vitest，废弃 Jest 配置 | T-P0-4 | 2.5h |
| F5 | waitForTimeout 清理 | 替换 conflict-resolution/conflict-dialog/auto-save 中的硬编码等待 | T-P1-3 | 2.5h |

**总工时: 9h**

---

## 3. Epic 拆分

### Epic 1: Playwright 双重配置统一

| Epic | Story | 描述 | 工时 | 验收标准 |
|------|-------|------|------|----------|
| E1 | S1.1 | 删除 `tests/e2e/playwright.config.ts` | 0.5h | 仅保留根配置文件 `playwright.config.ts`，项目内无其他 Playwright 配置 |
| E1 | S1.2 | 迁移 `webServer`+`grepInvert` 到根配置 | 0.5h | CI workflow 启动命令不变，`grepInvert` 字段从 `tests/e2e/` 配置迁移到根配置（或删除） |
| E1 | S1.3 | 验证 CI 实际使用根配置 | 0.5h | `npx playwright test --list` 输出显示 `expect timeout >= 30000ms` |

### Epic 2: stability.spec.ts 路径修复

| Epic | Story | 描述 | 工时 | 验收标准 |
|------|-------|------|------|----------|
| E2 | S2.1 | 修复路径到 `tests/e2e/` | 0.5h | stability.spec.ts 中文件路径检查指向 `tests/e2e/` 目录，非 `./e2e/` |
| E2 | S2.2 | 添加目录存在性断言 | 0.5h | `tests/e2e/` 目录不存在时，测试应 FAIL 并报错 |

### Epic 3: @ci-blocking grepInvert 移除

| Epic | Story | 描述 | 工时 | 验收标准 |
|------|-------|------|------|----------|
| E3 | S3.1 | 移除 grepInvert 配置 | 0.5h | `tests/e2e/playwright.config.ts` 删除后，根配置中无 `grepInvert` 字段 |
| E3 | S3.2 | 评估 @ci-blocking 测试可修复性 | 1h | 输出 `docs/vibex-tester-quality-20260410/ci-blocking-audit.md`，包含 35+ 测试的修复优先级排序 |

### Epic 4: Vitest 框架统一

| Epic | Story | 描述 | 工时 | 验收标准 |
|------|-------|------|------|----------|
| E4 | S4.1 | 迁移 `useAIController.test.tsx` 到 `vi.*` | 1h | 文件改用 `vi.fn()`/`vi.mock()`，运行 `vitest run` 不报错 |
| E4 | S4.2 | 修复 `useAutoSave.test.ts` mock 问题 | 1h | 移除 Jest exclude 规则，`vitest run` 正常执行 |
| E4 | S4.3 | Jest config 清理/废弃标记 | 0.5h | Jest 配置文件添加废弃注释或删除，`package.json` 无 `test:jest` 脚本 |

### Epic 5: waitForTimeout 清理

| Epic | Story | 描述 | 工时 | 验收标准 |
|------|-------|------|------|----------|
| E5 | S5.1 | 替换 `conflict-resolution.spec.ts` 8处 | 1h | 文件内 `waitForTimeout` 数量 = 0，替换为 `waitForResponse`/`waitForSelector` |
| E5 | S5.2 | 替换 `conflict-dialog.spec.ts` 6处 | 1h | 文件内 `waitForTimeout` 数量 = 0 |
| E5 | S5.3 | 替换 `auto-save.spec.ts` 5处 | 0.5h | 文件内 `waitForTimeout` 数量 = 0 |

---

## 4. 验收标准

### AC1: Playwright 配置统一
```
Given: 运行 npx playwright test --list
When:  在 CI 环境中执行
Then:  仅加载一个配置文件，所有 expect timeout >= 30000ms
```

### AC2: stability.spec.ts 路径正确
```
Given: tests/e2e/ 目录存在且包含 .spec.ts 文件
When:  运行 stability.spec.ts
Then:  检测到实际违规数量 > 0，且失败时报告真实文件列表
```

### AC3: 无 grepInvert 配置
```
Given: playwright.config.ts（根配置）
When:  检查 grepInvert 字段
Then:  grepInvert === undefined 或 grepInvert 为空数组
```

### AC4: Vitest 运行所有测试
```
Given: 运行 vitest run
When:  无 --exclude 参数
Then:  所有 .test.ts / .test.tsx 文件均被执行，无跳过
```

### AC5: E2E 测试通过数
```
Given: CI 环境运行 npx playwright test
When:  全部测试执行完成
Then:  通过数 >= 50，无测试被 grepInvert 跳过
```

### AC6: waitForTimeout 零残留
```
Given: 在 tests/e2e/*.spec.ts 中搜索 waitForTimeout
When:  grep -r "waitForTimeout" tests/e2e/
Then:  输出为空（退出码 1）
```

---

## 5. Definition of Done

- [ ] 所有 E1-E5 Epic 的 Story 验收标准通过
- [ ] CI pipeline 运行 `npx playwright test` 通过（无 skipped）
- [ ] `stability.spec.ts` 在有违规时正确 FAIL
- [ ] `vitest run` 执行全部测试无跳过
- [ ] `grep -r "waitForTimeout" tests/e2e/` 返回空
- [ ] 所有代码变更已 commit，PR review 通过
- [ ] `ci-blocking-audit.md` 已产出

---

## 6. 功能点汇总表

| ID | 功能 | 涉及文件/目录 | 页面集成 |
|----|------|--------------|----------|
| F1 | Playwright 配置统一 | `playwright.config.ts`, `tests/e2e/playwright.config.ts` | 无（配置层） |
| F2 | stability.spec.ts 修复 | `tests/e2e/stability.spec.ts` | 无（质量监控） |
| F3 | @ci-blocking 清理 | `tests/e2e/playwright.config.ts`, CI workflow | CI/CD |
| F4 | Vitest 统一 | `src/**/useAIController.test.tsx`, `src/**/useAutoSave.test.ts`, `jest.config.*` | 无（测试框架） |
| F5 | waitForTimeout 清理 | `tests/e2e/conflict-resolution.spec.ts`, `conflict-dialog.spec.ts`, `auto-save.spec.ts` | 冲突解决对话框、自动保存 |

---

## 7. 实施计划

### Sprint 1: P0 阻断问题修复（3h）

| Day | 任务 | 负责 |
|-----|------|------|
| Day 1 AM | E1: 删除双重配置，迁移 webServer | dev |
| Day 1 PM | E2: 修复 stability.spec.ts 路径 | dev |
| Day 1 PM | E3: 移除 grepInvert，评估 @ci-blocking | dev |

### Sprint 2: 框架统一 + 等待清理（6h）

| Day | 任务 | 负责 |
|-----|------|------|
| Day 2 AM | E4.1: 迁移 useAIController.test.tsx 到 Vitest | dev |
| Day 2 PM | E4.2: 修复 useAutoSave.test.ts mock，清理 Jest | dev |
| Day 3 AM | E5.1: 替换 conflict-resolution.spec.ts 8处 | dev |
| Day 3 PM | E5.2: 替换 conflict-dialog.spec.ts 6处 | dev |
| Day 4 AM | E5.3: 替换 auto-save.spec.ts 5处 | dev |
| Day 4 PM | E3.2: 完成 ci-blocking-audit.md | dev/analyst |

### 验证阶段

| 步骤 | 验证内容 |
|------|----------|
| V1 | `npx playwright test --list` 仅一个配置 |
| V2 | `stability.spec.ts` 有违规时 FAIL |
| V3 | CI `npx playwright test` 通过数 >= 50 |
| V4 | `grep -r "waitForTimeout" tests/e2e/` 为空 |
| V5 | `vitest run` 无跳过 |

---

*文档版本: v1.0 | 2026-04-10*
