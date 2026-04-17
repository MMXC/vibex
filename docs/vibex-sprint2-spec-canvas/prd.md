# PRD — vibex-sprint2-spec-canvas

**项目**: vibex-sprint2-spec-canvas
**角色**: PM
**日期**: 2026-04-17
**主题**: Spec Canvas — 详细设计规范画布（多章节卡片 + 横向滚奏 + AI 草稿）
**状态**: 进行中

---

## 执行摘要

### 背景

VibeX 的详细设计规范（Spec）目前以离散文件形式存在：需求文档、上下文分析、流程设计分散在各处，缺乏结构化管理。用户（PM/架构师/全栈工程师）在管理设计文档时无法快速定位、关联和迭代。

Sprint 1 构建了 Prototype Canvas（可交互 UI 原型），Sprint 2 需要构建 Spec Canvas——服务于工程设计文档的结构化画布。

### 目标

构建 Spec Canvas，实现：3 章节固定结构（需求/上下文/流程）、横向滚奏切换、卡片 CRUD、AI 辅助生成、工程级持久化。

### 成功指标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| 章节加载成功率 | ≥ 99% | 监控 D1 query 成功率 |
| 卡片保存成功率 | ≥ 99% | API response success 统计 |
| AI 草稿采纳率 | ≥ 60% | drawer confirm 次数 / 生成次数 |
| 章节切换响应时间 | ≤ 300ms | Performance API 测量 |
| 跨章节边创建成功率 | 100% | UI 操作后 edge 正确渲染 |

---

## Epic 拆分

### Epic 1: 三章节卡片管理

**问题域**: 用户需要一个结构化的设计文档空间，按领域分区管理不同类型的卡片。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| S1.1 | 固定三章节结构 | 页面加载后显示 requirement/context/flow 三个固定章节面板 | 0.5h | `expect(screen.getByText('需求')).toBeVisible()` |
| S1.2 | 章节卡片 CRUD | 每个章节内支持添加/编辑/删除卡片，类型与章节绑定 | 3h | `expect(addCard()).toChange(cardCount, by(1))` |
| S1.3 | 卡片 Schema 渲染 | 根据类型渲染对应字段（UserStory: role/action/benefit；BC: name/desc/resp；FlowStep: stepName/actor/pre） | 2h | `expect(renderCard({type:'user-story'}).queryByText('作为')).toBeVisible()` |
| S1.4 | 章节内 DAG | 单章节内 React Flow 渲染节点和边，支持拖拽、边增删 | 1.5h | `expect(flowCanvas.nodes.length).toBeGreaterThan(0)` |
| S1.5 | 卡片 D1 持久化 | 卡片增删改同步写入 D1（dds_cards/dds_chapters 表） | 2h | `expect(refreshPage().queryByText(savedTitle)).toBeVisible()` |

**Epic 1 工时小计: 9h**

### Epic 2: 横向滚奏体验

**问题域**: 用户需要在多个章节间快速切换，但不想被导航菜单打断工作流。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| S2.1 | 横向滚奏 UI | DDSScrollContainer 实现 scroll-snap，鼠标拖动切换章节 | 1h | `expect(scrollBy(200)).toChange(activeChapter, to('context'))` |
| S2.2 | URL 章节同步 | `?chapter=requirement` 参数同步当前章节，刷新保持 | 0.5h | `expect(new URL('?chapter=context').pathname).toContainChapter('context')` |
| S2.3 | 工具栏章节指示 | Toolbar 显示当前章节名称，点击快速跳转 | 0.5h | `expect(toolbarChapterLabel.textContent).toBe('需求')` |

**Epic 2 工时小计: 2h**

### Epic 3: AI 草稿生成

**问题域**: 用户在手动编写卡片时效率低，AI 可以辅助生成初稿，用户确认后采纳。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| S3.1 | AI 草稿入口 | 工具栏"AI 草稿"按钮打开 AIDraftDrawer | 0.5h | `expect(clickAIGenerate()).toOpenDrawer()` |
| S3.2 | AI 生成流程 | 输入提示词 → AI 返回卡片 JSON → 预览编辑 → 确认写入 | 2h | `expect(confirmDraft()).toAddCard(expectedCard)` |
| S3.3 | AI 对话历史 | 抽屉内保存对话历史，支持上下文续写 | 1h | `expect(drawerChatHistory.length).toBeGreaterThan(0)` |
| S3.4 | AI 生成边预览 | AI 返回内容含边信息，用户可选择是否创建边 | 1h | `expect(previewEdges).toBeVisible()` |

**Epic 3 工时小计: 4.5h**

### Epic 4: 章节间 DAG 关系

**问题域**: 设计文档之间存在跨章节依赖（需求 → 上下文 → 流程），需要可视化关联。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| S4.1 | 跨章节边创建 | 支持在不同章节的卡片之间创建边 | 2h | `expect(createEdge(cardA, cardC)).toRenderEdge()` |
| S4.2 | 跨章节边渲染 | React Flow 正确渲染跨章节边（包括拖动更新位置） | 1h | `expect(edge.target).toBe(cardCId)` |

**Epic 4 工时小计: 3h**

### Epic 5: 状态与错误处理

**问题域**: 用户在加载慢、网络异常、内容超长等边界情况下需要清晰的引导和兜底。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| S5.1 | 骨架屏加载态 | 加载时显示 3 个章节骨架屏，禁止使用 loading spinner | 1h | `expect(skeletonPanels.length).toBe(3)` |
| S5.2 | 空状态引导 | 每章节空状态显示引导插图+文案，禁止留白 | 1h | `expect(emptyState.getByText(/添加你的第一个/)).toBeVisible()` |
| S5.3 | 错误态覆盖 | 覆盖 4 类错误：网络异常/权限不足/数据超长/接口超时 | 1h | `expect(errorToast).toBeVisibleFor('网络连接失败，请检查网络后重试')` |

**Epic 5 工时小计: 3h**

### Epic 6: 测试覆盖

**问题域**: 确保核心逻辑（Store/组件）在重构后仍可靠。

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| S6.1 | 单元测试 | DDSCanvasStore/DDSScrollContainer/卡片渲染核心逻辑测试覆盖 | 1h | `expect(store.setActiveChapter).toBeDefined()` |

**Epic 6 工时小计: 1h**

---

## 2a. 本质需求穿透（神技1）

### Epic 1 — 三章节卡片管理

**用户底层动机**: 用户不是在"管理卡片"，而是在"构建一份完整的设计规范文档"，需要结构清晰、修改高效、关联明确。

**去掉现有方案的理想解法**: 理想上，用户打开一个画布，看到 3 个分区，直接在里面写东西——不需要切换文件、不需要记住哪些内容在哪个文档里。像 Notion 的 Database 页面，但专为工程设计而生。

**解决的本质问题**: 信息分散导致的查找成本高、修改时上下文丢失、跨文档关联困难。

### Epic 2 — 横向滚奏体验

**用户底层动机**: 用户在阅读文档时是线性思路，从需求→上下文→流程是自然顺序，不应被导航打断。

**去掉现有方案的理想解法**: 像翻阅一本精装书，左右滑动就切换章节，不需要点击菜单，不需要加载新页面。

**解决的本质问题**: 减少任务切换摩擦，保持心流。

### Epic 3 — AI 草稿生成

**用户底层动机**: 用户知道要表达什么，但打字慢、结构化输出费时间。AI 可以把"脑子里的想法"快速变成"格式正确的卡片"。

**去掉现有方案的理想解法**: 用户说一句话，AI 生成完整卡片，用户修改确认。像 dictation 但生成结构化内容。

**解决的本质问题**: 降低结构化文档的写作门槛。

### Epic 4 — 章节间 DAG 关系

**用户底层动机**: 用户需要看到"需求"如何落地到"上下文"，"上下文"如何驱动"流程"——这是架构设计的核心逻辑。

**去掉现有方案的理想解法**: 画布上直接连线，看到箭头就知道依赖关系，不需要额外文档描述。

**解决的本质问题**: 可视化设计决策的逻辑链。

### Epic 5 — 状态与错误处理

**用户底层动机**: 用户在任何异常情况下都不应感到"系统坏了"，而应知道"发生了什么，我能做什么"。

**去掉现有方案的理想解法**: 系统在任何状态下都有明确反馈——加载时给骨架、空白时给引导、错误时给出路。

**解决的本质问题**: 降低焦虑，建立信任。

---

## 2b. 最小可行范围（神技2）

### Epic 1 — 三章节卡片管理

| 范围 | 内容 |
|------|------|
| **本期必做** | 固定 3 章节 + 基础卡片 CRUD + D1 持久化 |
| **本期不做** | 卡片模板库（预设模板快速创建）、卡片批量操作、卡片版本历史 |
| **暂缓** | 卡片评论/讨论功能、卡片标签/筛选高级搜索 |

### Epic 2 — 横向滚奏体验

| 范围 | 内容 |
|------|------|
| **本期必做** | 基础 scroll-snap 横向滚奏 + URL 同步 + Toolbar 章节指示 |
| **本期不做** | 手势滑动优化（移动端 pinch-to-zoom）、章节折叠动画 |
| **暂缓** | 章节顺序自定义、章节间 drag-to-reorder |

### Epic 3 — AI 草稿生成

| 范围 | 内容 |
|------|------|
| **本期必做** | 单次 AI 生成 → 卡片确认写入 + 对话历史（单会话） |
| **本期不做** | 多轮对话修改已生成卡片、生成内容版本对比、AI 批量生成多个卡片 |
| **暂缓** | AI 建议卡片关系、AI 发现需求缺口提示 |

### Epic 4 — 章节间 DAG 关系

| 范围 | 内容 |
|------|------|
| **本期必做** | 跨章节边创建 + 渲染（单条边手动创建） |
| **本期不做** | AI 自动推导跨章节关系、边的样式差异化（颜色/类型区分） |
| **暂缓** | 跨章节 DAG 全局视图、边批量管理 |

### Epic 5 — 状态与错误处理

| 范围 | 内容 |
|------|------|
| **本期必做** | 骨架屏 + 空状态引导 + 4 类错误态覆盖 |
| **本期不做** | 错误自动重试策略、网络恢复自动刷新 |
| **暂缓** | 错误上报日志面板 |

---

## 2c. 用户情绪地图（神技3）

### 页面: /design/dds-canvas?projectId=X

#### 进入情绪

用户带着明确目标进入页面："我要更新某个需求的用户故事"或"我要检查上下文依赖关系"。期待：页面快速加载、看到熟悉的 3 章节布局、知道自己在哪里。

**进入时的引导**:
- 首次进入：3 个章节面板依次展开，需求章节默认展开
- 非首次进入：恢复上次章节位置（URL 参数）

#### 迷路引导

**场景 1**: 用户不知道当前在哪个章节
- 兜底：Toolbar 章节标签高亮当前章节，滚动时标签同步更新
- 兜底：章节面板顶部有固定标题标签（"需求"/"上下文"/"流程"）

**场景 2**: 用户不知道如何添加卡片
- 兜底：空状态时显示"+"按钮引导 + 快捷键提示（按 N 新建）

**场景 3**: 用户找不到 AI 草稿入口
- 兜底：Toolbar 显眼位置有"AI 草稿"按钮，hover 显示 tooltip

#### 出错兜底

**网络异常**:
- 表现：Toast 提示"网络连接失败，请检查网络后重试"
- 操作：显示重试按钮，点击重新加载

**权限不足**:
- 表现：提示"您没有此项目的编辑权限"
- 操作：显示"联系项目管理员"链接

**数据超长**:
- 表现：卡片内容截断，显示"展开查看全部"
- 操作：点击展开完整内容

**接口超时**:
- 表现：Toast 提示"请求超时，请稍后重试"
- 操作：自动重试 1 次，超过则显示重试按钮

---

## 验收标准

### S1.1 固定三章节结构
```typescript
expect(document.querySelector('[data-chapter="requirement"]')).toBeVisible();
expect(document.querySelector('[data-chapter="context"]')).toBeVisible();
expect(document.querySelector('[data-chapter="flow"]')).toBeVisible();
expect(document.querySelectorAll('.chapter-panel').length).toBe(3);
```

### S1.2 章节卡片 CRUD
```typescript
// 添加卡片
expect(clickAddCard('requirement')).toChange(cardCount('requirement'), by(1));
expect(getCard('requirement', 0).type).toBe('user-story');

// 编辑卡片
expect(editCard(cardId, { title: 'new title' }).title).toBe('new title');

// 删除卡片
expect(clickDeleteCard(cardId)).toChange(cardCount('requirement'), by(-1));
expect(getCard(cardId)).toBeNull();
```

### S1.3 卡片 Schema 渲染
```typescript
// UserStory 类型卡片
expect(screen.getByText('作为')).toBeVisible();
expect(screen.getByText('我想要')).toBeVisible();
expect(screen.getByText('以便于')).toBeVisible();

// BoundedContext 类型卡片
expect(screen.getByText('上下文名称')).toBeVisible();
expect(screen.getByText('职责描述')).toBeVisible();

// FlowStep 类型卡片
expect(screen.getByText('步骤名称')).toBeVisible();
expect(screen.getByText('前置条件')).toBeVisible();
```

### S1.4 章节内 DAG
```typescript
expect(flowCanvas.nodes.length).toBeGreaterThan(0);
// 拖拽节点后位置更新
expect(dragNode(cardId, { x: 100, y: 200 }).position).toEqual({ x: 100, y: 200 });
// 创建边
expect(connectNodes(sourceId, targetId).edgeCount).toBeGreaterThan(0);
```

### S1.5 卡片 D1 持久化
```typescript
// 保存后刷新
const cards = await api.getCards(chapterId);
expect(cards.find(c => c.id === savedCardId)).toBeDefined();
expect(cards.find(c => c.id === savedCardId).title).toBe(savedTitle);
```

### S2.1 横向滚奏 UI
```typescript
// 滚动到 context 章节
expect(scrollToChapter('context')).toChange(activeChapter, to('context'));
expect(panelWidth('context')).toBeGreaterThan(panelWidth('requirement'));
```

### S2.2 URL 章节同步
```typescript
expect(window.location.search).toContain('chapter=requirement');
// 手动改 URL 参数
window.location.href = '?chapter=context';
expect(activeChapter).toBe('context');
```

### S2.3 工具栏章节指示
```typescript
expect(toolbarChapterLabel.textContent).toBe('需求');
expect(clickChapterTab('context')).toChange(activeChapter, to('context'));
```

### S3.1 AI 草稿入口
```typescript
expect(clickAIGenerate()).toDispatchEvent('drawer:open');
expect(AIDraftDrawer).toBeVisible();
```

### S3.2 AI 生成流程
```typescript
expect(fillPrompt('帮我写一个用户登录的用户故事')).toBeDefined();
expect(clickConfirm()).toAddCard(expect.objectContaining({ type: 'user-story' }));
```

### S4.1 跨章节边创建
```typescript
// 从 requirement 章节的卡片连接到 context 章节的卡片
expect(connectCrossChapter(sourceId, targetId)).toRenderEdge(expect.objectContaining({
  source: sourceId,
  target: targetId,
}));
```

### S5.1 骨架屏加载态
```typescript
expect(document.querySelector('[data-testid="dds-skeleton"]')).toBeVisible();
expect(document.querySelectorAll('.skeleton-panel').length).toBe(3);
expect(document.querySelector('.loading-spinner')).toBeNull();
```

### S5.2 空状态引导
```typescript
expect(screen.getByText(/添加你的第一个用户故事/)).toBeVisible();
expect(document.querySelector('[data-testid="empty-state-illustration"]')).toBeVisible();
expect(screen.getByText(/添加你的第一个限界上下文/)).toBeVisible();
expect(screen.getByText(/描绘你的第一个领域流程/)).toBeVisible();
```

### S5.3 错误态覆盖
```typescript
// 网络异常
expect(screen.getByText(/网络连接失败/)).toBeVisible();
expect(screen.getByRole('button', { name: '重试' })).toBeVisible();

// 权限不足
expect(screen.getByText(/没有编辑权限/)).toBeVisible();

// 数据超长
expect(screen.getByText(/展开查看全部/)).toBeVisible();

// 接口超时
expect(screen.getByText(/请求超时/)).toBeVisible();
```

### S6.1 单元测试
```typescript
expect(testStore.setActiveChapter).toBeDefined();
expect(testStore.addCard).toBeDefined();
expect(testStore.selectCard).toBeDefined();
```

---

## DoD (Definition of Done)

### 功能完成标准

1. **代码层面**
   - 所有验收标准中的 `expect()` 条目已通过测试
   - 无 TypeScript 编译错误
   - 代码通过 ESLint / Prettier 检查

2. **API 层面**
   - 卡片 CRUD API 在 staging 通过集成测试
   - D1 migration 在 staging 通过，rollback 脚本可用

3. **UI/UX 层面**
   - 页面加载时间 ≤ 2s（p95）
   - 章节切换响应时间 ≤ 300ms
   - 骨架屏/空状态/错误态截图已由 PM 确认

4. **文档层面**
   - README.md 已更新（组件说明、API 契约）
   - Spec Canvas 页面在设计系统中已归档

5. **发布层面**
   - Canary 部署通过 QA 验收
   - 无 P0/P1 bug 待处理

---

## 依赖关系

```
Epic 1 (三章节卡片管理)
├── S1.5 (D1 持久化) ← 依赖 D1 migration 就绪
└── S1.3 (Schema 渲染) ← 依赖 types/dds/index.ts schema 定义

Epic 3 (AI 草稿生成)
├── S3.2 (生成流程) ← 依赖 useDDSAPI hook 与 AI API 集成验证
└── S3.4 (边预览) ← 依赖 S1.4 (DAG 基础)

Epic 4 (跨章节 DAG)
└── 依赖 Epic 1 完全交付（卡片基础数据就绪）

Epic 2 (横向滚奏) 和 Epic 5 (状态处理)
└── 无外部依赖，可先行
```

---

*PM Agent | 2026-04-17*
