# VibeX Sprint57 架构设计文档

## 执行摘要

Sprint57 在 S54-S56 基础上推进四个核心方向：批量画布管理、AI Session 画布内集成、模板用户创建、协作通知完善。架构原则：复用现有 store/hooks/组件模式，新增薄层适配代码，避免破坏现有架构。

---

## E1: CanvasList 批量导出

### 现有资产（origin/main 已验证）

| 资产 | 路径 | 说明 |
|------|------|------|
| useBatchExport.ts | `src/hooks/canvas/useBatchExport.ts` | S52 已有，含 exportZip/exportMultipleAsPNG/exportMultipleAsJSON |
| ZipExporter.ts | `src/services/export/ZipExporter.ts` | S52 已有，含 exportZip()/collectNodes()/createManifest() |
| DDSToolbar | `src/components/dds/DDSToolbar.tsx` | S54-E1 已有 History 按钮模式 |
| BatchExportProgress.tsx | `src/components/dds/export/BatchExportProgress.tsx` | S52 已有进度 UI |

**需新增**：

| 文件 | 路径 | 说明 |
|------|------|------|
| BatchExportPanel.tsx | `src/components/dds/export/BatchExportPanel.tsx` | 批量导出配置面板（格式选择 + canvasId 列表） |
| useBatchExportList.ts | `src/hooks/canvas/useBatchExportList.ts` | 新 Hook：遍历 favoriteIds 调用 useBatchExport |

**架构决策**：
- 复用 `ZipExporter.exportZip(canvasData[], format)` — 不改已有逻辑
- 新 Hook `useBatchExportList` 内部调用 `useBatchExport.exportMultiple()` — 适配 CanvasList 级别
- `.vibex` 格式 = JSON 数组 + manifest.json 打包
- 进度追踪复用现有 `BatchExportProgress.tsx`，新增 `total` 参数

**测试策略**：
- `useBatchExportList.test.ts`：mock `canvasListStore.getState().favoriteIds`，验证 exportZip 调用参数
- 覆盖：空列表 / 单画布 / 多画布 / 进度回调

---

## E2: 画布内 AI Session 嵌入面板

### 现有资产（origin/main 已验证）

| 资产 | 路径 | 说明 |
|------|------|------|
| useAgentSession.ts | `src/hooks/agent/useAgentSession.ts` | S49 已有 session 管理 |
| agentStore | `src/stores/dds/agentStore.ts` | S49 已有 sessions[] / activeSessionId |
| flowStore | `src/stores/dds/flowStore.ts` | S38 已有 addNodes() |
| DDSDrawer | `src/components/dds/DDSDrawer.tsx` | S52 已有抽屉组件 |

**需新增**：

| 文件 | 路径 | 说明 |
|------|------|------|
| EmbeddedAgentPanel.tsx | `src/components/dds/agent/EmbeddedAgentPanel.tsx` | 右侧抽屉组件（复用 DDSDrawer 模式） |
| useEmbeddedAgent.ts | `src/hooks/agent/useEmbeddedAgent.ts` | Hook：连接 agentStore + flowStore，isOpen/activeSessionId |
| flowStore.addAgentNodes() | `src/stores/dds/flowStore.ts` | 新 action：将 AI 节点数组注入 flow |

**架构决策**：
- `EmbeddedAgentPanel` 复用 `DDSDrawer`（`direction="right"`, `width={320}`）
- `useEmbeddedAgent` 订阅 `agentStore.sessions`，监听当前 session 变化
- AI「插入画布」按钮调用 `flowStore.addAgentNodes(aiNodes)` — 节点数据格式兼容现有 NodeData
- Agent 消息通过 `agentStore` 的 `sessions[sessionId].messages[]` 读取，不新增 WS 类型
- WebSocket `agent:message` 消息已在 S49 实现，E2 复用

**测试策略**：
- `useEmbeddedAgent.test.ts`：mock agentStore，验证 isOpen toggle / activeSessionId 响应
- `flowStore.addAgentNodes` 单元测试：验证节点注入后 nodes[] 长度增加

---

## E3: 模板创建 — 画布另存为模板

### 现有资产（origin/main 已验证）

| 资产 | 路径 | 说明 |
|------|------|------|
| templateStore.ts | `src/stores/dds/templateStore.ts` | S49-E2 已有 templates[] 只读 |
| TemplateGallery | `src/components/dds/templates/TemplateGallery.tsx` | S54-E5 已有，含 CategoryTab / isUserCreated 字段 |
| html-to-image | `package.json` | 已安装，用于缩略图截取 |
| DDSToolbar | `src/components/dds/DDSToolbar.tsx` | S54-E1 已有按钮挂载模式 |

**需新增**：

| 文件 | 路径 | 说明 |
|------|------|------|
| SaveAsTemplateDialog.tsx | `src/components/dds/templates/SaveAsTemplateDialog.tsx` | 模态框：name/description/category 输入 |
| templateStore 新增 action | `src/stores/dds/templateStore.ts` | `createFromCanvas(canvasId, name, desc, category)` |
| 模板快照 Hook | `src/hooks/canvas/useTemplateSnapshot.ts` | 调用 html-to-image 截取当前画布 |

**架构决策**：
- `templateStore.createFromCanvas` 新增 action，写入 `templates[]` 并持久化到 localStorage
- `templateStore` 新增 `isUserCreated: true` + `thumbnail: string` 字段
- `html-to-image` 截取 `<div ref={canvasRef}>` DOM 节点 — 需要 ref 传入
- TemplateGallery 已有 `isUserCreated` 字段（S54-E5 预留），只需新增 filter 逻辑

**测试策略**：
- `templateStore.test.ts`：新增 `createFromCanvas` 3 个测试（正常/无 canvasId/重复名称）

---

## E4: 画布批量重命名 / 删除

### 现有资产（origin/main 已验证）

| 资产 | 路径 | 说明 |
|------|------|------|
| canvasListStore | `src/stores/dds/canvasListStore.ts` | S56-E2 已有 deleteCanvas / renameCanvas（单个） |
| CanvasDashboard | `src/components/dds/canvas-dashboard/CanvasDashboard.tsx` | S54 已有，含 CanvasCard 列表 |
| DDSDialog | `src/components/dds/DDSDialog.tsx` | S52 已有确认对话框组件 |

**需新增**：

| 文件 | 路径 | 说明 |
|------|------|------|
| canvasListStore 扩展 | `src/stores/dds/canvasListStore.ts` | 新增 batchDelete(canvasIds[]) / batchRename(ops[]) actions |
| BatchOpsPanel.tsx | `src/components/dds/canvas-dashboard/BatchOpsPanel.tsx` | 多选模式工具栏（删除/重命名按钮） |
| BatchDeleteConfirmDialog.tsx | `src/components/dds/canvas-dashboard/BatchDeleteConfirmDialog.tsx` | 删除确认 |
| BatchRenameDialog.tsx | `src/components/dds/canvas-dashboard/BatchRenameDialog.tsx` | 批量重命名（支持 {n} 占位符） |
| CanvasDashboard 多选模式 | `src/components/dds/canvas-dashboard/CanvasDashboard.tsx` | Checkbox 多选状态 |

**架构决策**：
- 多选模式通过 `canvasListStore.selectedIds: string[]` + `setSelectedIds(ids)` 管理
- `batchDelete` 内部调用 `deleteCanvas` 循环，IndexedDB 同步清理每个
- `batchRename` 支持 `{n}` 占位符：`name.replace(/\{n\}/g, String(i))` 替换
- 多选 UI：CanvasCard 左上角 Checkbox（aria-label）+ 工具栏「已选 N 个」计数

**测试策略**：
- `canvasListStore.test.ts`：新增 batchDelete / batchRename 覆盖（空列表/单ID/多ID/占位符替换）

---

## E5: @提及 → 通知链路完善

### 现有资产（origin/main 已验证）

| 资产 | 路径 | 说明 |
|------|------|------|
| mentionsStore | `src/stores/dds/mentionsStore.ts` | S51-E5 已有 addMention / mentions[] |
| wsCommentHandler | `src/lib/canvas/wsCommentHandler.ts` | S49 已有 comment:created / resolved cases |
| parseMentions.ts | `src/lib/canvas/parseMentions.ts` | S51 已有，extract @username 正则 |
| NotificationBell | `src/components/dds/notifications/NotificationBell.tsx` | S49 已有 badge 计数 |
| commentStore | `src/stores/dds/commentStore.ts` | S49 已有 addComment |

**需新增**：

| 文件 | 路径 | 说明 |
|------|------|------|
| mentionsStore 扩展 | `src/stores/dds/mentionsStore.ts` | 新增 sourceType: 'comment' | 'chat' 字段 |
| NotificationBell 扩展 | `src/components/dds/notifications/NotificationBell.tsx` | 新增「评论提及」tab |
| wsCommentHandler 扩展 | `src/lib/canvas/wsCommentHandler.ts` | 新增 `comment:mention` case |

**架构决策**：
- `mentionsStore` 扩展 `addMention(id, userId, sourceType)` — sourceType 区分来源
- `commentStore.addComment` 内部调用 `parseMentions(text)` → 对每个 username 调用 `mentionsStore.addMention`
- WebSocket `comment:mention` 消息类型：wsCommentHandler 新增 case，触发 mentionsStore 更新
- NotificationBell 新增 `type: 'comment' | 'mention'` 过滤 tab
- 去重逻辑：mentionsStore 已有按 userId 去重，E5 复用

**测试策略**：
- `parseMentions.test.ts`：覆盖 @alice @alice（去重）/ 边界 / 无 mentions
- `commentStore` 新增 @mention 链路测试（mock mentionsStore）

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 方案 |
|--------|---------|------|
| DDSToolbar 按钮区 | E1 / E2 / E3 | 工具栏按钮分组：导出组（E1）/ AI组（E2）/ 模板组（E3） |
| flowStore 节点注入 | E2 / E3 | `addAgentNodes(aiNodes)` / `addTemplateNodes(templateId)` 统一节点注入 |
| IndexedDB 同步 | E3 / E4 | templateStore / canvasListStore 各自持久化，互不影响 |
| WebSocket 消息链 | E2 / E5 | agent:message（E2）+ comment:mention（E5）独立，无交叉依赖 |

---

## 技术约束

1. 所有新增 store action 必须同步 IndexedDB
2. 新增 Hook 必须可被 vitest mock（避免直接 import 外部服务）
3. DDSToolbar 按钮新增不超过 3 个（E1/E2/E3 各 1）
4. WebSocket handler 扩展使用 `import()` 动态导入，避免循环依赖
