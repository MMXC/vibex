# VibeX Sprint59 实施计划

> **日期**: 2026-06-03
> **项目**: vibex-proposals-sprint59
> **架构**: coord (self-impl)

---

## E1: 画布全局搜索

### DoD 清单
- [ ] E1.1: `canvasSearchStore.ts` 推送至 origin/main（workspace 已实现）
- [ ] E1.2: `CanvasSearchBar.tsx` 搜索框组件，Header 右侧集成
- [ ] E1.3: `SearchPanel.tsx` 下拉面板，Cmd+K 快捷键触发
- [ ] E1.4: `DDSCanvasPage.tsx` 集成 CanvasSearchBar
- [ ] E1.5: `CanvasSearchBar.test.tsx` 覆盖 open/close/search/results 交互

### 新增文件
- `src/components/canvas/CanvasSearchBar.tsx`
- `src/components/canvas/SearchPanel.tsx`
- `src/components/canvas/__tests__/CanvasSearchBar.test.tsx`

### 扩展文件
- `src/stores/canvasSearchStore.ts`（push to main）
- `src/app/canvas/[id]/page.tsx`（集成 CanvasSearchBar）

### 关键实现
1. `canvasSearchStore` push 策略: `git push origin <workspace-sha>:refs/heads/epic/s59-e1-canvas-search`
2. Cmd+K: `useEffect` + `document.addEventListener('keydown', handler)`，在 `SearchPanel` 卸载时移除

---

## E2: 评论实时通知

### DoD 清单
- [ ] E2.1: `wsCommentHandler.ts` 新建，处理 `comment:created`/`comment:resolved`/`comment:deleted`
- [ ] E2.2: `commentStore` 的 `addListener` 订阅 `wsCommentHandler` 事件
- [ ] E2.3: `NotificationBell.tsx` 扩展，读取 `commentStore.unreadCount` badge
- [ ] E2.4: WebSocket 连接初始化时注册 wsCommentHandler
- [ ] E2.5: `wsCommentHandler.test.ts` 覆盖事件路由 + error handling

### 新增文件
- `src/lib/ws/wsCommentHandler.ts`
- `src/lib/ws/wsCommentHandler.test.ts`

### 扩展文件
- `src/stores/dds/commentStore.ts`（已有 addListener，扩展 notifyListeners 调用点）
- `src/components/dds/notifications/NotificationBell.tsx`

### 关键实现
```typescript
// wsCommentHandler.ts
ws.on('comment:created', ({ comment }) => {
  commentStore.getState().addComment(comment.nodeId, comment.text, comment.author);
  commentStore.getState().notifyListeners({ type: 'comment:created', comment });
});
```

---

## E3: 画布节点自动布局

### DoD 清单
- [ ] E3.1: `npm install --save-dev @types/dagre`
- [ ] E3.2: `computeLayout.ts` — dagre 布局算法封装
- [ ] E3.3: `layoutStore.ts` — layoutMode 状态 + applyAutoLayout action
- [ ] E3.4: DDSToolbar 添加"自动排版"按钮
- [ ] E3.5: `useKeyboardShortcuts` 扩展，监听 Cmd+L
- [ ] E3.6: `computeLayout.test.ts` 覆盖正常/空/单节点场景
- [ ] E3.7: `layoutStore.test.ts` 覆盖状态转换

### 新增文件
- `src/lib/canvas/computeLayout.ts`
- `src/lib/canvas/computeLayout.test.ts`
- `src/stores/dds/layoutStore.ts`
- `src/stores/dds/layoutStore.test.ts`

### 扩展文件
- `src/components/dds/DDSToolbar.tsx`
- `src/hooks/dds/useKeyboardShortcuts.ts`

### 关键实现
```typescript
// computeLayout.ts
import dagre from '@types/dagre';

export function computeLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach(n => g.setNode(n.id, { width: 120, height: 80 }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const { x, y } = g.node(n.id);
    return { ...n, position: { x, y } };
  });
}
```

---

## E4: 模板批量导入/导出

### DoD 清单
- [ ] E4.1: `templateStore` 新增 `exportTemplates()` action → `ExportData` JSON
- [ ] E4.2: `templateStore` 新增 `importTemplates(data: ExportData, strategy: 'skip'|'overwrite'|'rename')`
- [ ] E4.3: TemplatePanel 添加 Export All 按钮（Blob download）
- [ ] E4.4: TemplatePanel 添加 Import 按钮（`<input type="file">`）
- [ ] E4.5: `ImportConflictDialog.tsx` 冲突处理（skip/overwrite/rename）
- [ ] E4.6: `templateStore.test.ts` 扩展 export/import 测试
- [ ] E4.7: vitest 100% 通过

### 扩展文件
- `src/stores/dds/templateStore.ts`（新增 export/import actions）
- `src/components/dds/templates/TemplatePanel.tsx`（新增按钮）
- `src/stores/dds/templateStore.test.ts`（新增测试）

### 新增文件
- `src/components/dds/templates/ImportConflictDialog.tsx`

### 关键实现
```typescript
// Export
exportTemplates(): ExportData {
  const templates = this.getState().templates;
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    templates,
  };
}

// Download
const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// trigger <a download="templates.json" href={url}>
```

---

## E5: 键盘快捷键扩展

### DoD 清单
- [ ] E5.1: `shortcutRegistry.ts` — 基于 shortcutManager，添加 page scope
- [ ] E5.2: `useGlobalShortcuts.ts` — layout 层注册全局监听
- [ ] E5.3: CanvasListPage 页面 J/K/Enter/N/D 快捷键
- [ ] E5.4: `shortcutRegistry.test.ts` — 注册/注销/冲突检测测试
- [ ] E5.5: `useGlobalShortcuts.test.ts` — hook 测试

### 新增文件
- `src/lib/keyboard/shortcutRegistry.ts`
- `src/lib/keyboard/shortcutRegistry.test.ts`
- `src/hooks/useGlobalShortcuts.ts`
- `src/hooks/__tests__/useGlobalShortcuts.test.ts`

### 扩展文件
- `src/components/canvas-list/CanvasListPage.tsx`

### 关键实现
```typescript
// shortcutRegistry.ts
const registry = new Map<string, Array<{ handler: () => void; page?: string }>>();

function register(shortcut: string, handler: () => void, page?: string): void {
  const key = normalizeShortcut(shortcut);
  if (!registry.has(key)) registry.set(key, []);
  registry.get(key)!.push({ handler, page });
  shortcutManager.register(shortcut, (e) => {
    const handlers = registry.get(key) || [];
    handlers.filter(h => !h.page || h.page === currentPage).forEach(h => h.handler(e));
  });
}
```

---

## 实施顺序

**Phase 1（独立，无依赖）**:
- E5 → 快捷键系统（其他 Epic 可以直接使用 shortcutRegistry）

**Phase 2（依赖 Phase 1）**:
- E3 → 自动布局（使用 E5 的 shortcutRegistry）
- E1 → 搜索（无依赖）
- E2 → 评论通知（无依赖）

**Phase 3（依赖 Phase 1+2）**:
- E4 → 模板导入/导出（无依赖，但可选在 E1 后做）

---

## 测试策略

| Epic | 测试文件 | 测试数量 |
|------|---------|---------|
| E1 | CanvasSearchBar.test.tsx + canvasSearchStore.test.ts | ~15 |
| E2 | wsCommentHandler.test.ts + NotificationBell.test.tsx | ~10 |
| E3 | computeLayout.test.ts + layoutStore.test.ts | ~12 |
| E4 | templateStore.test.ts（扩展） | ~8 新增 |
| E5 | shortcutRegistry.test.ts + useGlobalShortcuts.test.ts | ~10 |

**质量门槛**: 所有 epic vitest 100% 通过，vitest 在 origin/main 上运行。
