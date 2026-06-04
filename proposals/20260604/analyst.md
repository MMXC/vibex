# VibeX Sprint62 提案分析 — 20260604

**基于**: S61 已完成功能（canvasHistoryStore / batch export dialog / i18n infrastructure / AI context / backup panel）

---

## P001: 画布版本分支管理（Version Branching）

**问题**: S61-E1 实现了 HistoryPanel 时间线 UI 和 canvasHistoryStore，但用户无法创建版本分支、命名快照、对比两个快照差异。

**根因**: Snapshot 概念存在但缺乏分支元数据（branch name, parent snapshot, tags）和对比工具。

**影响**: 用户无法组织历史快照，高级版本控制体验缺失。

**技术方案**:
- `canvasHistoryStore` 新增 `branchName`, `parentSnapshotId`, `tags[]` 字段
- HistoryPanel 新增分支创建按钮、快照重命名、快照对比入口
- `compareSnapshots(snapA, snapB)` 工具函数：高亮新增/删除/修改节点

**验收标准**:
- 用户可在 HistoryPanel 创建命名分支
- 可选择两个快照查看差异（高亮显示节点增删改）
- vitest 覆盖 branch create / snapshot rename / compareSnapshots

---

## P002: 批量导出进度可视化与错误处理

**问题**: S61-E2 ExportDialog 已实现批量导出，但无实时进度条、错误汇总、导出历史。

**根因**: `useBatchExport` 有 progress callback 但 ExportDialog 未渲染；zip 文件名无格式化。

**影响**: 大批量导出时用户无法感知进度；导出失败无提示。

**技术方案**:
- ExportDialog 新增 `<ExportProgress />` 组件：实时进度条 + 当前文件名 + 错误列表
- `ExportProgress.tsx` 复用 ZipExporter progress callback，显示百分比和已处理/总数
- 导出结束后 toast 通知，支持导出历史（最近 10 条存 localStorage）

**验收标准**:
- ExportDialog 显示实时进度条（0-100%）
- 失败文件在进度面板高亮显示
- 导出历史可在 ExportMenu 查看

---

## P003: 模板系统国际化（Template i18n）

**问题**: S61-E3 DDSSearchPanel 完成 i18n，但 TemplateGallery / TemplateCard 仍为硬编码中文。

**根因**: TemplateGallery 组件内含中文文本（"创建模板"、"分类"等），未接入 useTranslations。

**影响**: 模板系统非英文用户无法正常使用。

**技术方案**:
- `useTranslations('template')` 添加 template namespace（en/zh）
- TemplateGallery.tsx / TemplateCard.tsx 替换硬编码文本为 t('key')
- 模板预览弹窗（TemplatePreviewModal）也完成 i18n

**验收标准**:
- 模板创建、分类、搜索所有 UI 文本支持中英文切换
- i18n namespace `template` 完整覆盖
- vitest 覆盖 t() 调用路径

---

## P004: AI Draft 行内编辑与智能重试

**问题**: S61-E4 AIDraftDrawer 显示 AI 上下文，但无法直接在画布上编辑草稿、重试单次生成。

**根因**: AIDraftDrawer 为只读展示；agentStore 缺少单节点重试 API。

**影响**: 用户需要复制粘贴到画布才能编辑；AI 生成效果差时只能全量重试。

**技术方案**:
- AIDraftDrawer 新增"应用到画布"按钮（插入选中节点旁边）和"单节点重试"按钮
- `agentStore` 新增 `retryNode(nodeId)` action：仅重新生成指定节点
- AIDraftDrawer 支持点击单条 AI 输出展开/收起，支持删除单条

**验收标准**:
- 用户可在 AIDraftDrawer 点击"应用到画布"，节点插入 DDSCanvas
- 可对单个 AI 节点执行重试（不影响其他节点）
- vitest 覆盖 retryNode / applyToCanvas

---

## P005: 画布备份恢复与定时备份

**问题**: S61-E5 BackupPanel 已实现手动备份，但无云端恢复、定时自动备份、备份管理。

**根因**: BackupService 只有手动 `createBackup()`，缺少 `restoreBackup()`, `scheduleBackup()`, `listBackups()`。

**影响**: 用户无法恢复历史备份；无法设置自动备份策略。

**技术方案**:
- `BackupService` 新增 `listBackups()`, `restoreBackup(id)`, `deleteBackup(id)`
- `backupStore` 新增 `scheduledInterval: 'daily' | 'weekly' | null` 和 `autoBackupEnabled`
- BackupPanel 新增备份列表 Tab、定时备份设置开关、恢复确认对话框

**验收标准**:
- BackupPanel 展示备份历史列表（时间、节点数、大小）
- 可恢复任意历史备份到当前画布
- 支持 daily/weekly 定时备份设置
- vitest 覆盖 list/restore/delete 操作
