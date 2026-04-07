# Spec: E3 - @ci-blocking 测试清理

**Epic**: E3
**来源**: T-P0-3
**工时**: 1.5h
**状态**: Draft

---

## 1. Overview

移除 Playwright 配置中的 `grepInvert: /@ci-blocking/` 设置，停止跳过标记测试，同时评估 35+ 个 @ci-blocking 测试的可修复性并制定清理计划。

## 2. Problem Statement

`tests/e2e/playwright.config.ts` 中配置了 `grepInvert: /@ci-blocking/`，导致 CI 跳过所有带 `@ci-blocking` 标记的测试用例。这掩盖了真实的测试覆盖率和稳定性问题。

## 3. Technical Spec

### 3.1 移除 grepInvert

**操作**: 删除 E1 时同步移除 `grepInvert` 字段（见 E1 Spec）

### 3.2 @ci-blocking 测试审计

**目标**: 产出 `ci-blocking-audit.md`，对 35+ 个 @ci-blocking 测试进行分类：

```markdown
# @ci-blocking 测试审计报告

## 统计概览
- 总数: N
- 可快速修复（<30min）: X
- 需中度重构（30min-2h）: Y
- 需重大重构（>2h）: Z

## 分类清单

### 🔴 需重大重构 (>2h)
| 文件 | 行号 | 原因 | 建议 |
|------|------|------|------|
| xxx.spec.ts | 42 | 依赖外部服务 |  Mock 或降级为集成测试 |

### 🟡 需中度重构 (30min-2h)
| 文件 | 行号 | 原因 | 建议 |
|------|------|------|------|
| yyy.spec.ts | 15 | 计时器 flakiness | 改用 smart wait |

### 🟢 可快速修复 (<30min)
| 文件 | 行号 | 原因 | 建议 |
|------|------|------|------|
| zzz.spec.ts | 8 | 仅需移除标记 | 移除 @ci-blocking |
```

**优先级排序原则**:
1. 标记过时/已修复的测试 → 移除标记
2. 简单环境问题 → 修复并移除标记
3. 复杂依赖问题 → 评估 ROI，决定是否重构或降级

### 3.3 清理执行

**立即执行**（不需额外工时）:
- 扫描 `@ci-blocking` 标记，识别已修复/过时的测试
- 直接移除过时测试的 `@ci-blocking` 标记

**纳入后续迭代**:
- 中度/重大重构的测试，纳入 backlog，按优先级排入后续 Sprint

## 4. Acceptance Criteria

### S3.1: grepInvert 已移除
```bash
grep -r "grepInvert" playwright.config.ts tests/e2e/
# 期望: 无输出
```

### S3.2: 审计报告产出
```bash
test -f docs/vibex-tester-quality-20260410/ci-blocking-audit.md
# 期望: 文件存在且包含分类清单
```

## 5. Out of Scope

- 实际修复所有 @ci-blocking 测试（本 Epic 仅做审计和计划）
- @flaky 标记的处理（其他 Epic）

## 6. Dependencies

- 依赖 E1 完成（grepInvert 在 E1 中删除）

## 7. Rollback Plan

如 CI 因 @ci-blocking 测试失败需要回退，可在 Playwright 配置中临时添加 `grepInvert: /@ci-blocking/`。
