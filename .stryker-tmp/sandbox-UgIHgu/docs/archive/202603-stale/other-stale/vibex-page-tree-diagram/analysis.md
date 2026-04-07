# 页面树节点组件图 - 需求分析文档

**项目**: vibex-page-tree-diagram  
**分析师**: analyst  
**日期**: 2026-03-14  
**版本**: 1.0

---

## 1. 执行摘要

**问题**: VibeX 已有 `PageTree` 组件，但未集成到任何页面，且缺乏可视化节点图展示能力。

**解决方案**: 基于 ReactFlow 开发页面树节点组件图，以流程图样式展示页面结构和节点关系，并集成到首页左侧流程指示器区域。

**核心收益**:
- 可视化展示页面结构
- 直观的节点关系图
- 提升用户体验

---

## 2. 现状分析

### 2.1 现有资产

| 组件/库 | 路径 | 状态 |
|---------|------|------|
| PageTree 组件 | `components/page-tree/PageTree.tsx` | ✅ 存在，未集成 |
| ReactFlow 库 | `package.json` | ✅ 已安装 (v11.11.4) |
| MermaidPreview | `components/ui/MermaidPreview.tsx` | ✅ 存在 |
| FlowDiagram | `components/flow-diagram` | ✅ 存在 |

### 2.2 PageTree 组件分析

**当前实现**: 树形列表，支持展开/折叠

```typescript
interface PageNode {
  id: string;
  name: string;
  type: 'page' | 'component' | 'section';
  children?: PageNode[];
}
```

**问题**:
1. ❌ 未集成到任何页面
2. ❌ 是列表形式，非可视化节点图
3. ⚠️ 数据结构简单，缺少位置、连线等信息

### 2.3 ReactFlow 已有资源

**已安装**: `reactflow: ^11.11.4`

**可利用**:
- 节点拖拽
- 缩放/平移
- 连线动画
- 自定义节点样式

---

## 3. 需求定义

### 3.1 功能需求

| ID | 功能 | 描述 |
|----|------|------|
| F-001 | 页面节点图 | 以流程图样式展示页面结构 |
| F-002 | 节点交互 | 点击节点可跳转/高亮 |
| F-003 | 缩放平移 | 支持缩放和拖拽查看 |
| F-004 | 节点连线 | 显示父子/引用关系 |
| F-005 | 集成到页面 | 嵌入到首页或指定页面 |

### 3.2 用户故事

**US-001: 查看页面结构**
```
作为 用户，
我希望 以可视化节点图查看页面结构，
以便 直观理解页面关系。
```

**US-002: 点击跳转**
```
作为 用户，
我希望 点击节点跳转到对应页面，
以便 快速导航。
```

### 3.3 数据模型扩展

**当前 PageNode**:
```typescript
interface PageNode {
  id: string;
  name: string;
  type: 'page' | 'component' | 'section';
  children?: PageNode[];
}
```

**扩展 PageNodeDiagram**:
```typescript
interface PageNodeDiagram {
  id: string;
  name: string;
  type: 'page' | 'component' | 'section';
  // ReactFlow 节点位置
  position: { x: number; y: number };
  // 节点样式
  style?: {
    backgroundColor?: string;
    borderColor?: string;
  };
  // 子节点
  children?: PageNodeDiagram[];
  // 连线
  connections?: Array<{
    targetId: string;
    type: 'parent' | 'reference';
  }>;
}
```

---

## 4. 技术方案

### 4.1 方案对比

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| **ReactFlow** | 功能丰富、已安装 | 需要学习 | ✅ 推荐 |
| Mermaid | 已有组件 | 静态渲染 | ⚠️ 备选 |
| D3.js | 灵活 | 未安装、学习成本高 | ❌ 不推荐 |

### 4.2 ReactFlow 实现方案

**新建组件**: `components/page-tree/PageTreeDiagram.tsx`

```typescript
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
} from 'reactflow';

interface PageTreeDiagramProps {
  nodes: PageNodeDiagram[];
  onNodeClick?: (nodeId: string) => void;
}

export function PageTreeDiagram({ nodes, onNodeClick }: PageTreeDiagramProps) {
  // 转换为 ReactFlow 格式
  const flowNodes: Node[] = nodes.map(node => ({
    id: node.id,
    data: { label: node.name, type: node.type },
    position: node.position,
  }));

  const flowEdges: Edge[] = [];
  // 生成连线...

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodeClick={(e, node) => onNodeClick?.(node.id)}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
```

### 4.3 集成位置

**推荐**: 首页左侧流程指示器区域

**当前左侧栏**:
```
┌──────────────┐
│ 设计流程     │
│ ┌──────────┐ │
│ │ Step 1   │ │
│ │ Step 2   │ │
│ │ Step 3   │ │
│ │ Step 4   │ │
│ │ Step 5   │ │
│ └──────────┘ │
└──────────────┘
```

**优化后**:
```
┌──────────────┐
│ 设计流程     │
│ ┌──────────┐ │
│ │ Step 1 ✓ │ │
│ │ Step 2   │ │
│ │ ...      │ │
│ └──────────┘ │
│              │
│ 页面结构     │
│ ┌──────────┐ │
│ │ [节点图] │ │
│ │  📄→📄   │ │
│ │   ↓      │ │
│ │  📄→📄   │ │
│ └──────────┘ │
└──────────────┘
```

---

## 5. 实施方案

### 5.1 文件结构

```
src/components/page-tree/
├── PageTree.tsx           # 现有树形组件
├── PageTreeDiagram.tsx    # 新建：节点图组件
├── PageTreeDiagram.module.css
├── usePageTreeLayout.ts   # 布局计算 Hook
└── index.ts
```

### 5.2 开发任务

| 任务 | 内容 | 工时 |
|------|------|------|
| 组件开发 | PageTreeDiagram.tsx | 1 人日 |
| 布局算法 | usePageTreeLayout.ts | 0.5 人日 |
| 集成测试 | 首页集成 | 0.5 人日 |

**总工时**: 2 人日

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 节点过多性能问题 | 中 | 中 | 虚拟化渲染 |
| 布局算法复杂 | 低 | 低 | 使用 dagre 或 elk 库 |
| 移动端适配 | 中 | 低 | 响应式设计 |

---

## 7. 验收标准

| ID | 验收项 | 验收标准 |
|----|--------|----------|
| F-001 | 节点图显示 | 页面以流程图样式展示 |
| F-002 | 缩放功能 | 支持缩放和平移 |
| F-003 | 节点点击 | 点击节点触发回调 |
| F-004 | 页面集成 | 组件集成到首页 |

### 7.1 测试用例

```typescript
describe('PageTreeDiagram', () => {
  it('should render nodes', () => {
    const nodes = [
      { id: '1', name: '首页', type: 'page', position: { x: 0, y: 0 } },
    ];
    render(<PageTreeDiagram nodes={nodes} />);
    
    expect(screen.getByText('首页')).toBeInTheDocument();
  });

  it('should handle node click', () => {
    const onNodeClick = jest.fn();
    render(<PageTreeDiagram nodes={mockNodes} onNodeClick={onNodeClick} />);
    
    fireEvent.click(screen.getByText('首页'));
    expect(onNodeClick).toHaveBeenCalledWith('1');
  });
});
```

---

## 8. 后续扩展

1. **节点拖拽编辑**: 允许用户拖拽调整布局
2. **导出图片**: 导出节点图为 PNG/SVG
3. **实时同步**: 与项目配置同步

---

*文档生成时间: 2026-03-14*  
*分析师: analyst*