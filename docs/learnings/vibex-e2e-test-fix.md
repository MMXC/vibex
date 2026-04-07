# 经验沉淀: vibex-e2e-test-fix

> **项目**: vibex-e2e-test-fix
> **完成时间**: 2026-04-05
> **沉淀时间**: 2026-04-05 12:06

---

## 问题描述

E2E 测试环境存在稳定性问题：Playwright 与 Jest 框架冲突、`test.skip` 历史债务、`@ci-blocking` 标记失控、`BASE_URL` 硬编码。

## 根因分析

1. **测试框架边界模糊**: Jest 和 Playwright 配置混用，导致进程冲突
2. **测试跳过失控**: `test.skip` 无人追踪，变成永久跳过
3. **CI 稳定性标记滥用**: `@ci-blocking` 标记无法被 CI 自动识别跳过
4. **环境配置硬编码**: `BASE_URL` 硬编码为 `localhost:3002`，无法适配 CI/本地不同环境

## 解决方案

### E1 (Playwright 隔离) ✅
- 新建 `tests/e2e/playwright.config.ts` 独立 Playwright 配置
- 消除 Jest/Playwright 框架冲突
- 添加 `BASE_URL` 环境变量支持
- `test.skip` + fixme 注释标注历史债务

### E2 (@ci-blocking 处理) ✅
- `grepInvert: /@ci-blocking/` 配置，CI 环境自动跳过标记测试
- `@ci-blocking:` 前缀添加到 vue-components/conflict-resolution/undo-redo 测试名
- 本地可选择性执行

### E3 (测试环境配置) ✅
- `BASE_URL` 环境变量支持（默认 localhost:3000）
- npm scripts: `test:e2e` / `test:e2e:ci` / `test:e2e:local`

**关键技术决策**: `grepInvert` 优于 `test.skip()` API，因为可以在运行时控制，无需修改测试代码。

## 关键教训

### 1. PRD Epic 划分 vs 实际实现的颗粒度差异
**现象**: PRD 定义了 3 个独立 Epic（E1/E2/E3），但实际实现中 E1 的 scope 涵盖了全部 3 个 Epic 的功能。
**原因**: E2（@ci-blocking）和 E3（BASE_URL）本质上是 Playwright 配置的子功能，与 E1（Playwright 隔离）不可分割。
**防范**: 当 Epic 之间存在实现依赖时，应合并 Epic 而非强行拆分。PRD 是"需求视图"，实现时允许根据技术耦合度重新组织。

### 2. IMPLEMENTATION_PLAN 与 PRD 的 Scope Drift
**现象**: IMPLEMENTATION_PLAN 创建了新的 E2（"Jest/Vitest 分离"）和 E3（"CI Gate 搭建"），这两个 Epic 不在原始 PRD 中。
**根因**: Architect 在设计 IMPLEMENTATION_PLAN 时扩展了 scope，将"测试框架分离"和"CI Pipeline"也纳入。
**问题**: 导致 task chain 有 3 个 Epic 的任务链，但实际只有 E1 被执行；E2 和 E3 的 task 永远是 pending。
**防范**: IMPLEMENTATION_PLAN 的 scope 必须严格对照 PRD，不得超出 PRD 范围。如需扩展，必须走需求变更流程。

### 3. 虚假完成检测的重要性
**现象**: 项目的 `status: "completed"` 已在 JSON 中，但 E2/E3 的 task chain 全部是 pending/ready。
**检测**: task_manager.py 的 `current-report` 会报告待执行任务 > 0，但 coord-completed 仍然被触发（因为 `coord-completed` 的 dependsOn 是 3 个 reviewer-push，而第一个 reviewer-push-epic1 已经 done）。
**防范**: 项目完成判定必须验证所有 Epic 的 task chain 状态，不能仅依赖 project-level status。

### 4. CHANGELOG 合并记录的合理性
**现象**: E1 的 CHANGELOG entry 包含了 E2 和 E3 的功能描述（"grepInvert 跳过 @ci-blocking" + "BASE_URL 环境变量"）。
**判断**: 这是合理的。因为 E1/E2/E3 是同一 commit 实现的，CHANGELOG 以 commit 为单位记录。
**但**: 如果 E2/E3 有独立的 task chain，理论上应该有独立的 CHANGELOG entry。当前做法是"功能全归 E1"，适用于合并实现的场景。

---

## 跨项目高阶模式

见 `MEMORY.md` 索引 #129（待追加）
