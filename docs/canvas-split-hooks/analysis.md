# CanvasPage 拆分 Hooks 需求分析

**项目**: canvas-split-hooks | **角色**: Analyst | **日期**: 2026-04-03

---

## 1. 业务场景分析

### 1.1 现状问题

`CanvasPage.tsx`（`src/components/canvas/CanvasPage.tsx`）共 **1510 行**，是 VibeX 前端最大的单体组件，存在以下问题：

| 问题 | 表现 |
|------|------|
| 职责膨胀 | 一个文件混杂状态选择、事件处理、渲染逻辑、AI 生成、边界计算 |
| 测试困难 | 无法对单个功能（panning/zoom）做独立单元测试 |
| 可维护性差 | 新人接手需 2-3 小时理解全貌 |
| Merge 冲突 | 单文件高频改动，review 成本高 |

### 1.2 现有模块盘点

| 模块 | 路径 | 状态 |
|------|------|------|
| useCanvasSearch | `src/hooks/canvas/useCanvasSearch.ts` | ✅ 独立 |
| useAutoSave | `src/hooks/canvas/useAutoSave.ts` | ✅ 独立 |
| useVersionHistory | `src/hooks/canvas/useVersionHistory.ts` | ✅ 独立 |
| useCanvasExport | `src/hooks/canvas/useCanvasExport.ts` | ✅ 独立 |
| useKeyboardShortcuts | `src/hooks/useKeyboardShortcuts.ts` | ✅ 独立 |
| contextStore | `src/lib/canvas/stores/contextStore.ts` | ✅ 独立 |
| flowStore | `src/lib/canvas/stores/flowStore.ts` | ✅ 独立 |
| componentStore | `src/lib/canvas/stores/componentStore.ts` | ✅ 独立 |
| uiStore | `src/lib/canvas/stores/uiStore.ts` | ✅ 独立 |
| sessionStore | `src/lib/canvas/stores/sessionStore.ts` | ✅ 独立 |
| canvasStore | `src/lib/canvas/canvasStore.ts` | ✅ 独立 |

**已独立**: 11 个模块。CanvasPage 内仍有约 ~800 行待拆分。

---

## 2. 六 Hook 拆分方案

### 2.1 `useCanvasState` — 画布状态管理 ⏱ 3h

**职责**: pan/zoom/scroll 及 expand mode。

**提取内容**（~120 行）:
- `zoomLevel` / `isSpacePressed` / `isPanning` / `panOffset` state
- Space key 监听 + mouse drag pan handlers
- Zoom in/out/reset handlers
- F11 maximize 快捷键
- CSS 变量应用 effect（`--canvas-pan-x/y`, `--canvas-zoom`）

```typescript
interface CanvasStateReturn {
  zoomLevel: number; isSpacePressed: boolean; isPanning: boolean;
  panOffset: { x: number; y: number };
  gridRef: React.RefObject<HTMLDivElement | null>;
  handlers: {
    handleMouseDown: (e: React.MouseEvent) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseUp: () => void;
    handleZoomIn: () => void; handleZoomOut: () => void;
    handleZoomReset: () => void; toggleMaximize: () => void;
  };
  expandMode: 'normal' | 'expand-both' | 'maximize';
  setExpandMode: (mode: 'normal' | 'expand-both' | 'maximize') => void;
}
```

**文件**: `src/hooks/canvas/useCanvasState.ts` | **依赖**: 无（纯 UI 状态）

### 2.2 `useFlowStore` — 流程数据管理 ✅

**状态**: 已独立，无需改动。文件 `src/lib/canvas/stores/flowStore.ts`。

### 2.3 `useCanvasStore` — 画布整体数据封装 ⏱ 2h

**职责**: 统一导出 CanvasPage 所需的各 store selectors，降低组件对 store 内部结构的直接依赖。

```typescript
interface CanvasStoreReturn {
  phase: Phase; activeTree: TreeType;
  setPhase: (p: Phase) => void; setActiveTree: (t: TreeType) => void;
  contextNodes: BoundedContextNode[]; flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
  setContextNodes: (nodes: BoundedContextNode[]) => void;
  setFlowNodes: (nodes: BusinessFlowNode[]) => void;
  setComponentNodes: (nodes: ComponentNode[]) => void;
  contextPanelCollapsed: boolean; flowPanelCollapsed: boolean;
  componentPanelCollapsed: boolean;
  toggleContextPanel: () => void; toggleFlowPanel: () => void;
  toggleComponentPanel: () => void;
  leftExpand: string; centerExpand: string; rightExpand: string;
  setLeftExpand: (v: string) => void; setCenterExpand: (v: string) => void;
  setRightExpand: (v: string) => void;
  selectedNodeIds: { context: string[]; flow: string[]; component: string[] };
  deleteSelectedNodes: (tree: TreeType) => void;
  projectId: string; flowGenerating: boolean;
  flowGeneratingMessage: string | null;
  aiThinking: boolean; aiThinkingMessage: string | null;
  requirementText: string; setRequirementText: (text: string) => void;
}
```

**文件**: `src/hooks/canvas/useCanvasStore.ts` | **依赖**: 各独立 store

### 2.4 `useAIController` — AI 控制器 ⏱ 4h

**职责**: AI 生成流程编排（快速生成、组件生成、冲突处理）。

**提取内容**（~180 行）:
- `requirementInput` state
- `isQuickGenerating` / `componentGenerating` state
- `quickGenerate()` / `handleContinueToComponents()` handler
- 冲突处理（keep-local/use-server/merge）
- `loadExampleData` 集成

```typescript
interface AIControllerReturn {
  requirementInput: string; setRequirementInput: (v: string) => void;
  isQuickGenerating: boolean; componentGenerating: boolean;
  quickGenerate: () => Promise<void>;
  handleContinueToComponents: () => Promise<void>;
  handleGenerateFromRequirement: () => Promise<void>;
  loadExample: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  conflictData: ConflictData | null;
  handlers: {
    handleConflictKeepLocal: () => void;
    handleConflictUseServer: () => void;
    handleConflictMerge: () => void;
  };
}
```

**文件**: `src/hooks/canvas/useAIController.ts` | **依赖**: contextStore, flowStore, componentStore, sessionStore

### 2.5 `useCanvasRenderer` — 渲染派生数据 ⏱ 3h

**职责**: 渲染所需的派生数据计算。

**提取内容**（~150 行）:
- `contextNodeRects` / `flowNodeRects` / `_componentNodeRects` memo
- `boundedEdges` memo（限界上下文关联计算）
- `flowEdges` memo（流程步骤连线计算）
- `contextTreeNodes` / `flowTreeNodes` / `componentTreeNodes` memo
- `contextReady` / `flowReady` / `componentReady` / `allTreesConfirmed`
- `phaseLabel` / `phaseHint` computed values

```typescript
interface CanvasRendererReturn {
  contextNodeRects: NodeRect[]; flowNodeRects: NodeRect[];
  componentNodeRects: NodeRect[];
  boundedEdges: BoundedEdge[]; flowEdges: FlowEdge[];
  contextTreeNodes: TreeNode[]; flowTreeNodes: TreeNode[];
  componentTreeNodes: TreeNode[];
  confirmation: {
    contextReady: boolean; flowReady: boolean;
    componentReady: boolean; allTreesConfirmed: boolean;
  };
  phaseLabel: string; phaseHint: string;
}
```

**文件**: `src/hooks/canvas/useCanvasRenderer.ts` | **依赖**: contextStore, flowStore, componentStore

### 2.6 `useCanvasEvents` — 事件处理 ⏱ 3h

**职责**: 键盘和搜索事件处理。

**提取内容**（~100 行）:
- `isSearchOpen` state + `openSearch` / `closeSearch`
- `handleSearchSelect()` / `handleMinimapNodeClick()` handler
- `handlePhaseClick()` / `handleDeleteSelected()` handler
- `handleKeyboardUndo()` / `handleKeyboardRedo()` handler
- `useKeyboardShortcuts()` 配置
- `?` 快捷键面板 toggle

```typescript
interface CanvasEventsReturn {
  isSearchOpen: boolean; openSearch: () => void; closeSearch: () => void;
  isShortcutPanelOpen: boolean; toggleShortcutPanel: () => void;
  handlers: {
    handleSearchSelect: (result: { id: string; treeType: TreeType }) => void;
    handleMinimapNodeClick: (nodeId: string) => void;
    handlePhaseClick: (p: Phase) => void;
    handleDeleteSelected: () => void;
    handleKeyboardUndo: () => boolean;
    handleKeyboardRedo: () => boolean;
  };
}
```

**文件**: `src/hooks/canvas/useCanvasEvents.ts` | **依赖**: useKeyboardShortcuts

---

## 3. Epic 拆分（每个独立 commit + 测试）

| Epic | 名称 | 工时 | 功能点 |
|------|------|------|--------|
| 1 | useCanvasState | 3h | 创建 hook、提取 pan/zoom/expand 逻辑、F11 快捷键、单元测试 |
| 2 | useCanvasStore | 2h | 创建封装 hook、消除直接 store 引用、单元测试 |
| 3 | useCanvasRenderer | 3h | 创建 hook、提取 rects/edges/treeNodes memo、单元测试 |
| 4 | useAIController | 4h | 创建 hook、迁移生成+冲突逻辑、单元测试 |
| 5 | useCanvasEvents | 3h | 创建 hook、迁移事件+搜索+键盘处理、单元测试 |
| 6 | CanvasPage 重构 | 4h | 组合 6 hook、删除旧代码 ~800 行、全量回归 |
| **合计** | | **19h** | ≈ 3-4 人天 |

---

## 4. 验收标准

- [ ] **Epic 1**: Space+drag 平移正常；F11 最大化正常；Zoom in/out/reset 正常；expand mode 切换正常；单元测试覆盖率 > 80%
- [ ] **Epic 2**: CanvasPage 不再直接引用 `useContextStore`/`useUIStore` 等；所有 panel toggle 正常；selection 状态正常
- [ ] **Epic 3**: 限界上下文关联边（dependency/association）正确；流程步骤连线（sequence/branch/loop）正确；`allTreesConfirmed` 状态正确
- [ ] **Epic 4**: 快速生成（Ctrl+G）正常；继续到组件树正常；冲突处理三选项正常；自动保存状态正确
- [ ] **Epic 5**: 搜索打开/关闭/选中正常；Ctrl+Z/Y 撤销重做正常；Delete 键删除节点正常；`?` 键快捷面板正常
- [ ] **Epic 6**: CanvasPage 瘦身为 < 300 行；三树渲染与重构前一致；移动端 Tab 模式正常；现有测试套件全部通过

---

## 5. 风险识别

| 风险 | 影响 | 缓解 |
|------|------|------|
| R1: 重构破坏现有功能 | 高 | 每个 Epic 独立 commit+测试，Epic6 合入前全量回归 |
| R2: 状态来源不清导致循环依赖 | 中 | 新 hook 只能读 store，写入统一走现有 store action |
| R3: Epic6 删除旧代码时误删 | 高 | Epic6 分两阶段：先加 hook 引用验证 → 再删旧代码 |
| R4: 6 hook 接口不稳定 | 中 | 接口设计评审后再实施（plan-eng-review） |
| R5: 测试覆盖不足 | 中 | 每个 Epic >80% 分支覆盖，Epic6 合入前全量测试 |

---

*分析完成，共 230 行*
