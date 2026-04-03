# AGENTS.md: PM 自主提案收集 (self-proposal-20260330)

## 项目约束

### 范围约束
- **仅文档产出**：本案不涉及代码开发，仅产出 Markdown 文档
- **每日一次**：PM 每日最多提交一次提案收集
- **最小粒度**：每条提案必须包含 problem/solution/impact 三要素

### 质量约束
- 提案必须具体可执行，禁止空泛描述
- 每条提案须有量化预期收益
- 提案须标注优先级（P0/P1/P2）

### 流程约束
- 必须按 `analyze-requirements → create-prd → design-architecture → coord-decision` 顺序执行
- 前一阶段不完成，后续阶段不得开始
- coord 决策为最终入口

---

## Agent 职责边界

### analyst
- 识别 PM 的核心 Jobs-To-Be-Done（通常 3-5 个）
- 提供技术方案选项（至少 2 个）
- 定义验收标准（具体可测试）

### pm
- 基于 analysis.md 产出完整 PRD
- 拆分 Epic/Story，每个功能点必须有验收标准
- 创建 specs/ 目录存放详细规格

### architect
- 设计文档流架构（本案为纯文档工作流）
- 输出 architecture.md、IMPLEMENTATION_PLAN.md、AGENTS.md
- 评估性能影响（本项目无性能影响）

### coord
- 阅读所有产物文档
- 做出决策（通过/驳回）
- 如通过，触发后续开发任务链

---

## 提案格式规范

每条提案必须使用以下模板：

```markdown
## 提案 N: [提案标题]

- **问题**: [具体问题描述]
- **方案**: [改进方案描述]
- **预期收益**: [量化收益]
- **优先级**: P0/P1/P2
- **估计工时**: [X 小时/天]
```

---

## 驳回条件

| 阶段 | 驳回条件 |
|------|----------|
| analysis | 需求模糊无法实现 |
| create-prd | 功能点模糊，无法写 expect() 断言 |
| design-architecture | 架构设计不可行；缺少 IMPLEMENTATION_PLAN.md 或 AGENTS.md |
| coord-decision | 需求不清晰；架构不可行；计划不完整 |

---

## 工作目录

```
/root/.openclaw/vibex
```

所有产物必须存储在此目录下。
