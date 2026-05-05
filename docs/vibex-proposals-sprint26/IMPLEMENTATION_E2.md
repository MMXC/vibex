# Epic2 跨项目 Canvas 版本历史 实现方案

## 背景

Sprint 26 E2 跨项目 Canvas 版本历史（P002），解决用户在协作场景中无法回溯同一项目历史版本的问题。

**6 个 Story**：
- S2.1: D1 数据库 `project_versions` 表迁移（1h，P0）
- S2.2: Canvas 保存时自动生成版本快照（最多 50 个）（2h，P0）
- S2.5: 版本历史 API 端点（0.5h，P0）
- S2.3: 版本历史面板 UI（时间线 + 快照预览）（2h，P1）
- S2.4: 版本恢复功能（含二次确认）（1h，P1）
- S2.6: 批量删除版本历史（清理）（0.5h，P2）

**已有基础**（已实现）：
- ✅ `CanvasSnapshot` 表存在（`migrations/0006_canvas_snapshot.sql`）
- ✅ 快照列表 GET API：`/api/v1/canvas/snapshots?projectId=xxx`
- ✅ 创建快照 POST API：`/api/v1/canvas/snapshots`
- ✅ 单个快照 GET：`/api/v1/canvas/snapshots/:id`
- ✅ 恢复快照 POST：`/api/v1/canvas/snapshots/:id/restore`
- ✅ 乐观锁（version conflict detection）
- ✅ `useVersionHistory` hook（加载/创建/恢复/选中）
- ✅ `VersionHistoryPanel` 组件（侧边栏、时间线、快照卡片）
- ✅ `canvasApi.createSnapshot / listSnapshots / restoreSnapshot`
- ✅ `useAutoSnapshot` hook（debounce 2s，基于 confirmationStore）
- ✅ SnapshotDiffView + compare mode

**缺口分析**：

### 后端缺口

#### 缺口 1: `/api/v1/projects/:id/versions` REST API（PRD 规范）
- PRD 明确要求 `/api/v1/projects/:id/versions`，但当前是 `/api/v1/canvas/snapshots`
- **方案**：新建 App Router routes 遵循 PRD 路径，在 `app/api/v1/projects/[id]/versions/route.ts`
- 这样做：兼容 PRD 验收标准，同时保留原有 Hono route（向后兼容）

#### 缺口 2: 自动快照触发时机缺失
- 当前 `useAutoSnapshot` 触发时调用 `confirmationStore.saveSnapshot`，但 `saveSnapshot` 依赖 confirmationStore 的流程状态，不是真正的 canvas 保存
- **方案**：在 Canvas 保存流程中集成 `useVersionHistory.createSnapshot(trigger='auto')`
- 需要找到 Canvas 保存的 hook 点

#### 缺口 3: 最多 50 个版本 + 自动清理
- 当前 POST 创建快照没有数量限制
- **方案**：在 POST 创建时，超过 50 个后删除最早的版本

#### 缺口 4: 批量删除 API
- `POST /api/v1/projects/:id/versions` 清理（PRD S2.6 要求 DELETE 方法）
- PRD 要求 `DELETE /api/v1/projects/:id/versions`
- **方案**：在 `app/api/v1/projects/[id]/versions/route.ts` 添加 DELETE handler

### 前端缺口

#### 缺口 5: 版本历史面板未集成到 CanvasPage
- `VersionHistoryPanel` 已实现，但未在 CanvasPage 中使用
- **方案**：在 CanvasPage 工具栏按钮触发 `useVersionHistory.open()`

#### 缺口 6: 版本恢复二次确认弹窗
- PRD S2.4 要求点击「恢复到该版本」弹出确认弹窗
- **方案**：在 `VersionHistoryPanel.tsx` 的 `handleRestore` 中，在真正执行恢复前显示确认 Dialog

#### 缺口 7: 自动快照未绑定 Canvas 保存事件
- 需要找到 Canvas store 的保存动作，在保存后触发 `createSnapshot(trigger='auto')`

#### 缺口 8: 批量删除按钮
- `VersionHistoryPanel` 需要在面板底部增加「清空历史」按钮，调用 DELETE API

---

## 方案设计

### 方案 A（推荐）：在原架构上扩展
- 不改变现有 Hono routes，只新建 App Router `/api/v1/projects/:id/versions` endpoints
- 在 Canvas store 保存时触发 auto-snapshot（通过 Zustand middleware 或 effect）
- 版本历史面板集成到 CanvasPage 工具栏
- 恢复时显示确认弹窗

**优点**：改动范围小，风险低
**缺点**：两套 API 路径（Hono + App Router）需维护

### 方案 B：统一迁移到 App Router
- 将所有 snapshot 相关 routes 迁移到 App Router
- 使用统一的 `/api/v1/projects/:id/versions` 路径

**优点**：统一路径，维护简单
**缺点**：涉及改动量大，需要测试 Hono → App Router 迁移

**推荐方案 A**：基于现有实现扩展，快速交付。

---

## 实施步骤

### Phase 1: 前端集成（0.5h）

1. 在 `CanvasPage` 工具栏添加「版本历史」按钮
2. 在 `DDSCanvasPage` 或 `CanvasPage` 中集成 `VersionHistoryPanel`
3. 验证 pnpm build 通过

### Phase 2: 版本恢复二次确认（0.5h）

4. 在 `VersionHistoryPanel.tsx` 的 `handleRestore` 中添加确认 Dialog
5. 确保 `[data-testid="version-restore-confirm"]` 标识

### Phase 3: 新建 PRD 规范 API（1h）

6. 创建 `app/api/v1/projects/[id]/versions/route.ts`（GET + DELETE）
7. 创建 `app/api/v1/projects/[id]/versions/[versionId]/route.ts`（GET + POST restore）
8. 实现 50 版本限制 + 自动清理逻辑

### Phase 4: 自动快照（1h）

9. 找到 Canvas store 的保存 action（`canvasStore.ts` 或 `DDSCanvasStore.ts`）
10. 在保存完成后通过 effect 触发 `createSnapshot(trigger='auto')`

### Phase 5: 批量删除（0.5h）

11. `VersionHistoryPanel` 底部增加「清空历史」按钮
12. 调用 DELETE `/api/v1/projects/:id/versions`

### Phase 6: 验证（0.5h）

13. `pnpm build` → 0 errors
14. 确认所有 `[data-testid]` 标识到位
15. 更新 IMPLEMENTATION_PLAN.md 中 E2 Stories 状态

---

## 文件变更

| 文件 | 变更类型 | 描述 |
|------|----------|------|
| `vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx` | 修改 | 恢复确认 Dialog、清空历史按钮 |
| `vibex-fronted/src/app/canvas/[projectId]/page.tsx` | 修改 | 集成 VersionHistoryPanel 触发按钮 |
| `vibex-fronted/src/hooks/canvas/useVersionHistory.ts` | 修改 | 增加 clearAllSnapshots、auto snapshot trigger |
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | 修改 | 增加 clearSnapshots API |
| `vibex-backend/src/app/api/v1/projects/[id]/versions/route.ts` | 新增 | GET list + DELETE clear |
| `vibex-backend/src/app/api/v1/projects/[id]/versions/[versionId]/route.ts` | 新增 | GET single + POST restore |
| `vibex-fronted/src/lib/api-config.ts` | 修改 | 增加 versions endpoints |

---

## 验收标准

### S2.1（D1 迁移）
- [ ] `CanvasSnapshot` 表存在，字段包含 id, projectId, version, name, description, data, createdAt, createdBy, isAutoSave

### S2.2（自动快照）
- [ ] Canvas 保存后 `project_versions` 表（或 CanvasSnapshot）新增 1 条记录
- [ ] 超过 50 个版本后自动删除最早的 1 条

### S2.3（版本历史面板 UI）
- [ ] `expect(page.locator('[data-testid="version-history-panel"]')).toBeVisible()`
- [ ] 列表展示最近 20 个版本快照

### S2.4（版本恢复含二次确认）
- [ ] 点击「恢复」→ `expect(page.locator('[data-testid="version-restore-confirm"]')).toBeVisible()`
- [ ] 确认后画布内容恢复

### S2.5（版本历史 API）
- [ ] `GET /api/v1/projects/:id/versions` → 200 + `{ versions: [{ id, data, createdAt, createdBy }] }`

### S2.6（批量删除）
- [ ] `DELETE /api/v1/projects/:id/versions` → 200，版本列表为空

### 全局
- [ ] `pnpm run build` → 0 errors

---

## 回滚计划

如果 `/api/v1/projects/:id/versions` 与现有流程冲突：
- 回滚到使用现有 `/api/v1/canvas/snapshots` endpoints
- 版本历史面板使用 `canvasApi.listSnapshots()` 获取数据

如果自动快照导致性能问题：
- 在 `useAutoSnapshot` 中增加 30s debounce（而不是 5s）
- 或只在 `createSnapshot('manual')` 生效时启用