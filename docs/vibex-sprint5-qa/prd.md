# PRD — vibex-sprint5-qa

**项目**: vibex-sprint5-qa
**版本**: v1.0
**日期**: 2026-04-25
**角色**: PM
**上游**: analysis.md (Analyst QA 验证报告, 2026-04-25)
**上游项目**: vibex-sprint5-delivery-integration

---

## 执行摘要

### 背景

Sprint5 交付集成提案（`vibex-sprint5-delivery-integration`）有条件通过 QA 验证。产出物完整（PRD/Architecture/Specs/Implementation/AGENTS 全部存在），Architecture 完整（10章，含完整数据流图）。

**关键问题**：🔴 **E1 数据流阻断** — `delivery/page.tsx` 第 27 行仍调用 `loadMockData()`，显示硬编码 MOCK 数据。`loadFromStores()` 已实现但从未被调用，所有 Tab（Context/Flow/Component/PRD/DDL）实际消费的是 mock 数据而非真实 store 数据。

### 目标

对 `vibex-sprint5-delivery-integration` 的 E1 数据流修复进行 QA 验证，确认：
1. `delivery/page.tsx` 从 `loadMockData()` 切换到 `loadFromStores()`
2. 各 Tab（Contexts/Flows/Components/PRD/DDL）消费真实 store 数据
3. DDLGenerator 与 Sprint4 APIEndpointCard 接口兼容

### 成功指标

| 指标 | 目标 |
|------|------|
| delivery/page.tsx 数据源切换 | `loadFromStores()` 被调用，0 个 Tab 消费 MOCK |
| 真实数据流验证 | 3+ Tab 显示来自真实 store 的数据 |
| DDLGenerator 接口兼容 | APIEndpointCard[] → DDLTable[] 转换正确 |
| Sprint4 依赖可满足 | ChapterType / CrossChapterEdges 接口可用 |

---

## 1. 功能点总表（QA 验证项）

| ID | 功能点 | 描述 | 验收标准（expect()） | 页面集成 |
|----|--------|------|---------------------|---------|
| F1.1 | delivery/page.tsx 数据源切换 | delivery/page.tsx 从 loadMockData() 切换到 loadFromStores() | `expect(screen.queryByText(/mock/i)).toBeNull()` | 【需页面集成】delivery/page.tsx |
| F1.2 | loadFromStores() 调用验证 | delivery/page.tsx 正确调用 loadFromStores() | `expect(useDeliveryStore.getState().dataSource).toBe('stores')` | 【需页面集成】delivery/page.tsx |
| F1.3 | 各 Tab 真实数据消费验证 | Contexts/Flows/Components/PRD/DDL Tab 显示真实数据 | `expect(tabContent).not.toMatch(/mock/i)` | 【需页面集成】delivery/page.tsx |
| F2.1 | deliveryStore 聚合逻辑验证 | toComponent/toBoundedContext/toFlow/toSM 函数输出正确 | `expect(toComponent(node)).toMatchObject({ id: expect.any(String), type: expect.any(String) })` | 无（store层） |
| F2.2 | prototypeStore 数据拉取验证 | deliveryStore.loadFromStores() 能拉取 prototypeStore 数据 | `expect(prototypeData.nodes.length).toBeGreaterThan(0)` | 无（store层） |
| F3.1 | DDLGenerator 与 Sprint4 API 兼容性 | DDLGenerator(apiCards: APIEndpointCard[]) 输出 DDLTable[] | `expect(ddlTables[0]).toMatchObject({ tableName: expect.any(String), columns: expect.any(Array) })` | 无（逻辑层） |
| F3.2 | DDL 输出格式验证 | formatDDL(ddlTables) 输出有效 SQL | `expect(sql).toMatch(/CREATE TABLE/)` | 【需页面集成】DDL Tab |
| F4.1 | Context Tab 数据验证 | Context Tab 显示 DDSCanvasStore.chapters.context 数据 | `expect(contextItems.length).toBeGreaterThan(0)` | 【需页面集成】Context Tab |
| F4.2 | Flow Tab 数据验证 | Flow Tab 显示 DDSCanvasStore.chapters.flow 数据 | `expect(flowItems.length).toBeGreaterThan(0)` | 【需页面集成】Flow Tab |
| F4.3 | Component Tab 数据验证 | Component Tab 显示 prototypeStore.nodes 数据 | `expect(componentItems.length).toBeGreaterThan(0)` | 【需页面集成】Component Tab |
| F5.1 | 全量 Specs 覆盖率验证 | 每个 Epic Spec 至少有一个 QA 验证点 | `expect(coveredSet.size).toBeGreaterThanOrEqual(5)` | 无（文档验证） |
| F5.2 | DoD 逐条核查 | PRD DoD 所有条目可测试 | `expect(dodItems.every(i => i.verifiable)).toBe(true)` | 无（文档验证） |

---

## 2. Epic / Story 表格

### Epic 1: E1 数据流修复验证（P0）

**优先级**: P0 | **工时**: 3h | **根因**: loadMockData() 阻塞真实数据流

#### 2a. 本质需求穿透
- **用户的底层动机**: 交付页面看到的是真实设计数据，不是假数据
- **去掉数据流修复**: 设计师看到的是 MOCK，不信任交付物
- **解决的本质问题**: 交付物必须基于真实数据才有价值

#### 2b. 最小可行范围
- **本期必做**: delivery/page.tsx 切换到 loadFromStores()，验证数据流打通
- **本期不做**: deliveryStore 持久化（MVP 每次重载）
- **暂缓**: 增量更新（diff 推送）

#### 2c. 用户情绪地图
**验证场景: delivery/page.tsx 各 Tab**
- **进入时**: 想看到真实的上下文/组件/流程数据
- **迷路时**: Tab 显示 MOCK 数据 → F1.1/F1.3 验证失败
- **出错时**: 数据加载失败 → 显示友好错误，不留白

#### E1-QA-T1: 数据源切换验证
- **Story**: `delivery/page.tsx` 第 27 行调用 `loadFromStores()` 而非 `loadMockData()`
- **工时**: 1h
- **验收标准**: `expect(pageContent).not.toMatch(/mock/i)`

#### E1-QA-T2: loadFromStores() 调用验证
- **Story**: deliveryStore 调用 prototypeStore + DDSCanvasStore 拉取真实数据
- **工时**: 1h
- **验收标准**: `expect(useDeliveryStore.getState().dataSource).toBe('stores')`

#### E1-QA-T3: 各 Tab 真实数据消费验证
- **Story**: 5 个 Tab（Context/Flow/Component/PRD/DDL）全部显示真实 store 数据
- **工时**: 1h
- **验收标准**: `expect(mockCalls).toHaveLength(0)` // 无 loadMockData 调用

---

### Epic 2: E2 deliveryStore 聚合逻辑验证

**优先级**: P0 | **工时**: 2h | **根因**: 聚合层是数据流的核心

#### 2a. 本质需求穿透
- **用户的底层动机**: deliveryStore 把散落在各 store 的数据聚合成交付物视图
- **去掉聚合层**: 用户需要在多个页面之间跳转才能看完整数据
- **解决的本质问题**: 单视图聚合多个数据源

#### 2b. 最小可行范围
- **本期必做**: toComponent / toBoundedContext / toFlow / toStateMachine 转换正确
- **本期不做**: 聚合层缓存优化
- **暂缓**: 增量订阅（基于 Zustand selector）

#### E2-QA-T4: deliveryStore 聚合逻辑验证
- **Story**: deliveryStore.loadFromStores() 正确聚合 prototypeStore + DDSCanvasStore
- **工时**: 1h
- **验收标准**: `expect(deliveryStore.getState().components.length).toBeGreaterThan(0)`

#### E2-QA-T5: prototypeStore 数据拉取验证
- **Story**: deliveryStore 能正确拉取 prototypeStore.getExportData()
- **工时**: 1h
- **验收标准**: `expect(prototypeStore.getState().nodes.length).toBeGreaterThan(0)`

---

### Epic 3: E3 DDLGenerator 与 Sprint4 API 兼容性验证

**优先级**: P1 | **工时**: 2h | **根因**: Sprint4 API 章节依赖

#### 2a. 本质需求穿透
- **用户的底层动机**: 能从 API 定义一键生成 DDL，不用手动写 SQL
- **去掉 DDLGenerator**: 用户需要手动翻译 OpenAPI → SQL
- **解决的本质问题**: 自动化减少人工错误

#### 2b. 最小可行范围
- **本期必做**: DDLGenerator(apiCards) → DDLTable[] 转换
- **本期不做**: 支持复杂数据类型（数组/嵌套）
- **暂缓**: DDL 版本管理

#### E3-QA-T6: DDLGenerator API 兼容性
- **Story**: DDLGenerator(apiCards: APIEndpointCard[]) 输出正确 DDLTable[]
- **工时**: 1h
- **验收标准**: `expect(DDLGenerator([])).toEqual([]); expect(DDLGenerator([apiCard])[0].tableName).toBeDefined()`

#### E3-QA-T7: DDL 输出格式验证
- **Story**: formatDDL(ddlTables) 输出有效 SQL
- **工时**: 1h
- **验收标准**: `expect(formatDDL(ddlTables)).toMatch(/CREATE TABLE/)`

---

### Epic 4: E4 各 Tab 数据消费验证

**优先级**: P0 | **工时**: 2h | **根因**: Tab 是用户看到数据的入口

#### 2a. 本质需求穿透
- **用户的底层动机**: 每个 Tab 都显示有意义的内容，不是空白
- **去掉 Tab 验证**: 不知道哪个 Tab 有数据，哪个没有
- **解决的本质问题**: 交付物的完整性

#### E4-QA-T8: Context Tab 真实数据验证
- **Story**: Context Tab 显示 DDSCanvasStore.chapters.context 数据
- **工时**: 0.5h
- **验收标准**: `expect(screen.getByRole('tab', { name: /context/i })).toBeInTheDocument()`

#### E4-QA-T9: Flow Tab 真实数据验证
- **Story**: Flow Tab 显示 DDSCanvasStore.chapters.flow 数据
- **工时**: 0.5h
- **验收标准**: `expect(screen.getByRole('tab', { name: /flow/i })).toBeInTheDocument()`

#### E4-QA-T10: Component Tab 真实数据验证
- **Story**: Component Tab 显示 prototypeStore.nodes 数据
- **工时**: 0.5h
- **验收标准**: `expect(screen.getByRole('tab', { name: /component/i })).toBeInTheDocument()`

---

### Epic 5: E5 质量保障

**优先级**: P2 | **工时**: 1h | **根因**: QA 覆盖完整性

#### E5-QA-T11: Specs 覆盖率验证
- **Story**: 每个 Spec 文件（E1-E5）至少有一个 QA 验证点
- **工时**: 0.5h
- **验收标准**: `expect(coveredCount).toBeGreaterThanOrEqual(5)`

#### E5-QA-T12: DoD 逐条核查
- **Story**: PRD DoD 所有条目可测试
- **工时**: 0.5h
- **验收标准**: `expect(dodItems.every(i => i.verifiable === true)).toBe(true)`

---

## 3. 验收标准（expect() 断言汇总）

### E1 数据流修复

```typescript
// T1: delivery/page.tsx 无 MOCK 数据
const content = screen.getByTestId('delivery-page')
expect(content.innerHTML).not.toMatch(/mock/i)

// T2: loadFromStores 被调用
const store = useDeliveryStore.getState()
expect(store.dataSource).toBe('stores')

// T3: 5 个 Tab 真实数据
const tabs = ['contexts', 'flows', 'components', 'prd', 'ddl']
tabs.forEach(tab => {
  const tabContent = screen.getByTestId(`${tab}-tab`)
  expect(tabContent.innerHTML).not.toMatch(/mock/i)
})
```

### E2 deliveryStore 聚合

```typescript
// T4: deliveryStore 聚合逻辑
const store = useDeliveryStore.getState()
expect(store.components.length).toBeGreaterThan(0)
expect(store.boundedContexts.length).toBeGreaterThan(0)

// T5: prototypeStore 拉取
const prototypeData = prototypeStore.getState().getExportData()
expect(prototypeData.nodes.length).toBeGreaterThan(0)
```

### E3 DDLGenerator

```typescript
// T6: DDLGenerator API 兼容
const apiCard = { path: '/users', method: 'GET', responses: { '200': {} } }
const ddlTables = DDLGenerator([apiCard])
expect(ddlTables[0].tableName).toBe('/users')
expect(ddlTables[0].columns.length).toBeGreaterThan(0)

// T7: DDL 输出格式
const sql = formatDDL(ddlTables)
expect(sql).toMatch(/CREATE TABLE/i)
expect(sql).toMatch(/GET_USERS/i)
```

---

## 4. DoD (Definition of Done)

### Sprint5 QA 验收完成判断标准

#### E1 数据流修复
- [ ] `delivery/page.tsx` 第 27 行调用 `loadFromStores()`（不是 `loadMockData()`）
- [ ] `useDeliveryStore` 的 dataSource 状态为 `'stores'`
- [ ] 5 个 Tab（Contexts/Flows/Components/PRD/DDL）内容中无 "MOCK" 字样
- [ ] gstack browse 验证：delivery page 显示真实设计数据

#### E2 deliveryStore 聚合
- [ ] `loadFromStores()` 正确调用 `prototypeStore.getState()` 和 `DDSCanvasStore.getState()`
- [ ] `toComponent()` / `toBoundedContext()` / `toFlow()` / `toStateMachine()` 输出结构正确

#### E3 DDLGenerator 兼容
- [ ] `DDLGenerator([])` 返回空数组
- [ ] `DDLGenerator([apiCard])` 返回含 tableName 和 columns 的 DDLTable
- [ ] `formatDDL(ddlTables)` 输出有效 SQL（包含 CREATE TABLE）

#### E4 Tab 数据消费
- [ ] 5 个 Tab 均可点击切换
- [ ] 每个 Tab 有对应数据或空状态（有引导文案）

#### E5 质量保障
- [ ] Specs 覆盖率 100%（E1-E5 每 Epic 至少 1 个验证点）
- [ ] DoD 所有条目可测试

#### 全局
- [ ] 0 个 P0 阻塞性缺陷遗留
- [ ] Sprint4 API 章节依赖满足

---

## 5. 执行决策

- **决策**: 有条件通过（Analyst 报告，E1 数据流修复为 P0）
- **执行项目**: vibex-sprint5-qa
- **执行日期**: 2026-04-25
- **条件**: E1 必须修复 — delivery/page.tsx 从 loadMockData() 切换到 loadFromStores()，修复后需 gstack browse 验证数据流

---

*文档版本: 1.0 | PM | 2026-04-25*
