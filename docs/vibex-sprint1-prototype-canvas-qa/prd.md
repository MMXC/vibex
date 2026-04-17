# PRD — vibex-sprint1-prototype-canvas-qa

**项目**: vibex-sprint1-prototype-canvas-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: PM
**上游**: analysis.md (2026-04-18)
**产出**: plan/feature-list.md

---

## 执行摘要

### 背景
Vibex Sprint1 原型画布（Prototype Editor）已完成开发，代码存在性、TypeScript 编译、单元测试均通过 QA 验证（949行测试覆盖）。本 PRD 承接 Analyst 报告，定义研发完成标准（DoD）和验收标准（AC），确保交付质量。

### 目标
为 Sprint1 原型画布建立完整的验收标准体系，确保：
1. 拖拽布局编辑核心流程可测试
2. Mock 数据绑定功能可验证
3. 页面路由管理功能可追踪
4. 导出格式与 Round-trip 闭环可断言
5. 10 个默认组件渲染行为一致

### 成功指标
- 所有 Epic/Story 有对应的 `expect()` 可写断言
- Round-trip 端到端测试覆盖 `export → import → 数据完全一致`
- 验收标准可由 QA 直接转化为测试用例
- 0 个阻塞性 P0 缺陷遗留到下一阶段

---

## 1. 功能点总表

| ID | 功能点 | 描述 | 验收标准（可写 expect()） | 页面集成 |
|----|--------|------|--------------------------|---------|
| F1.1 | 组件面板拖拽 | ComponentPanel 展示 10 组件卡片，dataTransfer JSON | expect(screen.getByText('Button')).toBeInTheDocument(); expect(dragEvent.dataTransfer.getData('componentType')).toBe('Button') | 【需页面集成】ProtoEditor |
| F1.2 | 画布节点创建 | ProtoFlowCanvas 接收 drop → addNode → store 更新 | expect(store.getState().nodes.length).toBeGreaterThan(0) after drop event | 【需页面集成】ProtoFlowCanvas |
| F1.3 | 节点组件渲染 | ProtoNode 根据 type 渲染 10 种组件（Button 蓝/Input 可输入等） | expect(screen.getByRole('button', { name: /button/i })).toBeInTheDocument(); userEvent.type(screen.getByRole('textbox'), 'test') | 【需页面集成】ProtoNode |
| F1.4 | 属性面板编辑 | 双击节点 → ProtoAttrPanel 打开 → props 修改 → 节点实时更新 | expect(screen.getByLabelText('props-panel')).toBeVisible() after dblclick; userEvent.clear(input); userEvent.type(input, 'newValue'); expect(node.props.text).toBe('newValue') | 【需页面集成】ProtoAttrPanel |
| F2.1 | MockData Tab | ProtoAttrPanel 内置 MockData Tab，切换 Tab → 显示 mock 数据编辑器 | expect(screen.getByRole('tab', { name: /mockdata/i })).toBeInTheDocument(); userEvent.click(screen.getByRole('tab', { name: /mockdata/i })); expect(screen.getByLabelText('mock-data-editor')).toBeVisible() | 【需页面集成】ProtoAttrPanel |
| F2.2 | Mock数据渲染 | 节点预览读取 mockDataBindings → 显示 mock 数据内容 | expect(screen.getByText(mockData.text)).toBeInTheDocument() when mockData bound | 【需页面集成】ProtoNode |
| F3.1 | 页面列表管理 | RoutingDrawer 展示 pages 列表，支持 addPage/removePage | expect(screen.getByRole('button', { name: /add page/i })).toBeInTheDocument(); userEvent.click(addBtn); expect(store.getState().pages.length).toBeGreaterThan(0) | 【需页面集成】RoutingDrawer |
| F3.2 | 页面导航切换 | 点击页面 tab → 画布切换高亮节点集（方案A：全局共享） | expect(screen.getByRole('tab', { name: 'Page 2' })).toBeInTheDocument(); userEvent.click(screen.getByRole('tab', { name: 'Page 2' })); expect(store.getState().currentPageId).toBe('page-2-id') | 【需页面集成】RoutingDrawer |
| F4.1 | 导出格式 v2.0 | prototypeStore.getExportData() 返回含 version:'2.0' + nodes + edges + pages + mockDataBindings | const data = store.getState().getExportData(); expect(data.version).toBe('2.0'); expect(data.nodes).toBeDefined(); expect(data.edges).toBeDefined(); expect(data.pages).toBeDefined(); expect(data.mockDataBindings).toBeDefined() | 无（store 层） |
| F4.2 | Round-trip 端到端测试 | export → JSON → loadFromExport → compare → 数据完全一致 | const exported = store.getState().getExportData(); const newStore = create(); newStore.getState().loadFromExport(exported); const reExported = newStore.getState().getExportData(); expect(reExported.nodes).toEqual(exported.nodes); expect(reExported.pages).toEqual(exported.pages); expect(reExported.mockDataBindings).toEqual(exported.mockDataBindings) | 无（store 测试） |
| F5.1 | 默认组件验证 | 10 个 DEFAULT_COMPONENTS 定义正确（Button/Input/Card/Container/Header/Navigation/Modal/Table/Form/Image） | expect(DEFAULT_COMPONENTS).toHaveLength(10); DEFAULT_COMPONENTS.forEach(c => { expect(c.name).toBeTruthy(); expect(c.render).toBeDefined(); expect(c.defaultProps).toBeDefined(); }) | 无（数据验证） |

---

## 2. Epic 拆分

### E1: 拖拽布局编辑器

**Epic 目标**: 用户可在画布上通过拖拽组件卡片创建页面布局，并编辑节点属性。

#### 2a. 本质需求穿透

- **用户的底层动机**: 快速搭原型页面，不需要写代码就能看到 UI 效果
- **去掉现有方案，理想解法**: 无代码可视化编辑器 → 拖拽即出 UI
- **解决的本质问题**: 让非开发者也能快速表达页面结构

#### 2b. 最小可行范围

- **本期必做**: E1-U1~U4（组件拖拽 + 画布创建 + 节点渲染 + 属性编辑）
- **本期不做**: 无
- **暂缓**: 节点拖拽位置微调（已有 drag，但位置记录精度待优化）

#### 2c. 用户情绪地图

**关键页面: ProtoEditor（拖拽布局编辑器）**
- **进入时**: 期待感——看到 10 个组件卡片，知道可以开始拖了
- **迷路时**: 不知道组件该拖到哪 → 画布需有虚线框提示"拖到这里"
- **出错时**: 拖到无效区域松开 → Toast 提示"请拖到画布区域"

#### E1-U1: 组件面板
- **Story**: ComponentPanel 展示 10 个组件卡片，拖拽时通过 dataTransfer 传递组件类型 JSON
- **工时**: 0.5d
- **验收标准**: `expect(screen.getAllByRole('listitem')).toHaveLength(10)` + drag dataTransfer 验证

#### E1-U2: 画布拖拽区域
- **Story**: ProtoFlowCanvas 监听 onDrop → 调用 store.addNode → 画布渲染新节点
- **工时**: 0.5d
- **验收标准**: `expect(store.getState().nodes.length).toBeGreaterThan(0)` after valid drop event

#### E1-U3: 自定义节点渲染
- **Story**: ProtoNode 读取 node.type → 调用 ui-schema 中对应 render 函数 → 渲染对应组件（Button 蓝色/Input 可输入/Table 显示列等）
- **工时**: 0.5d
- **验收标准**: Button 渲染为蓝色按钮；Input 渲染为可聚焦文本框；Card 渲染为带边框卡片

#### E1-U4: 节点属性面板
- **Story**: 双击节点 → ProtoAttrPanel 打开 → 显示 props 表单 → 修改后节点实时更新
- **工时**: 0.5d
- **验收标准**: 双击节点后 expect(panel).toBeVisible()；修改 input 后节点 props 更新

#### 2d. UI 状态规范（Spec 阶段）

详见 `specs/E1-drag-drop-editor.md`：
- ComponentPanel 卡片：理想态/空状态/加载态/错误态
- ProtoFlowCanvas 画布：理想态/空状态（虚线提示）/加载态/错误态
- ProtoAttrPanel：理想态/空状态（无选中节点）/加载态/错误态

---

### E2: Mock 数据绑定

**Epic 目标**: 为原型节点绑定 mock 数据，实现"带数据"的原型预览。

#### 2a. 本质需求穿透

- **用户的底层动机**: 看组件渲染"假数据"时的样子（表单里有没有内容、表格里有没有行）
- **去掉现有方案，理想解法**: 点一个 Tab 就能给组件填 mock 数据
- **解决的本质问题**: 空组件看不出实际效果，必须有数据

#### 2b. 最小可行范围

- **本期必做**: E2-U1~U2（MockData Tab + 渲染）
- **本期不做**: mock 数据模板预设（手动填）
- **暂缓**: mock 数据从 JSON 文件导入

#### 2c. 用户情绪地图

**关键页面: ProtoAttrPanel MockData Tab**
- **进入时**: 期待看到模拟数据长什么样
- **迷路时**: 不知道在哪里绑定数据 → Tab 切换文案提示"切换到此 Tab 可绑定模拟数据"
- **出错时**: 数据格式非法 → 内联错误提示 + 不丢失用户已输入内容

#### E2-U1: MockData Tab
- **Story**: ProtoAttrPanel 内置 MockData Tab，切换后显示 JSON 编辑器或 Key-Value 表单
- **工时**: 0.5d
- **验收标准**: Tab 存在且可点击；切换后编辑器可见

#### E2-U2: Mock 数据渲染
- **Story**: ProtoNode 读取 node.mockData → 传给 ui-schema render → 渲染带数据节点
- **工时**: 0.5d
- **验收标准**: `expect(screen.getByText('mock content')).toBeInTheDocument()` when mockData bound

---

### E3: 页面路由管理

**Epic 目标**: 支持多页面原型，支持页面间导航关系展示。

#### 2a. 本质需求穿透

- **用户的底层动机**: 搭多页面的原型，看页面之间的跳转关系
- **去掉现有方案，理想解法**: 侧边栏列出所有页面，点哪页切到哪
- **解决的本质问题**: 单页原型无法表达多页面应用

#### 2b. 最小可行范围

- **本期必做**: E3-U1~U2（页面列表 + 切换）
- **本期不做**: 每个 page 独立节点集（当前方案A全局共享，够用）
- **暂缓**: 页面间连线关系可视化

#### 2c. 用户情绪地图

**关键页面: RoutingDrawer**
- **进入时**: 想看到自己创建了哪些页面
- **迷路时**: 不知道在哪里添加页面 → drawer 顶部有"添加页面"按钮 + 引导文案
- **出错时**: 删除页面有确认 dialog

#### E3-U1: 页面列表管理
- **Story**: RoutingDrawer 展示 pages 列表，显示页面名称；支持 addPage/removePage
- **工时**: 0.5d
- **验收标准**: expect(screen.getByRole('list')).toHaveLength(n); addPage 后长度 +1

#### E3-U2: 页面导航切换
- **Story**: 点击页面 tab → store.selectPage(id) → 当前 pageId 更新
- **工时**: 0.5d
- **验收标准**: `expect(store.getState().currentPageId).toBe(targetId)` after click

---

### E4: 导出与 Round-trip

**Epic 目标**: 原型数据可导出为 JSON，并能从 JSON 完整恢复（闭环验证）。

#### 2a. 本质需求穿透

- **用户的底层动机**: 导出的 JSON 可以给别人用，或存到后端
- **去掉现有方案，理想解法**: 一键导出 v2.0 格式，支持重新导入
- **解决的本质问题**: 原型数据必须能持久化和迁移

#### 2b. 最小可行范围

- **本期必做**: E4-U1 + E4-U2（含缺失的 Round-trip 测试）
- **本期不做**: PrototypeExporter.tsx 独立组件接入 ProtoEditor（已有 inline export modal 够用）
- **暂缓**: 导出为 HTML/图片格式

#### 2c. 用户情绪地图

**关键页面: ProtoEditor Export Modal**
- **进入时**: 想导出保存
- **迷路时**: 不知道导出在哪里 → Toolbar 有 Export 按钮
- **出错时**: 导出失败 → 错误提示 + 重试按钮

#### E4-U1: 导出格式 v2.0
- **Story**: prototypeStore.getExportData() 返回 PrototypeExportV2，含 version:'2.0' + nodes + edges + pages + mockDataBindings
- **工时**: 0.5d
- **验收标准**: `expect(exportData.version).toBe('2.0')`; 所有字段存在且类型正确

#### E4-U2: Round-trip 端到端测试
- **Story**: export → JSON → loadFromExport → re-export → compare → 数据完全一致
- **工时**: 1d
- **验收标准**: Round-trip 前后 nodes/pages/mockDataBindings 三项全等

---

### E5: 默认组件验证

**Epic 目标**: 确认 10 个默认组件定义完整且正确。

#### 2a. 本质需求穿透

- **用户的底层动机**: 用的组件都是开箱即用的
- **去掉现有方案，理想解法**: 有哪些组件、能怎么配置，一看就明白
- **解决的本质问题**: 组件定义不完整 → 拖上去无法渲染

#### 2b. 最小可行范围

- **本期必做**: E5-U1
- **本期不做**: 无
- **暂缓**: 组件自定义配置面板

#### E5-U1: 默认组件验证
- **Story**: DEFAULT_COMPONENTS 包含 10 个组件（Button/Input/Card/Container/Header/Navigation/Modal/Table/Form/Image），每个有 name/render/defaultProps/alternatives
- **工时**: 0.5d
- **验收标准**: `expect(DEFAULT_COMPONENTS).toHaveLength(10)`; 每个组件字段完整

---

## 3. 优先级矩阵

| 优先级 | Epic | Story | 功能点 | 依据 |
|--------|------|-------|--------|------|
| P0 | E1 | E1-U1~U4 | 拖拽布局编辑器（全部） | 核心流程，无则无法使用 |
| P0 | E4 | E4-U1 | 导出格式 v2.0 | 数据持久化基础 |
| P0 | E4 | E4-U2 | Round-trip 端到端测试 | Analyst GAP，QA 验证必须 |
| P0 | E5 | E5-U1 | 默认组件验证 | 渲染正确性保证 |
| P1 | E2 | E2-U1~U2 | Mock 数据绑定 | 提升原型真实感 |
| P1 | E3 | E3-U1~U2 | 页面路由管理 | 多页面支持 |
| P2 | E4 | PrototypeExporter 接入 | 575行组件接入 | 冗余代码，暂缓 |

**决策**: P0 功能必须在 DoD 中 100% 覆盖，P1 功能达到 90% 覆盖率即可视为 DoD 完成。

---

## 4. 验收标准汇总（expect() 条目）

### E1 拖拽布局编辑器

```
// E1-U1 ComponentPanel
expect(screen.getByText('Button')).toBeInTheDocument()
expect(screen.getByText('Input')).toBeInTheDocument()
expect(screen.getByText('Card')).toBeInTheDocument()
expect(screen.getAllByRole('listitem')).toHaveLength(10)
const dragStartHandler = jest.fn()
fireEvent(screen.getByText('Button'), 'dragStart')
expect(dragStartHandler).toHaveBeenCalledWith(expect.objectContaining({ dataTransfer: expect.any(DataTransfer) }))

// E1-U2 ProtoFlowCanvas
expect(screen.getByTestId('proto-flow-canvas')).toBeInTheDocument()
fireEvent.drop(screen.getByTestId('proto-flow-canvas'), { dataTransfer: mockDataTransfer('Button') })
expect(usePrototypeStore.getState().nodes.length).toBeGreaterThan(0)

// E1-U3 ProtoNode
expect(screen.getByRole('button', { name: /button/i })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /button/i })).toHaveAttribute('style', expect.stringContaining('blue'))
userEvent.type(screen.getByRole('textbox'), 'typed text')
expect(screen.getByRole('textbox')).toHaveValue('typed text')

// E1-U4 ProtoAttrPanel
expect(usePrototypeStore.getState().selectedNodeId).toBeNull()
fireEvent.dblClick(screen.getByTestId('proto-node'))
expect(usePrototypeStore.getState().selectedNodeId).toBeTruthy()
expect(screen.getByTestId('proto-attr-panel')).toBeVisible()
```

### E2 Mock 数据绑定

```
// E2-U1 MockData Tab
expect(screen.getByRole('tab', { name: /mockdata/i })).toBeInTheDocument()
userEvent.click(screen.getByRole('tab', { name: /mockdata/i }))
expect(screen.getByTestId('mock-data-editor')).toBeVisible()

// E2-U2 Mock 渲染
const nodeWithMock = { id: 'n1', type: 'Input', mockData: { text: 'mock@example.com' } }
render(<ProtoNode {...nodeWithMock} />)
expect(screen.getByDisplayValue('mock@example.com')).toBeInTheDocument()
```

### E3 页面路由管理

```
// E3-U1 页面列表
expect(screen.getByRole('list')).toBeInTheDocument()
expect(screen.getByRole('list').children).toHaveLength(initialPageCount)
userEvent.click(screen.getByRole('button', { name: /add page/i }))
expect(usePrototypeStore.getState().pages.length).toBe(initialPageCount + 1)
userEvent.click(screen.getByRole('button', { name: /delete page/i }).first())
expect(usePrototypeStore.getState().pages.length).toBe(initialPageCount)

// E3-U2 页面切换
expect(screen.getByRole('tab', { name: 'Page 2' })).toBeInTheDocument()
userEvent.click(screen.getByRole('tab', { name: 'Page 2' }))
expect(usePrototypeStore.getState().currentPageId).toBe('page-2-id')
```

### E4 导出与 Round-trip

```
// E4-U1 导出格式
const data = usePrototypeStore.getState().getExportData()
expect(data.version).toBe('2.0')
expect(data.nodes).toBeInstanceOf(Array)
expect(data.edges).toBeInstanceOf(Array)
expect(data.pages).toBeInstanceOf(Array)
expect(data.mockDataBindings).toBeInstanceOf(Array)

// E4-U2 Round-trip
const exported = usePrototypeStore.getState().getExportData()
const freshStore = create()
freshStore.getState().loadFromExport(exported)
const reExported = freshStore.getState().getExportData()
expect(reExported.nodes).toEqual(exported.nodes)
expect(reExported.edges).toEqual(exported.edges)
expect(reExported.pages).toEqual(exported.pages)
expect(reExported.mockDataBindings).toEqual(exported.mockDataBindings)
```

### E5 默认组件

```
// E5-U1
expect(DEFAULT_COMPONENTS).toHaveLength(10)
const names = ['Button', 'Input', 'Card', 'Container', 'Header', 'Navigation', 'Modal', 'Table', 'Form', 'Image']
DEFAULT_COMPONENTS.forEach((comp, i) => {
  expect(comp.name).toBe(names[i])
  expect(typeof comp.render).toBe('function')
  expect(comp.defaultProps).toBeDefined()
  expect(Array.isArray(comp.alternatives)).toBe(true)
})
```

---

## 5. DoD (Definition of Done)

### 研发完成判断标准

1. **E1 拖拽布局编辑器**
   - [ ] ComponentPanel 渲染 10 个组件卡片（Button/Input/Card/Container/Header/Navigation/Modal/Table/Form/Image）
   - [ ] 拖拽事件触发 store.addNode()，节点出现在画布
   - [ ] 10 种节点类型渲染正确（Button 蓝、Input 可输入、Table 有列等）
   - [ ] 双击节点打开 ProtoAttrPanel，属性修改实时反映到节点
   - [ ] TypeScript 编译 0 errors
   - [ ] ProtoNode.test.tsx / ComponentPanel.test.tsx / ProtoFlowCanvas.test.tsx / ProtoAttrPanel.test.tsx 全部通过

2. **E2 Mock 数据绑定**
   - [ ] ProtoAttrPanel 有 MockData Tab（切换可见）
   - [ ] 绑定 mock 数据后节点预览显示对应内容
   - [ ] 单元测试通过

3. **E3 页面路由管理**
   - [ ] RoutingDrawer 显示 pages 列表
   - [ ] addPage/removePage 操作正确更新 store.pages
   - [ ] 点击页面 tab，currentPageId 正确切换
   - [ ] 单元测试通过

4. **E4 导出与 Round-trip**
   - [ ] prototypeStore.getExportData() 返回 version:'2.0' 格式
   - [ ] Round-trip 端到端测试存在且通过：`export → loadFromExport → re-export → 三项全等`
   - [ ] prototypeStore.test.ts 新增 E4-U2 测试用例

5. **E5 默认组件**
   - [ ] DEFAULT_COMPONENTS 长度为 10
   - [ ] 每个组件有 name/render/defaultProps/alternatives 字段
   - [ ] 渲染验证测试通过

6. **全局**
   - [ ] pnpm exec tsc --noEmit → 0 errors
   - [ ] pnpm test → 全部通过
   - [ ] pnpm dev → Dev Server 正常启动（middleware 警告可忽略）

---

## 6. Specs 索引

| Spec 文件 | 对应 Epic | 描述 |
|-----------|---------|------|
| specs/E1-drag-drop-editor.md | E1 | 拖拽布局编辑器四态定义 |
| specs/E2-mock-data-binding.md | E2 | Mock 数据绑定四态定义 |
| specs/E3-routing-management.md | E3 | 页面路由管理四态定义 |
| specs/E4-export-roundtrip.md | E4 | 导出格式与 Round-trip 测试规格 |
| specs/E5-default-components.md | E5 | 默认组件验证规格 |

---

## 7. 已知问题处理

| Issue | 处理 | 责任人 |
|-------|------|--------|
| E4-U2 Round-trip 测试缺失 | 本期补测（F4.2），写入 prototypeStore.test.ts | Dev |
| PrototypeExporter.tsx 未接入 | 标记为废弃，不接入本期，记录在 changelog | Coord |
| Dev Server middleware 警告 | 全局问题，不在本期处理，coord 后续安排 | Coord |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint1-prototype-canvas-qa
- **执行日期**: 2026-04-18
