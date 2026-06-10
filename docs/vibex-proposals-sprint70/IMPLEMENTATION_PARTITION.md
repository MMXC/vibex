# S70 Implementation Partition — IMP

**Sprint**: vibex-proposals-sprint70  
**日期**: 2026-06-06  
**参考**: prd.md, architecture.md, analysis.md

---

## E1: 画布分支合并与冲突处理

### DoD Checklist

- [ ] `BranchManager.tsx` — 新增 `MergeBranchButton` 组件（仅在非主分支显示）
- [ ] `canvasHistoryStore.ts` — 扩展 `mergeBranch(canvasId, branchName, resolutions?)` action + `pendingConflicts` state
- [ ] `SnapshotCompareDialog.tsx` — 新增 merge-preview 模式（传 `mode="merge"` prop）
- [ ] `ConflictResolutionDialog.tsx` — 新建，冲突解决对话框（双版本对比 + 三个解决按钮）
- [ ] `DDSDanvasPage.tsx` — 合并成功后调用 `canvasStore.reloadFromSnapshot()`
- [ ] `canvasHistoryStore.e1-merge.test.ts` — vitest 测试覆盖 merge + conflict scenarios

### 新增/扩展文件

| 文件路径 | 类型 | 说明 |
|---------|------|------|
| `src/stores/dds/canvasHistoryStore.ts` | 扩展 | mergeBranch action + pendingConflicts |
| `src/components/dds/canvas-history/BranchManager.tsx` | 扩展 | MergeBranchButton |
| `src/components/dds/canvas/SnapshotCompareDialog.tsx` | 扩展 | merge-preview 模式 |
| `src/components/dds/canvas-dashboard/ConflictDialog.tsx` | 新建 | ConflictResolutionDialog.tsx（复用 ConflictDialog 基础样式） |
| `src/stores/dds/canvasHistoryStore.e1-merge.test.ts` | 新建 | E1 测试 |

### expect() 断言模式

```typescript
// MergeBranchButton visible only on non-main branch
expect(screen.getByRole('button', { name: /合并到主分支/i })).toBeInTheDocument();

// Conflict count shown in dialog
expect(screen.getByText(/冲突节点：\d+ 个/)).toBeInTheDocument();

// Resolution options
expect(screen.getByRole('button', { name: /保留我的版本/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /采用对方版本/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /合并内容/i })).toBeInTheDocument();

// After resolution
await user.click(screen.getByRole('button', { name: /保留我的版本/i }));
expect(canvasHistoryStore.getState().pendingConflicts).toHaveLength(0);
expect(canvasHistoryStore.getState().currentBranch).toBe('main');
```

### 测试命令
```bash
cd vibex-fronted
npx vitest run canvasHistoryStore.e1-merge.test.ts --reporter=verbose
```

---

## E2: 模板市场发现与浏览

### DoD Checklist

- [ ] `templateStore.ts` — 新增 `featuredTemplates()` / `searchMarketplace(query, tags)` / `getMarketplaceTemplates()`
- [ ] `TemplateMarketplacePanel.tsx` — 新建，市场专页组件（热门榜单 + 标签云 + 搜索）
- [ ] `TemplateGallery.tsx` — 集成 TemplateMarketplacePanel 到"发现" Tab
- [ ] 模板卡片增强 — 显示使用量 + 标签 chips + 作者
- [ ] `templateStore.marketplace.test.ts` — vitest 测试

### 新增/扩展文件

| 文件路径 | 类型 | 说明 |
|---------|------|------|
| `src/stores/templateStore.ts` | 扩展 | featuredTemplates/searchMarketplace/getMarketplaceTemplates |
| `src/components/dds/templates/TemplateMarketplacePanel.tsx` | 新建 | 市场专页组件 |
| `src/components/dds/templates/TemplateGallery.tsx` | 扩展 | 集成市场 Tab |
| `src/stores/templateStore.marketplace.test.ts` | 新建 | E2 测试 |

### expect() 断言模式

```typescript
expect(screen.getByText(/热门模板/)).toBeInTheDocument();
expect(screen.getByRole('searchbox', { name: /搜索市场模板/i })).toBeInTheDocument();
const cards = screen.getAllByTestId('template-card');
expect(cards[0]).toHaveTextContent(/\d+ 次使用/);
expect(cards[0]).toHaveTextContent(/标签:.*/);
```

### 测试命令
```bash
cd vibex-fronted
npx vitest run templateStore.marketplace.test.ts --reporter=verbose
```

---

## E3: 多格式批量画布导出

### DoD Checklist

- [ ] `ZipExporter.ts` — 新增 `exportMultiFormat(canvasId)` 方法
- [ ] `ExportMenu.tsx` — 添加"多格式导出(zip)"菜单项
- [ ] `MultiFormatExporter.ts` — 新建，多格式导出服务（封装三种格式生成 + zip 打包）
- [ ] `ExportProgress.tsx` — 扩展进度条支持多格式状态
- [ ] `ZipExporter.multi-format.test.ts` — vitest 测试

### 新增/扩展文件

| 文件路径 | 类型 | 说明 |
|---------|------|------|
| `src/services/export/ZipExporter.ts` | 扩展 | exportMultiFormat |
| `src/services/export/MultiFormatExporter.ts` | 新建 | 多格式导出逻辑 |
| `src/components/dds/toolbar/ExportMenu.tsx` | 扩展 | 多格式导出菜单项 |
| `src/components/dds/export/ExportProgress.tsx` | 扩展 | 多格式进度状态 |
| `src/services/export/ZipExporter.multi-format.test.ts` | 新建 | E3 测试 |

### expect() 断言模式

```typescript
expect(screen.getByRole('menuitem', { name: /多格式导出.*zip/i })).toBeInTheDocument();
await user.click(screen.getByRole('menuitem', { name: /多格式导出/i }));
expect(screen.getByText(/正在生成 PNG/i)).toBeInTheDocument();
expect(screen.getByText(/正在生成 SVG/i)).toBeInTheDocument();
expect(screen.getByText(/正在生成 PDF/i)).toBeInTheDocument();
expect(screen.getByRole('progressbar')).toBeInTheDocument();
```

### 测试命令
```bash
cd vibex-fronted
npx vitest run ZipExporter.multi-format.test.ts --reporter=verbose
```

---

## E4: 协作冲突检测与锁升级

### DoD Checklist

- [ ] `presenceStore.ts` — 新增 `pendingConflicts: ConflictRecord[]` + `addConflict()` / `resolveConflict()` / `detectConflict()`
- [ ] `ConflictResolutionDialog.tsx` — 新建，冲突解决对话框（双版本对比 + 解决按钮）
- [ ] `DDSDanvasPage.tsx` — 监听 `pendingConflicts` 变化，自动弹出冲突对话框
- [ ] `useCollabEditing.ts` — 新增冲突检测逻辑（双写时间窗口 5s）
- [ ] `presenceStore.conflict.test.ts` — vitest 测试

### 新增/扩展文件

| 文件路径 | 类型 | 说明 |
|---------|------|------|
| `src/lib/collaboration/presenceStore.ts` | 扩展 | pendingConflicts + conflict actions |
| `src/lib/collaboration/useCollabEditing.ts` | 扩展 | 冲突检测逻辑 |
| `src/components/dds/collaboration/ConflictResolutionDialog.tsx` | 新建 | 冲突解决对话框 |
| `src/components/dds/DDSCanvasPage.tsx` | 扩展 | 监听 pendingConflicts |
| `src/lib/collaboration/presenceStore.conflict.test.ts` | 新建 | E4 测试 |

### expect() 断言模式

```typescript
expect(screen.getByText(/版本 A|版本 B/)).toBeInTheDocument();
expect(screen.getByRole('button', { name: /保留我的版本/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /采用对方版本/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /合并内容/i })).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: /保留我的版本/i }));
expect(presenceStore.getState().pendingConflicts).toHaveLength(0);
```

### 测试命令
```bash
cd vibex-fronted
npx vitest run presenceStore.conflict.test.ts --reporter=verbose
```

---

## E5: 画布设置面板完善

### DoD Checklist

- [ ] `DDSToolbar.tsx` — 设置按钮绑定 `isSettingsOpen` 状态 + open handler
- [ ] `CanvasSettingsDrawer.tsx` — 新建，侧边抽屉（4 tabs: 预设/画布/节点/协作）
- [ ] 预设 Tab — 复用 `ViewPresetsPanel` 内容
- [ ] `CanvasSettingsDrawer.test.tsx` — vitest 测试（开关 + tab 切换 + ESC 关闭）

### 新增/扩展文件

| 文件路径 | 类型 | 说明 |
|---------|------|------|
| `src/components/dds/toolbar/DDSToolbar.tsx` | 扩展 | 设置按钮 onClick |
| `src/components/dds/settings/CanvasSettingsDrawer.tsx` | 新建 | 设置抽屉 |
| `src/components/dds/settings/CanvasSettingsDrawer.test.tsx` | 新建 | E5 测试 |

### expect() 断言模式

```typescript
expect(screen.getByRole('button', { name: /设置/i })).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: /设置/i }));
expect(screen.getByRole('dialog')).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /预设/i })).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /画布/i })).toBeInTheDocument();
await user.keyboard('{Escape}');
expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
```

### 测试命令
```bash
cd vibex-fronted
npx vitest run CanvasSettingsDrawer.test.tsx --reporter=verbose
```

---

## vitest 测试汇总

| Epic | 测试文件 | 预期通过 |
|------|---------|---------|
| E1 | `canvasHistoryStore.e1-merge.test.ts` | 8+ |
| E2 | `templateStore.marketplace.test.ts` | 6+ |
| E3 | `ZipExporter.multi-format.test.ts` | 5+ |
| E4 | `presenceStore.conflict.test.ts` | 8+ |
| E5 | `CanvasSettingsDrawer.test.tsx` | 5+ |

---

## i18n 需求

| Key | zh | en | 位置 |
|-----|----|----|------|
| `branch.merge_to_main` | 合并到主分支 | Merge to Main | BranchManager |
| `conflict.title` | 冲突解决 | Conflict Resolution | ConflictResolutionDialog |
| `conflict.keep_mine` | 保留我的版本 | Keep My Version | ConflictResolutionDialog |
| `conflict.keep_theirs` | 采用对方版本 | Keep Their Version | ConflictResolutionDialog |
| `conflict.merge_both` | 合并内容 | Merge Both | ConflictResolutionDialog |
| `marketplace.title` | 发现 | Discover | TemplateMarketplacePanel |
| `marketplace.hot` | 热门模板 | Featured Templates | TemplateMarketplacePanel |
| `export.multi_format` | 多格式导出(zip) | Multi-format Export (zip) | ExportMenu |
| `settings.drawer_title` | 画布设置 | Canvas Settings | CanvasSettingsDrawer |

---

## 分支创建

```bash
cd vibex-fronted
git checkout -b epic/s70-e1-branch-merge origin/main
# E1 实现完成后:
git checkout -b epic/s70-e2-template-marketplace origin/main
git checkout -b epic/s70-e3-multi-export origin/main
git checkout -b epic/s70-e4-collab-conflict origin/main
git checkout -b epic/s70-e5-settings-drawer origin/main
```
