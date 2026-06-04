# VibeX Sprint58 产品需求文档 (PRD)

**Sprint**: Sprint58  
**日期**: 2026-06-03  
**版本**: 1.0  
**基于**: analysis.md (coord self-impl due to pm-review phantom)

---

## 执行摘要

Sprint58 在 Sprint56+Sprint57 基础上继续推进核心功能：
- **P001**: 画布版本分支管理（用户命名快照 + 历史恢复）
- **P002**: 桌面文件拖拽导入（拖拽 → DropOverlay → 节点合并）
- **P003**: 协作者 Cursor 实时同步（验证并完善 broadcast 链路）
- **P004**: 画布隐私与分享（链接分享 + 权限控制）
- **P005**: 协作冲突增强（ConflictDialog 完整三选项实现）

---

## Epic-Story Table

| Epic | 名称 | 优先级 | 开发者 | Tester |
|------|------|--------|--------|--------|
| E1 | 画布版本分支管理 | P0 | 待分配 | 待分配 |
| E2 | 桌面文件拖拽导入 | P0 | 待分配 | 待分配 |
| E3 | 协作者 Cursor 同步完善 | P1 | 待分配 | 待分配 |
| E4 | 画布隐私与分享 | P1 | 待分配 | 待分配 |
| E5 | 协作冲突增强 | P2 | 待分配 | 待分配 |

---

## E1: 画布版本分支管理

### 功能描述
在 HistoryPanel 中新增"保存版本"功能，用户可命名快照、恢复历史版本、删除版本。版本数据持久化到 IndexedDB。

### DoD (Definition of Done)
- [ ] `canvasHistoryStore` 新增 `snapshots` 状态 + 3个 actions
- [ ] `historyDB.ts` 新增 `snapshots` IndexedDB 表
- [ ] `HistoryPanel.tsx` 新增"保存版本"按钮 + 版本列表组件
- [ ] 保存时序列化 DDSDrawflow nodes/edges → IndexedDB
- [ ] 恢复时 DDSDrawflow `replaceNodes/edges` 替换当前状态
- [ ] vitest: `canvasHistoryStore` snapshot 逻辑覆盖
- [ ] vitest: `historyDB` snapshots 表读写测试

### expect() 断言
```typescript
// canvasHistoryStore
expect(canvasHistoryStore.getState().snapshots).toHaveLength(0);
canvasHistoryStore.getState().saveSnapshot('checkpoint-1');
expect(canvasHistoryStore.getState().snapshots).toHaveLength(1);
expect(canvasHistoryStore.getState().snapshots[0].name).toBe('checkpoint-1');

// historyDB snapshots
await historyDB.saveSnapshot({ id: '1', name: 'v1', timestamp: Date.now(), chapterData: { nodes: [], edges: [] } });
const snapshots = await historyDB.listSnapshots();
expect(snapshots).toHaveLength(1);
```

### 页面集成
- `src/components/dds/canvas/HistoryPanel.tsx` — 新增版本列表 UI
- `src/stores/dds/canvasHistoryStore.ts` — 新增 snapshot actions
- `src/lib/canvas/historyDB.ts` — 新增 snapshots IndexedDB 表

---

## E2: 桌面文件拖拽导入

### 功能描述
在 DDSDrawflow 中集成拖拽事件监听，用户从桌面拖拽 .vibex/.json/.yaml/.yml 文件到画布区域，触发 DropOverlay 显示，释放后弹出 FileImportDialog 预览并确认导入。

### DoD (Definition of Done)
- [ ] `DDSDrawflow.tsx` 根容器添加 `onDrop` + `onDragOver` 事件处理
- [ ] 拖拽进入时渲染 `DropOverlay` 组件（全屏半透明遮罩）
- [ ] 释放时调用 `useFileDrop.processDrop(files)` → `FileImportDialog`
- [ ] `FileImportDialog` 确认后 nodes 追加（而非覆盖）到当前画布
- [ ] 不支持格式 → toast 错误提示
- [ ] vitest: `useFileDrop` + `DropOverlay` 测试覆盖

### expect() 断言
```typescript
// useFileDrop
const { processDrop } = useFileDrop();
// Simulate drop of .vibex file
const file = new File(['{}'], 'test.vibex', { type: 'application/json' });
await processDrop([file]);
expect(useFileDropStore.getState().pendingFiles).toHaveLength(1);
```

### 页面集成
- `src/components/dds/canvas/DDSDrawflow.tsx` — 拖拽事件处理
- `src/components/dds/canvas/DropOverlay.tsx` — 拖拽遮罩（已存在，需集成）
- `src/hooks/dds/canvas/useFileDrop.ts` — 文件处理逻辑

---

## E3: 协作者 Cursor 同步完善

### 功能描述
验证并完善 Cursor broadcast 链路，确保节流逻辑在 origin/main，鼠标移动事件正确触发协作者光标同步。

### DoD (Definition of Done)
- [ ] 验证 `throttleCursorBroadcast` 在 origin/main `useCollaboration.ts`
- [ ] 验证 DDSDrawflow `onNodeMouseMove` → cursor 广播链路
- [ ] 如缺失：实现 screenToFlowCoords 转换 utils
- [ ] vitest: cursor broadcast + 节流逻辑测试
- [ ] vitest: screenToFlowCoords 转换测试

### expect() 断言
```typescript
// cursor broadcast with throttle
vi.useFakeTimers();
const broadcast = vi.fn();
throttleCursorBroadcast(broadcast, 100);
broadcast(); vi.advanceTimersByTime(50); // < throttle → no-op
vi.advanceTimersByTime(100); broadcast(); // >= throttle → called
expect(broadcast).toHaveBeenCalledTimes(2);
```

### 页面集成
- `src/hooks/dds/canvas/useCollaboration.ts` — throttleCursorBroadcast（已存在，需验证）
- `src/components/dds/canvas/DDSDrawflow.tsx` — onNodeMouseMove 事件
- `src/lib/canvas/coords.ts` — screenToFlowCoords 工具函数

---

## E4: 画布隐私与分享

### 功能描述
为每个画布生成唯一的 shareToken，支持通过链接分享画布，控制访问权限（仅查看/可编辑）。

### DoD (Definition of Done)
- [ ] `canvasListStore` 新增 `shareToken/isPublic/permissions` 字段
- [ ] 后端 `/api/canvas/share` 端点（生成 token、设置权限）
- [ ] `ShareDialog.tsx` 组件：一键复制链接 + 权限下拉
- [ ] 分享链接格式：`/canvas/<canvasId>?share=<token>`
- [ ] 未授权访问 → 显示"仅限受邀用户"页面
- [ ] vitest: shareToken 生成 + 权限验证测试

### expect() 断言
```typescript
// shareToken generation
const token = generateShareToken();
expect(token).toMatch(/^[a-zA-Z0-9]{16}$/);
expect(token).not.toBe(generateShareToken()); // unique

// permission check
const result = checkSharePermission(token, 'view');
expect(result.allowed).toBe(true);
expect(result.level).toBe('view');
```

### 页面集成
- `src/stores/dds/canvasListStore.ts` — shareToken 字段
- `src/components/dds/canvas/ShareDialog.tsx` — 新分享面板
- `src/app/canvas/[id]/page.tsx` — share token URL 参数处理

---

## E5: 协作冲突增强

### 功能描述
将 S52-E3 stub 的 ConflictDialog 升级为完整实现，支持本地/远程/手动合并三种策略。

### DoD (Definition of Done)
- [ ] `wsConflictHandler.ts` 检测冲突时存储 `conflictData` 到 `conflictStore`
- [ ] `conflictStore` 新增 `conflictData` + `resolvedStrategy` 状态
- [ ] `ConflictDialog.tsx` 完整 UI：diff 展示 + 三选项按钮
- [ ] "手动合并"：编辑器允许直接编辑 JSON，提交后合并
- [ ] 发送 `conflict:resolve` WS 消息 + 更新 local state
- [ ] vitest: ConflictDialog + conflictStore 测试覆盖

### expect() 断言
```typescript
// conflictStore
expect(conflictStore.getState().conflictData).toBeNull();
conflictStore.getState().setConflict({ local: {}, remote: {} });
expect(conflictStore.getState().conflictData).not.toBeNull();
conflictStore.getState().resolveConflict('local');
expect(conflictStore.getState().resolvedStrategy).toBe('local');

// ConflictDialog options
render(<ConflictDialog />);
expect(screen.getByRole('button', { name: /保留本地/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /接受远程/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /手动合并/i })).toBeInTheDocument();
```

### 页面集成
- `src/lib/canvas/wsConflictHandler.ts` — 冲突检测
- `src/stores/dds/conflictStore.ts` — 冲突状态管理（新建）
- `src/components/dds/canvas/ConflictDialog.tsx` — 冲突解决 UI

---

## 集成表

| 功能 | 主入口组件 | 状态管理 | 服务/工具 | 已有文件 |
|------|-----------|---------|-----------|---------|
| E1 版本分支 | HistoryPanel.tsx | canvasHistoryStore.ts | historyDB.ts | canvasHistoryStore.ts, historyDB.ts |
| E2 拖拽导入 | DDSDrawflow.tsx | useFileDrop store | - | useFileDrop.ts, DropOverlay.tsx, FileImportDialog.tsx |
| E3 Cursor同步 | DDSDrawflow.tsx | useCollaboration.ts | - | useCollaboration.ts |
| E4 分享权限 | DDSDrawflow.tsx | canvasListStore.ts | backend /api/canvas/share | canvasListStore.ts |
| E5 冲突解决 | DDSDrawflow.tsx | conflictStore.ts | wsConflictHandler.ts | ConflictDialog.tsx (stub) |
