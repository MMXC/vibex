# PRD: Mermaid 编辑器组件

**项目名称**: vibex-mermaid-editor-component  
**版本**: 1.0  
**创建日期**: 2026-03-04  
**负责人**: PM Agent

---

## 1. 项目目标

将 Mermaid 图表组件化，实现代码编辑+实时预览+双向同步功能。

---

## 2. 问题分析

| 问题 | 描述 | 影响 |
|------|------|------|
| 图表未渲染 | 确认流程页面只显示代码文本 | 用户无法直观看到图表 |
| 编辑器未复用 | MermaidCodeEditor 已存在但未使用 | 重复开发 |
| 双向编辑缺失 | 无法实时预览编辑效果 | 体验差 |

---

## 3. 功能需求

### 3.1 MermaidPreview 组件

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1.1 | 图表渲染 | 支持 graph/classDiagram/stateDiagram 渲染 | P0 |
| F3.1.2 | 布局方向 | 支持 TB/LR/BT/RL 布局 | P0 |
| F3.1.3 | 高度配置 | 支持自定义高度，默认 400px | P1 |
| F3.1.4 | 错误处理 | 语法错误时显示错误信息 | P0 |

### 3.2 MermaidEditor 组件

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.2.1 | 代码编辑 | Monaco Editor 集成 | P0 |
| F3.2.2 | 语法高亮 | Mermaid 语法高亮 | P0 |
| F3.2.3 | 实时预览 | 代码变更实时渲染图表 | P0 |
| F3.2.4 | 只读模式 | 支持 readOnly 属性 | P1 |

### 3.3 双向同步 (可选)

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.3.1 | 节点拖拽 | 拖拽节点更新 Mermaid 代码 | P2 |
| F3.3.2 | 边编辑 | 添加/删除边同步代码 | P2 |

---

## 4. 组件接口

### 4.1 MermaidPreviewProps

```typescript
interface MermaidPreviewProps {
  code: string;
  diagramType: 'graph' | 'classDiagram' | 'stateDiagram' | 'flowchart';
  layout?: 'TB' | 'LR' | 'BT' | 'RL';
  height?: string;
  className?: string;
}
```

### 4.2 MermaidEditorProps

```typescript
interface MermaidEditorProps {
  diagramType: 'graph' | 'classDiagram' | 'stateDiagram' | 'flowchart';
  value: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  layout?: 'TB' | 'LR' | 'BT' | 'RL';
  height?: string;
  showPreview?: boolean;
}
```

---

## 5. 验收标准

### P0 功能

| 验收项 | 测试方法 |
|--------|----------|
| graph 图表正确渲染 | 输入 graph TD 代码，检查 SVG 输出 |
| classDiagram 渲染 | 输入 classDiagram 代码，检查渲染 |
| stateDiagram 渲染 | 输入 stateDiagram 代码，检查渲染 |
| 语法错误显示错误信息 | 输入错误代码，检查错误提示 |
| Monaco Editor 加载 | 检查编辑器渲染 |
| 实时预览 | 修改代码，1秒内图表更新 |

### P1 功能

| 验收项 | 测试方法 |
|--------|----------|
| 高度配置 | 设置 height="600px"，检查渲染高度 |
| 只读模式 | 设置 readOnly，检查编辑不可用 |

---

## 6. Epic 拆解

### Epic 1: MermaidPreview 实现 (P0)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| 安装 mermaid 库 | npm install mermaid | 0.5h |
| 创建预览组件 | 正确渲染三种图表 | 2h |
| 错误处理 | 语法错误显示友好提示 | 1h |

### Epic 2: MermaidEditor 实现 (P0)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| 集成 Monaco Editor | 编辑器正常显示 | 1h |
| 实时预览 | 代码变更触发渲染 | 1h |
| 布局切换 | 支持 TB/LR 切换 | 1h |

### Epic 3: 双向同步 (P2)

| Story | 验收标准 | 预估 |
|-------|----------|------|
| 节点拖拽同步 | 拖拽更新代码 | 2h |
| 边编辑同步 | 添加/删除边更新代码 | 2h |

---

## 7. 技术约束

- React 18+
- TypeScript 严格模式
- 依赖: mermaid, @monaco-editor/react
- 兼容: Chrome 90+, Safari 14+, Firefox 88+

---

*文档版本: 1.0*  
*创建时间: 2026-03-04*  
*作者: PM Agent*