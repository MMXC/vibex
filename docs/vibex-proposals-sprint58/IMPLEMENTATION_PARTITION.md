# VibeX Sprint58 Implementation Partition

**Sprint**: Sprint58  
**日期**: 2026-06-03  
**基于**: architecture.md

---

## 新增文件表

| 文件 | Epic | 说明 |
|------|------|------|
| `vibex-fronted/src/lib/canvas/coords.ts` | E3 | screenToFlowCoords 转换 |
| `vibex-fronted/src/lib/canvas/shareUtils.ts` | E4 | generateShareToken + checkSharePermission |
| `vibex-fronted/src/lib/canvas/wsConflictHandler.ts` | E5 | WS 冲突消息处理 |
| `vibex-fronted/src/hooks/dds/canvas/useFileDrop.ts` | E2 | 拖拽文件处理 hook |
| `vibex-fronted/src/components/dds/canvas/DDSDrawflow.tsx` | E2/E3 | 根画布组件（事件中枢） |
| `vibex-fronted/src/components/dds/canvas/DropOverlay.tsx` | E2 | 全屏拖拽遮罩 |
| `vibex-fronted/src/components/dds/canvas/FileImportDialog.tsx` | E2 | 导入预览对话框 |
| `vibex-fronted/src/components/dds/canvas/ShareDialog.tsx` | E4 | 分享面板 |

---

## 扩展文件表

| 文件 | Epic | 变更内容 |
|------|------|---------|
| `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` | E1 | 新增 `snapshots[]` + `saveSnapshot/loadSnapshot/listSnapshots` actions |
| `vibex-fronted/src/lib/canvas/historyDB.ts` | E1 | 新增 `snapshots` IndexedDB 表 + CRUD 操作 |
| `vibex-fronted/src/components/canvas/features/HistoryPanel.tsx` | E1 | 新增 Snapshots tab + 版本列表 + "保存版本"按钮 |
| `vibex-fronted/src/hooks/useCollaboration.ts` | E3 | 验证 `throttleCursorBroadcast` 存在；如缺失则添加 |
| `vibex-fronted/src/stores/canvasListStore.ts` | E4 | 新增 `shareToken/isPublic/permissions` 字段 |
| `vibex-fronted/src/lib/canvas/stores/conflictStore.ts` | E5 | 新增 `conflictData` + `resolvedStrategy` 状态 |
| `vibex-fronted/src/components/conflict/ConflictDialog.tsx` | E5 | stub → 完整三选项 UI + diff 展示 |

---

## 测试文件表

| 测试文件 | Epic | 测试内容 |
|----------|------|---------|
| `vibex-fronted/src/stores/dds/__tests__/canvasHistoryStore.test.ts` | E1 | saveSnapshot/loadSnapshot/listSnapshots |
| `vibex-fronted/src/lib/canvas/__tests__/coords.test.ts` | E3 | screenToFlowCoords 边界 |
| `vibex-fronted/src/components/dds/canvas/__tests__/ShareDialog.test.tsx` | E4 | 分享链接生成 + 权限验证 |
| `vibex-fronted/src/components/conflict/__tests__/ConflictDialog.test.tsx` | E5 | 三选项按钮 + diff 展示 |
| `vibex-fronted/src/hooks/dds/canvas/__tests__/useFileDrop.test.ts` | E2 | 拖拽流程 + 节点追加 |

---

## E1 DoD Checklist

- [ ] **D1.1**: `canvasHistoryStore` 新增 `snapshots: Snapshot[]` 状态（类型: `Snapshot { id, name, timestamp, nodes, edges }`）
- [ ] **D1.2**: `saveSnapshot(name)` action：序列化当前 nodes/edges → 保存到 historyDB snapshots 表
- [ ] **D1.3**: `loadSnapshot(id)` action：从 historyDB 读取 → `flowStore.setNodes()` 替换当前画布
- [ ] **D1.4**: `listSnapshots()` action：按时间倒序返回快照列表
- [ ] **D1.5**: historyDB 新增 `snapshots` objectStore（IndexedDB），支持 CRUD
- [ ] **D1.6**: HistoryPanel 新增 Snapshots tab，切换显示快照列表
- [ ] **D1.7**: "保存版本"按钮 → 触发 `saveSnapshot()`，需要用户输入名称
- [ ] **D1.8**: 快照"恢复"按钮 → 触发 `loadSnapshot()` + 清空 undoStack
- [ ] **D1.9**: vitest: `canvasHistoryStore` snapshot actions 覆盖
- [ ] **D1.10**: vitest: historyDB snapshots 表读写覆盖

**expect() 断言示例**:
```typescript
expect(canvasHistoryStore.getState().snapshots).toHaveLength(0);
canvasHistoryStore.getState().saveSnapshot('checkpoint-v1');
expect(canvasHistoryStore.getState().snapshots).toHaveLength(1);
expect(canvasHistoryStore.getState().snapshots[0].name).toBe('checkpoint-v1');
canvasHistoryStore.getState().loadSnapshot(canvasHistoryStore.getState().snapshots[0].id);
```

---

## E2 DoD Checklist

- [ ] **D2.1**: `useFileDrop` hook 新建，包含 `isDragging/pendingFiles/processDrop/reset` 状态
- [ ] **D2.2**: `DDSDrawflow` 根 div 添加 `onDragOver`（阻止默认）+ `onDrop` 事件处理
- [ ] **D2.3**: 拖拽进入画布区域 → `isDragging=true` → 显示 DropOverlay 全屏遮罩
- [ ] **D2.4**: 拖拽离开 → `isDragging=false` → 隐藏 DropOverlay
- [ ] **D2.5**: 释放文件 → `processDrop(files)` → 过滤 .vibex/.json/.yaml/.yml → 其他格式 → toast 错误
- [ ] **D2.6**: 有效文件 → 显示 FileImportDialog 预览（节点预览图）
- [ ] **D2.7**: 用户确认 → nodes 追加到当前画布（`flowStore.setNodes([...existing, ...imported])`）
- [ ] **D2.8**: vitest: `useFileDrop` 拖拽流程测试

**expect() 断言示例**:
```typescript
const { result } = renderHook(() => useFileDrop());
expect(result.current.isDragging).toBe(false);
act(() => { result.current.setDragging(true); });
expect(result.current.isDragging).toBe(true);
```

---

## E3 DoD Checklist

- [ ] **D3.1**: 验证 `throttleCursorBroadcast` 在 origin/main `useCollaboration.ts` 中存在
- [ ] **D3.2**: 如不存在：实现 `throttleCursorBroadcast(fn, ms)` 工具函数并导出
- [ ] **D3.3**: 新建 `coords.ts`：`screenToFlowCoords(screenX, screenY, viewportBounds)` 转换函数
- [ ] **D3.4**: DDSDrawflow `onNodeMouseMove` → 调用 `useCollaboration.broadcastCursor(flowX, flowY)`
- [ ] **D3.5**: 节流阈值 100ms（避免过于频繁广播）
- [ ] **D3.6**: vitest: `coords.ts` 边界情况（负坐标、超出视口、零缩放）
- [ ] **D3.7**: vitest: throttleCursorBroadcast 节流行为测试

**expect() 断言示例**:
```typescript
// coords.ts
const result = screenToFlowCoords(100, 100, { x: 50, y: 50, zoom: 1 });
expect(result.flowX).toBe(50);
expect(result.flowY).toBe(50);

// throttle
vi.useFakeTimers();
const fn = vi.fn();
throttleCursorBroadcast(fn, 100);
fn(); vi.advanceTimersByTime(50); fn(); // blocked
vi.advanceTimersByTime(100); fn();
expect(fn).toHaveBeenCalledTimes(2);
```

---

## E4 DoD Checklist

- [ ] **D4.1**: `canvasListStore` 新增字段：`shareToken: string` / `isPublic: boolean` / `permissions: 'view'|'edit'|'none'`
- [ ] **D4.2**: `generateShareToken()`: 16位随机字符串（字母数字），存入 canvas.shareToken
- [ ] **D4.3**: ShareDialog 组件：显示当前分享链接 + 权限下拉 + 一键复制按钮
- [ ] **D4.4**: "复制链接" → 复制 `/canvas/<id>?share=<token>` 到剪贴板 + toast 提示
- [ ] **D4.5**: 权限下拉：`仅查看 / 可编辑 / 关闭分享` 三个选项
- [ ] **D4.6**: URL 参数 `?share=<token>` 检测：路由中间件或 canvas 页面 onMount 检查
- [ ] **D4.7**: 无权限访问 → 显示"仅限受邀用户"提示页面（非 404）
- [ ] **D4.8**: vitest: shareToken 唯一性 + 权限验证测试
- [ ] **D4.9**: vitest: ShareDialog 渲染 + 复制按钮测试

**expect() 断言示例**:
```typescript
const token1 = generateShareToken();
const token2 = generateShareToken();
expect(token1).toMatch(/^[a-zA-Z0-9]{16}$/);
expect(token1).not.toBe(token2);
const result = checkSharePermission(token1, 'view');
expect(result.allowed).toBe(true);
```

---

## E5 DoD Checklist

- [ ] **D5.1**: `wsConflictHandler.ts` 新建：监听 WS `conflict:detected` 消息
- [ ] **D5.2**: 冲突消息到达 → 解析 payload → 调用 `conflictStore.setConflict(data)`
- [ ] **D5.3**: `conflictStore` 新增 `conflictData: ConflictData | null` + `resolvedStrategy: ...|null` 状态
- [ ] **D5.4**: ConflictDialog 扩展：显示本地/远程 diff（节点数量 + edges 数量 + 预览图）
- [ ] **D5.5**: "保留本地"按钮 → `flowStore.setNodes(conflictData.local)` + `conflictStore.clearConflict()`
- [ ] **D5.6**: "接受远程"按钮 → `flowStore.setNodes(conflictData.remote)` + `conflictStore.clearConflict()`
- [ ] **D5.7**: "手动合并"按钮 → 显示 JSON editor → 用户编辑 → merge → `flowStore.setNodes(merged)`
- [ ] **D5.8**: WS 解决消息发送：冲突解决后发送 `conflict:resolved { strategy, manualData? }`
- [ ] **D5.9**: vitest: conflictStore 状态变更测试
- [ ] **D5.10**: vitest: ConflictDialog 三选项渲染测试

**expect() 断言示例**:
```typescript
expect(conflictStore.getState().conflictData).toBeNull();
conflictStore.getState().setConflict({ local: { nodes: [], edges: [] }, remote: { nodes: [], edges: [] }, timestamp: Date.now() });
expect(conflictStore.getState().conflictData).not.toBeNull();
conflictStore.getState().resolveConflict('local');
expect(conflictStore.getState().resolvedStrategy).toBe('local');
expect(conflictStore.getState().conflictData).toBeNull();
```

---

## Epic 依赖关系

```
E1 (版本分支) ─── 无上游依赖 ──→ E1 完成
E2 (拖拽导入) ─── 无上游依赖 ──→ E2 完成
E3 (Cursor同步) ─ 无上游依赖 ──→ E3 完成
E4 (分享权限) ─── 无上游依赖 ──→ E4 完成
E5 (冲突解决) ─── E3 (ws handler) ──→ E5 完成
```

所有 Epic 均无 Phase1 依赖，可并行开发。
