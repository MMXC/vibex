# S70 提案分析 — 基于 S69 产出缺口识别

**Sprint**: vibex-proposals-sprint70  
**日期**: 2026-06-06  
**分析方法**: CHANGELOG 缺口分析 (S67/S68/S69)

---

## 提案摘要

| ID | 优先级 | 功能名称 | 类别 |
|----|--------|---------|------|
| P001 | P0 | 画布分支合并与冲突处理 | 数据管理 |
| P002 | P0 | 模板市场发现与浏览 | 模板系统 |
| P003 | P1 | 多格式批量画布导出 | 数据管理 |
| P004 | P1 | 协作冲突检测与锁升级 | 协作增强 |
| P005 | P2 | 画布设置面板完善 | UI 增强 |

---

## P001: 画布分支合并与冲突处理 — P0

### 问题描述
S69-E1 完成了分支创建/切换/删除功能（BranchManager.tsx），但**缺少分支合并能力**。用户无法将不同分支的改动合并到主分支，也无法在合并时处理冲突。

### 根因分析
- `historyDB.ts` 已具备 `mergeBranchInDB` (S66-E1)，但无 UI 入口
- `canvasHistoryStore.ts` 的 `mergeBranch` action 存在，但 BranchManager 无对应按钮
- 分支冲突（同一节点被两边修改）无可视化对比和解决界面

### 影响
- 用户创建分支后无法合并回来，限制了实验性编辑流程
- 团队协作时无法跨分支同步改动

### 技术方案
1. BranchManager 面板增加"合并到主分支"按钮
2. `canvasHistoryStore.mergeBranch()` UI 入口 + 冲突检测
3. `SnapshotCompareDialog` 复用 S65-E1 的 diff 渲染器做冲突预览
4. 冲突节点：展示双方快照 + 用户选择保留版本

### 验收标准
- [ ] BranchManager 有"合并分支"按钮（仅在非主分支显示）
- [ ] 合并前弹出 `SnapshotCompareDialog` 预览差异
- [ ] 冲突节点可选择保留版本
- [ ] `mergeBranch` 成功触发 `DDSDanvasPage` 刷新
- [ ] vitest: `canvasHistoryStore.test.ts` 覆盖 mergeBranch + conflict resolution

---

## P002: 模板市场发现与浏览 — P0

### 问题描述
S69-E3 完成了模板分享 URL 功能（`encodeTemplateToShareUrl`），但**没有模板市场浏览 UI**。用户只能通过分享链接发现模板，无法主动搜索和浏览社区模板。

### 根因分析
- `templateStore.ts` 有 `topTemplates()` / `getCategoryStats()` (S67-E3)
- `TemplateGallery.tsx` 已有"发现"页签 (S69-E3)
- 缺少：模板市场服务端聚合、标签过滤、作者信息、收藏量展示

### 影响
- 分享 URL 功能无法被用户主动发现
- 模板画廊内容局限于本地模板

### 技术方案
1. `templateStore.ts` 新增 `featuredTemplates()` / `searchMarketplace(query, filters)` 方法（WebSocket 或 REST API）
2. `TemplateGallery.tsx` "发现"页签扩展：标签云 + 搜索框 + 排序（最热/最新）
3. `TemplateMarketplaceTab.tsx` — 市场专页组件（含分页）
4. 模板卡片增加：作者头像、使用量、标签 chips

### 验收标准
- [ ] "发现"页签显示热门模板排行榜（topTemplates）
- [ ] 支持按标签/分类筛选模板
- [ ] 模板卡片显示使用量和标签 chips
- [ ] 分享 URL 可在市场中被发现
- [ ] vitest: `templateStore.test.ts` 覆盖 marketplace methods

---

## P003: 多格式批量画布导出 — P1

### 问题描述
S60-E4 完成了 PNG/PDF 批量导出，S64 完成了版本快照。但**缺少单一画布的多格式导出选项**（PNG + SVG + PDF 一次导出为 zip）。

### 根因分析
- `ZipExporter.ts` (S60-E4) 支持 PNG/PDF 批量，但接口面向多画布
- 单画布导出仅支持单一格式（PNG/SVG/PDF 各自独立）
- 用户希望一次导出多种格式

### 影响
- 用户需要多次操作导出同一画布的不同格式
- 无法在一个 zip 包中同时包含 PNG 预览和 SVG 源码

### 技术方案
1. `ExportMenu.tsx` 新增"多格式导出"子菜单项
2. `MultiFormatExporter.ts` — 新服务，封装 `canvasCaptureService` 三种格式生成
3. `ZipExporter.exportMultiFormat(canvasId)` — 在单 zip 中生成 `[name].png` + `[name].svg` + `[name].pdf`
4. 进度条支持三种格式串行生成

### 验收标准
- [ ] ExportMenu 有"多格式导出(zip)"入口
- [ ] 下载 zip 包含 png/svg/pdf 三个文件
- [ ] 进度条显示当前格式（"正在生成 SVG..."）
- [ ] vitest: `ZipExporter.test.ts` 覆盖多格式场景

---

## P004: 协作冲突检测与锁升级 — P1

### 问题描述
S68-E5 完成了协作者光标同步，S66-E2 完成了节点锁定通知。但**缺少协作冲突的事后解决 UI** — 当两个用户同时编辑同一节点时，仅显示 toast 警告，无解决机制。

### 根因分析
- `presenceStore.nodeLocks` 有 30s auto-release，但锁是单向的
- 当用户 A 正在编辑时，用户 B 被 toast 警告但无法"请求编辑权"
- 无冲突版本历史记录

### 影响
- 协作者间的节点编辑冲突无优雅解决路径
- 用户可能被意外覆盖改动

### 技术方案
1. `presenceStore` 新增 `pendingConflicts: ConflictRecord[]` 状态
2. `ConflictResolutionDialog.tsx` — 冲突解决弹窗，展示"我的版本" vs "对方版本" + 时间戳
3. `DDSDanvasPage.tsx` — 检测到冲突时自动弹出 `ConflictResolutionDialog`
4. 解决选项：保留我的 / 采用对方 / 合并内容

### 验收标准
- [ ] 两个用户同时编辑同一节点时，自动弹出 `ConflictResolutionDialog`
- [ ] 对话框显示双方版本内容 + 时间戳
- [ ] 支持三种解决方式并正确应用
- [ ] vitest: `presenceStore.test.ts` 覆盖冲突记录

---

## P005: 画布设置面板完善 — P2

### 问题描述
S66-E3 完成了画布视图预设保存（`ViewPresetsTab`），S69-E5 完成了工具栏预设下拉。但**DDSToolbar 设置按钮**（齿轮图标）**未连接到 CanvasSettingsPanel**。

### 根因分析
- `DDSToolbar.tsx` 有设置按钮 (`settings` icon)，但未实现点击事件
- `CanvasSettingsPanel.tsx` 是 S66-E3 创建的 Tab 组件，路径在 `src/components/dds/settings/`
- `ViewPresetsPanel` 是独立下拉菜单，两者未统一入口

### 影响
- 用户无法通过工具栏设置按钮访问画布设置
- ViewPresetsPanel 和 CanvasSettingsPanel 入口分散

### 技术方案
1. DDSToolbar 设置按钮绑定状态 `isSettingsOpen`
2. 新增 `CanvasSettingsDrawer.tsx` — 侧边抽屉，整合 ViewPresets + 画布设置
3. 抽屉内 tabs：预设 / 画布 / 节点 / 协作（4 tabs）
4. 迁移 `ViewPresetsPanel` 逻辑到 CanvasSettingsDrawer 预设 Tab

### 验收标准
- [ ] DDSToolbar 齿轮按钮点击打开 CanvasSettingsDrawer
- [ ] 预设 Tab 包含 ViewPresetsPanel 全部功能
- [ ] 抽屉支持键盘 ESC 关闭
- [ ] vitest: `CanvasSettingsDrawer.test.tsx`

---

## 技术风险

| ID | 风险 | 概率 | 影响 | 缓解 |
|----|------|------|------|------|
| T1 | 分支合并 IndexedDB 并发写入 | 中 | 高 | 事务锁 + 乐观锁 |
| T2 | 模板市场 API 依赖 | 高 | 中 | 接口设计可适配多种后端 |
| T3 | 协作冲突 WS 消息格式 | 中 | 高 | 先实现 UI，后接入 WS |
