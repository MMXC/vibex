# Implementation Plan — vibex-sprint2-spec-canvas

**项目**: vibex-sprint2-spec-canvas
**角色**: Architect
**日期**: 2026-04-17
**状态**: active

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 三章节卡片管理 | E1-U1 ~ E1-U5 | ✅ 5/5 | E1-U1 |
| E2: 横向滚奏体验 | E2-U1 ~ E2-U3 | ✅ 3/3 | E2-U1 |
| E3: AI 草稿生成 | E3-U1 ~ E3-U4 | ✅ 4/4 | E3-U1 |
| E4: 章节间 DAG 关系 | E4-U1 ~ E4-U2 | ⬜ 0/2 | E4-U1 |
| E5: 状态与错误处理 | E5-U1 ~ E5-U3 | ✅ 3/3 | — |

**总工时**: 22h（MVP，含 buffer）

---

## E1: 三章节卡片管理

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | ✅ 三章节结构实现 | ✅ | — | 页面显示 requirement/context/flow 三个固定章节面板 |
| E1-U2 | ✅ 章节卡片 CRUD 实现 | ✅ | E1-U1 | 添加/编辑/删除卡片成功，卡片类型与章节绑定 |
| E1-U3 | ✅ 卡片 Schema 渲染 | ✅ | E1-U2 | UserStory 渲染 role/action/benefit；BC 渲染 name/desc/resp；FlowStep 渲染 stepName/actor/pre |
| E1-U4 | ✅ 章节内 DAG 实现 | ✅ | E1-U3 | 单章节内节点可拖拽，边可增删 |
| E1-U5 | ✅ 卡片 D1 持久化 | ✅ | E5-U1 | 卡片增删改同步写入 D1，刷新页面后数据保留 |

### E1-U1 详细说明

**文件变更**: `components/dds/ChapterPanel.tsx` (新建), `components/dds/DDSScrollContainer.tsx` (扩展)

**实现步骤**:
1. 新建 `ChapterPanel` 组件，接收 `chapterType` prop
2. 复用 `DDSScrollContainer` 的横向 ScrollSnap 结构
3. 固定 3 个 chapter 面板：`data-chapter="requirement/context/flow"`
4. URL 同步当前章节（`?chapter=requirement`）

**Patterns to follow**: 参考 `components/dds/DDSCanvasPage.tsx` 的章节初始化逻辑

**Test scenarios**:
- Happy path: 页面显示 3 个章节面板
- Happy path: `data-chapter` 属性正确设置
- Edge path: URL 无 chapter 参数，默认显示 requirement

**Verification**: `expect(document.querySelectorAll('.chapter-panel').length).toBe(3)`

---

### E1-U2 详细说明

**文件变更**: `stores/dds/DDSCanvasStore.ts` (E1-2), `components/dds/ChapterPanel.tsx` (E1-2)

**实现步骤**:
1. Store 添加 `addCard/chapterType/card` 方法，自动生成 id + timestamps
2. Store 添加 `updateCard/cardId/updates` 方法
3. Store 添加 `deleteCard/cardId` 方法，同时删除关联边
4. ChapterPanel 添加"添加卡片"按钮 + 卡片列表
5. 卡片编辑：点击卡片 → 展开编辑表单

**Patterns to follow**: 参考 `stores/dds/DDSCanvasStore.ts` 的现有 chapter actions 模式

**Test scenarios**:
- Happy path: 添加用户故事卡片，卡片出现在 requirement 章节
- Happy path: 编辑卡片 title，数据更新
- Happy path: 删除卡片，关联边一并删除
- Edge path: 在 context 章节添加 user-story 类型卡片（应被阻止）

**Verification**: `expect(addCard('requirement')).toChange(cardCount, by(1))`

---

### E1-U3 详细说明

**文件变更**: `components/dds/cards/UserStoryCard.tsx` (新建), `components/dds/cards/BoundedContextCard.tsx` (已有，补充), `components/dds/cards/FlowStepCard.tsx` (已有，补充), `components/dds/cards/CardRenderer.tsx` (扩展)

**实现步骤**:
1. `UserStoryCard`: 渲染 `作为|role|`、`我想要|action|`、`以便于|benefit|` 三个字段行
2. `BoundedContextCard`: 渲染 `上下文名称|name|`、`职责描述|description|`、`responsibility` 字段行
3. `FlowStepCard`: 渲染 `步骤名称|title|`、`执行者|actor|`、`前置条件|preCondition|` 字段行
4. `CardRenderer`: 根据 `card.cardType` 分发到对应卡片组件

**Patterns to follow**: 参考 `components/dds/cards/RequirementCard.tsx` 和 `components/dds/cards/CardRenderer.tsx` 现有实现

**Test scenarios**:
- Happy path: UserStory 卡片渲染"作为/我想要/以便于"三行
- Happy path: BoundedContext 卡片渲染"上下文名称/职责描述"
- Happy path: FlowStep 卡片渲染"步骤名称/执行者/前置条件"
- Edge path: 未知 cardType 显示"未知卡片类型"

**Verification**: `expect(screen.getByText('作为')).toBeVisible()`（UserStory）

---

### E1-U4 详细说明

**文件变更**: `components/dds/DDSFlow.tsx` (扩展), `stores/dds/DDSCanvasStore.ts` (E1-4)

**实现步骤**:
1. 单章节内使用 React Flow 的 nodes/edges
2. 节点为卡片组件（使用 CardRenderer）
3. 边的增删通过 React Flow 的 `onConnect`/`onEdgesChange`
4. Store 维护单章节内的 edges

**Patterns to follow**: 参考 `components/dds/DDSFlow.tsx` 的现有实现

**Test scenarios**:
- Happy path: 在两个卡片之间创建边，edgeCount +1
- Happy path: 删除边，edgeCount -1
- Happy path: 拖动节点，位置更新并持久化

**Verification**: `expect(flowCanvas.nodes.length).toBeGreaterThan(0)`

---

### E1-U5 详细说明

**文件变更**: `services/dds/ddsPersistence.ts` (新建), `stores/dds/DDSCanvasStore.ts` (E1-5)

**实现步骤**:
1. D1 migration: 创建 `dds_chapters`/`dds_cards`/`dds_edges` 表（参考 architecture.md §4.2）
2. 实现 `ddsPersistence.getCards(chapter)` / `saveCard(card)` / `deleteCard(cardId)`
3. Store 的 addCard/updateCard/deleteCard 调用 persistence 层
4. 页面加载时从 D1 读取数据到 store（乐观更新）

**Patterns to follow**: 参考 `services/dds/ddsPersistence.ts` 的现有 persistence 模式

**Test scenarios**:
- Happy path: 创建卡片 → D1 记录存在
- Happy path: 删除卡片 → D1 记录已删除
- Happy path: 刷新页面 → 卡片从 D1 恢复
- Error path: D1 写入失败 → 显示错误 Toast，store 回滚

**Verification**: `expect(refreshPage().queryByText(savedTitle)).toBeVisible()`

---

## E2: 横向滚奏体验

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | ✅ 横向滚奏 UI 实现 | ✅ | E1-U1 | DDSScrollContainer scroll-snap 横向滚奏，鼠标拖动切换章节 |
| E2-U2 | URL 章节同步实现 | ⬜ | E2-U1 | `?chapter=requirement` 参数同步当前章节，刷新保持 |
| E2-U3 | 工具栏章节指示实现 | ⬜ | E2-U1 | Toolbar 显示当前章节名称，点击快速跳转 |

### E2-U1 详细说明

**文件变更**: `components/dds/canvas/DDSScrollContainer.tsx` (扩展现有实现)

**实现步骤**:
1. 确保 CSS `scroll-snap-type: x mandatory`
2. 每个 chapter panel 设置 `scroll-snap-align: start`
3. 监听滚动事件（IntersectionObserver），更新 `activeChapter` state
4. 滚动阈值：面板超过 50% 可见时切换 activeChapter

**Patterns to follow**: 参考现有的 `DDSScrollContainer.tsx` 实现

**Test scenarios**:
- Happy path: 滚动到 context 面板，吸附到 context 章节
- Happy path: 滚动到 flow 面板，吸附到 flow 章节
- Edge path: 快速连续滚动，最后停在正确章节

**Verification**: `expect(scrollToChapter('context')).toChange(activeChapter, to('context'))`

---

### E2-U2 详细说明

**文件变更**: `components/dds/DDSCanvasPage.tsx` (扩展), `app/design/dds-canvas/page.tsx` (扩展)

**实现步骤**:
1. `useSearchParams` 读取 `chapter` 参数
2. 滚动/章节变化时更新 URL（`router.replace`）
3. 页面加载时读取 URL 参数，同步 `activeChapter`

**Patterns to follow**: 参考 Next.js App Router 的 `useSearchParams` 模式

**Test scenarios**:
- Happy path: 访问 `?chapter=context`，当前章节为 context
- Happy path: 滚动到 flow，URL 更新为 `?chapter=flow`
- Happy path: 刷新页面，章节保持不变

**Verification**: `expect(window.location.search).toContain('chapter=requirement')`

---

### E2-U3 详细说明

**文件变更**: `components/dds/toolbar/DDSToolbar.tsx` (扩展)

**实现步骤**:
1. Toolbar 添加章节标签行：`需求 | 上下文 | 流程`
2. 当前章节高亮（加粗/下划线）
3. 点击标签，滚动到对应章节面板

**Patterns to follow**: 参考 `components/dds/toolbar/DDSToolbar.tsx` 现有实现

**Test scenarios**:
- Happy path: Toolbar 显示当前章节名称
- Happy path: 点击"上下文"，章节切换到 context

**Verification**: `expect(toolbarChapterLabel.textContent).toBe('需求')`

---

## E3: AI 草稿生成

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | ✅ AI 草稿入口实现 | ✅ | E2-U3 | Toolbar "AI 草稿"按钮打开 AIDraftDrawer |
| E3-U2 | AI 生成流程实现 | ✅ | E3-U1 | 输入提示词 → AI 返回卡片 JSON → 预览编辑 → 确认写入 |
| E3-U3 | AI 对话历史实现 | ✅ | E3-U2 | 抽屉内保存对话历史，支持上下文续写 |
| E3-U4 | AI 生成边预览实现 | ⬜ | E3-U2 | AI 返回内容含边信息，用户可选择是否创建边 |

### E3-U1 详细说明

**文件变更**: `components/dds/toolbar/DDSToolbar.tsx` (E3-1), `components/dds/ai-draft/AIDraftDrawer.tsx` (已有，验证)

**实现步骤**:
1. Toolbar 添加"AI 草稿"按钮（图标 + 文案）
2. 按钮绑定 `onClick` → `store.toggleDrawer(true)`
3. 验证 `AIDraftDrawer` 在 drawer 打开时正确渲染

**Patterns to follow**: 参考现有的 toolbar 按钮模式

**Test scenarios**:
- Happy path: 点击"AI 草稿"按钮，AIDraftDrawer 打开
- Edge path: 抽屉已打开时再次点击无效果

**Verification**: `expect(clickAIGenerate()).toOpenDrawer()`

---

### E3-U2 详细说明

**文件变更**: `components/dds/ai-draft/AIDraftDrawer.tsx` (扩展), `components/dds/ai-draft/CardPreview.tsx` (扩展)

**实现步骤**:
1. 输入框接收提示词
2. 调用 `useDDSAPI().generateDraft(projectId, chapter, prompt)`
3. AI 返回卡片 JSON → 显示在 CardPreview 组件
4. 用户可在 CardPreview 内编辑
5. 点击"确认" → 调用 `store.addCard()` 写入

**Patterns to follow**: 参考 `components/dds/ai-draft/AIDraftDrawer.tsx` 和 `components/dds/ai-draft/CardPreview.tsx` 现有实现

**Test scenarios**:
- Happy path: 输入"用户登录"，AI 返回 UserStory JSON
- Happy path: 点击"确认"，卡片写入当前章节
- Edge path: AI 返回空结果，显示"未生成卡片"提示
- Error path: AI 调用失败，显示错误提示

**Verification**: `expect(confirmDraft()).toAddCard(expect.objectContaining({ type: 'user-story' }))`

---

### E3-U3 详细说明

**文件变更**: `stores/dds/DDSCanvasStore.ts` (E3-3), `components/dds/ai-draft/AIDraftDrawer.tsx` (E3-3)

**实现步骤**:
1. Store 的 `chatHistory` 数组保存每次 AI 对话
2. 对话历史格式：`{ role: 'user'|'assistant', content: string, cards?: DDSCard[] }`
3. 下次对话时将 `chatHistory` 作为 context 传给 AI API
4. AIDraftDrawer 渲染历史消息列表

**Patterns to follow**: 参考现有的 `chatHistory` 状态管理

**Test scenarios**:
- Happy path: 生成两次草稿，chatHistory.length === 2
- Happy path: 刷新抽屉，历史清空（新会话）

**Verification**: `expect(drawerChatHistory.length).toBeGreaterThan(0)`

---

### E3-U4 详细说明

**文件变更**: `components/dds/ai-draft/AIDraftDrawer.tsx` (E3-4), `components/dds/ai-draft/CardPreview.tsx` (E3-4)

**实现步骤**:
1. AI 返回的 `AIGenerateResponse` 包含 `edges` 字段
2. CardPreview 渲染建议边（虚线预览）
3. 用户可选择接受或拒绝建议的边
4. 接受的边调用 `store.addEdge()`

**Patterns to follow**: 参考 React Flow 的边预览模式

**Test scenarios**:
- Happy path: AI 返回建议边，显示在卡片之间
- Happy path: 接受建议边，边写入 chapter

**Verification**: `expect(previewEdges).toBeVisible()`

---

## E4: 章节间 DAG 关系

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | 跨章节边创建实现 | ✅ | E1-U4 | 支持在不同章节的卡片之间创建边 |
| E4-U2 | 跨章节边渲染实现 | ✅ | E4-U1 | React Flow 正确渲染跨章节边 |

### E4-U1 详细说明

**文件变更**: `components/dds/DDSFlow.tsx` (E4-1), `stores/dds/DDSCanvasStore.ts` (E4-1)

**实现步骤**:
1. 边的 `sourceChapter`/`targetChapter` 允许跨章节
2. 点击卡片 → 进入跨章节边创建模式（source 选中高亮）
3. 点击另一个章节的目标卡片 → 创建边
4. 边的数据包含 sourceChapter/targetChapter

**Patterns to follow**: 参考 React Flow 的自定义连接线模式

**Test scenarios**:
- Happy path: 从 requirement 卡片创建边到 context 卡片
- Edge path: 尝试创建循环（flow → context）→ 允许（PRD 无禁止）

**Verification**: `expect(createEdge(cardA, cardC)).toRenderEdge()`

---

### E4-U2 详细说明

**文件变更**: `components/dds/DDSFlow.tsx` (E4-2)

**实现步骤**:
1. 跨章节边使用特殊样式（虚线/不同颜色）
2. React Flow 使用全局节点池（包含所有章节的卡片节点）
3. `fitView()` 时考虑跨章节边的端点位置
4. 拖动节点时，跨章节边实时更新

**Patterns to follow**: 参考 React Flow 的 `useNodesState`/`useEdgesState` 跨画布共享模式

**Test scenarios**:
- Happy path: 跨章节边正确渲染（从 context 章节卡片到 flow 章节卡片）
- Happy path: 拖动节点，跨章节边同步更新
- Edge path: 删除源卡片，跨章节边一并删除

**Verification**: `expect(edge.target).toBe(cardCId)`

---

## E5: 状态与错误处理

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | 骨架屏加载态实现 | ✅ | E1-U1 | 加载时显示 shimmer skeleton cards，禁止 loading spinner |
| E5-U2 | 空状态引导实现 | ✅ | E1-U2 | 每章节空状态显示引导插图+文案 |
| E5-U3 | 错误态覆盖实现 | ✅ | E1-U5 | 章节级错误态：error message + 重试按钮，loadChapter 重新加载 |

### E5-U1 详细说明

**文件变更**: `components/dds/ChapterPanel.tsx` (E5-1), `components/dds/skeleton/ChapterSkeleton.tsx` (新建)

**实现步骤**:
1. 新建 `ChapterSkeleton` 组件：3 个面板形状骨架
2. ChapterPanel 在 `loading=true` 时显示 ChapterSkeleton
3. 禁止使用 `loading spinner`

**Patterns to follow**: 参考其他页面的 skeleton 实现（如 `app/prototype/loading.tsx`）

**Test scenarios**:
- Happy path: 页面加载中显示 3 个骨架面板
- Happy path: 加载完成骨架消失
- Edge path: 骨架屏闪烁（加载极快）→ 200ms debounce

**Verification**: `expect(document.querySelectorAll('.skeleton-panel').length).toBe(3)`

---

### E5-U2 详细说明

**文件变更**: `components/dds/ChapterPanel.tsx` (E5-2)

**实现步骤**:
1. ChapterPanel 在 `cards.length === 0` 时显示空状态
2. 每个章节的空状态文案不同：
   - requirement: "添加你的第一个用户故事"
   - context: "建立你的第一个限界上下文"
   - flow: "描绘你的第一个领域流程"
3. 空状态包含引导插图（使用 emoji 或 SVG 占位）

**Patterns to follow**: 参考 `components/dds/cards/index.ts` 的现有空状态模式

**Test scenarios**:
- Happy path: 空 requirement 章节显示"添加你的第一个用户故事"
- Happy path: 空 context 章节显示"建立你的第一个限界上下文"
- Happy path: 空 flow 章节显示"描绘你的第一个领域流程"

**Verification**: `expect(screen.getByText(/添加你的第一个用户故事/)).toBeVisible()`

---

### E5-U3 详细说明

**文件变更**: `components/dds/DDSCanvasPage.tsx` (E5-3), `services/dds/ddsPersistence.ts` (E5-3)

**实现步骤**:
1. 4 类错误态兜底：
   - **网络异常**: `navigator.onLine === false` → Toast + 重试按钮
   - **权限不足**: API 403 → 提示"您没有此项目的编辑权限" + 联系管理员链接
   - **数据超长**: 卡片内容 > 10KB → 显示"展开查看全部"
   - **接口超时**: API 5xx/timeout → Toast + 重试按钮
2. 使用 React ErrorBoundary 兜底组件崩溃

**Patterns to follow**: 参考现有的 error handling 模式

**Test scenarios**:
- Happy path: 断网时显示"网络连接失败，请检查网络后重试"
- Happy path: 403 时显示"您没有此项目的编辑权限"
- Happy path: 数据超长时显示"展开查看全部"
- Happy path: 超时时显示"请求超时，请稍后重试"

**Verification**: `expect(screen.getByText(/网络连接失败/)).toBeVisible()`

---

## 风险与依赖

| 风险 | 缓解 |
|------|------|
| D1 migration 失败 | 先在 staging 验证，有 rollback 脚本 |
| AI API 响应慢 | 流式输出 + skeleton 骨架屏 |
| 跨章节边与 ScrollSnap 冲突 | 跨章节边使用 overlay 层，独立于滚动 |
| 卡片 schema 扩展字段不足 | MVP 使用基础字段，快速迭代 |
| **跨章节边删除一致性** | 删除边时必须遍历所有章节删除副本；删除卡片时同步删除关联边 |

## 技术审查发现

### Critical Issues（已处理）
1. **跨章节边存储一致性**：跨章节边在两端章节各存一份副本，E1-U2 deleteCard 和 E4-U1 addEdge 必须正确处理两端副本
2. **乐观更新 + D1 失败回滚**：E1-U5 实现时必须先更新 store，失败时回滚
3. **AI 边预览边界**：AI 建议边在 AIDraftDrawer 内预览，不经过 React Flow，确认后才写入 store

### 🟡 Design Notes
1. **骨架屏归属**：ChapterPanel 订阅 `chapters[chapter].loading`，loading 状态由 store 管理
2. **跨章节边渲染**：React Flow 全局实例，跨章节边通过颜色区分（`strokeDasharray` 虚线）
3. **D1 migration 依赖**：E1-U5 依赖 E5-U1，但可使用 mock D1 分阶段验证

**依赖链**:
- E1-U1 → E1-U2 → E1-U3 → E1-U4 → E1-U5
- E2-U1 → E2-U2 → E2-U3
- E3-U1 → E3-U2 → E3-U3, E3-U4
- E4-U1 → E4-U2（依赖 E1-U4）
- E5-U1 → E5-U2 → E5-U3（独立于 E1，可并行）
