# PRD — vibex-sprint4-spec-canvas-extend

**项目**: vibex-sprint4-spec-canvas-extend
**版本**: v1.0
**日期**: 2026-04-18
**角色**: PM
**上游**: analysis.md (2026-04-18)
**产出**: plan/feature-list.md

---

## 执行摘要

### 背景
Sprint2 构建了 DDS Canvas 基座，包含 3 个固定章节（requirement/context/flow）。Sprint4 在其上扩展两个新章节：**API 规格**（APIEndpointCard）和**业务规则**（StateMachineCard），复用 Sprint2 全部基础设施（DDSScrollContainer、DDSFlow、DDSPanel、DDSToolbar、CrossChapterEdgesOverlay、DDSCanvasStore）。

### 目标
1. 在 DDS Canvas 新增 `api` 章节，支持 API 端点拖拽配置和 OpenAPI 3.0 导出
2. 在 DDS Canvas 新增 `businessRules` 章节，支持状态机可视化编辑和 JSON/XState 导出
3. 扩展章节切换器支持 5 章节，新增跨章节边连接
4. 所有新章节具备完整的空状态/骨架屏/错误态规范

### 成功指标
- 所有功能有 `expect()` 可写断言
- OpenAPI 导出 JSON 用 `npx swagger-cli validate` 通过
- StateMachine JSON 导出格式可被解析
- 新章节刷新后数据保留（持久化）
- 跨章节边在 API → Requirement 和 StateMachine → Context 场景正确渲染
- 0 个阻塞性 P0 缺陷遗留到下一阶段

---

## 1. 功能点总表

| ID | 功能点 | 描述 | 验收标准（expect()） | 页面集成 |
|----|--------|------|---------------------|---------|
| F-A.1 | API 组件面板 | 左侧展示 5 种 HTTP 方法端点卡片 | expect(screen.getByText('GET')).toBeInTheDocument(); expect(screen.getByText('POST')).toBeInTheDocument(); expect(screen.getAllByRole('listitem')).toHaveLength(5) | 【需页面集成】DDSPanel |
| F-A.2 | APIEndpointCard 节点 | React Flow 节点显示 method badge（颜色区分）+ path + summary | expect(screen.getByText(/GET/i)).toBeInTheDocument(); expect(screen.getByText('/api/users')).toBeInTheDocument(); expect(screen.getByTestId('method-badge-GET')).toHaveStyle({ backgroundColor: 'var(--color-method-get)' }) | 【需页面集成】DDSFlow |
| F-A.3 | API 属性面板 | 右侧面板配置 path/method/summary，节点标签实时更新 | userEvent.clear(pathInput); userEvent.type(pathInput, '/api/orders'); expect(screen.getByText('/api/orders')).toBeInTheDocument() | 【需页面集成】DDSPanel |
| F-A.4 | 参数配置 | Query/Header/Path 参数 table 增删改 | expect(screen.getByRole('table')).toBeInTheDocument(); userEvent.click(screen.getByRole('button', { name: /add param/i })); expect(store.getState().currentCard.params.length).toBeGreaterThan(0) | 【需页面集成】DDSPanel |
| F-A.5 | Schema 编辑器 | 请求体/响应体 JSON textarea（MVP 方案A） | expect(screen.getByRole('textbox', { name: /request body/i })).toBeInTheDocument(); userEvent.paste(schemaTextarea, '{"type":"object"}'); expect(store.getState().currentCard.requestBody).toBe('{"type":"object"}') | 【需页面集成】DDSPanel |
| F-A.6 | OpenAPI 导出 | 调用 OpenAPIGenerator → 导出符合 OpenAPI 3.0 的 JSON/YAML | const spec = exportToOpenAPI(store.getState().chapters.api.nodes); expect(spec.openapi).toMatch(/3\.\d+\.\d+/); expect(spec.paths).toBeDefined() | 无（导出函数） |
| F-A.7 | API 章节持久化 | DDSCanvasStore 增加 api chapter，localStorage 持久化 | const data = JSON.parse(localStorage.getItem('dds-canvas')); expect(data.chapters.api).toBeDefined(); expect(Array.isArray(data.chapters.api.nodes)).toBe(true) | 无（store 层） |
| F-B.1 | 状态机组件面板 | 左侧展示 state/transition/choice 3 种组件 | expect(screen.getByText('State')).toBeInTheDocument(); expect(screen.getByText('Transition')).toBeInTheDocument(); expect(screen.getByText('Choice')).toBeInTheDocument() | 【需页面集成】DDSPanel |
| F-B.2 | StateMachineCard 节点 | 自定义节点显示状态名 + 类型图标（initial 圆点/final 双圆/普通方/choice 菱/join 并/ fork 分） | expect(screen.getByTestId('state-icon-initial')).toBeInTheDocument(); expect(screen.getByText('Idle')).toBeInTheDocument() | 【需页面集成】DDSFlow |
| F-B.3 | 状态属性面板 | stateId/stateType/events 配置，类型下拉选择 | userEvent.selectOptions(typeSelect, 'initial'); expect(store.getState().currentCard.stateType).toBe('initial') | 【需页面集成】DDSPanel |
| F-B.4 | 转移配置面板 | guard/action/target 配置抽屉 | fireEvent.click(edgeElement); expect(screen.getByTestId('transition-config-drawer')).toBeVisible(); userEvent.type(guardInput, 'isActive'); expect(store.getState().currentEdge.guard).toBe('isActive') | 【需页面集成】DDSPanel |
| F-B.5 | 状态机 JSON 导出 | 导出结构化 JSON（states/initial/transitions） | const sm = exportToStateMachine(store.getState().chapters.businessRules.nodes, store.getState().chapters.businessRules.edges); expect(sm.initial).toBeTruthy(); expect(sm.states).toBeDefined() | 无（导出函数） |
| F-B.6 | XState 格式导出 | 生成合法 XState machine config（P2 暂缓） | // P2，跳过 MVP | 无 |
| F-B.7 | 业务规则章节持久化 | DDSCanvasStore 增加 businessRules chapter | 同 F-A.7，验证 chapters.businessRules | 无（store 层） |
| F-C.1 | API → Requirement 跨章节边 | APIEndpointCard 连线到 UserStoryCard，跨 chapter 渲染 | sourceChapter = 'api', targetChapter = 'requirement'; expect(screen.getByTestId('cross-chapter-edge')).toBeInTheDocument() | 【需页面集成】CrossChapterEdgesOverlay |
| F-C.2 | StateMachine → Context 跨章节边 | StateMachineCard 连线到 BoundedContextCard | sourceChapter = 'businessRules', targetChapter = 'context'; expect(screen.getByTestId('cross-chapter-edge')).toBeInTheDocument() | 【需页面集成】CrossChapterEdgesOverlay |
| F-C.3 | 章节切换器扩展 | DDSToolbar 显示 5 章节按钮，点击切换 | expect(screen.getByRole('button', { name: /api/i })).toBeInTheDocument(); expect(screen.getByRole('button', { name: /business rules/i })).toBeInTheDocument(); userEvent.click(screen.getByRole('button', { name: /api/i })); expect(store.getState().activeChapter).toBe('api') | 【需页面集成】DDSToolbar |
| F-C.4 | 章节显示管理 | 5 章节可选显示（toolbar 切换） | // P2，跳过 MVP | 无 |
| F-D.1 | API 章节四态规范 | 骨架屏/空状态/加载态/错误态（详见 specs/E1-api-chapter.md） | 详见 specs | 【需页面集成】DDSCanvasPage |
| F-D.2 | StateMachine 章节四态规范 | 骨架屏/空状态/加载态/错误态（详见 specs/E2-business-rules.md） | 详见 specs | 【需页面集成】DDSCanvasPage |
| F-D.3 | 导出失败 toast | 导出失败时显示错误 toast，不崩溃 | exportToOpenAPI(invalidData); expect(screen.getByText(/export failed/i)).toBeInTheDocument() | 【需页面集成】DDSCanvasPage |
| F-E.1 | APIEndpointCard 单元测试 | 10+ 测试用例 | expect(component).toMatchSnapshot() | 无（单元测试） |
| F-E.2 | StateMachineCard 单元测试 | 10+ 测试用例 | expect(component).toMatchSnapshot() | 无（单元测试） |
| F-E.3 | OpenAPI Export E2E 测试 | 拖拽→配置→导出完整流程 | // Playwright E2E | 无（E2E 测试） |
| F-E.4 | StateMachine Export E2E 测试 | 拖拽→配置→导出完整流程 | // Playwright E2E | 无（E2E 测试） |

---

## 2. Epic 拆分

### E1: API 规格章节

**Epic 目标**: 在 DDS Canvas 新增 `api` 章节，用户可拖拽 API 端点卡片，配置路径/方法/参数/Schema，并导出为 OpenAPI 3.0 规范。

#### 2a. 本质需求穿透

- **用户的底层动机**: 把 API 设计从脑子里搬到画布上，看到所有端点的全貌
- **去掉现有方案，理想解法**: 拖拽端点 → 填配置 → 一键导出 OpenAPI → 给后端用
- **解决的本质问题**: API 设计文档和代码脱节，画布是这两端的中间层

#### 2b. 最小可行范围

- **本期必做**: A1（组件面板）+ A2（节点）+ A3（属性面板基础）+ A6（导出）+ A7（持久化）
- **本期不做**: A4（参数配置）+ A5（Schema 编辑器）
- **暂缓**: Schema 选择器（引用已有 DomainEntity）、YAML 导出

#### 2c. 用户情绪地图

**关键页面: API 章节画布**
- **进入时**: 期待看到 API 端点列表，知道可以开始设计
- **迷路时**: 不知道 HTTP 方法有哪些 → 组件面板 badge 显示 5 种方法名
- **出错时**: 导出失败 → toast 提示"导出失败，请检查端点配置"，不丢失已有数据

#### E1-A1: API 组件面板
- **Story**: 左侧 DDSPanel 显示 5 种 HTTP 方法端点卡片（GET/POST/PUT/DELETE/PATCH），拖拽后 dataTransfer 传递端点定义
- **工时**: 1h
- **验收标准**: `expect(screen.getAllByRole('listitem')).toHaveLength(5)`

#### E1-A2: APIEndpointCard 节点
- **Story**: 自定义 React Flow 节点，显示 method badge（颜色区分：GET 绿/POST 蓝/PUT 橙/DELETE 红/PATCH 紫）+ path + summary
- **工时**: 2h
- **验收标准**: method badge 颜色正确 + path 文案显示

#### E1-A3: API 属性面板
- **Story**: 右侧 DDSPanel 显示端点配置表单（path input + method select + summary textarea），修改后节点标签实时更新
- **工时**: 3h
- **验收标准**: 修改 path → 节点文案立即变化

#### E1-A6: OpenAPI 导出
- **Story**: 点击导出按钮 → 调用 `exportToOpenAPI(cards)` → 生成符合 OpenAPI 3.0 的 JSON → 下载或复制
- **工时**: 2h
- **验收标准**: 导出 JSON `swagger-cli validate` 通过

#### E1-A7: API 章节持久化
- **Story**: DDSCanvasStore 增加 `chapters.api`，刷新后数据保留
- **工时**: 2h
- **验收标准**: `expect(JSON.parse(localStorage.getItem('dds-canvas')).chapters.api).toBeDefined()`

#### 2d. UI 状态规范

详见 `specs/E1-api-chapter.md`

---

### E2: 业务规则章节

**Epic 目标**: 在 DDS Canvas 新增 `businessRules` 章节，支持状态机可视化编辑（状态节点 + 转移连线），导出为 JSON/XState 格式。

#### 2a. 本质需求穿透

- **用户的底层动机**: 把业务规则（状态怎么变、什么条件下变）可视化出来
- **去掉现有方案，理想解法**: 画状态节点 → 拉转移线 → 写 guard → 导出状态机
- **解决的本质问题**: 业务规则散落在代码和文档里，没有统一视图

#### 2b. 最小可行范围

- **本期必做**: B1（组件面板）+ B2（节点）+ B3（属性面板基础）+ B5（JSON 导出）+ B7（持久化）
- **本期不做**: B4（转移配置面板，guard/action/target 配置抽屉）
- **暂缓**: B6（XState 格式导出，P2）

#### 2c. 用户情绪地图

**关键页面: 业务规则章节画布**
- **进入时**: 期待看到状态机图
- **迷路时**: 不知道状态和转移的区别 → 组件面板用图标区分（方块=状态/箭头=转移/菱形=choice）
- **出错时**: 转移闭环检测失败 → toast 提示"检测到无效转移，请检查连线"

#### E2-B1: 状态机组件面板
- **Story**: 左侧 DDSPanel 显示 3 种组件（State/Transition/Choice），拖拽到画布创建对应节点
- **工时**: 1h
- **验收标准**: `expect(screen.getAllByRole('listitem')).toHaveLength(3)`

#### E2-B2: StateMachineCard 节点
- **Story**: 自定义节点显示状态名 + 类型图标（initial 圆点/final 双圆/普通方/choice 菱）
- **工时**: 3h
- **验收标准**: 6 种状态类型图标全部正确显示

#### E2-B3: 状态属性面板
- **Story**: 右侧 DDSPanel 显示状态配置（stateId input + stateType select + events list）
- **工时**: 2h
- **验收标准**: 类型选择后节点图标切换

#### E2-B5: 状态机 JSON 导出
- **Story**: 点击导出 → 调用 `exportToStateMachine(nodes, edges)` → 生成 `{ initial, states, transitions }` JSON
- **工时**: 2h
- **验收标准**: `expect(sm.initial).toBeTruthy(); expect(sm.states).toBeDefined()`

#### E2-B7: 业务规则章节持久化
- **Story**: DDSCanvasStore 增加 `chapters.businessRules`，刷新后数据保留
- **工时**: 2h
- **验收标准**: 同 F-A.7

#### 2d. UI 状态规范

详见 `specs/E2-business-rules.md`

---

### E3: 跨章节集成

**Epic 目标**: 新章节与 Sprint2 已有章节之间建立跨章节边连接，丰富 DDS Canvas 的整体关联视图。

#### 2a. 本质需求穿透

- **用户的底层动机**: 知道 API 端点对应哪个需求，知道状态机属于哪个限界上下文
- **去掉现有方案，理想解法**: 画布上直接拉线，跨越章节边界
- **解决的本质问题**: 章节之间是孤立的，没有关系视图

#### 2b. 最小可行范围

- **本期必做**: C1（API → Requirement 边）+ C3（章节切换器扩展）
- **本期不做**: C2（StateMachine → Context 边）+ C4（章节显示管理）
- **暂缓**: 章节排序

#### 2c. 用户情绪地图

**关键页面: DDSToolbar + CrossChapterEdgesOverlay**
- **进入时**: 看到 5 个章节按钮，清楚自己在哪
- **迷路时**: 不知道章节怎么切换 → toolbar 当前章节高亮
- **出错时**: 跨章节边无法渲染 → 降级显示为普通边，不崩溃

#### E3-C1: API → Requirement 跨章节边
- **Story**: 从 api 章节的 APIEndpointCard 拖线到 requirement 章节的 UserStoryCard，CrossChapterEdgesOverlay 渲染跨章节边
- **工时**: 2h
- **验收标准**: 跨章节边可见且可点击

#### E3-C3: 章节切换器扩展
- **Story**: DDSToolbar 从 3 个章节扩展到 5 个（requirement/context/flow/api/businessRules），URL ?chapter= 参数支持
- **工时**: 1h
- **验收标准**: 5 个章节按钮全部显示，点击切换正确

#### 2d. UI 状态规范

详见 `specs/E3-cross-chapter.md`

---

### E4: 状态与错误处理

**Epic 目标**: 新章节具备与 Sprint2 E5 同等质量的状态处理规范，包括骨架屏、空状态、加载态、错误态。

#### 2a. 本质需求穿透

- **用户的底层动机**: 不管什么状态都能有预期，不白屏不卡死
- **去掉现有方案，理想解法**: 空状态有引导，错误有提示，加载有骨架屏
- **解决的本质问题**: 空白画布让用户困惑，不知道下一步干什么

#### 2b. 最小可行范围

- **本期必做**: D1 + D2 + D3
- **本期不做**: 无
- **暂缓**: 无

#### 2c. 用户情绪地图

**关键页面: API 章节空状态**
- **进入时**: 期待有端点列表
- **迷路时**: 画布空白不知道做什么 → 空状态引导文案"从左侧拖拽端点开始设计 API"
- **出错时**: 导出失败 → toast 提示，不覆盖已有数据

**关键页面: 业务规则章节空状态**
- **进入时**: 期待有状态机
- **迷路时**: 画布空白 → 空状态引导文案"从左侧拖拽状态开始设计业务规则"
- **出错时**: 同上

#### E4-D1: API 章节四态规范
- **工时**: 1h
- **详见**: `specs/E1-api-chapter.md`

#### E4-D2: StateMachine 章节四态规范
- **工时**: 1h
- **详见**: `specs/E2-business-rules.md`

#### E4-D3: 导出失败处理
- **工时**: 0.5h
- **详见**: `specs/E1-api-chapter.md` + `specs/E2-business-rules.md`

---

### E5: 测试覆盖

**Epic 目标**: 新增组件和功能有完整的单元测试和 E2E 测试覆盖。

#### 2a. 本质需求穿透

- **用户的底层动机**: 不是我的，但我要知道它是好的
- **去掉现有方案，理想解法**: 每一行新代码都有测试覆盖
- **解决的本质问题**: 没测试 = 不知道是不是对的 = 迟早出事

#### 2b. 最小可行范围

- **本期必做**: E1（APIEndpointCard 单元测试）+ E2（StateMachineCard 单元测试）
- **本期不做**: E3（OpenAPI Export E2E）+ E4（StateMachine Export E2E）
- **暂缓**: 无

#### E5-E1: APIEndpointCard 单元测试
- **工时**: 1h
- **验收标准**: 10+ 测试用例，覆盖渲染/选中/属性更新

#### E5-E2: StateMachineCard 单元测试
- **工时**: 1h
- **验收标准**: 10+ 测试用例，覆盖 6 种状态类型渲染

---

## 3. 优先级矩阵

| 优先级 | Epic | Story | 功能点 | 依据 |
|--------|------|-------|--------|------|
| P0 | E1 | A1+A2+A3+A6+A7 | API 章节核心（面板+节点+属性+导出+持久化） | 核心功能 |
| P0 | E2 | B1+B2+B3+B5+B7 | StateMachine 章节核心 | 核心功能 |
| P0 | E4 | D1+D2+D3 | 状态与错误处理 | 质量基线 |
| P0 | E5 | E1+E2 | 单元测试覆盖 | 质量基线 |
| P1 | E1 | A4+A5 | 参数配置 + Schema 编辑器 | 提升完整性 |
| P1 | E3 | C1+C3 | 跨章节边 + 章节切换器 | 扩展能力 |
| P2 | E2 | B4 | 转移配置面板 | 可简化（guard 文本直接写边上）|
| P2 | E2 | B6 | XState 格式导出 | 降级为 JSON 即可 |
| P2 | E3 | C2+C4 | StateMachine→Context 边 + 章节显示管理 | 后续迭代 |

**决策**: P0 必须 100% 覆盖；P1 达到 80% 覆盖率视为 DoD 完成；P2 暂缓。

---

## 4. 验收标准汇总（expect() 条目）

### E1 API 规格章节

```
// A1 API 组件面板
expect(screen.getByText('GET')).toBeInTheDocument()
expect(screen.getByText('POST')).toBeInTheDocument()
expect(screen.getByText('PUT')).toBeInTheDocument()
expect(screen.getByText('DELETE')).toBeInTheDocument()
expect(screen.getByText('PATCH')).toBeInTheDocument()
expect(screen.getAllByRole('listitem')).toHaveLength(5)

// A2 APIEndpointCard
expect(screen.getByTestId('method-badge-GET')).toHaveStyle({ backgroundColor: 'var(--color-method-get)' })
expect(screen.getByText('/api/users')).toBeInTheDocument()
expect(screen.getByText('Get user list')).toBeInTheDocument() // summary

// A3 API 属性面板
fireEvent.dblClick(screen.getByTestId('api-endpoint-node'))
expect(screen.getByTestId('api-attr-panel')).toBeVisible()
userEvent.clear(screen.getByLabelText('Path'))
userEvent.type(screen.getByLabelText('Path'), '/api/orders')
expect(screen.getByText('/api/orders')).toBeInTheDocument()

// A6 OpenAPI Export
const spec = exportToOpenAPI(store.getState().chapters.api.nodes)
expect(spec.openapi).toMatch(/3\.\d+\.\d+/)
expect(spec.paths).toBeDefined()
expect(spec.paths['/api/users']).toBeDefined()
expect(spec.paths['/api/users'].get).toBeDefined()
```

### E2 业务规则章节

```
// B1 状态机组件面板
expect(screen.getByText('State')).toBeInTheDocument()
expect(screen.getByText('Transition')).toBeInTheDocument()
expect(screen.getByText('Choice')).toBeInTheDocument()
expect(screen.getAllByRole('listitem')).toHaveLength(3)

// B2 StateMachineCard
expect(screen.getByTestId('state-icon-initial')).toBeInTheDocument()
expect(screen.getByTestId('state-icon-final')).toBeInTheDocument()
expect(screen.getByTestId('state-icon-normal')).toBeInTheDocument()
expect(screen.getByTestId('state-icon-choice')).toBeInTheDocument()
expect(screen.getByText('Idle')).toBeInTheDocument()

// B3 状态属性面板
fireEvent.dblClick(screen.getByTestId('state-machine-node'))
userEvent.selectOptions(screen.getByLabelText('State Type'), 'initial')
expect(useDDSCanvasStore.getState().currentCard.stateType).toBe('initial')

// B5 状态机 JSON 导出
const sm = exportToStateMachine(nodes, edges)
expect(sm.initial).toBeTruthy()
expect(sm.states).toBeDefined()
expect(sm.states[sm.initial]).toBeDefined()
```

### E3 跨章节集成

```
// C3 章节切换器
expect(screen.getByRole('button', { name: /requirement/i })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /context/i })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /flow/i })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /api/i })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /business rules/i })).toBeInTheDocument()
userEvent.click(screen.getByRole('button', { name: /api/i }))
expect(useDDSCanvasStore.getState().activeChapter).toBe('api')

// C1 跨章节边
expect(screen.getByTestId('cross-chapter-edge')).toBeInTheDocument()
expect(screen.getByTestId('cross-chapter-edge')).toHaveAttribute('data-source-chapter', 'api')
expect(screen.getByTestId('cross-chapter-edge')).toHaveAttribute('data-target-chapter', 'requirement')
```

---

## 5. DoD (Definition of Done)

### 研发完成判断标准

#### E1 API 规格章节
- [ ] DDSPanel 显示 GET/POST/PUT/DELETE/PATCH 5 种端点卡片
- [ ] APIEndpointCard 节点渲染正确（method badge 颜色 + path 文案）
- [ ] DDSPanel 属性面板支持 path/method/summary 配置，修改后节点标签实时更新
- [ ] 点击导出 → OpenAPI JSON 生成 → `npx swagger-cli validate` 通过
- [ ] 刷新页面后 API 章节数据保留（localStorage）
- [ ] TypeScript 编译 0 errors
- [ ] APIEndpointCard 单元测试 10+ 用例通过

#### E2 业务规则章节
- [ ] DDSPanel 显示 State/Transition/Choice 3 种组件
- [ ] StateMachineCard 节点渲染正确（6 种状态类型图标全部显示）
- [ ] DDSPanel 属性面板支持 stateId/stateType/events 配置
- [ ] 点击导出 → JSON 生成，含 initial/states/transitions
- [ ] 刷新页面后业务规则章节数据保留
- [ ] TypeScript 编译 0 errors
- [ ] StateMachineCard 单元测试 10+ 用例通过

#### E3 跨章节集成
- [ ] DDSToolbar 显示 5 个章节按钮（requirement/context/flow/api/businessRules）
- [ ] 点击章节按钮 → activeChapter 正确切换，URL ?chapter= 参数更新
- [ ] API → Requirement 跨章节边渲染正确（CrossChapterEdgesOverlay）

#### E4 状态与错误处理
- [ ] API 章节空状态有引导插图 + 文案（禁止只留白）
- [ ] StateMachine 章节空状态有引导插图 + 文案
- [ ] 加载态使用骨架屏（禁止转圈）
- [ ] 导出失败显示 toast 错误提示，不丢失已有数据
- [ ] 错误态覆盖：网络异常/导出失败/无效 Schema

#### E5 测试覆盖
- [ ] APIEndpointCard 单元测试 10+ 用例，覆盖：正常渲染/选中/属性更新
- [ ] StateMachineCard 单元测试 10+ 用例，覆盖：6 种状态类型渲染

#### 全局
- [ ] pnpm exec tsc --noEmit → 0 errors
- [ ] pnpm test → 全部通过
- [ ] DDSCanvasStore 行数 < 500 行（否则拆分）

---

## 6. Specs 索引

| Spec 文件 | 对应 Epic | 描述 |
|-----------|---------|------|
| specs/E1-api-chapter.md | E1 + E4-D1 | API 章节四态定义 + APIEndpointCard 规范 |
| specs/E2-business-rules.md | E2 + E4-D2 | 业务规则章节四态定义 + StateMachineCard 规范 |
| specs/E3-cross-chapter.md | E3 | 跨章节边 + 章节切换器规范 |
| specs/E4-export.md | E1-A6 + E2-B5 | OpenAPI 导出 + StateMachine JSON 导出规格 |
| specs/E5-chapter-type.md | E1 + E2 | ChapterType/CardType 扩展规范 |

---

## 7. 关键设计决策记录

| 决策 | 采纳方案 | 理由 |
|------|---------|------|
| Schema 编辑方式 | 方案A：自由 JSON textarea | 降低 MVP 复杂度，避免 Schema 选择器 |
| StateMachine 导出格式 | JSON（MVP）；XState 后续迭代 | B6 降为 P2 |
| Store 架构 | 扩展 DDSCanvasStore（方案A） | MVP 优先，store 超过 500 行再拆分 |
| StateMachine 转移表达 | MVP 边 + guard 文本（简化） | B4 降为 P2 |
| XState 导出 | 暂缓 P2 | Generator 已有 JSON 够用 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint4-spec-canvas-extend
- **执行日期**: 2026-04-18
