# Analysis: vibex-reactflow-visualization

**任务**: `vibex-reactflow-visualization / analyze-requirements`  
**分析师**: analyst  
**分析时间**: 2026-03-23 12:19 (Asia/Shanghai)

---

## 1. 问题陈述

### 1.1 项目目标

ReactFlow 可视化能力整合：JSON树 + Mermaid画布，统一可视化平台。

**关键词**：整合、统一可视化

### 1.2 现状分析

| 组件 | 状态 | 路径 |
|------|------|------|
| ReactFlow | ✅ 已使用 | `src/app/flow/page.tsx` |
| Mermaid 渲染 | ✅ 已使用 | 多处 (domain, flow 等页面) |
| JSON Tree | ❓ 需确认 | 尚未发现独立 JSON Tree 组件 |
| 统一平台 | ❌ 不存在 | 各组件分散使用，无统一接口 |

### 1.3 核心问题

当前可视化组件分散：
- `flow/page.tsx`：使用 ReactFlow 渲染流程图
- `domain/`: 使用 Mermaid 渲染限界上下文/领域模型图
- 无统一的 JSON 数据可视化抽象层

---

## 2. 技术方案

### 方案 A：统一可视化抽象层（推荐）

**思路**：创建 `useVisualization` Hook，统一管理 ReactFlow、Mermaid、JSON Tree 的渲染逻辑。

```typescript
// src/hooks/useVisualization.ts
export function useVisualization(type: 'flow' | 'mermaid' | 'json', data: any) {
  switch (type) {
    case 'flow': return useFlowVisualization(data);
    case 'mermaid': return useMermaidVisualization(data);
    case 'json': return useJsonTreeVisualization(data);
  }
}
```

**优点**：
- 统一接口，降低页面组件复杂度
- 便于后续扩展新可视化类型
- 统一状态管理和错误处理

**缺点**：
- 需要重构现有代码
- 抽象层可能增加性能开销

### 方案 B：保持现状 + 新增组件

**思路**：不重构现有代码，在 flow page 新增 JSON Tree 面板和 Mermaid 切换。

**优点**：
- 改动小，风险低
- 快速交付

**缺点**：
- 技术债务累积
- 难以维护

---

## 3. 推荐方案

**选择：方案 A**（统一抽象层）

理由：
1. VibeX 是 DDD 建模工具，可视化是核心能力，值得投资
2. 统一抽象层为未来扩展（如 Dagre 布局、决策树等）打下基础
3. 现有 ReactFlow 已证明架构可行

---

## 4. JTBD 分析

| # | Job-to-be-Done | 用户故事 |
|---|-----------------|---------|
| JTBD-1 | 将领域数据一键转换为可视化图 | 作为 PM，我希望输入 DDD 数据后自动生成可视化图，无需手动布局 |
| JTBD-2 | 在不同可视化格式间切换 | 作为用户，我希望在 ReactFlow/Mermaid/JSON Tree 之间切换，查看不同视角 |
| JTBD-3 | 可视化状态持久化 | 作为用户，我希望刷新页面后可视化状态保持不变 |

---

## 5. 验收标准

| # | 标准 | 测试方法 |
|---|------|---------|
| V1 | ReactFlow 渲染 FlowData 正确 | 截图对比测试 |
| V2 | Mermaid 渲染 DDD 图正确 | 截图对比测试 |
| V3 | JSON Tree 正确显示结构 | 单元测试 |
| V4 | 三种视图可相互切换 | E2E 测试 |
| V5 | `npm test` 通过率 ≥ 99% | CI/CD 监控 |

---

## 6. 风险评估

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| ReactFlow 版本升级破坏现有功能 | 中 | 低 | 锁定版本 + 回归测试 |
| 抽象层性能问题 | 中 | 中 | 按需加载，不预加载所有可视化器 |
| Mermaid 渲染跨浏览器兼容 | 低 | 中 | Playwright 跨浏览器测试 |

---

## 7. 下一步

| 优先级 | 行动 | 负责人 |
|-------|------|--------|
| P0 | 确认 JSON Tree 组件需求范围 | PM |
| P1 | 设计 `useVisualization` Hook 接口 | Architect |
| P2 | 实现 ReactFlow + Mermaid 统一渲染 | Dev |
| P3 | 添加 JSON Tree 可视化 | Dev |
| P4 | E2E 测试覆盖 | Tester |
