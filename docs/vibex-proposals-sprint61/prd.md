# VibeX Sprint61 PRD — 产品需求文档

**项目**: vibex-proposals-sprint61
**版本**: 1.0
**日期**: 2026-06-04
**状态**: draft

---

## 1. 执行摘要

Sprint61 基于 Sprint60 完成的画布版本历史、批量操作、协作活动流、画布导出增强、搜索体验增强，识别出 5 个关键迭代缺口：版本历史时间线 UI、画布级批量导出、国际化完善、AI 画布上下文集成、数据备份与导出。

| Epic | 功能 | 优先级 | 研发 | 测试 |
|------|------|--------|------|------|
| E1 | 画布版本历史时间线 + 快照对比 | P0 | 新增 | 新增 |
| E2 | 批量操作 UI 完善 + 画布级批量导出 | P0 | 新增+扩展 | 新增 |
| E3 | 国际化完善 + 多语言支持 | P1 | 新增 | 新增 |
| E4 | AI Session 画布上下文集成 | P1 | 新增 | 新增 |
| E5 | 画布数据备份与导出 | P1 | 新增 | 新增 |

---

## 2. Epic × User Story 表

| Epic | 作为... | 我想... | 以便... |
|------|---------|---------|---------|
| E1 | 设计师 | 浏览画布版本历史时间线并对比快照 | 选择性恢复到特定版本 |
| E2 | 用户 | 对整个画布批量导出为 PDF/PNG/ZIP | 快速备份画布内容 |
| E3 | 海外用户 | 切换到英文界面 | 完整使用产品功能 |
| E4 | 用户 | 让 AI Agent 看到当前画布状态并配置重试 | 得到更精准的 AI 辅助 |
| E5 | 用户 | 将画布完整备份到本地文件 | 防止数据丢失 |

---

## 3. 功能规格

### E1: 画布版本历史时间线视图 + 快照对比

**问题**: canvasHistoryStore 持久化和 compare mode 已完成，但缺少时间线 UI 和快照预览/对比功能。

**功能点**:
- `HistoryTimeline.tsx` — 时间线面板（左侧抽屉），快照列表时间倒序、星标置顶
- `SnapshotPreview.tsx` — 点击时间线条目，右侧展示只读节点预览（缩放）
- `SnapshotDiff.tsx` — 选择两个快照，diff 视图（绿色新增/红色删除/黄色修改）
- `HistoryPanel.tsx` — 整合时间线 + 预览 + 对比为一站式面板

**DoD**:
- [ ] 时间线面板展示所有快照（时间戳、分支名、节点数）
- [ ] 点击快照显示节点预览（只读，可缩放）
- [ ] 支持选择两个快照进行 diff 对比
- [ ] 星标快照在时间线中置顶显示
- [ ] vitest 覆盖率 ≥ 90%

**新增文件**:
- `src/components/dds/canvas-history/HistoryTimeline.tsx`
- `src/components/dds/canvas-history/SnapshotPreview.tsx`
- `src/components/dds/canvas-history/SnapshotDiff.tsx`
- `src/components/dds/canvas-history/HistoryPanel.tsx`
- `src/components/dds/canvas-history/__tests__/HistoryTimeline.test.tsx`

**扩展文件**:
- `src/lib/canvas/stores/canvasHistoryStore.ts` — 添加时间线排序/过滤 action

---

### E2: 批量操作 UI 完善 + 画布级批量导出

**问题**: ZipExporter.exportZip() 存在但未被 UI 调用，ExportMenu PDF radio 无后端支持，无法对整个画布批量导出。

**功能点**:
- `useBatchExport.ts` — 扩展 hook，联通 ZipExporter，支持 PNG/SVG/PDF 三种格式
- `ExportDialog.tsx` — 批量导出对话框：格式选择、节点范围（全部/选中）、ZIP 压缩选项
- `ExportProgress.tsx` — 导出进度面板（百分比进度条、文件名、取消）
- ExportMenu.tsx 集成 ExportDialog 为"批量导出"入口

**DoD**:
- [ ] 全画布批量导出（PNG/SVG/PDF + ZIP）功能可用
- [ ] 导出进度实时反馈（百分比 + 文件名）
- [ ] ExportDialog 支持格式选择 + 节点范围选择
- [ ] vitest: ZipExporter.test.ts + useBatchExport.test.ts ≥ 90%

**新增文件**:
- `src/components/dds/export/ExportDialog.tsx`
- `src/components/dds/export/ExportProgress.tsx`
- `src/hooks/canvas/useBatchExport.ts`
- `src/hooks/canvas/__tests__/useBatchExport.test.ts`

**扩展文件**:
- `src/components/dds/export/ExportMenu.tsx` — 添加批量导出按钮/菜单
- `src/services/export/ZipExporter.ts` — 扩展 exportZip 支持三种格式

---

### E3: 国际化完善 + 多语言支持

**问题**: 大量硬编码中文字符串，无 i18n 框架，海外用户无法使用。

**功能点**:
- 引入 `i18next` + `react-i18next` i18n 框架
- 建立 `locales/en.json` + `locales/zh.json` 翻译资源
- 重构关键组件使用 `t('key')` 而非硬编码：DDSToolbar、BatchOpsToolbar、ExportMenu、DDSSearchPanel、ActivityFeed、HistoryPanel
- `LanguageSwitcher.tsx` — 工具栏语言切换按钮
- `useLanguage.ts` hook — 持久化语言偏好到 localStorage

**DoD**:
- [ ] i18next 框架集成 + 运行时语言切换
- [ ] 核心 UI 组件（中英双语）：DDSToolbar、BatchOpsToolbar、ExportMenu、SearchPanel
- [ ] 语言偏好 localStorage 持久化
- [ ] vitest 覆盖 i18n hook

**新增文件**:
- `src/i18n/index.ts`
- `src/i18n/locales/en.json`
- `src/i18n/locales/zh.json`
- `src/hooks/settings/useLanguage.ts`
- `src/components/dds/toolbar/LanguageSwitcher.tsx`

**扩展文件**:
- `package.json` — 添加 i18next, react-i18next 依赖
- DDSToolbar.tsx, BatchOpsToolbar.tsx, ExportMenu.tsx, DDSSearchPanel.tsx, ActivityFeed.tsx

---

### E4: AI Session 画布上下文集成 + 可配置重试

**问题**: AI Session 与 Canvas 状态隔离，agentStore 不持有 canvas 上下文引用，用户无法配置重试次数。

**功能点**:
- `useAIAgentContext.ts` — hook，将画布状态序列化为上下文文本
- `agentStore` 扩展：添加 `canvasContext` 字段、`setCanvasContext()` action
- `StreamingAgentPanel.tsx` 扩展 — 新增画布上下文区块、重试配置下拉（3/5/无限）
- AI 自动注入：新建 session 时自动附加画布上下文

**DoD**:
- [ ] 新建 AI Session 时自动携带画布上下文（节点数 + 边数 + selection 摘要）
- [ ] StreamingAgentPanel 显示画布上下文区块
- [ ] 重试次数 UI 可配置（3/5/无限）
- [ ] 断线重连时 UI 显示重试状态（retrying spinner）
- [ ] vitest: useAIAgentContext.test.ts ≥ 90%

**新增文件**:
- `src/hooks/ai/useAIAgentContext.ts`
- `src/hooks/ai/__tests__/useAIAgentContext.test.ts`

**扩展文件**:
- `src/stores/dds/agentStore.ts` — 添加 canvasContext 字段

---

### E5: 画布数据备份与导出

**问题**: 缺乏系统化数据备份能力，版本历史无法导出为用户可控的备份包。

**功能点**:
- `BackupService.ts` — 服务层：
  - `exportBackup(canvasId)` — 序列化画布 JSON + 版本历史 + templates → `.vibex` 文件
  - `importBackup(file: File)` — 解析 .vibex 文件恢复画布状态
  - `listBackups()` — 列出 localStorage 中的备份记录
- `BackupPanel.tsx` — 备份管理面板：导出/导入/列表/删除
- `useBackup.ts` — hook，封装 BackupService
- DDSToolbar 新增备份按钮

**DoD**:
- [ ] 一键导出画布完整备份（.vibex 文件，包含所有版本历史）
- [ ] 从 .vibex 文件恢复画布（覆盖或新建）
- [ ] 备份列表展示历史备份（时间、大小、可删除）
- [ ] 备份文件可下载到本地（浏览器下载）
- [ ] vitest: BackupService.test.ts + useBackup.test.ts ≥ 90%

**新增文件**:
- `src/services/backup/BackupService.ts`
- `src/services/backup/__tests__/BackupService.test.ts`
- `src/components/dds/settings/BackupPanel.tsx`
- `src/hooks/settings/useBackup.ts`
- `src/hooks/settings/__tests__/useBackup.test.ts`

**扩展文件**:
- `src/components/dds/toolbar/DDSToolbar.tsx` — 添加备份按钮

---

## 4. expect() 断言（单元测试）

### E1 (HistoryTimeline)
```typescript
expect(screen.getByText(/版本历史/)).toBeInTheDocument();
expect(screen.getByText(/快照 1/)).toBeInTheDocument();
expect(screen.getByRole('button', { name: /对比/ })).toBeInTheDocument();
```

### E2 (ExportDialog)
```typescript
expect(screen.getByText(/批量导出/)).toBeInTheDocument();
expect(screen.getByRole('radio', { name: /PNG/ })).toBeInTheDocument();
expect(screen.getByRole('progressbar')).toBeInTheDocument();
```

### E3 (i18n)
```typescript
const { container } = render(<DDSToolbar />);
expect(container.querySelector('[aria-label="导出"]')).toBeInTheDocument();
```

### E4 (useAIAgentContext)
```typescript
const { canvasSummary } = useAIAgentContext();
expect(canvasSummary).toContain('nodes');
expect(canvasSummary).toContain('edges');
```

### E5 (BackupService)
```typescript
const blob = await BackupService.exportBackup('canvas-1');
expect(blob.type).toBe('application/vibex');
expect(await extractCanvasFromBlob(blob)).toHaveProperty('nodes');
```

---

## 5. 页面集成表

| Epic | 页面/路由 | 组件 | 入口 |
|------|---------|------|------|
| E1 | Canvas 内 | HistoryPanel (左侧抽屉) | DDSToolbar 历史图标 |
| E2 | Canvas 内 | ExportDialog (模态框) | ExportMenu 批量导出按钮 |
| E3 | 全局 | LanguageSwitcher | DDSToolbar 右侧 |
| E4 | Canvas 内 | StreamingAgentPanel (右侧面板) | DDSToolbar AI 图标 |
| E5 | Canvas 内 | BackupPanel (模态框) | DDSToolbar 备份图标 |

---

## 6. 技术风险与缓解

| 风险 | 缓解 |
|------|------|
| i18n 重构破坏现有功能 | 逐组件迁移，vitest 全量回归 |
| .vibex 格式版本不兼容 | 格式内嵌版本号 |
| 备份数据量大导致超时 | Web Worker 后台处理 + 进度反馈 |
