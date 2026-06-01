# Sprint 48 提案分析

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **触发**: Sprint47 analyst CLI-dispatch ghost — analyst 派发后 Slack socket 持续断开，coord 自举完成 Sprint48 提案分析，基于 Sprint47 (E1-E5) 交付成果识别下一批高优先级功能增强。
> **方法**: 审查 dual-CHANGELOG (S47) + 代码缺口分析 + 用户体验优先级矩阵

---

## 背景：Sprint47 交付成果

| Epic | 名称 | 状态 | 关键产出 |
|------|------|------|---------|
| E1 | AI Session 搜索验证 + 历史会话管理 | ✅ | searchableText field, real-time filter, match highlighting |
| E2 | 键盘快捷键扩展验证 | ✅ | Cmd+S/K/Shift+Z, ShortcutPanel, i18n namespace |
| E3 | 画布节点复制/粘贴验证 | ✅ | clipboardStore (localStorage TTL 5min), Cmd+C/V |
| E4 | Canvas 列表视图 + 多画布管理面板 | ✅ | canvasListStore, CanvasListPanel, thumbnail 生成 |
| E5 | Canvas 导出格式扩展 | ✅ | PNG 1x/2x/3x, Figma JSON export |

**Sprint47 验证策略**: 所有 E1-E3 为 baseline 验证（验证 Sprint46 代码可用性），E4/E5 为新功能实现。

---

## 提案分析（P001-P005）

### P001: Canvas 列表持久化 + 搜索增强

**问题描述**: Sprint47 E4 实现了 CanvasListPanel 和 canvasListStore，但画布列表仅存在于内存（Zustand store），刷新页面后数据丢失。用户每次打开都需要等待 IndexedDB 查询。

**根因分析**:
- `canvasListStore` 的 Zustand store 只在 session 内存中
- `canvasListStore.ts` 读取 IndexedDB 后写入 store，但 store 本身不是持久化的
- 缩略图 `thumbnail.ts` 每次渲染时重新生成，无缓存

**影响评估**:
- 用户体验：高 — 每次打开页面需要等待画布列表重建
- 数据一致性：中 — 多标签页并发时各标签页的画布列表可能不一致
- 性能：中 — 缩略图每次重新生成浪费计算资源

**技术可行性**:
- IndexedDB 已有 `canvasStore` 表，可复用 `db.getAll()` 读取逻辑
- Zustand `persist` middleware 可直接持久化 store 到 localStorage
- 缩略图缓存：`canvasListStore` 添加 `thumbnails: Record<string, string>` 字段

**DoD 清单**:
- [ ] `canvasListStore` 添加 `persist` middleware，刷新页面后画布列表自动恢复
- [ ] 缩略图缓存：同一 canvasId 的缩略图只生成一次，存入 `thumbnails` map
- [ ] 画布搜索：`canvasListStore` 添加 `filterCanvas(searchTerm: string)` action
- [ ] CanvasListPanel 搜索输入框，实时过滤画布名称
- [ ] Vitest: `useCanvasList.test.ts` 新增持久化 + 搜索测试
- [ ] dual-CHANGELOG 更新

**优先级**: P0（影响核心工作流，修复成本低）

---

### P002: Canvas 导出 PDF + 批量导出

**问题描述**: Sprint47 E5 实现了 PNG 分辨率选择和 Figma JSON export，但 PDF 导出仍然缺失。用户需要将画布导出为 PDF 用于文档/汇报场景。

**根因分析**:
- Sprint43 E4 导出了 `jsPDF` 依赖并实现了 `/api/export/pdf` API route
- Sprint47 E5 未扩展 PDF 导出到更高分辨率或批量导出
- `useCanvasExport` hook 缺少 `exportAsPDF()` 方法

**影响评估**:
- 用户体验：高 — PDF 是企业文档场景的刚需
- 技术复杂度：中 — 需要处理分页和图片压缩

**技术可行性**:
- `jsPDF` 依赖已在 `package.json`（Sprint43 安装）
- `html2canvas` 可将 DOM 转图片后嵌入 PDF
- 批量导出：遍历 `canvasListStore` 中的画布列表，逐个生成 PDF

**DoD 清单**:
- [ ] `useCanvasExport` 新增 `exportAsPDF(options?: { scale: number, orientation: 'portrait' | 'landscape' })` 方法
- [ ] ExportMenu 新增 "Export as PDF" 选项
- [ ] 批量导出：`canvasListStore` 添加 `batchExportPDF(canvasIds: string[])` action
- [ ] 批量导出 UI：CanvasListPanel 添加 "Export Selected" 复选框 + 批量导出按钮
- [ ] Vitest: `useCanvasExport.test.ts` 新增 PDF export 测试
- [ ] dual-CHANGELOG 更新

**优先级**: P0（企业文档汇报核心场景）

---

### P003: 键盘快捷键可配置化

**问题描述**: Sprint47 E2 验证了固定快捷键（Cmd+S/K/Shift+Z），但用户无法自定义快捷键绑定。不同用户有不同的工作习惯。

**根因分析**:
- `useKeyboardShortcuts` 的 key bindings 是硬编码常量
- `ShortcutPanel` 只展示当前快捷键列表，无编辑功能
- `userPreferencesStore` 已存在（IndexedDB persistence）但未集成快捷键配置

**影响评估**:
- 用户体验：中 — 高级用户受影响，普通用户无感
- 技术复杂度：中 — 需要处理快捷键冲突检测

**技术可行性**:
- `userPreferencesStore` 可复用，添加 `shortcuts: Record<string, string>` 字段
- `ShortcutPanel` 添加 inline 编辑模式（点击快捷键标签 → input 聚焦 → 监听 keydown）
- 冲突检测：比较新绑定是否与其他已注册快捷键重复

**DoD 清单**:
- [ ] `userPreferencesStore` 新增 `shortcuts` 字段 + IndexedDB 持久化
- [ ] `ShortcutPanel` 添加快捷键编辑模式（点击标签 → keydown capture → 保存）
- [ ] 快捷键冲突检测：相同快捷键被多个 action 绑定时显示警告
- [ ] `shortcuts` i18n namespace 添加 "Customize Shortcuts" / "Key Conflict" 等 key
- [ ] Vitest: `ShortcutPanel.test.tsx` 新增编辑模式测试
- [ ] dual-CHANGELOG 更新

**优先级**: P1（高级用户增强，非阻塞核心流程）

---

### P004: AI Session 标签系统 + 收藏

**问题描述**: Sprint47 E1 实现了 AI Session 搜索，但 session 缺乏标签（tag）和收藏（favorite）功能。用户无法对重要 session 进行分类和快速访问。

**根因分析**:
- `agentStore` 的 session 对象只有 `id`, `name`, `searchableText` 字段
- 无 `tags: string[]` 或 `isFavorite: boolean` 字段
- AgentSessions 组件无收藏/标签 UI

**影响评估**:
- 用户体验：中 — session 数量增长后搜索效率下降
- 技术复杂度：低 — 只需扩展 agentStore session schema

**技术可行性**:
- `agentStore.ts` session schema 扩展字段
- `AgentSessions` 组件添加收藏星标按钮 + 标签选择器
- 标签系统：`tags: string[]` 支持多标签筛选

**DoD 清单**:
- [ ] `agentStore` session schema 新增 `tags: string[]` 和 `isFavorite: boolean` 字段
- [ ] AgentSessions 添加收藏按钮（星标），点击切换 `isFavorite`
- [ ] 标签输入/选择 UI（AgentSessionItem 行内编辑）
- [ ] AgentSessions 支持按收藏优先 + 标签过滤筛选
- [ ] Vitest: `agentStore.test.ts` 新增 tags/favorite 测试
- [ ] dual-CHANGELOG 更新

**优先级**: P1（session 管理增强，S47 E1 基础上扩展）

---

### P005: 剪贴板跨画布粘贴

**问题描述**: Sprint47 E3 实现了画布内节点复制/粘贴（Cmd+C/V），但粘贴只能在本画布内执行。用户无法将节点粘贴到另一个画布。

**根因分析**:
- `clipboardStore` 的 `pasteCards` action 直接调用 `DDSCanvasStore.addCards()`，作用于当前 canvas
- 无 canvas ID 上下文传递机制
- IndexedDB clipboard 缓存（5min TTL）可跨画布访问，但 paste action 缺少目标 canvas 指定

**影响评估**:
- 用户体验：高 — 多画布工作流用户（画布管理面板用户）强烈需求
- 技术复杂度：中 — 需要跨 store 协调

**技术可行性**:
- `clipboardStore` 保持不变（source of truth）
- 新增 `crossCanvasPaste(targetCanvasId: string)` action，从 clipboard store 读取数据粘贴到指定画布
- CanvasListPanel 添加 "Paste Here" 快捷操作（需 clipboard 有内容时显示）

**DoD 清单**:
- [ ] `clipboardStore` 新增 `crossCanvasPaste(targetCanvasId: string)` action
- [ ] `canvasListStore` 新增 `pasteToCanvas(canvasId: string)` action
- [ ] CanvasListPanel 选中画布后，显示 "Paste from Clipboard" 操作按钮
- [ ] ClipboardStore badge 显示当前剪贴板内容数量
- [ ] Vitest: `clipboardStore.test.ts` 新增 cross-canvas paste 测试
- [ ] dual-CHANGELOG 更新

**优先级**: P1（多画布工作流增强）

---

## 优先级矩阵

| 提案 | 名称 | 优先级 | 风险 | 影响范围 | 实施建议 |
|------|------|--------|------|---------|---------|
| P001 | Canvas 列表持久化 + 搜索增强 | P0 | 低 | 全部用户 | Sprint48 E1 |
| P002 | Canvas 导出 PDF + 批量导出 | P0 | 中 | 企业用户 | Sprint48 E2 |
| P003 | 键盘快捷键可配置化 | P1 | 低 | 高级用户 | Sprint48 E3 |
| P004 | AI Session 标签系统 + 收藏 | P1 | 低 | 重度 AI 用户 | Sprint48 E4 |
| P005 | 剪贴板跨画布粘贴 | P1 | 中 | 多画布用户 | Sprint48 E5 |

**建议 Sprint48 实施范围**: P001 + P002 + P003（三个 P0/P1 中低风险项）
