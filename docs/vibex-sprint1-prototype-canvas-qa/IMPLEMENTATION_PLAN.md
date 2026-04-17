# Implementation Plan — vibex-sprint1-prototype-canvas-qa

**项目**: vibex-sprint1-prototype-canvas-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect
**上游**: prd.md, architecture.md

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 拖拽布局编辑器 | E1-U1 ~ E1-U4 | 0/4 | E1-U1 |
| E2: Mock 数据绑定 | E2-U1 ~ E2-U2 | 0/2 | E2-U1 |
| E3: 页面路由管理 | E3-U1 ~ E3-U2 | 0/2 | E3-U1 |
| E4: 导出与 Round-trip | E4-U1 ~ E4-U2 | 0/2 | E4-U1 |
| E5: 默认组件验证 | E5-U1 | 0/1 | E5-U1 |

---

## E1: 拖拽布局编辑器

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | 组件面板拖拽 | ⬜ | — | ComponentPanel 渲染 10 个组件卡片，dataTransfer 传递 JSON |
| E1-U2 | 画布节点创建 | ⬜ | E1-U1 | drop 事件 → store.addNode → 画布显示节点 |
| E1-U3 | 自定义节点渲染 | ⬜ | E1-U2 | ProtoNode 根据 type 调用 ui-schema render，10 种组件正确渲染 |
| E1-U4 | 属性面板编辑 | ⬜ | E1-U3 | 双击节点 → ProtoAttrPanel 打开 → props 修改 → 节点实时更新 |

### E1-U1: 组件面板拖拽

**文件**: `src/components/prototype/ComponentPanel.tsx`

**实现步骤**:
1. 确认 DEFAULT_COMPONENTS 包含 10 个组件（Button/Input/Card/Container/Header/Navigation/Modal/Table/Form/Image）
2. dragstart 事件通过 dataTransfer 传递 `{ componentType: string }` JSON
3. 拖拽时卡片半透明（`opacity: 0.5`）

**风险**: 无

**验收**:
- AC1: `expect(screen.getAllByRole('listitem')).toHaveLength(10)`
- AC2: `fireEvent.dragStart(screen.getByText('Button'))` → dataTransfer 包含 componentType

---

### E1-U2: 画布节点创建

**文件**: `src/components/prototype/ProtoFlowCanvas.tsx`

**实现步骤**:
1. ProtoFlowCanvas 监听 `onDrop`
2. 从 dataTransfer 解析组件类型
3. 调用 `prototypeStore.addNode(component, position)`
4. 空画布显示虚线引导框

**风险**: 无

**验收**:
- AC1: drop 有效组件 → `nodes.length > 0`
- AC2: 空画布有引导文案（非留白）

---

### E1-U3: 自定义节点渲染

**文件**: `src/components/prototype/ProtoNode.tsx`, `src/lib/prototypes/ui-schema.ts`

**实现步骤**:
1. ProtoNode 读取 `node.data.component`
2. 调用对应 ui-schema render 函数
3. 10 种组件渲染验证：
   - Button → 蓝色按钮
   - Input → 可聚焦文本框
   - Card → 带边框卡片
   - Table → 显示列
   - 等

**风险**: 无

**验收**:
- AC1: Button 节点渲染为蓝色按钮
- AC2: Input 节点渲染为可聚焦文本框
- AC3: Table 节点渲染显示表格结构

---

### E1-U4: 属性面板编辑

**文件**: `src/components/prototype/ProtoAttrPanel.tsx`

**实现步骤**:
1. ProtoFlowCanvas 节点双击 → `selectNode(nodeId)`
2. ProtoAttrPanel 响应 `selectedNodeId` → 显示属性表单
3. 修改 props → `updateNode(nodeId, data)`
4. 无选中节点时显示引导文案

**风险**: 无

**验收**:
- AC1: 双击节点后 panel 可见
- AC2: 修改属性后节点实时更新
- AC3: 无选中节点时显示引导文案

---

## E2: Mock 数据绑定

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | MockData Tab | ⬜ | E1-U4 | ProtoAttrPanel 内置 MockData Tab，切换后显示编辑器 |
| E2-U2 | Mock 数据渲染 | ⬜ | E2-U1 | 节点读取 mockData → ui-schema render → 显示 mock 内容 |

### E2-U1: MockData Tab

**文件**: `src/components/prototype/ProtoAttrPanel.tsx`

**实现步骤**:
1. ProtoAttrPanel 内部 Tab 切换（Props / MockData）
2. MockData Tab 显示 Key-Value 编辑器
3. "添加字段" / "删除字段" 功能
4. 保存后调用 `updateNodeMockData(nodeId, data)`

**风险**: 无

**验收**:
- AC1: Tab 切换可见
- AC2: 添加字段后编辑器显示新字段行
- AC3: 保存后节点预览实时更新

---

### E2-U2: Mock 数据渲染

**文件**: `src/components/prototype/ProtoNode.tsx`

**实现步骤**:
1. ProtoNode 读取 `node.data.mockData`
2. 传递给 ui-schema render 函数
3. 无 mockData 时回退到 `defaultProps`

**风险**: 低

**验收**:
- AC1: 绑定 mock 数据后节点显示 mock 内容
- AC2: 无 mock 数据时显示默认值

---

## E3: 页面路由管理

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | 页面列表管理 | ⬜ | — | RoutingDrawer 显示 pages 列表，addPage/removePage |
| E3-U2 | 页面导航切换 | ⬜ | E3-U1 | 点击页面 tab → store.selectPage(id) → currentPageId 更新 |

### E3-U1: 页面列表管理

**文件**: `src/components/prototype/RoutingDrawer.tsx`

**实现步骤**:
1. RoutingDrawer 展示 `pages` 列表
2. "添加页面" 按钮 → `addPage(route, name)`
3. 每页有删除按钮 → `removePage(pageId)`
4. 确认删除 dialog

**风险**: 无

**验收**:
- AC1: pages 列表正确显示
- AC2: addPage 后列表 +1
- AC3: removePage 后列表 -1，有确认 dialog

---

### E3-U2: 页面导航切换

**文件**: `src/components/prototype/RoutingDrawer.tsx`, `src/stores/prototypeStore.ts`

**实现步骤**:
1. RoutingDrawer 页面 tab 点击
2. 调用 `selectPage(pageId)` → store.currentPageId 更新
3. 方案A：nodes 全局共享，不做画布节点过滤

**风险**: 无

**验收**:
- AC1: 点击页面 tab → currentPageId 正确切换
- AC2: 当前页面 tab 高亮

---

## E4: 导出与 Round-trip

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | 导出格式 v2.0 | ✅ | — | getExportData() 返回含 version:'2.0' + nodes + edges + pages + mockDataBindings |
| E4-U2 | Round-trip 端到端测试 | ⬜ | E4-U1 | export → loadFromExport → re-export → 三项全等 |

### E4-U1: 导出格式 v2.0

**文件**: `src/stores/prototypeStore.ts` (已完成)

**状态**: ✅ 已实现，`getExportData()` 返回 `PrototypeExportV2` 含 `version: '2.0'`

**验收**:
- AC1: `expect(exportData.version).toBe('2.0')`
- AC2: `expect(exportData.nodes).toBeInstanceOf(Array)`
- AC3: `expect(exportData.pages).toBeDefined()`

---

### E4-U2: Round-trip 端到端测试

**文件**: `src/stores/prototypeStore.test.ts` (需新增)

**实现步骤**:
1. 新增 `test('E4-U2.1: export → loadFromExport → re-export → nodes 全等')`
2. 新增 `test('E4-U2.2: round-trip → pages 全等')`
3. 新增 `test('E4-U2.3: round-trip → mockDataBindings 全等')`
4. 新增 `test('E4-U2.4: 无效 version 忽略')`
5. 新增 `test('E4-U2.5: 空数据 round-trip')`

**风险**: 无

**验收**:
- AC1: export → loadFromExport → re-export 后 nodes 全等
- AC2: pages 全等
- AC3: mockDataBindings 全等

---

## E5: 默认组件验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | 默认组件验证 | ⬜ | — | DEFAULT_COMPONENTS 包含 10 个组件，每个有 name/render/defaultProps/alternatives |

### E5-U1: 默认组件验证

**文件**: `src/lib/prototypes/ui-schema.ts`

**实现步骤**:
1. 确认 DEFAULT_COMPONENTS 长度为 10
2. 确认每个组件有 name/render/defaultProps/alternatives
3. 10 个组件：Button / Input / Card / Container / Header / Navigation / Modal / Table / Form / Image

**风险**: 无

**验收**:
- AC1: `expect(DEFAULT_COMPONENTS).toHaveLength(10)`
- AC2: 每个组件字段完整（name/render/defaultProps/alternatives）

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint1-prototype-canvas-qa
- **执行日期**: 2026-04-18
