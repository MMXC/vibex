# VibeX Sprint73 提案分析

**Sprint**: Sprint73
**日期**: 2026-06-07
**分析师**: coord (heartbeat self-impl)
**依据**: 基于 Sprint71+Sprint72 已完成功能 + 现有代码库缺口分析

---

## 提案摘要

| ID | 功能 | 优先级 | 来源 |
|----|------|--------|------|
| P001 | 画布内容全文搜索 | P0 | S71-E3 CanvasSettingsPanel 存在但画布节点内容无法搜索 |
| P002 | 模板节点导入画布 | P0 | S72-E5 模板预览完成但无导入功能 |
| P003 | 通知管理与历史 | P1 | S71-E4 NotificationPanel 存在但无清空/标记已读/历史 |
| P004 | 画布分支命名/保护 | P1 | S66-E1 分支操作 + S67-E1 分支对比完成但无命名UI |
| P005 | AI 会话导出与分享 | P2 | S63-E4 流式AI + S66-E5 会话录制完成但无导出格式 |

---

## P001: 画布内容全文搜索

### 问题描述
画布节点和边的内容无法被全文检索。用户需要通过节点标题或内容关键词快速定位画布中的元素。

### 根因分析
现有 `DDSDrawflow` 和 `canvasStore` 存储了所有节点数据，但没有暴露统一的全文搜索接口。模板搜索（`templateStore.search`）已存在（模板画廊），但画布内容搜索是独立需求。

### 影响范围
- 用户体验：画布节点数量增加时导航困难
- 协作场景：协作者无法快速定位特定节点

### 技术方案
1. 在 `canvasStore` 或新建 `canvasSearchStore` 中实现 `searchNodes(query)` 方法，使用内存过滤（正则匹配标题+内容）
2. 新建 `CanvasSearchPanel.tsx` 浮层面板，`Cmd/Ctrl+F` 快捷键触发
3. 搜索结果高亮显示，支持点击跳转至节点

### 验收标准
- [ ] `searchNodes("关键词")` 返回匹配的节点数组
- [ ] `CanvasSearchPanel` 支持输入 + 实时结果列表
- [ ] `Cmd/Ctrl+F` 快捷键打开搜索面板
- [ ] 点击搜索结果滚动画布至对应节点
- [ ] 单元测试覆盖搜索逻辑

---

## P002: 模板节点导入画布

### 问题描述
S72-E5 完成了模板预览面板（`TemplatePreviewPanel`），用户可以预览模板节点结构，但无法将模板节点导入到当前画布。

### 根因分析
`TemplatePreviewPanel` 仅有展示功能，`getTemplateNodes(templateId)` 已实现但没有 `importTemplateToCanvas` action。用户预览后需要重新手动创建节点。

### 影响范围
- 模板系统完成度：预览→使用闭环断裂
- 用户体验：需要手动复制模板内容

### 技术方案
1. `templateStore` 新增 `importTemplateToCanvas(templateId, position)` action
   - 读取模板节点数据，生成新 UUID
   - 将节点写入当前 `canvasStore`
   - 边映射：保留相对位置关系
2. `TemplatePreviewPanel` 底部新增「导入画布」按钮
3. `ImportTemplateModal.tsx` 可选：选择导入模式（仅节点 / 节点+边 / 完整克隆）

### 验收标准
- [ ] `importTemplateToCanvas` 正确复制节点数据
- [ ] 导入节点分配新 UUID（不与模板原始 ID 冲突）
- [ ] 导入的边保持模板中的相对关系
- [ ] 导入后画布自动刷新显示新节点
- [ ] 单元测试覆盖导入逻辑

---

## P003: 通知管理与历史

### 问题描述
S71-E4 实现了通知中心（`NotificationPanel`），但缺少通知管理功能：标记已读、清空历史、通知偏好设置。

### 根因分析
`notificationStore` 有 `markAsRead` / `markAllAsRead` / `clearAll` 方法（根据 S68-E2 DoD），但 UI 层面没有暴露入口。`NotificationPanel` 仅展示列表，无管理操作。

### 影响范围
- 通知系统可用性：列表无限增长，难以管理
- 移动端/桌面端：通知积累后性能下降

### 技术方案
1. `NotificationPanel` header 新增：
   - 「全部标为已读」按钮
   - 「清空历史」按钮
   - 未读计数徽章（已有）
2. `NotificationSettingsDrawer.tsx` 设置面板：
   - 推送渠道开关（WebSocket / Email mock）
   - 每类通知类型的开关
3. `notificationStore` 扩展：
   - `unreadCount` getter
   - `getNotificationsByType(type)` selector

### 验收标准
- [ ] 「全部标为已读」清空所有 `isRead=false`
- [ ] 「清空历史」移除所有通知
- [ ] 未读计数实时更新
- [ ] 设置面板保存偏好至 localStorage
- [ ] 单元测试覆盖 markAllAsRead / clearAll

---

## P004: 画布分支命名与保护

### 问题描述
S66-E1 实现了分支操作（创建/删除/合并/重命名），S67-E1 实现了分支对比，但分支命名 UI 不存在，用户无法为分支指定描述性名称，也无法设置分支保护。

### 根因分析
`historyDB.listBranchesFromDB` 返回分支列表，但没有 `branchMeta` 表存储名称/描述/保护状态。

### 影响范围
- 多分支管理：无法区分不同用途的分支
- 协作安全：无法防止重要分支被误删

### 技术方案
1. `historyDB` 新增 `branchMeta` 表：
   - `branchName`（用户自定义名称）
   - `isProtected`（保护标记）
   - `createdAt` / `updatedAt`
2. `canvasHistoryStore` 新增 actions：
   - `setBranchName(canvasId, branchName, name)`
   - `setBranchProtected(canvasId, branchName, isProtected)`
   - `getBranchMeta(canvasId, branchName)`
3. `BranchListPanel.tsx` 或 `HistoryPanel` 扩展：
   - 分支名称编辑 inline
   - 🔒 保护标记 toggle
   - 保护分支删除时 confirm dialog

### 验收标准
- [ ] 分支可设置自定义名称
- [ ] 保护分支删除时弹出确认
- [ ] 分支名称在 HistoryPanel 中显示
- [ ] 单元测试覆盖 branchMeta CRUD

---

## P005: AI 会话导出与分享

### 问题描述
S63-E4 实现了流式 AI 响应，S66-E5 实现了协作会话录制与回放，但用户无法将 AI 会话历史导出为 Markdown/PDF，也无法分享给其他用户。

### 根因分析
`collabSessionStore` 有完整会话录制能力，`AISessionDrawer` 有 UI，但导出功能未实现。

### 影响范围
- 知识管理：AI 对话内容无法沉淀
- 协作分享：会话无法分享给团队成员

### 技术方案
1. `collabSessionStore` 新增：
   - `exportSessionMarkdown(sessionId)` — 生成 Markdown 格式
   - `exportSessionPDF(sessionId)` — 触发浏览器打印（`window.print()`）
2. `SessionReplayPanel` header 新增「导出」下拉菜单：
   - 导出为 Markdown
   - 导出为 PDF
   - 复制到剪贴板
3. 导出格式：
   - Markdown: 每个事件带时间戳 + 用户名
   - PDF: 打印友好的会话记录格式

### 验收标准
- [ ] Markdown 导出包含所有事件 + 时间戳
- [ ] PDF 导出（`window.print()`）格式良好
- [ ] 复制到剪贴板功能
- [ ] 单元测试覆盖 exportSessionMarkdown

