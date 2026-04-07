# Analysis: VibeX 测试质量改进 2026-04-10

**日期**: 2026-04-10
**分析者**: Analyst Agent（重新执行）
**项目**: vibex-tester-quality-20260410

---

## 1. 执行摘要

基于 tester 提案深度分析，测试基础设施存在 3 个 P0 阻断问题（Playwright配置冲突、`stability.spec.ts`形同虚设、`@ci-blocking`跳过35+测试）。必须在Sprint 1优先修复。

---

## 2. Epic 拆分

### E1: Playwright 双重配置统一（来源：T-P0-1）

**问题**: 根配置 `expect=30s` vs `tests/e2e/` 配置 `expect=10s`，CI实际用后者。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 删除 `tests/e2e/playwright.config.ts` | 0.5h | 仅一个配置文件 |
| S1.2 | 迁移 `webServer`+`grepInvert` 到根配置 | 0.5h | CI workflow 不变 |
| S1.3 | 验证 CI 实际使用根配置 | 0.5h | `expect timeout >= 30s` |

### E2: stability.spec.ts 路径修复（来源：T-P0-2）

**问题**: 检查 `./e2e/`（不存在），永远 PASS，掩盖实际违规。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 修复路径到 `tests/e2e/` | 0.5h | 检查到实际违规数 |
| S2.2 | 添加目录存在性断言 | 0.5h | 目录不存在时 FAIL |

### E3: @ci-blocking grepInvert 移除（来源：T-P0-3）

**问题**: `tests/e2e/playwright.config.ts` 中 `grepInvert: /@ci-blocking/`，35+ 测试被跳过。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 移除 grepInvert 配置 | 0.5h | 所有测试在 CI 运行 |
| S3.2 | 评估 @ci-blocking 测试可修复性 | 1h | 制定清理计划 |

### E4: Vitest 框架统一（来源：T-P0-4）

**问题**: Jest+Vitest 双框架，`useAIController.test.tsx` 用 Jest 语法被排除。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | 迁移 `useAIController.test.tsx` 到 `vi.*` | 1h | Vitest 可运行 |
| S4.2 | 修复 `useAutoSave.test.ts` mock 问题 | 1h | 移除 exclude 规则 |
| S4.3 | Jest config 清理/废弃标记 | 0.5h | Jest 不再是主框架 |

### E5: waitForTimeout 清理（来源：T-P1-3）

**问题**: 20+ 处残留，分布在 `conflict-resolution`/`conflict-dialog`/`auto-save` 等。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | 替换 `conflict-resolution.spec.ts` 8处 | 1h | 无 `waitForTimeout` |
| S5.2 | 替换 `conflict-dialog.spec.ts` 6处 | 1h | 无 `waitForTimeout` |
| S5.3 | 替换 `auto-save.spec.ts` 5处 | 0.5h | 无 `waitForTimeout` |

---

## 3. JTBD

1. **CI 必须运行所有测试**: 不跳过任何测试用例
2. **稳定性指标真实**: stability.spec.ts 反映真实状态
3. **单一测试框架**: 消除双框架维护负担
4. **无硬编码等待**: 所有 `waitForTimeout` 替换为智能等待

---

## 4. 方案对比

### Playwright 配置统一

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A（推荐）| 删除 tests/e2e/ 配置，统一用根配置 | 1.5h | 低 |
| B | 保留双配置，CI 显式指定根配置 | 1h | 高（维护双重性） |

### Vitest vs Jest

| 方案 | 描述 | 工时 | 风险 |
|------|------|------|------|
| A（推荐）| 全面迁移 Vitest，废弃 Jest | 3h | 中（测试迁移） |
| B | 兼容层维持现状 | 0h | 高（维护双重性） |

---

## 5. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | `playwright test --config` | CI 环境 | 仅一个配置文件 |
| AC2 | `stability.spec.ts` | 运行 | 检查 `tests/e2e/` 目录 |
| AC3 | grepInvert | `tests/e2e/config` | 无此配置或为 undefined |
| AC4 | `vitest run` | 运行 | 所有测试执行（无 exclude） |
| AC5 | E2E | CI 环境 | 通过数 ≥ 50 |
| AC6 | `waitForTimeout` | `tests/e2e/*.spec.ts` | 0 处残留 |

---

## 6. 风险矩阵

| 风险 | 等级 | 缓解 |
|------|------|------|
| @ci-blocking 测试在 CI 中失败 | 🟡 中 | 制定修复计划，逐步移除标记 |
| Vitest 迁移破坏现有测试 | 🟡 中 | 先备份 Jest 配置 |
| waitForTimeout 替换后测试不稳定 | 🟢 低 | 使用 `waitForResponse`/`waitForSelector` 替代 |

---

## 7. 工时汇总

| Epic | 工时 |
|------|------|
| E1: Playwright 配置统一 | 1.5h |
| E2: stability.spec.ts 修复 | 1h |
| E3: @ci-blocking 移除 | 1.5h |
| E4: Vitest 统一 | 2.5h |
| E5: waitForTimeout 清理 | 2.5h |
| **合计** | **9h** |

---

*文档版本: v2.0（重新执行）| 2026-04-10*
