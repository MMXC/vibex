# VibeX Sprint61 Implementation Partition

**项目**: vibex-proposals-sprint61
**版本**: 1.0
**日期**: 2026-06-04

---

## E1: 画布版本历史时间线视图 + 快照对比

**DoD checklist**:
- [ ] D1.1: `HistoryTimeline.tsx` 时间线面板展示所有快照（时间戳、分支名、节点数）
- [ ] D1.2: `SnapshotPreview.tsx` 点击快照显示节点预览（只读，节点可缩放查看）
- [ ] D1.3: `SnapshotDiff.tsx` 支持选择两个快照进行 diff 对比（绿色新增/红色删除/黄色修改）
- [ ] D1.4: `HistoryPanel.tsx` 整合时间线 + 预览 + 对比为一站式 Drawer 面板
- [ ] D1.5: DDSToolbar 历史图标触发 HistoryPanel
- [ ] D1.6: `vitest HistoryTimeline.test.tsx` 覆盖率 ≥ 90%
- [ ] D1.7: `canvasHistoryStore.ts` 扩展 `listSnapshots({ branch?, starred? })` 排序/过滤 action

**expect() 断言**:
```typescript
expect(screen.getByText(/版本历史/)).toBeInTheDocument();
expect(screen.getByText(/快照 1/)).toBeInTheDocument();
expect(screen.getByRole('button', { name: /对比/ })).toBeInTheDocument();
```

**新增文件**:
- `vibex-fronted/src/components/dds/canvas-history/HistoryTimeline.tsx`
- `vibex-fronted/src/components/dds/canvas-history/SnapshotPreview.tsx`
- `vibex-fronted/src/components/dds/canvas-history/SnapshotDiff.tsx`
- `vibex-fronted/src/components/dds/canvas-history/HistoryPanel.tsx`
- `vibex-fronted/src/components/dds/canvas-history/__tests__/HistoryTimeline.test.tsx`

**扩展文件**:
- `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` — `listSnapshots({ branch?, starred? })` action
- `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` — 历史图标按钮

**预发现**: `canvasHistoryStore.ts` ✅ 已存在 (S60-E1)，提供 `listSnapshots()`、`compareSnapshots()`、`getSnapshotPreview()`

---

## E2: 批量操作 UI 完善 + 画布级批量导出

**DoD checklist**:
- [ ] D2.1: `useBatchExport.ts` 联通 ZipExporter，支持 PNG/SVG/PDF 三种格式
- [ ] D2.2: `ExportDialog.tsx` 批量导出对话框：格式选择 + 节点范围（全画布/选中）+ ZIP 压缩选项
- [ ] D2.3: `ExportProgress.tsx` 导出进度面板（百分比进度条、文件名、取消按钮）
- [ ] D2.4: ExportMenu.tsx 添加批量导出入口
- [ ] D2.5: `vitest useBatchExport.test.ts` ≥ 90%
- [ ] D2.6: ZipExporter.exportZip 扩展支持 PDF 格式

**expect() 断言**:
```typescript
expect(screen.getByText(/批量导出/)).toBeInTheDocument();
expect(screen.getByRole('radio', { name: /PNG/ })).toBeInTheDocument();
expect(screen.getByRole('progressbar')).toBeInTheDocument();
```

**新增文件**:
- `vibex-fronted/src/components/dds/export/ExportDialog.tsx`
- `vibex-fronted/src/components/dds/export/ExportProgress.tsx`
- `vibex-fronted/src/hooks/canvas/useBatchExport.ts`
- `vibex-fronted/src/hooks/canvas/__tests__/useBatchExport.test.ts`

**扩展文件**:
- `vibex-fronted/src/components/dds/export/ExportMenu.tsx` — 添加批量导出菜单项
- `vibex-fronted/src/services/export/ZipExporter.ts` — 扩展 `exportZip(format, nodeIds?, onProgress?)`

**预发现**: `ZipExporter.ts` ✅ 已存在 (S60-E4)，15/15 vitest；`batchOpsStore.ts` ✅ 已存在 (S60-E2)；`ExportMenu.tsx` ✅ 已存在

---

## E3: 国际化完善 + 多语言支持

**DoD checklist**:
- [x] D3.1: `src/i18n/index.ts` i18next 实例初始化（⚠️ 项目使用 next-intl v4，request.ts + I18nProvider 提供 i18n 基础设施，无需独立 index.ts）
- [x] D3.2: `src/i18n/locales/en.json` + `zh.json` 翻译资源文件（✅ `src/i18n/messages/` 中已存在）
- [x] D3.3: `src/hooks/settings/useLanguage.ts` 语言偏好 hook（✅ 2026-06-04 自实现）
- [x] D3.4: `src/components/dds/toolbar/LanguageSwitcher.tsx` 工具栏语言切换下拉按钮（✅ 2026-06-04 自实现）
- [x] D3.5: DDSToolbar.tsx 重构为 `t('toolbar.*')` 调用（✅ DDSToolbar 使用 tToolbar()）
- [x] D3.6: BatchOpsToolbar.tsx i18n 重构（✅ 2026-06-04 自实现：添加 batchOps namespace + useTranslations）
- [x] D3.7: ExportMenu.tsx i18n 重构（✅ `toolbar/ExportMenu.tsx` 已有 18 个 t() 调用）
- [x] D3.8: DDSSearchPanel.tsx i18n 重构（✅ `src/components/dds/DDSSearchPanel.tsx` 使用 tSearch()）
- [x] D3.9: package.json 添加 i18next, react-i18next 依赖（⚠️ 项目使用 next-intl v4，已安装 `next-intl ^4.8.3`）
- [x] D3.10: vitest 覆盖 `useLanguage.ts`（✅ 4/4 tests passed 2026-06-04）

**expect() 断言**:
```typescript
const { container } = render(<DDSToolbar />);
expect(container.querySelector('[aria-label="导出"]')).toBeInTheDocument();
// i18n 切换后英文版本
i18n.changeLanguage('en');
expect(screen.getByText('Export')).toBeInTheDocument();
```

**新增文件**:
- `vibex-fronted/src/i18n/index.ts`
- `vibex-fronted/src/i18n/locales/en.json`
- `vibex-fronted/src/i18n/locales/zh.json`
- `vibex-fronted/src/hooks/settings/useLanguage.ts`
- `vibex-fronted/src/hooks/settings/__tests__/useLanguage.test.ts`
- `vibex-fronted/src/components/dds/toolbar/LanguageSwitcher.tsx`

**扩展文件**:
- `vibex-fronted/package.json` — i18next, react-i18next
- `vibex-fronted/src/components/dds/DDSToolbar.tsx`
- `vibex-fronted/src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx`
- `vibex-fronted/src/components/dds/export/ExportMenu.tsx`
- `vibex-fronted/src/components/dds/DDSSearchPanel.tsx`
- `vibex-fronted/src/components/dds/ai-draft/AIDraftDrawer.tsx` (如含硬编码中文)

**预发现**: DDSToolbar ✅、BatchOpsToolbar ✅、ExportMenu ✅、DDSSearchPanel ✅ 均已存在但含硬编码中文

---

## E4: AI Session 画布上下文集成 + 可配置重试

**DoD checklist**:
- [ ] D4.1: `agentStore.ts` 新建，持有 `sessions[]`、`canvasContext`、`retryConfig` 字段
- [ ] D4.2: `useAIAgentContext.ts` hook，序列化画布状态为摘要字符串
- [ ] D4.3: 新建 AI Session 时自动调用 `useAIAgentContext` 附加画布上下文
- [ ] D4.4: StreamingAgentPanel 扩展 — 画布上下文区块 + 重试配置下拉（3/5/无限）
- [ ] D4.5: 断线重连时 UI 显示重试 spinner
- [ ] D4.6: `vitest useAIAgentContext.test.ts` ≥ 90%

**expect() 断言**:
```typescript
const { canvasSummary } = useAIAgentContext();
expect(canvasSummary).toContain('nodes');
expect(canvasSummary).toContain('edges');
expect(canvasSummary).toMatch(/\d+ node/);
```

**新增文件**:
- `vibex-fronted/src/stores/dds/agentStore.ts`
- `vibex-fronted/src/hooks/ai/useAIAgentContext.ts`
- `vibex-fronted/src/hooks/ai/__tests__/useAIAgentContext.test.ts`

**扩展文件**:
- `vibex-fronted/src/components/dds/ai-draft/AIDraftDrawer.tsx` — 画布上下文区块 + 重试配置

**预发现**: `AIDraftDrawer.tsx` ✅ 已存在（AI panel UI 基础）；agentStore ❌ 不存在需新建

---

## E5: 画布数据备份与导出

**DoD checklist**:
- [ ] D5.1: `BackupService.ts` — `exportBackup(canvasId)` → `.vibex` Blob
- [ ] D5.2: `BackupService.ts` — `importBackup(file: File)` → CanvasState
- [ ] D5.3: `BackupService.ts` — `listBackups()` 返回 localStorage 中的备份记录
- [ ] D5.4: `BackupService.ts` — `deleteBackup(id)` 删除单条备份
- [ ] D5.5: `BackupPanel.tsx` — 导出/导入/列表/删除 UI
- [ ] D5.6: `useBackup.ts` hook，封装 BackupService
- [ ] D5.7: DDSToolbar 添加备份按钮
- [ ] D5.8: `vitest BackupService.test.ts` ≥ 90%
- [ ] D5.9: `vitest useBackup.test.ts` ≥ 90%

**expect() 断言**:
```typescript
const blob = await BackupService.exportBackup('canvas-1');
expect(blob.type).toBe('application/vibex');
expect(await extractCanvasFromBlob(blob)).toHaveProperty('nodes');
```

**新增文件**:
- `vibex-fronted/src/services/backup/BackupService.ts`
- `vibex-fronted/src/services/backup/__tests__/BackupService.test.ts`
- `vibex-fronted/src/components/dds/settings/BackupPanel.tsx`
- `vibex-fronted/src/hooks/settings/useBackup.ts`
- `vibex-fronted/src/hooks/settings/__tests__/useBackup.test.ts`

**扩展文件**:
- `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` — 备份按钮

**预发现**: `canvasHistoryStore.ts` ✅ 已存在 (S60-E1) 提供版本历史数据；DDSToolbar ✅ 已存在

---

## 实现顺序建议

```
Phase 2 建议实现顺序:
  E3 (i18n) 最早 → 因为 E1/E2/E4/E5 的 UI 组件都需要 i18n
  E1 (HistoryTimeline) 次之 → E1 的 HistoryPanel 是独立 Drawer
  E2 (BatchExport) 第三 → 依赖 ZipExporter (已存在)
  E4 (AI Context) 第四 → 独立功能
  E5 (Backup) 最后 → 依赖 canvasHistoryStore 和 DDSToolbar
```

---

## 跨 Epic 集成表

| Epic | 主入口组件 | 依赖 Epic | 需 i18n |
|------|-----------|-----------|---------|
| E1 | DDSToolbar 历史图标 | — | ✅ |
| E2 | ExportMenu | — | ✅ |
| E3 | DDSToolbar | — | — |
| E4 | DDSToolbar AI 图标 | E3 (LanguageSwitcher) | ✅ |
| E5 | DDSToolbar 备份图标 | E1 (canvasHistoryStore) | ✅ |
