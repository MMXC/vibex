# Sprint62 产品需求文档（PRD）

**项目**: vibex-proposals-sprint62  
**Sprint**: 62  
**版本**: 1.0  
**日期**: 2026-06-04  
**基于分析**: `analysis.md`

---

## 执行摘要

Sprint62 聚焦**协作者实时同步**与**画布生命周期管理**，为 VibeX 增添多用户协作的完整闭环。主要交付：

- **E1**: 协作者实时同步（编辑锁定感知）
- **E2**: 画布文件夹管理（画布组织能力）
- **E3**: 画布云端备份与恢复（数据安全）
- **E4**: 协作 Undo/Redo（多人编辑撤销同步）
- **E5**: 离线 PWA 支持（Service Worker + 降级策略）

---

## Epic-Story 表格

| ID | Epic | 用户故事 | 优先级 | 工作量 |
|----|------|---------|--------|--------|
| E1 | 协作者实时同步 | 作为协作者，我希望在别人编辑某节点时看到锁定提示，避免覆盖他人修改 | P0 | M |
| E2 | 画布文件夹管理 | 作为用户，我希望将画布分类到文件夹中，便于管理大量画布 | P1 | M |
| E3 | 画布云端备份与恢复 | 作为用户，我希望画布快照自动备份到云端，防止本地数据丢失 | P1 | M |
| E4 | 协作 Undo/Redo | 作为协作者，我希望看到他人的撤销操作并同步回退，避免状态不一致 | P2 | L |
| E5 | 离线 PWA 支持 | 作为用户，我希望在离线状态下继续访问最近画布，提高应用可靠性 | P1 | M |

---

## E1: 协作者实时同步

### 用户故事
作为协作者，我希望在别人编辑某节点时看到锁定提示，避免覆盖他人修改。

### 验收标准（DoD）

| ID | 描述 | 验证方式 |
|----|------|---------|
| D1.1 | 扩展 `presenceStore`，新增 `editingNodeIds: Map<string, string>` 追踪当前被编辑的节点 | vitest: editingNodeIds set/delete/clear |
| D1.2 | WebSocket handler 新增 `collab:editing` 消息类型，节点开始编辑/结束编辑广播 | vitest: ws handler 消息解析 |
| D1.3 | 节点编辑时（双击/选中节点），自动广播 `collab:editing:start` | vitest: 广播调用验证 |
| D1.4 | 其他协作者看到被锁定节点：节点边框变为虚线 + 显示锁定者名称标签 | vitest: NodeEditorLock 渲染 + CSS class |
| D1.5 | 编辑者离开节点时广播 `collab:editing:end`，其他用户立即解锁 | vitest: 状态清除验证 |
| D1.6 | `collaborationStore` vitest 覆盖编辑锁定状态转换（start→end→conflict→resolve） | vitest: 100% 覆盖 |

**关键文件**:
- 新增: `src/stores/dds/collaborationStore.ts`
- 扩展: `src/lib/collaboration/wsCollabHandler.ts`
- 新增: `src/components/dds/canvas/NodeEditorLock.tsx`
- 扩展: `src/components/dds/canvas/DDSCanvas.tsx`

### expect() 断言示例

```typescript
expect(collaborationStore.getState().editingNodeIds.has('node-123')).toBe(true);
expect(collaborationStore.getState().getEditor('node-123')).toBe('alice');
```

---

## E2: 画布文件夹管理

### 用户故事
作为用户，我希望将画布分类到文件夹中，便于管理大量画布。

### 验收标准（DoD）

| ID | 描述 | 验证方式 |
|----|------|---------|
| D2.1 | `canvasFolderStore` 实现文件夹 CRUD（创建/重命名/删除）| vitest: CRUD 操作 |
| D2.2 | 画布可移动到指定文件夹，支持批量移动 | vitest: 批量移动逻辑 |
| D2.3 | CanvasListPanel 显示文件夹树形视图，支持展开/折叠 | vitest: 树形视图渲染 |
| D2.4 | 创建文件夹对话框（`CreateFolderDialog.tsx`）支持中文名称 | vitest: 表单验证 |
| D2.5 | 文件夹删除时若包含画布，提示用户确认（画布移至根目录）| vitest: 确认弹窗逻辑 |
| D2.6 | `canvasFolderStore` vitest 覆盖全场景 | vitest: ≥20 个测试 |

**关键文件**:
- 新增: `src/stores/dds/canvasFolderStore.ts`
- 新增: `src/components/dds/canvas/FolderTree.tsx`
- 新增: `src/components/dds/canvas/CreateFolderDialog.tsx`
- 扩展: `src/components/dds/canvas/CanvasListPanel.tsx`

### expect() 断言示例

```typescript
expect(canvasFolderStore.getState().folders.length).toBe(3);
expect(canvasFolderStore.getState().canvasFolderMap.get('canvas-1')).toBe('folder-1');
```

---

## E3: 画布云端备份与恢复

### 用户故事
作为用户，我希望画布快照自动备份到云端，防止本地数据丢失。

### 验收标准（DoD）

| ID | 描述 | 验证方式 |
|----|------|---------|
| D3.1 | `backupStore` 管理 `lastBackupTime` + `backupStatus`（idle/uploading/done/error）| vitest: 状态机转换 |
| D3.2 | `BackupService.exportBackup(canvasId)` 序列化画布 JSON + 快照元数据上传 | vitest: API 调用 mock |
| D3.3 | `RestoreDialog` 列出备份历史（按时间倒序），支持预览和恢复 | vitest: 对话框渲染 + 数据过滤 |
| D3.4 | DDSToolbar 新增备份按钮（`aria-label="云端备份"`）| vitest: 按钮存在 + 点击触发 |
| D3.5 | `useAutoBackup` hook：页面可见性消失 30 分钟后自动触发备份 | vitest: visibilitychange 监听 |
| D3.6 | `BackupService` vitest 覆盖上传/下载/网络错误/配额超限场景 | vitest: ≥10 个测试 |

**关键文件**:
- 新增: `src/stores/dds/backupStore.ts`
- 新增: `src/services/backup/BackupService.ts`
- 新增: `src/components/dds/canvas/RestoreDialog.tsx`
- 新增: `src/hooks/canvas/useAutoBackup.ts`
- 扩展: `src/components/dds/toolbar/DDSToolbar.tsx`

### expect() 断言示例

```typescript
expect(backupStore.getState().backupStatus).toBe('idle');
expect(backupStore.getState().lastBackupTime).toBeNull();
```

---

## E4: 协作 Undo/Redo

### 用户故事
作为协作者，我希望看到他人的撤销操作并同步回退，避免状态不一致。

### 验收标准（DoD）

| ID | 描述 | 验证方式 |
|----|------|---------|
| D4.1 | 扩展 `canvasHistoryStore`，新增 `lastOperationId` + `operationQueue` | vitest: 操作队列 push/pop |
| D4.2 | WebSocket handler 新增 `history:sync` + `history:undo` 消息类型 | vitest: 消息解析 |
| D4.3 | 协作者撤销操作时，广播 `history:undo` 事件（含 operationId）| vitest: 广播调用 |
| D4.4 | 其他协作者客户端接收 `history:undo`，执行相同回退（检测操作可回退性）| vitest: 协作回退逻辑 |
| D4.5 | HistoryPanel 新增"协作"标签页，显示所有协作者操作记录（颜色标识）| vitest: 面板切换 + 记录渲染 |
| D4.6 | 撤销冲突检测：目标快照已被后续操作覆盖时显示警告弹窗 | vitest: 冲突弹窗逻辑 |
| D4.7 | `collabHistoryStore` vitest 覆盖同步撤销全流程 | vitest: ≥15 个测试 |

**关键文件**:
- 扩展: `src/stores/dds/canvasHistoryStore.ts`
- 扩展: `src/lib/collaboration/wsHistoryHandler.ts`
- 扩展: `src/components/dds/history/HistoryPanel.tsx`
- 新增: `src/stores/dds/collabHistoryStore.ts`

### expect() 断言示例

```typescript
expect(collabHistoryStore.getState().operationQueue.length).toBeGreaterThan(0);
expect(wsHistoryHandler).toHaveReceivedMessage({ type: 'history:undo', operationId: 'op-1' });
```

---

## E5: 离线 PWA 支持

### 用户故事
作为用户，我希望在离线状态下继续访问最近画布，提高应用可靠性。

### 验收标准（DoD）

| ID | 描述 | 验证方式 |
|----|------|---------|
| D5.1 | `public/sw.js` Service Worker 注册，应用 shell 缓存策略 | Playwright: 离线加载验证 |
| D5.2 | `next.config.js` 配置 Cache-Control + Service-Worker-Allowed 头 | Vitest: 配置验证（静态分析）|
| D5.3 | `manifest.json` Web App Manifest（name, icons, theme_color, start_url）| Playwright: manifest 解析 |
| D5.4 | `useOfflineMode` hook 监听 `navigator.onLine` + `online`/`offline` 事件 | vitest: 事件模拟 |
| D5.5 | `OfflineBanner` 组件：网络断开时显示顶部提示条 | vitest: 组件渲染 + 屏幕阅读器 |
| D5.6 | DDSToolbar 离线图标：网络断开时显示断网图标 | vitest: 图标切换逻辑 |
| D5.7 | AIGC 对话离线降级：网络恢复时自动重连，显示同步状态 | vitest: 重连状态机 |
| D5.8 | Lighthouse PWA 评分 ≥ 80 | Playwright + Lighthouse CI |

**关键文件**:
- 新增: `public/sw.js`
- 新增: `public/manifest.json`
- 扩展: `next.config.js`
- 新增: `src/hooks/canvas/useOfflineMode.ts`
- 新增: `src/components/dds/common/OfflineBanner.tsx`
- 扩展: `src/components/dds/toolbar/DDSToolbar.tsx`

### expect() 断言示例

```typescript
expect(useOfflineMode.getState().isOnline).toBe(true);
// 模拟 offline 事件后
expect(useOfflineMode.getState().isOnline).toBe(false);
expect(OfflineBanner).toBeInDocument();
```

---

## 页面集成表

| 页面 | 涉及 Epic | 改动点 |
|------|---------|--------|
| `/canvas/[id]` | E1, E4, E5 | 节点锁定感知、协作历史面板、离线横幅 |
| `/canvas-list` | E2, E3 | 文件夹树、备份按钮 |
| 通用 Toolbar | E1, E3, E5 | 备份按钮、离线图标、节点编辑锁 |

---

## 技术风险

| ID | 风险 | 影响 | 缓解 |
|----|------|------|------|
| R1 | WebSocket `editingNodeIds` 广播频率过高 | 性能 | 节流 200ms，批量广播 |
| R2 | 云端备份 API 尚未实现 | 阻塞 E3 | 先实现 UI + mock API |
| R3 | Service Worker 缓存策略需要精确配置 | 兼容性 | 分阶段：先 App Shell，再 API 缓存 |
| R4 | 协作 Undo 冲突检测复杂度高 | 质量 | MVP 仅支持简单线性撤销，复杂冲突 later |

---

## 非功能需求

- **性能**: WebSocket 编辑锁定消息 ≤ 200ms 延迟
- **可靠性**: 备份操作失败时重试 3 次，每次间隔 2s
- **离线**: Service Worker 缓存 App Shell < 2MB
- **兼容性**: PWA 支持 Chrome/Firefox/Safari（iOS 13+）
