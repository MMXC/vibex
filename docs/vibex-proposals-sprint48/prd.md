# VibeX Sprint 48 PRD

> **Date**: 2026-05-31
> **Author**: coord (heartbeat self-implement)
> **Analyst Output**: `proposals/20260531/analyst.md`
> **Analysis**: `docs/vibex-proposals-sprint48/analysis.md`

---

## Epic 1: Canvas 列表持久化 + 搜索增强

**Epic ID**: S48-P001-E1
**名称**: Canvas List 持久化 + 搜索增强
**所属提案**: P001
**页面集成**: `src/components/canvas/CanvasListPanel.tsx` | `src/stores/canvasListStore.ts`

### 功能描述

CanvasListPanel 展示用户所有画布。Sprint47 E4 实现了内存 store（Zustand），刷新页面后列表消失。本 Epic 扩展为持久化存储 + 实时搜索过滤。

### 用户故事

| ID | 用户故事 | 验收标准 |
|----|---------|---------|
| US1 | 作为用户，我希望画布列表在刷新后依然存在 | 刷新页面后，CanvasListPanel 自动恢复上一次打开时的画布列表 |
| US2 | 作为用户，我希望搜索画布名称来快速定位 | 输入关键词后，列表实时过滤，只显示名称包含关键词的画布 |
| US3 | 作为用户，我希望缩略图被缓存以加快加载 | 同一画布第二次打开时，缩略图从缓存读取，无重新生成延迟 |

### DoD 清单

- [ ] `canvasListStore.ts` 添加 Zustand `persist` middleware，刷新页面后 store 自动恢复
- [ ] `canvasListStore.ts` 新增 `filterCanvas(searchTerm: string)` action
- [ ] `canvasListStore.ts` 新增 `thumbnails: Record<string, string>` 缓存字段
- [ ] `CanvasListPanel.tsx` 添加搜索输入框（`<input type="text" placeholder="Search canvases...">`）
- [ ] `CanvasListPanel.tsx` 搜索框 value 绑定到 `searchTerm` state，实时过滤展示列表
- [ ] 缩略图缓存命中判断：若 `thumbnails[canvasId]` 存在，直接使用；否则生成并存入
- [ ] Vitest: `src/hooks/__tests__/useCanvasList.test.ts` 新增 `test('persist: refresh restores canvas list')` 和 `test('search: filters canvases by name')`
- [ ] dual-CHANGELOG 更新

### expect() 断言

```typescript
// useCanvasList.test.ts
test('persist: refresh restores canvas list', async () => {
  const { result } = renderHook(() => useCanvasList())
  await waitFor(() => {
    expect(result.current.canvases.length).toBeGreaterThan(0)
  })
  // Simulate store rehydration
  const rehydrated = renderHook(() => useCanvasList())
  expect(rehydrated.result.current.canvases).toEqual(result.current.canvases)
})

test('search: filters canvases by name', () => {
  const { result } = renderHook(() => useCanvasList())
  act(() => { result.current.setSearchTerm('test') })
  expect(result.current.filteredCanvases.every(c => c.name.includes('test'))).toBe(true)
})
```

---

## Epic 2: Canvas 导出 PDF + 批量导出

**Epic ID**: S48-P001-E2
**名称**: Canvas 导出 PDF + 批量导出
**所属提案**: P002
**页面集成**: `src/components/dds/toolbar/ExportMenu.tsx` | `src/hooks/canvas/useCanvasExport.ts`

### 功能描述

Sprint47 E5 实现了 PNG 分辨率和 Figma export。Sprint48 E2 扩展 PDF 导出和批量导出功能。

### 用户故事

| ID | 用户故事 | 验收标准 |
|----|---------|---------|
| US4 | 作为用户，我希望将画布导出为 PDF | ExportMenu 显示 "PDF" 选项，生成可下载 PDF 文件 |
| US5 | 作为用户，我希望选择 PDF 方向（横/竖） | PDF 导出弹窗包含方向选择器：Portrait / Landscape |
| US6 | 作为用户，我希望一次性导出多个画布 | CanvasListPanel 支持多选，批量导出为 ZIP 文件 |

### DoD 清单

- [ ] `useCanvasExport.ts` 新增 `exportAsPDF(options?: { scale?: number, orientation?: 'portrait' | 'landscape' }): Promise<void>`
- [ ] PDF 生成使用 `jsPDF`（已安装）+ `html2canvas` 将 Canvas DOM 转图片后嵌入
- [ ] ExportMenu.tsx 添加 "Export as PDF" 菜单项
- [ ] PDF 导出后端（如需要）：`/api/export/pdf` route 扩展 orientation 参数
- [ ] `canvasListStore.ts` 新增 `selectedCanvasIds: Set<string>` 和 `toggleSelect(canvasId: string)` action
- [ ] CanvasListPanel 添加多选 Checkbox 列（每行左侧）
- [ ] CanvasListPanel 添加 "Export Selected" 按钮（选中了 ≥1 时显示）
- [ ] 批量导出：收集选中的 canvas thumbnail，生成 PDF 合并文件或 ZIP
- [ ] Vitest: `useCanvasExport.test.ts` 新增 PDF export 测试
- [ ] dual-CHANGELOG 更新

### expect() 断言

```typescript
// useCanvasExport.test.ts
test('exportAsPDF: generates PDF blob', async () => {
  const { result } = renderHook(() => useCanvasExport())
  const blob = await result.current.exportAsPDF({ orientation: 'landscape' })
  expect(blob.type).toBe('application/pdf')
  expect(blob.size).toBeGreaterThan(0)
})

test('canvasListStore: toggleSelect adds and removes canvas IDs', () => {
  const store = create(canvasListStore)
  store.getState().toggleSelect('canvas-1')
  expect(store.getState().selectedCanvasIds.has('canvas-1')).toBe(true)
  store.getState().toggleSelect('canvas-1')
  expect(store.getState().selectedCanvasIds.has('canvas-1')).toBe(false)
})
```

---

## Epic 3: 键盘快捷键可配置化

**Epic ID**: S48-P001-E3
**名称**: 键盘快捷键可配置化
**所属提案**: P003
**页面集成**: `src/components/dds/toolbar/ShortcutPanel.tsx` | `src/stores/userPreferencesStore.ts`

### 功能描述

Sprint47 E2 验证了固定快捷键。Sprint48 E3 扩展为可配置的快捷键系统。

### 用户故事

| ID | 用户故事 | 验收标准 |
|----|---------|---------|
| US7 | 作为用户，我希望自定义快捷键绑定 | ShortcutPanel 中点击快捷键标签，进入编辑模式，监听 keydown 保存新绑定 |
| US8 | 作为用户，我希望快捷键冲突时得到提示 | 同一快捷键被两个 action 绑定时，ShortcutPanel 显示红色警告文字 |

### DoD 清单

- [ ] `userPreferencesStore.ts` 新增 `shortcuts: Record<string, string>` 字段（key = action name, value = key combo）
- [ ] `shortcuts` 字段持久化到 IndexedDB（via `userPreferencesStore` persist middleware）
- [ ] `useKeyboardShortcuts` 优先读取 `userPreferencesStore.shortcuts`，fallback 到默认值
- [ ] ShortcutPanel.tsx 添加快捷键编辑模式：点击 `<kbd>` 元素 → 显示 `<input>` 覆盖 → 监听 `keydown` → 保存
- [ ] 冲突检测：`Object.entries(shortcuts).filter(([, k]) => k === newKey).length > 1`
- [ ] 冲突 UI：编辑模式下快捷键标签变为红色文字 + "⚠️ Conflict" 文字
- [ ] `shortcuts` i18n namespace 新增 key：`'shortcuts.customize'`, `'shortcuts.conflict'`, `'shortcuts.conflictDesc'`
- [ ] Vitest: `ShortcutPanel.test.tsx` 新增编辑模式 + 冲突检测测试
- [ ] dual-CHANGELOG 更新

### expect() 断言

```typescript
// ShortcutPanel.test.tsx
test('customize: clicking shortcut enters edit mode', async () => {
  render(<ShortcutPanel />)
  const kbd = screen.getByText('Cmd+S')
  await userEvent.click(kbd)
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})

test('conflict: duplicate key shows warning', async () => {
  render(<ShortcutPanel shortcuts={{ save: 'Cmd+K', ai: 'Cmd+K' }} />)
  expect(screen.getByText(/conflict/i)).toBeInTheDocument()
})
```

---

## Epic 4: AI Session 标签系统 + 收藏

**Epic ID**: S48-P001-E4
**名称**: AI Session 标签系统 + 收藏
**所属提案**: P004
**页面集成**: `src/components/dds/ai/AgentSessions.tsx` | `src/stores/agentStore.ts`

### 功能描述

Sprint47 E1 实现了 AI Session 搜索。Sprint48 E4 扩展标签和收藏功能。

### 用户故事

| ID | 用户故事 | 验收标准 |
|----|---------|---------|
| US9 | 作为用户，我希望收藏重要 session | AgentSessions 每行有收藏按钮（⭐），点击切换 isFavorite |
| US10 | 作为用户，我希望给 session 打标签分类 | AgentSessionItem 支持标签输入，支持多标签 |
| US11 | 作为用户，我希望收藏的 session 排在最前 | AgentSessions 列表按 isFavorite 降序排列 |

### DoD 清单

- [ ] `agentStore.ts` session schema 新增 `tags: string[]` 和 `isFavorite: boolean` 字段
- [ ] `agentStore.ts` 新增 `toggleFavorite(sessionId: string)` action
- [ ] `agentStore.ts` 新增 `addTag(sessionId: string, tag: string)` 和 `removeTag(sessionId: string, tag: string)` actions
- [ ] AgentSessions 列表排序：`sessions.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))`
- [ ] AgentSessionItem 添加收藏按钮（⭐ icon，`userPreferencesStore.theme` 颜色）
- [ ] AgentSessionItem 添加标签展示（标签 chip 列表）+ 标签输入框（点击 + 按钮展开）
- [ ] Vitest: `agentStore.test.ts` 新增 tags/favorite 测试
- [ ] dual-CHANGELOG 更新

### expect() 断言

```typescript
// agentStore.test.ts
test('toggleFavorite: flips isFavorite boolean', () => {
  const store = create(agentStore)
  store.getState().toggleFavorite('session-1')
  const session = store.getState().sessions.find(s => s.id === 'session-1')
  expect(session?.isFavorite).toBe(true)
})

test('addTag: appends tag to session', () => {
  const store = create(agentStore)
  store.getState().addTag('session-1', 'important')
  const session = store.getState().sessions.find(s => s.id === 'session-1')
  expect(session?.tags).toContain('important')
})
```

---

## Epic 5: 剪贴板跨画布粘贴

**Epic ID**: S48-P001-E5
**名称**: 剪贴板跨画布粘贴
**所属提案**: P005
**页面集成**: `src/components/canvas/CanvasListPanel.tsx` | `src/stores/clipboardStore.ts`

### 功能描述

Sprint47 E3 实现了画布内节点复制/粘贴。Sprint48 E5 扩展为跨画布粘贴。

### 用户故事

| ID | 用户故事 | 验收标准 |
|----|---------|---------|
| US12 | 作为用户，我希望将节点粘贴到另一个画布 | CanvasListPanel 中有剪贴板内容的画布显示 "Paste Here" 按钮 |
| US13 | 作为用户，我希望看到剪贴板当前内容 | 工具栏或 ClipboardStore badge 显示剪贴板节点数量 |

### DoD 清单

- [ ] `clipboardStore.ts` 新增 `crossCanvasPaste(targetCanvasId: string)` action
- [ ] `clipboardStore.ts` 已有 `copiedCards` 数组（来源 DDSFlow 选中的节点），`crossCanvasPaste` 遍历并添加到目标 canvas store
- [ ] `canvasListStore.ts` 新增 `pasteToCanvas(canvasId: string)` action，调用 `clipboardStore.crossCanvasPaste(canvasId)`
- [ ] CanvasListPanel 已有 canvas item 渲染区域，新增 "Paste Here" 操作按钮（仅当 clipboard 有内容时显示）
- [ ] ClipboardStore badge：DDSToolbar 或 ClipboardMenu 显示剪贴板内容数量（`copiedCards.length`）
- [ ] Vitest: `clipboardStore.test.ts` 新增 `test('crossCanvasPaste: adds cards to target canvas')` 测试
- [ ] dual-CHANGELOG 更新

### expect() 断言

```typescript
// clipboardStore.test.ts
test('crossCanvasPaste: adds cards to target canvas store', async () => {
  const clipboard = create(clipboardStore)
  clipboard.getState().copyCards([{ id: 'node-1', type: 'custom' }])
  clipboard.getState().crossCanvasPaste('target-canvas')
  // Target canvas store receives the cards
  const targetStore = create(canvasStore)
  const cards = targetStore.getState().cards
  expect(cards.some(c => c.id === 'node-1')).toBe(true)
})
```

---

## 验收标准总表

| Epic | 功能 | 核心验收标准 | 测试文件 |
|------|------|------------|---------|
| E1 | Canvas List 持久化 + 搜索 | 刷新后列表恢复，搜索实时过滤 | `useCanvasList.test.ts` |
| E2 | Canvas 导出 PDF + 批量 | PDF blob 生成，批量选择功能 | `useCanvasExport.test.ts` |
| E3 | 键盘快捷键可配置 | 编辑模式保存新绑定，冲突警告 | `ShortcutPanel.test.tsx` |
| E4 | AI Session 标签 + 收藏 | 收藏切换，标签增删 | `agentStore.test.ts` |
| E5 | 剪贴板跨画布粘贴 | 节点添加到目标 canvas store | `clipboardStore.test.ts` |

## 技术约束

- 所有 UI 组件遵循 `DESIGN.md` 设计系统（design-tokens.css 变量）
- Zustand store 变更需要同步更新 dual-CHANGELOG
- Vitest 测试必须覆盖新功能逻辑，不接受 `test.skip` 或 `test.todo`
- TypeScript 编译零错误（`pnpm exec tsc --noEmit --skipLibCheck`）
