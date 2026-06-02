# Sprint 52 — 架构设计文档

**项目**: vibex-proposals-sprint52
**版本**: 1.0
**日期**: 2026-06-02
**架构师**: Architect Agent (Coord self-impl)
**状态**: 已批准

---

## 执行摘要

Sprint 52 在 Sprint 51 持久化基础设施之上，构建协作感知层（E1）、完善导出工具链（E2）、引入 revision 乐观锁（E3）、增强模板管理（E4）、完成快捷键可配置化（E5）。

**核心技术决策**：
1. Presence 使用 WebSocket 独立消息通道，不复用现有 canvas/broadcast
2. SVG 导出采用 ReactFlow 原生 SVG 生成，不依赖 html-to-image
3. Revision 乐观锁采用 baseRevision + LIRS 双轨策略
4. 模板搜索使用 Fuse.js 客户端模糊搜索
5. 快捷键配置通过 localStorage + Zustand 覆盖层实现

---

## E1 — 画布协作实时感知

### 现有状态

| 组件 | 状态 | 位置 |
|------|------|------|
| CollaborationRoom | ✅ 存在 | vibex-backend/src/websocket/CollaborationRoom.ts |
| canvasHistoryStore | ✅ 存在 | vibex-fronted/src/lib/canvas/stores/historyStore.ts |
| D1 schema | ✅ 存在 | vibex-backend/src/schema.ts |

### 需新增

| 组件 | 路径 | 说明 |
|------|------|------|
| collaborationPresenceStore | vibex-fronted/src/stores/dds/presenceStore.ts | Zustand 在线用户状态 |
| PresenceIndicator | vibex-fronted/src/components/dds/presence/PresenceIndicator.tsx | 头像列表 UI |
| presence WS handler | vibex-backend/src/websocket/handlers/presenceHandler.ts | join/leave/ping 处理 |
| D1 presence 表 | vibex-backend/src/schema.ts 新增 | collaboration_presence 表 |

### 架构决策

**Q: Presence 消息走独立通道还是复用现有通道？**
→ **独立消息类型，不开独立 WS 连接**。复用同一个 CollaborationRoom 连接，新增 `presence:join/leave/ping` 消息类型。避免多 WebSocket 连接开销。

**Q: 在线列表持久化到 D1 还是纯内存？**
→ **D1 + 内存双写**。`presence:join` 时写入 `collaboration_presence` 表；`presence:ping` 时更新 `lastPing`。30s 无 ping 则通过定时任务清理（Cloudflare Cron Trigger）。纯内存方案无法跨节点同步。

**Q: 离线移除是客户端轮询还是服务端推送？**
→ **服务端主动推送**。Server 每 30s 检查 presence 表，发送 `presence:leave` 给相关房间客户端。客户端不主动轮询。

### 组件关系

```
DDSCanvasPage mount
  → wsClient.send('presence:join')
  → presenceStore.addUser(user)
  → PresenceIndicator 渲染头像列表

Server presence:join
  → D1 insert collaboration_presence
  → broadcast presence:user-joined to room

Server Cron 30s
  → 查询 lastPing < now-30s
  → D1 delete
  → broadcast presence:user-left to room
  → client presenceStore.removeUser(userId)
```

### 测试策略

- Vitest: `collaborationPresenceStore.test.ts` — join/leave/ping/timeout 全场景
- Vitest: `presenceHandler.test.ts` — join 写库、ping 更新、30s 清理
- E2E: 多 tab 同时打开画布，验证头像同步

---

## E2 — 批量导出格式扩展（SVG + PDF）

### 现有状态

| 组件 | 状态 | 位置 |
|------|------|------|
| ZipExporter | ✅ 存在 | vibex-fronted/src/services/export/ZipExporter.ts |
| exportMultipleAsPNG | ✅ 存在（S51） | vibex-fronted/src/services/export/exportMultipleAsPNG.ts |
| ExportProgress | ✅ 存在（S51） | vibex-fronted/src/components/dds/export/ExportProgress.tsx |
| jsPDF | ✅ 已安装 | package.json |

### 需新增

| 组件 | 路径 | 说明 |
|------|------|------|
| exportMultipleAsSVG | vibex-fronted/src/services/export/exportMultipleAsSVG.ts | ReactFlow 节点→SVG 矢量 |
| exportMultipleAsPDF | vibex-fronted/src/services/export/exportMultipleAsPDF.ts | jsPDF 多页生成 |
| PDF batch API | vibex-backend/src/routes/export-pdf-batch.ts | 服务端 PDF 渲染（可选降级） |

### 架构决策

**Q: SVG 生成用 ReactFlow 原生还是 html-to-image？**
→ **ReactFlow 原生 SVG**。`html-to-image` 截 DOM 无法保证矢量精度且依赖 DOM 渲染时机。ReactFlow 提供 `toObject()` 可直接获取 `{ nodes, edges }` 结构。遍历节点生成 `<rect>/<text>/<edge>` SVG 元素，样式内联 CSS 变量。

**Q: PDF 用客户端 jsPDF 还是服务端渲染？**
→ **客户端 jsPDF 优先，服务端降级**。客户端直接生成（无服务器调用延迟）。服务端 `/api/export/pdf-batch` 作为降级方案（大型画布节点数 > 1000 时）。

**Q: 格式切换 UI 如何实现？**
→ **ExportProgress 组件增加 format 参数下拉菜单**。PNG/SVG/PDF 三选一，不支持混合导出（复杂度高，优先级低）。

### 组件关系

```
ExportProgress (format=dropdown)
  → format === 'svg' → exportMultipleAsSVG(nodes, edges) → Blob → download
  → format === 'pdf' → exportMultipleAsPDF(canvases) → Blob → download
  → format === 'png' → exportMultipleAsPNG(nodes) → Blob → download
  → AbortController 支持取消

ZipExporter.exportZip(items, format)
  → format === 'svg' → map each node → exportMultipleAsSVG(node)
  → format === 'pdf' → exportMultipleAsPDF(canvas)
```

### 测试策略

- Vitest: `exportMultipleAsSVG.test.ts` — 空节点/单节点/多节点/含边
- Vitest: `exportMultipleAsPDF.test.ts` — 单画布/多画布/空画布
- Vitest: `ZipExporter.exportZip` format=svg/pdf 分支覆盖

---

## E3 — Undo/Redo 协作冲突处理

### 现有状态

| 组件 | 状态 | 位置 |
|------|------|------|
| canvasHistoryStore | ✅ 存在 | vibex-fronted/src/lib/canvas/stores/historyStore.ts |
| historyDB | ✅ 存在（LIRS） | vibex-fronted/src/lib/canvas/historyDB.ts |
| useHistoryPersistence | ✅ 存在 | vibex-fronted/src/hooks/canvas/useHistoryPersistence.ts |

### 需新增/修改

| 组件 | 路径 | 说明 |
|------|------|------|
| baseRevision 字段 | historyStore.ts 修改 | 新增 baseRevision 状态 |
| saveHistoryWithRevision | historyDB.ts 新增方法 | 乐观锁写入 |
| revision:bump handler | wsRevisionHandler.ts 新建 | 接收协作者 revision 推送 |
| useHistoryPersistence 改造 | useHistoryPersistence.ts 修改 | 监听 revision:bump |

### 架构决策

**Q: Revision 字段放在 historyStore 还是 historyDB？**
→ **historyStore 作为主状态，historyDB 持久化层**。`baseRevision` 在 store 层维护（乐观锁用），`historyDB.saveHistoryWithRevision(base, entries)` 做版本校验写入。

**Q: 乐观锁冲突后如何处理？**
→ **先本地合并，再保存**。检测到 revision 冲突时，弹出 Toast "其他人已修改，是否合并？"，用户点击后执行 LIRS merge 策略，再写入新 revision。

**Q: revision:bump 消息是否需要 ACK？**
→ **不需要**。Server broadcast revision:bump 是 fire-and-forget，客户端收到后直接覆盖 baseRevision，不等待服务端确认。

### 组件关系

```
用户操作（undo/redo）
  → canvasHistoryStore.push(entry, revision)
  → historyDB.saveHistoryWithRevision(baseRevision, entries)
    → revision 匹配 → 写入成功，baseRevision++
    → revision 不匹配 → 抛出 'Revision mismatch'
      → Toast "其他人已修改，是否合并？"
      → LIRS merge → 重新 saveHistoryWithRevision

Server 其他用户操作
  → ws broadcast 'revision:bump'
  → wsRevisionHandler 接收
  → canvasHistoryStore.setBaseRevision(newRevision)
```

### 测试策略

- Vitest: `canvasHistoryStore.test.ts` — revision 递增/冲突/revision:bump 监听
- Vitest: `historyDB.test.ts` — saveHistoryWithRevision 成功/失败 cases

---

## E4 — 模板管理增强（分类/标签/搜索）

### 现有状态

| 组件 | 状态 | 位置 |
|------|------|------|
| templateStore | ✅ 存在（S50-E4） | vibex-fronted/src/stores/dds/templateStore.ts |
| TemplateGallery | ✅ 存在（S50-E4） | vibex-fronted/src/components/dds/templates/TemplateGallery.tsx |
| TemplateEditDialog | ✅ 存在（S50-E4） | vibex-fronted/src/components/dds/templates/TemplateEditDialog.tsx |
| Fuse.js | ✅ 已安装 | package.json |

### 需新增/修改

| 组件 | 路径 | 说明 |
|------|------|------|
| category/tags 字段 | templateStore.ts 修改 | 新增字段 + actions |
| TemplateSearchBar | vibex-fronted/src/components/dds/templates/TemplateSearchBar.tsx | Fuse.js 搜索框 |
| CategoryTab | vibex-fronted/src/components/dds/templates/CategoryTab.tsx | 分类 Tab 组件 |
| TemplateEditDialog 改造 | templateStore.ts + TemplateEditDialog.tsx | 新增 category/tag 编辑 UI |

### 架构决策

**Q: 搜索是前端 Fuse.js 还是后端全文检索？**
→ **前端 Fuse.js**。模板数量有限（< 1000），Fuse.js 完全够用且无额外网络开销。threshold=0.3 平衡精确度和召回率。

**Q: 分类变更触发重新渲染的方式？**
→ **Zustand subscription**。`TemplateGallery` 订阅 `templateStore`，`category` 变更时自动重新过滤。不需要手动调用 `forceUpdate`。

### 组件关系

```
TemplateStore
  → { templates: { [id]: { ..., category, tags } } }
  → setCategory(id, category)
  → addTag(id, tag)
  → removeTag(id, tag)

TemplateGallery
  → activeCategory state (default: 'all')
  → filteredTemplates = templates.filter(t => t.category === activeCategory)
  → 分类 Tab 切换 → filteredTemplates 更新

TemplateSearchBar
  → Fuse(templates, { keys: ['name', 'description', 'tags'], threshold: 0.3 })
  → results → TemplateGallery 渲染

TemplateEditDialog
  → CategorySelector (dropdown: flowchart/mindmap/uml/other)
  → TagInput (chip 输入框)
```

### 测试策略

- Vitest: `templateStore.test.ts` — category/tags set/add/remove cases
- Vitest: `templateSearch.test.ts` — Fuse.js 搜索准确性

---

## E5 — 键盘快捷键自定义 UI

### 现有状态

| 组件 | 状态 | 位置 |
|------|------|------|
| useKeyboardShortcuts | ✅ 存在（S48-E3） | vibex-fronted/src/hooks/canvas/useKeyboardShortcuts.ts |
| DDSToolbar | ✅ 存在 | vibex-fronted/src/components/dds/DDSToolbar.tsx |
| localStorage | ✅ 可用 | 浏览器原生 |

### 需新增

| 组件 | 路径 | 说明 |
|------|------|------|
| shortcutStore | vibex-fronted/src/stores/dds/shortcutStore.ts | Zustand + localStorage 持久化 |
| ShortcutSettingsPanel | vibex-fronted/src/components/dds/shortcuts/ShortcutSettingsPanel.tsx | 设置 Modal |
| ShortcutKeyInput | vibex-fronted/src/components/dds/shortcuts/ShortcutKeyInput.tsx | 按键捕获输入框 |
| useKeyboardShortcuts 改造 | useKeyboardShortcuts.ts 修改 | 从 shortcutStore 读取覆盖 |

### 架构决策

**Q: 快捷键配置如何与默认配置合并？**
→ **用户配置覆盖默认配置**。`shortcutStore` 存储用户自定义的 `{ action: key }` map。`useKeyboardShortcuts` 合并时，`...defaultShortcuts, ...userOverrides`。

**Q: 冲突检测在哪个层级？**
→ **Store 层**。`shortcutStore.bindShortcut(key, action)` 在保存前检测 `Object.entries(shortcuts).find(existing => existing.key === key)`，已存在则抛出 `KeyConflictError`。

**Q: 浏览器默认快捷键冲突如何处理？**
→ **`event.preventDefault()` 拦截已知冲突**。Ctrl+S/Ctrl+P 等使用 `e.preventDefault()`，其他自定义快捷键不拦截。

### 组件关系

```
shortcutStore (Zustand + localStorage)
  → shortcuts: { undo: 'z', redo: 'y', ...userOverrides }
  → load() → localStorage.getItem('shortcuts')
  → save(shortcuts) → localStorage.setItem('shortcuts')
  → bindShortcut(key, action) → 冲突检测 → 保存

useKeyboardShortcuts
  → mergedShortcuts = { ...DEFAULT_SHORTCUTS, ...shortcutStore.shortcuts }
  → forEach([action, key]) → window.addEventListener('keydown', handler)

ShortcutSettingsPanel (Modal)
  → 列出所有 action + current key
  → 双击 → ShortcutKeyInput 捕获 keydown
  → 保存 → shortcutStore.bindShortcut(key, action)

DDSToolbar
  → 新增 "快捷键设置" 按钮 → 打开 ShortcutSettingsPanel
```

### 测试策略

- Vitest: `shortcutStore.test.ts` — save/load/conflict detection/reset cases

---

## 跨 Epic 共享依赖

| 依赖 | 使用者 | 说明 |
|------|--------|------|
| CollaborationRoom | E1, E3 | WebSocket 房间管理 |
| canvasHistoryStore | E3 | 历史记录状态 |
| TemplateGallery | E4 | 模板列表渲染 |
| DDSToolbar | E5 | 快捷键设置入口 |
| historyDB | E3 | 持久化层 |
| Fuse.js | E4 | 模板搜索 |

---

## 测试覆盖率目标

| Epic | Vitest 覆盖率 | E2E |
|------|-------------|-----|
| E1 | 90%+ (presenceStore + handler) | 多 tab presence 同步 |
| E2 | 90%+ (SVG + PDF export) | PNG/SVG/PDF 下载 |
| E3 | 90%+ (revision 冲突 cases) | 并发 undo 冲突恢复 |
| E4 | 90%+ (store + search) | 搜索 + 分类切换 |
| E5 | 90%+ (store lifecycle) | 快捷键重绑定 + 刷新恢复 |

---

## 后端 API 变更

| 端点 | 方法 | Epic | 说明 |
|------|------|------|------|
| `/api/presence/join` | POST | E1 | 用户进入画布，记录 presence |
| `/api/presence/ping` | POST | E1 | 心跳保活 |
| `/api/export/pdf-batch` | POST | E2 | 大型画布服务端 PDF 降级 |

---

*文档版本: 1.0 | 创建时间: 2026-06-02*
