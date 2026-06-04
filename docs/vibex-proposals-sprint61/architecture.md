# VibeX Sprint61 架构文档

**项目**: vibex-proposals-sprint61
**版本**: 1.0
**日期**: 2026-06-04
**状态**: draft

---

## 1. 跨 Epic 架构决策

### 决策 1: UI 组件统一采用 Drawer/Panel 模式
**问题**: 各 Epic 的 UI 面板（HistoryTimeline、ExportDialog、BackupPanel）需要统一的容器模式。
**决策**: 全部使用 SlideOver Drawer（右侧滑出），由各 Epic 的 toolbar 入口按钮触发。HistoryPanel 复用 `DDSPanel` 框架的 `isOpen` 状态管理模式。
**影响 Epic**: E1, E2, E5

### 决策 2: i18n 框架选型
**问题**: VibeX 需要国际化但无现有 i18n 框架。
**决策**: 引入 `i18next` + `react-i18next`。核心文件：
- `src/i18n/index.ts` — i18next 实例初始化，检测浏览器语言
- `src/i18n/locales/en.json` — 英文翻译资源
- `src/i18n/locales/zh.json` — 中文翻译资源（从现有硬编码字符串提取）
**影响 Epic**: E3

### 决策 3: BackupService 数据格式
**问题**: 备份文件需要跨版本兼容。
**决策**: `.vibex` 文件格式为 JSON 压缩包，内嵌 `version` 字段用于未来格式演进。
```typescript
// BackupService.ts 核心接口
interface VibexBackup {
  version: 1;
  canvasId: string;
  exportedAt: string; // ISO timestamp
  canvas: CanvasState;
  history: Snapshot[];
  templates: Template[];
}
```
**影响 Epic**: E5

### 决策 4: AI Agent Context 通过 store 注入
**问题**: AI agent 需要画布上下文但当前与 canvas 状态隔离。
**决策**: `agentStore` 持有 `canvasContext` 字段（字符串摘要）。`useAIAgentContext` hook 在 session 创建时序列化画布状态写入 store。
**影响 Epic**: E4

---

## 2. Epic 架构详情

### E1: 画布版本历史时间线视图 + 快照对比

**核心架构**:
- `canvasHistoryStore` (S60 已完成) 提供底层 `listSnapshots()`、`compareSnapshots(a, b)` API
- E1 在其上构建 UI 层：时间线组件 + 预览 + diff

**组件结构**:
```
DDSToolbar (历史图标)
  └── HistoryPanel (Drawer)
        ├── HistoryTimeline (快照列表)
        ├── SnapshotPreview (右侧只读预览)
        └── SnapshotDiff (选中两个快照的 diff)
```

**关键 API**:
```typescript
// canvasHistoryStore 扩展
listSnapshots(options?: { branch?: string; starred?: boolean }): Snapshot[]
compareSnapshots(idA: string, idB: string): DiffResult
getSnapshotPreview(id: string): CanvasState
```

**预发现资产**:
| 资产 | 状态 | 说明 |
|------|------|------|
| `canvasHistoryStore.ts` | ✅ 已存在 (S60-E1) | 持久化 + compare mode 已完成 |
| `DDSPanel.tsx` | ✅ 已存在 | Drawer 容器参考 |
| DDSToolbar 历史按钮 | ❌ 需新增 | 集成入口 |

**新文件**:
- `vibex-fronted/src/components/dds/canvas-history/HistoryTimeline.tsx`
- `vibex-fronted/src/components/dds/canvas-history/SnapshotPreview.tsx`
- `vibex-fronted/src/components/dds/canvas-history/SnapshotDiff.tsx`
- `vibex-fronted/src/components/dds/canvas-history/HistoryPanel.tsx`
- `vibex-fronted/src/components/dds/canvas-history/__tests__/HistoryTimeline.test.tsx`

**扩展文件**:
- `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` — 添加 `listSnapshots({ branch, starred })` 排序/过滤 action

---

### E2: 批量操作 UI 完善 + 画布级批量导出

**核心架构**:
- `ZipExporter.ts` (S60-E4) 已实现 `exportZip()` 核心逻辑
- E2: 联通 UI 与 ZipExporter，扩展支持 PDF 格式

**组件结构**:
```
DDSToolbar (导出菜单)
  └── ExportMenu (下拉菜单)
        ├── [现有] 单节点导出
        └── [E2] 批量导出 → ExportDialog
                    ├── ExportProgress (导出进度)
                    └── DownloadManager (下载队列)
```

**关键 API**:
```typescript
// ZipExporter.ts 扩展
exportZip(format: 'png' | 'svg' | 'pdf', nodeIds?: string[], onProgress?: (p: number) => void): Promise<Blob>
```

**预发现资产**:
| 资产 | 状态 | 说明 |
|------|------|------|
| `ZipExporter.ts` | ✅ 已存在 (S60-E4) | 15/15 vitest |
| `ZipExporter.test.ts` | ✅ 已存在 (S60-E4) | 完整测试覆盖 |
| `batchOpsStore.ts` | ✅ 已存在 (S60-E2) | 批量操作状态 |
| `ExportMenu.tsx` | ❌ 需扩展 | 添加批量导出入口 |
| `useBatchExport.ts` | ❌ 新增 | hook 联通 ZipExporter |
| `ExportProgress.tsx` | ❌ 新增 | 进度条组件 |

**新文件**:
- `vibex-fronted/src/components/dds/export/ExportDialog.tsx`
- `vibex-fronted/src/components/dds/export/ExportProgress.tsx`
- `vibex-fronted/src/hooks/canvas/useBatchExport.ts`
- `vibex-fronted/src/hooks/canvas/__tests__/useBatchExport.test.ts`

**扩展文件**:
- `vibex-fronted/src/components/dds/export/ExportMenu.tsx` — 添加批量导出菜单项
- `vibex-fronted/src/services/export/ZipExporter.ts` — 扩展 exportZip 支持 PDF 格式

---

### E3: 国际化完善 + 多语言支持

**核心架构**:
- `i18next` 框架，命名空间 `common`（通用 UI）和 `epic`（各 Epic 特定）
- 语言偏好存储在 `localStorage['vibex-language']`
- 组件通过 `t('key')` 函数获取翻译文本

**组件结构**:
```
DDSToolbar
  └── LanguageSwitcher (语言切换按钮，下拉 en/zh)
```

**命名空间设计**:
```typescript
// src/i18n/locales/en.json
{
  "toolbar": {
    "export": "Export",
    "history": "History",
    "batchOps": "Batch Operations",
    "settings": "Settings"
  },
  "export": {
    "batchExport": "Batch Export",
    "format": "Format"
  }
}
```

**预发现资产**:
| 资产 | 状态 | 说明 |
|------|------|------|
| DDSToolbar.tsx | ✅ 已存在 | 硬编码中文，需重构 |
| BatchOpsToolbar.tsx | ✅ 已存在 (S60-E2) | 硬编码中文 |
| DDSSearchPanel.tsx | ✅ 已存在 (S60-E5) | 硬编码中文 |
| package.json | ❌ 需添加依赖 | i18next, react-i18next |

**新文件**:
- `vibex-fronted/src/i18n/index.ts`
- `vibex-fronted/src/i18n/locales/en.json`
- `vibex-fronted/src/i18n/locales/zh.json`
- `vibex-fronted/src/hooks/settings/useLanguage.ts`
- `vibex-fronted/src/components/dds/toolbar/LanguageSwitcher.tsx`

**扩展文件**:
- `vibex-fronted/package.json` — 添加 i18next, react-i18next
- `vibex-fronted/src/components/dds/DDSToolbar.tsx` — 重构为 i18n
- `vibex-fronted/src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` — i18n
- `vibex-fronted/src/components/dds/export/ExportMenu.tsx` — i18n
- `vibex-fronted/src/components/dds/DDSSearchPanel.tsx` — i18n

---

### E4: AI Session 画布上下文集成

**核心架构**:
- `agentStore` (需扩展) 持有画布上下文字符串
- `useAIAgentContext` hook 在 session 初始化时序列化画布状态
- StreamingAgentPanel 展示上下文 + 重试配置

**关键 API**:
```typescript
// agentStore 扩展
interface AgentState {
  sessions: AISession[];
  canvasContext?: string;
  retryConfig: '3' | '5' | 'infinite';
  setCanvasContext(summary: string): void;
  setRetryConfig(config: '3' | '5' | 'infinite'): void;
}

// useAIAgentContext.ts
interface AIAgentContext {
  canvasSummary: string; // "nodes: 42, edges: 15, selection: 3"
  attachToSession(sessionId: string): void;
}
```

**预发现资产**:
| 资产 | 状态 | 说明 |
|------|------|------|
| `ai-draft/AIDraftDrawer.tsx` | ✅ 已存在 | AI panel UI 基础 |
| agentStore | ❌ 需新建 | AI session 管理 |

**新文件**:
- `vibex-fronted/src/hooks/ai/useAIAgentContext.ts`
- `vibex-fronted/src/hooks/ai/__tests__/useAIAgentContext.test.ts`
- `vibex-fronted/src/stores/dds/agentStore.ts` (新建 AI session store)

**扩展文件**:
- `vibex-fronted/src/stores/dds/agentStore.ts` — 添加 canvasContext 字段

---

### E5: 画布数据备份与导出

**核心架构**:
- `BackupService` 服务层，封装 `.vibex` 文件序列化
- `useBackup` hook 封装 service 方法
- `BackupPanel` 提供导出/导入/列表 UI

**BackupService 接口**:
```typescript
class BackupService {
  static async exportBackup(canvasId: string): Promise<Blob>
  static async importBackup(file: File): Promise<CanvasState>
  static listBackups(): BackupRecord[]
  static deleteBackup(id: string): void
}

interface BackupRecord {
  id: string;
  canvasId: string;
  exportedAt: string;
  size: number;
}
```

**`.vibex` 文件格式**:
```typescript
interface VibexBackup {
  version: 1;
  canvasId: string;
  exportedAt: string;
  canvas: DDSCanvasState;
  history: Snapshot[];
  templates: Template[];
}
```

**预发现资产**:
| 资产 | 状态 | 说明 |
|------|------|------|
| `canvasHistoryStore.ts` | ✅ 已存在 (S60-E1) | 版本历史数据源 |
| DDSToolbar | ✅ 已存在 | 备份按钮容器 |

**新文件**:
- `vibex-fronted/src/services/backup/BackupService.ts`
- `vibex-fronted/src/services/backup/__tests__/BackupService.test.ts`
- `vibex-fronted/src/components/dds/settings/BackupPanel.tsx`
- `vibex-fronted/src/hooks/settings/useBackup.ts`
- `vibex-fronted/src/hooks/settings/__tests__/useBackup.test.ts`

**扩展文件**:
- `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` — 添加备份按钮

---

## 3. 跨 Epic 集成点

| 集成点 | 涉及 Epic | 说明 |
|--------|-----------|------|
| HistoryPanel × DDSToolbar | E1 × E3 | 历史图标按钮需要 i18n |
| ExportDialog × ZipExporter | E2 × E3 | ExportDialog UI 需要 i18n |
| ExportDialog × batchOpsStore | E2 | 节点范围选择复用 batchOpsStore selection |
| StreamingAgentPanel × agentStore | E4 | AI panel 展示 canvasContext |
| BackupPanel × canvasHistoryStore | E5 × E1 | 备份包含版本历史快照 |
| DDSToolbar × i18n | E3 (横切) | 所有 toolbar 按钮统一 i18n |

---

## 4. 技术风险

| 风险 | 缓解 |
|------|------|
| i18n 重构破坏现有硬编码组件 | 逐组件迁移，vitest 全量回归 |
| .vibex 格式版本不兼容 | 格式内嵌 version: 1 字段 |
| 备份数据量大导致 UI 阻塞 | BackupService 使用 async/await，UI 层加 loading 状态 |
| PDF 导出依赖 jsPDF 库 | 在 ZipExporter 内动态 import，package.json 添加依赖 |
