# VibeX 画布功能补全 — 实施计划

**项目**: vibex-canvas-feature-gap-20260329
**日期**: 2026-03-29
**作者**: architect agent
**工作目录**: /root/.openclaw/vibex

---

## 1. 概述

基于 `analysis.md` 的功能差距分析，本计划覆盖 **5 个核心功能模块** 的实现，按优先级排序：

| 优先级 | 功能模块 | 工时 | 价值 |
|--------|---------|------|------|
| P0 | Undo/Redo（历史管理） | 6-8h | 创作工具核心需求 |
| P1 | 键盘快捷键 | 4-6h | 效率提升 |
| P1 | 节点搜索 | 4-6h | 大型项目刚需 |
| P1 | MiniMap 导航 | 2-3h | 画布导航 |
| P2 | 导出图片/JSON | 4-6h | 用户分享需求 |

**总工时**: 20-29h（约 4-5 人天）
**推荐团队**: 1 dev，1 tester，1 reviewer

---

## 2. 阶段规划

### Phase 0: 基础设施（1h）— 并行准备

**目标**: 安装依赖，搭建基础架构

**步骤**:
1. 安装 `html-to-image`（替换 html2canvas）
2. 安装 `fuse.js`
3. 创建 `src/hooks/` 目录结构
4. 创建 `src/lib/canvas/historySlice.ts` 空壳
5. 配置 `vitest` / `testing-library` 测试环境
6. 创建 E2E 测试基础 fixtures

**产出物**: 
- `package.json` 更新
- 目录结构就绪
- 测试环境可用

**验收标准**:
- [ ] `pnpm add html-to-image fuse.js` 成功
- [ ] `pnpm test --run` 通过现有测试
- [ ] 新文件 `src/hooks/useCanvasHistory.ts` 存在（空壳）

---

### Phase 1: Undo/Redo 历史管理（6-8h）

**目标**: 实现三树独立的撤销/重做功能

**步骤**:

#### Step 1.1: History Slice 实现（2h）
```
1. 创建 `src/lib/canvas/historySlice.ts`
2. 实现 HistoryStack 类型和操作函数
3. 实现 pushHistory / undo / redo / canUndo / canRedo
4. 实现 max 50 步限制逻辑
5. 单元测试（3 个核心函数）
```

#### Step 1.2: Store 集成（1h）
```
1. 在 `canvasStore.ts` 中引入 historySlice
2. 使用 Zustand 的 `combine` 合并 slices
3. 在 `addNode` / `updateNode` / `deleteNode` 后自动 pushHistory
4. 在 `loadExampleData` 中自动 clearHistory
5. 验证三树历史独立
```

#### Step 1.3: CanvasToolbar UI（1h）
```
1. 创建 `src/components/canvas/CanvasToolbar.tsx`
2. 添加 Undo 按钮（< ChevronLeft）
3. 添加 Redo 按钮（> ChevronRight）
4. 按钮状态（disabled 时降低透明度）
5. 添加 Zoom In / Zoom Out / FitView 按钮
```

#### Step 1.4: 快捷键集成（1h）
```
1. 在 useKeyboardShortcuts.ts 中添加 Cmd+Z / Cmd+Shift+Z
2. 集成到 CanvasPage
3. 测试快捷键与系统级快捷键不冲突
```

#### Step 1.5: 端到端测试（1-2h）
```
1. 添加 historySlice 单元测试
2. 添加 E2E 测试：添加节点 → undo → redo
3. 添加边界测试：空历史 undo / 满历史 push
```

**产出物**: 
- `src/lib/canvas/historySlice.ts`
- `src/components/canvas/CanvasToolbar.tsx`
- `src/hooks/useKeyboardShortcuts.ts`
- 测试文件

**验收标准**:
- [ ] `Ctrl+Z` 回退最近一次节点操作
- [ ] `Ctrl+Shift+Z` 重做
- [ ] 三棵树历史独立（Context undo 不影响 Flow）
- [ ] 按钮 disabled 状态正确
- [ ] 50 步历史限制生效
- [ ] `pnpm test --run` 通过

---

### Phase 2: 键盘快捷键（4-6h）

**目标**: 实现完整的键盘快捷键系统

**步骤**:

#### Step 2.1: Keyboard Shortcuts Hook（2h）
```
1. 创建 `src/lib/canvas/keyboardShortcuts.ts`（快捷键定义常量）
2. 创建 `src/hooks/useKeyboardShortcuts.ts`
3. 实现快捷键注册与事件分发
4. 实现输入框焦点检测逻辑
5. 单元测试
```

#### Step 2.2: 快捷键提示面板（1h）
```
1. 创建 `src/components/canvas/ShortcutHintPanel.tsx`
2. 按 `?` 显示/隐藏
3. 展示所有可用快捷键
4. 美化面板样式（与赛博朋克主题一致）
```

#### Step 2.3: 快捷键与业务逻辑绑定（1-2h）
```
1. `/` → 打开搜索对话框
2. `S` → 保存到后端（调用 canvasApi）
3. `N` → 在当前树添加新节点
4. `+` / `-` / `0` → 缩放控制
5. `Escape` → 关闭所有弹窗
```

#### Step 2.4: 测试与文档（1h）
```
1. E2E 测试：按 `/` → 搜索框打开 → 按 `Esc` → 关闭
2. 更新 AGENTS.md 快捷键映射表
```

**产出物**: 
- `src/lib/canvas/keyboardShortcuts.ts`
- `src/hooks/useKeyboardShortcuts.ts`
- `src/components/canvas/ShortcutHintPanel.tsx`

**验收标准**:
- [ ] 所有 12 个快捷键绑定正确
- [ ] 焦点在输入框时不触发画布快捷键（除了 `Esc`）
- [ ] `?` 键切换快捷键面板显示
- [ ] 快捷键面板样式与主题一致

---

### Phase 3: 节点搜索（4-6h）

**目标**: 实现模糊搜索和节点导航

**步骤**:

#### Step 3.1: 搜索引擎（1.5h）
```
1. 创建 `src/lib/canvas/searchEngine.ts`
2. 封装 Fuse.js 初始化和搜索逻辑
3. 配置模糊匹配阈值（0.3）
4. 实现按树类型分类结果
```

#### Step 3.2: 搜索 Slice（0.5h）
```
1. 创建 `searchSlice.ts`（或作为 canvasStore 的一部分）
2. 管理搜索状态：isOpen / query / results
3. 实现 openSearch / closeSearch / setQuery / jumpToNode
```

#### Step 3.3: 搜索对话框 UI（1.5h）
```
1. 创建 `src/components/canvas/SearchDialog.tsx`
2. 搜索输入框（自动聚焦）
3. 搜索结果列表（Fuse.js 排序）
4. 键盘导航（↑↓ 选择，Enter 跳转）
5. 关闭按钮 + `Esc` 关闭
```

#### Step 3.4: 节点高亮动画（0.5h）
```
1. 在 CSS 中添加 `.node-highlight` 动画
2. 在 TreePanel 中实现高亮逻辑
3. 1.5s 后自动清除高亮
```

#### Step 3.5: 集成与测试（1h）
```
1. 在 CanvasToolbar 中添加搜索图标按钮
2. 在 useKeyboardShortcuts 中绑定 `/`
3. E2E 测试：搜索 → 选择结果 → 跳转 → 高亮
4. 性能测试：500 节点搜索响应时间 < 200ms
```

**产出物**: 
- `src/lib/canvas/searchEngine.ts`
- `src/components/canvas/SearchDialog.tsx`
- `src/hooks/useCanvasSearch.ts`

**验收标准**:
- [ ] 输入关键词实时过滤（防抖 150ms）
- [ ] 匹配节点高亮显示
- [ ] 回车跳转并聚焦节点
- [ ] `Esc` 关闭搜索
- [ ] 搜索 500 节点 < 200ms

---

### Phase 4: MiniMap 导航（2-3h）

**目标**: 激活 ReactFlow 内置 MiniMap

**步骤**:

#### Step 4.1: CanvasMiniMap 组件（1.5h）
```
1. 创建 `src/components/canvas/CanvasMiniMap.tsx`
2. 在每个 TreePanel 的 ReactFlow 中添加 <MiniMap>
3. 配置节点颜色映射（紫色/绿色/黄色）
4. 响应式隐藏（< 768px）
5. 样式与深色主题一致
```

#### Step 4.2: 交互增强（0.5h）
```
1. MiniMap 点击跳转到对应节点区域
2. MiniMap 缩略图实时更新
3. 滚动画布时 MiniMap viewport 指示器同步
```

#### Step 4.3: 测试（0.5h）
```
1. 验证 MiniMap 在三种树中正确显示
2. 验证响应式隐藏
3. 截图留存
```

**产出物**: 
- `src/components/canvas/CanvasMiniMap.tsx`

**验收标准**:
- [ ] 三树各自有独立的 MiniMap
- [ ] MiniMap 显示节点缩略图
- [ ] 点击 MiniMap 跳转对应区域
- [ ] 移动时 MiniMap 实时更新
- [ ] `< 768px` 隐藏 MiniMap

---

### Phase 5: 导出功能（4-6h）

**目标**: 实现 PNG/SVG/JSON 三种格式导出

**步骤**:

#### Step 5.1: Export Hook（1.5h）
```
1. 创建 `src/hooks/useCanvasExport.ts`
2. 封装 html-to-image 的 toPng / toSvg
3. 实现 JSON 序列化导出
4. 处理错误和 loading 状态
```

#### Step 5.2: ExportMenu UI（1.5h）
```
1. 创建 `src/components/canvas/ExportMenu.tsx`
2. 下拉菜单：PNG / SVG / JSON 三个选项
3. 导出中显示 loading spinner
4. 导出成功/失败 toast 提示
```

#### Step 5.3: 大画布处理（1h）
```
1. 检测画布尺寸 > 4096px
2. 大画布时提示用户先 FitView
3. 导出时临时重置缩放为 1x
```

#### Step 5.4: 测试与优化（1h）
```
1. 导出 PNG 截图验证
2. 导出 SVG 验证（字体嵌入）
3. 导出 JSON 验证（数据结构正确）
4. 错误场景测试（导出失败提示）
```

**产出物**: 
- `src/hooks/useCanvasExport.ts`
- `src/components/canvas/ExportMenu.tsx`

**验收标准**:
- [ ] PNG 导出图片质量清晰（2x pixelRatio）
- [ ] SVG 导出字体正确（无乱码）
- [ ] JSON 导出数据结构完整
- [ ] 导出中 loading 状态正确
- [ ] 大画布有 FitView 提示

---

## 3. 开发顺序

```
Phase 0（1h） ──────────────────────────────────────────┐
    ↓                                                     ↓（Phase 0 完成后并行）
Phase 1（6-8h）    Phase 2（4-6h）    Phase 3（4-6h）  Phase 4（2-3h）
    ↓                 ↓                  ↓               ↓
    └─────────────────┴──────────────────┴───────────────┘
                              ↓
                       Phase 5（4-6h）
                              ↓
                       集成测试 + 回归测试
                              ↓
                          验收上线
```

**推荐排期**：
- Day 1: Phase 0 + Phase 1（核心功能先行）
- Day 2: Phase 2 + Phase 3（效率工具）
- Day 3: Phase 4 + Phase 5（导航和导出）
- Day 4: 集成测试 + 回归测试 + Bug 修复

---

## 4. 测试计划

### 4.1 单元测试文件

| 文件 | 测试内容 |
|------|---------|
| `historySlice.test.ts` | pushHistory / undo / redo / 边界 |
| `searchEngine.test.ts` | 模糊匹配 / 空查询 / 防抖 |
| `useKeyboardShortcuts.test.ts` | 各快捷键触发 / 不触发 |
| `useCanvasExport.test.ts` | PNG / SVG / JSON / 错误 |

### 4.2 集成测试文件

| 测试 | 描述 |
|------|------|
| `canvas-undo-redo.spec.ts` | 添加 → undo → redo 全流程 |
| `canvas-search.spec.ts` | 搜索 → 选择 → 跳转 |
| `canvas-shortcuts.spec.ts` | 快捷键按压验证 |
| `canvas-export.spec.ts` | 三种格式导出 |
| `canvas-minimap.spec.ts` | MiniMap 交互 |

### 4.3 回归测试

每次 PR 必须通过以下回归测试：
- 现有 TreePanel 功能正常（三树 CRUD）
- 三栏折叠展开正常
- 阶段进度条正常
- AI 生成节点正常
- 级联状态更新正常

---

## 5. 里程碑

| 里程碑 | 完成条件 | 预计时间 |
|--------|---------|---------|
| **M1: Undo/Redo 可用** | Phase 1 验收标准全部通过 | Day 1 |
| **M2: 快捷键+搜索可用** | Phase 2 + Phase 3 验收标准通过 | Day 2 |
| **M3: 完整功能集** | Phase 4 + Phase 5 + 回归通过 | Day 3 |
| **M4: 生产部署** | 所有测试通过，PR 合并 | Day 4 |

---

## 6. 风险与缓冲

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| ReactFlow v12 API 变更 | 低 | 中 | 锁定版本 + 先跑集成测试 |
| html-to-image 中文乱码 | 中 | 低 | 提前验证，不行用 html2canvas 回退 |
| 多选与拖拽交互冲突 | 中 | 中 | Phase 1 后先单独测试多选 |
| 测试覆盖不足导致回归 | 中 | 高 | 每阶段必须包含测试 |
| 历史栈内存占用 | 低 | 中 | 50 步限制 |

**工时缓冲**: 每个 Phase 增加 20% 缓冲时间。

---

## 7. 验收检查清单

### 功能验收

- [ ] Undo/Redo: 三树独立历史，50 步限制
- [ ] 快捷键: 12 个快捷键全部工作，输入框内正确跳过
- [ ] 搜索: 模糊匹配，150ms 防抖，500 节点 < 200ms
- [ ] MiniMap: 三树独立，响应式隐藏，点击跳转
- [ ] 导出: PNG / SVG / JSON 三格式，loading 状态，错误提示

### 质量验收

- [ ] 无 `any` 类型
- [ ] 无 `console.log`
- [ ] 所有新文件有 TypeScript 类型
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试全部通过
- [ ] Lighthouse performance score > 85

### 文档验收

- [ ] AGENTS.md 更新（快捷键表）
- [ ] README.md 新增快捷键说明（如需要）
- [ ] CHANGELOG.md 记录新功能

---

## 8. 后续规划（不在本次范围）

| 功能 | 优先级 | 预估工时 | 说明 |
|------|--------|---------|------|
| 多选批量操作 | P2 | 6-8h | ReactFlow selectionMode |
| Sticky Notes | P2 | 4-6h | 新节点类型 |
| 版本历史（持久化） | P2 | 8-12h | 后端 API 支持 |
| PDF 导出 | P2 | 6-8h | jsPDF + html-to-image |
| 节点颜色标签 | P2 | 3-4h | 可视化增强 |

---

*本文档由 Architect Agent 生成 | 2026-03-29*
