# VibeX Sprint67 需求分析

**Sprint**: vibex-proposals-sprint67  
**分析日期**: 2026-06-06  
**分析师**: analyst (phantom ghost — coord self-impl)  
**上游**: S66 完成后自动启动

---

## 执行摘要

S66 完成了画布分支操作、协作者冲突检测、视图预设、模板高级搜索、协作会话回放五大功能。S67 应聚焦于让现有功能更完整、更易用：分支操作后缺少快照对比，协作体验缺少实时活动流，模板系统缺少使用分析和 AI 推荐，导出能力缺少 PDF/SVG，以及画布快捷键体系的配置化。

---

## Proposal Summary Table

| ID | Feature | Priority | Root Cause | Impact |
|----|---------|----------|------------|--------|
| P001 | 画布分支快照视觉对比 | P0 | S66 分支 CRUD 完成但无法对比差异 | 用户无法判断分支间变化 |
| P002 | 实时协作活动流面板 | P0 | 协作者锁定已有但无在线状态/最近活动 | 用户不知道谁在线、谁在做什么 |
| P003 | 模板画廊使用分析 + AI 推荐 | P1 | 模板有标签/搜索但无使用数据/智能推荐 | 用户难以找到最适合自己的模板 |
| P004 | 画布快捷键可配置化 | P1 | DDSToolbar 有快捷键入口但 ShortcutSettingsPanel 缺少完整绑定管理 | 高级用户无法自定义快捷键 |
| P005 | 画布导出增强：PDF/SVG | P1 | 现有支持 PNG/ZIP，PDF/SVG 缺失 | 用户无法导出矢量格式或 PDF 文档 |

---

## P001: 画布分支快照视觉对比

**Problem**: S66-E1 完成了分支的创建/重命名/合并/删除，但用户无法直观看到两个分支之间的差异。当同一节点在两个分支有不同的内容时，用户需要手动切换分支对比，无法直接对比。

**Root Cause**: S66 分支操作只处理了 CRUD，没有实现快照间的 diff 可视化。

**Impact**: 分支操作不直观，用户不敢轻易合并分支，担心内容冲突。协作场景下多人分支管理风险高。

**Technical Approach**:
- 扩展 `canvasHistoryStore`：新增 `compareBranches(branchA, branchB)` action，返回节点差异列表
- 新增 `BranchDiffPanel.tsx`：侧边面板显示分支 A vs 分支 B 的节点差异（新增/修改/删除）
- 新增 `SnapshotDiffRenderer`：可视化节点级别差异（颜色高亮 + diff 摘要）
- 在 HistoryPanel 中新增"对比分支"按钮，点击后弹出分支选择器 + DiffPanel

**Acceptance Criteria**:
- [ ] 选择两个分支后，DiffPanel 显示新增节点（绿色）、修改节点（黄色）、删除节点（红色）
- [ ] 每个差异节点显示：节点 ID、节点名称、变更类型
- [ ] 支持切换"仅显示有差异的节点"过滤

---

## P002: 实时协作活动流面板

**Problem**: S66-E2 实现了节点锁定（防止冲突），S66-E5 实现了会话回放，但用户无法实时看到"谁在线、谁正在操作什么"。协作者之间缺乏实时活动透明度。

**Root Cause**: 协作者存在 `presenceStore` 中，但没有聚合为"活动流" UI。

**Impact**: 用户不知道同事在画布上的实时操作，协作效率低。多人同时在线时容易重复操作。

**Technical Approach**:
- 扩展 `presenceStore`：新增 `recentActivity[]` 数组（最近 20 条活动），`addActivity(event)` action
- 新增 `CollabActivityPanel.tsx`：侧边面板，实时显示协作者活动（节点聚焦/拖拽/编辑/锁定）
- WebSocket 消息扩展：新增 `user:activity` 消息类型，批量广播活动
- DDSFlow 集成：在节点操作时发布 activity 事件
- 活动类型图标 + 时间戳 + 用户头像

**Acceptance Criteria**:
- [ ] 面板显示当前在线用户列表（presenceStore remoteUsers）
- [ ] 每个用户的最近活动实时滚动（最多 20 条）
- [ ] 活动类型：join/leave/focus/edit/lock/unlock 均有对应图标
- [ ] 面板可折叠/展开

---

## P003: 模板画廊使用分析 + AI 推荐

**Problem**: S66-E4 实现了模板高级搜索（标签/日期/URL），S65-E5 实现了自定义分类和频率统计，但模板系统缺少使用分析和智能推荐功能。用户不知道哪些模板最受欢迎，AI 无法推荐最合适的模板。

**Root Cause**: `templateStore.stats.usageCount` 已有数据但从未被用于排序或推荐。

**Impact**: 模板使用数据沉睡，用户难以发现高质量模板，平台无法做数据驱动的模板优化。

**Technical Approach**:
- 扩展 `templateStore`：新增 `topTemplates(n)` / `getUsageStats()` / `getCategoryStats()` selectors
- 新增 `TemplateAnalytics.tsx`：使用分析面板（柱状图：按分类使用量 / 折线图：使用趋势 / 排行榜：Top 10 模板）
- 新增 AI 推荐逻辑：基于 `usageCount` + `tags` + `recentSearches` 推荐模板（简单加权评分，非 LLM）
- TemplateGallery 新增"为你推荐" Tab：显示 AI 推荐模板列表
- 数据来源：`stats.usageCount`（已有）、搜索历史（localStorage）

**Acceptance Criteria**:
- [ ] 模板画廊有"分析" Tab，显示使用量排行榜
- [ ] "为你推荐" Tab 基于使用数据 + 标签匹配推荐模板
- [ ] 每个模板卡片显示使用次数
- [ ] 分析数据在 localStorage 持久化（已有 stats 扩展）

---

## P004: 画布快捷键可配置化

**Problem**: S52-E5 的 ShortcutSettingsPanel 提供了快捷键查看能力，S66-E3 的 ViewPresetsTab 提供了视图预设面板，但快捷键系统缺少完整的自定义绑定管理——用户无法添加/删除/修改快捷键映射，无法导入/导出快捷键配置。

**Root Cause**: `shortcutStore` 有基础状态但缺少 CRUD 绑定管理，Settings panel 不完整。

**Impact**: 高级用户无法自定义快捷键，多设备用户无法同步配置。

**Technical Approach**:
- 扩展 `shortcutStore`：新增 `addBinding(id, key, action)` / `removeBinding(id)` / `updateBinding(id, newKey)` / `importBindings(json)` / `exportBindings()` actions
- 新增 `ShortcutEditor.tsx`：快捷键行编辑器（key recorder 组件，监听按键输入）
- 扩展 `ShortcutSettingsPanel.tsx`：新增"自定义绑定"区块，支持添加/编辑/删除快捷键行
- 新增导入/导出按钮：JSON 格式的快捷键配置
- localStorage 持久化 `customBindings`

**Acceptance Criteria**:
- [ ] 用户可以添加新快捷键绑定（key recorder 捕获按键）
- [ ] 用户可以修改已有快捷键
- [ ] 用户可以删除自定义绑定（恢复默认）
- [ ] 支持导出/导入 JSON 配置

---

## P005: 画布导出增强：PDF/SVG

**Problem**: 当前画布导出支持 PNG（截图）和 ZIP（多节点 PNG），但缺少 PDF 文档导出（汇报场景）和 SVG 矢量导出（设计交付场景）。

**Root Cause**: `ZipExporter.ts` 有 PNG/ZIP 实现，但 PDF/SVG 导出能力未实现。

**Impact**: 用户无法导出适合打印或文档的格式，汇报场景需要手动截图拼接。

**Technical Approach**:
- 新增 `PdfExporter.ts`：使用 `jspdf` + `html2canvas` 或原生 PDF 生成，将画布内容导出为 PDF
- 新增 `SvgExporter.ts`：遍历画布节点，生成 SVG 字符串（保留矢量图形）
- 扩展 `ExportMenu.tsx`：新增 PDF 和 SVG 导出选项
- 扩展 `ExportProgress.tsx`：支持 PDF/SVG 导出进度显示
- `package.json` 添加 `jspdf` 依赖（如尚未安装）
- PDF 选项：单页/多页、纸张大小、边距；SVG 选项：保留样式/简化样式

**Acceptance Criteria**:
- [ ] ExportMenu 有"导出为 PDF"选项
- [ ] ExportMenu 有"导出为 SVG"选项
- [ ] PDF 导出保留画布内容，适配 A4/Letter 纸张
- [ ] SVG 导出保留节点矢量信息（可缩放）
- [ ] 导出过程有进度显示（复用已有 ExportProgress 组件）

---

## 技术风险

| Risk | Severity | Mitigation |
|------|----------|------------|
| P001 分支 diff 需要遍历两个分支所有快照 | Medium | 只比较最新快照，后续迭代支持历史快照 |
| P002 活动流 WebSocket 消息量大 | Medium | 节流广播（每用户最多 1 msg/sec）|
| P003 AI 推荐计算量大 | Low | 简单加权评分，非 LLM，客户端计算 |
| P004 快捷键冲突检测 | Medium | 冲突时显示警告，覆盖已有绑定需确认 |
| P005 PDF 生成性能 | Medium | 大画布分页渲染，支持取消 |

---

## 跨 Epic 集成点

- P001 DiffPanel → HistoryPanel（已有 S66-E1 分支操作）
- P002 CollabActivityPanel → presenceStore（S66-E2）+ DDSFlow（S66-E5）
- P003 TemplateAnalytics → templateStore（S65-E5 + S66-E4）
- P004 ShortcutEditor → ShortcutSettingsPanel（S52-E5）+ shortcutStore
- P005 PdfExporter/SvgExporter → ExportMenu（S54-E4）+ ExportProgress（S54-E4）

---

## 附录：S66 已完成 Epic

| Epic | 状态 | 关键文件 |
|------|------|----------|
| E1: 画布分支操作 | ✅ 已完成 | historyDB.ts, canvasHistoryStore.ts |
| E2: 协作者冲突检测 | ✅ 已完成 | presenceStore.ts, NodeLockedToast.tsx |
| E3: 画布视图预设 | ✅ 已完成 | viewPresetsStore.ts, ViewPresetsTab.tsx |
| E4: 模板高级搜索 | ✅ 已完成 | TagSelector.tsx, DateRangePicker.tsx, TemplateGallery.tsx |
| E5: 协作会话历史回放 | ✅ 已完成 | collabSessionStore.ts, SessionReplayPanel.tsx |
