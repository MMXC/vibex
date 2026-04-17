# PRD — vibex-sprint4-qa

**项目**: vibex-sprint4-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: PM
**上游**: analysis.md (2026-04-18)
**上游项目**: vibex-sprint4-spec-canvas-extend
**产出**: plan/feature-list.md

---

## 执行摘要

### 背景
vibex-sprint4-spec-canvas-extend 在 DDS Canvas 上扩展 API 规格和业务规则两个新章节。QA Analyst 对其规格文档进行验证，发现 1 个关键 GAP：**APIEndpointCard 和 StateMachineCard 类型定义缺失**（spec-canvas-extend PRD 的 specs/E5-chapter-type.md 已补充），以及 **OpenAPIGenerator 与 JSON Schema 不兼容**（需 Schema 适配层）。

### 目标
对 `vibex-sprint4-spec-canvas-extend` 的 PRD 和 Spec 文档进行 QA 验收，验证：
1. CardType 类型定义完整且与 OpenAPIGenerator 兼容
2. Schema 适配层方案可行（方案C: patch Spec）
3. DDSToolbar/DDSCanvasStore 硬编码已识别且可修改
4. 跨章节边实现路径正确
5. Sprint4 PRD 验收标准覆盖完整
6. E2E 测试策略合理

### 成功指标
- APIEndpointCard 和 StateMachineCard 类型定义在 `types/dds/index.ts` 中存在
- Schema 适配层（APICanvasExporter）不修改 OpenAPIGenerator 源码
- DDSToolbar CHAPTER_LABELS 扩展可验证（5 个标签）
- DDSCanvasStore initialChapters 扩展可验证（api + businessRules）
- Sprint4 PRD 验收标准可转化为测试用例
- 0 个阻塞性 GAP 遗留

---

## 1. 功能点总表（QA 验证项）

| ID | 功能点 | 描述 | 验收标准（expect()） | 页面集成 |
|----|--------|------|---------------------|---------|
| F-QA.1 | APIEndpointCard 类型定义验证 | `types/dds/index.ts` 存在 `APIEndpointCard` 接口，含 path/method/summary/parameters/requestBody/responses 字段 | expect('APIEndpointCard' in types).toBe(true); expect(types.APIEndpointCard.properties.path).toBeDefined(); expect(types.APIEndpointCard.properties.method).toBeDefined() | 无 |
| F-QA.2 | APIParameter/APIResponse 结构验证 | `APIParameter` 含 name/in/required/schema；`APIResponse` 含 statusCode/description/schema | expect('APIParameter' in types).toBe(true); expect('APIResponse' in types).toBe(true) | 无 |
| F-QA.3 | StateMachineCard 类型定义验证 | `types/dds/index.ts` 存在 `StateMachineCard` 接口，含 stateId/stateType/events 字段；`StateType` 含 6 种状态 | expect('StateMachineCard' in types).toBe(true); expect('StateType' in types).toBe(true); expect(types.StateType).toContain('initial'); expect(types.StateType).toContain('final') | 无 |
| F-QA.4 | ChapterType 扩展验证 | ChapterType 联合类型包含 'api' 和 'businessRules' 两个新成员 | expect(chapterTypes).toContain('api'); expect(chapterTypes).toContain('businessRules') | 无 |
| F-QA.5 | CardType 扩展验证 | CardType 联合类型包含 'api-endpoint' 和 'state-machine' | expect(cardTypes).toContain('api-endpoint'); expect(cardTypes).toContain('state-machine') | 无 |
| F-QA.6 | Schema 适配层验证 | `APICanvasExporter.ts` 存在且 `exportToOpenAPI()` 不修改 `OpenAPIGenerator.ts` 源码 | expect(APICanvasExporter).toBeDefined(); expect(fs.existsSync('src/lib/contract/APICanvasExporter.ts')).toBe(true) | 无 |
| F-QA.7 | Schema 方案C验证 | APICanvasExporter 使用 patch Spec 方式（直接写入 JSON Schema 到生成的 spec.paths），不依赖 Zod | grep(APICanvasExporter, 'z\.ZodType').toBeFalsy() | 无 |
| F-QA.8 | DDSToolbar CHAPTER_LABELS 扩展验证 | DDSToolbar.tsx CHAPTER_LABELS 包含 5 个条目 | const labels = Object.keys(CHAPTER_LABELS); expect(labels).toHaveLength(5); expect(labels).toContain('api'); expect(labels).toContain('businessRules') | 【需页面集成】DDSToolbar |
| F-QA.9 | DDSCanvasStore initialChapters 扩展验证 | DDSCanvasStore initialChapters 包含 api 和 businessRules | const initial = getInitialChapters(); expect(Object.keys(initial)).toHaveLength(5); expect('api' in initial).toBe(true); expect('businessRules' in initial).toBe(true) | 无（store 层） |
| F-QA.10 | CrossChapterEdgesOverlay 复用验证 | 新章节自动支持 sourceChapter/targetChapter（无需修改 Overlay） | expect(DDSEdge.properties.sourceChapter).toBeDefined(); expect(DDSEdge.properties.targetChapter).toBeDefined() | 无 |
| F-QA.11 | Sprint4 PRD 验收标准覆盖验证 | prd.md 中 E1（API）和 E2（SM）Epic 验收标准可写 expect() 断言 | expect(prd.E1.stories).toHaveLength(5); expect(prd.E2.stories).toHaveLength(5); prd.E1.stories.forEach(s => expect(s.acceptanceCriteria).toBeDefined()) | 无（文档验证） |
| F-QA.12 | Specs 四态定义覆盖验证 | specs/E1-api-chapter.md 和 specs/E2-business-rules.md 含四态定义 | expect(specs['E1'].states).toContain('ideal'); expect(specs['E1'].states).toContain('empty'); expect(specs['E1'].states).toContain('loading'); expect(specs['E1'].states).toContain('error') | 无（文档验证） |
| F-QA.13 | E2E 测试策略合理性验证 | PRD E5 Epic 包含 APIEndpointCard + StateMachineCard 单元测试覆盖 | expect(prd.E5.stories).toHaveLength(2); expect(prd.E5['E1'].estHours).toBeGreaterThan(0); expect(prd.E5['E2'].estHours).toBeGreaterThan(0) | 无（文档验证） |
| F-QA.14 | StateMachine JSON 导出验证 | `exportToStateMachine()` 输出含 initial 和 states 字段 | const sm = exportToStateMachine(nodes, edges); expect(sm.initial).toBeDefined(); expect(sm.states).toBeDefined() | 无（导出函数验证） |
| F-QA.15 | FlowNode 类型复用验证 | flowMachine.ts 的 FlowNodeType 可扩展为 StateType | expect(FlowNodeType).toBeDefined(); // 复用模式确认 | 无 |

---

## 2. Epic 拆分（QA 视角）

### E1: CardType 类型定义验证

**Epic 目标**: 验证 `vibex-sprint4-spec-canvas-extend` 的 PRD 已补充 APIEndpointCard 和 StateMachineCard 显式类型定义，满足 Analyst 报告的 GAP。

#### 2a. 本质需求穿透

- **用户的底层动机**: Dev 知道每种卡片长什么样，TypeScript 编译器能帮忙检查错误
- **去掉类型定义会怎样**: 随意往 store 塞数据，运行时才发现字段对不上
- **解决的本质问题**: 类型安全是最低成本的 QA

#### 2b. 最小可行范围

- **本期必做**: APIEndpointCard 完整定义 + StateMachineCard 完整定义
- **本期不做**: 完整 Zod schema 验证层（运行时验证）
- **暂缓**: Schema 选择器（引用 api-contract.yaml）

#### 2c. 验证情绪地图

**验证场景: types/dds/index.ts**
- **进入时**: 想看到新增的类型定义
- **迷路时**: 不知道定义放哪里 → 搜索 'APIEndpointCard' 应该在一个文件中
- **出错时**: 类型定义与实际使用不一致 → TypeScript 编译报错

#### E1-QA-T1: APIEndpointCard 接口定义验证
- **Story**: `types/dds/index.ts` 包含 `APIEndpointCard` 接口，字段包括 path/method/summary/parameters/requestBody/responses
- **工时**: 0.5h
- **验收标准**: `expect('APIEndpointCard' in types).toBe(true)`

#### E1-QA-T2: APIParameter / APIResponse 结构验证
- **Story**: `APIParameter` 和 `APIResponse` 接口完整定义
- **工时**: 0.5h
- **验收标准**: `expect('APIParameter' in types).toBe(true) && expect('APIResponse' in types).toBe(true)`

#### 2d. UI 状态规范

详见 `specs/E1-card-type-validation.md`

---

### E2: StateMachineCard 类型定义验证

**Epic 目标**: 验证 StateMachineCard 类型定义完整，StateType 包含 6 种状态类型。

#### 2a. 本质需求穿透

- **用户的底层动机**: 每种状态节点都能被正确分类和渲染
- **去掉类型定义会怎样**: 6 种状态混用，UI 上看不出区别
- **解决的本质问题**: 状态类型是可视化的前提

#### 2b. 最小可行范围

- **本期必做**: StateMachineCard + StateType 定义
- **本期不做**: SMTransition 接口（暂缓）
- **暂缓**: entry/exit 状态类型

#### 2c. 验证情绪地图

**验证场景: types/dds/index.ts**
- **进入时**: 想看到 StateMachine 相关的所有类型
- **迷路时**: 找不到 StateType → 搜索应在同一文件中
- **出错时**: 类型不匹配 → TS 报错

#### E2-QA-T3: StateMachineCard 接口验证
- **Story**: `StateMachineCard` 接口包含 stateId/stateType/events
- **工时**: 0.5h
- **验收标准**: `expect('StateMachineCard' in types).toBe(true)`

#### E2-QA-T4: StateType 枚举验证
- **Story**: `StateType` 包含 'initial'/'final'/'normal'/'choice'/'join'/'fork'
- **工时**: 0.5h
- **验收标准**: 6 种状态类型全部存在

---

### E3: Schema 适配层验证

**Epic 目标**: 验证 OpenAPIGenerator 与 JSON Schema 的兼容方案可行，不修改 Generator 源码。

#### 2a. 本质需求穿透

- **用户的底层动机**: 拖拽端点卡片 → 填 JSON Schema → 导出 OpenAPI，这个链条不能断
- **去掉适配层**: Generator 用 Zod，Canvas 用 JSON Schema，导不出完整 spec
- **解决的本质问题**: 用户的 Schema 数据必须能流到导出器

#### 2b. 最小可行范围

- **本期必做**: APICanvasExporter patch Spec 方案（方案C）
- **本期不做**: json-schema-to-zod 自动转换（方案B）
- **暂缓**: YAML 导出

#### 2c. 验证情绪地图

**验证场景: APICanvasExporter.ts**
- **进入时**: 想确认适配层不碰 OpenAPIGenerator
- **迷路时**: 不知道在哪里 → APICanvasExporter.ts
- **出错时**: 适配层调用 Generator 时出错 → 在 Exporter 层捕获

#### E3-QA-T5: APICanvasExporter 存在性验证
- **Story**: APICanvasExporter.ts 存在，exportToOpenAPI() 正确调用 Generator
- **工时**: 0.5h
- **验收标准**: `expect(fs.existsSync('APICanvasExporter.ts')).toBe(true)`

#### E3-QA-T6: 方案C验证（patch Spec）
- **Story**: APICanvasExporter 使用 patch 方式，直接将 JSON Schema 写入 spec.paths，不依赖 Zod
- **工时**: 1h
- **验收标准**: `expect(APICanvasExporter).not.toMatch(/z\.ZodType/)`

#### E3-QA-T7: StateMachine JSON 导出验证
- **Story**: exportToStateMachine() 输出含 initial + states
- **工时**: 0.5h
- **验收标准**: `expect(sm.initial).toBeDefined(); expect(sm.states).toBeDefined()`

---

### E4: 硬编码识别验证

**Epic 目标**: 识别并记录 Sprint2 代码中的 2 处硬编码（DDSToolbar 3章节 / DDSCanvasStore initialChapters），验证修改路径。

#### 2a. 本质需求穿透

- **用户的底层动机**: 新章节必须出现在界面上，不能被硬编码卡住
- **去掉硬编码检查会怎样**: Dev 改了类型但 UI 不显示，排查半天
- **解决的本质问题**: 硬编码是扩展性杀手，必须全部消灭

#### 2b. 最小可行范围

- **本期必做**: 2 处硬编码全部识别 + 修改方案明确
- **本期不做**: 其他硬编码扫描（留给 Tech Debt）
- **暂缓**: 动态章节配置

#### 2c. 验证情绪地图

**验证场景: 代码扫描**
- **进入时**: 想找到所有硬编码
- **迷路时**: 不知道还有没有 → 搜索 'requirement' in toolbar.tsx
- **出错时**: 硬编码遗漏 → 新章节不显示

#### E4-QA-T8: DDSToolbar 硬编码验证
- **Story**: CHAPTER_LABELS 从 3 个扩展到 5 个
- **工时**: 0.5h
- **验收标准**: `expect(Object.keys(CHAPTER_LABELS)).toHaveLength(5)`

#### E4-QA-T9: DDSCanvasStore initialChapters 验证
- **Story**: initialChapters 从 3 个扩展到 5 个
- **工时**: 0.5h
- **验收标准**: `expect(Object.keys(initialChapters)).toHaveLength(5)`

#### E4-QA-T10: CrossChapterEdgesOverlay 复用验证
- **Story**: 新章节天然支持 sourceChapter/targetChapter
- **工时**: 0.5h
- **验收标准**: `expect(DDSEdge.shape).toContain('sourceChapter')`

---

### E5: PRD 文档覆盖验证

**Epic 目标**: 验证 `vibex-sprint4-spec-canvas-extend` 的 PRD 和 Spec 文档覆盖完整。

#### 2a. 本质需求穿透

- **用户的底层动机**: PRD 是 Dev 的契约，写不清楚 = 做不出来
- **去掉验收标准会怎样**: Dev 不知道做到什么程度算完成
- **解决的本质问题**: 文档是协作的基础

#### 2b. 最小可行范围

- **本期必做**: PRD 验收标准可写 expect() + Specs 四态存在
- **本期不做**: 逐字逐句的文档审查
- **暂缓**: 文档国际化

#### 2c. 验证情绪地图

**验证场景: PRD 文档**
- **进入时**: 想看到每个 Epic 都有验收标准
- **迷路时**: 不知道哪个 Story 缺验收标准 → 表格扫描
- **出错时**: Story 无 expect() → 标记 Gap

#### E5-QA-T11: PRD 验收标准覆盖验证
- **Story**: E1 + E2 Epic 每个 Story 有 expect() 断言
- **工时**: 1h
- **验收标准**: `expect(missingAcceptanceCriteria).toHaveLength(0)`

#### E5-QA-T12: Specs 四态定义覆盖验证
- **Story**: E1-api-chapter.md 和 E2-business-rules.md 含四态
- **工时**: 0.5h
- **验收标准**: 每个涉及页面的 Epic 有 specs 文件

#### E5-QA-T13: E2E 测试策略合理性验证
- **Story**: PRD E5 Epic 包含 APIEndpointCard + StateMachineCard 测试
- **工时**: 0.5h
- **验收标准**: `expect(testStories).toHaveLength(2)`

---

## 3. 优先级矩阵

| 优先级 | Epic | 功能点 | 依据 |
|--------|------|--------|------|
| P0 | E1 | T1~T2（CardType API 定义） | Analyst Gap，必须修复 |
| P0 | E2 | T3~T4（CardType SM 定义） | Analyst Gap，必须修复 |
| P0 | E3 | T5~T7（Schema 适配层） | 导出链路核心 |
| P0 | E4 | T8~T10（硬编码 + 跨章节） | 扩展性必须 |
| P0 | E5 | T11~T13（PRD/Spec 文档） | 文档是协作基础 |
| P1 | E3 | 导出函数完整测试 | 质量保证 |
| P1 | E4 | FlowNode 类型复用 | 代码复用确认 |

---

## 4. 验收标准汇总（expect() 条目）

### E1 CardType API 定义

```
// T1: APIEndpointCard 接口
const types = require('./types/dds/index.ts')
expect('APIEndpointCard' in types).toBe(true)
expect(types.APIEndpointCard.properties.path).toBeDefined()
expect(types.APIEndpointCard.properties.method).toBeDefined()
expect(types.APIEndpointCard.properties.summary).toBeDefined()
expect(types.APIEndpointCard.properties.parameters).toBeDefined()
expect(types.APIEndpointCard.properties.requestBody).toBeDefined()
expect(types.APIEndpointCard.properties.responses).toBeDefined()

// T2: APIParameter / APIResponse
expect('APIParameter' in types).toBe(true)
expect('APIResponse' in types).toBe(true)
expect(types.APIParameter.properties.name).toBeDefined()
expect(types.APIParameter.properties.in).toBeDefined()
expect(types.APIResponse.properties.statusCode).toBeDefined()
expect(types.APIResponse.properties.description).toBeDefined()
```

### E2 CardType SM 定义

```
// T3: StateMachineCard 接口
expect('StateMachineCard' in types).toBe(true)
expect(types.StateMachineCard.properties.stateId).toBeDefined()
expect(types.StateMachineCard.properties.stateType).toBeDefined()
expect(types.StateMachineCard.properties.events).toBeDefined()

// T4: StateType 枚举
expect('StateType' in types).toBe(true)
const stateTypes = ['initial', 'final', 'normal', 'choice', 'join', 'fork']
stateTypes.forEach(t => expect(types.StateType.includes(t)).toBe(true))
```

### E3 Schema 适配层

```
// T5: APICanvasExporter 存在
expect(fs.existsSync('src/lib/contract/APICanvasExporter.ts')).toBe(true)
expect(typeof exportToOpenAPI).toBe('function')

// T6: 方案C patch Spec（不依赖 Zod）
const exporterCode = fs.readFileSync('APICanvasExporter.ts', 'utf8')
expect(exporterCode).not.toMatch(/z\.ZodType/)
expect(exporterCode).toMatch(/spec\.paths/)

// T7: StateMachine JSON 导出
const sm = exportToStateMachine(nodes, edges)
expect(sm.initial).toBeDefined()
expect(sm.states).toBeDefined()
expect(typeof sm.states).toBe('object')
```

### E4 硬编码识别

```
// T8: DDSToolbar CHAPTER_LABELS
const toolbar = require('./components/dds/toolbar/DDSToolbar.tsx')
const labels = Object.keys(toolbar.CHAPTER_LABELS)
expect(labels).toHaveLength(5)
expect(labels).toContain('api')
expect(labels).toContain('businessRules')

// T9: DDSCanvasStore initialChapters
const store = require('./stores/dds/DDSCanvasStore.ts')
const chapters = Object.keys(store.initialChapters)
expect(chapters).toHaveLength(5)
expect(chapters).toContain('api')
expect(chapters).toContain('businessRules')

// T10: CrossChapterEdgesOverlay
expect('sourceChapter' in DDSEdge).toBe(true)
expect('targetChapter' in DDSEdge).toBe(true)
```

### E5 PRD 文档覆盖

```
// T11: PRD 验收标准覆盖
const prd = require('./prd.md')
const missingAC = []
prd.epics.forEach(epic => {
  epic.stories.forEach(story => {
    if (!story.acceptanceCriteria || story.acceptanceCriteria.length === 0) {
      missingAC.push(`${epic.id}-${story.id}`)
    }
  })
})
expect(missingAC).toHaveLength(0)

// T12: Specs 四态定义
const specE1 = require('./specs/E1-api-chapter.md')
const specE2 = require('./specs/E2-business-rules.md')
;['ideal', 'empty', 'loading', 'error'].forEach(state => {
  expect(specE1.states).toContain(state)
  expect(specE2.states).toContain(state)
})

// T13: E2E 测试策略
expect(prd.epics.find(e => e.id === 'E5').stories.length).toBeGreaterThanOrEqual(2)
```

---

## 5. DoD (Definition of Done)

### QA 完成判断标准

#### E1 CardType API 定义
- [ ] `types/dds/index.ts` 包含 `APIEndpointCard` 接口，字段完整
- [ ] `APIParameter` 和 `APIResponse` 接口存在且字段正确
- [ ] TypeScript 编译 0 errors

#### E2 CardType SM 定义
- [ ] `StateMachineCard` 接口包含 stateId/stateType/events
- [ ] `StateType` 包含 6 种状态类型
- [ ] TypeScript 编译 0 errors

#### E3 Schema 适配层
- [ ] `APICanvasExporter.ts` 存在
- [ ] `exportToOpenAPI()` 不调用 Zod 类型
- [ ] `exportToStateMachine()` 输出含 initial + states
- [ ] 单元测试覆盖导出函数

#### E4 硬编码识别
- [ ] `DDSToolbar.tsx` CHAPTER_LABELS 包含 5 个条目
- [ ] `DDSCanvasStore.ts` initialChapters 包含 5 个条目
- [ ] `DDSEdge` 类型包含 sourceChapter/targetChapter

#### E5 PRD 文档覆盖
- [ ] PRD E1 + E2 Epic 每个 Story 有 expect() 验收标准
- [ ] `specs/E1-api-chapter.md` 和 `specs/E2-business-rules.md` 含四态定义
- [ ] PRD E5 Epic 包含 APIEndpointCard + StateMachineCard 测试计划

#### 全局
- [ ] 0 个 P0 GAP 遗留
- [ ] 所有 P1 GAP 记录在案

---

## 6. Specs 索引

| Spec 文件 | 对应 Epic | 描述 |
|-----------|---------|------|
| specs/E1-card-type-validation.md | E1 + E2 | CardType 验证规格 |
| specs/E3-schema-adapter-validation.md | E3 | Schema 适配层验证规格 |
| specs/E4-hardcode-validation.md | E4 | 硬编码识别验证规格 |

---

## 7. 关键设计决策记录

| 决策 | 采纳方案 | 理由 |
|------|---------|------|
| Schema 适配方案 | 方案C（patch Spec） | 不修改 OpenAPIGenerator，最小改动 |
| StateMachine 导出 | JSON（MVP） | XState 后续迭代 |
| E2E 测试策略 | APIEndpointCard + StateMachineCard 单元测试（MVP） | E2E 测试 P1 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint4-qa
- **执行日期**: 2026-04-18
- **条件**: QA 验证结果作为 `vibex-sprint4-spec-canvas-extend` 是否可进入 design-architecture 的依据
