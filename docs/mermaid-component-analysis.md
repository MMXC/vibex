# Mermaid 图表组件化分析

## 项目
vibex-mermaid-editor-component

## 1. 现有 Mermaid 相关代码

### 1.1 MermaidCodeEditor 组件
- **路径**: `src/components/ui/MermaidCodeEditor.tsx`
- **功能**: Monaco 编辑器，支持 Mermaid 语法高亮和基本验证
- **状态**: 已实现但未被使用

### 1.2 Mermaid Parser 库
- **路径**: `src/lib/mermaid-parser.ts`
- **功能**: 
  - 解析 Mermaid 代码为 AST (`parseMermaidGraph`, `parseMermaidClassDiagram`, `parseMermaidStateDiagram`)
  - 双向转换: Mermaid ↔ React Flow (`convertMermaidToFlow`, `convertFlowToMermaid`)
  - 验证 Mermaid 语法 (`validateMermaid`)
- **状态**: 已实现但未被确认流程使用

## 2. 使用场景分析

| 页面 | 图表类型 | 当前实现 | 需要组件化 |
|-----|---------|---------|-----------|
| `/confirm/context` | 限界上下文图 (graph TD) | 仅显示代码 | ✅ 需要渲染 |
| `/confirm/model` | 领域模型图 (classDiagram) | 仅显示代码 | ✅ 需要渲染 |
| `/confirm/flow` | 流程图 (stateDiagram-v2) | 仅显示代码 | ✅ 需要渲染 |

## 3. 问题识别

### 问题 1: 图表未渲染
- 确认流程页面只显示 Mermaid 代码文本 (`<pre>` 标签)
- 用户无法直观看到图表效果
- 需要安装 mermaid 渲染库或使用 React Flow 渲染

### 问题 2: 编辑器未复用
- `MermaidCodeEditor` 组件已存在但未被使用
- 每个页面独立实现代码展示
- 缺少统一的 Mermaid 编辑+渲染组件

### 问题 3: 双向编辑缺失
- 用户只能查看代码，无法编辑后实时预览
- 没有实现代码→图表的实时渲染
- 没有实现图表拖拽→代码的同步

## 4. 组件化方案

### 4.1 组件结构

```
MermaidEditor (双向编辑器)
├── MermaidCodeEditor (代码编辑)
│   └── Monaco Editor
└── MermaidPreview (图表渲染)
    └── React Flow 或 mermaid.render
```

### 4.2 组件接口设计

```typescript
interface MermaidEditorProps {
  /** 图表类型 */
  diagramType: 'graph' | 'classDiagram' | 'stateDiagram' | 'flowchart'
  
  /** Mermaid 代码 */
  value: string
  
  /** 代码变更回调 */
  onChange?: (code: string) => void
  
  /** 是否只读 */
  readOnly?: boolean
  
  /** 是否启用双向编辑 */
  bidirectional?: boolean
  
  /** 布局方向 */
  layout?: 'TB' | 'LR' | 'BT' | 'RL'
  
  /** 高度 */
  height?: string
}

interface MermaidPreviewProps {
  /** Mermaid 代码 */
  code: string
  
  /** 图表类型 */
  diagramType: 'graph' | 'classDiagram' | 'stateDiagram' | 'flowchart'
  
  /** 布局方向 */
  layout?: 'TB' | 'LR' | 'BT' | 'RL'
  
  /** 高度 */
  height?: string
  
  /** 是否可编辑（拖拽） */
  editable?: boolean
  
  /** 节点/边变更回调 */
  onChange?: (nodes: Node[], edges: Edge[]) => void
}
```

### 4.3 使用示例

```tsx
import { MermaidEditor } from '@/components/ui/MermaidEditor'

// 在确认流程页面使用
<MermaidEditor
  diagramType="graph"
  value={contextMermaidCode}
  onChange={setContextMermaidCode}
  bidirectional={true}
  layout="TD"
/>
```

## 5. 约束检查

| 约束 | 状态 |
|------|------|
| 支持限界上下文图/领域模型图/流程图 | ✅ 覆盖三种图表类型 |
| 保持现有编辑器功能 | ✅ 复用 MermaidCodeEditor + mermaid-parser |
| 输出组件接口设计 | ✅ 已在本文档中输出 |

## 6. 验证

```bash
test -f docs/mermaid-component-analysis.md
```

## 7. 实施建议

### Phase 1: 创建 MermaidPreview 组件
1. 安装 mermaid 库: `npm install mermaid`
2. 创建 `MermaidPreview.tsx` 组件
3. 集成到确认流程页面

### Phase 2: 创建 MermaidEditor 组件
1. 组合 MermaidCodeEditor + MermaidPreview
2. 实现双向同步逻辑
3. 添加到组件导出

### Phase 3: 优化体验
1. 添加图表类型自动检测
2. 支持更多 Mermaid 图表类型
3. 添加动画和交互效果
