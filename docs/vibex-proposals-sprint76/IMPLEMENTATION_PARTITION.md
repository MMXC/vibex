# S76 实施分区计划

**项目**: vibex-proposals-sprint76
**日期**: 2026-06-07

---

## E1: 画布背景设置集成

**DoD Checklist**:
- [ ] `settingsStore.ts` 新增 `canvasBackground` + `setCanvasBackground()`
- [ ] `CanvasSettingsPanel.tsx` 新增背景 Tab（含5种样式切换）
- [ ] `DDSToolbar.tsx` 移除 L213 硬编码 Background，改为动态读取 store
- [ ] `settingsStore.test.ts` 新增 canvasBackground 测试

**新增/扩展文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/stores/dds/settingsStore.ts` | 扩展 | +canvasBackground + setCanvasBackground |
| `src/stores/dds/settingsStore.test.ts` | 扩展 | +canvasBackground tests |
| `src/components/dds/settings/CanvasSettingsPanel.tsx` | 扩展 | +背景 Tab |
| `src/components/dds/toolbar/DDSToolbar.tsx` | 扩展 | -硬编码 Background |

**expect() 断言**:
```typescript
expect(settingsStore.getState().canvasBackground.variant).toBe('dots');
settingsStore.getState().setCanvasBackground({ variant: 'grid', gap: 20 });
expect(settingsStore.getState().canvasBackground.gap).toBe(20);
const bg = useSettingsStore.getState().canvasBackground;
expect(bg).toEqual({ variant: 'grid', gap: 20, size: 1, color: '#e5e7eb' });
```

---

## E2: 批量画布操作工具栏

**DoD Checklist**:
- [ ] BatchOpsToolbar 监听 `canvasListStore.selectedCanvasIds`
- [ ] FolderTree Ctrl+Click 多选后显示 BatchOpsToolbar
- [ ] 批量导出复用 ZipExporter.exportCanvases()
- [ ] 批量移动：文件夹选择 Dialog
- [ ] 批量删除：BatchDeleteConfirmDialog + IndexedDB 删除
- [ ] Esc / 点击空白关闭 BatchOpsToolbar
- [ ] BatchOpsToolbar.test.tsx 6测试用例

**新增/扩展文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` | 扩展 | +FolderTree 集成 |
| `src/components/dds/canvas-dashboard/BatchDeleteConfirmDialog.tsx` | 新建 | 二次确认 |
| `src/components/dds/canvas-dashboard/BatchDeleteConfirmDialog.module.css` | 新建 | 样式 |
| `src/components/dds/canvas-dashboard/BatchOpsToolbar.test.tsx` | 扩展 | +6测试 |

**expect() 断言**:
```typescript
expect(screen.getByText('已选中 3 个画布')).toBeInTheDocument();
expect(screen.getByRole('button', { name: '导出' })).toBeEnabled();
fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
expect(canvasListStore.getState().canvases.length).toBe(0);
```

---

## E3: 全文搜索增强

**DoD Checklist**:
- [ ] `canvasListStore` 新增 `canvasIndex[]` + `rebuildIndex()` + `indexedSearch()`
- [ ] Fuse.js 多字段加权搜索（名称:2, 描述:1, 标签:1）
- [ ] GlobalSearchPanel 搜索结果分组（画布/模板）
- [ ] Cmd/Ctrl+K 全局快捷键
- [ ] canvasSearchStore.test.ts 扩展 indexedSearch 测试

**新增/扩展文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/stores/canvasListStore.ts` | 扩展 | +canvasIndex + indexedSearch |
| `src/stores/canvasSearchStore.test.ts` | 扩展 | +indexedSearch tests |
| `src/components/dds/search/GlobalSearchPanel.tsx` | 扩展 | +分组显示 |

**expect() 断言**:
```typescript
const results = canvasSearchStore.getState().indexedSearch('test');
expect(results.canvases.length).toBeGreaterThan(0);
expect(results.canvases[0].matches[0].key).toMatch(/name|description/);
```

---

## E4: 画布导入导出完整流程

**DoD Checklist**:
- [ ] ExportMenu 新增「导出选中画布」菜单项
- [ ] ExportMenu 新增「导出全部画布」菜单项
- [ ] ZipExporter.exportCanvases(canvasIds[]) 批量打包
- [ ] CanvasImportPanel.tsx 拖拽上传 + 文件预览
- [ ] 导入写入 IndexedDB + canvasListStore
- [ ] 导入后自动打开画布
- [ ] ZipExporter.multi-format.test.ts 批量导出测试

**新增/扩展文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/services/export/ZipExporter.ts` | 扩展 | +exportCanvases() |
| `src/components/dds/toolbar/ExportMenu.tsx` | 扩展 | +批量导出入口 |
| `src/components/dds/canvas-dashboard/CanvasImportPanel.tsx` | 新建 | 导入面板 |
| `src/components/dds/canvas-dashboard/CanvasImportPanel.module.css` | 新建 | 样式 |
| `src/services/export/__tests__/ZipExporter.multi-format.test.ts` | 扩展 | +批量测试 |

**expect() 断言**:
```typescript
const exported = await ZipExporter.exportCanvases(['id1', 'id2']);
expect(exported.filename).toMatch(/\.zip$/);
expect(exported.blob.size).toBeGreaterThan(0);
```

---

## E5: 协作冲突检测与提示

**DoD Checklist**:
- [ ] presenceStore 新增 `remoteEditing: Map<userId, {nodeId, userName}>`
- [ ] WS 消息类型 `editing_node` 新增
- [ ] DDSCanvasPage 监听 remoteEditing，显示 ConflictWarningBanner
- [ ] 编辑节点时发送 `editing_node` WS 消息
- [ ] 离开节点时发送 `editing_node: null`
- [ ] presenceStore.test.ts 新增 remoteEditing 测试

**新增/扩展文件**:
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/collaboration/presenceStore.ts` | 扩展 | +remoteEditing |
| `src/components/dds/canvas-dashboard/ConflictWarningBanner.tsx` | 新建 | 冲突警告 Banner |
| `src/components/dds/canvas-dashboard/ConflictWarningBanner.module.css` | 新建 | 样式 |
| `src/components/dds/canvas-dashboard/DDSCanvasPage.tsx` | 扩展 | +ConflictWarningBanner |
| `src/lib/collaboration/__tests__/presenceStore.test.ts` | 扩展 | +remoteEditing tests |

**expect() 断言**:
```typescript
presenceStore.getState().setRemoteEditing('u2', { nodeId: 'n1', userName: 'Bob' });
const conflict = presenceStore.getState().checkNodeConflict('n1', 'me');
expect(conflict).toEqual({ nodeId: 'n1', userName: 'Bob' });
```

---

## 测试命令

```bash
cd vibex-fronted

# E1
npx vitest run settingsStore --reporter=verbose

# E2
npx vitest run BatchOpsToolbar --reporter=verbose

# E3
npx vitest run canvasSearchStore --reporter=verbose

# E4
npx vitest run ZipExporter --reporter=verbose

# E5
npx vitest run presenceStore --reporter=verbose

# 全量
npx vitest run --reporter=verbose
```

---

## Epic 依赖关系

```
E1 (背景设置)
  └─ 无依赖 → 可最先实现

E3 (搜索增强)
  └─ 依赖 canvasListStore → E1/E2 可并行

E2 (批量操作)
  └─ 依赖 BatchOpsToolbar + canvasListStore → 可与 E3/E4 并行

E4 (导入导出)
  └─ 依赖 ZipExporter → 可与 E2/E3 并行

E5 (冲突检测)
  └─ 依赖 presenceStore + DDSCanvasPage → 最后实现
```
