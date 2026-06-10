# S76 架构设计文档

**项目**: vibex-proposals-sprint76
**日期**: 2026-06-07

---

## 架构决策

### E1: 画布背景设置集成

**决策1**: 使用 `settingsStore` 集中管理背景配置

`settingsStore.ts`（`src/stores/dds/settingsStore.ts`）已存在且包含 persist middleware。扩展 `settingsStore` 新增 `canvasBackground` 字段。

**决策2**: DDSToolbar 背景配置解耦

`DDSToolbar.tsx` L213 硬编码 Background 组件改为 `const bg = settingsStore(s => s.canvasBackground)` 动态渲染。

**现有资产映射**:
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/stores/dds/settingsStore.ts` | ✅ 存在 | 扩展 canvasBackground 字段 |
| `src/components/dds/settings/CanvasSettingsPanel.tsx` | ✅ 存在 (3634B) | 新增背景 Tab |
| `src/components/dds/toolbar/DDSToolbar.tsx` | ✅ 存在 | 移除硬编码，读取 store |
| `src/stores/dds/settingsStore.test.ts` | ✅ 存在 | 扩展测试 |

---

### E2: 批量画布操作工具栏

**决策1**: 复用现有 BatchOpsToolbar 扩展而非新建

`BatchOpsToolbar.tsx`（`src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx`, 10847B）已实现 S60-E2 批量导出/移动/删除。E2 扩展其 FolderTree 集成能力。

**决策2**: FolderTree 多选状态通过 `canvasListStore.selectedCanvasIds` 共享

`canvasListStore` 已管理 `selectedCanvasIds` 数组，BatchOpsToolbar 监听该状态。

**现有资产映射**:
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` | ✅ 存在 | 扩展 FolderTree 集成 |
| `src/components/dds/canvas/FolderTree.tsx` | ✅ 存在 | 多选状态共享 |
| `src/stores/canvasListStore.ts` | ✅ 存在 | selectedCanvasIds 已存在 |

---

### E3: 全文搜索增强

**决策1**: 使用 Fuse.js 做客户端模糊搜索

Fuse.js 已在项目中（Zustand IDE 集成用到），无需新增依赖。

**决策2**: 搜索索引按需重建，非实时同步

`canvasIndex` 在画布增删改时调用 `rebuildIndex()` 更新，避免每次状态变更都重建。

**现有资产映射**:
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/stores/canvasListStore.ts` | ✅ 存在 | 扩展 canvasIndex + indexedSearch |
| `src/components/dds/search/GlobalSearchPanel.tsx` | ✅ 存在 (13624B) | 扩展分组显示 |

---

### E4: 画布导入导出完整流程

**决策1**: ZipExporter 扩展 `exportCanvases(canvasIds)` 方法

现有 `ZipExporter.ts`（`src/services/export/ZipExporter.ts`）已实现单画布导出。E4 扩展为批量。

**决策2**: CanvasImportPanel 独立路由/弹窗

导入面板为独立弹窗组件（Modal），不污染现有 UI 层级。

**现有资产映射**:
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/services/export/ZipExporter.ts` | ✅ 存在 | 扩展批量导出方法 |
| `src/components/dds/toolbar/ExportMenu.tsx` | ✅ 存在 | 新增导出菜单项 |
| `src/components/dds/canvas-dashboard/CanvasImportPanel.tsx` | ❌ 缺失 | 新建 |
| `src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` | ✅ 存在 | 批量导出复用 |

---

### E5: 协作冲突检测与提示

**决策1**: `presenceStore` 新增 `remoteEditing` Map

现有 `presenceStore.ts`（`src/lib/collaboration/presenceStore.ts`）已有 `remoteUsers` 结构。E5 新增 `remoteEditing` 字段。

**决策2**: WS 消息类型扩展

新增 `editing_node` 消息类型（广播当前编辑节点 ID）。

**决策3**: ConflictWarningBanner 非阻塞提示

轻量 Banner，不干扰编辑流程，3秒自动消失。

**现有资产映射**:
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/lib/collaboration/presenceStore.ts` | ✅ 存在 | 扩展 remoteEditing |
| `src/components/dds/canvas-dashboard/ConflictWarningBanner.tsx` | ❌ 缺失 | 新建 |
| `src/components/dds/canvas-dashboard/DDSCanvasPage.tsx` | ⚠️ 需检查 | 添加 ConflictWarningBanner |

---

## 跨 Epic 集成点

```
DDSToolbar.tsx ──┬──> BatchOpsToolbar (E2)
                  ├──> ExportMenu (E4)
                  └──> Background (E1)

DDSCanvasPage.tsx ──> ConflictWarningBanner (E5)

canvasListStore ──┬──> GlobalSearchPanel (E3)
                  ├──> BatchOpsToolbar (E2)
                  └──> ZipExporter (E4)

presenceStore ──> DDSCanvasPage (E5)
```

---

## 技术风险

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| Fuse.js 索引内存占用 (>1000画布) | 性能 | 延迟索引 + 分片 |
| WS 消息丢失导致过期冲突提示 | 用户体验 | 添加心跳保活 |
| DDSToolbar 硬编码 Background 移除风险 | 现有功能 | 先加条件渲染，再移除旧代码 |
| BatchOpsToolbar + FolderTree 多选状态共享 | 状态一致性 | 统一使用 canvasListStore |
