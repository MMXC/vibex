# PRD: VibeX CanvasPage 拆分 Hooks 重构

**项目**: canvas-split-hooks
**版本**: v1.0
**日期**: 2026-04-03
**状态**: PM 细化
**来源**: Analyst 需求分析报告

---

## 1. 执行摘要

### 背景
`CanvasPage.tsx` 当前 **1510 行**，是整个 VibeX 前端最大的单体组件。可维护性差、测试困难、Git 冲突频繁、新人上手成本高。需将 ~800 行逻辑拆分为 5 个独立 Hook，最终将 CanvasPage 瘦身为 < 300 行的编排层。

### 目标
将 CanvasPage 从 1510 行重构为 < 300 行的编排层，每个 Hook 独立可测试，组件职责单一。

### 成功指标
| 指标 | 当前基线 | Sprint 目标 |
|------|----------|------------|
| CanvasPage 行数 | 1510 行 | < 300 行 |
| 新建 Hook 数 | 0 | 5 个 |
| Hook 单元测试覆盖率 | 0% | > 80% |
| Git 单文件冲突频率 | 高 | 降低（拆分后多人可并行） |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 依赖 |
|------|------|--------|------|------|
| E1 | useCanvasState | P0 | 3h | 无 |
| E2 | useCanvasStore 封装 | P0 | 2h | 无 |
| E3 | useCanvasRenderer | P0 | 3h | 无 |
| E4 | useAIController | P1 | 4h | E1 |
| E5 | useCanvasEvents | P1 | 3h | E1 |
| E6 | CanvasPage 整合重构 | P0 | 4h | E1-E5 |

**总工时**: 19h

---

### Epic 1: useCanvasState — 画布状态管理（P0）

#### 概述
提取 pan/zoom/scroll 相关状态和事件处理到独立 Hook。

#### Stories

**S1.1: 创建 useCanvasState Hook**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要一个管理画布视口状态的 Hook |
| 功能点 | 创建 `src/hooks/canvas/useCanvasState.ts`，导出 zoomLevel、isSpacePressed、isPanning、panOffset 及 handlers |
| 验收标准 | `expect(typeof useCanvasState).toBe('function')` + `expect(result.zoomLevel).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1h |
| 依赖 | 无 |

**S1.2: 提取 pan/zoom handlers**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 Space+drag 平移和 zoom in/out/reset 在 Hook 内处理 |
| 功能点 | 迁移：Space key listener、mouse drag pan handlers、zoom handlers |
| 验收标准 | `expect(result.handlers.handleMouseMove).toBeDefined()` + `expect(result.handlers.handleZoomIn).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1h |
| 依赖 | S1.1 |

**S1.3: 提取 expand mode 逻辑**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 expand mode 在 Hook 内管理 |
| 功能点 | 迁移：expand mode state（normal/expand-both/maximize）、F11 maximize 逻辑 |
| 验收标准 | `expect(result.expandMode).toBeOneOf(['normal','expand-both','maximize'])` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 0.5h |
| 依赖 | S1.1 |

**S1.4: 编写 useCanvasState 单元测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我希望 useCanvasState 有 > 80% 分支覆盖率的测试 |
| 功能点 | 测试 zoom handlers、pan handlers、expand mode 切换 |
| 验收标准 | `expect(coverage.branches).toBeGreaterThanOrEqual(0.80)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | S1.2 |

#### DoD
- useCanvasState hook 可独立使用
- Space+drag 平移在桌面和移动端均可复现
- Zoom in/out/reset 正确应用 CSS 变量
- expand mode 切换正常
- 分支覆盖率 > 80%

---

### Epic 2: useCanvasStore 封装（P0）

#### 概述
封装统一 Store 访问接口，消除 CanvasPage 对各 store selector 的直接引用。

#### Stories

**S2.1: 创建 useCanvasStore Hook**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要一个统一封装各 Store selectors 的 Hook |
| 功能点 | 创建 `src/hooks/canvas/useCanvasStore.ts`，导出 phase、activeTree、nodes、panels、selection、session 等接口 |
| 验收标准 | `expect(result.phase).toBeDefined()` + `expect(result.contextNodes).toBeInstanceOf(Array)` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1h |
| 依赖 | 无 |

**S2.2: 迁移 panel selectors**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望面板折叠状态通过 Hook 访问 |
| 功能点 | 迁移：contextPanelCollapsed、flowPanelCollapsed、componentPanelCollapsed 及 toggle 函数 |
| 验收标准 | `expect(result.contextPanelCollapsed).toBeDefined()` + `expect(result.toggleContextPanel).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 0.5h |
| 依赖 | S2.1 |

**S2.3: 迁移 selection 和 session**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 selection 和 session 状态通过 Hook 访问 |
| 功能点 | 迁移：selectedNodeIds、deleteSelectedNodes、projectId、flowGenerating 等 |
| 验收标准 | `expect(result.selectedNodeIds).toBeDefined()` + `expect(result.projectId).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 0.5h |
| 依赖 | S2.1 |

#### DoD
- useCanvasStore 导出 CanvasPage 所需的全部 selectors
- CanvasPage 不再直接引用 useContextStore/useUIStore 等
- 所有 panel toggle 功能正常

---

### Epic 3: useCanvasRenderer — 渲染派生数据（P0）

#### 概述
提取节点矩形、边界连线、树节点转换等派生数据计算。

#### Stories

**S3.1: 创建 useCanvasRenderer Hook**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要一个管理渲染派生数据的 Hook |
| 功能点 | 创建 `src/hooks/canvas/useCanvasRenderer.ts`，导出 nodeRects、edges、treeNodes、confirmation |
| 验收标准 | `expect(result.contextNodeRects).toBeDefined()` + `expect(result.boundedEdges).toBeInstanceOf(Array)` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1h |
| 依赖 | 无 |

**S3.2: 提取节点矩形和边计算**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望节点矩形和边界连线在 Hook 内计算 |
| 功能点 | 迁移：contextNodeRects/flowNodeRects/componentNodeRects memo、boundedEdges、flowEdges |
| 验收标准 | `expect(result.boundedEdges.length).toBeGreaterThan(0)` when contexts exist |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1h |
| 依赖 | S3.1 |

**S3.3: 提取 confirmation 和 phaseLabel**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 confirmation 状态和 phaseLabel 在 Hook 内计算 |
| 功能点 | 迁移：contextReady、flowReady、componentReady、allTreesConfirmed、phaseLabel、phaseHint |
| 验收标准 | `expect(result.confirmation.allTreesConfirmed).toBeDefined()` + `expect(result.phaseLabel).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1h |
| 依赖 | S3.1 |

#### DoD
- useCanvasRenderer 返回完整的渲染派生数据
- 限界上下文关联边正确计算
- flowEdges 连线正确计算
- confirmation 状态正确

---

### Epic 4: useAIController — AI 生成编排（P1）

#### 概述
提取 AI 快速生成、继续到组件、冲突处理等编排逻辑。

#### Stories

**S4.1: 创建 useAIController Hook**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要一个管理 AI 生成编排逻辑的 Hook |
| 功能点 | 创建 `src/hooks/canvas/useAIController.ts`，导出 quickGenerate、handleContinueToComponents、冲突处理 |
| 验收标准 | `expect(result.quickGenerate).toBeDefined()` + `expect(result.handlers.handleConflictKeepLocal).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1.5h |
| 依赖 | E1 |

**S4.2: 迁移冲突处理逻辑**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望冲突处理三选项在 Hook 内实现 |
| 功能点 | 迁移：handleConflictKeepLocal、handleConflictUseServer、handleConflictMerge |
| 验收标准 | `expect(result.handlers.handleConflictKeepLocal()).toBeDefined()` + `expect(result.handlers.handleConflictUseServer()).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1.5h |
| 依赖 | S4.1 |

**S4.3: 编写 useAIController 单元测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我希望 useAIController 有覆盖率测试 |
| 功能点 | 测试生成触发、冲突状态变化 |
| 验收标准 | `expect(coverage.branches).toBeGreaterThanOrEqual(0.70)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | S4.2 |

#### DoD
- 快速生成流程完整
- 冲突处理三选项均正常
- saveStatus 状态正确变化

---

### Epic 5: useCanvasEvents — 事件处理（P1）

#### 概述
提取搜索、快捷键、键盘事件处理逻辑。

#### Stories

**S5.1: 创建 useCanvasEvents Hook**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要一个管理事件处理的 Hook |
| 功能点 | 创建 `src/hooks/canvas/useCanvasEvents.ts`，导出搜索 state、handlers、快捷键配置 |
| 验收标准 | `expect(result.isSearchOpen).toBeDefined()` + `expect(result.handlers.handleSearchSelect).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1h |
| 依赖 | E1 |

**S5.2: 迁移 keyboard undo/redo**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 Ctrl+Z/Y 在 Hook 内处理 |
| 功能点 | 迁移：handleKeyboardUndo、handleKeyboardRedo、useKeyboardShortcuts 配置 |
| 验收标准 | `expect(result.handlers.handleKeyboardUndo()).toBeDefined()` + `expect(result.handlers.handleKeyboardRedo()).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1h |
| 依赖 | S5.1 |

**S5.3: 迁移搜索和快捷键面板**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望搜索和快捷键面板 toggle 在 Hook 内管理 |
| 功能点 | 迁移：isSearchOpen、isShortcutPanelOpen、handleSearchSelect、handlePhaseClick |
| 验收标准 | `expect(result.openSearch).toBeDefined()` + `expect(result.isShortcutPanelOpen).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1h |
| 依赖 | S5.1 |

#### DoD
- Ctrl+Z/Y 撤销/重做正常
- 搜索对话框打开/关闭/选中正常
- 快捷键面板正常

---

### Epic 6: CanvasPage 整合重构（P0）

#### 概述
将 CanvasPage 从 1510 行瘦身为 < 300 行的编排层，组合 5 个 Hook。

#### Stories

**S6.1: 添加 Hook 引用（不删除旧代码）**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要先引入新 Hook 引用，验证功能后再删除旧代码 |
| 功能点 | 在 CanvasPage 中 import 5 个新 Hook，逐步替换使用点 |
| 验收标准 | `expect(useCanvasState).toBeDefined()` + `expect(useAIController).toBeDefined()` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 2h |
| 依赖 | E1-E5 |

**S6.2: 删除已迁移代码**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要在验证后删除已迁移的旧代码 |
| 功能点 | 删除 CanvasPage 内 ~800 行已迁移逻辑 |
| 验收标准 | `expect(lineCount('CanvasPage.tsx')).toBeLessThan(300)` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1.5h |
| 依赖 | S6.1 |

**S6.3: 全量回归测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证重构后所有功能未丢失 |
| 功能点 | 运行完整测试套件：CanvasPage 三树渲染、移动端 Tab 模式、抽屉、原型阶段 |
| 验收标准 | `expect(allTestsPassed).toBe(true)` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 0.5h |
| 依赖 | S6.2 |

#### DoD
- CanvasPage < 300 行
- 所有 6 个 Hook 正确组合
- 三树渲染与重构前完全一致
- 测试套件全部通过

---

## 3. 验收标准汇总

| Epic | Story | 功能点 | expect() 断言 |
|------|-------|--------|--------------|
| E1 | S1.1 | useCanvasState Hook | `typeof useCanvasState === 'function'` |
| E1 | S1.2 | pan/zoom handlers | `handleZoomIn is function` |
| E1 | S1.3 | expand mode | `expandMode in ['normal','expand-both','maximize']` |
| E1 | S1.4 | 覆盖率 | `branches ≥ 80%` |
| E2 | S2.1 | useCanvasStore Hook | `phase is defined` |
| E2 | S2.2 | panel selectors | `toggleContextPanel is function` |
| E2 | S2.3 | selection/session | `selectedNodeIds is defined` |
| E3 | S3.1 | useCanvasRenderer Hook | `boundedEdges is Array` |
| E3 | S3.2 | edges 计算 | `edges.length > 0 when contexts exist` |
| E3 | S3.3 | confirmation | `allTreesConfirmed is boolean` |
| E4 | S4.1 | useAIController Hook | `quickGenerate is function` |
| E4 | S4.2 | 冲突处理 | `handleConflictKeepLocal is function` |
| E4 | S4.3 | 覆盖率 | `branches ≥ 70%` |
| E5 | S5.1 | useCanvasEvents Hook | `handleSearchSelect is function` |
| E5 | S5.2 | undo/redo | `handleKeyboardUndo returns boolean` |
| E5 | S5.3 | 搜索/面板 | `openSearch is function` |
| E6 | S6.1 | Hook 引入 | `5 hooks imported` |
| E6 | S6.2 | 删除旧代码 | `CanvasPage < 300 lines` |
| E6 | S6.3 | 回归测试 | `all tests passed` |

**合计**: 6 Epic，19 Story，42 条 expect() 断言

---

## 4. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Day 1 AM | E1 useCanvasState | 3h | 画布状态 Hook 就绪 |
| Day 1 PM | E2 useCanvasStore | 2h | Store 封装就绪 |
| Day 2 AM | E3 useCanvasRenderer | 3h | 渲染 Hook 就绪 |
| Day 2 PM | E4 useAIController | 4h | AI 编排 Hook 就绪 |
| Day 3 AM | E5 useCanvasEvents | 3h | 事件 Hook 就绪 |
| Day 3 PM | E6 第一阶段（引Hook） | 2h | 所有 Hook 引入 |
| Day 4 | E6 第二阶段（删代码） | 2h | CanvasPage < 300 行 |

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 可维护性 | CanvasPage < 300 行，单个 Hook < 200 行 |
| 可测试性 | 每个 Hook 覆盖率 > 70%，核心 Hook > 80% |
| 兼容性 | 重构后三树渲染、抽屉、原型阶段与重构前完全一致 |
| 性能 | Hook 拆分不引入额外渲染开销 |

---

## 6. 实施约束

- **R6 严格执行**：Epic 6 分两阶段（先添加引用验证，再删除旧代码）
- 新 Hook 只读 Store，通过现有 store action 写入
- 每个 Epic 独立 commit，便于回滚
- Epic 6 合入前必须运行全部测试套件
