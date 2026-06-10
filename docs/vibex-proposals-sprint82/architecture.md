# Sprint82 架构设计

**Sprint**: Sprint82  
**日期**: 2026-06-09  
**项目**: vibex-proposals-sprint82

---

## 架构概览

Sprint82 包含 5 个 Epic，分布在 3 个架构层：
- **Store 层**: `canvasHistoryStore` 扩展、E4 新 hook
- **Service 层**: 新建 `shareService.ts`
- **UI 层**: 4 个新组件 + 1 个扩展组件

---

## E1: 画布版本分支管理 UI

### 架构决策

**决策 1: Branch 数据已存在于 IndexedDB**
- `canvasHistoryStore` 在 S80-E3 已丰富 `MergeHistoryEntry`，包含 `mergedNodeIds/conflictCount/authorIds`
- E1 只需在现有 store 上添加 UI 层 + 新增 `switchBranch`/`diffBranches` 方法
- **不需要**新增数据库 schema

**决策 2: 分支 UI 作为独立 Panel**
- `MergeHistoryPanel.tsx` 作为 DDSCanvasPage 的右侧 Panel 挂载
- 复用 `DDSPanel` 基底样式（与 HistoryPanel/MergeHistoryPanel 同级）
- 分支切换触发 `canvasHistoryStore.loadBranch(branchId)` → 重渲染画布

### 架构图

```
DDSCanvasPage
  └── MergeHistoryPanel (new)
        ├── BranchList (分支下拉列表)
        ├── VersionTimeline (版本时间线)
        └── DiffViewer (两分支 diff)

canvasHistoryStore
  ├── switchBranch(branchId)       [E1 NEW]
  ├── diffBranches(a, b)           [E1 NEW]
  ├── loadBranch(branchId)         [E1 NEW]
  └── existing methods (saveSnapshotToDB, etc.)
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/canvas-dashboard/MergeHistoryPanel.tsx` | 新建 | 分支管理 UI |
| `src/components/dds/canvas-dashboard/MergeHistoryPanel.module.css` | 新建 | 样式 |
| `src/stores/dds/canvasHistoryStore.ts` | 扩展 | 添加 switchBranch/diffBranches/loadBranch |

---

## E2: 模板 Gallery UI

### 架构决策

**决策 1: 复用 templateStore，不新建 store**
- S80-E2 已实现 `filterTemplates` + `getTemplates` 方法
- E2 只需新建 UI 组件调用已有 store 方法

**决策 2: Gallery 作为独立 Route**
- `src/app/gallery/page.tsx` — Gallery 独立页面
- DDSToolbar 添加入口按钮

### 架构图

```
DDSToolbar
  └── TemplateGalleryButton → navigate('/gallery')

/gallery/page.tsx
  └── TemplateGallery
        ├── FilterBar (分类 + 标签筛选)
        ├── SearchBox (名称搜索)
        └── TemplateCardGrid
              └── TemplateCard[]

templateStore
  └── filterTemplates(opts) / getTemplates()
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/app/gallery/page.tsx` | 新建 | Gallery 页面 |
| `src/components/dds/gallery/TemplateGallery.tsx` | 新建 | Gallery 主体组件 |
| `src/components/dds/gallery/TemplateCard.tsx` | 新建 | 单个模板卡片 |
| `src/components/dds/gallery/TemplateGallery.module.css` | 新建 | 样式 |

---

## E3: 画布分享与隐私

### 架构决策

**决策 1: 分享链接存储在 canvasListStore**
- 分享链接信息（token + 权限）写入 IndexedDB `canvasListStore` 的 canvas metadata
- 不单独建表，复用现有 canvas metadata 结构

**决策 2: ShareDialog 为 Modal 组件**
- 复用 `DDSDialog` 基底，不新建 Dialog 基座
- 分享按钮在 DDSToolbar 右下角

### 架构图

```
DDSToolbar
  └── ShareButton (E3 NEW)

ShareDialog.tsx (Modal)
  ├── ShareLinkGenerator
  ├── PermissionSelector (view/edit)
  └── ShareLinkList (已分享链接列表)

shareService.ts (new)
  ├── generateShareLink(canvasId, permission)
  ├── revokeShareLink(token)
  └── listShareLinks(canvasId)

canvasListStore
  └── canvas.shareLinks[] (扩展 metadata)
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/services/shareService.ts` | 新建 | 分享服务 |
| `src/components/dds/share/ShareDialog.tsx` | 新建 | 分享弹窗 |
| `src/components/dds/share/ShareDialog.module.css` | 新建 | 样式 |
| `src/components/dds/toolbar/DDSToolbar.tsx` | 扩展 | 添加 ShareButton |

---

## E4: 文件拖拽导入

### 架构决策

**决策 1: useFileDrop hook 接入点为 DDSDrawflow**
- Hook 监听全局 `dragover`/`drop` 事件，判断 target 是否为画布区域
- 检测文件扩展名 (.flow.json / .flow.zip)，复用 S81-E1 `CanvasImporter`

**决策 2: 复用 ImportConflictDialog**
- 导入时名称冲突复用 S81-E1 的 `ImportConflictDialog`
- 不新建冲突处理组件

### 架构图

```
DDSDrawflow (or DDSCanvasPage)
  └── useFileDrop (E4 NEW hook)
        ├── onDrop: parse file → CanvasImporter.parseFlowJson/parseFlowZip
        ├── onDragOver: highlight drop zone
        └── onDrop: conflict → ImportConflictDialog.show()
              └── canvasListStore.createCanvas()
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/hooks/canvas/useFileDrop.ts` | 新建 | 拖拽 hook |
| `src/hooks/canvas/useFileDrop.test.ts` | 新建 | 测试 |

---

## E5: 协作冲突增强

### 架构决策

**决策 1: 扩展现有 ConflictDialog，不替换**
- S81-E1 的 `ConflictDialog.tsx` 保持不变
- E5 添加策略选择区（radio: auto-resolve / manual）和冲突节点高亮

**决策 2: WS 冲突消息触发 Dialog**
- `useCollaboration.ts` 的 `handleMessage` 处理 `canvas_conflict` WS 消息
- 消息 payload: `{ branchId, conflictNodes[], strategy? }`

### 架构图

```
useCollaboration (handleMessage)
  └── WS: canvas_conflict
        └── ConflictDialog.show({ branchId, conflictNodes })

ConflictDialog.tsx (E5 扩展)
  ├── StrategySelector (last-write-wins / manual-merge)
  ├── ConflictNodeHighlight (红色边框)
  └── canvasHistoryStore.resolveConflict()

canvasHistoryStore
  └── resolveConflict(branchId, strategy) [E5 NEW]
```

### 新增/扩展文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/dds/canvas-dashboard/ConflictDialog.tsx` | 扩展 | 添加策略选择 + 高亮 |
| `src/stores/dds/canvasHistoryStore.ts` | 扩展 | 添加 resolveConflict |
| `src/components/dds/canvas-dashboard/ConflictDialog.test.tsx` | 扩展 | E5 测试 |

---

## 跨 Epic 集成点

| 集成 | 文件 | 变更 |
|------|------|------|
| E3 → E1 | `canvasHistoryStore` | E3 分享链接关联分支权限 |
| E4 → E1 | `canvasHistoryStore.loadBranch` | E4 导入后切换到新分支 |
| E5 → E1 | `canvasHistoryStore.diffBranches` | E5 diff 时复用分支对比 |
| E3 → E2 | `DDSToolbar` | 分享按钮 + Gallery 入口按钮 |

---

## 技术风险与缓解

1. **E1 Branch Store 变更**: `canvasHistoryStore` 已有 52KB，扩展需避免覆盖现有方法。缓解：仅添加新方法，不修改已有方法签名。
2. **E4 drag event 在 React 外**: `dragover`/`drop` 为 DOM 事件，vitest 需模拟 `DataTransfer` 对象。缓解：`fireEvent.dragOver` + `fireEvent.drop`。
3. **E3 Share Token 安全**: 分享 token 需足够熵（256-bit）。缓解：使用 `crypto.getRandomValues()` 生成。
