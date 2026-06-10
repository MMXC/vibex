# S70 QA PRD — Sprint70 产出物验收标准

**Sprint**: vibex-proposals-sprint70-qa
**日期**: 2026-06-07
**目标**: 验收 S70 交付的 5 个 Epic 产出物完整性、交互可用性、设计一致性

---

## 执行摘要

| Epic | 功能 | 验证方式 | 质量阈值 |
|------|------|---------|---------|
| E1 | 画布分支合并与冲突处理 | 代码审查 + Vitest | E1 测试 100% 通过 |
| E2 | 模板市场发现与浏览 | 代码审查 + Vitest | E2 测试 100% 通过 |
| E3 | 多格式批量画布导出 | 代码审查 | 原有 ExportMenu 测试通过 |
| E4 | 协作冲突检测与锁升级 | 代码审查 + Vitest | E4 测试 100% 通过 |
| E5 | 画布设置面板完善 | 代码审查 | DDSToolbar 绑定存在 |

---

## E1 验收标准

### E1.1 canvasHistoryStore mergeBranch
```
expect(mergeBranch).toBeDefined()
expect(typeof mergeBranch).toBe('function')
```
- `mergeBranch(canvasId, source, target)` 调用后，source 分支 snapshot 应移动到 target 分支
- `pendingConflicts` 数组应被正确初始化

### E1.2 BranchManager MergeBranchButton
- 组件在非主分支时渲染，主分支时不渲染
- 点击触发合并确认对话框

### E1.3 SnapshotCompareDialog merge 模式
- `mode="merge"` 时显示侧-by-side 对比视图
- 每个节点有"保留"/"忽略"切换

### E1.4 ConflictResolutionDialog 三按钮
- "保留我的"按钮正确应用本地版本
- "采用对方"按钮正确应用远程版本
- "合并内容"按钮正确合并并保存

### E1.5 合并成功后刷新
- `DDSCanvasPage` 监听合并完成事件
- 调用 `reloadFromSnapshot` 刷新画布状态

### E1.6 测试验收
```
npx vitest run canvasHistoryStore.e1-merge.test.ts --reporter=verbose
```
全部通过。

---

## E2 验收标准

### E2.1 templateStore 市场方法
```
featuredTemplates(limit?) → Template[]
searchMarketplace(query?, tags?) → Template[]
getMarketplaceTemplates() → Template[]
```

### E2.2 TemplateMarketplacePanel UI
- 搜索框可输入，支持实时过滤
- 标签云显示可用分类标签
- 热门模板网格显示（使用量降序）
- 每个模板卡片显示 usageCount 徽章
- 导入按钮触发模板导入流程

### E2.3 TemplateGallery discover Tab
- discover Tab 点击打开 `TemplateMarketplacePanel`
- 面板正确渲染在侧边区域

### E2.4 测试验收
```
npx vitest run templateStore.marketplace.test.ts --reporter=verbose
```
20/20 通过。

---

## E3 验收标准

### E3.1 ExportMenu 多格式入口
- ExportMenu 存在"多格式导出(ZIP)"选项
- 选项激活后弹出格式选择（PNG / SVG / PDF 三选框）

### E3.2 ZIP 打包
- 选择多种格式后，触发 ZIP 打包下载
- ZIP 文件包含每种选中格式的文件

### E3.3 进度条
- 导出过程中显示进度条
- 显示各格式导出状态

---

## E4 验收标准

### E4.1 presenceStore 冲突队列
```
pendingConflicts: ConflictRecord[]
addConflict(conflict: ConflictRecord): void
resolveConflict(id: string, resolution: 'local'|'remote'): void
hasConflict(nodeId: string): boolean
getUnresolvedCount(): number
```

### E4.2 5秒双写检测
- `useCollabEditing.ts` 中 `detectConflict()` 在 5 秒窗口内检测双写
- 检测到后调用 `presenceStore.addConflict()`

### E4.3 CollabConflictDialog
- 弹出时显示冲突节点双版本对比
- "保留我的" / "采用对方" 双按钮

### E4.4 DDSCanvasPage 自动弹出
- `useEffect` 监听 `pendingConflicts` 变化
- 变化时自动弹出 `CollabConflictDialog`

### E4.5 测试验收
```
npx vitest run presenceStore.conflict.test.ts --reporter=verbose
```
18/18 通过。

---

## E5 验收标准

### E5.1 CanvasSettingsDrawer 4 tabs
- Tab 1: 预设 (ViewPresetsPanel 复用)
- Tab 2: 画布 (BackgroundSettings + GridSettings)
- Tab 3: 节点 (ZoomSettings)
- Tab 4: 协作 (CollaborationSettings)

### E5.2 DDSToolbar 绑定
- 齿轮按钮 `aria-label="设置"` 或类似标识
- 点击触发 `CanvasSettingsDrawer` 打开

### E5.3 ESC 关闭
- 按 ESC 键关闭抽屉
- 抽屉关闭时触发 `onClose` 回调

---

## 页面集成表

| 页面/区域 | E1 涉及 | E2 涉及 | E3 涉及 | E4 涉及 | E5 涉及 |
|---------|--------|--------|--------|--------|--------|
| DDSCanvasPage | ✅ | | | ✅ | |
| BranchManager | ✅ | | | | |
| TemplateGallery | | ✅ | | | |
| ExportMenu | | | ✅ | | |
| DDSToolbar | | | | | ✅ |
| CanvasSettingsDrawer | | | | | ✅ |

---

## 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| 冲突检测误判（网络延迟）| 用户体验 | 5 秒窗口过滤 |
| ExportMenu 破坏原有功能 | 功能退化 | 全量 Vitest 回归 |
| 设置抽屉层级冲突 | UI 错乱 | z-index 检查 |
