# PRD: Phase 1 基础设施优化

**项目**: vibex-phase1-infra-20260317
**版本**: 1.0
**日期**: 2026-03-17
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

Phase 1 基础设施优化，包含 React Query 全面集成、E2E 测试环境修复、测试覆盖率提升至 65%。

### 目标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 测试覆盖率 | 61.45% | 65% |
| E2E 通过率 | 未知 | ≥ 90% |
| React Query 集成 | 部分 | 全面 |

---

## 2. 功能需求

### F1: React Query 全面集成

**描述**: 将所有 API 调用迁移到 React Query hooks

**验收标准**:
- AC1.1: 所有 API 调用使用 React Query hooks
- AC1.2: QueryProvider 测试覆盖率 ≥ 90%
- AC1.3: 缓存配置统一

### F2: E2E 测试环境修复

**描述**: 修复 Playwright E2E 测试环境

**验收标准**:
- AC2.1: 所有 E2E 测试可运行
- AC2.2: E2E 通过率 ≥ 90%
- AC2.3: CI 环境测试正常

### F3: 测试覆盖率提升

**描述**: 提升测试覆盖率到 65%

**验收标准**:
- AC3.1: Lines 覆盖率 ≥ 65%
- AC3.2: Branches 覆盖率 ≥ 60%
- AC3.3: P0 文件覆盖率 ≥ 80%

---

## 3. Epic 拆分

### Epic 1: React Query 集成

**负责人**: Dev | **预估**: 2 天

| Story | 验收标准 |
|-------|----------|
| S1.1 迁移 useDDDStream | expect(usesReactQuery).toBe(true) |
| S1.2 迁移 useApiCall | expect(usesReactQuery).toBe(true) |
| S1.3 QueryProvider 测试补充 | expect(coverage).toBeAtLeast(90%) |
| S1.4 缓存配置优化 | expect(cacheConfig).toBeUnified() |

---

### Epic 2: E2E 测试环境

**负责人**: Tester | **预估**: 2 天

| Story | 验收标准 |
|-------|----------|
| S2.1 环境配置验证 | expect(playwright).toBeConfigured() |
| S2.2 修复失败测试 | expect(failures).toBe(0) |
| S2.3 CI 配置 | expect(ci).toPass() |

---

### Epic 3: 覆盖率提升

**负责人**: Tester | **预估**: 2 天

| Story | 验收标准 |
|-------|----------|
| S3.1 P0 文件测试 | expect(p0Coverage).toBeAtLeast(80%) |
| S3.2 P1 文件测试 | expect(p1Coverage).toBeAtLeast(60%) |
| S3.3 回归测试 | expect(allTests).toPass() |

---

## 4. 实施计划

| 阶段 | 任务 | 预估 |
|------|------|------|
| Phase 1 | React Query 迁移 | 2 天 |
| Phase 2 | E2E 环境修复 | 2 天 |
| Phase 3 | 覆盖率提升 | 2 天 |

**总计**: 6 人日

---

## 5. 验收 CheckList

- [ ] AC1.1: React Query hooks
- [ ] AC1.2: QueryProvider 覆盖率
- [ ] AC1.3: 缓存配置
- [ ] AC2.1: E2E 可运行
- [ ] AC2.2: 通过率 90%
- [ ] AC2.3: CI 正常
- [ ] AC3.1: Lines 65%
- [ ] AC3.2: Branches 60%
- [ ] AC3.3: P0 80%

---

**DoD**:
1. 所有 Epic 完成
2. 覆盖率达标
3. E2E 通过率 ≥ 90%
