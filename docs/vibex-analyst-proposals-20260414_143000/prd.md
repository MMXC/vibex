# PRD: VibeX Analyst 提案可行性分析框架标准化

**Project**: vibex-analyst-proposals-20260414_143000
**Stage**: create-prd
**PM**: PM Agent
**Date**: 2026-04-14
**Status**: Draft

---

## 1. 执行摘要

### 背景

VibeX 当前提案流程（Coord 分配 → Analyst 评审 → PM PRD → Architect 设计 → Coord 决策）缺乏标准化输入/输出格式。Analyst 的可行性评估质量依赖个人经验，没有统一的风险矩阵框架和验收标准模板。导致：评估结论不一致、工时估算偏差大、好提案被误驳回或坏提案被放行。

### 目标

建立 Analyst 提案可行性分析的标准框架，包括：提案提交模板、可行性分析模板（含三维风险矩阵）、工时估算标准、评审 gate 标准。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 分析文档格式一致率 | 100%（每次提案符合模板） |
| 工时估算误差 | < 30%（Sprint 结束后回验） |
| 高风险预警准确率 | > 80%（被标记高风险的项目实际发生率 < 20%） |
| 提案评审 SLA | 24h 内产出可行性评估 |
| Coord 采纳率 | > 70%（ Analyst 结论被 Coord 采纳的比例） |

---

## 2. Planning 输出：Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F1.1 | 提案提交模板 | 统一提案格式，包含背景/目标/约束/成功指标 | A-P0-提案信息不完整 | 1h |
| F1.2 | 提案接收确认机制 | 提案到达后自动 ACK + 分配唯一 ID | A-P0-提案信息不完整 | 0.5h |
| F2.1 | 可行性分析模板 | 标准分析框架：技术/业务/依赖三维评估 | A-P1-评估准确性依赖已知知识 | 1h |
| F2.2 | 风险矩阵模板 | 量化风险等级（高/中/低）+ 缓解措施 | A-P1-评估准确性依赖已知知识 | 0.5h |
| F2.3 | 工时估算标准 | 标准化工时估算格式 + 回验机制 | A-P1-评估准确性依赖已知知识 | 0.5h |
| F2.4 | 评审 SLA 机制 | 24h 内必须产出评估，超时自动升级 | A-P0-提案评审被跳过 | 0.5h |
| F3.1 | 评审 gate 决策标准 | 明确推荐/不推荐/有条件推荐三种结论 | A-P0-分析结论被跳过 | 1h |
| F3.2 | Coord 采纳追踪 | 记录 Coord 最终决策与 Analyst 结论的一致性 | A-P1-评估准确性依赖已知知识 | 0.5h |
| **合计** | | | | **6h** |

---

## 3. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E1 | 提案提交标准化 | 1.5h | P0 | S1.1, S1.2 |
| E2 | 可行性分析模板框架 | 2.5h | P0 | S2.1, S2.2, S2.3, S2.4 |
| E3 | 评审 gate 标准化 | 2h | P1 | S3.1, S3.2 |

**总工时**: 6h

---

### Epic 1: 提案提交标准化（P0）

**目标**: 统一提案输入格式，确保 Analyst 有足够信息做评估。

#### Story S1.1: 提案提交模板

**描述**: 定义标准提案模板，包含强制字段：背景/目标/约束/成功指标/影响范围。

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 提案模板文件 | `docs/templates/proposal-submission-template.md` | 模板包含所有强制字段 | 否 |
| F1.1.1 | 强制字段检查 | Coord 分配提案时验证模板字段完整性 | `expect(hasAllFields).toBe(true)` | 否 |
| F1.1.2 | 提案 ID 自动生成 | 提案创建时自动分配唯一 ID（格式：`proposal-YYYYMMDD-NNN`） | `expect(idFormat).toMatch(/proposal-\d{8}-\d{3}/)` | 否 |
| F1.1.3 | 模板路径记录 | 每个提案的 analysis.md 包含 origin 字段指向原始提案 | `expect(originField).toBeDefined()` | 否 |

**DoD**:
- [ ] `docs/templates/proposal-submission-template.md` 存在且完整
- [ ] 模板包含：背景 / 目标 / 约束 / 成功指标 / 影响范围 / 时间线 / 提案者

#### Story S1.2: 提案接收确认机制

**描述**: Analyst 收到提案后自动回复确认，包含分配 ID 和预计完成时间。

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.2.1 | ACK 消息格式 | 确认消息包含：提案ID / Analyst 负责人 / 预计完成时间 | `expect(ackMessage).toContain('proposal-id')` | 否 |
| F1.2.2 | 追踪记录 | 提案在 INDEX.md 中状态为 pending → in-progress | `expect(statusTransition).toBe('pending→in-progress')` | 否 |

**DoD**:
- [ ] Analyst 收到提案后发送 ACK 消息（Slack 或 session）
- [ ] 消息包含预计完成时间（SLA 倒计时）
- [ ] INDEX.md 状态自动更新

---

### Epic 2: 可行性分析模板框架（P0）

**目标**: 建立标准可行性分析模板，包含三维风险矩阵、工时估算、回验机制。

#### Story S2.1: 可行性分析模板

**描述**: 创建标准可行性分析模板，强制包含：技术可行性 / 业务可行性 / 依赖可行性 / 风险矩阵 / 工时估算 / 结论。

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1.1 | 分析模板文件 | `docs/templates/feasibility-analysis-template.md` | 模板章节完整 | 否 |
| F2.1.2 | 三维可行性评估 | 每个分析包含：技术 / 业务 / 依赖 三个维度 | `expect(dimensions).toEqual(['technical', 'business', 'dependency'])` | 否 |
| F2.1.3 | 结论明确性 | 每个分析必须有明确结论（推荐 / 不推荐 / 有条件推荐） | `expect(conclusion).toMatch(/推荐\|不推荐\|有条件推荐/)` | 否 |
| F2.1.4 | 提案引用追溯 | analysis.md 头部包含 origin 字段引用原始提案 | `expect(origin).toBeDefined()` | 否 |

**DoD**:
- [ ] `docs/templates/feasibility-analysis-template.md` 存在且章节完整
- [ ] 每个章节包含强制内容指引（灰色注释）
- [ ] 模板被纳入 Analyst Agent 技能说明

#### Story S2.2: 风险矩阵模板

**描述**: 统一风险等级定义和缓解措施格式。

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.2.1 | 风险等级定义 | 高（影响核心功能）/ 中（影响效率）/ 低（影响体验）| `expect(riskLevels).toHaveLength(3)` | 否 |
| F2.2.2 | 风险矩阵格式 | 每个风险包含：风险描述 / 等级 / 缓解措施 / 残余风险 | `expect(matrixColumns).toContain('description', 'level', 'mitigation', 'residual')` | 否 |
| F2.2.3 | 风险数量底线 | 每个分析至少识别 3 个风险（技术/业务/依赖各 1 个）| `expect(riskCount).toBeGreaterThanOrEqual(3)` | 否 |

**DoD**:
- [ ] 风险矩阵格式在模板中明确定义
- [ ] 缓解措施必须具体可执行（不是"待定"）

#### Story S2.3: 工时估算标准

**描述**: 建立标准化工时估算格式，包含估算依据和置信区间。

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.3.1 | 工时估算格式 | 包含：估算值 / 估算依据 / 置信区间（乐观/悲观）| `expect(estimate).toHaveProperty('value', 'basis', 'range')` | 否 |
| F2.3.2 | 回验记录 | 工时估算后，Sprint 结束记录实际工时 | `expect(actualHours).toBeRecorded()` | 否 |
| F2.3.3 | 偏差率计算 | 偏差率 = abs(实际-估算) / 估算，回验后更新 analysis.md | `expect(deviationRate).toBeLessThan(0.3)` | 否 |

**DoD**:
- [ ] 工时估算包含乐观/悲观范围
- [ ] 回验记录在 analysis.md 中标注
- [ ] 累积偏差率 < 30%

#### Story S2.4: 评审 SLA 机制

**描述**: 提案评审有明确的 24h SLA，超时自动升级。

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.4.1 | SLA 计时起点 | 提案分配给 Analyst 的时刻为计时起点 | `expect(slaStart).toBeDefined()` | 否 |
| F2.4.2 | SLA 超时升级 | 24h 未完成时，自动通知 Coord | `expect(slaAlert).toBe(true)` | 否 |
| F2.4.3 | SLA 状态显示 | analysis.md 包含 sla-deadline 字段 | `expect(slaDeadline).toBeDefined()` | 否 |

**DoD**:
- [ ] 每个提案的 analysis.md 有 sla-deadline 字段
- [ ] SLA 超时有自动通知机制
- [ ] Coord 可查询当前所有提案的 SLA 状态

---

### Epic 3: 评审 Gate 标准化（P1）

**目标**: 建立明确的评审决策标准和采纳追踪机制。

#### Story S3.1: 评审 Gate 决策标准

**描述**: 定义三种评审结论（推荐 / 不推荐 / 有条件推荐）的具体判断标准。

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1.1 | 推荐标准 | 技术可行 + 业务价值 > 0 + 工时合理 + 风险可接受 | `expect(recommendCriteria).toBeDefined()` | 否 |
| F3.1.2 | 不推荐标准 | 技术不可行 / 业务价值 = 0 / 风险无法缓解 | `expect(rejectCriteria).toBeDefined()` | 否 |
| F3.1.3 | 有条件推荐 | 技术可行但有未解决风险 / 需额外资源 | `expect(conditionalCriteria).toBeDefined()` | 否 |
| F3.1.4 | 驳回需有因 | 不推荐结论必须包含具体驳回原因（不可"综合考虑"）| `expect(rejectReason).toBeSpecific())` | 否 |

**DoD**:
- [ ] 三种结论的判断标准在模板中明确列出
- [ ] Analyst 培训材料包含标准解读
- [ ] Coord 有权推翻 Analyst 结论，但需记录原因

#### Story S3.2: Coord 采纳追踪

**描述**: 追踪 Coord 最终决策与 Analyst 结论的一致性，持续改进分析质量。

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.2.1 | Coord 决策记录 | Coord 决策后，analysis.md 中记录 decision + reason | `expect(coordDecision).toBeDefined()` | 否 |
| F3.2.2 | 一致性统计 | 每月汇总：Coord 采纳率 / Analyst 误判率 | `expect(monthlyStats).toBeGenerated()` | 否 |
| F3.2.3 | 误判复盘 | 被 Coord 推翻的结论，记录复盘要点到 learnings | `expect(retro).toBeRecorded()` | 否 |

**DoD**:
- [ ] Coord 决策记录在 analysis.md 中
- [ ] 每月有一致性统计报告
- [ ] 误判案例进入 learnings 库

---

## 4. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | 新提案到达 | Coord 分配 | Analyst 发送 ACK + 分配 proposal-id + sla-deadline | P0 |
| AC2 | analysis.md | 创建 | 包含 origin / dimensions / risk-matrix / estimate / conclusion | P0 |
| AC3 | analysis.md | 创建 | 风险至少 3 个（技术/业务/依赖各 1）| P0 |
| AC4 | 工时估算 | 完成后 | 包含乐观/悲观范围 + 估算依据 | P0 |
| AC5 | 评审结论 | 产出 | 结论为推荐/不推荐/有条件推荐之一，不可为空 | P0 |
| AC6 | 不推荐结论 | 产出 | 包含具体驳回原因，不可模糊 | P0 |
| AC7 | SLA 超时 | 24h 未完成 | Coord 收到升级通知 | P0 |
| AC8 | Coord 决策 | 做出 | decision + reason 记录到 analysis.md | P1 |
| AC9 | 采纳率 | 月底 | > 70% 的 Analyst 结论被 Coord 采纳 | P1 |
| AC10 | 工时偏差 | Sprint 结束 | < 30% 的估算偏差率 | P0 |

---

## 5. DoD (Definition of Done)

### E1 完成标准

- [ ] `docs/templates/proposal-submission-template.md` 存在且包含所有强制字段指引
- [ ] Coord 分配提案时有字段完整性检查
- [ ] Analyst 收到提案后发送 ACK 消息
- [ ] INDEX.md 状态自动更新（pending → in-progress）

### E2 完成标准

- [ ] `docs/templates/feasibility-analysis-template.md` 存在且章节完整
- [ ] 每个章节包含强制内容指引
- [ ] 模板纳入 Analyst Agent 技能说明
- [ ] 风险矩阵格式统一（描述/等级/缓解措施/残余风险）
- [ ] 工时估算包含乐观/悲观范围和估算依据
- [ ] 每个 analysis.md 有 sla-deadline 字段
- [ ] SLA 超时有自动通知机制

### E3 完成标准

- [ ] 三种评审结论的判断标准在模板中明确
- [ ] Coord 决策记录到 analysis.md
- [ ] 每月一致性统计报告存在
- [ ] 误判案例进入 learnings 库

### 整体 DoD

- [ ] 所有模板文件在 `docs/templates/` 目录
- [ ] Analyst Agent 的 AGENTS.md 中标注模板路径
- [ ] Coord 有权推翻 Analyst 结论，但需记录原因
- [ ] SLA 机制和采纳追踪机制持续运行

---

## 6. 实施计划

| 阶段 | Epic | 内容 | 工时 | 输出 |
|------|------|------|------|------|
| Phase 1 | E1 | 提案提交标准化模板 | 1.5h | 提案模板 + ACK 机制 |
| Phase 2 | E2 | 可行性分析模板框架 | 2.5h | 分析模板 + 风险矩阵 + 工时标准 + SLA |
| Phase 3 | E3 | 评审 gate 标准化 | 2h | 决策标准 + 采纳追踪 |
| **Total** | | | **6h** | |

---

## 7. 规格文件（Specs）

详细规格见 `specs/` 目录：

| 文件 | 内容 |
|------|------|
| `specs/E1-proposal-template.md` | 提案提交模板详细规格 |
| `specs/E2-analysis-template.md` | 可行性分析模板详细规格 |
| `specs/E2-risk-matrix.md` | 风险矩阵格式和等级定义 |
| `specs/E2-estimate-standard.md` | 工时估算标准和回验格式 |
| `specs/E3-gate-criteria.md` | 评审 gate 决策标准和采纳追踪规格 |

---

*PRD Version: 1.0*
*Created by: PM Agent*
*Last Updated: 2026-04-14*
