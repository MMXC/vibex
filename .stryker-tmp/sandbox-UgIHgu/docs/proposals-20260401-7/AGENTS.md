# AGENTS.md: proposals-20260401-7 — Sprint 总结与未来规划

**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 角色与任务分配

| Agent | 负责 Epic | 核心职责 |
|-------|-----------|----------|
| PM | E1, E2, E3 | 主持会议、撰写 PRD、分配债务责任人 |
| Dev | E1（参与）, E2（评审） | 提供技术债信息，评审 PRD 可行性 |
| Architect | E2（Epic 规划）, E3（技术债识别） | 评估工时，确定优先级 |
| Reviewer | E1, E2, E3（全部） | 审核所有输出文档 |
| Tester | 文档验收 | 执行 CI 断言脚本验证文档完整性 |

---

## 2. Epic 执行指南

### E1: Sprint 复盘会议 — PM 主责

#### 复盘文档格式要求

文件路径：`docs/retrospectives/2026-04-01.md`

**必须包含以下章节**：

| 章节 | 要求 | 验收 |
|------|------|------|
| 会议元信息 | sprint name, date, duration(≥90min), participants | 人工确认 |
| 议程覆盖 | 4 项固定议程全部覆盖 | 4/4 覆盖 |
| 做得好的实践 | ≥ 5 条，格式：GP-1, GP-2 ... | `expect(goodPractices.length ≥ 5)` |
| 需改进的问题 | ≥ 3 条，格式：IM-1, IM-2 ... | `expect(improvements.length ≥ 3)` |
| 会议总结 | ≥ 500 中文字符 | `expect(wordCount ≥ 500)` |

**ID 编号规则**：
- 好的实践：`GP-1`, `GP-2`, ...（Good Practice）
- 改进项：`IM-1`, `IM-2`, ...（Improvement）

**格式示例**：

```markdown
## 做得好的实践

- **GP-1**: [内容] — 类别：process/code/communication/tooling
- **GP-2**: [内容] — 类别：process/code/communication/tooling
...

## 需改进的问题

- **IM-1**: [内容] — 优先级：P0/P1/P2
- **IM-2**: [内容] — 优先级：P0/P1/P2
...
```

---

### E2: 下个 Sprint 规划 — PM 主责

#### Sprint PRD 模板要求

文件路径：`docs/sprint-20260402/prd.md`

**必须包含以下章节**：

| 章节 | 要求 | 验收 |
|------|------|------|
| 执行摘要 | 背景 + 目标 + 成功指标表 | 人工确认 |
| Epic 总览 | ≥ 3 个 Epic，含优先级和工时 | `expect(epicCount ≥ 3)` |
| Epic 详细 | 每个 Epic 含功能点表 + 验收标准 | 人工确认 |
| 验收标准 | 使用 `expect()` 断言格式 | 格式合规 |
| DoD | Definition of Done | 人工确认 |

**Epic 数量要求**：
- 最少 **3 个 Epic**
- 最多不超过 **7 个 Epic**（单 Sprint 范围控制）
- 每个 Epic 必须包含：ID、名称、优先级(P0/P1/P2)、工时估算、功能点列表

**Epic 格式示例**：

```markdown
## Epic 1: [Epic 名称] — [Xh] — [P0]

### 功能点

| ID | 功能点 | 验收标准 |
|----|--------|----------|
| F1.1 | [名称] | [标准] |

### DoD
- [ ] ...
```

**优先级排序要求**：
- P0：阻塞性问题，必须在 Sprint 前 3 天完成
- P1：核心功能，Sprint 结束前必须完成
- P2：优化/改进，可在资源允许时完成

---

### E3: 技术债清理计划 — PM 主责，Architect 辅助

#### Tech Debt 格式要求

文件路径：`docs/tech-debt/cleanup-plan.md`

**必须包含以下内容**：

| 字段 | 要求 | 验收 |
|------|------|------|
| ID | `TD-1`, `TD-2`, ... 格式 | 人工确认 |
| 标题 | 简洁描述债务内容 | 人工确认 |
| **Owner** | **必填**，GitHub handle 或姓名 | `expect(allHaveOwner)` |
| **Estimate** | **必填**，格式 `Xh`（如 `4h`, `8h`） | `expect(allHaveEstimate)` |
| **Priority** | **必填**，`P0/P1/P2` | 存在性 |
| Category | `test/infra/code/docs` | 人工确认 |
| Affected Areas | 受影响的模块列表 | 人工确认 |

**债务清单表格式**：

```markdown
## 债务清单

| ID | 标题 | 责任人 | 工时 | 优先级 | 类别 | 影响范围 |
|----|------|--------|------|--------|------|----------|
| TD-1 | [MSW Mock 不稳定] | @handle | 4h | P1 | test | API Mock |
| TD-2 | [Canvas API 逻辑] | @handle | 8h | P2 | code | 画布交互 |
| TD-3 | [Playwright 覆盖不足] | @handle | 6h | P1 | test | E2E 测试 |
```

**已知债务清单**（Sprint 1 发现，需填入）：

| ID | 标题 | Owner | Estimate | Priority |
|----|------|-------|----------|----------|
| TD-1 | MSW Mock 服务不稳定 | **待分配** | **待评估** | P1 |
| TD-2 | Canvas API 画布交互逻辑缺陷 | **待分配** | **待评估** | P2 |
| TD-3 | Playwright E2E 测试覆盖不足 | **待分配** | **待评估** | P1 |

---

## 3. 执行约束

### 通用约束

1. **所有文档使用 Markdown 格式**，存储在 `docs/` 目录下
2. **不接受空章节**，每个章节必须有实质性内容
3. **所有债务必须有 Owner**，不接受 "TBD" 或 "待定"
4. **工时估算使用整数 + "h" 后缀**，不接受 "TBD"、"?"、"待评估"

### 时间约束

| Epic | 截止时间（相对会议开始） |
|------|------------------------|
| E1 文档 | 会议结束后 30 分钟内 |
| E2 PRD | 会议结束后 60 分钟内 |
| E3 清理计划 | 会议结束后 60 分钟内 |

---

## 4. 验收检查清单

### E1 复盘文档检查

- [ ] 文件存在于 `docs/retrospectives/2026-04-01.md`
- [ ] 包含 4 项议程覆盖
- [ ] 做得好的实践 ≥ 5 条（GP-1 ~ GP-N）
- [ ] 需改进问题 ≥ 3 条（IM-1 ~ IM-N）
- [ ] 文档字数 ≥ 500

### E2 Sprint PRD 检查

- [ ] 文件存在于 `docs/sprint-20260402/prd.md`
- [ ] Epic 数量 ≥ 3
- [ ] 每个 Epic 有 P0/P1/P2 优先级
- [ ] 每个 Epic 有工时估算（Xh）
- [ ] 文档字数 ≥ 1000

### E3 Tech Debt 检查

- [ ] 文件存在于 `docs/tech-debt/cleanup-plan.md`
- [ ] 所有债务有 Owner（非空）
- [ ] 所有债务有工时估算（Xh）
- [ ] 所有债务有 P0/P1/P2 优先级
- [ ] 已知 3 个债务项（MSW/Canvas/Playwright）全部列出

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: proposals-20260401-7
- **执行日期**: 2026-04-01
