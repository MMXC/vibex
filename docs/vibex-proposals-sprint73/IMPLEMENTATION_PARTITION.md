# VibeX Sprint73 Implementation Partition

**Sprint**: Sprint73
**版本**: 1.0
**日期**: 2026-06-07

---

## Epic 分区

| Epic | 功能 | 优先级 | 复杂度 | 主要新增文件 |
|------|------|--------|--------|-------------|
| E1 | 画布内容全文搜索 | P0 | 中 | `CanvasSearchPanel.tsx` + 扩展 `canvasSearchStore.ts` |
| E2 | 模板节点导入画布 | P0 | 中 | `ImportTemplateModal.tsx` + 扩展 `templateStore.ts` |
| E3 | 通知管理与历史 | P1 | 低 | `NotificationSettingsDrawer.tsx` + 扩展 `notificationStore.ts` |
| E4 | 画布分支命名与保护 | P1 | 中 | 扩展 `historyDB.ts` (v5) + `canvasHistoryStore.ts` + `HistoryPanel.tsx` |
| E5 | AI 会话导出与分享 | P2 | 低 | 扩展 `collabSessionStore.ts` + `SessionReplayPanel.tsx` |

---

## E1: 画布内容全文搜索

### DoD Checklist
- [ ] `src/stores/dds/canvasSearchStore.ts` 新增 `searchNodes(query)` 方法（同步，基于现有 `searchNodeContent` 的索引逻辑）
- [ ] 新建 `src/components/dds/canvas/CanvasSearchPanel.tsx`（浮层组件，支持输入框+实时结果列表+点击跳转）
- [ ] 全局 `Cmd/Ctrl+F` 快捷键绑定（通过 `useKeyboardShortcuts` hook）打开 `CanvasSearchPanel`
- [ ] 搜索结果点击后画布自动滚动到对应节点位置
- [ ] `src/stores/dds/__tests__/canvasSearchStore.test.ts` 扩展覆盖 `searchNodes`（空查询/无结果/多结果）
- [ ] 新建 `src/components/dds/canvas/__tests__/CanvasSearchPanel.test.tsx` 集成测试

### 新增/扩展文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/stores/dds/canvasSearchStore.ts` | 扩展 | 新增 `searchNodes(query)` 方法 |
| `src/components/dds/canvas/CanvasSearchPanel.tsx` | 新建 | 搜索浮层面板 |
| `src/components/dds/canvas/__tests__/CanvasSearchPanel.test.tsx` | 新建 | 组件集成测试 |
| `src/stores/dds/__tests__/canvasSearchStore.test.ts` | 扩展 | 新增 `searchNodes` 测试用例 |

### expect() 断言示例
```typescript
// canvasSearchStore
expect(store.searchNodes('test')).toEqual([])
const results = store.searchNodes('节点')
expect(results.length).toBeGreaterThan(0)
expect(results[0]).toHaveProperty('nodeId')
```

---

## E2: 模板节点导入画布

### DoD Checklist
- [ ] `src/lib/canvas/templateStore.ts` 新增 `importTemplateToCanvas(templateId, position)` action
- [ ] 导入节点分配新 UUID，生成节点 ID 映射表（源ID→新ID）
- [ ] 导入的边保持相对位置关系，引用通过映射表更新指向新节点 ID
- [ ] `TemplatePreviewPanel` 底部新增「导入画布」按钮
- [ ] 新建 `src/components/dds/templates/ImportTemplateModal.tsx` 支持导入模式选择（仅节点 / 节点+边）
- [ ] 导入后画布自动刷新显示新节点
- [ ] `src/stores/__tests__/templateStore.test.ts` 扩展覆盖 `importTemplateToCanvas`（空模板/正常/ID冲突）
- [ ] 新建 `src/components/dds/templates/__tests__/ImportTemplateModal.test.tsx` 集成测试

### 新增/扩展文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/canvas/templateStore.ts` | 扩展 | 新增 `importTemplateToCanvas` action |
| `src/components/dds/templates/TemplatePreviewPanel.tsx` | 扩展 | 底部新增导入按钮 |
| `src/components/dds/templates/ImportTemplateModal.tsx` | 新建 | 导入模式选择对话框 |
| `src/stores/__tests__/templateStore.test.ts` | 扩展 | 新增 `importTemplateToCanvas` 测试 |
| `src/components/dds/templates/__tests__/ImportTemplateModal.test.tsx` | 新建 | 模态框集成测试 |

### expect() 断言示例
```typescript
// templateStore
const result = store.importTemplateToCanvas('tpl-1', { x: 0, y: 0 })
expect(result).toHaveProperty('nodes')
expect(result.nodes.length).toBeGreaterThan(0)
// UUID 不冲突
const originalId = 'node-old-1'
const newId = result.idMap[originalId]
expect(newId).toBeDefined()
expect(newId).not.toEqual(originalId)
```

---

## E3: 通知管理与历史

### DoD Checklist
- [ ] `NotificationPanel` header 新增「全部标为已读」按钮，调用 `notificationStore.markAllAsRead()`
- [ ] `NotificationPanel` header 新增「清空历史」按钮，调用 `notificationStore.clearAll()`
- [ ] 未读计数徽章实时更新（`getUnreadCount()`）
- [ ] 新建 `src/components/dds/notifications/NotificationSettingsDrawer.tsx` 支持推送渠道开关和类型开关
- [ ] 设置偏好保存至 localStorage（`notificationStore` persist middleware）
- [ ] `src/stores/__tests__/notificationStore.test.ts` 扩展覆盖 `markAllAsRead`/`clearAll`/`getUnreadCount`
- [ ] `NotificationPanel` 集成测试扩展

### 新增/扩展文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/stores/notificationStore.ts` | 扩展 | 新增 `markAllAsRead`/`clearAll`/`getUnreadCount` |
| `src/components/dds/notifications/NotificationPanel.tsx` | 扩展 | header 新增两个操作按钮 |
| `src/components/dds/notifications/NotificationSettingsDrawer.tsx` | 新建 | 通知偏好设置抽屉 |
| `src/stores/__tests__/notificationStore.test.ts` | 扩展 | 新增上述方法测试 |

### expect() 断言示例
```typescript
// notificationStore
const count = store.markAllAsRead()
expect(count).toBeGreaterThan(0)
expect(store.getUnreadCount()).toBe(0)
const cleared = store.clearAll()
expect(cleared).toBe(0)
expect(store.notifications.length).toBe(0)
```

---

## E4: 画布分支命名与保护

### DoD Checklist
- [ ] `historyDB` 新增 `branchMeta` 表（DB_VERSION=5 upgrade），存储 `canvasId`/`branchName`/`name`/`isProtected`/`createdAt`
- [ ] `canvasHistoryStore` 新增 `setBranchName(canvasId, branchName, name)` action
- [ ] `canvasHistoryStore` 新增 `setBranchProtected(canvasId, branchName, isProtected)` action
- [ ] `canvasHistoryStore` 新增 `getBranchMeta(canvasId, branchName)` selector
- [ ] `HistoryPanel` 分支列表支持 inline 名称编辑
- [ ] `HistoryPanel` 分支列表显示 🔒 保护标记，toggle 点击切换保护状态
- [ ] 保护分支执行删除操作时弹出 `window.confirm()` 确认框
- [ ] `src/lib/canvas/historyDB.test.ts` 扩展覆盖 branchMeta CRUD

### 新增/扩展文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/canvas/historyDB.ts` | 扩展 | DB_VERSION=5，新增 branchMeta objectStore |
| `src/stores/dds/canvasHistoryStore.ts` | 扩展 | 新增 branchName/branchProtected 方法 |
| `src/components/dds/history/HistoryPanel.tsx` | 扩展 | 分支列表 UI 增强 |
| `src/lib/canvas/historyDB.test.ts` | 扩展 | branchMeta CRUD 测试 |

### expect() 断言示例
```typescript
// historyDB
const meta = { name: '主分支', isProtected: true, createdAt: Date.now() }
const ok = await db.setBranchMeta('c1', 'main', meta)
expect(ok).toBeTruthy()
const loaded = await db.getBranchMeta('c1', 'main')
expect(loaded.isProtected).toBe(true)
const list = await db.listBranchMetas('c1')
expect(list.length).toBeGreaterThan(0)
```

---

## E5: AI 会话导出与分享

### DoD Checklist
- [ ] `collabSessionStore` 新增 `exportSessionMarkdown(sessionId)` action，返回格式化 Markdown 字符串
- [ ] `collabSessionStore` 新增 `exportSessionPDF(sessionId)` action，调用 `window.print()`
- [ ] `SessionReplayPanel` header 新增「导出」下拉菜单（Markdown / PDF / 复制）
- [ ] Markdown 导出包含所有事件类型、时间戳、用户名称
- [ ] 复制功能使用 `navigator.clipboard.writeText()`
- [ ] `src/lib/collaboration/__tests__/collabSessionStore.test.ts` 扩展覆盖 `exportSessionMarkdown`

### 新增/扩展文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/collaboration/collabSessionStore.ts` | 扩展 | 新增 `exportSessionMarkdown`/`exportSessionPDF` |
| `src/components/canvas/features/SessionReplayPanel.tsx` | 扩展 | header 新增导出下拉菜单 |
| `src/lib/collaboration/__tests__/collabSessionStore.test.ts` | 扩展 | 新增导出测试 |

### expect() 断言示例
```typescript
// collabSessionStore
const md = store.exportSessionMarkdown('session-1')
expect(md).toContain('# Session: session-1')
expect(md).toContain('## Events')
expect(md).toContain('timestamp')
expect(md).toContain('userName')
```

---

## 测试命令

```bash
# E1
npx vitest run canvasSearchStore --reporter=verbose
npx vitest run CanvasSearchPanel --reporter=verbose

# E2
npx vitest run templateStore --reporter=verbose
npx vitest run ImportTemplateModal --reporter=verbose

# E3
npx vitest run notificationStore --reporter=verbose
npx vitest run NotificationPanel --reporter=verbose

# E4
npx vitest run historyDB --reporter=verbose

# E5
npx vitest run collabSessionStore --reporter=verbose
```
