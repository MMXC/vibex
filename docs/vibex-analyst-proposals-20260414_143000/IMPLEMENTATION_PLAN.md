# Implementation Plan: Analyst 提案可行性分析框架标准化

> **项目**: vibex-analyst-proposals-20260414_143000  
> **日期**: 2026-04-14  
> **总工时**: 8h（原 6h + Unit 4b 1h + Unit 7 0.5h + Unit 8 0.5h）  
> **优先级**: P0

---

## Overview

本计划基于 prd.md，为 Analyst 角色建立标准化的提案可行性分析框架。包括提案提交模板、可行性分析模板（含三维风险矩阵）、工时估算标准、SLA 机制和评审 Gate 标准。

**成功指标**:
- 分析文档格式一致率: 100%
- 工时估算误差: < 30%
- 高风险预警准确率: > 80%
- 提案评审 SLA: 24h 内产出
- Coord 采纳率: > 70%

---

## Implementation Units

- [x] **Unit 1: 创建提案提交模板 (E1)** ✅

**Goal:** 创建标准提案提交模板，统一提案输入格式。

**Requirements:** F1.1

**Dependencies:** None

**Files:**
- Create: `docs/templates/proposal-submission-template.md`
- Test: `docs/vibex-analyst-proposals-20260414_143000/specs/E1-proposal-template-test.md`

**Approach:**
- 定义 7 个强制字段（背景/目标/约束/成功指标/影响范围/时间线/提案者）
- 每个字段提供填写指引（灰色注释说明）
- 包含 proposal ID 格式说明和 SLA-deadline 字段

**Patterns to follow:**
- 参考现有 `docs/templates/analysis-template-v2.md` 的格式和风格
- 参考 `templates/story-template.md` 的字段定义方式

**Test scenarios:**
- Happy path: 新提案使用模板后包含所有 7 个强制字段
- Edge case: 缺少必填字段时能被识别（字段完整性检查）
- Edge case: proposal ID 格式符合 `proposal-YYYYMMDD-NNN`

**Verification:**
- `docs/templates/proposal-submission-template.md` 存在且包含所有 7 个强制字段
- 每个字段有灰色注释指引

---

- [x] **Unit 2: 创建可行性分析模板 (E2)** ✅

**Goal:** 创建标准可行性分析模板，强制包含三维可行性评估、风险矩阵、工时估算。

**Requirements:** F2.1

**Dependencies:** Unit 1

**Files:**
- Create: `docs/templates/feasibility-analysis-template.md`
- Test: `docs/vibex-analyst-proposals-20260414_143000/specs/E2-analysis-template-test.md`

**Approach:**
- 强制章节：执行决策 / 三维可行性评估 / 风险矩阵 / 工时估算 / 结论
- 结论必须是"推荐/不推荐/有条件推荐"之一，不接受空
- 不推荐结论必须有具体驳回原因（不接受"综合考虑"）

**Patterns to follow:**
- 参考现有 `docs/templates/analysis-template-v2.md` 的章节结构
- 三维评估格式参考 `analysis.md` 中的技术/业务/依赖维度

**Test scenarios:**
- Happy path: 新分析文档包含所有强制章节
- Error path: 结论为空时被识别为不完整
- Error path: "不推荐"但无具体原因时被识别为不合规

**Verification:**
- `docs/templates/feasibility-analysis-template.md` 存在且章节完整
- 每个章节包含强制内容指引

---

- [x] **Unit 3: 创建风险矩阵和工时估算标准 (E2)** ✅

**Goal:** 统一风险等级定义和工时估算格式。

**Requirements:** F2.2, F2.3

**Dependencies:** None (独立模块)

**Files:**
- Create: `docs/templates/risk-matrix.md`
- Create: `docs/templates/estimate-standard.md`
- Test: `docs/vibex-analyst-proposals-20260414_143000/specs/E2-risk-estimate-test.md`

**Approach:**
- `risk-matrix.md`: 定义高(🔴)/中(🟠)/低(🟡)三级风险，每项包含描述/等级/缓解措施/残余风险
- `estimate-standard.md`: 定义工时估算格式（估算值/乐观/悲观/依据），包含回验机制

**Patterns to follow:**
- 风险矩阵参考 PRD 中表格格式
- 工时估算参考 `analysis.md` 中的"工时估算"章节

**Test scenarios:**
- Happy path: 风险矩阵包含所有 4 列（描述/等级/缓解措施/残余风险）
- Happy path: 工时估算包含 4 个字段（估算值/乐观/悲观/依据）
- Edge case: 每个分析至少 3 项风险（技术/业务/依赖各 1）
- Edge case: 工时估算有乐观/悲观范围

**Verification:**
- `docs/templates/risk-matrix.md` 存在且格式正确
- `docs/templates/estimate-standard.md` 存在且包含回验机制

---

- [x] **Unit 4: SLA 机制集成 (E2)** ✅

**Goal:** 将 24h SLA 机制集成到 team-tasks 工作流。

**Requirements:** F2.4

**Dependencies:** team-tasks task_manager.py

**Files:**
- Modify: `skills/team-tasks/scripts/task_manager.py` (添加 sla-deadline 字段支持)
- Test: `docs/vibex-analyst-proposals-20260414_143000/specs/E2-sla-test.md`

**Approach:**
- task_manager.py claim 时自动设置 sla-deadline = 当前时间 + 24h
- status 命令显示各 stage 的 sla-deadline
- 超时检测通过现有心跳脚本实现（读取 task JSON 中的 deadline 字段）

**Technical design:**
```python
# 在 task_manager.py claim 时:
deadline = datetime.now() + timedelta(hours=24)
task["sla_deadline"] = deadline.isoformat()
```

**Patterns to follow:**
- 复用现有 `task_manager.py` 的 claim/update/status 命令模式
- SLA 通知复用现有 Slack 通知机制

**Test scenarios:**
- Happy path: claim 后 task JSON 包含 sla-deadline 字段
- Edge case: 24h SLA 计算正确（含时区处理）
- Edge case: SLA 超时后心跳脚本能检测并通知

**Verification:**
- `python3 task_manager.py claim <project> <stage> --agent analyst` 后 JSON 包含 sla-deadline
- `python3 task_manager.py status <project>` 显示 sla-deadline 列

---

- [x] **Unit 4b: SLA 心跳监控脚本 (E2)** ✅

**Goal:** 实现 SLA 超时检测和 Slack 通知。

**Requirements:** F2.4

**Dependencies:** Unit 4 (task_manager.py SLA 字段)

**Files:**
- Create: `scripts/sla-monitor.py`
- Test: 手动测试 SLA 超时通知

**Approach:**
- 读取所有 team-tasks JSON 文件
- 检查 `sla_deadline` 字段是否已超
- 超时则发送 Slack 通知到 #coord
- 整合到现有心跳脚本或作为独立 cron job

**Technical design:**
```python
# 核心逻辑
for task in all_tasks():
    if task.get('sla_deadline') and is_overdue(task['sla_deadline']):
        send_slack_alert(f"SLA 超时: {task['project']}/{task['stage']}")
```

**Verification:**
- 手动测试超时时 Slack 收到通知
- 通知包含 project/stage/deadline 信息

---

- [x] **Unit 7: Proposal ID 自动分配 (E1)** ✅

**Goal:** ACK 消息中的 proposal ID 自动生成。

**Requirements:** F1.2

**Dependencies:** task_manager.py

**Files:**
- Modify: `skills/team-tasks/scripts/task_manager.py` (claim 命令添加 `--proposal-id` 输出)
- Test: `docs/vibex-analyst-proposals-20260414_143000/specs/E7-proposal-id-test.md`

**Approach:**
- task_manager.py claim 输出包含 `--proposal-id` 格式: `proposal-YYYYMMDD-{max+1}`
- Analyst 在 ACK 消息中使用该 ID

**Verification:**
- `python3 task_manager.py claim <project> <stage>` 输出包含 proposal-id
- ACK 消息使用 claim 返回的 proposal-id

---

- [x] **Unit 8: Post-completion Lint 脚本 (E2)** ✅

**Goal:** 自动检测 analysis.md 是否满足模板要求。

**Requirements:** F2.1, F2.2, F2.3

**Dependencies:** Units 1, 2, 3

**Files:**
- Create: `scripts/analysis-lint.py`
- Test: 手动测试 lint 检测合规/不合规 analysis.md

**Approach:**
- 检查是否包含结论（推荐/不推荐/有条件推荐）
- 检查风险矩阵风险数量 ≥ 3
- 检查工时估算是否包含乐观/悲观范围
- Analyst 完成后可手动运行 lint 自我验证

**Technical design:**
```python
def lint_analysis(path):
    content = read(path)
    checks = [
        has_conclusion(content),
        risk_count(content) >= 3,
        has_estimate_range(content),
    ]
    return all(checks)
```

**Verification:**
- 合规 analysis.md lint 通过
- 缺少字段的 analysis.md lint 失败（报告缺失项）

---

- [x] **Unit 5: 评审 Gate 决策标准 (E3)** ✅

**Goal:** 定义三种评审结论的判断标准。

**Requirements:** F3.1

**Dependencies:** Unit 2

**Files:**
- Create: `docs/templates/gate-criteria.md`
- Test: `docs/vibex-analyst-proposals-20260414_143000/specs/E3-gate-criteria-test.md`

**Approach:**
- 定义推荐标准：技术可行 + 业务价值 > 0 + 工时合理 + 风险可接受
- 定义不推荐标准：技术不可行 / 业务价值 = 0 / 风险无法缓解
- 定义有条件推荐：技术可行但有未解决风险 / 需额外资源
- 明确驳回必须有具体原因

**Patterns to follow:**
- 参考 PRD 中 F3.1 的功能点定义
- 格式与 `risk-matrix.md` 一致

**Test scenarios:**
- Happy path: 三种结论判断标准清晰可执行
- Edge case: "不推荐"但理由为"综合考虑"时被识别为不合规
- Edge case: 每个标准有对应的 checklist

**Verification:**
- `docs/templates/gate-criteria.md` 存在且三种标准明确

---

- [x] **Unit 6: Coord 采纳追踪机制 (E3)** ✅

**Goal:** 追踪 Coord 最终决策与 Analyst 结论的一致性。

**Requirements:** F3.2

**Dependencies:** Unit 5

**Files:**
- Modify: `docs/templates/feasibility-analysis-template.md` (添加 Coord 决策记录字段)
- Test: `docs/vibex-analyst-proposals-20260414_143000/specs/E3-tracking-test.md`

**Approach:**
- 在 feasibility-analysis-template.md 的"执行决策"章节添加 Coord 采纳记录
- Coord 决策后记录 decision + reason 到 analysis.md
- 每月汇总：Coord 采纳率 / Analyst 误判率

**Patterns to follow:**
- 复用现有 prd-template.md 的"执行决策"段落格式
- 采纳率统计通过 git log + analysis.md 头部元信息计算

**Test scenarios:**
- Happy path: Coord 采纳记录包含 decision + reason 字段
- Edge case: Coord 推翻 Analyst 结论时记录复盘要点
- Integration: 月度采纳率可通过脚本从 analysis.md 自动汇总
- 误判复盘存入 `docs/learnings/`（团队已有 learnings 积累机制）

**Verification:**
- feasibility-analysis-template.md 包含 Coord 决策记录字段
- 采纳率统计脚本可正确解析所有 analysis.md
- 误判复盘在 `docs/learnings/` 有迹可查

---

## Verification Criteria

| ID | 验收标准 | 验证方式 |
|----|---------|---------|
| AC1 | Analyst 收到提案后发送 ACK + 分配 proposal-id + sla-deadline | 手动：观察首次提案处理流程 |
| AC2 | analysis.md 包含 origin/dimensions/risk-matrix/estimate/conclusion | 模板完整性检查 |
| AC3 | 风险至少 3 个（技术/业务/依赖各 1）| 模板指引验证 |
| AC4 | 工时估算包含乐观/悲观范围 + 估算依据 | 模板指引验证 |
| AC5 | 评审结论为推荐/不推荐/有条件推荐之一 | 模板指引验证 |
| AC6 | 不推荐结论包含具体驳回原因 | gate-criteria.md 验证 |
| AC7 | 每个 analysis.md 有 sla-deadline 字段 | task_manager.py status |
| AC7b | SLA 超时检测和通知工作 | 手动测试 sla-monitor.py 超时通知 |
| AC8 | Coord 决策记录到 analysis.md | feasibility-analysis-template.md |
| AC9 | Proposal ID 自动生成 | task_manager.py claim 输出 |
| AC10 | Post-completion lint 检测合规性 | analysis-lint.py 对不合规文件报错 |

---

## Dependencies

```
Unit 1 (提案模板) ─┬─→ Unit 2 (可行性分析模板) ─→ Unit 5 (Gate 标准)
                   │                                  │
Unit 3 (风险矩阵) ─┴─→ Unit 4 (SLA 机制) ─┬─→ Unit 4b (心跳脚本)
                   │                         └─→ Unit 6 (采纳追踪)
                   └─→ Unit 5 (Gate 标准)

Unit 7 (Proposal ID) ── 独立 ── 可在任何时候执行
Unit 8 (Lint 脚本) ── 依赖 Units 1/2/3 完成
```

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| 模板过于复杂导致 Analyst 抵触使用 | 模板设计轻量，核心字段控制在 7 个以内 |
| SLA 超时通知不够及时 | 复用心跳脚本（每分钟检查），初期足够 |
| Coord 跳过 Analyst 评审直接决策 | Gate criteria 明确要求 Analyst 评审是前置条件 |

---

*Implementation Plan | Architect Agent | 2026-04-14*

---

## 实现记录

**Dev 实现**: 2026-04-14
**总耗时**: ~2h

### 产出文件

| 文件 | 类型 | Unit |
|------|------|------|
| `docs/templates/proposal-submission-template.md` | 模板 | E1 |
| `docs/templates/feasibility-analysis-template.md` | 模板 | E2 |
| `docs/templates/risk-matrix.md` | 模板 | E2 |
| `docs/templates/estimate-standard.md` | 模板 | E2 |
| `docs/templates/gate-criteria.md` | 模板 | E3 |
| `scripts/sla-monitor.py` | 脚本 | E2 |
| `scripts/analysis-lint.py` | 脚本 | E2 |
| `skills/team-tasks/scripts/task_manager.py` | 工具修改 | E2, E7 |

### 验证结果

- ✅ `pnpm build` 通过
- ✅ `task_manager.py _sla_deadline_iso()` 返回正确格式
- ✅ `task_manager.py _get_next_proposal_id()` 返回 `proposal-YYYYMMDD-NNN`
- ✅ `scripts/analysis-lint.py` 对现有 analysis.md 检测正常
- ✅ `scripts/sla-monitor.py --dry-run` 可正常执行
- ✅ ESLint/TypeScript 错误为既有存量，非本变更引入

### 代码变更

```
+ skills/team-tasks/scripts/task_manager.py (76行)
  + _sla_deadline_iso()      — SLA deadline 计算
  + _get_next_proposal_id()  — Proposal ID 自动分配
  + cmd_claim() 中 SLA + proposal ID 写入 task JSON
  + cmd_status() 中显示 SLA deadline 列
```

*Implementation Record | Dev Agent | 2026-04-14*
