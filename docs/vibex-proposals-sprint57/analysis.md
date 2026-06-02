# VibeX Sprint57 分析文档

## 提案概览

基于 Sprint54-Sprint56 交付成果，识别以下功能增强方向。

| ID | 提案 | 优先级 | 影响范围 |
|----|------|--------|---------|
| P001 | 批量画布导出 (CanvasList JSON/YAML Export) | P0 | Canvas Dashboard |
| P002 | 画布内 AI Session 嵌入面板 | P0 | DDSCanvasPage, AgentPanel |
| P003 | 模板创建：画布另存为模板 | P0 | Canvas Dashboard, TemplateGallery |
| P004 | 画布批量重命名/删除 | P1 | Canvas Dashboard |
| P005 | 协作 @提及通知系统完善 | P1 | mentionsStore, NotificationBell |

---

## P001: 批量画布导出 (CanvasList JSON/YAML Export)

### 问题描述
当前 ExportMenu 仅支持单画布导出（PNG/SVG/PDF/JSON/YAML）。用户无法一次性导出整个 CanvasList（收藏的多个画布）进行备份或迁移。

### 根因分析
- ExportMenu 是单画布上下文菜单，CanvasList Dashboard 没有批量导出入口
- `useBatchExport.ts` 存在（S52），但 UI 入口仅限于导出当前画布的多种格式
- 用户需要定期备份工作区，但每次手动导出 N 个画布不现实

### 影响范围
- Canvas Dashboard 用户体验（高）
- 数据迁移/备份场景（中）

### 技术方案
1. CanvasDashboard 工具栏新增「批量导出」按钮
2. `useBatchExport.ts` 扩展支持 CanvasList 级别导出（遍历 favoriteIds 或全量 canvasIds）
3. 导出格式：JSON 数组（每项含 metadata + nodes + edges）
4. `BatchExportProgress.tsx` 复用现有进度 UI
5. 生成单个 `.vibex` 压缩包（含所有画布 JSON + manifest）

### 验收标准
- [ ] CanvasDashboard 工具栏有批量导出入口
- [ ] 批量导出支持 JSON 格式（含元数据）
- [ ] 导出进度条显示当前画布 / 总画布数
- [ ] 导出完成后自动下载 .vibex 文件
- [ ] vitest 覆盖 `useBatchExport` CanvasList 场景

---

## P002: 画布内 AI Session 嵌入面板

### 问题描述
当前 AI Agent Session 在独立侧边栏（AgentSessions.tsx），用户需要切换上下文才能看到 AI 建议。AI 生成的节点/建议无法直接在画布上预览和接受。

### 根因分析
- Agent Panel 是全屏面板，与 Canvas Dashboard 完全分离
- 画布用户必须离开画布才能使用 AI（打断工作流）
- AI 输出（如生成的节点结构）是纯文本，无法直接映射到画布节点

### 影响范围
- 画布创作效率（高）
- AI + 可视化集成（中）

### 技术方案
1. DDSCanvasPage 新增「AI Assistant」抽屉式面板（右侧滑出）
2. `useEmbeddedAgent.ts` — Hook 连接 agentStore，监听当前 session
3. 抽屉内显示 Agent Session 列表 + 输入框 + AI 响应
4. AI 响应中的「插入画布」按钮：将 AI 生成的节点数据插入到当前 flowStore
5. 状态：agentPanelOpen / agentPanelSessionId in flowStore

### 验收标准
- [ ] DDSCanvasPage 有 AI Assistant 按钮（toolbar 或快捷键触发）
- [ ] 右侧抽屉显示 Agent 对话历史
- [ ] 画布内可直接提问并看到 AI 响应
- [ ] 「插入画布」按钮将 AI 节点添加到 flowStore
- [ ] vitest 覆盖 agentPanelStore / useEmbeddedAgent

---

## P003: 模板创建 — 画布另存为模板

### 问题描述
S54-E5 实现了模板预览（TemplatePreviewDialog），但用户无法将当前画布保存为新模板。模板 Gallery 只有预置模板，无法自定义。

### 根因分析
- templateStore 目前只读（加载预置模板）
- 用户创建了满意的画布后无法「保存为模板」继续复用
- 模板预览基于 existing `templates[]` 数组，无写入 API

### 影响范围
- 模板复用场景（高）
- 用户留存（高）

### 技术方案
1. `templateStore.ts` 新增 `createFromCanvas(canvasId, name, description)` action
2. `SaveAsTemplateDialog.tsx` — 模态框：输入模板名称/描述/分类
3. `DDSCanvasPage.tsx` 工具栏新增「另存为模板」按钮
4. 模板保存时调用 `html-to-image` 截取画布快照存入 templateStore
5. `useTemplatePreview` 支持展示用户创建的模板（含 `isUserCreated` 字段）

### 验收标准
- [ ] DDSCanvasPage 工具栏有「另存为模板」入口
- [ ] SaveAsTemplateDialog 支持名称/描述/分类输入
- [ ] 画布快照自动生成缩略图
- [ ] 新模板出现在 TemplateGallery 的「我的模板」分类
- [ ] vitest: templateStore.createFromCanvas 覆盖

---

## P004: 画布批量重命名 / 删除

### 问题描述
Canvas Dashboard 目前只支持单画布重命名（S56-E2 的 favorites 功能支持收藏）。用户需要批量管理画布（如批量删除过时画布、批量重命名）但没有 UI 入口。

### 根因分析
- canvasListStore 有 `deleteCanvas` / `renameCanvas` 方法（单个）
- Dashboard UI 没有 checkbox 多选模式
- 无批量操作入口

### 影响范围
- 画布管理效率（中）
- 用户数据管理（中）

### 技术方案
1. CanvasDashboard 切换到「多选模式」：工具栏复选框或 Shift+Click
2. `canvasListStore` 新增 `batchDelete(canvasIds[])` / `batchRename(ops[])` actions
3. 多选模式下工具栏出现「删除选中」「重命名」按钮
4. `BatchRenameDialog.tsx` — 支持批量输入新名称模板（如 `Canvas {n}`）
5. 删除前显示确认对话框（含画布名称列表）

### 验收标准
- [ ] CanvasDashboard 支持多选模式（checkbox 批量选择）
- [ ] 批量删除有确认对话框，显示即将删除的画布数
- [ ] 批量重命名支持名称模板（{n} 变量替换）
- [ ] 删除后 IndexedDB 同步清理
- [ ] vitest: batchDelete / batchRename 覆盖

---

## P005: @提及 通知完善 — 评论 → 提及 → 通知链路

### 问题描述
S49-E5 实现了评论系统，S54-E3 实现了协作者光标。但 @提及功能（S51-E5 mentionsStore）尚未与评论系统打通 — 评论中的 @用户名不会触发通知。

### 根因分析
- `mentionsStore.ts` 存在（S51），但未与 `commentStore.ts` 集成
- wsCommentHandler 中的 `comment:mention` 消息类型存在，但无实际触发路径
- NotificationBell 仅显示 mentions，未显示评论提及

### 影响范围
- 协作通知场景（中）
- 实时协作体验（中）

### 技术方案
1. `commentStore.ts` 新增 `addComment` 时解析 `@username` 模式
2. 解析到 @mention → 调用 `mentionsStore.addMention(comment.id, mentionedUserId)`
3. wsCommentHandler 监听 `comment:mention` 消息并触发 `addMention`
4. NotificationBell 增加「评论提及」tab，区分 mentions vs comments
5. `parseMentions.ts` — 提取 `@username` 正则：`/@([a-zA-Z0-9_]+)/g`

### 验收标准
- [ ] 评论中添加 @username 会自动创建 mentionsStore 记录
- [ ] NotificationBell 显示评论提及未读数 badge
- [ ] WebSocket comment:mention 消息触发通知更新
- [ ] 同一用户被多次 @提及只显示一条未读
- [ ] vitest: parseMentions + commentMention 链路覆盖

