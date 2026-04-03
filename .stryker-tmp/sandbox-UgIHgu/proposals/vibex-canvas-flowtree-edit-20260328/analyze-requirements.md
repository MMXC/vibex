# 需求分析报告：流程树编辑功能增强

**项目**: vibex-canvas-flowtree-edit-20260328  
**角色**: analyst  
**日期**: 2026-03-28  
**模式**: DAG

---

## 1. 现状分析

### 1.1 现有组件结构

| 组件 | 路径 | 功能 |
|------|------|------|
| `FlowNodeEditor` | `components/flow-node-editor/FlowNodeEditor.tsx` | 节点增删改、拖拽定位 |
| `FlowDiagram` | `components/flow-diagram/FlowDiagram.tsx` | SVG 流程图渲染、缩放、高亮 |
| `FlowList` | `components/flow-list/FlowList.tsx` | 流程列表切换、高亮 |
| `BusinessFlowTree` | `components/canvas/BusinessFlowTree.tsx` | 业务流程树面板、步骤管理 |

### 1.2 数据模型

```typescript
// BusinessFlowNode — 流程节点
interface BusinessFlowNode {
  nodeId: string;
  contextId: string;           // 关联的上下文 ID
  name: string;
  steps: FlowStep[];           // 步骤列表
  confirmed: boolean;
  status: NodeStatus;         // pending | generating | confirmed | error
  children: string[];
}

// FlowStep — 流程步骤
interface FlowStep {
  stepId: string;
  name: string;
  actor: string;
  description?: string;
  order: number;
  confirmed: boolean;
  status: NodeStatus;
  type?: 'normal' | 'branch' | 'loop';  // 支持分支和循环
}
```

### 1.3 当前功能覆盖

| 功能 | 状态 | 备注 |
|------|------|------|
| 流程列表展示 | ✅ | FlowList 组件 |
| 流程节点 CRUD | ✅ | BusinessFlowTree + canvasStore |
| 步骤 CRUD | ✅ | StepRow 内联编辑 |
| 步骤拖拽排序 | ⚠️ | 仅上移/下移按钮，无真正拖拽 |
| 流程图渲染 | ✅ | FlowDiagram (SVG) |
| 新增流程 | ✅ | "添加流程" 按钮 |
| 新增步骤 | ⚠️ | 需在流程卡片内手动编辑 |
| 标准节点样式 | ❓ | FlowDiagram 有基础样式，但 BusinessFlowTree 样式不统一 |

---

## 2. 改进点识别

### 2.1 核心问题

1. **标准流程节点样式缺失**  
   - `FlowDiagram` 使用 SVG 绘制不同形状节点（圆/菱形/矩形）
   - `BusinessFlowTree` 使用 div 卡片，样式与 FlowDiagram 不一致
   - 缺少统一的节点样式定义和 CSS 变量

2. **新增流程操作复杂**  
   - 当前需先选择上下文才能添加流程
   - 无法直接创建空白流程
   - 新流程默认无步骤，需手动添加

3. **新增步骤体验差**  
   - 步骤只能通过编辑模式添加
   - 没有"快速添加步骤"按钮
   - 步骤顺序只能上下移动

### 2.2 优先级分类

| 优先级 | 问题 | 描述 |
|--------|------|------|
| P0 | 标准流程节点样式 | 确保流程节点使用统一的设计系统 |
| P1 | 快速添加流程 | 一键新增流程，减少操作步骤 |
| P2 | 快速添加步骤 | 在流程卡片内提供快速添加步骤按钮 |
| P2 | 步骤拖拽排序 | 实现真正的拖拽排序替代按钮 |
| P3 | 流程复制/导入 | 支持复制现有流程或从模板导入 |

---

## 3. 实施方案建议

### 3.1 P0: 标准流程节点样式

**方案**: 建立统一的流程节点样式系统

```typescript
// 流程节点类型定义
type FlowNodeType = 'start' | 'end' | 'process' | 'decision' | 'input' | 'output';

// 标准样式映射
const FLOW_NODE_STYLES: Record<FlowNodeType, { shape: string; color: string; icon: string }> = {
  start:    { shape: 'circle',     color: '#10b981', icon: '▶' },
  end:      { shape: 'circle',     color: '#ef4444', icon: '■' },
  process:  { shape: 'rect',       color: '#3b82f6', icon: '▣' },
  decision: { shape: 'diamond',   color: '#f59e0b', icon: '◆' },
  input:    { shape: 'parallelogram', color: '#8b5cf6', icon: '←' },
  output:   { shape: 'parallelogram', color: '#06b6d4', icon: '→' },
};
```

**实施要点**:
1. 在 `tokens/flow.css` 或 CSS 变量中定义节点样式
2. `FlowDiagram` 和 `BusinessFlowTree` 共用样式系统
3. 节点支持状态颜色变化（pending/active/completed/error）

### 3.2 P1: 快速添加流程

**方案**: 在 BusinessFlowTree 顶部添加"新建流程"按钮

```typescript
// BusinessFlowTree 新增按钮
<button className={styles.btnNewFlow} onClick={handleNewFlow}>
  + 新建流程
</button>

// 弹出流程创建表单
interface FlowCreateDialogProps {
  contexts: BoundedContextNode[];
  onCreate: (flow: BusinessFlowDraft) => void;
  onCancel: () => void;
}
```

**实施要点**:
1. 创建 `FlowCreateDialog` 组件
2. 流程名称支持自动生成（如"新流程-1"）
3. 上下文选择默认当前上下文

### 3.3 P2: 快速添加步骤

**方案**: 在流程卡片内添加"添加步骤"按钮

```typescript
// StepRow 新增快捷添加模式
<div className={styles.stepQuickAdd}>
  <input
    className={styles.stepInput}
    placeholder="输入步骤名称后按回车"
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        addStep({ name: e.target.value, actor: '系统', order: steps.length });
      }
    }}
  />
</div>
```

**实施要点**:
1. 步骤添加后自动展开编辑模式
2. 支持批量添加（多个步骤名用逗号分隔）
3. 新步骤默认状态为 pending

---

## 4. 技术约束

1. **依赖**: `canvasStore` 中的 `addFlowNode`, `editFlowNode`, `addStep` (需新增)
2. **向后兼容**: 不能破坏现有的流程生成和确认逻辑
3. **状态管理**: 继续使用 Zustand store，避免引入新的状态管理库
4. **样式**: 使用 CSS Modules，与现有设计系统保持一致

---

## 5. 工时估算

| 任务 | 优先级 | 工时 |
|------|--------|------|
| 标准流程节点样式系统 | P0 | 4h |
| 快速添加流程功能 | P1 | 3h |
| 快速添加步骤功能 | P2 | 3h |
| 步骤拖拽排序 | P2 | 4h |
| 测试与优化 | - | 2h |
| **总计** | | **16h** |

---

## 6. 后续任务

1. **create-prd**: 产出详细的产品需求文档
2. **design-architecture**: 设计组件架构和技术选型
3. **coord-decision**: 评审和决策
