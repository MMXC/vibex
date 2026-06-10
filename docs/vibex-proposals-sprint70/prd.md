# S70 PRD — 产品需求文档

**Sprint**: vibex-proposals-sprint70  
**日期**: 2026-06-06  
**参考提案**: proposals/20260606/analyst.md

---

## 执行摘要

| Epic | 功能名称 | 优先级 | 复杂度 | 交付目标 |
|------|---------|--------|--------|---------|
| E1 | 画布分支合并与冲突处理 | P0 | 高 | 分支合并 UI + 冲突解决对话框 |
| E2 | 模板市场发现与浏览 | P0 | 中 | 市场页签 + 热门/分类/搜索 |
| E3 | 多格式批量画布导出 | P1 | 中 | 多格式 zip 导出服务 |
| E4 | 协作冲突检测与锁升级 | P1 | 高 | 冲突对话框 + 解决机制 |
| E5 | 画布设置面板完善 | P2 | 低 | 设置抽屉整合 |

---

## E1: 画布分支合并与冲突处理

### 用户故事
作为用户，我希望将实验分支合并回主分支，并在发生冲突时选择保留哪个版本，以便安全地管理分支改动。

### 功能列表

| ID | 功能点 | 描述 |
|----|--------|------|
| E1.1 | 分支合并入口 | BranchManager 面板添加"合并到主分支"按钮 |
| E1.2 | 合并预览 | 合并前显示 SnapshotCompareDialog，对比分支差异 |
| E1.3 | 冲突解决对话框 | 展示冲突节点列表，逐个选择保留版本 |
| E1.4 | 合并执行 | 调用 `canvasHistoryStore.mergeBranch()` 执行合并 |
| E1.5 | 合并后刷新 | 合并成功后自动刷新 DDSDanvasPage |

### DoD (Definition of Done)

- [ ] `BranchManager.tsx` — `MergeBranchButton` 组件，仅在非主分支显示
- [ ] `SnapshotCompareDialog.tsx` — 复用 S65-E1 diff renderer，添加合并预览模式
- [ ] `ConflictResolutionDialog.tsx` — 冲突解决对话框，含双版本对比 + 选择按钮
- [ ] `canvasHistoryStore.ts` — `mergeBranch(canvasId, branchName, resolutions?)` action
- [ ] `DDSDanvasPage.tsx` — 合并成功后调用 `canvasStore.reloadFromSnapshot()`
- [ ] `canvasHistoryStore.test.ts` — 覆盖 E1.1-E1.5 的测试用例

### expect() 断言

```typescript
expect(screen.getByRole('button', { name: /合并到主分支/i })).toBeInTheDocument();
expect(screen.getByText(/冲突节点：3 个/)).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: /保留我的版本/i }));
expect(canvasHistoryStore.getState().currentBranch).toBe('main');
```

### 页面集成
- 入口：DDSToolbar → 历史按钮 → BranchManager 面板 → "合并"按钮
- 分支对比：BranchManager 内嵌 SnapshotCompareDialog

---

## E2: 模板市场发现与浏览

### 用户故事
作为用户，我希望浏览和搜索社区模板，以便发现和学习他人的画布设计。

### 功能列表

| ID | 功能点 | 描述 |
|----|--------|------|
| E2.1 | 热门模板榜单 | "发现"页签显示 topTemplates() 排行榜 |
| E2.2 | 标签云 | 显示预定义标签 chips，支持点击过滤 |
| E2.3 | 市场搜索框 | 搜索框输入查询市场模板名称/描述 |
| E2.4 | 模板卡片增强 | 卡片显示使用量、作者、标签 chips |
| E2.5 | 分享 URL 发现 | 分享 URL 格式的模板可被市场索引 |

### DoD

- [ ] `TemplateMarketplaceTab.tsx` — 市场专页组件
- [ ] `templateStore.ts` — 新增 `featuredTemplates()` / `searchMarketplace(query, tags)` 
- [ ] TemplateGallery "发现"页签 — 集成 TemplateMarketplaceTab
- [ ] 模板卡片增强 — 使用量 / 标签 chips
- [ ] `templateStore.test.ts` — 覆盖 E2 功能测试

### expect() 断言

```typescript
expect(screen.getByText(/热门模板/)).toBeInTheDocument();
expect(screen.getAllByRole('button', { name: /标签:.*/ })).toHaveLength(5);
const cards = screen.getAllByTestId('template-card');
expect(cards[0]).toHaveTextContent(/\d+ 次使用/);
```

---

## E3: 多格式批量画布导出

### 用户故事
作为用户，我希望一次性导出 PNG + SVG + PDF 三种格式，以便灵活选择使用场景。

### 功能列表

| ID | 功能点 | 描述 |
|----|--------|------|
| E3.1 | 多格式导出入口 | ExportMenu 添加"多格式导出(zip)"子项 |
| E3.2 | MultiFormatExporter | 封装三种格式的 canvas 捕获 |
| E3.3 | Zip 打包 | 生成含 png/svg/pdf 的 zip 文件 |
| E3.4 | 进度条 | 显示当前正在生成的格式名称 |

### DoD

- [ ] `ExportMenu.tsx` — 添加多格式导出子菜单项
- [ ] `MultiFormatExporter.ts` — 新服务类
- [ ] `ZipExporter.exportMultiFormat(canvasId)` — 整合多格式生成
- [ ] `ZipExporter.test.ts` — 覆盖多格式场景

### expect() 断言

```typescript
expect(screen.getByText(/多格式导出.*zip/i)).toBeInTheDocument();
await user.click(screen.getByRole('menuitem', { name: /多格式导出/i }));
expect(screen.getByText(/正在生成 PNG/i)).toBeInTheDocument();
expect(screen.getByText(/正在生成 SVG/i)).toBeInTheDocument();
expect(screen.getByText(/正在生成 PDF/i)).toBeInTheDocument();
```

---

## E4: 协作冲突检测与锁升级

### 用户故事
作为协作者，当我和另一人同时编辑同一节点时，我希望有一个冲突解决界面来选择保留哪个版本。

### 功能列表

| ID | 功能点 | 描述 |
|----|--------|------|
| E4.1 | 冲突记录 | `presenceStore` 新增 `pendingConflicts[]` |
| E4.2 | 冲突检测 | WS 消息检测双写时创建冲突记录 |
| E4.3 | 冲突解决对话框 | `ConflictResolutionDialog` 展示双方版本 + 选择按钮 |
| E4.4 | 冲突解决执行 | 解决后清除 `pendingConflicts` 并 apply 选择 |

### DoD

- [ ] `presenceStore.ts` — `pendingConflicts: ConflictRecord[]` + `addConflict()` / `resolveConflict()`
- [ ] `ConflictResolutionDialog.tsx` — 双版本对比 + 三个解决按钮
- [ ] `DDSDanvasPage.tsx` — 冲突时自动弹出对话框
- [ ] `presenceStore.test.ts` — 覆盖冲突记录 + 解决

### expect() 断言

```typescript
expect(screen.getByText(/版本 A.*版本 B/)).toBeInTheDocument();
expect(screen.getByRole('button', { name: /保留我的版本/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /采用对方版本/i })).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: /保留我的版本/i }));
expect(presenceStore.getState().pendingConflicts).toHaveLength(0);
```

---

## E5: 画布设置面板完善

### 用户故事
作为用户，我希望通过工具栏的设置按钮统一管理所有画布设置，以便快速调整画布偏好。

### 功能列表

| ID | 功能点 | 描述 |
|----|--------|------|
| E5.1 | 设置按钮绑定 | DDSToolbar 齿轮按钮 → 打开设置抽屉 |
| E5.2 | 设置抽屉 | `CanvasSettingsDrawer.tsx` — 侧边抽屉 |
| E5.3 | 预设 Tab 整合 | ViewPresetsPanel 迁移到抽屉内预设 Tab |
| E5.4 | ESC 关闭 | 键盘 ESC 关闭抽屉 |

### DoD

- [ ] `DDSToolbar.tsx` — 设置按钮 onClick → `isSettingsOpen(true)`
- [ ] `CanvasSettingsDrawer.tsx` — 侧边抽屉组件（4 tabs: 预设/画布/节点/协作）
- [ ] 预设 Tab 内容复用 `ViewPresetsPanel`
- [ ] `CanvasSettingsDrawer.test.tsx` — 抽屉开关 + tab 切换

### expect() 断言

```typescript
expect(screen.getByRole('button', { name: /设置/i })).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: /设置/i }));
expect(screen.getByRole('dialog')).toBeInTheDocument();
expect(screen.getByRole('tab', { name: /预设/i })).toBeInTheDocument();
await user.keyboard('{Escape}');
expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
```

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 描述 |
|--------|---------|------|
| DDSToolbar | E1, E5 | 分支合并和设置都从工具栏触发 |
| SnapshotCompareDialog | E1, E4 | 分支对比和冲突解决共用 diff renderer |
| ExportMenu | E3 | 多格式导出入口 |
| TemplateGallery | E2 | 市场页签集成 |

---

## 技术风险表

| 风险 | 缓解方案 |
|------|---------|
| IndexedDB 并发写入 (E1) | 使用 IDBTransaction 串行化 |
| 模板市场 API (E2) | 先做本地 mock，数据结构可替换 |
| WS 冲突消息格式 (E4) | UI 先完成，后接 WS 消息 |
