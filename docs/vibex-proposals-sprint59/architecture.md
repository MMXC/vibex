# VibeX Sprint59 架构文档

> **日期**: 2026-06-03
> **项目**: vibex-proposals-sprint59
> **架构师**: coord (self-impl — analyst + PM phantom ghost)

---

## 架构决策总览

| Epic | 核心决策 | 风险 |
|------|---------|------|
| E1 | canvasSearchStore workspace push + DDSCanvasPage 集成 | store 未在 main，需 push 后验证 |
| E2 | wsCommentHandler 新建目录，与 wsConflictHandler 同级 | WebSocket 事件风暴需 debounce |
| E3 | dagre 纯计算，layoutStore 状态驱动 | 循环边处理 |
| E4 | 扩展现有 templateStore，增加 export/import actions | 大 JSON 文件需分块 |
| E5 | shortcutRegistry 基于 shortcutManager，page scope 隔离 | 快捷键覆盖优先级需明确 |

---

## E1: 画布全局搜索

### 架构图
```
DDSCanvasPage
  ├─ Header: CanvasSearchBar (Cmd+K 触发)
  │    └─ <SearchPanel> dropdown
  └─ canvasSearchStore (Zustand)
       ├─ keywordIndex: Map<canvasId, CanvasIndexEntry>
       ├─ fullTextSearch(keywordIndex, query) → canvasId[]
       └─ getSearchResults(canvasIds, keywordIndex) → CanvasSearchResult[]
```

### 跨 Epic 集成点
- E1-E2: search results → 点击结果打开画布 → E2 NotificationBell 状态更新
- E1-E4: TemplatePanel export 从 canvasSearchStore 获取画布列表

### 文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/stores/canvasSearchStore.ts` | ⚠️ workspace only (5779b), NOT on main | 需 push 到 origin/main |
| `src/lib/canvas/fullTextSearch.ts` | ✅ on main (S50 E1) | 完整实现 |
| `src/components/canvas/CanvasSearchBar.tsx` | ❌ 新建 | 搜索框组件 |
| `src/components/canvas/SearchPanel.tsx` | ❌ 新建 | 下拉搜索结果面板 |
| `src/components/canvas/__tests__/CanvasSearchBar.test.tsx` | ❌ 新建 | 集成测试 |
| `src/stores/canvasSearchStore.test.ts` | ❌ 新建 | 单元测试 |

### canvasSearchStore push 策略
workspace 中 `canvasSearchStore.ts` (5779b) 已完整实现。需：
1. `git checkout -b epic/s59-e1-canvas-search origin/main`
2. 从 workspace 复制 canvasSearchStore.ts → 提交
3. `git push -u origin epic/s59-e1-canvas-search`
4. `git fetch origin main && git merge --no-ff` 或 cherry-pick

---

## E2: 评论实时通知

### 架构图
```
WebSocket Server
  └─ message.type = 'comment:created' | 'comment:resolved'
        │
        ▼
wsCommentHandler.ts (新建)
  └─ ws.on('comment:created', payload => {
        commentStore.addComment(...)
        commentStore.getState().notifyListeners()
      })
        │
        ▼
commentStore (已存在 S49/S50, on main)
  └─ _commentListeners: Set<(event)=>void>
      addListener / removeListener / notifyListeners
        │
        ▼
NotificationBell (S57-E5 部分实现)
  └─ commentStore.subscribe → unreadCount badge
```

### 跨 Epic 集成点
- E2-E5: NotificationBell 图标触发 NotificationPanel

### 文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/stores/dds/commentStore.ts` | ✅ on main (S49/S50, 7624b) | 已有 addListener/removeListener |
| `src/lib/ws/wsCommentHandler.ts` | ❌ 新建 | WebSocket handler，订阅 comment 事件 |
| `src/lib/ws/wsCommentHandler.test.ts` | ❌ 新建 | 单元测试 |
| `src/components/dds/notifications/NotificationBell.tsx` | ⚠️ 需扩展 | 集成 unreadCount badge |
| `src/components/dds/notifications/NotificationBell.test.tsx` | ❌ 新建 | 测试 |

### wsCommentHandler 消息类型
```typescript
type WSCommentMessage =
  | { type: 'comment:created'; payload: { comment: Comment } }
  | { type: 'comment:resolved'; payload: { commentId: string } }
  | { type: 'comment:deleted'; payload: { commentId: string } }
```

---

## E3: 画布节点自动布局

### 架构图
```
DDSToolbar: "自动排版" 按钮
  └─ layoutStore.applyAutoLayout(nodes, edges)
        │
        ▼
computeLayout.ts (dagre)
  └─ g.dagre.setGraph({ rankdir: 'TB' })
      g.dagre.setNodes(nodes.map(n => ({ id: n.id, width: 120, height: 80 })))
      g.dagre.setEdges(edges.map(e => ({ ... })))
      g.dagre.run()
      返回更新后的节点 position[]
        │
        ▼
DDSDrawflow: applyNodeChanges([{ type: 'replace', item: node }])
```

### 文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/canvas/computeLayout.ts` | ❌ 新建 | dagre 布局算法封装 |
| `src/lib/canvas/computeLayout.test.ts` | ❌ 新建 | 边界测试 |
| `src/stores/dds/layoutStore.ts` | ❌ 新建 | layoutMode 状态 + applyAutoLayout |
| `src/stores/dds/layoutStore.test.ts` | ❌ 新建 | 状态测试 |
| `src/components/dds/DDSToolbar.tsx` | ⚠️ 扩展 | 添加自动排版按钮 |
| `src/hooks/dds/useKeyboardShortcuts.ts` | ⚠️ 扩展 | Cmd+L 快捷键 |

### dagre 安装
```bash
cd vibex-fronted
npm install --save-dev @types/dagre
```

---

## E4: 模板批量导入/导出

### 架构图
```
TemplatePanel
  ├─ Export All 按钮 → templateStore.exportTemplates() → JSON download
  └─ Import 按钮 → <input type=file> → templateStore.importTemplates(data, strategy)
                                              │
                                              ▼
                                    IndexedDB templateDB
                                    (templateStore 已存在 on main)
```

### 文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/stores/dds/templateStore.ts` | ✅ on main (S54-E5, Template Gallery) | 已有 CRUD，需扩展 export/import |
| `src/stores/dds/templateStore.test.ts` | ⚠️ 扩展 | 新增 export/import 测试 |
| `src/components/dds/templates/TemplatePanel.tsx` | ⚠️ 扩展 | 添加 Export All / Import 按钮 |
| `src/components/dds/templates/ImportConflictDialog.tsx` | ❌ 新建 | 冲突处理对话框 |
| `src/components/dds/templates/__tests__/TemplatePanel.test.tsx` | ⚠️ 扩展 | 新增按钮测试 |

### ExportData 接口
```typescript
interface ExportData {
  version: string;        // semver, e.g., "1.0.0"
  exportedAt: string;     // ISO 8601
  templates: Template[];
}
```

---

## E5: 键盘快捷键扩展

### 架构图
```
App Layout (_app.tsx / layout.tsx)
  └─ useGlobalShortcuts() hook
        │
        ▼
shortcutRegistry (新建，基于 shortcutManager.ts S49-E3)
  └─ Map<shortcut, { handler, page? }[]>
      register(shortcut, handler, page?)
      unregister(shortcut, handler)
      handleKeyDown(event) → matched handlers

CanvasListPage
  └─ useEffect: shortcutRegistry.register('j', handleDown, 'canvasList')
                              register('k', handleUp, 'canvasList')
                              register('Enter', handleOpen, 'canvasList')
                              register('n', handleNew, 'canvasList')
```

### 文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/keyboard/shortcutManager.ts` | ✅ on main (S49-E3) | 已有全局快捷键管理 |
| `src/lib/keyboard/shortcutRegistry.ts` | ❌ 新建 | 页面 scope 隔离的 registry |
| `src/lib/keyboard/shortcutRegistry.test.ts` | ❌ 新建 | 注册/注销/冲突测试 |
| `src/hooks/useGlobalShortcuts.ts` | ❌ 新建 | layout 层全局监听 hook |
| `src/components/canvas-list/CanvasListPage.tsx` | ⚠️ 扩展 | J/K/Enter/N/D 快捷键 |
| `src/hooks/__tests__/useGlobalShortcuts.test.ts` | ❌ 新建 | hook 测试 |

---

## 技术债务与风险

| 风险 | 缓解 |
|------|------|
| canvasSearchStore workspace → main push 失败 | 先 push feature branch，cherry-pick 到 main |
| wsCommentHandler 与现有 wsConflictHandler 事件格式不一致 | 统一 WSCommentMessage interface |
| dagre 循环边布局效果差 | 先处理无环子图，循环边保持原位 |
| template export JSON 过大 | 使用 Blob download，不走 IndexedDB |
| shortcutRegistry 与 shortcutManager 重复 | shortcutRegistry 委托 shortcutManager，添加 page scope |
