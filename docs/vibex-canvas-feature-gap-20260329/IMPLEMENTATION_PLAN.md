# IMPLEMENTATION_PLAN.md — VibeX Canvas Feature Gap

> **项目**: vibex-canvas-feature-gap-20260329  
> **版本**: v1.0.0  
> **日期**: 2026-03-29  
> **Owner**: architect agent  
> **工作目录**: `/root/.openclaw/vibex/vibex-fronted`

---

## 1. 总览

| Epic | 名称 | 优先级 | 工时 | 周期 | 依赖 |
|------|------|--------|------|------|------|
| **E0** | 画布可用性基础 | 🔴 P0 | 12.5–18.5h | Week 1 | 无 |
| **E1** | 核心编辑体验 | 🟠 P1 | 10–14h | Week 2 | E0 |
| **E2** | 导航与定位 | 🟠 P1 | 9–12h | Week 2 | E0 |
| **E3** | 画布增强编辑 | 🟡 P2 | 14–20h | Week 3 | E1 |
| **E4** | 导出与持久化 | 🟡 P2 | 20–30h | Week 3–4 | E0 |
| **E5** | 生态扩展（长期） | ⚪ P3 | 38–53h | Week 5+ | E4 |

**总体预估**: P0–P2 约 **66–95 小时**（约 2–3 周）  
**MVP 优先交付**: E0 + E1（让画布可用且核心体验完善）

---

## 2. Epic 0 — 画布可用性基础 🔴

> **目标**: 画布页上线 + 数据不丢 + 视觉统一

### E0-F1: 画布生产部署
**Feature ID**: `canvas-p0-f1-deploy` | **工时**: 0.5h | **依赖**: 无

**任务拆分**:
1. 检查 `next.config.js` 路由配置，确认 `/canvas`、`/flow`、`/editor` 无 404
2. 检查 Vercel `vercel.json` 环境变量（`NEXT_PUBLIC_API_URL`）
3. 执行 `pnpm build` + 部署到 Vercel
4. 回归测试：首页画布预览 → 点击跳转 `/canvas` 全链路

**验收标准**:
- [ ] `https://vibex.app/canvas` 返回 200 OK
- [ ] 首页点击「打开画布」跳转正常，不丢失首页数据

---

### E0-F2: 数据持久化
**Feature ID**: `canvas-p0-f2-persistence` | **工时**: 8–12h | **依赖**: E0-F1

**任务拆分**:
1. 完善 `canvasStore.ts` persist middleware 的 `partialize` 配置（已部分存在）
2. 新增 `recordAction()` 调用点：节点增删改、状态变更时触发
3. 实现两层持久化（localStorage + API）Fallback 链
4. 节点数量 > 500 时告警提示
5. 冲突处理：加载时 localStorage 与 API 数据对比，以 API 为准

**新增依赖**: 无（persist middleware 已存在）

**验收标准**:
- [ ] 刷新页面后节点、状态、关系连线完整保留
- [ ] API 持久化节流 2s，不阻塞主线程
- [ ] 离线时使用 localStorage，恢复网络后自动同步

---

### E0-F3: CardTreeNode 深色主题迁移
**Feature ID**: `canvas-p0-f3-theme-consistency` | **工时**: 4–6h | **依赖**: 无

**任务拆分**:
1. 读取 `DESIGN.md v1.1` 节 6.5 迁移方案
2. 修改 `CardTreeNode` 背景色为 `var(--color-canvas-bg)`
3. 边框改为 `1px solid var(--color-border)`
4. 检查所有子组件继承正确 CSS 变量
5. 更新 Storybook/Chromatic 截图基线

**验收标准**:
- [ ] 深色模式下 CardTreeNode 无白底组件
- [ ] 视觉回归截图对比通过

---

## 3. Epic 1 — 核心编辑体验 🟠

> **目标**: 撤销/快捷键，让用户能高效操作画布

### E1-F4: Undo/Redo ✅
**Feature ID**: `canvas-p1-f4-undo-redo` | **工时**: 6–8h | **依赖**: E0-F2

**任务拆分**:
1. ✅ 在 `canvasStore.ts` 新增 `historySlice`（三树独立历史栈）
2. ✅ 实现 `recordSnapshot(treeType, label)` 方法（深度 max 50，无节流，CRUD 后直接记录）
3. ✅ 在 `ProjectBar` 添加 `UndoRedoButtons` 组件
4. ✅ 绑定 `Ctrl+Z` / `Ctrl+Shift+Z` 快捷键
5. ✅ 验证 50 步限制（historySlice.test.ts 全面覆盖）

**新增依赖**: 无

**验收标准**:
- [x] `Ctrl+Z` 回退最近一次节点操作
- [x] `Ctrl+Shift+Z` 重做
- [x] 无可撤销时按钮 disabled
- [x] 三棵树历史独立
- [x] 50 步深度限制，超出自动丢弃最旧记录

**实现文件**:
- `src/lib/canvas/historySlice.ts` — 独立 Zustand store，past/present/future 三栈
- `src/components/canvas/CanvasToolbar.tsx` — UndoRedoButtons + CanvasToolbar
- `src/components/canvas/ProjectBar.tsx` — handleUndo/handleRedo 集成
- `src/components/canvas/CanvasPage.tsx` — useKeyboardShortcuts 集成
- `e2e/canvas-undo-redo.spec.ts` — E2E 测试

**测试覆盖**:
- `src/lib/canvas/__tests__/historySlice.test.ts` — 50 步限制、三树独立、undo/redo 边界
- `src/hooks/useKeyboardShortcuts.test.ts` — Ctrl+Z/Ctrl+Shift+Z/focus isolation
- `e2e/canvas-undo-redo.spec.ts` — UI 集成测试

---

### E1-F6: 快捷键系统 ✅
**Feature ID**: `canvas-p1-f6-shortcuts` | **工时**: 4–6h | **依赖**: E1-F4

**任务拆分**:
1. ✅ 新建 `src/hooks/canvas/useKeyboardShortcuts.ts`（原生实现，无 react-hotkeys-hook）
2. ✅ 实现焦点隔离（输入框聚焦时跳过画布快捷键）
3. ✅ 绑定快捷键映射：
   - `Cmd+Z` / `Ctrl+Z` → Undo
   - `Cmd+Shift+Z` / `Ctrl+Shift+Z` → Redo
   - `Cmd+Y` / `Ctrl+Y` → Redo（Windows）
   - `/` → 搜索（需等 E2）
   - `?` → 快捷键提示面板
4. ✅ 新建 `src/components/canvas/features/ShortcutHintPanel.tsx`
5. ⚠️ `N` → 新建节点（待 E2-F5 搜索功能完成后实现）
6. ⚠️ `Del` / `Backspace` → 删除选中节点（待 E3-F2 多选功能完成后实现）

**新增依赖**: 无（使用原生 `document.addEventListener`）

**验收标准**:
- [x] 所有已实现快捷键正确绑定且执行对应功能
- [x] 输入框聚焦时画布快捷键不触发
- [x] `?` 键显示快捷键提示面板

**实现文件**:
- `src/hooks/useKeyboardShortcuts.ts` — 原生实现，焦点隔离
- `src/components/canvas/features/ShortcutHintPanel.tsx` — 快捷键列表面板

**测试覆盖**:
- `src/hooks/useKeyboardShortcuts.test.ts` — 6 个测试用例（Ctrl+Z/Meta+Z/Ctrl+Shift+Z/焦点隔离/enabled flag）

---

## 4. Epic 2 — 导航与定位 🟠

> **目标**: 搜索/MiniMap/Zoom，让大型项目可操作

### E2-F5: 搜索与节点过滤
**Feature ID**: `canvas-p1-f5-search` | **工时**: 3–4h | **依赖**: E0-F2

**任务拆分**:
1. 新建 `src/hooks/canvas/useCanvasSearch.ts`（集成 fuse.js）
2. 新建 `src/components/canvas/features/SearchDialog.tsx`（懒加载）
3. 新建 `src/components/canvas/features/SearchResultList.tsx`（虚拟化）
4. 在 `ProjectBar` 添加搜索图标按钮
5. 绑定 `/` 快捷键触发搜索
6. 搜索结果显示节点路径（Context → Flow → Component）

**新增依赖**: `fuse.js`, `@tanstack/react-virtual`

**验收标准**:
- [ ] 输入「order」返回 OrderForm、OrderService 等匹配结果
- [ ] 点击结果跳转目标节点并高亮
- [ ] `Esc` 关闭搜索，`↑↓` 切换结果

---

### E2-F7: 节点拖拽排序
**Feature ID**: `canvas-p1-f7-drag-sort` | **工时**: 6–8h | **依赖**: E1-F4

**任务拆分**:
1. 安装 `@dnd-kit/sortable` + `@dnd-kit/core`
2. 新建 `src/hooks/canvas/useDndSortable.ts`
3. 在三棵树节点中集成 `useSortable` hook
4. `onDragEnd` 更新 store 中节点顺序，触发 `recordAction`
5. 拖拽时显示 `DragOverlay`

**新增依赖**: `@dnd-kit/sortable`, `@dnd-kit/core`

**验收标准**:
- [ ] 拖拽节点到新位置，释放后位置保留
- [ ] 拖拽触发 Undo 历史记录
- [ ] 拖拽后刷新页面顺序保持

---

### E2-F8: 原型预览连接
**Feature ID**: `canvas-p1-f8-prototype-link` | **工时**: 4–6h | **依赖**: E0-F1

**任务拆分**:
1. 在 `ComponentTree` 节点添加「预览」图标按钮
2. 实现路由跳转 `/editor?componentId={nodeId}`
3. 确认 `/editor` 页面支持按 `componentId` 参数加载

**验收标准**:
- [ ] 点击预览图标跳转到 `/editor?componentId=xxx`
- [ ] 无参数时 `/editor` 显示组件列表（兼容）

---

### E2-F12: MiniMap 导航
**Feature ID**: `canvas-p2-f12-minimap` | **工时**: 2–3h | **依赖**: E0-F1

**任务拆分**:
1. 在 `CardTreeRenderer` 激活 `showMiniMap={true}`
2. 在 FlowCanvas 三栏各自集成 `ReactFlowMiniMap` 组件
3. 响应式隐藏（< 768px）
4. `nodeColor` 根据节点类型着色

**验收标准**:
- [ ] 每个 TreePanel 底部显示对应 MiniMap
- [ ] 点击 MiniMap 跳转视图中心
- [ ] 移动端 MiniMap 隐藏

---

### E2-F14: 画布缩放控制
**Feature ID**: `canvas-p2-f14-zoom` | **工时**: 3–4h | **依赖**: E0-F1

**任务拆分**:
1. 激活 ReactFlow `Controls` 组件（放大/缩小/适应屏幕）
2. 添加鼠标滚轮缩放支持
3. 缩放状态持久化到 store

**验收标准**:
- [ ] +/- 按钮缩放画布
- [ ] Fit View 适应屏幕
- [ ] 鼠标滚轮缩放

---

## 5. Epic 3 — 画布增强编辑 🟡

> **目标**: 多选/贴纸/关系连线，让画布更丰富

### E3-F2: 多选 + 批量操作
**Feature ID**: `canvas-p2-f2-multi-select` | **工时**: 6–8h | **依赖**: E1-F4

**任务拆分**:
1. 配置 ReactFlow `selectionMode={SelectionMode.Partial}`（`@xyflow/react` 内置）
2. 实现 Shift+点击多选
3. 批量选中后支持批量移动/删除
4. 多选状态同步到 store

**验收标准**:
- [ ] Shift+点击选中多个节点
- [ ] 批量移动/删除操作正确
- [ ] 批量操作触发单次 Undo 记录

---

### E3-F3: Sticky Notes 贴纸
**Feature ID**: `canvas-p2-f3-sticky-notes` | **工时**: 4–6h | **依赖**: E0-F1

**任务拆分**:
1. 新建 `src/components/canvas/nodes/StickyNoteNode.tsx`
2. 在 `nodeTypes` 中注册 `stickyNote` 类型
3. 双击画布空白区域创建贴纸节点
4. 支持拖拽定位和文本编辑

**验收标准**:
- [ ] 可创建、编辑、拖拽贴纸节点
- [ ] 贴纸节点持久化到 store

---

### E3-F13: 节点关系连线扩展
**Feature ID**: `canvas-p2-f13-relationship-lines` | **工时**: 6–10h | **依赖**: E0-F2

**任务拆分**:
1. 节点数据模型添加 `relationships` 字段
2. 在 Flow 树和 Component 树复用 `RelationshipEdge` 组件
3. 连线样式区分：实线（包含）、虚线（引用）、点线（依赖）
4. 连线过多时提供聚类/优先级策略

**验收标准**:
- [ ] Flow 树节点显示关系连线
- [ ] Component 树节点显示关系连线
- [ ] 三种连线样式区分清晰

---

## 6. Epic 4 — 导出与持久化 🟡

> **目标**: 导出/模板/版本历史，画布可用于生产工作流

### E4-F9: 多格式导出
**Feature ID**: `canvas-p2-f9-export` | **工时**: 8–12h | **依赖**: E0-F1

**任务拆分**:
1. 新建 `src/hooks/canvas/useCanvasExport.ts`
2. 实现 `html-to-image` 导出（PNG/SVG）
3. 实现 JSON 导出（完整画布数据）
4. 实现 Markdown 导出（三树结构化描述）
5. 在 `ProjectBar` 添加导出菜单按钮
6. 支持导出范围选择（Context / Flow / Component / All）

**新增依赖**: 无（`html-to-image` 已安装）

**验收标准**:
- [ ] PNG/SVG/JSON/Markdown 格式均可导出
- [ ] 导出图片清晰无截断
- [ ] 导出菜单可选范围

---

### E4-F10: 需求模板库
**Feature ID**: `canvas-p2-f10-templates` | **工时**: 6–8h | **依赖**: E0-F2

**任务拆分**:
1. 在 `/public/templates/` 创建模板 JSON 文件（`e-commerce.json`、`saas.json`、`social.json`）
2. 新建 `src/lib/canvas/templateLoader.ts`
3. 在 Phase 1 需求输入页添加「使用模板」按钮
4. 选择后自动填充三树数据

**验收标准**:
- [ ] 模板选择器显示模板卡片列表
- [ ] 选择后三树自动填充对应数据

---

### E4-F11: 版本历史
**Feature ID**: `canvas-p2-f11-version-history` | **工时**: 8–12h | **依赖**: E0-F2

**任务拆分**:
1. 在 `canvasApi.ts` 新增快照 API 方法（POST/GET snapshots, POST restore）
2. 新建 `src/hooks/canvas/useVersionHistory.ts`
3. 新建 `src/components/canvas/features/VersionHistoryPanel.tsx`（侧边抽屉）
4. 实现快照触发时机：手动保存、AI 生成完成、重要操作
5. 支持预览和回滚

**验收标准**:
- [ ] AI 生成后自动创建快照
- [ ] 版本历史面板显示快照列表
- [ ] 可恢复到任意历史快照

---

## 7. Epic 5 — 生态扩展（长期） ⚪

> **目标**: 离线/设计系统/评论/AI 实时反馈

### E5-F15: 离线模式
**Feature ID**: `canvas-p3-f15-offline` | **工时**: 12–16h | **依赖**: E0-F2, E4-F11

### E5-F16: 设计系统集成
**Feature ID**: `canvas-p3-f16-design-system` | **工时**: 8–10h | **依赖**: E4-F11

### E5-F17: 协作评论
**Feature ID**: `canvas-p3-f17-comments` | **工时**: 8–12h | **依赖**: E0-F2

### E5-F18: AI 实时反馈
**Feature ID**: `canvas-p3-f18-ai-realtime` | **工时**: 10–15h | **依赖**: E0-F1

---

## 8. 实施顺序决策

### 推荐顺序（遵循依赖）

```
Week 1
├── E0-F1 (0.5h) → 部署画布页
├── E0-F2 (8-12h) → 数据持久化
└── E0-F3 (4-6h) → 深色主题迁移

Week 2
├── E1-F4 (6-8h) → Undo/Redo
├── E1-F6 (4-6h) → 快捷键系统
├── E2-F8 (4-6h) → 原型预览连接
└── E2-F14 (3-4h) → Zoom 缩放

Week 3
├── E2-F5 (3-4h) → 搜索节点
├── E2-F12 (2-3h) → MiniMap 导航
├── E3-F2 (6-8h) → 多选批量
├── E3-F3 (4-6h) → Sticky Notes
└── E3-F13 (6-10h) → 关系连线扩展

Week 4
├── E4-F11 (8-12h) → 版本历史 ← (关键里程碑)
├── E4-F9 (8-12h) → 多格式导出
└── E2-F7 (6-8h) → 拖拽排序

Week 5+
├── E4-F10 (6-8h) → 模板库
└── E5-P3 (38-53h) → 生态扩展（长期规划）
```

### 关键里程碑

| 里程碑 | 触发条件 | 预计时间 |
|--------|---------|---------|
| **M1: 画布可用** | E0 完成 | Week 1 结束 |
| **M2: 核心体验** | E1 + E2-F14 + E2-F8 完成 | Week 2 结束 |
| **M3: 导航完善** | E2-F5 + E2-F12 完成 | Week 3 结束 |
| **M4: 生产就绪** | E3 + E4-F9 + E4-F11 完成 | Week 4 结束 |

---

## 9. 测试计划

### 单元测试

| 功能 | 测试文件 | 覆盖目标 |
|------|---------|---------|
| History Slice | `src/__tests__/canvas/historySlice.test.ts` | undo/redo 边界、深度的 |
| Search | `src/__tests__/canvas/search.test.ts` | fuse.js 匹配、空结果 |
| Export | `src/__tests__/canvas/export.test.ts` | JSON 格式、PNG 生成 |
| Cascade | `src/__tests__/canvas/cascade.test.ts` | 上游变更级联下游 |

### E2E 测试（Playwright）

| 场景 | 测试文件 |
|------|---------|
| Undo/Redo 完整流程 | `e2e/canvas-undo-redo.spec.ts` |
| 搜索节点并跳转 | `e2e/canvas-search.spec.ts` |
| 导出多格式 | `e2e/canvas-export.spec.ts` |
| 版本历史回滚 | `e2e/canvas-version-history.spec.ts` |
| 快捷键触发 | `e2e/canvas-shortcuts.spec.ts` |
| 画布部署回归 | `e2e/canvas-deploy-regression.spec.ts` |

### 性能测试

| 指标 | 目标 | 测试文件 |
|------|------|---------|
| 500 节点搜索响应 | < 200ms | `playwright.perf.spec.ts` |
| 1000 节点渲染帧率 | ≥ 30fps | `playwright.perf.spec.ts` |
| 持久化写入时间 | < 50ms | 集成测试 |

---

## 10. 风险缓解

| 风险 | 缓解策略 | 负责人 |
|------|---------|-------|
| ReactFlow 与 @dnd-kit 冲突 | 先做 E1-F4 和 E1-F6，E2-F7 单独 PR 验证 | dev |
| 持久化 localStorage 配额 | 先测试 500 节点场景，触发阈值则切换纯 API | dev + tester |
| 快捷键与浏览器冲突 | Mac/Windows 分开测试；建立冲突报告表 | tester |
| API 快照存储成本 | 快照按项目 ID 分组，定期清理 30 天前旧快照 | dev |

---

*本文档由 architect agent 生成 | 2026-03-29*
*PM 负责按里程碑跟踪进度并更新本计划*
