# Sprint 47 PRD — 产品需求文档

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **依据**: analysis.md (P001-P005)

---

## 1. 产品愿景

基于 Sprint46 建立的 AI Session 搜索 + 键盘快捷键 + 节点复制粘贴能力，Sprint47 聚焦两个核心方向：
1. **多画布管理**：让用户能浏览和管理多个画布
2. **导出能力增强**：扩展导出格式，支持 PNG/SVG/Figma

---

## 2. Epic × Story 验收标准

### Epic 1 — P001: AI Session 搜索 + 历史会话管理

| Story | 验收标准 | expect() 断言 |
|--------|---------|-------------|
| S1.1 搜索索引 | IndexedDB session 有 `searchableText` 字段 | `expect(store.sessions[0]).toHaveProperty('searchableText')` |
| S1.2 搜索 UI | AgentSessions 有搜索输入框 | `expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()` |
| S1.3 过滤逻辑 | 输入关键词后只显示匹配 session | `expect(screen.getAllByRole('listitem')).toHaveLength(1)` |
| S1.4 高亮 | 搜索结果中关键词被高亮 | `expect(screen.getByText(/match/i).className).toContain('highlight')` |

**DoD checklist**:
- [ ] IndexedDB `searchableText` 字段建立
- [ ] 搜索输入框 + 实时过滤
- [ ] 关键词高亮
- [ ] Vitest 覆盖
- [ ] dual-CHANGELOG 更新

---

### Epic 2 — P002: 键盘快捷键系统

| Story | 验收标准 | expect() 断言 |
|--------|---------|-------------|
| S2.1 注册表 | useKeyboardShortcuts 支持注册多个快捷键 | `expect(registerShortcut).toBeDefined()` |
| S2.2 Cmd+S | 保存画布触发 | `expect(saveCanvas).toHaveBeenCalled()` |
| S2.3 Cmd+K | 打开 AI 面板 | `expect(setAIPanelOpen).toHaveBeenCalledWith(true)` |
| S2.4 冲突检测 | 同一快捷键冲突时 console.warn | `expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('conflict'))` |
| S2.5 ShortcutPanel | 面板显示所有快捷键列表 | `expect(screen.getByText(/Cmd\\+S/)).toBeInTheDocument()` |

**DoD checklist**:
- [ ] `useKeyboardShortcuts` hook（注册表模式）
- [ ] 冲突检测 + warn
- [ ] `Cmd+S` / `Cmd+K` / `Cmd+Shift+Z` 实现
- [ ] ShortcutPanel UI
- [ ] `shortcuts` i18n namespace
- [ ] Vitest 测试
- [ ] dual-CHANGELOG 更新

---

### Epic 3 — P003: 画布节点复制/粘贴

| Story | 验收标准 | expect() 断言 |
|--------|---------|-------------|
| S3.1 复制 action | canvasStore.copyNodes 序列化选中节点 | `expect(clipboard).toHaveLength(selectedNodes.length)` |
| S3.2 粘贴 action | pasteNodes 创建新节点 + 新 ID | `expect(newNodes[0].id).not.toBe(originalNode.id)` |
| S3.3 Cmd+C/V 绑定 | 快捷键触发复制/粘贴 | `expect(copyNodes).toHaveBeenCalledWith(selectedIds)` |
| S3.4 跨画布粘贴 | 粘贴到另一画布时节点落在目标画布 | `expect(targetCanvas.nodes).toContainEqual(expect.objectContaining({canvasId: targetId}))` |

**DoD checklist**:
- [ ] canvasStore.copyNodes → localStorage 序列化
- [ ] canvasStore.pasteNodes → 反序列化 + 新 ID 生成
- [ ] Cmd+C / Cmd+V 绑定到节点选中状态
- [ ] 跨画布粘贴处理
- [ ] Vitest: copyNodes + pasteNodes 测试
- [ ] dual-CHANGELOG 更新

---

### Epic 4 — P004: Canvas 列表视图 + 多画布管理面板

| Story | 验收标准 | expect() 断言 |
|--------|---------|-------------|
| S4.1 画布列表 | 侧边栏显示所有画布缩略图 + 名称 | `expect(screen.getAllByRole('listitem')).toHaveLength(canvasCount)` |
| S4.2 新建画布 | 新建按钮创建空白画布 | `expect(createCanvas).toHaveBeenCalled()` |
| S4.3 删除画布 | 删除画布前有确认 dialog | `expect(screen.getByText(/confirm/i)).toBeInTheDocument()` |
| S4.4 画布重命名 | 双击名称可编辑 | `expect(screen.getByRole('textbox')).toBeInTheDocument()` |
| S4.5 排序/筛选 | 按名称/修改时间/标签排序 | `expect(screen.getByText(/name/i)).toBeInTheDocument()` |

**DoD checklist**:
- [ ] CanvasListPanel 组件（侧边栏画布列表）
- [ ] 缩略图生成（canvas.toDataURL）
- [ ] 新建/删除/重命名操作
- [ ] IndexedDB 画布列表读取
- [ ] Vitest: canvas list store 测试
- [ ] dual-CHANGELOG 更新

---

### Epic 5 — P005: Canvas 导出格式扩展：PNG/SVG/Figma

| Story | 验收标准 | expect() 断言 |
|--------|---------|-------------|
| S5.1 PNG 导出 | 画布导出为 PNG 图片 | `expect(exportAsPNG).toHaveBeenCalled()` |
| S5.2 SVG 导出 | 画布导出为 SVG 矢量图 | `expect(exportAsSVG).toHaveBeenCalled()` |
| S5.3 Figma 兼容 | 导出 Figma 可读的 JSON 格式 | `expect(exportAsFigma).toHaveBeenCalledWith(expect.objectContaining({type: 'figma'}))` |
| S5.4 导出面板 | 导出菜单显示所有格式选项 | `expect(screen.getByText(/PNG/i)).toBeInTheDocument()` |
| S5.5 分辨率选择 | PNG 导出可选择分辨率 | `expect(screen.getByText(/1x|2x/i)).toBeInTheDocument()` |

**DoD checklist**:
- [ ] `exportAsPNG` / `exportAsSVG` / `exportAsFigma` 实现
- [ ] ExportMenu.tsx 显示所有格式
- [ ] PNG 分辨率选项（1x / 2x / 3x）
- [ ] SVG 保持矢量语义
- [ ] Figma JSON 格式映射
- [ ] Vitest: export hook 测试
- [ ] dual-CHANGELOG 更新

---

## 3. 非功能需求

| 指标 | 目标 |
|------|------|
| 首屏加载 | < 2s (code splitting) |
| 画布切换 | < 500ms |
| 导出 PNG | < 3s（取决于画布复杂度）|
| Vitest 覆盖率 | 新增代码 > 80% |

---

## 4. 技术约束

- IndexedDB 用于画布列表存储（已有 agentStore 基础）
- Zustand store 扩展 `canvasStore`（已有）
- i18n: `ai` + `shortcuts` namespaces
- Sprint46 键盘快捷键基础设施可复用
- Sprint44 E4 export 基础设施可扩展

---

## 5. 依赖关系

```
E1 (AI Session 搜索)    → Sprint46 E1 (agentStore)   [独立]
E2 (键盘快捷键)        → Sprint46 E2 (shortcuts)    [复用 ShortcutPanel]
E3 (节点复制/粘贴)     → Sprint45 E3 (canvas store) [复用 export JSON 序列化]
E4 (画布列表)          → Sprint44 E4 (export)       [独立]
E5 (导出扩展)          → Sprint44 E4 (export)       [扩展 export API]
```

**Pipeline order**: E1 → E2 → E3 → E4 → E5（无跨 epic 依赖，可并行规划）

---

## 6. i18n 需求

| Namespace | Keys needed |
|-----------|------------|
| `ai` | 已有 26 keys，补充搜索相关 keys |
| `shortcuts` | 新建 namespace（`shortcut-panel-title`, `cmd+s`, `cmd+k`, etc.）|

---

## 7. 验收 checklist

- [ ] E1: Vitest 6/6 PASS，IndexedDB searchableText 字段建立
- [ ] E2: Vitest 覆盖，ShortcutPanel 可显示
- [ ] E3: Vitest 覆盖，Cmd+C/V 在节点选中时可用
- [ ] E4: Vitest 覆盖，画布列表侧边栏显示
- [ ] E5: Vitest 覆盖，PNG/SVG/Figma 均可导出
- [ ] dual-CHANGELOG: 所有 5 Epic 均写入 root + frontend CHANGELOG
