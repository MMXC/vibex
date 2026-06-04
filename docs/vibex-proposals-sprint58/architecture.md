# VibeX Sprint58 架构设计文档

**Sprint**: Sprint58  
**日期**: 2026-06-03  
**作者**: coord (self-impl due to architect-review phantom ghost)  
**基于**: analysis.md + prd.md

---

## 设计原则

1. **最小侵入**: 复用现有 store/action，不改变已稳定接口
2. **IndexedDB 隔离**: 快照数据与命令历史数据分离存储
3. **WebSocket 链路完整**: 所有协作消息必须经过 useCollaboration 广播
4. **权限模型简洁**: shareToken = 16位随机字符串，O(1) 查表验证

---

## 跨 Epic 集成点

### DDSDrawflow 作为事件中枢
`DDSDrawflow` 是所有 Epic 的事件聚合点：
- E2 拖拽事件 (`onDrop`/`onDragOver`) → DropOverlay → FileImportDialog
- E3 鼠标移动事件 (`onNodeMouseMove`) → cursor broadcast
- E5 冲突弹窗 (`conflictStore.conflictData`) → ConflictDialog 覆盖层

### Store 依赖图
```
canvasHistoryStore ─── historyDB (snapshots 表)
canvasListStore ──────── ShareDialog (shareToken)
conflictStore ───────── ConflictDialog (wsConflictHandler 写入)
useCollaboration ────── DDSDrawflow (cursor 广播)
```

---

## E1: 画布版本分支管理

### 架构决策

**AD1: 快照序列化方案**
- 快照存储 `DDSDrawflow.nodes + edges` 的 JSON，而非 command 历史
- 原因：command 历史是可变的（undo/redo），快照应反映某个时间点的完整状态
- 存储格式：`{ id, name, timestamp, nodes: Node[], edges: Edge[] }`

**AD2: historyDB snapshots 表设计**
```typescript
interface SnapshotRecord {
  id: string;         // UUID
  canvasId: string;
  name: string;
  timestamp: number;
  chapterData: {
    nodes: Node[];
    edges: Edge[];
  };
}
```
- 使用 `idb` 库的 `objectStore` 管理 snapshots 表
- 索引: `canvasId + timestamp` 复合索引，支持按画布查询 + 时间排序

**AD3: HistoryPanel 扩展策略**
- 已有 HistoryPanel (S54): 展示 `undoStack` 命令列表
- E1: 在 HistoryPanel 底部新增 `Snapshots` tab（切换显示）
- 新增"保存版本"按钮 → 触发 `canvasHistoryStore.saveSnapshot(name)`
- 版本列表按 timestamp 倒序，支持"恢复"和"删除"

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` | 扩展 | 新增 `snapshots[]` 状态 + 3个 actions |
| `vibex-fronted/src/lib/canvas/historyDB.ts` | 扩展 | 新增 `snapshots` IndexedDB 表 |
| `vibex-fronted/src/components/canvas/features/HistoryPanel.tsx` | 扩展 | 新增 Snapshots tab + 版本列表 UI |
| `src/stores/dds/__tests__/canvasHistoryStore.test.ts` | 新增 | snapshot actions 测试 |

### 现有资产映射
- ✅ `canvasHistoryStore.ts` (S54, 12673 bytes) — 扩展 snapshots 状态
- ✅ `historyDB.ts` (S51, 11159 bytes) — 扩展 snapshots 表
- ✅ `HistoryPanel.tsx` (S54, 4981 bytes) — 扩展 Snapshots tab

---

## E2: 桌面文件拖拽导入

### 架构决策

**AD4: 拖拽事件处理位置**
- 在 `DDSDrawflow` 根 div 上注册 `onDragOver` + `onDrop`
- `onDragOver`: 阻止默认行为（允许 drop）+ 显示 DropOverlay
- `onDrop`: 阻止默认行为 + 解析 File list + 调用 `useFileDrop.processDrop()`

**AD5: 节点追加而非覆盖**
- `DDSDrawflow` 的 `nodes` 状态是 `$nodes` from flowStore
- 导入时：获取当前 nodes → 解析文件 JSON → merge nodes → `flowStore.setNodes(merged)`
- 不使用 `replaceNodes`（那是 HistoryPanel 恢复用的）

**AD6: useFileDrop 状态管理**
```typescript
interface FileDropState {
  isDragging: boolean;
  pendingFiles: File[];
  processDrop(files: File[]): Promise<void>;
  reset(): void;
}
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `vibex-fronted/src/hooks/dds/canvas/useFileDrop.ts` | 新增 | 拖拽文件处理 hook |
| `vibex-fronted/src/components/dds/canvas/DropOverlay.tsx` | 新增 | 全屏拖拽遮罩 |
| `vibex-fronted/src/components/dds/canvas/FileImportDialog.tsx` | 新增 | 导入预览对话框 |
| `vibex-fronted/src/components/dds/canvas/DDSDrawflow.tsx` | 新增 | 根画布组件（事件中枢） |
| `vibex-fronted/src/hooks/dds/canvas/__tests__/useFileDrop.test.ts` | 新增 | 拖拽逻辑测试 |

### 依赖关系
- `DDSDrawflow` → `useFileDrop` → `FileImportDialog` → `flowStore.setNodes()`

---

## E3: 协作者 Cursor 同步完善

### 架构决策

**AD7: 节流广播位置**
- `throttleCursorBroadcast` 位于 `useCollaboration.ts`
- 阈值：100ms（平衡延迟与性能）
- DDSDrawflow 的 `onNodeMouseMove` → `useCollaboration.broadcastCursor(x, y)`

**AD8: screenToFlowCoords 转换**
- 新建 `vibex-fronted/src/lib/canvas/coords.ts` 工具函数
- 输入: screenX, screenY, viewportBounds
- 输出: flowX, flowY
- 公式: `flowX = (screenX - viewportBounds.x) / viewportBounds.zoom`

**AD9: CursorOverlay 渲染**
- 使用 `useCollaboration.remoteUsers` 计算每个远程用户的光标位置
- 每个 RemoteUser 有 `cursorX/cursorY` 字段（在 presenceStore 中）

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `vibex-fronted/src/hooks/useCollaboration.ts` | 扩展 | 验证 throttleCursorBroadcast 存在 |
| `vibex-fronted/src/lib/canvas/coords.ts` | 新增 | screenToFlowCoords 转换 |
| `vibex-fronted/src/components/dds/canvas/DDSDrawflow.tsx` | 新增 | onNodeMouseMove 事件 |
| `vibex-fronted/src/lib/canvas/__tests__/coords.test.ts` | 新增 | 坐标转换测试 |

### 现有资产映射
- ✅ `useCollaboration.ts` (S54, from .stryker-tmp sandbox) — 验证并扩展 cursor broadcast
- ⚠️ 需验证 origin/main 上 `useCollaboration.ts` 含 `throttleCursorBroadcast`

---

## E4: 画布隐私与分享

### 架构决策

**AD10: shareToken 生成与验证**
- 生成：`crypto.randomUUID().slice(0, 16)` 或自定义 16 位字符集
- 存储：`canvasListStore.canvases[id].shareToken` + `permissions: 'view'|'edit'|'none'`
- 验证：URL 参数 `?share=<token>` → 查 canvasListStore → 比对权限

**AD11: 分享链接 UX**
- 分享面板：`ShareDialog.tsx`（独立对话框）
- 显示：分享链接 + 权限下拉 + 一键复制按钮
- 未授权：路由中间件检测 `?share=` 参数 → 无权限时显示"仅限受邀用户"页面

**AD12: 权限模型**
```typescript
type SharePermission = 'none' | 'view' | 'edit';
interface ShareConfig {
  shareToken: string;
  isPublic: boolean;
  permissions: SharePermission;
}
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/canvasListStore.ts` | 扩展 | 新增 shareToken/isPublic/permissions 字段 |
| `vibex-fronted/src/components/dds/canvas/ShareDialog.tsx` | 新增 | 分享面板 |
| `vibex-fronted/src/components/dds/canvas/__tests__/ShareDialog.test.tsx` | 新增 | 分享面板测试 |
| `vibex-fronted/src/lib/canvas/shareUtils.ts` | 新增 | generateShareToken + checkSharePermission |

### 现有资产映射
- ✅ `canvasListStore.ts` (16177 bytes on main) — 扩展字段

---

## E5: 协作冲突增强

### 架构决策

**AD13: ConflictStore 状态设计**
```typescript
interface ConflictData {
  local: { nodes: Node[]; edges: Edge[] };
  remote: { nodes: Node[]; edges: Edge[] };
  timestamp: number;
}

interface ConflictStore {
  conflictData: ConflictData | null;
  resolvedStrategy: 'local' | 'remote' | 'manual' | null;
  setConflict(data: ConflictData): void;
  resolveConflict(strategy: 'local' | 'remote' | 'manual', manualData?: ...): void;
  clearConflict(): void;
}
```

**AD14: wsConflictHandler 职责**
- 监听 WS `conflict:detected` 消息
- 解析冲突数据 → 调用 `conflictStore.setConflict()`
- 冲突解决后：监听 `conflict:resolved` → 调用 `conflictStore.resolveConflict()`

**AD15: ConflictDialog 三选项实现**
- "保留本地": `flowStore.setNodes(conflictData.local)`
- "接受远程": `flowStore.setNodes(conflictData.remote)`
- "手动合并": 打开 JSON editor → 用户编辑 → merge → `flowStore.setNodes(merged)`

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `vibex-fronted/src/lib/canvas/wsConflictHandler.ts` | 新增 | WS 冲突消息处理 |
| `vibex-fronted/src/lib/canvas/stores/conflictStore.ts` | 扩展 | 新增 conflictData + resolvedStrategy |
| `vibex-fronted/src/components/conflict/ConflictDialog.tsx` | 扩展 | 完整三选项实现 |
| `vibex-fronted/src/components/conflict/__tests__/ConflictDialog.test.tsx` | 新增 | 冲突对话框测试 |

### 现有资产映射
- ✅ `conflictStore.ts` (S52, on main) — 扩展状态
- ✅ `ConflictDialog.tsx` (S52, 4856 bytes on main) — stub → 完整实现

---

## 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| DDSDrawflow 新建导致 S57 组件不兼容 | 高 | 复用 S57 DDSDrawflow.tsx 基础结构，只添加事件处理 |
| wsConflictHandler 与现有 WS handler 冲突 | 中 | 独立文件，WS connection 在 useCollaboration 中单例 |
| IndexedDB 版本升级影响 historyDB 现有数据 | 低 | historyDB.open() 升级时做 versionchange 迁移 |

---

## 性能影响

- **E1 快照**: IndexedDB 写入异步，不阻塞 UI；读取在 HistoryPanel 展开时按需
- **E2 拖拽**: `useFileDrop.processDrop` 使用 `requestIdleCallback` 处理大文件
- **E3 Cursor**: 100ms 节流确保 <10 broadcasts/sec
- **E4 分享**: shareToken 验证 O(1)，无额外查询开销
