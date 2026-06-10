# S76 产品需求文档

**项目**: vibex-proposals-sprint76
**日期**: 2026-06-07
**依据**: analysis.md (P001-P005)

---

## 执行摘要

| Epic | 功能名称 | 优先级 | 负责人 |
|------|---------|--------|--------|
| E1 | 画布背景设置集成 | P0 | — |
| E2 | 批量画布操作工具栏 | P1 | — |
| E3 | 全文搜索增强 | P1 | — |
| E4 | 画布导入导出完整流程 | P1 | — |
| E5 | 协作冲突检测与提示 | P2 | — |

---

## E1: 画布背景设置集成

### DoD
- [ ] `settingsStore` 新增 `canvasBackground: { variant, gap, size, color }` 状态
- [ ] `CanvasSettingsPanel` 新增第4个 Tab「背景」切换5种背景样式（dots/grid/cross/dots-grid/none）
- [ ] `DDSToolbar.tsx` 移除硬编码 Background 组件，改为从 `settingsStore.canvasBackground` 读取
- [ ] 背景设置通过 Zustand `persist` 中间件持久化到 localStorage
- [ ] vitest: `settingsStore.test.ts` 新增 canvasBackground 读/写/持久化测试
- [ ] vitest: `CanvasSettingsPanel.test.tsx` 覆盖背景 Tab 切换

**expect() 断言示例**:
```typescript
expect(settingsStore.getState().canvasBackground.variant).toBe('dots');
settingsStore.getState().setCanvasBackground({ variant: 'grid', gap: 20 });
expect(settingsStore.getState().canvasBackground.gap).toBe(20);
```

**技术风险**: `DDSToolbar.tsx` L213 硬编码 Background 需要 refactor，不影响其他功能。

---

## E2: 批量画布操作工具栏

### DoD
- [ ] `BatchOpsToolbar.tsx` 新建：显示选中数量 + 操作按钮
- [ ] `FolderTree.tsx` 多选（Ctrl+Click）后自动显示 BatchOpsToolbar
- [ ] 批量导出：选中画布打包 .zip（复用 `ZipExporter`）
- [ ] 批量移动：弹出文件夹选择器，移动选中画布到目标文件夹
- [ ] 批量删除：二次确认弹窗 `BatchDeleteConfirmDialog`，确认后从 IndexedDB 删除
- [ ] BatchOpsToolbar 支持 Esc 关闭 / 点击空白关闭
- [ ] vitest: `BatchOpsToolbar.test.tsx` 6个测试用例（多选状态切换、导出/移动/删除按钮激活状态、确认弹窗）

**expect() 断言示例**:
```typescript
expect(screen.getByText('已选中 3 个画布')).toBeInTheDocument();
expect(screen.getByRole('button', { name: '导出' })).toBeEnabled();
expect(screen.queryByRole('button', { name: '移动' })).toBeDisabled(); // 未选中时
```

**技术风险**: FolderTree 多选状态需要共享到 BatchOpsToolbar，考虑使用 `canvasListStore` 的 `selectedCanvasIds` 数组。

---

## E3: 全文搜索增强

### DoD
- [ ] `canvasListStore` 新增 `canvasIndex: CanvasIndexEntry[]` + `rebuildIndex()` action
- [ ] `Fuse.js` 集成搜索，支持多字段加权（名称:2, 描述:1, 标签:1）
- [ ] `GlobalSearchPanel.tsx` 搜索结果分组显示（画布/模板）
- [ ] `canvasListStore.getState().indexedSearch(query)` 返回分组结果
- [ ] Cmd/Ctrl+K 全局快捷键呼出 GlobalSearchPanel（`useEffect` 监听 keydown）
- [ ] vitest: `canvasSearchStore.test.ts` 扩展 indexedSearch 测试（空结果/多结果/标签匹配）

**expect() 断言示例**:
```typescript
const results = canvasSearchStore.getState().indexedSearch('test');
expect(results.canvases.length).toBeGreaterThan(0);
expect(results.canvases[0].score).toBeDefined();
expect(results.canvases[0].matches[0].key).toMatch(/name|description/);
```

**技术风险**: Fuse.js 索引在画布数量 >1000 时内存占用需评估，可考虑延迟索引策略。

---

## E4: 画布导入导出完整流程

### DoD
- [ ] `DDSToolbar ExportMenu` 添加「导出选中画布」菜单项（选中 FolderTree 时激活）
- [ ] `DDSToolbar ExportMenu` 添加「导出全部画布」菜单项
- [ ] `ZipExporter.exportCanvases(canvasIds: string[])` 支持批量打包
- [ ] 新建 `CanvasImportPanel.tsx` + `CanvasImportPanel.module.css`：拖拽上传区 + 文件列表预览
- [ ] 支持 .vibex / .json 文件导入，解析后写入 IndexedDB + `canvasListStore`
- [ ] 导入后自动打开导入的画布
- [ ] vitest: `ZipExporter.test.ts` 新增批量导出测试（2+ 画布打包）

**expect() 断言示例**:
```typescript
const exported = await ZipExporter.exportCanvases(['id1', 'id2']);
expect(exported.blob.size).toBeGreaterThan(0);
expect(exported.filename).toMatch(/\.zip$/);
```

**技术风险**: 导入文件需做安全验证（防恶意 .html 注入），DDSToolbar ExportMenu 当前无"选中画布"状态。

---

## E5: 协作冲突检测与提示

### DoD
- [ ] `presenceStore` 新增 `remoteEditing: Map<string, { nodeId: string, userName: string }>`
- [ ] WS 消息类型新增 `editing_node`（广播当前编辑节点 ID）
- [ ] `DDSCanvasPage.tsx` 监听 `remoteEditing`，检测同节点编辑时显示 `ConflictWarningBanner`
- [ ] `ConflictWarningBanner.tsx` 新建：显示「{userName} 正在编辑此节点」，3秒后自动消失
- [ ] 用户编辑节点时自动发送 `editing_node` WS 消息；离开节点时发送 `editing_node: null`
- [ ] vitest: `presenceStore.test.ts` 新增 remoteEditing 增/删/检测测试

**expect() 断言示例**:
```typescript
presenceStore.getState().setRemoteEditing('user2', { nodeId: 'n1', userName: 'Bob' });
const conflict = presenceStore.getState().checkNodeConflict('n1', 'me');
expect(conflict).toEqual({ nodeId: 'n1', userName: 'Bob' });
```

**技术风险**: WS 连接断开时 `editing_node` 消息丢失，用户可能看到过期提示。考虑增加 `editing_node` 的心跳保活机制。

---

## 跨 Epic 集成表

| 集成点 | E1 依赖 E2/E3/E4/E5 |
|--------|---------------------|
| E1 → E2 | BatchOpsToolbar 选中画布后可批量导出，背景设置不影响 |
| E1 → E3 | GlobalSearchPanel 呼出时不应遮挡 BatchOpsToolbar |
| E1 → E4 | CanvasImportPanel 导入后需触发 `rebuildIndex()`（E3）|
| E2 → E3 | 批量选中画布后可在 GlobalSearchPanel 中过滤 |
| E2 → E4 | 批量导出使用 ZipExporter（E4 已实现）|

---

## 页面集成标注

- `DDSToolbar.tsx` — E1（移除硬编码 Background）、E2（BatchOpsToolbar 入口）、E4（ExportMenu）
- `CanvasSettingsPanel.tsx` — E1（背景 Tab）、E5（冲突提示）
- `FolderTree.tsx` — E2（多选状态共享）
- `GlobalSearchPanel.tsx` — E3（搜索增强）、E5（冲突提示）
- `BatchOpsToolbar.tsx` — E2（新建）
- `CanvasImportPanel.tsx` — E4（新建）
- `ConflictWarningBanner.tsx` — E5（新建）
- `presenceStore.ts` — E5（remoteEditing）
- `settingsStore.ts` — E1（canvasBackground）
- `canvasListStore.ts` — E3（canvasIndex）
- `ZipExporter.ts` — E4（批量导出扩展）
