# ADR-XXX: 提案收集 20260330 — 下一轮开发规划

**状态**: Accepted
**日期**: 2026-03-30
**角色**: Architect
**项目**: proposal-collection-20260330

---

## Context

汇总今日（2026-03-30）分析任务中发现的问题和改进机会，形成下一轮开发的优先提案。

---

## Decision

### 提案汇总

| 提案 | 优先级 | 工时 | 状态 |
|------|--------|------|------|
| **提案1: Canvas Bug Sprint** | P0 | ~15-20h | 建议优先 |
| **提案2: Task Manager 通知基础设施** | P1 | 7h | 并行 |
| **提案3: Canvas Phase2 全屏展开** | P1 | 8h | 依赖Phase1 |

### 提案1: Canvas Bug Sprint — 详细结构

```mermaid
graph TB
    subgraph "Bug 修复 (提案1)"
        B1["B1: disabled 逻辑修复<br/>BoundedContextTree"]
        B2["B2.1: OverlapHighlightLayer 集成<br/>CardTreeRenderer"]
        B2b["B2.2: 起止节点标记<br/>FlowNodeMarkerLayer"]
        C1["Checkbox 去重<br/>vibex-canvas-checkbox-dedup"]
        C2["BC 树连线布局<br/>vibex-bc-canvas-edge-render"]
        C3["组件树分类<br/>vibex-component-tree-*"]
    end

    B1 --> C1 --> C2 --> C3
    B2 --> B2b

    style B1 fill:#ff6b6b,color:#fff
    style B2 fill:#ffd93d,color:#333
    style C1 fill:#ffd93d,color:#333
```

### 提案2: Task Manager 通知 — 详细结构

```mermaid
graph LR
    subgraph "task_manager.py 通知模块"
        P1["phase1/phase2 创建后<br/>通知首个 agent"]
        P2["update done<br/>通知下一环节"]
        P3["update pending<br/>通知驳回原因"]
    end

    P1 --> Slack["Slack 实时推送"]
    P2 --> Slack
    P3 --> Slack

    style P1 fill:#90EE90
    style P2 fill:#90EE90
    style P3 fill:#90EE90
```

### 提案3: Canvas Phase2 — 详细结构

```mermaid
graph LR
    subgraph "Phase2 路线图"
        P2a["Phase2a: 全屏展开<br/>expand-both + maximize<br/>~8h"]
        P2b["Phase2b: 关系可视化<br/>BC连线 + Flow连线<br/>~16h"]
    end

    P2a --> P2b

    style P2a fill:#87CEEB
    style P2b fill:#87CEEB
```

---

## 技术债务清单

### 已识别技术债务

| ID | 项目 | 问题 | 工时 | 优先级 |
|----|------|------|------|--------|
| TD-001 | vibex-canvas-checkbox-dedup | 双重 checkbox 混乱 | 2h | P1 |
| TD-002 | vibex-component-tree-* | AI flowId 不匹配 | 4h | P1 |
| TD-003 | vibex-bc-canvas-edge-render | 连线堆叠垂直线 | 8h | P1 |
| TD-004 | task-manager-curl-integration | 无实时通知 | 7h | P2 |

### 遗留 Bug

| ID | 描述 | 状态 |
|----|------|------|
| B1 | `disabled={allConfirmed}` 阻塞确认 | Dev 待领取 |
| B2.1 | `OverlapHighlightLayer` 未导入 | Dev 待领取 |
| B2.2 | 起止节点标记不存在 | Dev 待领取 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: proposal-collection-20260330
- **执行日期**: 2026-03-30
