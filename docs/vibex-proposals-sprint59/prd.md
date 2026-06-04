# VibeX Sprint59 PRD

> **日期**: 2026-06-03
> **项目**: vibex-proposals-sprint59
> **分析师**: coord (self-impl)
> **PM**: coord (self-impl — analyst agent phantom ghost, PM nudge cycle 1)

---

## 执行摘要

Sprint59 聚焦 5 个高价值功能：画布全局搜索（P0）、评论实时通知（P0）、自动布局（P1）、模板批量导入/导出（P1）、键盘快捷键扩展（P2）。基于 Sprint58 的协作基础设施（WebSocket conflict/cursor/comment 全链路 + IndexedDB 全持久化）扩展画布使用体验。

**技术基础**: Zustand + IndexedDB 全链路 + vitest 300+ 测试 + WebSocket 协作层

---

## Epic × DoD

### E1: 画布全局搜索

**目标**: Cmd+K 全局搜索面板，按节点内容关键词找到画布

**DoD**:
- [ ] `canvasSearchStore.ts` 创建完成，含 `keywordIndex` / `search(query)` / `reindexCanvas(id)` actions
- [ ] IndexedDB canvasDB 新增 `fullTextSearch(query)` 方法，异步返回 canvasId[]
- [ ] DDSCanvasPage Header 右侧搜索框，Cmd+K 快捷键触发
- [ ] 搜索下拉列表：匹配画布名 + 节点文本片段高亮
- [ ] `canvasSearchStore.test.ts` 覆盖 CRUD + 索引 + 搜索逻辑
- [ ] vitest 100% 通过

**expect() 断言**:
```typescript
expect(canvasSearchStore.getState().search('AI报告').length).toBeGreaterThan(0)
expect(canvasSearchStore.getState().keywordIndex.size).toBeGreaterThan(0)
```

**集成页面**: `DDSCanvasPage`（Header 搜索框）

---

### E2: 评论实时通知

**目标**: WebSocket 推送 comment:created/comment:resolved 事件，其他用户实时感知

**DoD**:
- [ ] `commentStore` 新增 `listeners: Set<()=>void>` + `addListener`/`removeListener`/`notifyListeners`
- [ ] 后端 WebSocket 添加 `comment:created` / `comment:resolved` 消息类型
- [ ] `wsCommentHandler.ts` 订阅 comment 事件，触发 `commentStore.notifyListeners()`
- [ ] Header 右侧评论图标 NotificationBell 显示未读数 badge
- [ ] `commentStore.test.ts` 覆盖事件订阅 + notifyListeners
- [ ] vitest 100% 通过

**expect() 断言**:
```typescript
const listener = vi.fn()
commentStore.getState().addListener(listener)
commentStore.getState().notifyListeners()
expect(listener).toHaveBeenCalled()
commentStore.getState().removeListener(listener)
```

**集成页面**: `DDSCanvasPage`（CommentPanel + NotificationBell）

---

### E3: 画布节点自动布局

**目标**: DDSToolbar 添加"自动排版"按钮，Cmd+L 触发 Dagre 分层布局

**DoD**:
- [ ] `npm install @types/dagre`（开发依赖）
- [ ] `layoutStore.ts` 创建完成，含 `layoutMode: 'none'|'dagre'` / `applyAutoLayout(nodes, edges)` actions
- [ ] `computeLayout.ts` — Dagre 分层布局算法，按 rank 分组排列节点
- [ ] DDSToolbar 添加"自动排版"按钮（触发 `applyAutoLayout`）
- [ ] `DDSDrawflow.tsx` 监听 `Cmd+L` 快捷键
- [ ] `layoutStore.test.ts` 覆盖状态转换 + 布局计算
- [ ] vitest 100% 通过

**expect() 断言**:
```typescript
expect(layoutStore.getState().layoutMode).toBe('none')
layoutStore.getState().setLayoutMode('dagre')
expect(layoutStore.getState().layoutMode).toBe('dagre')
```

**集成页面**: `DDSCanvasPage`（DDSToolbar + DDSDrawflow）

---

### E4: 模板批量导入/导出

**目标**: TemplatePanel Export All / Import 功能，支持 JSON 文件跨设备迁移

**DoD**:
- [ ] `templateStore` 新增 `exportTemplates(): ExportData` / `importTemplates(data: ExportData, strategy: 'skip'|'overwrite'|'rename')` actions
- [ ] `ExportData` 接口: `{ version: string; exportedAt: string; templates: Template[] }`
- [ ] TemplatePanel 添加 Export All 按钮（触发文件下载）
- [ ] TemplatePanel 添加 Import 按钮（触发文件选择 + 冲突处理对话框）
- [ ] 冲突处理：同名模板提示 skip/overwrite/rename 三个选项
- [ ] `templateStore.test.ts` 覆盖 export/import 序列化 + 冲突处理
- [ ] vitest 100% 通过

**expect() 断言**:
```typescript
const exportData = templateStore.getState().exportTemplates()
expect(exportData.templates.length).toBeGreaterThan(0)
expect(exportData.version).toMatch(/^\d+\.\d+\.\d+$/)
```

**集成页面**: `DDSCanvasPage`（TemplatePanel）

---

### E5: 键盘快捷键扩展

**目标**: CanvasList 页面添加 J/K/Enter/N/D 快捷键，全局 shortcutRegistry

**DoD**:
- [ ] `shortcutRegistry.ts` 创建 — 全局快捷键映射表，支持 `register(shortcut, handler, page?)` / `unregister(shortcut)`
- [ ] `useGlobalShortcuts.ts` hook — 在 `_app.tsx` 或 layout 注册，监听 keydown 事件
- [ ] CanvasList 页面 `J/K` 上下选择画布，`Enter` 打开，`N` 新建，`D` 删除选中
- [ ] 快捷键冲突检测：`register` 时检测同名已注册快捷键，提示用户
- [ ] `shortcutRegistry.test.ts` 覆盖注册/注销/冲突检测
- [ ] vitest 100% 通过

**expect() 断言**:
```typescript
const handler = vi.fn()
shortcutRegistry.register('j', handler, 'canvasList')
shortcutRegistry.unregister('j', handler)
expect(shortcutRegistry.hasConflict('j', 'canvasList')).toBe(false)
```

**集成页面**: `CanvasListPage`（DDSCanvasList）+ 全局

---

## DoD 汇总

| Epic | 功能 | DoD 数 | 核心断言 |
|------|------|--------|---------|
| E1 | 画布全局搜索 | 6 | search() 返回匹配画布 |
| E2 | 评论实时通知 | 6 | listener 被调用 |
| E3 | 自动布局 | 7 | Dagre 布局节点位置变化 |
| E4 | 模板导入/导出 | 7 | exportTemplates 版本化格式 |
| E5 | 快捷键扩展 | 6 | shortcutRegistry 冲突检测 |

**质量门槛**: 所有 Epic vitest 100% 通过，代码合并前 review 通过。

---

## 风险与依赖

| 风险 | 影响 | 缓解 |
|------|------|------|
| IndexedDB fullTextSearch 性能 | 大画布索引慢 | 异步 + 进度条 |
| WebSocket 消息风暴 | 多人评论 UI 抖动 | debounce |
| Dagre 循环边布局差 | 边重叠 | 跳过循环边或警告 |
| 模板 JSON 过大 | 导出文件大 | 分块导出 |
| 快捷键冲突 | 功能失效 | register 前检测 |

**无重大阻断风险**。所有 Epic 基于已验证技术栈。
