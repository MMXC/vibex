# Sprint 52 — 提案分析报告

**项目**: vibex-proposals-sprint52
**日期**: 2026-06-02
**分析依据**: Sprint 51 (E1-E5) + Sprint 50 交付成果 + CHANGELOG 回顾

---

## 提案总览

| ID | 优先级 | 功能名称 | 根因 |
|----|--------|---------|------|
| P001 | P0 | 画布协作实时感知 — 多人在线状态 | 协作用户无感知，无在线列表 |
| P002 | P1 | 批量导出格式扩展 — SVG + PDF | S51-E2 仅 PNG，SVG/PDF 空白 |
| P003 | P1 | Undo/Redo 协作冲突处理 | 并发写入无 revision 校验，历史覆盖 |
| P004 | P2 | 模板管理增强 — 分类/标签/搜索 | 模板库无组织工具，大列表难查找 |
| P005 | P2 | 键盘快捷键自定义 UI | S50-E2 Cmd+L 硬编码，不可配置 |

---

## P001 — 画布协作实时感知

### 问题根因
S51-E1 持久化完成，但 CollaborationRoom 未广播 presence 事件，协作用户无法感知彼此。

### 技术风险
- WebSocket 房间需扩展 `presence:join/leave/ping` 消息类型
- D1 `collaboration_presence` 表需新增（Cloudflare D1 migration）
- Zustand store 跨 tab 同步需额外处理

### 影响范围
- 前端: `DDSCanvasPage` 新增 PresenceIndicator 挂载点
- 前端: `collaborationPresenceStore` 新建
- 后端: `CollaborationRoom.ts` 新增 presence 广播逻辑
- 后端: D1 schema 新增 presence 表

---

## P002 — 批量导出格式扩展

### 问题根因
`exportMultipleAsPNG.ts` 使用 `html-to-image` 仅支持栅格格式。SVG 需遍历 ReactFlow 节点生成矢量，PDF 需引入 jsPDF。

### 技术风险
- SVG 内联样式需要处理外部 CSS 变量
- PDF 多页布局需精确计算每画布尺寸
- `html-to-image` 截图质量与 pixelRatio 设置相关

### 影响范围
- 前端: `exportMultipleAsSVG.ts` 新建
- 前端: `exportMultipleAsPDF.ts` 新建
- 前端: `ExportProgress.tsx` 扩展 format 参数
- 后端: `/api/export/pdf-batch` 路由新建

---

## P003 — Undo/Redo 协作冲突处理

### 问题根因
`historyDB.ts` 的 LIRS 策略无 revision 字段校验，多人并发写入时互相覆盖历史。

### 技术风险
- revision 乐观锁需处理高并发冲突率高的场景
- Toast UI 需接入现有通知系统
- WebSocket revision:bump 消息需与其他消息类型协调

### 影响范围
- 前端: `canvasHistoryStore` 新增 `baseRevision` 字段
- 前端: `historyDB.ts` 新增 `saveHistoryWithRevision()`
- 前端: WebSocket handler 新增 `revision:bump`
- 前端: `useHistoryPersistence.ts` 监听 revision:bump

---

## P004 — 模板管理增强

### 问题根因
`templateStore` 仅 CRUD，无分类/标签字段。`TemplateGallery` 全量渲染无过滤。

### 技术风险
- Fuse.js 搜索需配置合理的 keys 和 threshold
- 分类变更需触发 TemplateGallery 重新渲染（Zustand subscription）

### 影响范围
- 前端: `templateStore` 新增 category/tags 字段和 actions
- 前端: `TemplateGallery` 新增分类 Tab + 标签过滤
- 前端: `TemplateSearchBar.tsx` 新建（Fuse.js 搜索）
- 前端: `TemplateEditDialog` 新增 category/tag 编辑 UI

---

## P005 — 键盘快捷键自定义 UI

### 问题根因
`useKeyboardShortcuts` 从硬编码 map 读取，未持久化。S48-E3 可配置化需求未完成。

### 技术风险
- keydown 捕获需避免与浏览器默认快捷键冲突
- 快捷键冲突检测（同一按键组合绑定多个 action）

### 影响范围
- 前端: `shortcutStore.ts` 新建（localStorage 持久化）
- 前端: `useKeyboardShortcuts` 改造（从 store 读取）
- 前端: `ShortcutSettingsPanel.tsx` 新建
- 前端: `ShortcutKeyInput.tsx` 新建
