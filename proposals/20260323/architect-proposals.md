# 架构改进提案 - 2026-03-23

**Agent**: Architect  
**日期**: 2026-03-23  
**心跳时间**: 05:55 (Asia/Shanghai)

---

## 执行时间

**扫描时间**: 2026-03-23 05:55 (UTC+8)

---

## 状态扫描

### 当前活跃项目

| 项目 | 状态 | 说明 |
|------|------|------|
| `agent-self-evolution-20260323` | 🔄 进行中 | 每日自检，2/4 任务完成 |
| `vibex-simplified-flow` | 🔄 进行中 | 流程简化 5→3 步，Epic2 测试通过 |
| `vibex-homepage-v4-fix` | ✅ 完成 | 首页布局修复 |
| `vibex-json-tree-visual-proposal-20260323` | ✅ 完成 | JSON 树可视化提案已产出 |

### 关键产出物

- `vibex/docs/output/vibex-json-tree-visual-proposal-20260323.md` — JSON 树可视化架构提案
- `vibex/docs/output/proposals-summary-20260323.md` — 提案汇总报告
- `vibex/docs/agent-self-evolution-20260323/specs/E2-S2.*` — 可视化能力 Epic 规格书 (3个)

### 架构关联发现

1. **ReactFlow 可视化平台** — E2 Epic 已产出 3 个规格书（JSON树/Mermaid画布/区域交互），可视化能力需统一规划
2. **API 层稳定性** — Epic2 bounded-context 测试通过，Epic3 前端实现即将解锁
3. **提案生命周期** — 当前提案产出后缺乏状态跟踪闭环

---

## 提案列表

### 提案 1: ReactFlow 可视化平台统一架构 (P1)

#### 问题描述

analyst 连续两天产出 3 个基于 ReactFlow 的可视化提案（JSON树/Mermaid画布/区域交互），各提案独立设计，缺乏统一的可视化平台架构。导致：
- 节点类型系统重复定义
- 事件处理逻辑分散
- 难以扩展新图表类型

#### 改进建议

建立统一的 ReactFlow 可视化平台层：

```
src/components/visualization/
├── platform/
│   ├── VibeXFlow.tsx          # 统一画布组件
│   ├── NodeRegistry.ts        # 节点类型注册表
│   ├── EdgeRegistry.ts        # 边类型注册表
│   └── EventBus.ts            # 跨节点事件总线
├── nodes/
│   ├── JsonTreeNode.tsx       # JSON树节点
│   ├── MermaidNode.tsx        # Mermaid图表节点
│   ├── DomainModelNode.tsx    # 领域模型节点
│   └── InteractiveRegion.tsx   # 可交互区域节点
└── hooks/
    ├── useFlowState.ts        # 画布状态管理
    └── useNodeSelection.ts     # 节点选择管理
```

#### 预期收益

- 可视化能力扩展成本降低 50%（新类型只需注册，无需重写）
- 事件处理逻辑集中，易于调试
- 统一 DevTools 支持

#### 实施难度

**中等** — 需要抽象现有 ReactFlow 用法，预计 3-5 天

#### 优先级依据

analyst 连续产出 3 个相关提案，说明这是明确需求方向。统一架构可避免重复建设。

---

### 提案 2: 提案生命周期闭环追踪系统 (P1)

#### 问题描述

各 Agent 每日产出提案，汇总后进入 `docs/output/` 目录，但：
- 提案状态（待评审/已采纳/已拒绝/已实现）无跟踪
- 提案 → 决策 → 开发 链路断裂
- 无法衡量提案落地率

#### 改进建议

扩展提案元数据字段 + 轻量追踪系统：

```typescript
// proposals/YYYYMMDD/{agent}-proposals.md 元数据
interface ProposalMeta {
  id: string;              // 唯一标识
  agent: string;           // 提案 Agent
  date: string;            // 提案日期
  status: 'draft' | 'submitted' | 'reviewing' | 'accepted' | 'rejected' | 'implemented';
  priority: 'P0' | 'P1' | 'P2';
  reviewer?: string;      // 评审人
  decisionDate?: string;  // 决策日期
  linkedProject?: string; // 关联项目
  implementedDate?: string; // 实现日期
}
```

#### 预期收益

- 提案落地率可量化
- 决策链路透明
- 各 Agent 可追踪自己提案的处理进度

#### 实施难度

**低** — 仅扩展元数据格式，预计 1 天

---

### 提案 3: 架构决策记录 (ADR) 体系建设 (P2)

#### 问题描述

vibex 项目经历多次重构（vibex-simplified-flow、首页重构、Mermaid 修复），但决策过程散落在各个 PR 描述和 task 文档中，缺乏结构化的架构决策记录。

#### 改进建议

建立 ADR 目录和模板：

```markdown
# ADR-XXX: [决策标题]

## Status
Proposed | Accepted | Deprecated

## Context
[问题背景和动机]

## Decision
[决策内容和选择]

## Consequences
[正面和负面影响]

## Alternatives Considered
[替代方案及放弃理由]
```

存储位置: `vibex/docs/adr/`

#### 预期收益

- 新成员 onboarding 时间缩短
- 避免重复踩坑
- 架构演进有据可查

#### 实施难度

**低** — 仅需建立模板和流程，预计 0.5 天

---

## 技术债务识别

| 债务 | 影响 | 优先级 |
|------|------|--------|
| ReactFlow 节点类型分散 | 可视化扩展成本高 | P1 |
| 提案无状态跟踪 | 改进闭环断裂 | P1 |
| ADR 缺失 | 决策知识流失 | P2 |

---

## 下一步建议

1. **PM + Architect 联合设计 ReactFlow 统一平台** — 将 E2 Epic 的 3 个规格书整合为统一架构
2. **提案元数据标准化** — 从下一个提案周期开始启用新格式
3. **创建 ADR-001 记录 5→3 步流程决策** — 作为 ADR 体系建设试点

---

*Architect 提案完成，2026-03-23 05:55*
