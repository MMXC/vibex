# PRD: CI Coverage Gate Enforcement

> **项目**: test-coverage-gate  
> **目标**: 修复 CI 覆盖率门禁配置，实现自动阻止覆盖率下降  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
CI 不强制执行覆盖率阈值：Vitest 实际运行器读取 `jest.config.ts`（配置错位），85% 阈值远高于当前 79.06%，门禁形同虚设。

### 目标
- P0: 修复 Vitest 配置（coverageThreshold 在 vitest.config.ts）
- P1: 调整阈值为实际可达值
- P1: 创建 coverage baseline
- P2: fork PR 覆盖率检查

### 成功指标
- AC1: Vitest 读取正确的配置文件
- AC2: 覆盖率阈值生效（CI 失败检测）
- AC3: baseline 存在

---

## 2. Epic 拆分

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | Vitest 配置修复 | P0 | 1h |
| E2 | 阈值调整 | P1 | 0.5h |
| E3 | Coverage Baseline | P1 | 0.5h |
| E4 | Fork PR 检查 | P2 | 1h |
| **合计** | | | **3h** |

---

### E1: Vitest 配置修复

**问题根因**: `jest.config.ts` 中 coverageThreshold 配置，但 Vitest 不读取。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 创建 vitest.config.ts | 1h | `expect(vitestConfig).toContain('coverageThreshold')` ✓ |

**验收标准**:
- `expect(config).toBeDefined()` ✓
- `expect(config.coverageThreshold).toBeDefined()` ✓
- `expect(vitest.run()).toPass()` ✓

---

### E2: 阈值调整

**问题根因**: 85% 阈值高于当前 79.06%，门禁无效。

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 调整阈值 | 0.5h | `expect(threshold).toBeLessThan(85)` ✓ |

**验收标准**:
- `expect(threshold).toBeGreaterThan(current)` ✓
- 分阶段达成：Lines 80%, Branches 65%

---

### E3: Coverage Baseline

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | 创建 baseline | 0.5h | `expect(baseline).toBeDefined()` ✓ |

**验收标准**:
- `expect(baseline.lines).toBeGreaterThan(0)` ✓
- `expect(baseline.branches).toBeGreaterThan(0)` ✓

---

### E4: Fork PR 检查

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | Fork PR 覆盖检查 | 1h | `expect(ci.runsOnFork).toBe(true)` ✓ |

**验收标准**:
- fork PR 也能运行覆盖率检查 ✓
- 阈值同样生效 ✓

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | vitest.config.ts | E1 | expect(config.coverageThreshold).toBeDefined() | 无 |
| F2.1 | 阈值调整 | E2 | expect(threshold.lines).toBe(80) | 无 |
| F3.1 | Coverage Baseline | E3 | expect(baseline).toBeDefined() | 无 |
| F4.1 | Fork PR 检查 | E4 | expect(forkRun).toBe(true) | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 运行 Vitest | `vitest run` | 读取 vitest.config.ts |
| AC2 | 覆盖率 < 阈值 | CI | 失败 |
| AC3 | Fork PR | push | 覆盖率检查运行 |
| AC4 | baseline 存在 | 首次运行 | 文件创建 |

---

## 5. DoD

- [ ] `vitest.config.ts` 创建，coverageThreshold 配置正确
- [ ] Lines 阈值 80%，Branches 阈值 65%
- [ ] `coverage/baseline.json` 创建
- [ ] Fork PR 覆盖率检查运行

---

## 6. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 阈值过低导致质量下降 | 分阶段调整，逐步提高 |
| baseline 更新繁琐 | 自动化更新流程 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
