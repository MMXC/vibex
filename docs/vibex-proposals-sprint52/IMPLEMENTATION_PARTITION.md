# Sprint 52 — IMPLEMENTATION PARTITION

**项目**: vibex-proposals-sprint52
**版本**: 1.0
**日期**: 2026-06-02
**架构师**: Architect Agent (Coord self-impl)

---

## Epic 概览

| Epic | 标题 | 优先级 | 开发者 | DoD 条目 |
|------|------|--------|--------|---------|
| E1 | 画布协作实时感知 | P0 | Dev | 6 |
| E2 | 批量导出格式扩展（SVG/PDF） | P1 | Dev | 6 |
| E3 | Undo/Redo 协作冲突处理 | P1 | Dev | 6 |
| E4 | 模板管理增强（分类/标签/搜索） | P2 | Dev | 7 |
| E5 | 键盘快捷键自定义 UI | P2 | Dev | 7 |

---

## E1 — 画布协作实时感知

### 新增文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/stores/dds/presenceStore.ts` | Zustand Store | 管理 onlineUsers[]、join/leave/ping actions |
| `src/components/dds/presence/PresenceIndicator.tsx` | React 组件 | 侧边栏在线用户头像列表 |
| `src/components/dds/presence/PresenceAvatar.tsx` | React 组件 | 单个用户头像 + 名称 |
| `src/hooks/canvas/usePresenceSync.ts` | React Hook | 订阅 presenceStore + WebSocket sync |
| `src/websocket/handlers/presenceHandler.ts` | Backend Handler | presence:join/leave/ping 处理 |
| `src/lib/canvas/__tests__/presenceStore.test.ts` | Vitest | Store 逻辑测试 |
| `src/lib/canvas/__tests__/presenceHandler.test.ts` | Vitest | WS handler 测试 |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `vibex-backend/src/schema.ts` | 新增 `collaboration_presence` D1 表 |
| `vibex-backend/src/websocket/CollaborationRoom.ts` | 新增 presence 广播逻辑 |
| `src/app/[projectId]/[canvasId]/page.tsx` | 挂载 PresenceIndicator |

### DoD Checklist

- [ ] `presence:join` WebSocket 消息在 DDSCanvasPage mount 时发送
- [ ] `presence:ping` 每 30s 发送一次
- [ ] `presence:leave` 在页面 unload 时发送
- [ ] `collaboration_presence` D1 表写入/查询正确
- [ ] PresenceIndicator 在 DDSToolbar 区域正确渲染头像列表
- [ ] 30s 无 ping 用户自动从列表移除（Server Cron）
- [ ] Vitest `presenceStore.test.ts` 全通过（≥ 10 cases）
- [ ] Vitest `presenceHandler.test.ts` 全通过

### 验收标准 expect()

```typescript
// E1.1: presence:join 发送
expect(wsClient.send).toHaveBeenCalledWith('presence:join', expect.objectContaining({ userId, canvasId }));

// E1.2: 在线列表渲染
expect(screen.getByText('Alice')).toBeInTheDocument();
expect(screen.getByText('Bob')).toBeInTheDocument();

// E1.3: 30s 无 ping 移除
vi.advanceTimersByTime(35000);
expect(screen.queryByText('Alice')).not.toBeInTheDocument();

// E1.4: presenceStore 状态
expect(store.onlineUsers).toHaveLength(2);
expect(store.onlineUsers[0]).toMatchObject({ userId: 'alice', status: 'online' });
```

---

## E2 — 批量导出格式扩展（SVG + PDF）

### 新增文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/services/export/exportMultipleAsSVG.ts` | Service | ReactFlow 节点→SVG 矢量 |
| `src/services/export/exportMultipleAsPDF.ts` | Service | jsPDF 多页生成 |
| `src/lib/canvas/__tests__/exportMultipleAsSVG.test.ts` | Vitest | SVG 导出测试 |
| `src/lib/canvas/__tests__/exportMultipleAsPDF.test.ts` | Vitest | PDF 导出测试 |
| `vibex-backend/src/routes/export-pdf-batch.ts` | Backend Route | 服务端 PDF 降级 API（可选） |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/components/dds/export/ExportProgress.tsx` | 新增 format 参数下拉菜单（PNG/SVG/PDF） |
| `src/services/export/ZipExporter.ts` | 新增 format 参数传递给各 export 函数 |

### DoD Checklist

- [ ] `exportMultipleAsSVG()` 生成有效 SVG（含 `<rect>`/`<text>`/`<edge>` 节点 + 样式内联）
- [ ] `exportMultipleAsPDF()` 生成 PDF，每画布一页
- [ ] ExportProgress UI 格式切换下拉菜单正确（PNG/SVG/PDF）
- [ ] ZipExporter 支持 format='svg' 和 format='pdf' 参数
- [ ] 后端 `/api/export/pdf-batch` API 响应正确（E2.4 降级）
- [ ] Vitest `exportMultipleAsSVG.test.ts` 空/单/多节点全部通过
- [ ] Vitest `exportMultipleAsPDF.test.ts` 单/多画布全部通过

### 验收标准 expect()

```typescript
// E2.1: SVG 生成
const svg = await exportMultipleAsSVG(mockNodes, mockEdges);
expect(svg).toContain('<svg');
expect(svg).toContain('<rect');  // ReactFlow node
expect(svg).toContain('stroke'); // inline style

// E2.2: PDF 生成
const pdf = await exportMultipleAsPDF([mockCanvas1, mockCanvas2]);
expect(pdf).toHaveLength(2);
expect(pdf[0].format).toBe('pdf');

// E2.3: 格式切换 UI
render(<ExportProgress onFormatChange={fn} />);
expect(screen.getByRole('combobox')).toHaveValue('png');
await userEvent.selectOptions(screen.getByRole('combobox'), 'svg');
expect(fn).toHaveBeenCalledWith('svg');
```

---

## E3 — Undo/Redo 协作冲突处理

### 新增/修改文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/lib/canvas/stores/historyStore.ts` | Store 修改 | 新增 `baseRevision` 字段 |
| `src/lib/canvas/historyDB.ts` | DB 修改 | 新增 `saveHistoryWithRevision()` 方法 |
| `src/websocket/handlers/revisionHandler.ts` | Backend Handler | revision:bump 广播 |
| `src/hooks/canvas/useHistoryPersistence.ts` | Hook 修改 | 监听 revision:bump 事件 |
| `src/lib/canvas/__tests__/historyStore.test.ts` | Vitest 修改 | 新增 revision cases |
| `src/lib/canvas/__tests__/historyDB.test.ts` | Vitest 修改 | 新增 revision cases |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/stores/dds/canvasHistoryStore.ts` | 新增 baseRevision 字段 |
| `src/components/dds/DDSToolbar.tsx` | 新增冲突 Toast 挂载点 |

### DoD Checklist

- [ ] `canvasHistoryStore` 含 `baseRevision` 字段且初始值为 0
- [ ] `historyDB.saveHistoryWithRevision(baseRevision, entries)` revision 匹配时写入成功
- [ ] `historyDB.saveHistoryWithRevision(baseRevision, entries)` revision 不匹配时抛出错误
- [ ] WebSocket `revision:bump` 事件被 wsRevisionHandler 正确处理
- [ ] 冲突时显示 Toast 提示"其他人已修改，是否合并？"
- [ ] Vitest `historyStore.test.ts` 新增 revision 递增/冲突/revision:bump cases 通过
- [ ] Vitest `historyDB.test.ts` revision 校验 cases 通过

### 验收标准 expect()

```typescript
// E3.1: revision 字段
expect(store.baseRevision).toBe(0);
await store.push(entry);
expect(store.baseRevision).toBe(1);

// E3.2: 乐观锁拒绝
await store.saveHistoryWithRevision(5, entries);
await expect(store.saveHistoryWithRevision(5, entries)).rejects.toThrow('Revision mismatch');

// E3.3: revision:bump
wsServer.broadcast('revision:bump', { revision: 10 });
expect(store.baseRevision).toBe(10);

// E3.4: 冲突 Toast
vi.spyOn(toast, 'show');
await store.saveHistoryWithRevision(5, entries);
expect(toast.show).toHaveBeenCalledWith(
  expect.stringContaining('其他人已修改'),
  'warning'
);
```

---

## E4 — 模板管理增强（分类/标签/搜索）

### 新增文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/templates/TemplateSearchBar.tsx` | React 组件 | Fuse.js 搜索输入框 |
| `src/components/dds/templates/CategoryTab.tsx` | React 组件 | 分类 Tab 切换 |
| `src/lib/canvas/__tests__/templateSearch.test.ts` | Vitest | Fuse.js 搜索测试 |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/stores/dds/templateStore.ts` | 新增 `category`/`tags` 字段 + setCategory/addTag/removeTag actions |
| `src/components/dds/templates/TemplateGallery.tsx` | 新增分类 Tab 过滤 + 搜索结果渲染 |
| `src/components/dds/templates/TemplateEditDialog.tsx` | 新增 category selector + tag chip input |

### DoD Checklist

- [ ] `templateStore` 新增 `category` 字段（类型: `'flowchart' | 'mindmap' | 'uml' | 'other' | null`）
- [ ] `templateStore` 新增 `tags` 字段（类型: `string[]`）
- [ ] `setCategory(id, category)` action 正确更新状态
- [ ] `addTag(id, tag)` / `removeTag(id, tag)` actions 正确
- [ ] TemplateGallery 分类 Tab（全部/流程图/思维导图/UML/其他）过滤正确
- [ ] TemplateSearchBar Fuse.js 搜索返回相关结果（阈值 0.3）
- [ ] TemplateEditDialog 新增 category dropdown + tag input
- [ ] Vitest `templateStore.test.ts` category/tag cases 通过
- [ ] Vitest `templateSearch.test.ts` 搜索准确性 cases 通过

### 验收标准 expect()

```typescript
// E4.1: 分类设置
store.setCategory('tpl-1', 'flowchart');
expect(store.templates['tpl-1'].category).toBe('flowchart');

// E4.2: 标签管理
store.addTag('tpl-1', '重要');
expect(store.templates['tpl-1'].tags).toContain('重要');
store.removeTag('tpl-1', '重要');
expect(store.templates['tpl-1'].tags).not.toContain('重要');

// E4.3: 分类 Tab 过滤
renderGallery({ activeCategory: 'flowchart' });
expect(screen.queryByText('思维导图模板')).not.toBeInTheDocument();

// E4.4: 搜索
const results = searchTemplates('流程', allTemplates);
expect(results.length).toBeGreaterThanOrEqual(1);
expect(results[0].name).toContain('流程');
```

---

## E5 — 键盘快捷键自定义 UI

### 新增文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/stores/dds/shortcutStore.ts` | Zustand Store | 快捷键配置 + localStorage 持久化 |
| `src/components/dds/shortcuts/ShortcutSettingsPanel.tsx` | React 组件 | 设置 Modal（快捷键列表） |
| `src/components/dds/shortcuts/ShortcutKeyInput.tsx` | React 组件 | 按键捕获输入框 |
| `src/lib/canvas/__tests__/shortcutStore.test.ts` | Vitest | Store 逻辑测试 |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/hooks/canvas/useKeyboardShortcuts.ts` | 从 shortcutStore 读取用户覆盖配置 |
| `src/components/dds/DDSToolbar.tsx` | 新增"快捷键设置"按钮 |

### DoD Checklist

- [ ] `shortcutStore.ts` 正确加载 localStorage 配置
- [ ] `shortcutStore.ts` 保存配置到 localStorage
- [ ] DDSToolbar 显示"快捷键设置"入口按钮
- [ ] ShortcutSettingsPanel 列出所有可配置快捷键（undo/redo/save/delete 等）
- [ ] 双击快捷键触发 ShortcutKeyInput 捕获 keydown
- [ ] 快捷键配置在 localStorage，页面刷新后正确恢复
- [ ] 冲突检测阻止同一按键组合绑定多个 action（抛出 KeyConflictError）
- [ ] Vitest `shortcutStore.test.ts` save/load/reset/conflict 全通过

### 验收标准 expect()

```typescript
// E5.1: 持久化加载
const store = createShortcutStore();
expect(store.shortcuts['undo'].key).toBe('z');
expect(store.shortcuts['redo'].key).toBe('y');

// E5.2: 保存配置
store.bindShortcut('ctrl+z', 'redo');
expect(store.shortcuts['redo'].key).toBe('ctrl+z');

// E5.3: 冲突检测
expect(() => store.bindShortcut('ctrl+z', 'save')).toThrow('Key conflict');

// E5.4: 刷新恢复
const saved = store.exportConfig();
localStorage.setItem('shortcuts', JSON.stringify(saved));
const reloaded = createShortcutStore();
expect(reloaded.shortcuts['undo'].key).toBe('z');
```

---

## 通用 DoD（所有 Epic）

- [ ] 所有新增 .ts/.tsx 文件通过 TypeScript 编译（无 TS errors）
- [ ] 所有新增组件在 staging 环境可正常渲染
- [ ] 无 `console.error` 输出（忽略 warning）
- [ ] 所有 Vitest 测试在 Node.js 环境下通过（无 DOM 依赖走纯 TS 测试）

---

## Epic 顺序与依赖

```
E1 (P0) — 无依赖，优先实现
E2 (P1) — 无依赖，可与 E1 并行
E3 (P1) — 依赖 S51-E1 持久化基础设施
E4 (P2) — 依赖 S50-E4 导入导出
E5 (P2) — 依赖 S48-E3 基础设施
```

**建议开发顺序**: E1 → E2/E3 并行 → E4 → E5

---

## 技术约束

- 所有 UI 使用 `design-tokens.css` 变量，禁止内联 `style={{}}`
- WebSocket 消息类型需向后兼容（旧客户端忽略未知消息）
- localStorage 快捷键配置需处理 undefined/null（merge 默认值）
- Vitest 测试使用 `vi.mock()` 模拟 WebSocket，不依赖真实连接
- D1 migration 使用 `wrangler d1 migrations apply`

---

*文档版本: 1.0 | 创建时间: 2026-06-02*
