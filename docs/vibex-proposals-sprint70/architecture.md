# S70 架构决策文档

**Sprint**: vibex-proposals-sprint70  
**日期**: 2026-06-06  
**参考**: prd.md, analysis.md

---

## 架构决策

### E1: 画布分支合并与冲突处理

**决策1: 合并策略 — 纯客户端 IndexedDB**
- 不引入服务端合并协调，使用客户端 IndexedDB 事务
- 冲突检测在 `canvasHistoryStore` 层完成
- 用户通过 UI 逐个解决冲突节点

**决策2: 复用 vs 新建**
- `SnapshotCompareDialog.tsx` (already exists at `src/components/dds/canvas/SnapshotCompareDialog.tsx`) — 扩展 merge-preview 模式
- `BranchManager.tsx` — 新增 MergeBranchButton 组件
- 复用 `SnapshotDiffRenderer.tsx` 做 diff 展示

**决策3: 冲突解决数据模型**
```typescript
interface ConflictRecord {
  nodeId: string;
  myVersion: SnapshotEntry;
  theirVersion: SnapshotEntry;
  timestamp: Date;
}
```

**现有资产映射**:
| 文件 | 状态 | 用途 |
|------|------|------|
| `src/stores/dds/canvasHistoryStore.ts` | ✅ EXISTS | mergeBranch action 扩展 |
| `src/lib/canvas/historyDB.ts` | ✅ EXISTS | mergeBranchInDB 已存在 |
| `src/components/dds/canvas-history/BranchManager.tsx` | ✅ EXISTS | MergeBranchButton 新增 |
| `src/components/dds/canvas-history/SnapshotDiffRenderer.tsx` | ✅ EXISTS | diff 渲染器复用 |
| `src/components/dds/canvas/SnapshotCompareDialog.tsx` | ✅ EXISTS | 扩展 merge-preview 模式 |
| `src/components/dds/canvas-dashboard/ConflictDialog.tsx` | ✅ EXISTS | 扩展冲突解决 |
| `src/lib/canvas/snapshotCompare.ts` | ✅ EXISTS | diff 算法复用 |

---

### E2: 模板市场发现与浏览

**决策1: 后端接口 vs 本地 mock**
- 第一阶段：本地 mock 数据（`templateStore` 内置 mock）
- 第二阶段：可替换为 REST/WebSocket API 调用
- 数据结构设计支持渐进增强

**决策2: 页面架构**
- "发现" Tab 复用现有 `TemplateGallery` Tab 组件
- 新增 `TemplateMarketplacePanel.tsx` 作为发现 Tab 内容
- 模板卡片增强通过 props 注入，无需改现有卡片

**决策3: 搜索与过滤**
- 复用 `canvasSearchStore` 的搜索逻辑
- 标签过滤使用 `TagSelector` 组件（S66-E4）

**现有资产映射**:
| 文件 | 状态 | 用途 |
|------|------|------|
| `src/stores/templateStore.ts` | ✅ EXISTS | featuredTemplates/searchMarketplace 方法新增 |
| `src/components/dds/templates/TemplateGallery.tsx` | ✅ EXISTS | 发现 Tab 集成 |
| `src/components/dds/templates/TagSelector.tsx` | ✅ EXISTS | 标签过滤复用 |
| `src/components/dds/templates/TemplateSearchBar.tsx` | ✅ EXISTS | 搜索框复用 |
| `src/lib/canvas/templateShare.ts` | ✅ EXISTS | 分享 URL 格式解析 |
| `src/components/dds/templates/TemplateShareDialog.tsx` | ✅ EXISTS | 分享发现入口 |

**新增文件**:
- `src/components/dds/templates/TemplateMarketplacePanel.tsx` — 市场专页

---

### E3: 多格式批量画布导出

**决策1: 复用现有 ZipExporter**
- `ZipExporter.ts` (exists at `src/services/export/ZipExporter.ts`) 扩展新方法
- 不新增服务类，扩展现有接口

**决策2: 导出顺序**
- PNG → SVG → PDF 串行生成
- 进度条状态由 `ExportProgress.tsx` 扩展

**现有资产映射**:
| 文件 | 状态 | 用途 |
|------|------|------|
| `src/services/export/ZipExporter.ts` | ✅ EXISTS | exportMultiFormat 新增 |
| `src/components/dds/export/ExportDialog.tsx` | ✅ EXISTS | 多格式入口 |
| `src/components/dds/export/ExportProgress.tsx` | ✅ EXISTS | 进度条扩展 |
| `src/components/dds/toolbar/ExportMenu.tsx` | ✅ EXISTS | 菜单项新增 |

**新增文件**:
- `src/services/export/MultiFormatExporter.ts` — 多格式导出逻辑封装

---

### E4: 协作冲突检测与锁升级

**决策1: 复用 presenceStore 而非新建**
- `presenceStore.ts` (exists at `src/lib/collaboration/presenceStore.ts`) 扩展 `pendingConflicts[]`
- 不引入新 store，保持 presence 统一管理

**决策2: 冲突 UI 使用独立 Dialog**
- 复用 `ConflictDialog.tsx` (exists at `src/components/dds/canvas-dashboard/ConflictDialog.tsx`) 作为基础
- 新建 `ConflictResolutionDialog.tsx` 做冲突解决

**决策3: 冲突检测触发**
- WS `node:edit_start` + `node:edit_end` 时间窗口检测（5s 内双写）
- 不依赖服务端协调，客户端本地检测

**现有资产映射**:
| 文件 | 状态 | 用途 |
|------|------|------|
| `src/lib/collaboration/presenceStore.ts` | ✅ EXISTS | pendingConflicts 扩展 |
| `src/lib/collaboration/types.ts` | ✅ EXISTS | ConflictRecord 类型 |
| `src/lib/collaboration/useCollabEditing.ts` | ✅ EXISTS | 编辑状态 hook 扩展 |
| `src/components/dds/canvas-dashboard/ConflictDialog.tsx` | ✅ EXISTS | 基础对话框 |
| `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` | ✅ EXISTS | 协作光标 |
| `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` | ✅ EXISTS | 协作光标 |

**新增文件**:
- `src/components/dds/collaboration/ConflictResolutionDialog.tsx` — 冲突解决对话框

---

### E5: 画布设置面板完善

**决策1: Drawer vs Tab**
- 采用 Drawer（侧边抽屉）而非新 Tab，保持设置入口统一
- 抽屉内使用 Tab 组件组织不同设置类别

**决策2: ViewPresetsPanel 整合**
- `ViewPresetsPanel.tsx` (exists at `src/components/dds/toolbar/ViewPresetsPanel.tsx`) 迁移到抽屉内
- 工具栏保留快捷下拉菜单（不变），抽屉提供完整设置

**决策3: DDSToolbar 扩展**
- 设置按钮已有 onClick stub，绑定 `isSettingsOpen` 状态

**现有资产映射**:
| 文件 | 状态 | 用途 |
|------|------|------|
| `src/components/dds/toolbar/DDSToolbar.tsx` | ✅ EXISTS | 设置按钮 onClick |
| `src/components/dds/toolbar/ViewPresetsPanel.tsx` | ✅ EXISTS | 抽屉内复用 |
| `src/components/dds/settings/CanvasSettingsPanel.tsx` | ✅ EXISTS | 已有 Tab 组件 |
| `src/components/dds/settings/ViewPresetsTab.tsx` | ✅ EXISTS | 预设 Tab 复用 |
| `src/components/dds/notifications/NotificationPanel.tsx` | ✅ EXISTS | 抽屉模式参考 |

**新增文件**:
- `src/components/dds/settings/CanvasSettingsDrawer.tsx` — 设置抽屉组件

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 集成方式 |
|--------|---------|---------|
| DDSToolbar | E1, E5 | E1: BranchManager 从 HistoryPanel 打开；E5: 设置按钮打开 Drawer |
| SnapshotCompareDialog | E1, E4 | E1: merge preview；E4: conflict resolution |
| ExportMenu | E3 | 多格式导出入口 |
| TemplateGallery | E2 | 发现 Tab 集成市场组件 |
| presenceStore | E4 | 冲突记录 + 节点锁联动 |

---

## 技术风险与缓解

| 风险 | 缓解 |
|------|------|
| IndexedDB 并发写入 (E1 merge) | 使用 IDBTransaction readwrite 串行化 |
| 模板市场 API 依赖 (E2) | 接口设计可适配，本地 mock 先上线 |
| WS 消息延迟导致漏检 (E4) | 5s 时间窗口容忍轻微延迟 |
| Drawer 与其他 panel 冲突 (E5) | Drawer 使用 z-index 层级隔离 |
