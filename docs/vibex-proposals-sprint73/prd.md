# VibeX Sprint73 产品需求文档

**Sprint**: Sprint73
**日期**: 2026-06-07
**版本**: 1.0

---

## 执行摘要

基于 Sprint71+Sprint72 完成后识别的5个功能缺口，设计 Sprint73 五大 Epic。优先级 P0 的画布内容搜索和模板导入完善了核心工作流；P1 的通知管理和分支命名提升了系统完整性；P2 的 AI 会话导出完成知识沉淀闭环。

| Epic | 功能 | 优先级 | 复杂度 |
|------|------|--------|--------|
| E1 | 画布内容全文搜索 | P0 | 中 |
| E2 | 模板节点导入画布 | P0 | 中 |
| E3 | 通知管理与历史 | P1 | 低 |
| E4 | 画布分支命名与保护 | P1 | 中 |
| E5 | AI 会话导出与分享 | P2 | 低 |

---

## E1: 画布内容全文搜索

### 概述
为画布提供 `Cmd/Ctrl+F` 全文搜索能力，支持通过节点标题或内容关键词快速定位画布元素。

### 用户故事
> 作为用户，我需要在画布上快速搜索节点内容，这样在大型画布中导航时更高效。

### DoD（定义完成）
- [ ] `canvasSearchStore` 新增 `searchNodes(query)` 方法，支持正则匹配节点标题和内容
- [ ] 新建 `CanvasSearchPanel.tsx`，支持输入框 + 实时结果列表 + 点击跳转
- [ ] 全局 `Cmd/Ctrl+F` 快捷键绑定打开 `CanvasSearchPanel`
- [ ] 搜索结果点击后画布自动滚动到对应节点位置
- [ ] `canvasSearchStore.test.ts` 覆盖搜索逻辑（空查询/无结果/多结果）
- [ ] 集成测试：`CanvasSearchPanel` 渲染 + 交互测试

### 验收测试
```javascript
expect(store.searchNodes('test')).toEqual([])
expect(store.searchNodes('节点')).toHaveLength(2)
```

---

## E2: 模板节点导入画布

### 概述
基于 S72-E5 的模板预览能力，实现模板节点到当前画布的导入功能，完成"预览→使用"闭环。

### 用户故事
> 作为用户，我在模板画廊预览模板后，可以一键将模板节点导入到当前画布，无需手动重建。

### DoD（定义完成）
- [ ] `templateStore` 新增 `importTemplateToCanvas(templateId, position)` action
- [ ] 导入节点分配新 UUID，不与模板原始 ID 冲突
- [ ] 导入的边保持模板中的相对位置关系
- [ ] `TemplatePreviewPanel` 底部新增「导入画布」按钮
- [ ] `ImportTemplateModal.tsx` 支持导入模式选择（仅节点 / 节点+边）
- [ ] 导入后画布自动刷新显示新节点
- [ ] `templateStore.test.ts` 覆盖 `importTemplateToCanvas`（空模板/正常/ID冲突）
- [ ] `TemplatePreviewPanel` 集成测试

### 验收测试
```javascript
expect(store.importTemplateToCanvas('tpl-1', {x:0,y:0})).toHaveProperty('nodes')
expect(store.importTemplateToCanvas('tpl-1')).toMatchSnapshot()
```

---

## E3: 通知管理与历史

### 概述
为 S71-E4 的通知中心添加管理功能：标记已读、清空历史、通知偏好设置。

### 用户故事
> 作为用户，我需要管理我的通知（全部标为已读、清空历史、设置偏好），保持通知列表清爽。

### DoD（定义完成）
- [ ] `NotificationPanel` header 新增「全部标为已读」按钮，调用 `notificationStore.markAllAsRead()`
- [ ] `NotificationPanel` header 新增「清空历史」按钮，调用 `notificationStore.clearAll()`
- [ ] 未读计数徽章实时更新（`getUnreadCount()`）
- [ ] 新建 `NotificationSettingsDrawer.tsx`，支持推送渠道开关和类型开关
- [ ] 设置偏好保存至 localStorage（`notificationStore` persist middleware）
- [ ] `notificationStore.test.ts` 覆盖 `markAllAsRead` / `clearAll` / `getUnreadCount`
- [ ] `NotificationPanel` 集成测试

### 验收测试
```javascript
expect(store.markAllAsRead()).toBe(5) // 返回已标记数
expect(store.getUnreadCount()).toBe(0)
expect(store.clearAll()).toBe(0) // 清空后长度
```

---

## E4: 画布分支命名与保护

### 概述
为画布分支系统添加命名和写保护能力，防止重要分支被误操作。

### 用户故事
> 作为用户，我需要为分支指定描述性名称并设置写保护，这样在多分支协作时更安全有序。

### DoD（定义完成）
- [ ] `historyDB` 新增 `branchMeta` 表（version 5 upgrade），存储 `branchName` / `isProtected` / `createdAt`
- [ ] `canvasHistoryStore` 新增 `setBranchName(canvasId, branchName, name)` action
- [ ] `canvasHistoryStore` 新增 `setBranchProtected(canvasId, branchName, isProtected)` action
- [ ] `canvasHistoryStore` 新增 `getBranchMeta(canvasId, branchName)` selector
- [ ] `HistoryPanel` 分支列表支持 inline 名称编辑
- [ ] `HistoryPanel` 分支列表显示 🔒 保护标记，toggle 点击切换保护状态
- [ ] 保护分支执行删除操作时弹出 `window.confirm()` 确认框
- [ ] `historyDB.test.ts` 覆盖 branchMeta CRUD

### 验收测试
```javascript
expect(historyDB.setBranchMeta('c1', 'main', {name:'主分支', isProtected:true})).toBeTruthy()
expect(historyDB.isBranchProtected('c1', 'main')).toBe(true)
```

---

## E5: AI 会话导出与分享

### 概述
为 S66-E5 的协作会话录制功能添加 Markdown/PDF 导出和剪贴板复制能力。

### 用户故事
> 作为用户，我需要将 AI 会话历史导出为 Markdown 或 PDF，方便知识沉淀和团队分享。

### DoD（定义完成）
- [ ] `collabSessionStore` 新增 `exportSessionMarkdown(sessionId)` action，返回格式化 Markdown 字符串
- [ ] `collabSessionStore` 新增 `exportSessionPDF(sessionId)` action，调用 `window.print()`
- [ ] `SessionReplayPanel` header 新增「导出」下拉菜单（Markdown / PDF / 复制）
- [ ] Markdown 导出包含所有事件类型、时间戳、用户名称
- [ ] 复制功能使用 `navigator.clipboard.writeText()`
- [ ] `collabSessionStore.test.ts` 覆盖 `exportSessionMarkdown`

### 验收测试
```javascript
const md = store.exportSessionMarkdown('session-1')
expect(md).toContain('# Session: session-1')
expect(md).toContain('## Events')
```

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 说明 |
|--------|---------|------|
| 快捷键 | E1 (Cmd+F) | E1 打开搜索面板，与 E3 通知设置/E4 分支命名/E5 导出不冲突 |
| DDSToolbar | E1 | 搜索按钮可加在 Toolbar，与通知按钮/导出按钮并列 |
| 模板系统 | E2 | E2 依赖 S72-E5 `getTemplateNodes` 和 `TemplatePreviewPanel` |
| NotificationPanel | E3 | 依赖 S71-E4 `NotificationPanel` 组件 |
| HistoryPanel | E4 | 依赖 S66-E1/S67-E1 的分支操作和 HistoryPanel |
| SessionReplayPanel | E5 | 依赖 S66-E5 `SessionReplayPanel` 组件 |
| canvasStore | E2 | 写入节点到当前画布需调用 canvasStore actions |

---

## 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| E1 搜索性能 | 大画布（>500节点）正则匹配慢 | 限制在标题+第一行内容，避免全量遍历 |
| E2 ID 映射 | 边引用节点 UUID 需完整映射 | 实现节点 ID 映射表，导入时更新所有引用 |
| E4 IndexedDB 升级 | 现有数据迁移 | 保留 v4 数据，新增 v5 `branchMeta` 表 |
| E5 PDF 导出 | 打印格式依赖 CSS | 提供打印专用 `@media print` 样式 |
