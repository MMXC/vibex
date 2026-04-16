# Implementation Plan: VibeX DDS Canvas Sprint 2

> **项目**: vibex-dds-canvas-s2
> **日期**: 2026-04-16
> **总工时**: ~18h
> **核心交付**: E2-E6 实现，后端 CRUD 打通

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

---

## 0. Unit Index（顶层索引）

| Epic | Units | 状态 | Next |
|------|-------|------|------|
| E2: 奏折布局 + ReactFlow | E2-U1 ~ E2-U3 | ⬜ | E2-U1 |
| E3: 三章节画布集成 | E3-U1 | ⬜ | E3-U1 |
| E4: 工具栏完善 | E4-U1 | ⬜ | E4-U1 |
| E5: AI 对话集成 | E5-U1 ~ E5-U2 | ⬜ | E5-U1 |
| E6: 数据持久化 | E6-U1 ~ E6-U4 | ⬜ | E6-U1 |

**关键路径**: E6-U1（后端 CRUD）→ E2-U2（API 集成）→ E5-U1（LLM 集成）→ E5-U2（全链路）

---

## 1. Epic E2: 奏折布局 + ReactFlow

### E2-U1: ScrollContainer 完善

| ID | E2-U1 |
|------|-------|
| **名称** | ScrollContainer 完善（fullscreen + URL sync） |
| **依赖** | — |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/components/dds/canvas/DDSScrollContainer.tsx`（已有，完善）
- `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`（新建 URL sync）

**验收标准**:
- E2-U1-AC1: 工具栏"全屏推开"横铺整个视口，body scroll 禁用
- E2-U1-AC2: 章节切换时 URL `?chapter=requirement` 参数同步更新
- E2-U1-AC3: 页面刷新后根据 URL 参数恢复展开章节
- E2-U1-AC4: 收起面板 hover 展开到 100px

**实现步骤**:
1. 读取现有 `DDSScrollContainer.tsx`（227行）
2. 添加 `isFullscreen` prop，控制 CSS class
3. 在 `DDSCanvasPage.tsx` 中使用 `useSearchParams` 监听/更新 chapter 参数
4. `toggleFullscreen` → `document.body.style.overflow = 'hidden'`
5. 添加 `data-chapter={chapter}` 属性便于 Playwright 定位

---

### E2-U2: ReactFlow viewport 持久化

| ID | E2-U2 |
|------|-------|
| **名称** | viewport localStorage 持久化 + @xyflow v12 检查 |
| **依赖** | E2-U1 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/stores/dds/DDSCanvasStore.ts`（已有，完善）
- `vibex-fronted/src/hooks/dds/useDDSCanvasFlow.ts`（已有）

**验收标准**:
- E2-U2-AC1: 拖拽/缩放 ReactFlow → localStorage 保存 viewport
- E2-U2-AC2: 刷新页面 → viewport 从 localStorage 恢复
- E2-U2-AC3: 不同 projectId 的 viewport 独立存储

**实现步骤**:
1. 在 `DDSCanvasStoreState` 添加 `viewport: { x: number; y: number; zoom: number }`
2. `DDSCanvasStore.ts` 添加 `setViewport` action
3. 在 `DDSCanvasPage.tsx` 的 `useReactFlow()` 实例上监听 `onMoveEnd`，同步到 store
4. `useEffect` 将 viewport 序列化到 `localStorage['dds-viewport-${projectId}']`
5. 初始化时从 localStorage 读取，调用 `setViewport`

---

### E2-U3: @xyflow v12 类型检查

| ID | E2-U3 |
|------|-------|
| **名称** | @xyflow/react v12 类型全面检查 |
| **依赖** | — |
| **工时** | 0.5h |
| **优先级** | P1 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/components/dds/DDSFlow.tsx`
- `vibex-fronted/src/hooks/dds/useDDSCanvasFlow.ts`

**验收标准**:
- E2-U3-AC1: `npx tsc --noEmit` 在 vibex-fronted 无类型错误
- E2-U3-AC2: `ReactFlowProvider` 正确包裹 DDSFlow

**实现步骤**:
1. `npx tsc --noEmit` 扫描组件文件
2. 如有类型错误，按错误信息修正（常见 v12 变更：Node/Edge 类型签名变化）
3. 确认 `ReactFlowProvider` 在 `DDSCanvasPage.tsx` 级别包裹

---

## 2. Epic E3: 三章节画布集成

### E3-U1: DDSCanvasPage 与后端集成

| ID | E3-U1 |
|------|-------|
| **名称** | DDSCanvasPage 主页面集成 |
| **依赖** | E6-U1（后端 CRUD 完成）|
| **工时** | 1.5h |
| **优先级** | P1 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`（已有，完善）
- `vibex-fronted/src/hooks/dds/useDDSAPI.ts`（已有，完善实现）

**验收标准**:
- E3-U1-AC1: 页面加载时 `loadChapter()` 从 API 获取卡片，渲染到 ReactFlow
- E3-U1-AC2: 三种章节（requirement/context/flow）各自渲染对应卡片类型
- E3-U1-AC3: 创建卡片后立即出现在画布（乐观 UI）

**实现步骤**:
1. 完善 `DDSCanvasPage.tsx`:
   - 挂载时调用 `useDDSAPI().getChapters(projectId)` 获取 chapter IDs
   - 对每个 chapter 调用 `loadChapter(chapterType)` → store → RF
2. 完善 `useDDSAPI.ts` 中的 `createCard/updateCard/deleteCard` 实现：
   - 替换 TODO placeholder 为真实 fetch 调用
   - 错误时调用 store error 处理
3. 连接 `DDSToolbar` 的刷新按钮 → 重新调用 `loadChapter()`
4. Playwright 测试：创建卡片 → 刷新 → 卡片存在

---

## 3. Epic E4: 工具栏完善

### E4-U1: DDSToolbar handler 与 store 集成

| ID | E4-U1 |
|------|-------|
| **名称** | DDSToolbar 按钮 handler 实现 |
| **依赖** | E2-U1, E3-U1 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`（已有，完善）

**验收标准**:
- E4-U1-AC1: 点击"重新生成" → 触发 AI 重新生成当前章节（`isDrawerOpen=true`）
- E4-U1-AC2: 点击"全选" → 选中当前章节所有卡片节点
- E4-U1-AC3: 点击"下一步" → 跳转到下一个章节（`setActiveChapter`）
- E4-U1-AC4: 点击"全屏推开" → 触发 `toggleFullscreen`

**实现步骤**:
1. 读取现有 `DDSToolbar.tsx`，检查各按钮是否连接 store
2. 如未连接，添加:
   ```typescript
   const toggleDrawer = useDDSCanvasStore(s => s.toggleDrawer);
   const setActiveChapter = useDDSCanvasStore(s => s.setActiveChapter);
   const { nodes } = useDDSCanvasFlow(activeChapter);
   const toggleFullscreen = useDDSCanvasStore(s => s.toggleFullscreen);
   ```
3. "全选"按钮：遍历 nodes，调用 `selectCard(id)` for each
4. "下一步"按钮：按 `CHAPTER_ORDER` 数组顺序取下一个
5. 单元测试覆盖各按钮 handler

---

## 4. Epic E5: AI 对话集成

### E5-U1: LLM 集成 + chapter-specific prompts

| ID | E5-U1 |
|------|-------|
| **名称** | AI Draft LLM 调用 + prompt 模板 |
| **依赖** | E3-U1 |
| **工时** | 2h |
| **优先级** | P1 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/components/dds/ai-draft/AIDraftDrawer.tsx`（已有，完善）
- `vibex-fronted/src/components/dds/ai-draft/CardPreview.tsx`（已有）
- `vibex-fronted/src/services/dds/prompts.ts`（新建）

**验收标准**:
- E5-U1-AC1: 输入需求 → LLM 返回 JSON → `CardPreview` 展示
- E5-U1-AC2: 解析失败时显示错误提示，不 crash
- E5-U1-AC3: 三种 chapter type 生成不同结构卡片

**实现步骤**:
1. 创建 `src/services/dds/prompts.ts`（见 architecture.md §2.4）
2. 在 `AIDraftDrawer.tsx` 中:
   - 用户提交 → `setIsGenerating(true)`
   - 调用 LLM（复用 `llm-provider.ts`）传入 `buildCardGenerationPrompt(input, activeChapter)`
   - 解析 LLM 返回 JSON（`try/catch`）
   - 成功 → `setDraftCards(parsed.cards)`, `setIsGenerating(false)`
   - 失败 → 显示错误，reset 状态
3. `CardPreview` 组件接收 `draftCards[]` 渲染预览
4. 乐观 UI：用户"接受"后立即插入 store，再异步调用 API

---

### E5-U2: AI 卡片微调

| ID | E5-U2 |
|------|-------|
| **名称** | 勾选卡片 → AI 微调 |
| **依赖** | E5-U1, E4-U1 |
| **工时** | 1h |
| **优先级** | P2 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/components/dds/ai-draft/AIDraftDrawer.tsx`（完善）
- `vibex-fronted/src/services/dds/prompts.ts`（完善 refine prompt）

**验收标准**:
- E5-U2-AC1: 勾选画布上 1-N 张卡片 → 输入微调指令 → AI 返回修改预览
- E5-U2-AC2: "接受"后更新 store 中的卡片内容

**实现步骤**:
1. 添加 `buildCardRefinePrompt(selectedCards[], instruction)` 函数
2. 在 `AIDraftDrawer.tsx` 中:
   - 检测 `selectedCardIds.length > 0` 时，显示"微调"输入框
   - 用户输入指令 → 调用 LLM → 解析 diff → 预览
3. "接受"时遍历 diff，更新每张卡片的对应字段

---

## 5. Epic E6: 数据持久化

### E6-U1: Backend CRUD API

| ID | E6-U1 |
|------|-------|
| **名称** | Backend DDS CRUD 路由 |
| **依赖** | — |
| **工时** | 3h |
| **优先级** | P0 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-backend/src/routes/dds/chapters.ts`（新建）
- `vibex-backend/src/routes/dds/cards.ts`（新建）
- `vibex-backend/src/routes/dds/edges.ts`（新建）
- `vibex-backend/src/routes/dds/index.ts`（新建）
- `vibex-backend/src/index.ts`（注册路由）

**验收标准**:
- E6-U1-AC1: `GET /api/v1/dds/chapters/:id/cards` → 返回正确卡片数组
- E6-U1-AC2: `POST /api/v1/dds/chapters/:id/cards` → 创建卡片返回 201
- E6-U1-AC3: `PUT /api/v1/dds/cards/:cardId` → 更新卡片内容
- E6-U1-AC4: `DELETE /api/v1/dds/cards/:cardId` → 返回 204，卡片消失
- E6-U1-AC5: `PUT /api/v1/dds/cards/:cardId/position` → 更新 position_x/y
- E6-U1-AC6: `PUT /api/v1/dds/cards/:cardId/relations` → 插入 dds_edges

**实现步骤**:
1. 创建 `routes/dds/types.ts`（Request/Response 类型）
2. 创建 `routes/dds/chapters.ts`:
   - `GET /chapters` → SELECT dds_chapters WHERE project_id = ?
   - `POST /chapters` → INSERT dds_chapters
   - `GET /chapters/:id/cards` → SELECT dds_cards → rowToCard
   - `POST /chapters/:id/cards` → INSERT dds_cards
3. 创建 `routes/dds/cards.ts`:
   - `PUT /cards/:id` → UPDATE dds_cards SET title=?, data=?
   - `DELETE /cards/:id` → DELETE FROM dds_cards
   - `PUT /cards/:id/position` → UPDATE position_x, position_y
   - `PUT /cards/:id/relations` → DELETE + INSERT dds_edges
4. 创建 `routes/dds/edges.ts`:
   - `GET /chapters/:id/edges` → SELECT dds_edges
5. 创建 `routes/dds/index.ts` 合并路由
6. 在 `src/index.ts` 注册: `import dds from './routes/dds'; app.route('/api/v1/dds', dds)`
7. Vitest 单元测试覆盖各端点

---

### E6-U2: useDDSAPI 与后端对接

| ID | E6-U2 |
|------|-------|
| **名称** | useDDSAPI 实现完善 + 错误处理 |
| **依赖** | E6-U1 |
| **工时** | 1h |
| **优先级** | P0 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/hooks/dds/useDDSAPI.ts`（完善）

**验收标准**:
- E6-U2-AC1: `getCards(chapterId)` → DDSCard[] 正确返回
- E6-U2-AC2: API 错误时 store 显示 error 状态
- E6-U2-AC3: 网络超时 5s 后显示"请求超时"

**实现步骤**:
1. 替换 `useDDSAPI.ts` 中所有 TODO placeholder
2. 完善 `rowToCard` 解析逻辑（见 architecture.md §2.2）
3. API 错误时调用 store 的 error 处理
4. 验证所有端点的请求/响应类型

---

### E6-U3: Chapter 初始化 + 自动创建

| ID | E6-U3 |
|------|-------|
| **名称** | 项目首次打开时自动创建三个章节 |
| **依赖** | E6-U1 |
| **工时** | 0.5h |
| **优先级** | P1 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/hooks/dds/useDDSAPI.ts`（完善）
- `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`（完善）

**验收标准**:
- E6-U3-AC1: 首次打开新项目 → 自动创建 requirement/context/flow 三个章节
- E6-U3-AC2: 非首次打开 → 复用已有章节 ID

**实现步骤**:
1. `useDDSAPI.ts` 添加 `ensureChapters(projectId)` 函数：
   - `GET /api/v1/dds/chapters?projectId=xxx`
   - 如章节不足 3 个 → `POST` 批量创建
2. `DDSCanvasPage.tsx` 挂载时调用 `ensureChapters(projectId)`

---

### E6-U4: 刷新状态保持

| ID | E6-U4 |
|------|-------|
| **名称** | 刷新后卡片 + viewport 完整恢复 |
| **依赖** | E2-U2, E3-U1, E6-U2 |
| **工时** | 1h |
| **优先级** | P1 |
| **状态** | ⬜ 待开始 |

**文件变更**:
- `vibex-fronted/src/components/dds/DDSCanvasPage.tsx`

**验收标准**:
- E6-U4-AC1: 创建卡片 → 刷新页面 → 卡片仍然存在（API 持久化）
- E6-U4-AC2: 拖拽卡片 → 刷新 → 节点位置保持（position 持久化）
- E6-U4-AC3: 展开章节切换 → 刷新 → 保持同一章节展开（URL 参数）
- E6-U4-AC4: viewport 缩放/拖拽 → 刷新 → 保持同一视图（localStorage）

**实现步骤**:
1. 确保 E2-U2（viewport）、E3-U1（loadChapter）、URL sync 均完成
2. Playwright E2E 测试: `e2e/dds-persistence.spec.ts`:
   ```typescript
   test('刷新后卡片状态保持', async ({ page }) => {
     await page.goto(`/dds-canvas?projectId=xxx&chapter=requirement`);
     await page.waitForSelector('.react-flow__node');
     const nodeCount = await page.locator('.react-flow__node').count();
     await page.reload();
     await page.waitForSelector('.react-flow__node');
     expect(await page.locator('.react-flow__node').count()).toBe(nodeCount);
   });
   ```

---

## 6. 依赖图

```
E2-U1 (ScrollContainer完善)
  ↓
E2-U2 (viewport持久化)
  ↓
E2-U3 (v12类型检查)
      ↓
E6-U1 (Backend CRUD)  ←─────────────────┐  （关键路径，P0）
  ↓                                        │
E6-U2 (useDDSAPI对接)  ←───────────────────┤
  ↓                                        │
E3-U1 (Page集成)  ←─────────────────────────┤
  ↓                                        │
E4-U1 (Toolbar完善)  ←─────────────────────┤
  ↓                                        │
E5-U1 (LLM集成)  ←─────────────────────────┤
  ↓                                        │
E5-U2 (AI微调)  ←──────────────────────────┤
  ↓                                        │
E6-U3 (Chapter自动创建)  ←────────────────┤
  ↓                                        │
E6-U4 (刷新状态保持)  ←────────────────────┘
```

---

## 7. PR 合并后检查清单

- [ ] `npx tsc --noEmit` vibex-fronted 无类型错误
- [ ] `npx tsc --noEmit` vibex-backend 无类型错误
- [ ] `vitest run` 全部通过
- [ ] `npx playwright test e2e/dds-*.spec.ts` 通过
- [ ] D1 migration 本地验证通过（`wrangler d1 migrations apply vibex-db --local`）
- [ ] 无敏感数据泄漏

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定
