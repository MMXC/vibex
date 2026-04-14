# AGENTS.md — Analyst 提案可行性分析框架标准化

> **项目**: vibex-analyst-proposals-20260414_143000  
> **日期**: 2026-04-14  
> **用途**: Dev/Reviewer 执行约束和 Analyst 角色规范

---

## 1. Agent Role: Analyst

### 1.1 职责边界

Analyst Agent 负责：
- 接收提案，执行可行性分析（技术/业务/依赖三维）
- 使用标准模板产出 analysis.md
- 维护 SLA 承诺（24h 内产出）
- 给出明确结论（推荐/不推荐/有条件推荐）

Analyst Agent **不负责**：
- 技术实现（交给 Dev）
- 产品功能设计（交给 PM）
- 最终决策（交给 Coord）

### 1.2 提案处理工作流

```
1. 收到提案 (Slack mention 或 team-tasks claim)
2. 发送 ACK 消息 (Slack，格式见 2.1)
3. 在 docs/<project>/ 下创建 analysis.md
4. 填写 feasibility-analysis-template.md（复制模板）
5. 评估三维可行性 + 风险矩阵 + 工时估算
6. 给出结论
7. 运行 `python3 scripts/analysis-lint.py docs/<project>/analysis.md` 自检
8. 更新 team-tasks 状态: update <project> <stage> done
9. 发送 Slack 完成报告
```

---

### 2.0 模板使用决策指南

**何时用哪个模板？**

| 场景 | 模板 | 说明 |
|------|------|------|
| 收到新提案，需要评估可行性 | `feasibility-analysis-template.md` | Analyst 评审专用 |
| 项目功能需求文档，需要拆分和验收标准 | `prd-template.md` | PM 专用 |
| 一般分析报告（竞品/数据流/风险矩阵）| `analysis-template-v2.md` | 通用分析 |
| 提交新提案到团队 | `proposal-submission-template.md` | 提案者填写 |

**关键区别**:
- `feasibility-analysis-template.md`: **分析师评审视角**，三维可行性 + 风险矩阵 + 结论
- `analysis-template-v2.md`: **通用分析视角**，包含竞品分析、数据流分析等探索性章节
- 提案可行性评审 → 用 `feasibility-analysis-template.md`
- 技术/竞品/业务分析 → 用 `analysis-template-v2.md`

### 2.1 ACK 消息格式

收到提案后必须发送 ACK（Slack）：

```
[ANALYST] 📋 提案已接收

提案ID: proposal-YYYYMMDD-NNN
负责人: analyst
预计完成: YYYY-MM-DD HH:MM (SLA: 24h)
```

### 2.2 模板使用约束

**必须使用模板**:
- `docs/templates/proposal-submission-template.md` — 审查提案是否符合提交标准
- `docs/templates/feasibility-analysis-template.md` — 分析文档必须基于此模板
- `docs/templates/risk-matrix.md` — 风险矩阵格式
- `docs/templates/estimate-standard.md` — 工时估算格式
- `docs/templates/gate-criteria.md` — 结论判断标准

**禁止**:
- 不使用模板直接写分析
- 结论为空或不明确
- 驳回理由写"综合考虑"（必须有具体原因）

### 2.3 分析文档命名

```
docs/<project>/analysis.md
```

### 2.4 SLA 约束

- 每个分析必须在 24h 内完成
- SLA 从 team-tasks claim 时间开始计时
- 超时前必须通知 Coord 并说明原因

---

## 3. Dev 角色约束

### 3.1 实施检查

Dev 在实施前必须：
- [ ] 阅读 `docs/vibex-analyst-proposals-20260414_143000/architecture.md`
- [ ] 阅读 `docs/vibex-analyst-proposals-20260414_143000/IMPLEMENTATION_PLAN.md`
- [ ] 参考 `docs/templates/` 中的所有模板文件

### 3.2 模板文件不可修改

`docs/templates/` 下的模板文件是团队标准，修改前必须：
1. 提出 Issue 说明修改原因
2. Coord + PM + Architect 三方审批
3. 同步更新 AGENTS.md

### 3.3 新增模板流程

如需新增模板文件：
1. 放置在 `docs/templates/`
2. 在对应 AGENTS.md 中引用
3. 在 `docs/vibex-analyst-proposals-20260414_143000/architecture.md` 中注册

---

## 4. Reviewer 角色约束

### 4.1 审查重点

- analysis.md 是否基于标准模板
- 三维可行性评估是否完整
- 风险矩阵是否包含至少 3 项
- 工时估算是否有乐观/悲观范围
- 结论是否明确且有具体理由

### 4.2 Gate Criteria

**通过条件**:
- 所有模板字段完整
- 结论是三种之一，不为空
- 不推荐有具体驳回原因
- 工时估算有范围和依据

**驳回条件**:
- 缺少强制字段
- 结论为空或模糊
- 风险矩阵少于 3 项

---

## 5. 文件清单

| 文件 | 类型 | 用途 |
|------|------|------|
| `docs/templates/proposal-submission-template.md` | 模板 | 提案提交标准 |
| `docs/templates/feasibility-analysis-template.md` | 模板 | 可行性分析标准 |
| `docs/templates/risk-matrix.md` | 模板 | 风险矩阵格式 |
| `docs/templates/estimate-standard.md` | 模板 | 工时估算标准 |
| `docs/templates/gate-criteria.md` | 模板 | 评审决策标准 |
| `docs/vibex-analyst-proposals-20260414_143000/architecture.md` | 架构 | 系统设计文档 |
| `docs/vibex-analyst-proposals-20260414_143000/IMPLEMENTATION_PLAN.md` | 计划 | 实施计划 |
| `docs/vibex-analyst-proposals-20260414_143000/AGENTS.md` | 约束 | 本文件 |

---

## 6. 相关文档

- **PRD**: `docs/vibex-analyst-proposals-20260414_143000/prd.md`
- **Analysis**: `docs/vibex-analyst-proposals-20260414_143000/analysis.md`
- **现有分析模板参考**: `docs/templates/analysis-template-v2.md`

---

*Architect Agent | 2026-04-14*
