# VibeX Sprint61 需求分析

**项目**: vibex-proposals-sprint61  
**分析时间**: 2026-06-04  
**分析方法**: CHANGELOG 缺口分析 + Git 提交历史审查

---

## S60 已完成功能回顾

| Epic | 功能 | 关键产出 |
|------|------|---------|
| S60-E1 | 画布版本历史 UI 增强 | `canvasHistoryStore.ts` 持久化、快照星标/分支名、compare mode |
| S60-E2 | 批量操作增强 | `batchOpsStore.ts`、BatchOpsToolbar（选中节点工具栏） |
| S60-E3 | 协作活动流 + 在线状态 | `activityStore.ts` ring buffer、ActivityFeed 面板、RemoteCursor 脉冲 |
| S60-E4 | 画布导出增强 | ExportMenu PDF radio、ZipExporter vitest 15/15 |
| S60-E5 | 搜索体验增强 | `canvasSearchStore.ts` 历史持久化、DDSSearchPanel 历史Tab |

---

## 缺口识别（P001-P005）

### P001: 画布版本历史时间线视图 + 快照对比（E1）

**问题描述**  
S60-E1 完成了 `canvasHistoryStore.ts` 持久化和基础 UI（星标、分支名），但用户无法浏览版本历史记录、选择任意快照查看内容，也无法对比两个快照的差异。当前 store 实现了 `listSnapshots()` 但没有配套的时间线 UI。

**根因**  
Phase2 E1 的 DoD 聚焦于 store 持久化和 compare mode 功能，版本历史时间线作为"UI 增强"未被列入。

**影响**  
版本历史功能对用户不可见。用户不知道何时做了快照、快照内容是什么、也无法恢复到具体时间点。

**技术方案**  
1. `HistoryTimeline.tsx` — 时间线面板（左侧抽屉），展示所有快照列表（时间倒序、星标置顶、分支标签）
2. `SnapshotPreview.tsx` — 快照预览：点击时间线条目，右侧展示该快照的节点预览（只读 Canvas）
3. `SnapshotDiff.tsx` — 快照对比：选中两个快照，以 diff 视图展示节点增删改（绿色新增/红色删除/黄色修改）
4. `HistoryPanel.tsx` — 整合时间线 + 预览 + 对比为一站式面板

**验收标准**
- [ ] 时间线面板展示所有快照（时间戳、分支名、节点数）
- [ ] 点击快照显示节点预览（只读，节点可缩放查看）
- [ ] 支持选择两个快照进行 diff 对比
- [ ] 星标快照在时间线中置顶显示
- [ ] vitest 覆盖率 ≥ 90%

---

### P002: 批量操作 UI 完善 + 画布级批量导出（E2）

**问题描述**  
S60-E2 实现了 `batchOpsStore.ts` 和 BatchOpsToolbar（选中节点工具栏），但批量导出入口不完整：PDF 批量导出未实现（ExportMenu 有 radio 但无后端支持），且无法对整个画布（非选中节点）批量导出。`ZipExporter.test.ts` 有 vitest 但 `ZipExporter.exportZip()` 未被任何 UI 调用。

**根因**  
E2 的 DoD 聚焦于批量删除/重命名，批量导出 PDF 作为 E4 的一部分被分离，但 E4 的 ExportMenu PDF radio 与 ZipExporter 未联通。

**影响**  
用户无法批量导出画布内容为 PDF/ZIP，导致导出能力不完整。

**技术方案**  
1. `useBatchExport.ts` — 扩展现有 `useBatchExport` hook，联通 ZipExporter，支持 PNG/SVG/PDF 三种格式
2. `ExportDialog.tsx` — 批量导出对话框：选择格式（PNG/SVG/PDF）、节点范围（全画布/选中）、ZIP 压缩选项
3. `ExportProgress.tsx` — 导出进度面板（实时进度条、文件名、取消按钮）
4. ExportMenu.tsx — 集成 ExportDialog 作为"批量导出"入口

**验收标准**
- [ ] 全画布批量导出（PNG/SVG/PDF + ZIP）功能可用
- [ ] 导出进度实时反馈（百分比 + 文件名）
- [ ] ExportDialog 支持格式选择 + 节点范围选择
- [ ] vitest: `ZipExporter.test.ts` + `useBatchExport.test.ts` ≥ 90%

---

### P003: 国际化完善 + 多语言支持（E3）

**问题描述**  
VibeX 存在大量硬编码中文字符串（如 `aria-label="键盘快捷键设置"`、`aria-label="批量操作"`），没有 i18n 框架。用户无法切换语言，海外用户完全无法使用。

**根因**  
早期 Sprint 的 UI 快速迭代中，中文硬编码先上线。i18n 框架和翻译资源从未系统建设。

**影响**  
- 产品无法出海，限制市场覆盖
- 所有 UI 文本无法动态切换

**技术方案**  
1. 引入 `i18next` + `react-i18next` i18n 框架
2. 建立 `locales/en.json` + `locales/zh.json` 翻译资源
3. 重构关键组件使用 `t('key')` 而非硬编码字符串：DDSToolbar、BatchOpsToolbar、ExportMenu、DDSSearchPanel、ActivityFeed、HistoryPanel
4. `LanguageSwitcher.tsx` — 工具栏语言切换按钮
5. `useLanguage()` hook — 持久化语言偏好到 localStorage

**验收标准**
- [ ] i18next 框架集成 + 运行时语言切换
- [ ] 核心 UI 组件（中英双语）：DDSToolbar、BatchOpsToolbar、ExportMenu、SearchPanel
- [ ] 语言偏好 localStorage 持久化
- [ ] vitest 覆盖 i18n hook

---

### P004: AI Session 画布上下文集成 + 可配置重试（E4）

**问题描述**  
S45-E1 实现了 AI 断线重连（`useStreamingAgent.ts` 的 `maxRetries` + `retryCount` 状态），但用户无法：
1. 将当前画布节点/连接状态作为上下文发送给 AI session
2. 在 UI 上配置重试次数、查看重连状态
3. 看到 AI 正在使用哪部分画布上下文

**根因**  
AI Session UI 与 Canvas 状态隔离，agentStore 存储 session 元数据但不持有 canvas 上下文引用。

**影响**  
AI Agent 无法利用画布当前状态提供更精准的辅助，用户不知道 AI 在处理什么内容。

**技术方案**  
1. `useAIAgentContext.ts` — hook，将当前画布状态（节点、边、selection）序列化为上下文文本
2. `agentStore` 扩展：添加 `canvasContext` 字段、`setCanvasContext()` action
3. `StreamingAgentPanel.tsx` 扩展 — 新增"画布上下文"区块（显示节点摘要）、重试配置下拉（3次/5次/无限）
4. AI 自动注入：在创建新 session 时自动附加画布上下文（可关闭）
5. vitest 覆盖：`useAIAgentContext.test.ts`

**验收标准**
- [ ] 新建 AI Session 时自动携带画布上下文（节点数 + 边数 + selection 摘要）
- [ ] StreamingAgentPanel 显示画布上下文区块
- [ ] 重试次数 UI 可配置（3/5/无限）
- [ ] 断线重连时 UI 显示重试状态（retrying spinner）
- [ ] vitest: `useAIAgentContext.test.ts` ≥ 90%

---

### P005: 画布数据备份与导出（E5）

**问题描述**  
VibeX 缺乏系统化的数据备份能力：用户无法将画布（含元数据、历史版本）导出为完整备份包，也无法从备份恢复。D1 数据库表（PublicSnapshot 等）存在但未暴露用户可见的备份入口。

**根因**  
S45-E5 的"画布快照分享"聚焦于公开只读链接，而非用户可控的私人备份。备份/恢复作为独立功能从未实现。

**影响**  
- 用户无法备份画布状态（版本历史存在但无法导出）
- 数据丢失风险：无云同步时用户无本地备份
- 产品完整性缺口

**技术方案**  
1. `BackupService.ts` — 服务层：
   - `exportBackup(canvasId)` — 序列化画布 JSON + 版本历史 + templates + settings → `.vibex` 文件
   - `importBackup(file: File)` — 解析 `.vibex` 文件，恢复画布状态
   - `listBackups()` — 列出 localStorage 中的备份记录
2. `BackupPanel.tsx` — 备份管理面板：导出备份、导入备份、备份列表（时间、大小）
3. `useBackup.ts` — hook，封装 BackupService，提供 backup/restore/trim 能力
4. `DDSToolbar` 新增备份按钮
5. `.vibex` 文件格式：JSON 包装（canvasJSON + versionHistory + templates + metadata + signature）

**验收标准**
- [ ] 一键导出画布完整备份（.vibex 文件，包含所有版本历史）
- [ ] 从 .vibex 文件恢复画布（覆盖或新建）
- [ ] 备份列表展示历史备份（时间、大小、可删除）
- [ ] 备份文件可下载到本地（浏览器下载）
- [ ] vitest: `BackupService.test.ts` + `useBackup.test.ts` ≥ 90%

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 说明 |
|--------|---------|------|
| HistoryPanel ↔ ActivityFeed | P001 × P002 | 两个侧边栏面板需协调布局（tab 切换或堆叠） |
| BatchExport ↔ ExportMenu | P002 | ExportDialog 作为 ExportMenu 的扩展入口 |
| i18n ↔ 所有 UI 组件 | P003 | 所有 P001-P005 产出必须支持中英双语 |
| AI Context ↔ HistoryTimeline | P004 × P001 | AI Session 可引用历史快照作为上下文 |

---

## 技术风险

1. **i18n 重构风险**：大量组件需要 refactor 使用 `t()` 函数，可能破坏现有功能。缓解：逐组件迁移，vitest 全量回归。
2. **.vibex 文件格式**：需设计稳定的版本化格式，防止未来格式变更导致旧备份无法恢复。缓解：格式版本号内嵌。
3. **BackupService IndexedDB**：历史快照数据量大，备份导出可能超时。缓解：Web Worker 后台处理 + 进度反馈。
