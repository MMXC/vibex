# Sprint 51 架构设计文档

**版本：** 1.0 | **日期：** 2026-06-02 | **作者：** Architect (Coord Self-Impl)

---

## 1. 架构概览

Sprint 51 在 Sprint 50 基础上进行画布编辑体验补强，核心主题：
- **E1**: Undo/Redo 持久化（IndexedDB）
- **E2**: PNG 批量导出（ZIP 打包 + 服务端合并）
- **E3**: MiniMap 导航（@xyflow/react 内置组件集成）
- **E4**: 多选批量操作（框选 hook + 浮动 Toolbar）
- **E5**: @提及 + 评论深化（坐标评论 + WebSocket 通知）

**技术栈延续：**
- 前端：Next.js 15 + Zustand + @xyflow/react
- 后端：Cloudflare Workers + D1
- 存储：IndexedDB（前端）+ D1（后端）
- 协作：WebSocket（现有 wsProvider 架构）

---

## 2. Epic 架构决策

### E1 — Undo/Redo 持久化

**现状：**
- `canvasHistoryStore`（`src/stores/dds/canvasHistoryStore.ts`）：会话级内存状态
- `oplogStore`（`src/stores/dds/oplogStore.ts`）：操作日志，会话级
- 无跨画布历史保留

**需新增：**

| 组件 | 路径 | 职责 |
|------|------|------|
| `historyDB.ts` | `src/lib/canvas/historyDB.ts` | IndexedDB 封装：连接、读写、清理 |
| `canvasHistoryStore` 扩展 | `src/stores/dds/canvasHistoryStore.ts` | 新增 `saveHistory`/`loadHistory`/`clearHistory` actions |
| `useHistoryPersistence` | `src/hooks/useHistoryPersistence.ts` | 监听 history 变化，自动防抖保存 |

**架构决策：**
1. **存储结构**：`canvas_history` 表，`{ canvasId, timestamp, snapshot, oplog }`
2. **快照策略**：每 50 次操作 OR 每 5 分钟生成增量快照（非全量）
3. **恢复流程**：打开画布 → 从 IndexedDB 加载最新快照 → 重放 oplog → 恢复内存状态
4. **驱逐策略**：LIRS 算法，存储超过 5MB/画布时清理最旧快照
5. **并发控制**：同一画布的多个 tab，乐观锁 + last-write-wins

**测试策略：**
- Vitest：historyDB CRUD、快照序列化、LIRS 驱逐
- Playwright E2E：刷新后 Undo 可用、画布切换后历史保留

---

### E2 — PNG 批量导出

**现状：**
- `exportCanvasAsPNG(canvasId)` — 单张导出
- `CanvasListPanel.exportSelectedPDF()` — PDF 批量导出（已有）
- 无 PNG 批量入口

**需新增：**

| 组件 | 路径 | 职责 |
|------|------|------|
| `exportMultipleAsPNG` | `src/lib/canvas/exportMultipleAsPNG.ts` | 并发导出多个 canvasId 为 PNG Blob[] |
| `ExportProgress` | `src/components/dds/export/ExportProgress.tsx` | 进度条组件（X/Y 完成） |
| `useBatchExport` | `src/hooks/useBatchExport.ts` | 批量导出状态管理（idle/pending/done/error） |
| 后端 API | `/api/export/batch-png` | 服务端 ZIP 合并（大于 5 个时降级） |

**架构决策：**
1. **客户端优先**：小于 5 个画布时浏览器端并发导出（Promise.all）
2. **服务端降级**：大于等于 5 个 → POST canvasId[] → 服务端合并 ZIP → 返回下载链接
3. **进度反馈**：Web Worker 计算进度（避免阻塞 UI）
4. **取消支持**：AbortController 信号传递到所有并发任务
5. **文件名**：`vibex-export-{YYYYMMDD}.zip`

**测试策略：**
- Vitest：单张 PNG 导出、并发导出、ZIP 打包
- Playwright E2E：批量导出进度条、取消导出、ZIP 可解压

---

### E3 — MiniMap 缩略导航

**现状：**
- `@xyflow/react ^12.10.1` 已安装，内置 `MiniMap` 组件
- `MiniMap` 尚未集成到 `DDSCanvasPage`

**需新增/修改：**

| 组件 | 路径 | 职责 |
|------|------|------|
| `MiniMap.tsx` | `src/components/dds/MiniMap.tsx` | `@xyflow/react MiniMap` wrapper |
| `DDSCanvasPage` 修改 | `src/app/dds/[id]/page.tsx` | 集成 MiniMap Panel |
| `viewportBoundsStore` 扩展 | `src/lib/canvas/stores/viewportBoundsStore.ts` | 暴露 `fitView` 方法给 MiniMap 点击 |

**架构决策：**
1. **集成方式**：`@xyflow/react MiniMap` 作为 `ReactFlow` 子组件传入，无需额外依赖
2. **节点着色**：`nodeColor` 按卡片类型映射（DDS 节点/AI 节点/导出前节点）
3. **节点采样**：大画布（>100 节点）时每 20px 采样一个代表点，避免性能问题
4. **Panel 定位**：`position="bottom-right"`，与 Controls 分离
5. **交互**：MiniMap 视口框拖拽 → 实时导航；点击区域 → `fitView` 跳转

**测试策略：**
- Vitest：节点着色逻辑、采样逻辑
- Playwright E2E：MiniMap 可见、点击跳转、不同节点颜色

---

### E4 — 多选批量操作

**现状：**
- `ddsChapterStore.selectedCardIds: string[]` — 已支持多选（底层）
- Toolbar 仅「删除选中」按钮
- 无框选、批量移动/复制/对齐

**需新增：**

| 组件 | 路径 | 职责 |
|------|------|------|
| `useSelectionBox` | `src/hooks/useSelectionBox.ts` | 框选逻辑：鼠标拖拽生成矩形选区 |
| `SelectionToolbar` | `src/components/dds/SelectionToolbar.tsx` | 选中 2+ 卡片时显示的浮动 Toolbar |
| `useAlignmentTools` | `src/hooks/useAlignmentTools.ts` | 对齐工具：左/右/水平居中/垂直居中 |
| `ddsChapterStore` 扩展 | `src/stores/dds/ddsChapterStore.ts` | 新增 `moveCards`/`duplicateCards` actions |

**架构决策：**
1. **框选 hook**：`onMouseDown` → `onMouseMove` 生成矩形 → `onMouseUp` 计算相交卡片
2. **SelectionToolbar 定位**：选中卡片边界框上方 8px，绝对定位随选中区域移动
3. **批量移动**：遍历 `selectedCardIds`，对每个 `card` 应用 `position + deltaX/deltaY`
4. **批量复制**：`duplicateCards()` 生成新卡片，`position + (20, 20)` 偏移
5. **对齐算法**：计算选中卡片边界框 → 确定对齐基准 → 批量应用 position

**测试策略：**
- Vitest：框选相交计算、批量移动/复制、对齐工具
- Playwright E2E：框选高亮、浮动 Toolbar 出现、批量删除确认

---

### E5 — @提及 + 评论深化

**现状（Sprint 50 E3）：**
- `wsCommentHandler.ts` — 处理 `comment:created` / `comment:resolved`
- `commentStore` — 本地评论状态
- 无 @ 提及解析、无坐标评论

**需新增/修改：**

| 组件 | 路径 | 职责 |
|------|------|------|
| `parseMentions` | `src/lib/canvas/parseMentions.ts` | 正则解析 `@username` 列表 |
| `useMentionCompletion` | `src/hooks/useMentionCompletion.ts` | `@` 触发补全列表 |
| `CommentInput` 修改 | `src/components/dds/comment/CommentInput.tsx` | 添加 @ 补全下拉 |
| `CommentCard` 扩展 | `src/components/dds/comment/CommentCard.tsx` | 支持 `position?: {x, y}` 坐标评论 |
| `mentionsStore` | `src/stores/dds/mentionsStore.ts` | @ 提及状态（mentions[]、通知状态） |
| 后端 API | `/api/comments/mentions` | 存储评论 mentions 列表 |
| `wsCommentHandler` 修改 | `src/lib/canvas/wsCommentHandler.ts` | 处理 `comment:mention` 消息类型 |

**架构决策：**
1. **@解析**：正则 `/@[a-zA-Z0-9_]+/g`，提取后去除 `@` 前缀
2. **补全 UI**：监听 CommentInput 的 `value` 变化，检测末尾 `@` 触发下拉
3. **坐标评论**：`CommentCard` 支持 `position` 字段（画布坐标），`x < 0` 时渲染为浮动标注
4. **通知分发**：评论 POST 时携带 `mentions[]`，后端通过 WebSocket 推送 `comment:mention` 消息
5. **wsCommentHandler 分离**：`comment:mention` 单独处理，不与 `comment:created` 共用去重逻辑

**测试策略：**
- Vitest：@ 解析、补全列表渲染、坐标评论布局
- Playwright E2E：@ 补全触发、WebSocket 通知、坐标评论可见

---

## 3. 跨 Epic 共享依赖

| 依赖 | 使用方 | 说明 |
|------|--------|------|
| `canvasHistoryStore` | E1, E2 | E2 导出需要历史快照 |
| `@xyflow/react MiniMap` | E3 | 直接集成 |
| `ddsChapterStore.selectedCardIds` | E4, E5 | 多选共享、评论权限 |
| `wsProvider` | E5 | WebSocket 基础设施（S50-E3 已实现） |
| `commentStore` | E5 | 评论基础设施（S50-E3 已实现） |

---

## 4. 性能注意事项

| Epic | 风险 | 缓解 |
|------|------|------|
| E1 | IndexedDB 读写阻塞 UI | 防抖 500ms + Web Worker |
| E2 | 大量 PNG 内存压力 | 服务端 ZIP 降级 + 流式处理 |
| E3 | MiniMap 渲染大画布 | 节点采样（每 20px 一个代表点） |
| E4 | 批量操作重渲染 | `batch()` 更新 + 虚拟化（如需） |
| E5 | 频繁 WebSocket 通知 | 节流 100ms + 去重 |

---

## 5. 部署计划

- **Phase 2 完成后**：合并到 `origin/main`
- **触发**：coord-completed 流程后自动部署（Cloudflare Pages）
- **E2 服务端**：`/api/export/batch-png` 需 Cloudflare Workers 部署后生效

---

*文档版本：1.0 | 最后更新：2026-06-02 | Architect (Coord Self-Impl)*
