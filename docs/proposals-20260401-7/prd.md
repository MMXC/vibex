# PRD: proposals-20260401-7 — Sprint 总结与未来规划

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

Sprint 1（2026-04-01）完成 7 批次，共 26 Epic，全部交付 ✅。第七批为 Sprint 总结与下个 Sprint 规划。

### 目标

完成 Sprint 复盘会议 + 下个 Sprint 规划 + 技术债清理计划。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| Sprint 复盘文档 | 存在 | 文件存在 |
| 下个 Sprint PRD | ≥ 3 Epic | 文档审查 |
| 技术债计划 | 全部债务有责任人 | 表格完整 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 工时 | 优先级 | 产出文件 |
|------|------|------|--------|----------|
| E1 | Sprint 复盘会议 | 2h | P1 | specs/e1-retro.md |
| E2 | 下个 Sprint 规划 | 3h | P1 | specs/e2-next-sprint.md |
| E3 | 技术债清理计划 | 1h | P2 | specs/e3-tech-debt.md |

**总工时**: 6h

---

### Epic 1: Sprint 复盘会议

**工时**: 2h | **优先级**: P1 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 会议完成 | 2h 复盘会议完成 | `expect(meetingDuration).toBeGreaterThanOrEqual(90))` | ❌ |
| F1.2 | 复盘文档 | `docs/retrospectives/2026-04-01.md` 存在 | `expect(exists('docs/retrospectives/2026-04-01.md')).toBe(true)` | ❌ |
| F1.3 | 经验沉淀 | 包含做得好的实践（≥ 5） | `expect(goodPractices.length).toBeGreaterThanOrEqual(5))` | ❌ |
| F1.4 | 改进计划 | 包含需改进的问题（≥ 3） | `expect(improvements.length).toBeGreaterThanOrEqual(3))` | ❌ |

#### DoD

- [ ] 2h 复盘会议完成（4 个议程全部覆盖）
- [ ] `docs/retrospectives/2026-04-01.md` 存在
- [ ] 做得好的实践 ≥ 5 条
- [ ] 需改进问题 ≥ 3 条

---

### Epic 2: 下个 Sprint 规划

**工时**: 3h | **优先级**: P1 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | Sprint PRD | `docs/sprint-20260402/prd.md` 存在 | `expect(exists('docs/sprint-20260402/prd.md')).toBe(true)` | ❌ |
| F2.2 | Epic 数量 | ≥ 3 Epic 已规划 | `expect(epicCount).toBeGreaterThanOrEqual(3))` | ❌ |
| F2.3 | 优先级排序 | P0/P1/P2 明确 | `expect(hasPriorityOrdering).toBe(true)` | ❌ |
| F2.4 | 工时估算 | 每个 Epic 有工时估算 | `expect(hasEstimates).toBe(true)` | ❌ |

#### DoD

- [ ] `docs/sprint-20260402/prd.md` 存在
- [ ] ≥ 3 Epic 已在下个 Sprint 规划
- [ ] P0/P1/P2 优先级排序清晰
- [ ] 每个 Epic 有工时估算

---

### Epic 3: 技术债清理计划

**工时**: 1h | **优先级**: P2 | **可并行**: ✅

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 技术债清单 | `docs/tech-debt/cleanup-plan.md` 存在 | `expect(exists('docs/tech-debt/cleanup-plan.md')).toBe(true)` | ❌ |
| F3.2 | 责任人 | 每项债务有责任人 | `expect(allHaveOwner).toBe(true)` | ❌ |
| F3.3 | 工时估算 | 每项债务有工时估算 | `expect(allHaveEstimate).toBe(true)` | ❌ |
| F3.4 | 优先级 | P0/P1/P2 优先级排序 | `expect(hasPriorityOrdering).toBe(true)` | ❌ |

#### DoD

- [ ] `docs/tech-debt/cleanup-plan.md` 存在
- [ ] 全部债务（MSW/canvasApi/Playwright）有责任人
- [ ] 每项债务有工时估算
- [ ] P0/P1/P2 优先级排序

---

## 3. 验收标准（汇总）

| Epic | expect() 断言 |
|------|--------------|
| E1 | `expect(exists('docs/retrospectives/2026-04-01.md')).toBe(true)` |
| E1 | `expect(goodPractices.length >= 5)` |
| E2 | `expect(exists('docs/sprint-20260402/prd.md')).toBe(true)` |
| E2 | `expect(epicCount >= 3)` |
| E3 | `expect(exists('docs/tech-debt/cleanup-plan.md')).toBe(true)` |
| E3 | `expect(allHaveOwner)` |

---

## 4. DoD

### 全局 DoD

1. **文档**: 所有产出文档存在且格式规范
2. **完整性**: 无空章节，每项有具体内容

### Epic 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | 复盘文档 4 个议程全部覆盖 |
| E2 | 下个 Sprint PRD ≥ 3 Epic |
| E3 | 技术债清单每项有责任人和工时 |

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| **文档质量** | 复盘文档 ≥ 500 字，下个 Sprint PRD ≥ 1000 字 |
| **可执行性** | 技术债计划每项可立即派发 |

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 22:08 GMT+8*
