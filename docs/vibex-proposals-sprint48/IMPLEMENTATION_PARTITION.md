# VibeX Sprint 48 实现分割方案

> **Date**: 2026-05-31
> **Author**: coord (heartbeat self-implement)
> **PRD**: `docs/vibex-proposals-sprint48/prd.md`
> **架构**: `docs/vibex-proposals-sprint48/architecture.md`

---

## Epic 实施顺序

Pipeline 顺序：E1 → E2 → E3 → E4 → E5

| Epic | 名称 | 实施建议 | 测试策略 |
|------|------|---------|---------|
| E1 | Canvas List 持久化 + 搜索增强 | P0，并行实现 | `useCanvasList.test.ts` |
| E2 | Canvas 导出 PDF + 批量导出 | P0，依赖 E1 | `useCanvasExport.test.ts` |
| E3 | 键盘快捷键可配置化 | P1，依赖 E1 | `ShortcutPanel.test.tsx` |
| E4 | AI Session 标签系统 + 收藏 | P1，并行 E3 | `agentStore.test.ts` |
| E5 | 剪贴板跨画布粘贴 | P1，依赖 E3 | `clipboardStore.test.ts` |

---

## E1: Canvas List 持久化 + 搜索增强

**代码目录**: `vibex-fronted/src/`
**Git 分支**: `origin/epic/s48-e1-canvas-list-persist` (需新建)

### 实施步骤

1. **canvasListStore.ts** — 添加 Zustand persist middleware
   ```typescript
   import { persist, createJSONStorage } from 'zustand/middleware'
   ```
   - 新增 `searchTerm: string` state
   - 新增 `filterCanvas(term: string)` action → 设置 searchTerm
   - 新增 `thumbnails: Record<string, string>` 缓存 map
   - persist config: `storage: createJSONStorage(() => localStorage)`

2. **CanvasListPanel.tsx** — 搜索输入框 + 实时过滤
   - 添加 `<input type="text" placeholder="Search canvases...">` 
   - 绑定 `searchTerm` → 调用 `filterCanvas()`
   - 过滤展示：`filteredCanvases = canvases.filter(c => c.name.includes(searchTerm))`

3. **thumbnail.ts** — 缩略图缓存逻辑
   - `getThumbnail(canvasId)` → 检查 thumbnails[canvasId]，存在则返回
   - `generateAndCache(canvasId)` → canvas.toDataURL() + 存入 thumbnails

4. **useCanvasList.ts** — 暴露 filteredCanvases, searchTerm, setSearchTerm

5. **Vitest**: `src/hooks/__tests__/useCanvasList.test.ts`
   - `test('persist: refresh restores canvas list')`
   - `test('search: filters canvases by name')`
   - `test('thumbnail cache: second render uses cache')`

### DoD 清单

- [ ] canvasListStore.ts 添加 persist middleware
- [ ] canvasListStore.ts 新增 filterCanvas action + searchTerm state
- [ ] CanvasListPanel.tsx 添加搜索输入框，实时过滤
- [ ] 缩略图缓存：同一 canvasId 只生成一次
- [ ] Vitest: `useCanvasList.test.ts` 新增 3 个测试
- [ ] dual-CHANGELOG 更新

---

## E2: Canvas 导出 PDF + 批量导出

**代码目录**: `vibex-fronted/src/`
**Git 分支**: `origin/epic/s48-e2-pdf-export` (需新建)

### 实施步骤

1. **useCanvasExport.ts** — 新增 exportAsPDF
   ```typescript
   export const exportAsPDF = async (options?: {
     scale?: number
     orientation?: 'portrait' | 'landscape'
   }) => {
     const { scale = 2, orientation = 'portrait' } = options || {}
     const canvas = document.querySelector('.react-flow') as HTMLCanvasElement
     const imgData = canvas.toDataURL('image/png')
     const { jsPDF } = await import('jspdf')
     const doc = new jsPDF({ orientation, unit: 'px', format: [canvas.width / scale, canvas.height / scale] })
     doc.addImage(imgData, 'PNG', 0, 0)
     doc.save('canvas-export.pdf')
   }
   ```

2. **ExportMenu.tsx** — 添加 PDF 选项
   - 添加 `exportAsPDF()` 菜单项

3. **canvasListStore.ts** — 多选支持
   - 新增 `selectedCanvasIds: Set<string>` state
   - 新增 `toggleSelect(canvasId: string)` action

4. **CanvasListPanel.tsx** — 多选 UI
   - 每行左侧添加 Checkbox
   - 添加 "Export Selected" 按钮（selectedCanvasIds.size > 0 时显示）
   - 批量导出：遍历 selectedCanvasIds，生成 ZIP 或多页 PDF

5. **批量导出**: `exportBatchPDF(canvasIds: string[])`
   - 每个 canvas 调用 `exportAsPDF()`
   - 合并为多页 PDF 或生成 ZIP

6. **Vitest**: `useCanvasExport.test.ts` — `test('exportAsPDF: generates PDF blob')`

### DoD 清单

- [ ] useCanvasExport.ts 新增 exportAsPDF()
- [ ] ExportMenu.tsx 添加 "Export as PDF" 菜单项
- [ ] canvasListStore 新增 selectedCanvasIds + toggleSelect
- [ ] CanvasListPanel 添加 Checkbox 多选 + "Export Selected" 按钮
- [ ] Vitest: useCanvasExport.test.ts 新增 PDF 测试
- [ ] dual-CHANGELOG 更新

---

## E3: 键盘快捷键可配置化

**代码目录**: `vibex-fronted/src/`
**Git 分支**: `origin/epic/s48-e3-shortcut-config` (需新建)

### 实施步骤

1. **userPreferencesStore.ts** — 确认已有 `shortcutCustomization[]` + `setShortcutCustomization()`
   - 无需修改 store

2. **useKeyboardShortcuts.ts** — 优先读取 customizations
   ```typescript
   const customizations = useUserPreferences(s => s.shortcutCustomization)
   const getKey = (action: string) => 
     customizations.find(c => c.action === action)?.keys ?? DEFAULT_SHORTCUTS[action]
   ```

3. **ShortcutPanel.tsx** — 编辑模式 + 冲突警告
   - 点击 `<kbd>` → 显示 `<input keydown capture>` overlay
   - `keydown` 监听：记录 key combination
   - 调用 `setShortcutCustomization(updatedCustomizations)`
   - 冲突检测：`updatedCustomizations.filter(c => c.keys === newKeys).length > 1`
   - 冲突 UI：红色文字 + "⚠️ Conflict"

4. **i18n** — `src/i18n/messages/en.json` + `zh.json`
   - 新增 `shortcuts.customize`, `shortcuts.conflict`, `shortcuts.conflictDesc`

5. **Vitest**: `ShortcutPanel.test.tsx`
   - `test('edit mode: clicking kbd enters edit')`
   - `test('conflict: duplicate key shows warning')`

### DoD 清单

- [ ] useKeyboardShortcuts 优先读取 userPreferencesStore.shortcutCustomization
- [ ] ShortcutPanel 添加编辑模式（点击 kbd → input → keydown capture → 保存）
- [ ] 冲突检测 + 红色警告 UI
- [ ] i18n keys: shortcuts.customize, shortcuts.conflict, shortcuts.conflictDesc
- [ ] Vitest: ShortcutPanel.test.tsx 新增 2 个测试
- [ ] dual-CHANGELOG 更新

---

## E4: AI Session 标签系统 + 收藏

**代码目录**: `vibex-fronted/src/`
**Git 分支**: `origin/epic/s48-e4-session-tags` (需新建)

### 实施步骤

1. **agentStore.ts** — 扩展 Session interface + 新增 actions
   ```typescript
   interface AISession {
     // ...existing
     tags: string[]
     isFavorite: boolean
   }
   
   toggleFavorite: (sessionId) => set(s => ({
     sessions: s.sessions.map(sess =>
       sess.id === sessionId ? { ...sess, isFavorite: !sess.isFavorite } : sess
     )
   }))
   addTag: (sessionId, tag) => set(s => ({
     sessions: s.sessions.map(sess =>
       sess.id === sessionId && !sess.tags.includes(tag)
         ? { ...sess, tags: [...sess.tags, tag] } : sess
     )
   }))
   removeTag: (sessionId, tag) => set(s => ({
     sessions: s.sessions.map(sess =>
       sess.id === sessionId ? { ...sess, tags: sess.tags.filter(t => t !== tag) } : sess
     )
   }))
   ```

2. **AgentSessions.tsx** — 收藏优先排序
   - `sessions.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))`

3. **AgentSessionItem** — 收藏按钮 + 标签 UI
   - 收藏按钮（⭐ icon）：调用 `agentStore.toggleFavorite(sessionId)`
   - 标签 chip 列表展示
   - 标签输入（点击 + 按钮展开）

4. **Vitest**: `agentStore.test.ts`
   - `test('toggleFavorite: flips isFavorite')`
   - `test('addTag: appends tag to session')`
   - `test('removeTag: filters tag from session')`

### DoD 清单

- [ ] agentStore Session interface 新增 tags + isFavorite
- [ ] agentStore 新增 toggleFavorite, addTag, removeTag actions
- [ ] AgentSessions 列表按 isFavorite 降序
- [ ] AgentSessionItem 添加收藏星标按钮
- [ ] AgentSessionItem 添加标签 chip 展示 + 标签输入
- [ ] Vitest: agentStore.test.ts 新增 3 个测试
- [ ] dual-CHANGELOG 更新

---

## E5: 剪贴板跨画布粘贴

**代码目录**: `vibex-fronted/src/`
**Git 分支**: `origin/epic/s48-e5-cross-canvas-paste` (需新建)

### 实施步骤

1. **clipboardStore.ts** — 新增 crossCanvasPaste
   ```typescript
   crossCanvasPaste: (targetCanvasId) => {
     const cards = get().copiedCards
     const targetStore = canvasStoreRegistry.get(targetCanvasId)
     if (!targetStore) throw new Error(`Canvas ${targetCanvasId} not found`)
     targetStore.getState().addCards(cards)
   }
   ```

2. **canvasListStore.ts** — pasteToCanvas action
   - `pasteToCanvas: (canvasId) => clipboardStore.getState().crossCanvasPaste(canvasId)`

3. **CanvasListPanel.tsx** — "Paste Here" 操作按钮
   - 仅当 clipboardStore.copiedCards.length > 0 时显示
   - 调用 `canvasListStore.pasteToCanvas(canvasId)`

4. **clipboard badge** — DDSToolbar 或 ClipboardMenu 显示 copiedCards.length

5. **Vitest**: `clipboardStore.test.ts`
   - `test('crossCanvasPaste: adds cards to target canvas store')`

### DoD 清单

- [ ] clipboardStore 新增 crossCanvasPaste(targetCanvasId) action
- [ ] canvasListStore 新增 pasteToCanvas(canvasId) action
- [ ] CanvasListPanel 添加 "Paste Here" 按钮（clipboard 非空时显示）
- [ ] clipboard badge 显示 copiedCards.length
- [ ] Vitest: clipboardStore.test.ts 新增跨画布粘贴测试
- [ ] dual-CHANGELOG 更新

---

## 测试策略

| Epic | 测试文件 | 关键测试 | 命令 |
|------|---------|---------|------|
| E1 | `useCanvasList.test.ts` | persist 恢复, 搜索过滤, 缩略图缓存 | `npx vitest run src/hooks/__tests__/useCanvasList.test.ts` |
| E2 | `useCanvasExport.test.ts` | PDF blob 生成, 多选状态 | `npx vitest run src/hooks/canvas/useCanvasExport.test.ts` |
| E3 | `ShortcutPanel.test.tsx` | 编辑模式, 冲突警告 | `npx vitest run src/components/dds/toolbar/ShortcutPanel.test.tsx` |
| E4 | `agentStore.test.ts` | toggleFavorite, addTag, removeTag | `npx vitest run src/stores/__tests__/agentStore.test.ts` |
| E5 | `clipboardStore.test.ts` | crossCanvasPaste | `npx vitest run src/stores/__tests__/clipboardStore.test.ts` |

**回归测试**: `npx vitest run src/stores/dds/__tests__/DDSCanvasStore.test.ts` (57 tests)
