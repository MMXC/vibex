# Canvas 页面 5 个 Bug 分析报告

**项目**: vibex-canvas-flow-bugs-20260328
**日期**: 2026-03-28
**作者**: Coord Agent（代码摸底）

---

## Bug 1: AI生成上下文 → 重新执行按钮缺失

**现象**: 限界上下文树生成后，没有重新生成/重新执行的入口

**根因**: `CanvasPage.tsx` 只有「启动画布 →」和「导入示例」两个按钮。`BoundedContextTree` 组件没有暴露重新生成的操作入口。用户修改需求或想重新分析时，无法触发。

**涉及文件**:
- `CanvasPage.tsx` — 缺少重新生成按钮
- `BoundedContextTree.tsx` — 树组件内部无操作按钮

**修复方向**: 在 TreePanel 操作区或 BoundedContextTree 头部增加「🔄 重新生成」按钮，调用现有 `generateContexts()` 或新增 `regenerateContexts()` 函数。

---

## Bug 2: 继续·流程树 按钮没有携带编辑后的上下文

**现象**: 点击后生成的流程树是静态的，没有用用户编辑/确认后的上下文树数据

**根因**: `CanvasPage.tsx` 里没有「继续·流程树」按钮。流程树的生成逻辑在 `canvasStore` 里，需要确认：
1. 按钮是否缺失（应该没有，因为没找到相关代码）
2. 即使有按钮，是否传递了用户编辑后的 context 数据

**涉及文件**:
- `CanvasPage.tsx` — 按钮缺失
- `lib/canvas/canvasStore.ts` — 流程树生成逻辑
- `src/components/canvas/BusinessFlowTree.tsx` — 流程树渲染

**修复方向**:
1. 在上下文树确认后，增加「继续 → 流程树」按钮
2. 按钮 onClick 时，将 `contextNodes`（用户编辑/确认后的数据）传给后端 API 生成流程树
3. 需要确认后端 API `/api/flow/generate` 是否接收 `contexts` 参数

---

## Bug 3: 流程树节点无法新增/编辑，且样式不对

**现象**: 
- 流程树区域能看但不能新增流程和节点
- 流程节点样式不是标准流程节点样式

**根因（代码摸底）**:
- `BusinessFlowTree.tsx` 第 370 行：`addFlowNode` 已连接 store
- 第 363 行：`editFlowNode` 已连接 store
- 第 381 行：`handleAddFlow` 存在
- **但**：UI 上可能 form 没有正确渲染，或 store 里的 `addFlowNode` 是空函数

**涉及文件**:
- `lib/canvas/canvasStore.ts` — 检查 `addFlowNode` / `editFlowNode` 实现
- `BusinessFlowTree.tsx` — 检查 add flow node form 的渲染逻辑
- `canvas.module.css` — 检查 `.addNodeForm` / `.addFlowNodeForm` 样式

**修复方向**:
1. 检查 canvasStore 里 `addFlowNode` 的实现（很可能是空函数）
2. 检查 BusinessFlowTree 的 add flow form 是否正确渲染
3. 节点样式：参考 `BoundedContextTree` 的节点样式实现流程树节点

---

## Bug 4: 流程树画布区域缺少重新生成 + 组件树按钮

**现象**: 流程树区域没有重新生成按钮，没有「继续·组件树」按钮

**根因**: `CanvasPage.tsx` 里只有首页输入区的按钮。流程树区域和组件树区域没有操作按钮。

**涉及文件**:
- `CanvasPage.tsx` — 流程树/组件树区域缺少按钮
- `BusinessFlowTree.tsx` — 流程树操作区
- `ComponentTree.tsx` — 组件树操作区

**修复方向**:
1. 在流程树 TreePanel 操作区增加「🔄 重新生成」和「继续 → 组件树」按钮
2. 组件树 TreePanel 操作区增加「🔄 重新生成」按钮
3. 参考首页 StepBusinessFlow/StepComponent 的按钮设计

---

## Bug 5: 三栏画布展开按钮看不到

**现象**: 三栏画布展开功能存在（代码里有 expand-left/expand-right 逻辑），但 UI 上没有操作入口

**根因**: `CanvasPage.tsx` 第 54-64 行已有 `leftExpand` / `rightExpand` / `centerExpand` 的 store 订阅和 CSS 变量设置逻辑，但**没有 UI 按钮**来触发这些状态切换。

**涉及文件**:
- `CanvasPage.tsx` — 状态逻辑有，但按钮缺失
- `lib/canvas/canvasStore.ts` — 检查 `setLeftExpand` / `setRightExpand` / `setCenterExpand`

**修复方向**:
1. 在 CanvasPage 的三栏区域头部或边缘添加展开/收起按钮
2. 可以做成栏边缘的小图标按钮，点击切换 expand-left/expand-right/normal
3. 参考 HoverHotzone 或 ProjectBar 的样式

---

## 优先级建议

| Bug | 优先级 | 理由 |
|-----|--------|------|
| Bug1 | P1 | 用户高频操作，重新执行是基础需求 |
| Bug2 | P1 | 核心流程断裂，无法继续到流程树 |
| Bug3 | P1 | 流程树是 Epic 3 核心功能 |
| Bug4 | P2 | 组件树是下一步，流程树重新生成也很重要 |
| Bug5 | P3 | 锦上添花，不影响核心流程 |
