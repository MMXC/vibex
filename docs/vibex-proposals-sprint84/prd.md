# VibeX Sprint 84 — PRD

> **Date**: 2026-06-10
> **Sprint**: 84
> **Project**: vibex-proposals-sprint84

---

## F01: 画布版本 Diff 对比

### Feature ID
S84-F01

### Title
画布版本 Diff 对比

### 概述
在 S83-E1 时间轴基础上，新增版本间内容差异可视化，支持分支内任意两版本对比。

### 用户故事
- 作为用户，我希望对比两个版本之间的内容差异，以便了解版本间的变化
- 作为协作者，我希望在合并前预览差异，以便决定是否合并

### 验收标准
- [ ] 时间轴节点右键菜单或详情面板提供「与当前版本对比」选项
- [ ] Diff 面板展示：新增节点（绿色高亮）、删除节点（红色高亮）、修改节点（黄色高亮）
- [ ] Diff 支持「单向对比」和「双向对比」两种模式
- [ ] Diff 面板可折叠/展开，不影响主画布操作
- [ ] 支持对比超过 2 个版本（多选对比）
- [ ] Diff 结果可通过 API `/api/canvas/:id/diff?from=v1&to=v2` 获取

### 页面集成
- `VersionTimeline.tsx` — 增加对比入口
- `DDSCanvasPage.tsx` — 新增 DiffPanel 组件（右侧面板）
- `canvasTimelineStore.ts` — 新增 diff 状态管理

### DoD
- [ ] DiffPanel 组件实现，支持新增/删除/修改三种 diff 类型
- [ ] `/api/canvas/:id/diff` 后端 API 实现并返回 JSON diff
- [ ] vitest 测试覆盖 DiffPanel（mock store）
- [ ] E2E 测试：选择两个版本并查看 diff

---

## F02: 协作者在线状态与光标显示

### Feature ID
S84-F02

### Title
协作者在线状态与光标显示

### 概述
在 WebSocket 实时协作基础上，增加协作者头像栏、实时光标位置显示、编辑锁机制。

### 用户故事
- 作为协作者，我希望看到谁正在编辑同一画布，以便协调工作
- 作为画布所有者，我希望看到实时的协作者位置，以便了解进展

### 验收标准
- [ ] 画布工具栏右侧显示所有在线协作者头像（最多 8 个，溢出显示 +N）
- [ ] 协作者光标在画布上实时显示，带昵称标签
- [ ] 光标颜色按用户唯一分配（颜色池 8 色循环）
- [ ] 节点被编辑时显示锁定图标，其他协作者只能查看
- [ ] 协作者离开/断线时头像淡出消失（300ms 动画）
- [ ] WS 消息格式增加 `presence` 事件类型

### 页面集成
- `DDSToolbar.tsx` — 协作者头像栏
- `DDSCanvasPage.tsx` — 光标层组件 CollaboratorCursors
- `canvasStore.ts` — presence 状态管理

### DoD
- [ ] CollaboratorAvatars 组件实现（头像 + 状态指示点）
- [ ] CollaboratorCursors 组件实现（SVG 光标 + 标签）
- [ ] canvasStore 新增 presence slice
- [ ] WebSocket presence 事件订阅/发布逻辑
- [ ] WS 重连后自动恢复 presence 状态
- [ ] vitest 测试覆盖（mock WS，mock store）

---

## F03: 画布快速跳转面板（Command Palette）

### Feature ID
S84-F03

### Title
画布快速跳转面板

### 概述
类似 VS Code Ctrl+P 的快速切换面板，支持快速跳转到任意画布、版本分支节点。

### 用户故事
- 作为用户，我希望通过快捷键快速跳转到任意画布或版本节点，以便提高操作效率

### 验收标准
- [ ] 全局快捷键 `Ctrl+K` / `Cmd+K` 打开跳转面板
- [ ] 面板支持搜索：画布名称、最近访问画布、版本节点标签
- [ ] 搜索结果按相关性排序，支持键盘上下键导航
- [ ] 按 Enter 跳转到目标，支持 Ctrl+Enter 在新标签页打开
- [ ] 最近访问画布保留最近 10 条记录
- [ ] 搜索索引支持模糊匹配（fuzzy search）

### 页面集成
- `DDSCanvasPage.tsx` — 全局挂载 CommandPalette
- `AppShell.tsx` — 全局快捷键注册
- `commandPaletteStore.ts` — 搜索状态和历史记录

### DoD
- [ ] CommandPalette 组件实现（弹窗 + 搜索框 + 结果列表）
- [ ] commandPaletteStore 实现（recentCanvas 持久化到 localStorage）
- [ ] fuzzy search 集成（使用 Fuse.js）
- [ ] 键盘导航（↑↓ Enter Esc）完整实现
- [ ] vitest 测试覆盖
- [ ] 全局快捷键在 AppShell 中注册

---

## F04: 模板搜索增强与收藏

### Feature ID
S84-F04

### Title
模板搜索增强与收藏

### 概述
在 S83-E4 标签系统基础上，增强模板搜索（全文+模糊匹配），增加用户收藏功能。

### 用户故事
- 作为用户，我希望通过名称或标签搜索模板，以便快速找到所需模板
- 作为用户，我希望收藏常用模板，以便下次快速访问

### 验收标准
- [ ] 模板 Gallery 搜索框支持：名称搜索、标签搜索、组合搜索（名称+标签）
- [ ] 搜索支持模糊匹配（typo 容错）
- [ ] 模板卡片显示「收藏」按钮（星形图标）
- [ ] 收藏的模板在「我的收藏」Tab 中展示
- [ ] 收藏数据存储在 `user_template_favorites` 表
- [ ] 搜索结果按相关度 + 收藏数综合排序

### 页面集成
- `TemplateGallery.tsx` — 搜索栏增强 + 收藏 Tab
- `TagSelector.tsx` — 组合搜索支持
- `TemplateService.ts` — 搜索 API
- `templateStore.ts` — 收藏状态

### DoD
- [ ] 增强的搜索栏组件（支持名称+标签组合）
- [ ] Fuse.js 模糊搜索集成
- [ ] 收藏 API：`/api/templates/:id/favorite` POST/DELETE
- [ ] TemplateGallery 新增「我的收藏」Tab
- [ ] templateStore 增加 favorites slice
- [ ] vitest 测试覆盖
- [ ] CHANGELOG.md 更新

---

## F05: 全局键盘快捷键体系

### Feature ID
S84-F05

### Title
全局键盘快捷键体系

### 概述
建立标准化的全局键盘快捷键系统，支持常见操作的键盘触发和自定义配置。

### 用户故事
- 作为高级用户，我希望通过键盘快捷键完成常见操作，以便提高效率

### 验收标准
- [ ] 覆盖以下快捷键：保存（Ctrl+S）、撤销（Ctrl+Z）、重做（Ctrl+Y）、快速跳转（Ctrl+K）、全屏（F11）、切换侧边栏（Ctrl+B）
- [ ] 快捷键配置面板（设置页面）：显示所有快捷键，支持修改
- [ ] 快捷键冲突检测：修改时提示冲突
- [ ] 快捷键配置持久化到 localStorage
- [ ] 快捷键帮助弹窗（Ctrl+/）：显示所有可用快捷键

### 页面集成
- `AppShell.tsx` — 全局快捷键注册
- `KeyboardShortcutsPanel.tsx` — 快捷键配置页面/弹窗
- `keyboardStore.ts` — 快捷键状态管理
- `DDSToolbar.tsx` — 保存按钮响应 Ctrl+S

### DoD
- [ ] keyboardStore 实现（shortcuts 配置 + localStorage 持久化）
- [ ] useKeyboardShortcut hook 实现（支持组合键）
- [ ] ShortcutHelpDialog 组件（Ctrl+/ 触发）
- [ ] ShortcutSettingsPanel 组件（可配置快捷键）
- [ ] 快捷键冲突检测逻辑
- [ ] vitest 测试覆盖
- [ ] CHANGELOG.md 更新

---

## 总览表

| Feature ID | 标题 | 优先级 | 复杂度 |
|------------|------|--------|--------|
| S84-F01 | 画布版本 Diff 对比 | P1 | 3 |
| S84-F02 | 协作者在线状态与光标显示 | P1 | 4 |
| S84-F03 | 画布快速跳转面板 | P2 | 2 |
| S84-F04 | 模板搜索增强与收藏 | P2 | 2 |
| S84-F05 | 全局键盘快捷键体系 | P3 | 3 |
