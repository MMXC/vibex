# Architecture: PM 自主提案收集 (self-proposal-20260330)

## Status
Proposed

## Context

PM Agent 需要一个结构化的自我反思与提案收集机制，定期从日常工作日志、任务产出、团队反馈中识别改进点，并将其文档化为可执行的提案。

本项目不涉及代码开发，核心产出为 Markdown 文档流。

## Decision

### 架构模式：文档流工作流（Document Pipeline）

```
┌──────────┐    ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ analyst  │───▶│     pm       │───▶│    architect     │───▶│    coord     │
│ 分析阶段 │    │ PRD + Epic   │    │ 架构 + 实施计划   │    │ 决策评审     │
└──────────┘    └──────────────┘    └──────────────────┘    └──────────────┘
     │                │                    │                      │
  analysis.md      prd.md           architecture.md        decision
                   specs/           IMPLEMENTATION_PLAN.md   outcome
                                    AGENTS.md
```

### 存储结构

```
vibex/
└── docs/
    └── self-proposal-YYYYMMDD/    # 每日提案项目目录
        ├── analysis.md            # 需求分析文档
        ├── prd.md                 # 产品需求文档
        ├── specs/                 # 详细规格目录
        │   └── proposal-template.md
        ├── architecture.md        # 本文档：系统架构
        ├── IMPLEMENTATION_PLAN.md # 实施计划
        ├── AGENTS.md              # 开发约束
        └── proposals/             # 提案输出目录
            └── pm-proposals.md    # PM 提案汇总
```

### 核心实体

| 实体 | 描述 | 生命周期 |
|------|------|----------|
| Proposal | 单条提案（problem/solution/impact） | 每日生成 |
| DailyCollection | 每日提案集合 | 与项目同期 |
| ReviewRecord | 评审记录 | 提案评审后生成 |

### 技术选型

- **存储格式**: Markdown（符合现有规范）
- **目录结构**: 按日期分目录（`self-proposal-YYYYMMDD`）
- **无数据库**: 纯文件系统，零依赖
- **版本控制**: 依赖 Git（已有的基础设施）

## Consequences

### 正面
- 流程清晰，每阶段产出明确
- 无额外技术债
- 便于追溯历史提案

### 负面
- 无结构化检索（未来可加标签系统）
- 依赖人工协调（coord 决策环节）

## API 定义

本项目无外部 API，所有交互通过文件系统完成。

内部约定：

| 文件 | 用途 |
|------|------|
| `analysis.md` | 分析阶段输出 |
| `prd.md` | PM 阶段输出 |
| `architecture.md` | Architect 阶段输出 |
| `IMPLEMENTATION_PLAN.md` | 实施计划（Architect 输出） |
| `AGENTS.md` | 开发约束（Architect 输出） |

## Testing Strategy

本项目为文档工作流，测试策略如下：

| 测试类型 | 工具 | 覆盖率 |
|----------|------|--------|
| 文档完整性检查 | `test -f <file>` | 每阶段产出文件 |
| 提案格式校验 | Markdown lint | `pm-proposals.md` |
| 流程完整性 | `team-tasks` 状态机 | 每阶段状态流转 |

```bash
# 验收命令
test -f /root/.openclaw/vibex/docs/self-proposal-20260330/architecture.md
test -f /root/.openclaw/vibex/docs/self-proposal-20260330/IMPLEMENTATION_PLAN.md
test -f /root/.openclaw/vibex/docs/self-proposal-20260330/AGENTS.md
```
