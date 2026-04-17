# Implementation Plan — vibex-sprint1-prototype-canvas

**项目**: vibex-sprint1-prototype-canvas
**角色**: Architect
**日期**: 2026-04-17
**状态**: active

---

## Unit Index

| Epic | Units | E1-U1 | ✅ DONE | ✅ | Next |
|------|-------|--------|------|
| E1: 拖拽布局编辑器 | E1-U1 | ✅ DONE | ✅~ E1-U4 |E1-U1 | ✅ DONE | ✅ 0/4 | E1-U1 | ✅ DONE | ✅|
| E2: Mock数据绑定 | E2-U1 ~ E2-U2 |E1-U1 | ✅ DONE | ✅ 0/2 | E2-U1 |
| E3: 路由树 | E3-U1 ~ E3-U2 |E1-U1 | ✅ DONE | ✅ 0/2 | E3-U1 |
| E4: JSON导出增强 | E4-U1 ~ E4-U2 |E1-U1 | ✅ DONE | ✅ 0/2 | E4-U1 |
| E5: 组件库完善 | E5-U1 |E1-U1 | ✅ DONE | ✅ 0/1 | E5-U1 |

**总工时**: 8h（MVP）

---

## E1: 拖拽布局编辑器

| ID | Name | E1-U1 | ✅ DONE | ✅ | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | ✅ DONE | ✅| 组件面板实现 |E1-U1 | ✅ DONE | ✅ | — | 左侧面板显示 10 个默认组件，拖拽时传递正确 dataTransfer |
| E1-U2 | ProtoFlowCanvas 画布实现 |E1-U1 | ✅ DONE | ✅ | E1-U1 | ✅ DONE | ✅| React Flow 画布接收 drop 事件，节点创建成功，位置正确 |
| E1-U3 | ProtoNode 自定义节点渲染 |E1-U1 | ✅ DONE | ✅ | E1-U2 | 节点渲染为真实 UI 组件（Button 蓝色可点击、Input 可输入等） |
| E1-U4 | 节点属性面板实现 |E1-U1 | ✅ DONE | ✅ | E1-U2 | 双击节点打开右侧面板，编辑 props 后节点 UI 实时更新 |

### E1-U1 | ✅ DONE | ✅详细说明

**文件变更**: `components/prototype/ComponentPanel.tsx` (新建)

**实现步骤**:
1. 读取 `DEFAULT_COMPONENTS`（来自 `lib/prototypes/ui-schema.ts`）
2. 渲染 10 个组件卡片，绑定 `draggable={true}`
3. `onDragStart` 设置 `e.dataTransfer.setData('application/json', JSON.stringify(component))`
4. 添加 CSS 样式（网格布局，60px × 60px 卡片）

**Patterns to follow**: 参考 `components/dds/toolbar/DDSToolbar.tsx` 组件结构

**Test scenarios**:
- Happy path: 面板显示 10 个组件卡片
- Happy path: 拖拽开始时 dataTransfer 包含正确的 component JSON
- Edge case: 组件面板滚动（超过可视区域）

**Verification**: 手动拖拽任一组件到画布，画布上出现对应节点

---

### E1-U2 详细说明

**文件变更**: `components/prototype/ProtoFlowCanvas.tsx` (新建)

**实现步骤**:
1. 引入 `@xyflow/react` 的 `ReactFlow` 组件
2. 配置 `onDragOver`（`preventDefault()` 允许 drop）+ `onDrop`（解析 component，调用 store.addNode）
3. 设置默认 `nodeTypes`（后续 U3 实现）
4. 设置 `onNodeDragStop` 更新节点位置到 store

**Patterns to follow**: 参考 `components/dds/DDSFlow.tsx` 的 React Flow 配置模式

**Test scenarios**:
- Happy path: 从 ComponentPanel 拖拽 Button 到画布，画布出现节点
- Happy path: 拖动节点后松开，位置已保存
- Edge case: 在画布外松开（节点不应创建）
- Edge case: 拖入无效 componentId（应忽略）

**Verification**: 拖入 3 个不同组件，位置各不相同，刷新页面后位置保留（localStorage）

---

### E1-U3 详细说明

**文件变更**: `components/prototype/ProtoNode.tsx` (新建)

**实现步骤**:
1. 使用 `lib/prototypes/ui-schema.ts` 的 renderer 逻辑渲染 UIComponent
2. 封装为 React Flow 自定义节点（`node.width`, `node.data`）
3. 节点显示组件标签 + mock 数据预览（如 Table 显示行数）
4. 双击节点打开属性面板

**Patterns to follow**: 参考 `lib/prototypes/ui-schema.ts` 的 `renderUIComponent()` 函数

**Test scenarios**:
- Happy path: Button 节点渲染为蓝色按钮
- Happy path: Table 节点显示 mock 数据行数
- Edge case: 未知组件类型显示占位符
- Edge case: mockData 为空时正常渲染

**Verification**: 拖入全部 10 个组件，逐一验证渲染结果符合预期

---

### E1-U4 详细说明

**文件变更**: `components/prototype/ProtoAttrPanel.tsx` (新建), `components/prototype/ProtoAttrPanel.module.css` (新建)

**实现步骤**:
1. 监听选中节点变化（Zustand `selectedNodeId`）
2. 渲染右侧抽屉面板，显示组件名称 + 类型
3. Props Tab: 渲染可编辑的 props 表单（key-value 对）
4. `onChange` 调用 store 更新，触发节点重新渲染

**Patterns to follow**: 参考 `components/dds/cards/CardRenderer.tsx` 的 schema-driven 渲染模式

**Test scenarios**:
- Happy path: 双击节点，面板打开并显示组件类型
- Happy path: 修改 props 值，节点 UI 立即更新
- Edge case: 无节点选中时面板隐藏

**Verification**: 修改 Button 的 `label` prop，节点上的按钮文字同步变化

---

## E2: Mock数据绑定

| ID | Name | E1-U1 | ✅ DONE | ✅ | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | Mock数据Tab实现 |E1-U1 | ✅ DONE | ✅ | E1-U4 | 属性面板有 Mock数据 Tab，输入 JSON 保存后无错误 |
| E2-U2 | 内嵌Mock存储与渲染 |E1-U1 | ✅ DONE | ✅ | E1-U3, E2-U1 | Mock数据随组件保存，刷新页面后保留，Table 使用 Mock 渲染 |

### E2-U1 详细说明

**文件变更**: `components/prototype/MockDataTab.tsx` (新建), `components/prototype/MockDataTab.module.css` (新建)

**实现步骤**:
1. ProtoAttrPanel 添加 Tab 栏（Props / Mock数据）
2. Mock数据 Tab 使用 `<textarea>` 接收 JSON 输入
3. `onBlur` 或点击"保存"时调用 `JSON.parse()` 验证
4. 验证失败显示红色错误提示（`JSON 格式错误`）
5. 验证成功调用 `store.updateNodeMockData()`

**Patterns to follow**: 参考 `components/dds/cards/BoundedContextCard.tsx` 的表单编辑模式

**Test scenarios**:
- Happy path: 输入有效 JSON `{ "items": [1,2,3] }`，保存成功
- Error path: 输入无效 JSON，显示"JSON 格式错误"红色提示
- Edge path: 数据超长（>50KB）显示截断提示
- Edge path: 空输入保存为空 mockData

**Verification**: 输入 Table Mock 数据 `[{"id":1,"name":"Alice"}]`，Table 节点渲染实际行数据

---

### E2-U2 详细说明

**文件变更**: `stores/prototypeStore.ts` (E2 部分), `components/prototype/ProtoNode.tsx` (E2 部分)

**实现步骤**:
1. `prototypeStore` 的 `addNode` 默认不带 mockData
2. `updateNodeMockData(nodeId, mockData)` 将 mockData 写入对应节点
3. `ProtoNode` 读取 `node.mockData`，如果是 Table/Form 类型，渲染 mockData 内容
4. localStorage 序列化包含 mockData

**Patterns to follow**: 参考 `stores/dds/DDSCanvasStore.ts` 的 chapter cards 持久化模式

**Test scenarios**:
- Happy path: Table 节点绑定 Mock 数据后渲染 3 行
- Happy path: 刷新页面后 Mock 数据完整保留
- Edge path: Mock 数据被清空后，Table 恢复空状态

**Verification**: 刷新页面后，Table 节点仍显示相同的 Mock 数据行

---

## E3: 路由树

| ID | Name | E1-U1 | ✅ DONE | ✅ | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | 页面列表视图实现 |E1-U1 | ✅ DONE | ✅ | E1-U2 | 左侧抽屉显示所有页面 route，添加/删除页面后列表同步 |
| E3-U2 | 路由导航跳转实现 |E1-U1 | ✅ DONE | ✅ | E3-U1 | 点击 route 列表项，画布跳转到对应节点并高亮 |

### E3-U1 详细说明

**文件变更**: `components/prototype/RoutingDrawer.tsx` (新建)

**实现步骤**:
1. 从 `UISchema.pages` 读取所有页面 route
2. 渲染左侧抽屉（参考 `DDSToolbar` 的抽屉组件模式）
3. 每个 route 项显示为可点击列表项
4. "添加页面"按钮 → 弹窗输入 route，调用 `store.addPage()`
5. "删除页面"按钮 → 调用 `store.removePage()`

**Patterns to follow**: 参考 `components/dds/canvas/DDSThumbNav.tsx` 的抽屉组件模式

**Test scenarios**:
- Happy path: 抽屉显示所有页面 route 列表
- Happy path: 添加新页面 /users 后，列表立即出现 /users
- Happy path: 删除页面后，列表移除对应项

**Verification**: 添加页面 /settings，抽屉列表出现 /settings

---

### E3-U2 详细说明

**文件变更**: `components/prototype/RoutingDrawer.tsx` (E3-2 部分), `components/prototype/ProtoFlowCanvas.tsx` (E3-2 部分)

**实现步骤**:
1. `store.navigateToNode(pageId)` 设置 `focusedNodeId`
2. `ProtoFlowCanvas` 监听 `focusedNodeId`，调用 React Flow 的 `fitView()` + 高亮节点
3. 高亮效果：节点添加 `highlighted` className（边框变亮）

**Patterns to follow**: 参考 `components/dds/DDSFlow.tsx` 的节点高亮逻辑

**Test scenarios**:
- Happy path: 点击 /dashboard 列表项，画布跳转并高亮对应节点
- Edge path: 节点不在可视区域，`fitView()` 调整视角
- Edge path: 无对应节点时无操作

**Verification**: 点击 /dashboard，对应页面节点被蓝色边框高亮

---

## E4: JSON导出增强

| ID | Name | E1-U1 | ✅ DONE | ✅ | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | 导出格式v2.0实现 |E1-U1 | ✅ DONE | ✅ | E2-U2, E3-U1 | 导出 JSON 包含 version:2.0 + routingTree + mockDataBindings |
| E4-U2 | Round-trip验证 |E1-U1 | ✅ DONE | ✅ | E4-U1 | 导出 JSON 重新导入，数据完整（nodes + pages + mockData） |

### E4-U1 详细说明

**文件变更**: `components/prototype/ProtoExporter.tsx` (扩展), `lib/prototypes/ui-schema.ts` (扩展导出接口)

**实现步骤**:
1. 扩展 `EnhancedPrototypeExport` 接口（见 architecture.md §3.2）
2. `prototypeStore.getExportData()` 聚合所有节点 + Mock数据 + 页面列表
3. ProtoExporter "导出 JSON" 按钮调用 `getExportData()`
4. 生成 JSON 后触发 download

**Patterns to follow**: 参考 `components/prototype/PrototypeExporter.tsx` 的现有导出模式

**Test scenarios**:
- Happy path: 导出 JSON 包含 version: '2.0'
- Happy path: 导出 JSON 包含 routingTree.pages 数组
- Happy path: 导出 JSON 包含 mockDataBindings 数组
- Edge path: 无 Mock 数据时 mockDataBindings 为空数组

**Verification**: 导出 JSON 后，用 JSON.parse() 验证所有字段存在

---

### E4-U2 详细说明

**文件变更**: `services/api/modules/prototype.ts` (扩展 import/export), `stores/prototypeStore.ts` (E4-2 部分)

**实现步骤**:
1. "导入 JSON" 按钮 → 读取 JSON 文件，调用 `prototypeStore.loadFromExport(data)`
2. `loadFromExport` 解析 routingTree + mockDataBindings + layout.nodes
3. 重建 store 状态，触发画布重渲染
4. 对比导入前后的节点数、Mock数据条数

**Test scenarios**:
- Happy path: 导出 JSON 导入后，节点数、Mock数据数完全一致
- Happy path: 导入包含 10 节点的 JSON，画布正确渲染
- Error path: 导入无效 JSON 显示错误提示

**Verification**: 导出 5 节点 → 导入 → 导出 → 两次 JSON 完全一致

---

## E5: 组件库完善

| ID | Name | E1-U1 | ✅ DONE | ✅ | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | 默认组件渲染验证 |E1-U1 | ✅ DONE | ✅ | E1-U3 | 10 个默认组件拖入画布后渲染正确（视觉可识别） |

### E5-U1 详细说明

**文件变更**: `components/prototype/ProtoNode.tsx` (E5-1 部分), `lib/prototypes/ui-schema.ts` (如需补充 renderer)

**实现步骤**:
1. 逐一验证 10 个组件的渲染效果（Button/Input/Card/Container/Header/Navigation/Modal/Table/Form/Image）
2. 如有组件 renderer 缺失或样式异常，补充实现
3. 使用 Playwright screenshot 对比验证（手动审查）

**Patterns to follow**: 参考 `lib/prototypes/ui-schema.ts` 的 `DEFAULT_COMPONENTS`

**Test scenarios**:
- Happy path: Button → 蓝色按钮
- Happy path: Input → 可输入文本框
- Happy path: Card → 带标题的卡片容器
- Happy path: Table → 显示表头和行数据
- Happy path: Modal → 弹窗遮罩
- Edge path: Navigation 渲染为空（允许，MVP 简单渲染）

**Verification**: 拖入全部 10 个组件，逐一截图确认视觉可识别

---

## 风险与依赖

| 风险 | 缓解 |
|------|------|
| E1-U2 React Flow 与组件面板拖拽冲突 | 使用 `onDragOver preventDefault` 区分 |
| E4 Round-trip 字段丢失 | 逐字段断言验证 |
| localStorage 容量超限 | 导出前检查大小 |
| **Round-trip 验证依赖已有数据** | MVP 阶段需先手动创建一些节点，再测试导出/导入 |
| **localStorage 是临时方案** | Sprint 2 需迁移到 D1；本 sprint 不做 migration |

## 技术审查发现

### Critical Issues（已处理）
1. Round-trip 验证依赖 localStorage 中已有数据（MVP 限制）：已在 E4-U2 测试场景中标注
2. UIPage.route 字段需手动输入：可从 UISchema.pages 推导，MVP 简化处理
3. prototypeStore 完全隔离于 DDSCanvasStore：无数据共享风险，架构清晰

**依赖链**: E1-U1 | ✅ DONE | ✅→ E1-U2 → E1-U3 → E1-U4 → E2-U1 → E2-U2 → E4-U1 → E4-U2
**可并行**: E3-U1 → E3-U2（独立于 E1/E2）
**独立**: E5-U1（可与 E1-U3 并行）
