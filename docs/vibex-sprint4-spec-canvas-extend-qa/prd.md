# PRD — vibex-sprint4-spec-canvas-extend-qa

**项目**: vibex-sprint4-spec-canvas-extend-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: PM
**上游**: vibex-sprint4-spec-canvas-extend (analysis.md, prd.md, specs/, tester-reports/)

---

## 执行摘要

### 背景
`vibex-sprint4-spec-canvas-extend` 在 `vibex-sprint4-qa` 通过后，完成了 DDS Canvas 的两个新章节扩展（API 规格 + 业务规则）。Testers 已产出 5 份测试报告（E1~E5），Reviewer 已产出 E1 审查报告。

### 目标
对 `vibex-sprint4-spec-canvas-extend` 的产出物进行系统性 QA 验证，覆盖：
- **产出物完整性**：所有 Epic/Unit 的代码、测试、文档是否全部到位
- **交互可用性**：拖拽流程、属性编辑、导出交互是否可走通
- **设计一致性**：组件规范是否与 specs/ 一致，CSS Token 是否使用正确

### 成功指标
- 所有 Epic 的代码、测试、Spec 三类产出物全部到位
- QA 验收标准 100% 可写 `expect()` 断言
- 发现的所有缺陷必须进入 `defects/` 目录，按 P0/P1/P2 分类
- 无遗留 P0 阻塞性缺陷进入下一阶段

---

## 1. 功能点总表（QA 视角）

### 1a. 产出物完整性检查矩阵

| Epic | 代码产出 | 测试产出 | Spec 产出 | 完整性判定 |
|------|---------|---------|---------|-----------|
| E1: API 章节 | APIEndpointCard + DDSPanel + Store + Persistence | 154 tests (tester-E1) | E1-api-chapter.md ✅ | ? |
| E2: SM 章节 | StateMachineCard + DDSPanel + Store + Persistence | 158 tests (tester-E2) | E2-business-rules.md ✅ | ? |
| E3: 跨章节 | DDSToolbar 5章节 + CrossChapterEdgesOverlay | 166 tests (tester-E3) | E3-cross-chapter.md ✅ | ? |
| E4: 导出 | exporter.ts + DDSToolbar Export 按钮 | 31 tests (tester-E4) | E4-export.md ✅ | ? |
| E5: 四态 | ChapterEmptyState + ChapterSkeleton + CardErrorBoundary | 5 tests (tester-E5) | E1-api-chapter.md + E2-business-rules.md ✅ | ? |

### 1b. 交互可用性检查矩阵

| 交互路径 | 起点 | 操作 | 终点 | 预期结果 |
|---------|------|------|------|---------|
| I1 | DDSPanel (api 章节) | 拖拽 GET 卡片到画布 | DDSFlow | APIEndpointCard 节点出现，method=GET |
| I2 | APIEndpointCard 节点 | 双击 | DDSPanel 右侧 | 属性面板出现，path/summary 可编辑 |
| I3 | DDSPanel (businessRules 章节) | 拖拽 State 卡片到画布 | DDSFlow | StateMachineCard 节点出现，stateType=normal |
| I4 | StateMachineCard 节点 | 双击 | DDSPanel 右侧 | 状态属性面板出现，stateType 下拉可选 |
| I5 | DDSToolbar | 点击"API"按钮 | DDSFlow | activeChapter=api，API 章节显示 |
| I6 | DDSToolbar | 点击导出 OpenAPI | 下载/复制 | 符合 OpenAPI 3.0 的 JSON 生成 |
| I7 | DDSToolbar | 点击导出 StateMachine | 下载/复制 | JSON 含 initial/states 字段 |
| I8 | API 章节无数据 | 打开 API 章节 | 空状态 | 引导文案出现，不白屏 |
| I9 | 章节数据加载中 | 打开任意章节 | 加载态 | 骨架屏出现，不转圈 |

### 1c. 设计一致性检查矩阵

| 检查项 | 规范来源 | 预期 | 检查方法 |
|--------|---------|------|---------|
| C1 | E5-chapter-type.md | 方法 badge 颜色用 Token (--color-method-get 等) | 代码搜索，grep "#[0-9a-fA-F]{6}" |
| C2 | E5-chapter-type.md | 状态机图标颜色用 Token (--color-sm-* ) | 同上 |
| C3 | E5-chapter-type.md | 间距为 8 的倍数 | 代码审查，无 "7px"/"15px" 等 |
| C4 | E5-chapter-type.md | ChapterType 包含 api + businessRules | types/dds/index.ts |
| C5 | E5-chapter-type.md | CardType 包含 api-endpoint + state-machine | types/dds/index.ts |
| C6 | E1-api-chapter.md | API 章节空状态有引导文案 | 搜索 "拖拽" 文案 |
| C7 | E1-api-chapter.md | APIEndpointCard 宽度 180px | CSS 文件 |
| C8 | E1-api-chapter.md | 加载态用骨架屏，不用转圈 | 代码搜索 "spinner"/"loading" |
| C9 | E1-api-chapter.md | 错误态有 ErrorBoundary | 有 CardErrorBoundary 组件 |
| C10 | E2-business-rules.md | SM 节点 6 种类型图标全部实现 | 代码审查 |
| C11 | E4-export.md | 导出 Modal 有语法高亮 | 代码审查 |
| C12 | E3-cross-chapter.md | 5 章节按钮显示 | DDSToolbar 测试通过 |
| C13 | Reviewer SG-1 | api-endpoint.ts 无 CSS 块 | 代码审查 |
| C14 | Reviewer SG-2 | ChapterPanel 有 CreateAPIEndpointForm | 代码审查 |

---

## 2. Epic 拆分（QA 验证维度）

### E1: API 章节产出物完整性

**Epic 目标**: 验证 API 规格章节的代码、测试、Spec 三类产出物全部到位。

#### 2a. 本质需求穿透

- **验证的核心**: APIEndpointCard 从类型定义 → 组件实现 → 测试覆盖 → 文档规范，全链路是否闭合
- **去掉的验证项**: Schema 选择器（A4/A5 MVP 不做）
- **本质问题**: 单元测试通过 ≠ 交互可用；Spec 文档存在 ≠ 实现一致

#### 2b. 最小可行范围

- **本期必查**: 类型 + 组件 + 持久化 + 单元测试 + Spec 文档
- **本期不查**: E2E 测试（dev 阶段已规划）

#### 2c. 情绪地图（QA 视角）

- **进入 API 章节**: 预期看到 5 种方法卡片，用户不迷路 → 检查点：C1, C2
- **拖拽端点到画布**: 节点出现且颜色正确 → 检查点：I1
- **导出 OpenAPI**: JSON 符合规范 → 检查点：I6

#### E1-QA1: 类型定义完整性
- **验证项**: `types/dds/api-endpoint.ts` 存在，包含 HTTPMethod/APIParameter/APIResponse/APIEndpointCard
- **验收标准**: `expect(typeof apiEndpointCard.method).toBe('string')` 且值在 HTTP 方法集合中

#### E1-QA2: APIEndpointCard 组件
- **验证项**: `APIEndpointCard.tsx` 存在，method badge 颜色用 Token，无硬编码
- **验收标准**: `expect(screen.getByTestId('method-badge-GET')).toHaveStyle({ backgroundColor: 'var(--color-method-get)' })`

#### E1-QA3: CardRenderer 注册
- **验证项**: `CardRenderer.tsx` 有 `case 'api-endpoint': return <APIEndpointCard ...>`
- **验收标准**: `expect(screen.getByTestId('api-endpoint-node')).toBeInTheDocument()`

#### E1-QA4: DDSCanvasStore 支持 api chapter
- **验证项**: Store 的 chapters 包含 api，持久化函数处理 api
- **验收标准**: `expect(Object.keys(useDDSCanvasStore.getState().chapters)).toContain('api')`

#### E1-QA5: Reviewer 发现项验证
- **SG-1 验证**: `api-endpoint.ts` 中无 CSS 块（grep "background:" 在 ts 文件中应为 0）
- **SG-2 验证**: `ChapterPanel.tsx` 有 `CreateAPIEndpointForm` 或等效表单逻辑

---

### E2: 业务规则章节产出物完整性

**Epic 目标**: 验证 StateMachine 章节的代码、测试、Spec 产出物完整性。

#### 2a. 本质需求穿透

- **验证的核心**: StateMachineCard 从类型 → 组件 → 测试 → 文档全链路闭合
- **去掉的验证项**: B4（转移配置面板）、B6（XState 导出）— MVP 不做

#### 2b. 最小可行范围

- **本期必查**: 类型 + 组件 + 6 种状态图标 + 持久化 + 测试 + Spec

#### 2c. 情绪地图（QA 视角）

- **进入业务规则章节**: 预期看到 3 种组件卡片 → 检查点：C3
- **拖拽状态节点**: 6 种类型图标全部正确显示 → 检查点：I3, C10

#### E2-QA1: 类型定义完整性
- **验证项**: `types/dds/state-machine.ts` 存在，包含 6 种 stateType
- **验收标准**: `expect(['initial','final','normal','choice','join','fork']).toContain(card.stateType)`

#### E2-QA2: StateMachineCard 组件
- **验证项**: 6 种状态图标全部实现，CSS Token 使用正确
- **验收标准**: 6 个图标元素均可通过 `getByTestId` 获取

#### E2-QA3: CardRenderer 注册
- **验证项**: `case 'state-machine': return <StateMachineCard ...>`
- **验收标准**: `expect(screen.getByTestId('state-machine-node')).toBeInTheDocument()`

#### E2-QA4: DDSCanvasStore 支持 businessRules
- **验证项**: Store chapters 包含 businessRules，key 为 kebab-case `'business-rules'`
- **验收标准**: `expect(Object.keys(useDDSCanvasStore.getState().chapters)).toContain('businessRules')` 或 `expect(chapters['business-rules']).toBeDefined()`

#### E2-QA5: 6 种状态图标 CSS Token
- **验证项**: 全部使用 `--color-sm-*` Token，无硬编码
- **验收标准**: `expect(screen.getByTestId('state-icon-initial')).toHaveStyle({ color: 'var(--color-sm-initial)' })`

---

### E3: 跨章节集成完整性

**Epic 目标**: 验证 5 章节切换和跨章节边渲染的产出物完整性。

#### 3a. 本质需求穿透

- **验证的核心**: DDSToolbar 是否显示 5 个章节，CrossChapterEdgesOverlay 是否正确渲染跨章节边
- **去掉的验证项**: 章节显示管理（C4 暂缓）

#### 3c. 情绪地图（QA 视角）

- **打开画布**: 预期看到 5 个章节按钮，当前章节高亮 → 检查点：I5, C12
- **画跨章节边**: API → Requirement 边正确渲染 → 检查点：C12

#### E3-QA1: DDSToolbar 5 章节
- **验证项**: CHAPTER_LABELS 包含 api + businessRules，5 个 button
- **验收标准**: `expect(screen.getAllByRole('button')).toHaveLength(5)`

#### E3-QA2: 章节切换功能
- **验证项**: 点击 API 按钮 → activeChapter = 'api'
- **验收标准**: `expect(useDDSCanvasStore.getState().activeChapter).toBe('api')`

#### E3-QA3: CrossChapterEdgesOverlay 5 栏支持
- **验证项**: CHAPTER_OFFSETS 包含 5 个章节的偏移量
- **验收标准**: `expect(CHAPTER_ORDER).toHaveLength(5)`

#### E3-QA4: 跨章节边渲染
- **验证项**: API→Requirement 跨章节边可渲染
- **验收标准**: `expect(screen.getByTestId('cross-chapter-edge')).toBeInTheDocument()`

---

### E4: 导出功能完整性

**Epic 目标**: 验证 OpenAPI 和 StateMachine 导出函数的代码、测试、Spec 完整性。

#### 4c. 情绪地图（QA 视角）

- **点击导出按钮**: 预期 JSON 出现，复制/下载功能正常 → 检查点：I6, I7
- **无数据导出**: 预期空 JSON `{}`，不崩溃 → 检查点：I8

#### E4-QA1: OpenAPI Export 函数
- **验证项**: `exporter.ts` 有 `exportToOpenAPI` 函数
- **验收标准**: `expect(spec.openapi).toMatch(/3\.\d+\.\d+/)`

#### E4-QA2: StateMachine Export 函数
- **验证项**: `exporter.ts` 有 `exportToStateMachine` 函数
- **验收标准**: `expect(sm.initial).toBeTruthy()` + `expect(sm.states).toBeDefined()`

#### E4-QA3: DDSToolbar Export 按钮
- **验证项**: DDSToolbar 有 OpenAPI 和 StateMachine 导出按钮
- **验收标准**: 2 个导出按钮存在且可点击

#### E4-QA4: Export 失败处理
- **验证项**: 导出失败时 toast 提示，不崩溃
- **验收标准**: `expect(screen.getByText(/export failed/i)).toBeInTheDocument()`

---

### E5: 四态规范完整性

**Epic 目标**: 验证新章节的空状态/骨架屏/错误态组件是否正确实现。

#### 5a. 本质需求穿透

- **验证的核心**: 空状态有引导文案，加载态用骨架屏，错误态有 ErrorBoundary
- **去掉的验证项**: 暂缓项（无）

#### 5c. 情绪地图（QA 视角）

- **API 章节无数据**: 预期引导文案，不白屏 → 检查点：I8, C6
- **数据加载中**: 预期骨架屏，不转圈 → 检查点：I9, C8

#### E5-QA1: ChapterEmptyState 组件
- **验证项**: 空状态组件存在且有引导文案
- **验收标准**: `expect(screen.getByText(/拖拽.*HTTP/i)).toBeInTheDocument()`

#### E5-QA2: ChapterSkeleton 组件
- **验证项**: 骨架屏组件存在，不使用 spinner
- **验收标准**: `expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()`

#### E5-QA3: CardErrorBoundary 组件
- **验证项**: 错误边界组件存在，包裹卡片渲染
- **验收标准**: `expect(screen.getByText(/API 端点渲染失败/i)).toBeInTheDocument()` 或 `expect(screen.getByText(/状态节点渲染失败/i)).toBeInTheDocument()`

---

## 3. 优先级矩阵

| 优先级 | Epic | QA 项 | 依据 |
|--------|------|-------|------|
| P0 | E1 | QA1~QA5（类型+组件+注册+Store+Reviewer项） | API 章节核心 |
| P0 | E2 | QA1~QA5（类型+组件+6图标+Store+Token） | SM 章节核心 |
| P0 | E3 | QA1~QA3（5章节+切换+偏移量） | 跨章节基座 |
| P0 | E4 | QA1~QA2（导出函数存在性） | 导出功能核心 |
| P0 | E5 | QA1~QA3（空状态+骨架屏+ErrorBoundary） | 四态基座 |
| P1 | E3 | QA4（跨章节边渲染） | 扩展能力 |
| P1 | E4 | QA3~QA4（导出按钮+失败处理） | 交互完整性 |
| P2 | E1 | SG-2（CreateAPIEndpointForm） | 非阻塞建议 |

---

## 4. 验收标准汇总（expect() 条目）

```
// E1-QA1: API 类型定义
expect(typeof apiEndpointCard.method).toMatch(/^(GET|POST|PUT|DELETE|PATCH)$/)

// E1-QA2: APIEndpointCard Token
expect(screen.getByTestId('method-badge-GET')).toHaveStyle({ backgroundColor: 'var(--color-method-get)' })

// E1-QA3: CardRenderer 注册
expect(screen.getByTestId('api-endpoint-node')).toBeInTheDocument()

// E1-QA4: Store api chapter
expect(Object.keys(useDDSCanvasStore.getState().chapters)).toContain('api')

// E1-QA5 SG-1: api-endpoint.ts 无 CSS
expect(apiEndpointFileContent).not.toMatch(/\.(card|header|badge)\s*\{[^}]*\}/)

// E1-QA5 SG-2: CreateAPIEndpointForm
expect(screen.getByLabelText(/method/i) || screen.getByPlaceholderText(/method/i)).toBeInTheDocument()

// E2-QA1: SM 类型定义
expect(['initial','final','normal','choice','join','fork']).toContain(card.stateType)

// E2-QA2: 6 种状态图标
expect(screen.getByTestId('state-icon-initial')).toBeInTheDocument()
expect(screen.getByTestId('state-icon-final')).toBeInTheDocument()
expect(screen.getByTestId('state-icon-normal')).toBeInTheDocument()
expect(screen.getByTestId('state-icon-choice')).toBeInTheDocument()
expect(screen.getByTestId('state-icon-join')).toBeInTheDocument()
expect(screen.getByTestId('state-icon-fork')).toBeInTheDocument()

// E2-QA4: Store businessRules
expect(chapters['business-rules']).toBeDefined()

// E2-QA5: CSS Token 使用
expect(screen.getByTestId('state-icon-initial')).toHaveStyle({ color: 'var(--color-sm-initial)' })

// E3-QA1: 5 章节按钮
expect(screen.getAllByRole('button')).toHaveLength(5)

// E3-QA2: 章节切换
expect(useDDSCanvasStore.getState().activeChapter).toBe('api')

// E3-QA3: CHAPTER_ORDER 长度
expect(CHAPTER_ORDER).toHaveLength(5)

// E3-QA4: 跨章节边
expect(screen.getByTestId('cross-chapter-edge')).toBeInTheDocument()

// E4-QA1: OpenAPI Export
expect(spec.openapi).toMatch(/3\.\d+\.\d+/)
expect(spec.paths).toBeDefined()

// E4-QA2: StateMachine Export
expect(sm.initial).toBeTruthy()
expect(sm.states).toBeDefined()

// E4-QA3: Export 按钮
expect(screen.getByRole('button', { name: /openapi/i })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /statemachine/i })).toBeInTheDocument()

// E5-QA1: 空状态引导
expect(screen.getByText(/拖拽.*HTTP/i)).toBeInTheDocument()

// E5-QA2: 无 spinner
expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

// E5-QA3: ErrorBoundary 文案
expect(screen.getByText(/渲染失败/i)).toBeInTheDocument()
```

---

## 5. DoD (Definition of Done)

### QA 完成判断标准

#### 产出物完整性
- [ ] E1~E5 所有代码文件存在（通过文件路径检查）
- [ ] E1~E5 所有测试文件存在（通过文件路径检查）
- [ ] E1~E5 所有 Spec 文件存在（通过文件路径检查）
- [ ] `defects/` 目录包含所有发现缺陷，按 P0/P1/P2 分类

#### 交互可用性
- [ ] I1~I9 交互路径全部可走通（QA 手动验证 + gstack 截图）
- [ ] 导出功能 I6/I7 实际导出 JSON 验证通过

#### 设计一致性
- [ ] C1~C14 全部检查项通过
- [ ] 硬编码颜色值（grep hex）发现 0 处
- [ ] 间距硬编码（grep 非 8 倍数 px 值）发现 0 处

#### 报告完整性
- [ ] 产出 `docs/vibex-sprint4-spec-canvas-extend-qa/qa-final-report.md`
- [ ] 缺陷报告 `docs/vibex-sprint4-spec-canvas-extend-qa/defects/` 存在
- [ ] 每个 Epic 有明确 PASS/FAIL 判定

---

## 6. Specs 索引

| Spec 文件 | 对应 Epic | 用途 |
|-----------|---------|------|
| specs/E1-api-chapter.md | E1 + E5-D1 | API 章节四态 + 节点规范（QA 参照标准） |
| specs/E2-business-rules.md | E2 + E5-D2 | SM 章节四态 + 节点规范（QA 参照标准） |
| specs/E3-cross-chapter.md | E3 | 跨章节边规范（QA 参照标准） |
| specs/E4-export.md | E4 | 导出功能规范（QA 参照标准） |
| specs/E5-chapter-type.md | E1 + E2 | 类型系统规范（QA 参照标准） |

---

## 7. 关键设计决策记录

| 决策 | 采纳方案 | 理由 |
|------|---------|------|
| QA 验证方式 | 代码审查 + 单元测试验证 + gstack 截图 | 无真实前端环境，通过代码和测试间接验证 |
| 缺陷分类 | P0（阻塞）/P1（影响功能）/P2（体验/建议） | 与研发缺陷分类一致 |
| Reviewer SG-1 处理 | SG-1 → defects/SG-1-css-block.md（降为 P2 建议） | 非阻塞 |
| Reviewer SG-2 处理 | SG-2 → defects/SG-2-missing-form.md（降为 P1 缺陷） | 影响 CRUD 完整性 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint4-spec-canvas-extend-qa
- **执行日期**: 2026-04-18
