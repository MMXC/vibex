# PRD: vibex-analyst-proposals-20260412-phase1

**Project**: vibex-analyst-proposals-20260412-phase1  
**Stage**: create-prd  
**PM**: PM  
**Date**: 2026-04-07  
**Status**: Draft

---

## 1. 执行摘要

### 背景

提案从提交到实现缺乏状态追踪，同一主题多次出现。Brainstorming 技能使用率低，需求模糊导致返工。画布产品演进方向未固化，新成员无法理解产品方向。

### 目标

| 提案 | 目标 | 工时 |
|------|------|------|
| A-P0-1 | 提案状态追踪机制 | 1h |
| A-P1-1 | 需求澄清 SOP 标准化 | 1h |
| A-P2-1 | 画布演进路线图文档化 | 2h |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| INDEX.md 覆盖 | 100% |
| SOP 文档存在 | AGENTS.md 中标注 |
| Roadmap 文档 | docs/vibex-canvas-evolution-roadmap/roadmap.md |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E1 | 提案状态追踪 | 1h | P0 | S1.1, S1.2 |
| E2 | 需求澄清 SOP | 1h | P1 | S2.1 |
| E3 | 画布演进路线图 | 2h | P2 | S3.1 |

**总工时**: 4h

---

### Epic 1: 提案状态追踪（P0）

**目标**: 建立提案状态追踪机制，减少重复提案。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | INDEX.md 模板 | 创建/更新 `docs/proposals/INDEX.md` | 模板完整 |
| S1.2 | 状态更新流程 | 定义 pending/progress/done/rejected | SOP 文档化 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | INDEX.md 模板 | 每个提案有 status 字段 | `expect(status).toBeDefined()` | 否 |
| F1.2 | 提案创建时更新 | coord 创建提案时自动添加 INDEX 条目 | `expect(autoUpdate).toBe(true)` | 否 |
| F1.3 | 提案完成时更新 | 任务 done 时自动更新 INDEX | `expect(doneUpdate).toBe(true)` | 否 |

---

### Epic 2: 需求澄清 SOP（P1）

**目标**: 标准化 Brainstorming 流程，减少需求模糊返工。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | AGENTS.md 标注 | Brainstorming 技能路径明确标注 | AGENTS.md 更新 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | Brainstorming 技能标注 | AGENTS.md 中标注 brainstorming 路径 | `expect(skillPath).toBeDefined()` | 否 |
| F2.2 | 使用触发条件 | 定义何时必须使用 brainstorming | `expect(triggerCondition).toBeDefined()` | 否 |

---

### Epic 3: 画布演进路线图（P2）

**目标**: 文档化画布产品演进方向，便于新成员理解。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | roadmap.md 创建 | 创建 `docs/vibex-canvas-evolution-roadmap/roadmap.md` | 文档完整 |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | roadmap.md 内容 | 包含当前状态 → 目标状态 → 演进路径 | `expect(doc).toContain('当前状态')` | 否 |
| F3.2 | 季度更新提醒 | 建立季度更新提醒机制 | `expect(reminder).toBeDefined()` | 否 |

---

## 3. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | 提案创建 | coord 创建 | INDEX.md 自动添加条目 | P0 |
| AC2 | 提案完成 | 任务 done | INDEX.md status 自动更新 | P0 |
| AC3 | INDEX.md | 检查 | 100% 提案有 status 字段 | P0 |
| AC4 | AGENTS.md | 检查 | Brainstorming 技能路径明确 | P1 |
| AC5 | roadmap.md | 检查 | 包含当前/目标/演进路径 | P2 |
| AC6 | 季度提醒 | 验证 | CI 或 hook 提醒机制存在 | P2 |

---

## 4. DoD (Definition of Done)

### E1 完成标准

- [ ] `docs/proposals/INDEX.md` 模板存在
- [ ] 模板包含：proposal_id, title, status, created, updated
- [ ] coord 创建提案时自动写入 INDEX
- [ ] task done 时自动更新 status

### E2 完成标准

- [ ] AGENTS.md 中标注 Brainstorming 技能路径
- [ ] 定义使用触发条件（需求模糊/复杂场景）

### E3 完成标准

- [ ] `docs/vibex-canvas-evolution-roadmap/roadmap.md` 存在
- [ ] 包含：当前状态、目标状态、演进路径
- [ ] 建立季度更新提醒

---

## 5. 实施计划

| 阶段 | 内容 | 工时 | 输出 |
|------|------|------|------|
| Phase 1 | E1 INDEX.md 机制 | 1h | INDEX.md 模板 + coord 集成 |
| Phase 2 | E2 SOP 标注 | 1h | AGENTS.md 更新 |
| Phase 3 | E3 Roadmap | 2h | roadmap.md |
| **Total** | | **4h** | |

---

*PRD Version: 1.0*  
*Created by: PM Agent*  
*Last Updated: 2026-04-07*
