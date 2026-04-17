# PRD — vibex-sprint5-delivery-integration

**项目**: vibex-sprint5-delivery-integration
**版本**: v1.0
**日期**: 2026-04-18
**角色**: PM
**上游**: analysis.md (2026-04-18)
**产出**: plan/feature-list.md

---

## 执行摘要

### 背景
Sprint5 是**集成收口**项目，不是新功能构建。它把 Sprint1-4 的产出物（原型画布 + 详设画布）与已有交付基础设施打通，形成端到端交付闭环。已有 1912 行交付中心代码分布在 8 个文件中，可直接复用。Sprint5 的主要工作是修改 `deliveryStore.loadMockData()`，将 mock 数据替换为真实数据拉取。

### 目标
1. Delivery Center 数据来源从 mock 切换为 `prototypeStore` + `DDSCanvasStore` 真实数据
2. 在 Prototype Canvas、DDS Canvas、Delivery Center 之间建立双向跳转
3. 交付导出器接入真实数据（DDL + Component + OpenAPI + PRD）
4. Delivery Center 具备完整的空状态/骨架屏/错误态

### 成功指标
- Delivery Center 显示真实 ProtoNode 数据（不是 mock）
- Delivery Center 显示真实 BoundedContext + BusinessFlow 数据
- Toolbar 有导出入口，Delivery Center 有返回按钮
- 批量导出 ZIP 包含 4 个文件（spec.json/openapi.yaml/ddl.sql/prd.md）
- 所有涉及页面的 Epic 有四态规范
- 0 个阻塞性 P0 缺陷遗留

### Sprint4 依赖说明
- **F-C.3（OpenAPI Tab）**依赖 Sprint4 的 `APICanvasExporter`。若 Sprint4 未完成，DeliveryTabs 降级为 4 Tab（章节/流程/组件/PRD），API Tab 隐藏。
- Sprint4 和 Sprint5 可并行开发，Sprint5 用条件渲染处理依赖。

---

## 1. 功能点总表

| ID | 功能点 | 描述 | 验收标准（expect()） | 页面集成 |
|----|--------|------|---------------------|---------|
| F-A.1 | deliveryStore 真实数据加载 | loadMockData() 调用真实 store，拉取 prototypeStore + DDSCanvasStore 数据 | const store = useDeliveryStore.getState(); store.loadMockData(); expect(store.contexts.length).toBeGreaterThan(0) // 非 mock | 【需页面集成】Delivery Center |
| F-A.2 | ProtoNode → Component 转换 | prototypeStore.getExportData().nodes → Component[] | const comp = toComponent(protoNode); expect(comp.id).toBeTruthy(); expect(comp.name).toBeTruthy(); expect(comp.type).toBe('component') | 无（数据转换） |
| F-A.3 | DDSCanvasStore → Context 转换 | ddsCanvasStore.chapters.context.cards → BoundedContext[] | const ctx = toBoundedContext(card); expect(ctx.id).toBeTruthy(); expect(ctx.name).toBeTruthy() | 无（数据转换） |
| F-A.4 | PRD 自动生成 | prototypeStore + DDSCanvasStore → PRD 大纲（页面列表+组件清单+API端点） | const prd = generatePRD(prototypeStore, ddsCanvasStore); expect(prd.pages).toBeDefined(); expect(prd.components).toBeDefined(); expect(prd.apiEndpoints).toBeDefined() | 【需页面集成】Delivery Center PRD Tab |
| F-B.1 | ProtoEditor → DDS Canvas 跳转 | 节点右键菜单 "查看上下文" → router.push('/design/dds-canvas?projectId=...') | fireEvent.contextMenu(node); expect(screen.getByText('查看上下文')).toBeInTheDocument(); userEvent.click(screen.getByText('查看上下文')); expect(router.push).toHaveBeenCalledWith(expect.stringContaining('dds-canvas')) | 【需页面集成】ProtoEditor |
| F-B.2 | DDS Canvas → ProtoEditor 跳转 | BoundedContextCard "查看原型" → router.push('/prototype/editor?projectId=...') | fireEvent.click(screen.getByText('查看原型')); expect(router.push).toHaveBeenCalledWith(expect.stringContaining('prototype/editor')) | 【需页面集成】BoundedContextCard |
| F-B.3 | Toolbar 导出入口 | DDSToolbar + ProtoEditor toolbar 增加导出按钮 | expect(screen.getByRole('button', { name: /导出/i })).toBeInTheDocument(); userEvent.click(screen.getByRole('button', { name: /导出/i })); expect(router.push).toHaveBeenCalledWith(expect.stringContaining('delivery')) | 【需页面集成】DDSToolbar + ProtoEditor |
| F-B.4 | Delivery Center 返回按钮 | 返回编辑按钮，返回来源 Canvas | expect(screen.getByRole('button', { name: /返回编辑/i })).toBeInTheDocument(); userEvent.click(screen.getByRole('button', { name: /返回编辑/i })); expect(router.back).toHaveBeenCalled() | 【需页面集成】Delivery Center |
| F-C.1 | DDL 生成器 | BoundedContext → SQL DDL（CREATE TABLE 语句） | const ddl = exportToDDL(contexts); expect(ddl).toMatch(/CREATE TABLE/i); expect(ddl).toMatch(/PRIMARY KEY/i); expect(() => parseDDL(ddl)).not.toThrow() | 无（导出函数） |
| F-C.2 | ComponentTab 真实数据 | 组件列表显示真实 ProtoNode，替换 mock | const tab = screen.getByTestId('component-tab'); expect(within(tab).getAllByTestId('component-item').length).toBeGreaterThan(0); expect(within(tab).queryByText('Mock Component')).not.toBeInTheDocument() | 【需页面集成】ComponentTab |
| F-C.3 | OpenAPI Tab 集成 | Sprint4 APICanvasExporter → API Tab；不存在时降级隐藏 | // Sprint4 完成后测试; const hasAPITab = screen.queryByRole('tab', { name: /api/i }); Sprint4完成 ? expect(hasAPITab).toBeInTheDocument() : expect(hasAPITab).toBeNull() | 【需页面集成】DeliveryTabs |
| F-C.4 | DeliveryTabs 5 Tab | 5 个 Tab：章节/流程/组件/PRD/API | expect(screen.getByRole('tab', { name: /章节/i })).toBeInTheDocument(); expect(screen.getByRole('tab', { name: /流程/i })).toBeInTheDocument(); expect(screen.getByRole('tab', { name: /组件/i })).toBeInTheDocument(); expect(screen.getByRole('tab', { name: /PRD/i })).toBeInTheDocument() | 【需页面集成】DeliveryTabs |
| F-C.5 | 批量导出 ZIP | 4 个文件打包下载（spec.json/openapi.yaml/ddl.sql/prd.md） | userEvent.click(screen.getByRole('button', { name: /批量导出/i })); const blob = await downloadBlob(); const zip = await JSZip.loadAsync(blob); const files = Object.keys(zip.files); expect(files).toContain('spec.json'); expect(files).toContain('openapi.yaml'); expect(files).toContain('ddl.sql'); expect(files).toContain('prd.md') | 【需页面集成】Delivery Center |
| F-D.1 | PRD Tab 真实数据 | PRD 从 prototype + DDS 实时生成，显示页面列表/组件清单/API端点 | switchToTab('prd'); expect(screen.getByText(/页面列表/i)).toBeInTheDocument(); expect(screen.getByText(/组件清单/i)).toBeInTheDocument(); expect(screen.queryByText(/Mock PRD Content/i)).not.toBeInTheDocument() | 【需页面集成】PRDTab |
| F-D.2 | PRD Markdown 导出 | 导出为 .md 文件 | userEvent.click(screen.getByRole('button', { name: /导出 Markdown/i })); expect(downloadBlob().then(b => b.text())).resolves.toMatch(/^# .+/) // h1 标题存在 | 【需页面集成】PRDTab |
| F-D.3 | PRD 预览编辑器 | PRDTab 内嵌 Markdown 预览/编辑切换 | expect(screen.getByRole('button', { name: /预览/i })).toBeInTheDocument(); expect(screen.getByRole('button', { name: /编辑/i })).toBeInTheDocument(); userEvent.click(screen.getByRole('button', { name: /编辑/i })); expect(screen.getByRole('textbox')).toBeInTheDocument() | 【需页面集成】PRDTab |
| F-E.1 | 空数据引导 | Delivery Center 无数据时引导用户去编辑页面 | const store = createDeliveryStore({ contexts: [], flows: [], components: [] }); expect(screen.getByText(/请先创建/i)).toBeInTheDocument(); expect(screen.getByRole('button', { name: /去编辑/i })).toBeInTheDocument() | 【需页面集成】Delivery Center |
| F-E.2 | 导出失败 toast | 导出异常显示 toast，不崩溃 | await exportAll('components'); expect(screen.getByText(/导出失败/i)).toBeInTheDocument(); expect(screen.queryByRole('button', { name: /批量导出/i })).toBeInTheDocument() // 按钮仍在 | 【需页面集成】Delivery Center |
| F-E.3 | 加载骨架屏 | 数据加载时骨架屏 | deliveryStore.getState().loadMockData(); expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument(); await waitFor(() => expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()) | 【需页面集成】Delivery Center |

---

## 2. Epic 拆分

### E1: 数据层集成

**Epic 目标**: Delivery Center 数据来源从 mock 替换为 `prototypeStore` + `DDSCanvasStore` 真实数据，实现"在哪里编辑，就在哪里交付"。

#### 2a. 本质需求穿透

- **用户的底层动机**: 在原型画布和详设画布辛辛苦苦画的图，导出时要一模一样看到
- **去掉数据集成会怎样**: 交付中心显示假数据，用户不相信交付物
- **解决的本质问题**: 编辑和交付的数据必须同源，否则就是两份工作

#### 2b. 最小可行范围

- **本期必做**: A1（loadMockData → 真实数据）+ A2（ProtoNode → Component）+ A3（DDSCanvasStore → Context/Flow）
- **本期不做**: A4（PRD 自动生成，结构化输出后可人工补充）
- **暂缓**: AI 生成 PRD 内容

#### 2c. 用户情绪地图

**关键页面: Delivery Center 组件 Tab**
- **进入时**: 期待看到自己画的组件列表
- **迷路时**: 不知道数据从哪来 → Tab 标题显示"来自原型画布"
- **出错时**: 组件列表为空 → 引导文案"原型画布中还没有组件，请先添加"

#### E1-A1: deliveryStore 真实数据加载
- **Story**: `deliveryStore.loadMockData()` 改为调用 `prototypeStore.getState().getExportData()` 和 `ddsCanvasStore.getState().chapters`
- **工时**: 2h
- **验收标准**: Delivery Center 显示真实 canvas 数据，不再有 "Mock" 前缀内容

#### E1-A2: ProtoNode → Component 转换
- **Story**: `toComponent()` 将 ProtoNode 转换为 DeliveryState.Component 接口
- **工时**: 1h
- **验收标准**: `expect(comp.type).toBe('component')`; 字段映射正确

#### E1-A3: DDSCanvasStore → Context/Flow 转换
- **Story**: `toBoundedContext()` / `toBusinessFlow()` 将 store cards 转换为交付接口
- **工时**: 1h
- **验收标准**: `expect(ctx.id).toBeTruthy()`; 数据完整

#### E1-A4: PRD 自动生成
- **Story**: `generatePRD()` 整合 prototypeStore + DDSCanvasStore → 结构化 PRD 大纲
- **工时**: 3h
- **验收标准**: PRD 大纲包含 pages/components/apiEndpoints 三部分

#### 2d. UI 状态规范

详见 `specs/E1-data-integration.md`

---

### E2: 双向跳转

**Epic 目标**: 在 Prototype Canvas、DDS Canvas、Delivery Center 之间建立自然流转，用户不需要记住 URL。

#### 2a. 本质需求穿透

- **用户的底层动机**: 编辑到一半想看交付效果，不用复制粘贴 URL
- **去掉跳转会怎样**: 用户在不同页面之间靠记忆跳转，容易迷路
- **解决的本质问题**: 三个工具是同一个工作流的三个视图，必须能互操作

#### 2b. 最小可行范围

- **本期必做**: B1（ProtoEditor → DDS）+ B3（导出入口）
- **本期不做**: B2（DDS → ProtoEditor）+ B4（返回按钮）
- **暂缓**: 面包屑导航、历史记录

#### 2c. 用户情绪地图

**关键页面: ProtoEditor 节点右键菜单**
- **进入时**: 想快速跳到上下文
- **迷路时**: 不知道节点对应哪个上下文 → 菜单显示 "查看上下文 (BoundedContext: XXX)"
- **出错时**: 跳转失败 → toast "无法跳转，请检查 DDS Canvas 数据"

#### E2-B1: ProtoEditor → DDS Canvas 跳转
- **Story**: ProtoNode 右键菜单增加 "查看上下文" 选项，点击后 `router.push('/design/dds-canvas?projectId=...&highlight=bc-xxx')`
- **工时**: 1h
- **验收标准**: 右键菜单出现 + 跳转 URL 正确

#### E2-B3: Toolbar 导出入口
- **Story**: DDSToolbar 和 ProtoEditor toolbar 增加导出按钮（图标+文案）
- **工时**: 1h
- **验收标准**: 两个 toolbar 都有导出按钮

#### 2d. UI 状态规范

详见 `specs/E2-navigation.md`

---

### E3: 交付导出器

**Epic 目标**: 复用已有导出器代码，接入真实数据后支持 DDL/Component/OpenAPI/PRD 批量导出。

#### 2a. 本质需求穿透

- **用户的底层动机**: 交付物要打包带走，一个 ZIP 包含所有规格文档
- **去掉批量导出会怎样**: 只能一个一个 Tab 导出，用户得手动打包
- **解决的本质问题**: 交付效率，一键打包

#### 2b. 最小可行范围

- **本期必做**: C1（DDL 生成器）+ C2（ComponentTab 真实数据）+ C4（5 Tab）
- **本期不做**: C5（批量导出 ZIP）
- **暂缓**: PDF 导出

#### 2c. 用户情绪地图

**关键页面: Delivery Center 批量导出**
- **进入时**: 想一键打包所有交付物
- **迷路时**: 不知道有哪些格式 → 按钮显示 "批量导出 (4文件)"
- **出错时**: 打包失败 → toast 提示具体哪个文件失败

#### E3-C1: DDL 生成器
- **Story**: `exportToDDL()` 将 BoundedContext[] 转换为 SQL DDL 字符串（方案A：表级，每个 Context → 一个 CREATE TABLE）
- **工时**: 3h
- **验收标准**: 导出的 DDL 可被 `psql -f file.sql` 解析（至少语法正确）

#### E3-C2: ComponentTab 真实数据
- **Story**: ComponentTab 不再显示 mock 组件，显示 `toComponent()` 转换后的真实 ProtoNode
- **工时**: 2h
- **验收标准**: 组件列表不含 "Mock" 内容

#### E3-C4: DeliveryTabs 5 Tab
- **Story**: DeliveryTabs 增加 API Tab（依赖 Sprint4），共 5 个 Tab
- **工时**: 1h
- **验收标准**: 5 个 Tab 全部显示

#### 2d. UI 状态规范

详见 `specs/E3-exporters.md`

---

### E4: PRD 融合

**Epic 目标**: PRD Tab 接入真实数据，从 prototype 和 DDS 实时生成 PRD 内容。

#### 2a. 本质需求穿透

- **用户的底层动机**: PRD 文档要跟画布上的东西保持同步
- **去掉实时生成会怎样**: PRD 写一套，画布画一套，时间久了对不上
- **解决的本质问题**: 文档即代码，画布即文档

#### 2b. 最小可行范围

- **本期必做**: D1（PRD Tab 真实数据）+ D2（Markdown 导出）
- **本期不做**: D3（PRD 预览编辑器）
- **暂缓**: AI 辅助生成 PRD 文案

#### 2c. 用户情绪地图

**关键页面: PRD Tab**
- **进入时**: 期待看到基于画布数据生成的 PRD 大纲
- **迷路时**: 不知道内容从哪来 → 标题显示 "基于原型画布 + 详设画布实时生成"
- **出错时**: PRD 生成失败 → 显示错误信息 + 重试按钮

#### E4-D1: PRD Tab 真实数据
- **Story**: PRD Tab 不再显示硬编码内容，显示 `generatePRD()` 生成的真实数据
- **工时**: 3h
- **验收标准**: PRD 内容不含 mock 数据，包含页面/组件/API 三部分

#### E4-D2: PRD Markdown 导出
- **Story**: PRD Tab 有 "导出 Markdown" 按钮，生成 .md 文件
- **工时**: 1h
- **验收标准**: 导出文件含 h1/h2 层级标题

#### 2d. UI 状态规范

详见 `specs/E4-prd-fusion.md`

---

### E5: 状态与错误处理

**Epic 目标**: Delivery Center 具备完整的空状态/骨架屏/错误态，用户在各种数据状态下都有预期。

#### 2a. 本质需求穿透

- **用户的底层动机**: 不管什么状态都能有引导，不白屏不卡死
- **去掉状态处理会怎样**: 空画布显示一片白，用户不知道要干什么
- **解决的本质问题**: 状态即信号，每个状态都要有对应的信号

#### 2b. 最小可行范围

- **本期必做**: E1（空数据引导）+ E2（导出失败 toast）+ E3（加载骨架屏）
- **本期不做**: 无
- **暂缓**: 离线状态处理

#### 2c. 用户情绪地图

**关键页面: Delivery Center 无数据状态**
- **进入时**: 好奇交付中心能做什么
- **迷路时**: 白屏 → 引导文案 "还没有任何交付物，请先去画布编辑"
- **出错时**: 导出失败 → toast 提示 + 重试按钮

#### E5-E1: 空数据引导
- **Story**: Delivery Center 4 个 Tab 全部无数据时显示引导页（不是白屏）
- **工时**: 1h
- **验收标准**: 空数据引导页显示 + "去编辑" 按钮可点击

#### E5-E2: 导出失败 toast
- **Story**: 导出异常时显示 toast，不崩溃，按钮保持可用
- **工时**: 1h
- **验收标准**: 导出失败后 toast 显示 + 导出按钮仍可点击

#### E5-E3: 加载骨架屏
- **Story**: 数据加载时显示骨架屏（DeliveryTabs 每个 Tab 区域）
- **工时**: 1h
- **验收标准**: 骨架屏存在 + 加载完成后消失

#### 2d. UI 状态规范

详见 `specs/E5-state-handling.md`

---

## 3. 优先级矩阵

| 优先级 | Epic | Story | 功能点 | 依据 |
|--------|------|-------|--------|------|
| P0 | E1 | A1+A2+A3 | 数据层集成（真实数据替换 mock） | 核心集成，无则交付中心无意义 |
| P0 | E3 | C1+C2+C4 | DDL 生成器 + ComponentTab + 5 Tab | 交付导出基础 |
| P0 | E5 | E1+E2+E3 | 状态与错误处理 | 质量基线 |
| P1 | E1 | A4 | PRD 自动生成 | 提升价值 |
| P1 | E2 | B1+B3 | ProtoEditor→DDS跳转 + 导出入口 | 导航连通性 |
| P1 | E4 | D1+D2 | PRD Tab真实数据 + Markdown导出 | PRD 价值 |
| P2 | E2 | B2+B4 | DDS→ProtoEditor跳转 + 返回按钮 | 可用 URL 返回 |
| P2 | E3 | C5 | 批量导出 ZIP | 便利功能 |
| P2 | E4 | D3 | PRD 预览编辑器 | 体验增强 |

---

## 4. 验收标准汇总（expect() 条目）

### E1 数据层集成

```
// A1: deliveryStore 真实数据
const store = useDeliveryStore.getState()
store.loadMockData()
await waitFor(() => expect(store.contexts.length).toBeGreaterThan(0))
expect(store.contexts[0].name).not.toMatch(/^Mock/)

// A2: toComponent 转换
const protoNode = { id: 'n1', type: 'Button', props: { text: 'Click' } }
const comp = toComponent(protoNode)
expect(comp.id).toBe('n1')
expect(comp.name).toBe('Button')
expect(comp.type).toBe('component')

// A3: toBoundedContext 转换
const bcCard = { id: 'bc1', type: 'bounded-context', name: 'UserDomain' }
const ctx = toBoundedContext(bcCard)
expect(ctx.id).toBe('bc1')
expect(ctx.name).toBe('UserDomain')

// A4: generatePRD
const prd = generatePRD(prototypeStore, ddsStore)
expect(prd.pages).toBeDefined()
expect(prd.components).toBeDefined()
expect(prd.apiEndpoints).toBeDefined()
```

### E2 双向跳转

```
// B1: ProtoEditor → DDS
fireEvent.contextMenu(screen.getByTestId('proto-node'))
expect(screen.getByText('查看上下文')).toBeInTheDocument()
userEvent.click(screen.getByText('查看上下文'))
expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('dds-canvas'))

// B3: Toolbar 导出入口
expect(screen.getByRole('button', { name: /导出/i })).toBeInTheDocument()
```

### E3 交付导出器

```
// C1: DDL 生成器
const ddl = exportToDDL(contexts)
expect(ddl).toMatch(/CREATE TABLE/i)
expect(ddl).toMatch(/PRIMARY KEY/i)

// C2: ComponentTab 真实数据
expect(screen.queryByText('Mock Component')).not.toBeInTheDocument()
expect(screen.getAllByTestId('component-item').length).toBeGreaterThan(0)

// C4: 5 Tab
expect(screen.getAllByRole('tab')).toHaveLength(5)
```

### E4 PRD 融合

```
// D1: PRD Tab 真实数据
expect(screen.queryByText('Mock PRD Content')).not.toBeInTheDocument()
expect(screen.getByText(/页面列表/i)).toBeInTheDocument()

// D2: Markdown 导出
const md = await exportPRDMarkdown(prd)
expect(md).toMatch(/^# .+/)  // h1
expect(md).toMatch(/## .+/)  // h2
```

### E5 状态与错误处理

```
// E1: 空数据引导
const emptyStore = create({ contexts: [], flows: [], components: [], prd: null })
render(<DeliveryCenter store={emptyStore} />)
expect(screen.getByText(/请先创建/i)).toBeInTheDocument()
expect(screen.getByRole('button', { name: /去编辑/i })).toBeInTheDocument()

// E2: 导出失败 toast
jest.spyOn(store, 'exportAll').mockRejectedValue(new Error('network error'))
await exportAll('components')
expect(screen.getByText(/导出失败/i)).toBeInTheDocument()
expect(screen.getByRole('button', { name: /批量导出/i })).toBeEnabled()

// E3: 加载骨架屏
store.loadMockData()
expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
await waitFor(() => expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument())
```

---

## 5. DoD (Definition of Done)

### 研发完成判断标准

#### E1 数据层集成
- [ ] `deliveryStore.loadMockData()` 不再调用 mock 数据
- [ ] ComponentTab 显示真实 ProtoNode 数据（无 "Mock" 内容）
- [ ] ContextTab 显示真实 BoundedContext 数据
- [ ] FlowTab 显示真实 BusinessFlow 数据
- [ ] `toComponent()` / `toBoundedContext()` / `toBusinessFlow()` 转换函数存在且测试通过

#### E2 双向跳转
- [ ] ProtoEditor 节点右键菜单有 "查看上下文" 选项
- [ ] DDSToolbar 有导出按钮
- [ ] ProtoEditor toolbar 有导出按钮
- [ ] 点击导出按钮跳转到 /canvas/delivery
- [ ] Delivery Center 有返回编辑按钮

#### E3 交付导出器
- [ ] `exportToDDL()` 生成有效 SQL DDL（psql 语法检查通过）
- [ ] ComponentTab 无 mock 数据
- [ ] DeliveryTabs 有 5 个 Tab（章节/流程/组件/PRD/API）
- [ ] API Tab 条件渲染：Sprint4 完成后显示，未完成时隐藏

#### E4 PRD 融合
- [ ] PRD Tab 显示基于真实数据的 PRD 大纲
- [ ] PRD Tab 无 mock 内容
- [ ] Markdown 导出文件格式正确（h1/h2 层级）

#### E5 状态与错误处理
- [ ] 空数据时显示引导页（禁止白屏）
- [ ] 导出失败 toast 提示，不崩溃
- [ ] 数据加载显示骨架屏（禁止转圈）
- [ ] 所有 Tab 区域有骨架屏

#### 全局
- [ ] pnpm exec tsc --noEmit → 0 errors
- [ ] pnpm test → 全部通过
- [ ] deliveryStore 行数 < 500 行

---

## 6. Specs 索引

| Spec 文件 | 对应 Epic | 描述 |
|-----------|---------|------|
| specs/E1-data-integration.md | E1 | 数据转换函数规格 + 加载态规范 |
| specs/E2-navigation.md | E2 | 双向跳转规范 + 工具栏规范 |
| specs/E3-exporters.md | E3 | DDL 生成器 + DeliveryTabs 规格 |
| specs/E4-prd-fusion.md | E4 | PRD 生成 + Markdown 导出规格 |
| specs/E5-state-handling.md | E5 | 空状态/骨架屏/错误态规格 |
| specs/E6-prd-validation.md | E4 PRD 验证 | PRD Tab 验收测试规格 |

---

## 7. 关键设计决策记录

| 决策 | 采纳方案 | 理由 |
|------|---------|------|
| DDL 粒度 | 方案A（表级） | MVP 简单，每个 BoundedContext → 一个表 |
| PRD 生成方式 | 方案A（半自动） | 结构化输出（页面/组件/API 清单），人工补充文案 |
| 批量导出格式 | ZIP（含 4 个文件） | 一键打包，用户体验最好 |
| Cross-canvas 跳转存储 | URL 参数 | 简单可靠，数据从 store 重拉 |
| Sprint4 依赖处理 | 条件渲染 | API Tab 降级隐藏，不阻塞整体交付 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint5-delivery-integration
- **执行日期**: 2026-04-18
- **前置条件**: Sprint4 analyze-requirements 完成（已 ✅）
