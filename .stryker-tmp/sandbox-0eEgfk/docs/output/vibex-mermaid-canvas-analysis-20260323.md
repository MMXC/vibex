# Vibex Mermaid 画布可视化 - 实现路径分析

## 📋 需求澄清确认

**核心需求**：将项目创建前的 DDD 建模过程结果（Mermaid 图表）用自定义画布图形化展示，并支持勾选节点进行深入分析。

**涉及的数据**：
| 步骤 | 数据类型 | Mermaid 类型 |
|------|----------|--------------|
| 1. Requirements | 需求文本 | - |
| 2. Bounded Context | 限界上下文 | C4 Context / ER Diagram |
| 3. Domain Model | 领域模型 | Class Diagram |
| 4. Business Flow | 业务流程 | Flowchart / State Diagram |
| 5. Components | 组件选择 | - |

---

## 🗺️ 现有架构分析

### 数据流
```
Requirements → AI → Bounded Context (mermaidCode) → AI → Domain Model (mermaidCode) → AI → Business Flow (mermaidCode) → AI → UI Components → Project
```

### 现有组件能力

| 组件 | 功能 | 可复用性 |
|------|------|----------|
| FlowDiagram | SVG 手绘流程图 | ⭐⭐ 需要重构 |
| PageTreeDiagram | ReactFlow 树形图 | ⭐⭐⭐⭐ 可扩展 |
| FlowContainer | 步骤容器 + XState | ⭐⭐⭐⭐ 可复用 |
| ParallelFlowDiagram | 多图并行展示 | ⭐⭐⭐⭐ 核心参考 |

---

## 🔧 实现路径分析

### 方案 A：Mermaid → ReactFlow 转换器（推荐）

**核心思路**：
1. 解析 Mermaid 语法 → AST
2. AST → ReactFlow Nodes/Edges
3. 添加交互层（勾选、高亮、拖拽）

**技术方案**：
```
Mermaid Code → Parser → AST → Transformer → ReactFlow Nodes/Edges
                                      ↓
                              Checkbox Overlay
                                      ↓
                              Selection Manager → JSON Export
```

**实现步骤**：

| 阶段 | 任务 | 工作量 | 依赖 |
|------|------|--------|------|
| 1.1 | Mermaid Parser 解析器 | 3d | - |
| 1.2 | AST → ReactFlow 转换器 | 2d | 1.1 |
| 1.3 | 自定义节点组件（含 checkbox） | 2d | 1.2 |
| 1.4 | 选区管理和 JSON 导出 | 2d | 1.3 |
| 1.5 | 多步骤数据聚合展示 | 2d | 1.4 |

**关键技术点**：

```typescript
// Mermaid 支持的图表类型
type MermaidDiagramType = 
  | 'flowchart'      // 流程图
  | 'sequencediagram' // 时序图
  | 'classdiagram'   // 类图
  | 'statediagram'   // 状态图
  | 'erdiagram'      // ER 图
  | 'gantt'          // 甘特图
  | 'pie'            // 饼图
  | 'mindmap';       // 思维导图

// 节点数据结构
interface MermaidNode {
  id: string;
  text: string;
  type: 'rect' | 'rounded' | 'diamond' | 'circle' | 'stadium' | 'subroutine';
  metadata?: Record<string, unknown>;
}

// 边数据结构
interface MermaidEdge {
  id: string;
  source: string;
  target: string;
  type: 'arrow' | 'open' | 'circle' | 'diamond';
  label?: string;
}
```

### 方案 B：扩展现有 ParallelFlowDiagram

**核心思路**：直接在 `ParallelFlowDiagram` 基础上扩展

**优点**：
- 已有 ReactFlow 集成
- 已有状态管理基础

**缺点**：
- 需要大幅重构
- Mermaid 解析逻辑缺失

### 方案 C：混合方案（分阶段）

**Phase 1**：Mermaid 可视化
- 复用 PageTreeDiagram 的 ReactFlow 基础
- 开发 Mermaid → ReactFlow 转换器
- 支持 Bounded Context 和 Business Flow 两种图表

**Phase 2**：交互增强
- 添加 checkbox 勾选
- 多节点批量选择
- 选中节点 JSON 导出

**Phase 3**：分析集成
- 勾选节点触发 AI 分析
- 基于选中内容生成 Prompt
- 深度分析与建议

---

## 📦 核心组件设计

### MermaidCanvas 组件
```tsx
interface MermaidCanvasProps {
  // 数据源
  mermaidCode: string;
  diagramType: MermaidDiagramType;
  
  // 交互
  selectable?: boolean;        // 是否可选择
  multiSelect?: boolean;        // 是否多选
  onSelectionChange?: (nodes: string[]) => void;
  
  // 样式
  theme?: 'light' | 'dark';
  direction?: 'TB' | 'LR';
  
  // 导出
  exportFormat?: 'json' | 'yaml' | 'markdown';
}
```

### MermaidNode 组件
```tsx
interface MermaidNodeData {
  id: string;
  label: string;
  type: string;
  originalText: string;      // Mermaid 原始文本
  metadata?: {
    description?: string;
    properties?: Record<string, unknown>;
  };
  selected?: boolean;
}
```

---

## 🎯 实现优先级建议

### P0 - MVP（4d）
1. **Mermaid Parser**：支持 flowchart 和 classdiagram
2. **基础渲染**：ReactFlow 可视化
3. **单选/多选**：checkbox 交互

### P1 - 体验增强（3d）
4. **缩放平移**：适配大图
5. **JSON 导出**：选中节点导出
6. **主题适配**：深色模式

### P2 - 完整功能（3d）
7. **多步骤聚合**：5 步骤统一视图
8. **分析集成**：AI 深度分析触发

---

## ✅ 验收标准

### MVP
- [ ] 输入 Mermaid 语法，输出 ReactFlow 可视化
- [ ] 节点支持点击高亮
- [ ] 支持 checkbox 多选
- [ ] 选中节点可导出 JSON

### P1
- [ ] 支持缩放、平移、适应屏幕
- [ ] 深色/浅色主题切换
- [ ] 导出格式支持 JSON/YAML

### P2
- [ ] 多步骤 Mermaid 统一展示
- [ ] 选中节点触发 AI 分析
- [ ] 性能优化（100+ 节点流畅）

---

## ⚠️ 风险评估

| 风险 | 影响 | 缓解 |
|------|------|------|
| Mermaid 语法复杂 | 高 | 先支持 flowchart/classdiagram |
| 性能问题 | 中 | 虚拟化 + 分页加载 |
| 解析准确性 | 中 | 渐进增强 + 错误兜底 |

---

## 📝 下一步

建议创建任务：`vibex-mermaid-canvas`

**第一阶段目标**：
- Mermaid Parser 开发
- 基础 ReactFlow 渲染
- checkbox 勾选功能

**预计工期**：4 人日

是否继续？
