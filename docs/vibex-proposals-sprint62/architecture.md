# Sprint62 架构设计

**项目**: vibex-proposals-sprint62
**Sprint**: 62
**版本**: 1.0
**日期**: 2026-06-04

---

## 执行摘要

Sprint62 在 Sprint61 国际化/批量导出/AI会话集成的基础上，新增**协作者实时同步**、**画布文件夹管理**、**画布云端备份**、**协作 Undo/Redo** 和**离线 PWA** 五大 Epic，构建多用户协作闭环与画布生命周期管理能力。

---

## Epic 架构决策

### E1: 协作者实时同步（编辑锁定感知）

**目标**: 解决多用户同时编辑同一节点时的数据覆盖风险。

**核心架构决策**:

1. **编辑锁定状态存储于 `presenceStore.ts`（扩展）**
   - 路径: `src/lib/collaboration/presenceStore.ts`（已存在于 main）
   - 扩展: 新增 `editingNodeIds: Map<nodeId, {userId, userName, avatar, startedAt}>` 字段
   - 理由: `presenceStore` 已管理 `remoteUsers[]` 和 cursor 状态，扩展现有 store 而非新建 store 避免状态割裂

2. **WebSocket 消息类型扩展: `collab:editing`**
   - 路径: `src/lib/collaboration/wsCollabHandler.ts`（新增）
   - 两个子类型: `collab:editing:start` + `collab:editing:end`
   - Payload: `{ nodeId, userId, userName, avatar }`
   - 理由: 独立于现有的 `presence:update` 消息，避免状态混淆

3. **节点编辑锁定 UI: `NodeEditorLock.tsx`**
   - 路径: `src/components/canvas/NodeEditorLock.tsx`（新增）
   - 集成到 `DDSCanvasPage.tsx`（已存在于 main）
   - 视觉: 节点边框变为 `dashed` + 显示锁定者头像+名称标签
   - 理由: 独立组件避免与现有节点组件耦合，支持多用户同时看到多个锁定

4. **集成点: DDSCanvasPage**
   - 路径: `src/components/dds/DDSCanvasPage.tsx`（已存在于 main）
   - 扩展: `onNodeDoubleClick` 触发 `collab:editing:start` 广播
   - 扩展: `onSelectionChange` 触发 `collab:editing:end`（选中取消时）

**现有资产映射**:

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| presenceStore | `src/lib/collaboration/presenceStore.ts` | ✅ 存在于 main | 扩展 editingNodeIds |
| presenceSync | `src/lib/canvas/presenceSync.ts` | ✅ 存在于 main | WebSocket 同步逻辑参考 |
| RemoteCursor | `src/components/presence/RemoteCursor.tsx` | ✅ 存在于 main | 编辑锁定标签参考样式 |
| DDSCanvasPage | `src/components/dds/DDSCanvasPage.tsx` | ✅ 存在于 main | 编辑事件集成点 |
| wsCollabHandler | `src/lib/collaboration/wsCollabHandler.ts` | ❌ 新建 | 消息分发处理 |
| NodeEditorLock | `src/components/canvas/NodeEditorLock.tsx` | ❌ 新建 | 锁定 UI 组件 |

**跨 Epic 集成点**:
- E1 + E4 (协作 Undo/Redo): `presenceStore` 的 `editingNodeIds` 需在 Undo/Redo 时清空（冲突场景）

---

### E2: 画布文件夹管理

**目标**: 为用户提供画布分类组织能力，支持文件夹 CRUD + 画布移动。

**核心架构决策**:

1. **新 Store: `canvasFolderStore.ts`**
   - 路径: `src/stores/dds/canvasFolderStore.ts`（新增）
   - 理由: `canvasListStore`（S60）管理画布列表，文件夹管理是独立维度
   - 数据结构:
     ```typescript
     interface FolderState {
       folders: Array<{ id: string; name: string; createdAt: number; }>;
       canvasFolderMap: Map<canvasId, folderId | null>; // null = 根目录
       expandedFolders: Set<folderId>;
     }
     ```

2. **新组件: `FolderTree.tsx`**
   - 路径: `src/components/dds/canvas/FolderTree.tsx`（新增）
   - 集成到 `src/components/canvas/CanvasListPanel.tsx`（已存在于 main）
   - 功能: 树形视图 + 展开/折叠 + 右键菜单（重命名/删除）
   - 理由: 与 CanvasListPanel 共享画布列表数据，通过 store 驱动

3. **新组件: `CreateFolderDialog.tsx`**
   - 路径: `src/components/dds/canvas/CreateFolderDialog.tsx`（新增）
   - 复用 `src/components/dds/canvas/FolderTree.tsx` 的 Dialog 基础样式
   - 支持中文名称 + 空名称校验

4. **集成点: CanvasListPanel**
   - 路径: `src/components/canvas/CanvasListPanel.tsx`（已存在于 main）
   - 扩展: 画布列表按文件夹分组显示，支持"移动到文件夹"多选操作

**现有资产映射**:

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| CanvasListPanel | `src/components/canvas/CanvasListPanel.tsx` | ✅ 存在于 main | 扩展文件夹树集成 |
| batchOpsStore | `src/lib/canvas/stores/batchOpsStore.ts` | ✅ 存在于 main（S60-E2）| 批量操作参考模式 |
| canvasListStore | `src/stores/dds/canvasListStore.ts` | ✅ 存在于 main | 画布列表 CRUD 参考 |

**跨 Epic 集成点**:
- E2 + E5 (离线 PWA): 文件夹数据需在 `canvasFolderStore` 中持久化（PWA 离线可用）

---

### E3: 画布云端备份与恢复

**目标**: 将 IndexedDB 本地快照扩展为云端冗余备份，防止数据丢失。

**核心架构决策**:

1. **新 Service: `BackupService.ts`**
   - 路径: `src/services/backup/BackupService.ts`（新增）
   - 接口: `backup(canvasId): Promise<void>` + `restore(canvasId, backupId): Promise<void>` + `listBackups(canvasId): Promise<BackupMeta[]>`
   - 理由: 云端备份与本地版本历史是两个独立 concerns

2. **BackupStore: 备份任务状态**
   - 路径: `src/stores/dds/backupStore.ts`（新增）
   - 管理: `pendingBackups: Map<canvasId, BackupTask>` + `backupHistory: BackupMeta[]`

3. **BackupPanel UI**
   - 路径: `src/components/dds/canvas/BackupPanel.tsx`（新增）
   - 集成到 `DDSToolbar.tsx`（已存在于 main）

4. **云端 API 端点**
   - 路径: `src/app/api/backup/`（新增目录）
   - POST `/api/backup` — 上传快照
   - GET `/api/backup/[canvasId]` — 列出备份
   - POST `/api/backup/[canvasId]/restore` — 恢复备份

**现有资产映射**:

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| canvasHistoryStore | `src/stores/dds/canvasHistoryStore.ts` | ✅ 存在于 main（S61）| 快照数据源 |
| historyDB | `src/stores/dds/historyDB.ts` | ✅ 存在于 main | IndexedDB 操作参考 |
| DDSToolbar | `src/components/dds/DDSToolbar.tsx` | ✅ 存在于 main | 备份入口按钮 |

**跨 Epic 集成点**:
- E3 + E1: 协作编辑时禁用自动备份（避免并发写冲突）

---

### E4: 协作 Undo/Redo

**目标**: 多用户协作时，同步 Undo/Redo 操作，避免状态不一致。

**核心架构决策**:

1. **新 Store: `undoRedoStore.ts`**
   - 路径: `src/stores/dds/undoRedoStore.ts`（新增）
   - 管理: 操作栈（`undoStack`/`redoStack`）+ 当前操作持有者（`ownerUserId`）
   - 冲突检测: Undo 前检查 `ownerUserId`，若非己则提示

2. **WebSocket 消息类型: `collab:undo` / `collab:redo`**
   - 复用 `wsCollabHandler.ts`（E1 新建）
   - Payload: `{ userId, canvasId, operationSnapshot }`

3. **DDSToolbar 扩展**
   - 路径: `src/components/dds/DDSToolbar.tsx`（已存在于 main）
   - 扩展: Undo/Redo 按钮 + 当前操作者指示器

**现有资产映射**:

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| canvasHistoryStore | `src/stores/dds/canvasHistoryStore.ts` | ✅ 存在于 main | 快照存储基础 |
| presenceStore | `src/lib/collaboration/presenceStore.ts` | ✅ 扩展（E1）| 编辑锁定状态 |
| DDSToolbar | `src/components/dds/DDSToolbar.tsx` | ✅ 存在于 main | Undo/Redo 按钮扩展 |

**跨 Epic 集成点**:
- E4 + E1: `presenceStore.editingNodeIds` 在 Undo 时清空（操作节点可能正在被编辑）
- E4 + E5: Undo/Redo 队列需在 PWA 离线时持久化

---

### E5: 离线 PWA 支持

**目标**: 支持 Service Worker 缓存 + IndexedDB 离线队列，使 VibeX 在离线状态下可继续访问最近画布。

**核心架构决策**:

1. **Service Worker: `sw.ts`**
   - 路径: `public/sw.js`（新增，Vite PWA 插件生成）
   - 策略: NetworkFirst（API）+ CacheFirst（静态资源）+ IndexedDB 队列（写操作）

2. **离线队列: 扩展 `offline-queue.ts`**
   - 路径: `src/lib/offline-queue.ts`（已存在于 main）
   - 扩展: 新增 `queueCloudBackup()` 方法（E3 触发）
   - 理由: 复用现有离线队列基础设施

3. **降级策略**
   - 编辑页面: 显示"离线模式" banner，允许查看但禁止保存
   - 列表页面: 全部可用（缓存优先）

4. **缓存策略**
   - 缓存最近 5 个画布的完整数据（节点+边+元数据）
   - 缓存 TTL: 7 天

**现有资产映射**:

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| offline-queue.ts | `src/lib/offline-queue.ts` | ✅ 存在于 main | 扩展离线队列 |
| offline.html | `public/offline.html` | ✅ 存在于 main | 离线兜底页面 |
| manifest.json | `public/manifest.json` | ✅ 存在于 main | PWA manifest |
| vite.config.ts | `vite.config.ts` | ✅ 存在于 main | 需添加 vite-plugin-pwa |

**跨 Epic 集成点**:
- E5 + E2: 文件夹树数据缓存（E2 数据结构）
- E5 + E3: 云端备份队列（E3 离线触发）
- E5 + E4: Undo/Redo 栈持久化（E4 数据结构）

---

## 技术债务与风险

1. **WebSocket 重连**: 所有 WebSocket 操作需在 `wsCollabHandler` 中实现指数退避重连（E1/E4 共用）
2. **IndexedDB 容量**: 云端备份需考虑用户存储配额限制，BackupPanel 需显示存储使用量
3. **PWA 覆盖率**: Service Worker 需在 iOS Safari 上测试（iOS <16.4 支持有限）
4. **冲突解决**: E1+E4 合起来构成完整的协作冲突检测体系，需统一冲突通知 UX
