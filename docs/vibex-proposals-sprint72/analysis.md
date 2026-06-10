# VibeX Sprint72 需求分析

## Sprint 上下文
- **当前 Sprint**: S72
- **分析目标**: 基于 S71 已完成功能识别下一轮迭代缺口
- **S71 已完成**: E1键盘快捷键可配置化 / E2实时协作评论系统(Reaction+WS) / E3大型画布性能优化(WebWorker+虚拟化) / E4画布使用统计分析 / E5模板评分与收藏增强
- **S70 已完成**: E1画布分支合并与冲突处理 / E2模板市场发现与浏览 / E3多格式批量画布导出 / E4协作冲突检测与锁升级 / E5画布设置面板完善

## S71 现状分析

### 已完成的基础设施
| 组件 | 文件路径 | 状态 |
|------|----------|------|
| Canvas历史(命令模式) | `src/stores/dds/canvasHistoryStore.ts` | 35648字节，undo/redo核心已实现 |
| Canvas剪贴板 | `src/stores/clipboardStore.ts` | 存在，实现状态待验证 |
| BatchOps Store | `src/stores/dds/batchOpsStore.ts` | 存在，UI面板缺失 |
| Analytics Store | `src/stores/dds/canvasAnalyticsStore.ts` | S71-E4 localStorage持久化 |
| RemoteCursors | `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` | 存在，presenceStore缺失 |
| Presence UI | `src/components/dds/presence/PresenceIndicator.tsx` | 存在，无统一store |
| TemplateGallery | `src/components/dds/templates/TemplateGallery.tsx` | 存在，无预览模式 |

## 需求提案 P001–P005

---

### P001: 画布历史管理面板 — 快照浏览与恢复

**问题描述**: `canvasHistoryStore.ts` (35648字节) 已实现 undo/redo 核心命令模式，但用户无法浏览历史快照、命名快照、恢复指定快照。

**根因分析**: store 实现了 `saveSnapshot / restoreSnapshot / undo / redo`，但没有对应的 HistoryPanel Tab 或快照列表 UI。

**影响**: 用户无法利用已积累的快照能力，版本控制停留在"只能撤回一步"而非"多版本管理"。

**技术方案**: 
- 新增 `HistoryPanel.tsx` 作为 HistoryPanel Tab6 (或重构 Tab4 Tab5 布局)
- 新增 `SnapshotList` 组件，显示快照时间戳+描述+操作按钮
- 集成 `canvasHistoryStore.getSnapshots()` → `renderHook` 渲染列表
- 支持点击"恢复"调用 `restoreSnapshot(id)`

**验收标准**:
- [ ] `HistoryPanel.tsx` 渲染快照列表，显示时间戳
- [ ] 点击"恢复"按钮调用 `canvasHistoryStore.restoreSnapshot(id)`
- [ ] 快照数量>0时有列表，=0时显示空状态
- [ ] `canvasHistoryStore.snapshots.test.ts` 覆盖 save/restore/undo/redo

---

### P002: BatchOps 批量操作面板 — 一站式多模板管理

**问题描述**: `batchOpsStore.ts` 已存在，`BatchOpsToolbar` 有 UI，但缺少独立的批量操作面板（多选确认、批量删除、批量移动）。

**根因分析**: toolbar 触发单个操作入口，但多模板场景需要专门的"选择→确认→执行"流程面板。

**影响**: 用户批量管理模板时操作路径断裂，体验差。

**技术方案**:
- 新增 `BatchOpsPanel.tsx` — Drawer/Modal 形式
- 显示已选模板列表（含缩略图+名称）
- 提供"批量删除"/"批量移动到文件夹"/"批量导出"操作按钮
- 集成 `batchOpsStore.selectedIds` + `batchOpsStore.selectAll()` / `clearSelection()`

**验收标准**:
- [ ] `BatchOpsPanel.tsx` 显示已选模板列表（ID/名称/缩略图）
- [ ] 批量删除确认后调用 `batchOpsStore.deleteSelected()`
- [ ] 批量移动调用 `batchOpsStore.moveSelectedTo(folderId)`
- [ ] `batchOpsStore.test.ts` 覆盖 selectAll/clearSelection/deleteSelected
- [ ] `BatchOpsPanel.test.tsx` 覆盖 render/select/deselect

---

### P003: 协作 Presence 统一 Store — 用户状态与游标同步

**问题描述**: `RemoteCursorsLayer.tsx`、`PresenceIndicator.tsx`、`PresenceOverlay.tsx` UI 组件均存在，但缺少统一的 `presenceStore` Zustand store。

**根因分析**: UI 组件直接引用 WS 数据，没有持久化 store 管理 remote users 状态。

**影响**: 协作者游标/头像无法在组件间共享状态，WS 数据直接穿透组件导致重复订阅。

**技术方案**:
- 新增 `src/stores/dds/presenceStore.ts` — Zustand + localStorage persist
- 管理 `remoteUsers: Map<odID, RemoteUser>` 结构（id/name/avatar/odID/cursor/color/activeNodes）
- 提供 `updateCursor(odID, cursor) / setActive(odID, active) / removeUser(odID)` actions
- WS handler 调用 `presenceStore.updateCursor()`
- `RemoteCursorsLayer` 改为从 `presenceStore` 读取而非直接 WS 数据

**验收标准**:
- [ ] `presenceStore.ts` 实现了 updateCursor / setActive / removeUser
- [ ] WS `onCursorMove` 事件调用 `presenceStore.updateCursor()`
- [ ] `RemoteCursorsLayer` 从 `presenceStore.remoteCursors` 读取游标数据
- [ ] `presenceStore.test.ts` 覆盖 add/update/remove user 场景

---

### P004: Analytics 趋势可视化 — 时间序列图表与分享

**问题描述**: S71-E4 `canvasAnalyticsStore` 实现了 localStorage 持久化和基本统计，但缺少时间序列趋势图、数据分享、多设备同步。

**根因分析**: 实现了 `recordEdit / getStats / exportAnalytics`，但数据以"当前总计"形式存储，无时间维度。

**影响**: 用户只能看到当前会话统计，无法分析编辑习惯趋势或跨设备对比。

**技术方案**:
- 扩展 `canvasAnalyticsStore` 增加 `history: AnalyticsEntry[]` 数组（每日快照）
- 新增 `AnalyticsTrendChart.tsx` — 使用 CSS bar chart（避免引入 chart 库依赖）
- 新增 `shareAnalytics(shareId)` 生成可分享链接（localStorage 存储分享数据）
- Tab5 HistoryPanel 增加 "趋势" 子 Tab

**验收标准**:
- [ ] `canvasAnalyticsStore` 支持 `history` 数组，每日自动归档
- [ ] `AnalyticsTrendChart.tsx` 渲染7日/30日 bar chart
- [ ] `exportAnalytics` 支持 CSV + trend JSON 两种格式
- [ ] `canvasAnalyticsStore.test.ts` 覆盖 history 归档逻辑

---

### P005: 模板预览模式 — 画布内容级预览

**问题描述**: `TemplateGallery.tsx` 存在，但模板卡片只有缩略图/名称，无法预览画布实际内容节点结构。

**根因分析**: 模板预览需要渲染画布内容节点，但 `TemplateGallery` 只显示 `TemplateCard` 缩略图，无深度预览能力。

**影响**: 用户无法判断模板质量，必须导入才能查看内容，决策成本高。

**技术方案**:
- 新增 `TemplatePreviewPanel.tsx` — Drawer 形式，显示画布节点树
- 复用 `DDSDrawflow` 渲染模板内容（或轻量 `TemplateNodeTree` 展示节点层级）
- 扩展 `templateStore` 增加 `getTemplateNodes(templateId)` 方法
- `TemplateGallery` 的"预览"按钮触发 `TemplatePreviewPanel`

**验收标准**:
- [ ] `TemplatePreviewPanel.tsx` 以 Drawer 形式渲染选中模板的节点列表
- [ ] 点击节点显示节点详情（类型/内容/连接关系）
- [ ] "导入"按钮调用 `templateStore.importTemplate(templateId)`
- [ ] `TemplatePreviewPanel.test.tsx` 覆盖 render/select node/import 流程

---

## 技术风险

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| canvasHistoryStore API 与 HistoryPanel 集成复杂度 | 高 | 先写 mock 测试，验证接口契约 |
| BatchOpsPanel 与 toolbar 重复交互逻辑 | 中 | BatchOpsPanel 为最终确认，toolbar 为快捷触发 |
| presenceStore 与 WS 实时同步时序 | 高 | 使用 zustand/immer 保证不可变更新 |
| Analytics trend chart 无图表库依赖 | 低 | 使用 CSS bar chart，keep it simple |
