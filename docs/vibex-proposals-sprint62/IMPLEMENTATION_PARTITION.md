# Sprint62 实现分工（IMPLEMENTATION_PARTITION）

**项目**: vibex-proposals-sprint62
**Sprint**: 62
**版本**: 1.0
**日期**: 2026-06-04

---

## E1: 协作者实时同步

### DoD 检查清单

- [ ] **D1.1**: 扩展 `presenceStore.ts`（`src/lib/collaboration/presenceStore.ts`），新增 `editingNodeIds: Map<nodeId, {userId, userName, avatar, startedAt}>`。vitest: editingNodeIds set/delete/clear
- [ ] **D1.2**: 新建 `wsCollabHandler.ts`（`src/lib/collaboration/wsCollabHandler.ts`），新增 `collab:editing:start` + `collab:editing:end` 消息类型分发
- [ ] **D1.3**: `DDSCanvasPage.tsx`（`src/components/dds/DDSCanvasPage.tsx`）双击/选中节点时广播 `collab:editing:start`，选中取消时广播 `collab:editing:end`
- [ ] **D1.4**: 新建 `NodeEditorLock.tsx`（`src/components/canvas/NodeEditorLock.tsx`），节点边框 dashed + 显示锁定者名称标签
- [ ] **D1.5**: 编辑者离开节点（blur/esc）时广播 `collab:editing:end`，`presenceStore.editingNodeIds` 清除对应节点
- [ ] **D1.6**: vitest 覆盖 `presenceStore` 编辑锁定状态转换（start→end→conflict→resolve），覆盖率 ≥85%

### expect() 断言示例

```typescript
// D1.1: editingNodeIds
expect(presenceStore.getState().editingNodeIds.has('node-123')).toBe(true);
expect(presenceStore.getState().editingNodeIds.get('node-123')?.userName).toBe('alice');

// D1.2: wsCollabHandler 消息解析
expect(handler.parseMessage({ type: 'collab:editing:start', payload: {...} })).toBeDefined();
expect(handler.parseMessage({ type: 'collab:editing:end', payload: {...} })).toBeDefined();

// D1.5: 状态清除
expect(presenceStore.getState().editingNodeIds.has('node-123')).toBe(false);
```

### 新增文件

| 文件 | 路径 |
|------|------|
| wsCollabHandler | `src/lib/collaboration/wsCollabHandler.ts` |
| NodeEditorLock | `src/components/canvas/NodeEditorLock.tsx` |
| presenceStore.test | `src/lib/collaboration/__tests__/presenceStore.test.ts`（扩展）|

### 扩展文件

| 文件 | 路径 |
|------|------|
| presenceStore | `src/lib/collaboration/presenceStore.ts` |
| DDSCanvasPage | `src/components/dds/DDSCanvasPage.tsx` |

### 关键路径更正（PRD vs 实际）

> ⚠️ PRD 路径错误，以下列表为正确路径：
> - ❌ `src/stores/dds/collaborationStore.ts` → ✅ `src/lib/collaboration/presenceStore.ts`（已存在）
> - ❌ `src/lib/collaboration/wsCollabHandler.ts` → ✅ `src/lib/collaboration/wsCollabHandler.ts`（新建，正确）
> - ❌ `src/components/dds/canvas/NodeEditorLock.tsx` → ✅ `src/components/canvas/NodeEditorLock.tsx`（新建，正确）
> - ❌ `src/components/dds/canvas/DDSCanvas.tsx` → ✅ `src/components/dds/DDSCanvasPage.tsx`（已存在，正确）

---

## E2: 画布文件夹管理

### DoD 检查清单

- [ ] **D2.1**: 新建 `canvasFolderStore.ts`（`src/stores/dds/canvasFolderStore.ts`），实现文件夹 CRUD（createFolder/renameFolder/deleteFolder）
- [ ] **D2.2**: 实现 `moveCanvasToFolder(canvasId, folderId)` + `batchMoveToFolder(canvasIds, folderId)`，支持批量移动
- [ ] **D2.3**: 新建 `FolderTree.tsx`（`src/components/dds/canvas/FolderTree.tsx`），集成到 `CanvasListPanel.tsx`（`src/components/canvas/CanvasListPanel.tsx`），支持展开/折叠/右键菜单
- [ ] **D2.4**: 新建 `CreateFolderDialog.tsx`（`src/components/dds/canvas/CreateFolderDialog.tsx`），支持中文名称 + 空名称/重复名称校验
- [ ] **D2.5**: 文件夹删除时若有画布，弹出确认框（画布移至根目录）。vitest: 确认弹窗逻辑
- [ ] **D2.6**: vitest 覆盖 `canvasFolderStore` 全场景（CRUD + 移动 + 删除确认），≥20 个测试

### expect() 断言示例

```typescript
// D2.1: CRUD
canvasFolderStore.getState().createFolder('My Folder');
expect(canvasFolderStore.getState().folders.length).toBe(1);

// D2.2: 移动
canvasFolderStore.getState().moveCanvasToFolder('canvas-1', 'folder-1');
expect(canvasFolderStore.getState().canvasFolderMap.get('canvas-1')).toBe('folder-1');

// D2.5: 删除确认
canvasFolderStore.getState().moveCanvasToFolder('canvas-1', 'folder-1');
canvasFolderStore.getState().deleteFolder('folder-1');
expect(canvasFolderStore.getState().canvasFolderMap.get('canvas-1')).toBeNull(); // 画布回到根目录
```

### 新增文件

| 文件 | 路径 |
|------|------|
| canvasFolderStore | `src/stores/dds/canvasFolderStore.ts` |
| FolderTree | `src/components/dds/canvas/FolderTree.tsx` |
| CreateFolderDialog | `src/components/dds/canvas/CreateFolderDialog.tsx` |
| canvasFolderStore.test | `src/stores/dds/__tests__/canvasFolderStore.test.ts` |

### 扩展文件

| 文件 | 路径 |
|------|------|
| CanvasListPanel | `src/components/canvas/CanvasListPanel.tsx` |

### 关键路径更正（PRD vs 实际）

> ⚠️ PRD 路径错误，以下列表为正确路径：
> - ❌ `src/components/dds/canvas/FolderTree.tsx` → ✅ `src/components/dds/canvas/FolderTree.tsx`（新建，正确）
> - ❌ `src/components/dds/canvas/CreateFolderDialog.tsx` → ✅ `src/components/dds/canvas/CreateFolderDialog.tsx`（新建，正确）
> - ❌ `src/components/dds/canvas/CanvasListPanel.tsx` → ✅ `src/components/canvas/CanvasListPanel.tsx`（已存在，扩展，正确）

---

## E3: 画布云端备份与恢复

### DoD 检查清单

- [ ] **D3.1**: 新建 `BackupService.ts`（`src/services/backup/BackupService.ts`），实现 `backup()/restore()/listBackups()` 方法，调用 `/api/backup` 端点
- [ ] **D3.2**: 新建 `backupStore.ts`（`src/stores/dds/backupStore.ts`），管理备份任务状态（pendingBackups + backupHistory）
- [ ] **D3.3**: 新建 `BackupPanel.tsx`（`src/components/dds/canvas/BackupPanel.tsx`），集成到 DDSToolbar，显示备份历史 + 一键恢复按钮
- [ ] **D3.4**: 新建 API 端点: `src/app/api/backup/route.ts`（POST 上传）+ `src/app/api/backup/[canvasId]/route.ts`（GET 列表 + POST 恢复）
- [ ] **D3.5**: vitest 覆盖 `BackupService`（mock fetch，19 个测试）+ `backupStore`（9 个测试）

### expect() 断言示例

```typescript
// D3.1: BackupService
const backups = await BackupService.listBackups('canvas-1');
expect(backups).toHaveLength(3);
expect(backups[0].canvasId).toBe('canvas-1');

// D3.5: backupStore
backupStore.getState().addPendingBackup('canvas-1', { size: 1024, timestamp: Date.now() });
expect(backupStore.getState().pendingBackups.has('canvas-1')).toBe(true);
```

### 新增文件

| 文件 | 路径 |
|------|------|
| BackupService | `src/services/backup/BackupService.ts` |
| backupStore | `src/stores/dds/backupStore.ts` |
| BackupPanel | `src/components/dds/canvas/BackupPanel.tsx` |
| API: /api/backup | `src/app/api/backup/route.ts` |
| API: /api/backup/[canvasId] | `src/app/api/backup/[canvasId]/route.ts` |
| BackupService.test | `src/services/backup/__tests__/BackupService.test.ts` |

### 扩展文件

| 文件 | 路径 |
|------|------|
| DDSToolbar | `src/components/dds/DDSToolbar.tsx` |
| canvasHistoryStore | `src/stores/dds/canvasHistoryStore.ts` |

### 关键路径更正（PRD vs 实际）

> ⚠️ PRD 未指定 Service 路径，以下列表为建议路径：
> - ✅ `src/services/backup/BackupService.ts`（新建目录+文件）
> - ✅ `src/components/dds/canvas/BackupPanel.tsx`（新建，正确组件位置）

---

## E4: 协作 Undo/Redo

### DoD 检查清单

- [ ] **D4.1**: 新建 `undoRedoStore.ts`（`src/stores/dds/undoRedoStore.ts`），管理 `undoStack[]/redoStack[]` + `ownerUserId`，支持 `push(action)/undo()/redo()`
- [ ] **D4.2**: `wsCollabHandler.ts`（E1 新建）新增 `collab:undo` + `collab:redo` 消息分发
- [ ] **D4.3**: DDSToolbar（`src/components/dds/DDSToolbar.tsx`）扩展 Undo/Redo 按钮 + 显示当前操作者名称
- [ ] **D4.4**: 冲突检测: Undo 前检查 `presenceStore.editingNodeIds`（E1），若目标节点被他人编辑则弹窗警告
- [ ] **D4.5**: vitest 覆盖 `undoRedoStore`（15 个测试）+ `wsCollabHandler.undo-redo`（5 个测试）

### expect() 断言示例

```typescript
// D4.1: undoRedoStore
undoRedoStore.getState().push({ type: 'node-move', snapshot: {...} });
expect(undoRedoStore.getState().undoStack.length).toBe(1);
undoRedoStore.getState().undo();
expect(undoRedoStore.getState().redoStack.length).toBe(1);

// D4.4: 冲突检测
presenceStore.getState().editingNodeIds.set('node-1', { userId: 'bob', userName: 'Bob', avatar: '', startedAt: Date.now() });
const conflict = undoRedoStore.getState().checkConflict('node-1', 'alice');
expect(conflict).toBe(true);
```

### 新增文件

| 文件 | 路径 |
|------|------|
| undoRedoStore | `src/stores/dds/undoRedoStore.ts` |
| undoRedoStore.test | `src/stores/dds/__tests__/undoRedoStore.test.ts` |

### 扩展文件

| 文件 | 路径 |
|------|------|
| wsCollabHandler | `src/lib/collaboration/wsCollabHandler.ts`（E1 新建）|
| DDSToolbar | `src/components/dds/DDSToolbar.tsx` |
| presenceStore | `src/lib/collaboration/presenceStore.ts`（E1 扩展）|

---

## E5: 离线 PWA 支持

### DoD 检查清单

- [ ] **D5.1**: 配置 `vite-plugin-pwa`（`vite.config.ts`），生成 `public/sw.js`，注册 Service Worker
- [ ] **D5.2**: 扩展 `offline-queue.ts`（`src/lib/offline-queue.ts`），新增 `queueCloudBackup()/queueUndoRedo()` 方法
- [ ] **D5.3**: `sw.ts` 实现缓存策略: CacheFirst（静态资源）+ NetworkFirst（API）+ IndexedDB 队列（写操作）
- [ ] **D5.4**: 离线时画布页面显示"离线模式" banner（`src/components/dds/canvas/OfflineBanner.tsx`）
- [ ] **D5.5**: Service Worker 缓存最近 5 个画布数据（节点+边+元数据），TTL 7 天
- [ ] **D5.6**: e2e 测试: `tests/e2e/offline-canvas.spec.ts` 扩展离线操作场景

### expect() 断言示例

```typescript
// D5.2: 离线队列扩展
const queue = new OfflineQueue();
await queue.queueCloudBackup('canvas-1', { nodes: [...], edges: [...] });
expect(await queue.getPendingItems()).toHaveLength(1);

// D5.5: 缓存管理
const cache = await caches.open('canvas-cache-v1');
const keys = await cache.keys();
expect(keys.length).toBeLessThanOrEqual(5);
```

### 新增文件

| 文件 | 路径 |
|------|------|
| sw.ts | `src/sw.ts`（Vite PWA 入口）|
| OfflineBanner | `src/components/dds/canvas/OfflineBanner.tsx` |
| offline.test | `src/__tests__/offline.test.ts` |

### 扩展文件

| 文件 | 路径 |
|------|------|
| vite.config.ts | 需添加 vite-plugin-pwa 配置 |
| offline-queue.ts | `src/lib/offline-queue.ts` |
| manifest.json | `public/manifest.json`（可能需扩展）|

---

## 测试命令

```bash
# E1: presenceStore 编辑锁定测试
npx vitest run src/lib/collaboration/__tests__/presenceStore.test.ts --reporter=verbose

# E2: canvasFolderStore 测试
npx vitest run src/stores/dds/__tests__/canvasFolderStore.test.ts --reporter=verbose

# E3: BackupService 测试
npx vitest run src/services/backup/__tests__/BackupService.test.ts --reporter=verbose

# E4: undoRedoStore 测试
npx vitest run src/stores/dds/__tests__/undoRedoStore.test.ts --reporter=verbose

# E5: 离线测试
npx vitest run src/__tests__/offline.test.ts --reporter=verbose
```

---

## Epic 实现顺序（推荐）

1. **E1** → 基础（presenceStore 扩展 + wsCollabHandler）
2. **E2** → UI（文件夹管理，独立于协作）
3. **E3** → 服务（备份服务，独立于协作）
4. **E4** → 协作（依赖 E1 的 wsCollabHandler + presenceStore）
5. **E5** → 集成（复用 E1-E4 的基础设施）

---

## 跨 Epic 依赖图

```
E1 (presenceStore 扩展 + wsCollabHandler)
  ├── E4 (wsCollabHandler.undo-redo + presenceStore.editingNodeIds)
  └── E2, E3 (独立，无依赖)

E5 (PWA)
  ├── E2 (canvasFolderStore 缓存)
  ├── E3 (BackupService 队列)
  └── E4 (undoRedoStore 持久化)
```
