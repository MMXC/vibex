# Implementation Plan — VibeX Canvas Implementation Fix

**Project**: vibex-canvas-implementation-fix
**Agent**: Architect
**Date**: 2026-04-11
**Code Baseline**: `79ebe010`

---

## Sprint 0: Epic 1 — BugFix Sprint (~3.5h)

### 依赖关系图

```
S1-1 ──────────────┐
S1-3 ──┐           │
S1-4 ──┤           │
S1-5 ──┤           │
S1-6 ──┤           │
S1-7 ──┤           │  无相互依赖，可并行
S1-8 ──┤           │
S1-9 ──┘           │
                    │
S1-2 ──────────────┘  (需 OQ-1 澄清)
```

**执行策略**: 8 个无前置 story 并行执行；S1-2 单独排队（等 OQ-1）

---

### S1-1: handleRegenerateContexts 闭包修复 ✅

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx:222-245`
**优先级**: P0 | **工时**: 0.5h | **状态**: ✅ DONE — 提交 63a4f939（S1-7 同一提交中修复）

#### 步骤

1. 找到 `handleRegenerateContexts = useCallback(..., [])` 的定义位置
2. 将空依赖数组 `[]` 替换为 `[aiThinking, isQuickGenerating, requirementText, toast]`
3. 确认同一文件内的 `eslint-disable-line react-hooks/exhaustive-deps` 注释可以移除（或保留如果仍有其他 lint 问题）
4. 运行 `vitest run` 确认无回归
5. gstack E2E: 手动连续点击"重新生成"按钮，验证防重入生效

#### 验收标准

```bash
# 类型检查
tsc --noEmit  # 退出码 0

# ESLint 无 exhaustive-deps 警告
npx eslint src/components/canvas/CanvasPage.tsx --rule 'react-hooks/exhaustive-deps: error'

# 代码确认
grep -n "handleRegenerateContexts = useCallback" src/components/canvas/CanvasPage.tsx
# 应找到 [aiThinking, isQuickGenerating, requirementText, toast] 依赖
```

---

### S1-2: useCanvasRenderer 类型安全化

**文件**: `vibex-fronted/src/hooks/canvas/useCanvasRenderer.ts:178-195` + `src/lib/canvas/types.ts`
**优先级**: P0 | **工时**: 1h | **可执行**: ⏳ 等待 OQ-1 澄清

#### 步骤

1. 读取 `types.ts`，找到 `BusinessFlowNode` 和 `ComponentNode` 定义
2. 为两者各添加可选字段：
   ```typescript
   isActive?: boolean
   parentId?: string
   children?: string[]
   ```
3. 在 `useCanvasRenderer.ts` 中找到三处 `as unknown as` 断言
4. 替换为直接字段访问（参考架构文档 Section 3.3）
5. `tsc --noEmit` 验证无新增类型错误
6. Vitest: 运行 `useCanvasRenderer` 相关测试

#### 验收标准

```bash
tsc --noEmit  # 退出码 0
grep "as unknown as" src/hooks/canvas/useCanvasRenderer.ts  # 应无输出
grep -E "isActive\?: boolean" src/lib/canvas/types.ts  # 应有输出（2 处）
```

---

### S1-3: isExporting 响应式化 ✅

**文件**: `vibex-fronted/src/hooks/canvas/useCanvasExport.ts`
**优先级**: P1 | **工时**: 0.25h | **状态**: ✅ DONE — 提交 b466b8e3

#### 步骤

1. 在 `useCanvasExport.ts` 中找到 `isExportingRef` 和 `isExporting = isExportingRef.current`
2. 添加 `useState(false)` 声明
3. 将 `setIsExporting(true/false)` 替换 `isExportingRef.current = true/false`
4. 保留 `isExportingRef` 仅用于内部防重入逻辑（如需要）
5. Vitest + gstack 验证按钮 disabled 状态

#### 验收标准

```bash
grep -n "const \[isExporting, setIsExporting\]" src/hooks/canvas/useCanvasExport.ts
grep "as isExportingRef.current" src/hooks/canvas/useCanvasExport.ts  # 应无
```

---

### S1-4: searchTimeMs 响应式化 ✅

**文件**: `vibex-fronted/src/hooks/canvas/useCanvasSearch.ts`
**优先级**: P1 | **工时**: 0.25h | **状态**: ✅ DONE — 提交 68d8f847

#### 步骤

1. 在 `useCanvasSearch.ts` 中找到 `searchTimeRef` 和 `searchTimeMs = searchTimeRef.current`
2. 添加 `useState<number | null>(null)` 声明
3. 将 `setSearchTimeMs(searchTimeRef.current)` 替换 ref 直接赋值
4. 保留 `searchTimeRef` 仅作防重入计数用（如需要）
5. Vitest 验证耗时显示更新

#### 验收标准

```bash
grep -n "const \[searchTimeMs, setSearchTimeMs\]" src/hooks/canvas/useCanvasSearch.ts
grep "as searchTimeRef.current" src/hooks/canvas/useCanvasSearch.ts  # 应无
```

---

### S1-5: 版本轮询稳定性修复 ✅

**文件**: `vibex-fronted/src/hooks/canvas/useAutoSave.ts`
**优先级**: P1 | **工时**: 0.5h | **状态**: ✅ DONE — 提交 8ddeb94d

#### 步骤

1. 在 `useAutoSave.ts` 中找到版本轮询 `useEffect`（约 line 343）
2. 确认 `}, [projectId, saveStatus])` 的位置
3. 移除 `saveStatus`，改为 `}, [projectId])`
4. 移除同行的 `eslint-disable-line react-hooks/exhaustive-deps`（如存在）
5. `tsc --noEmit` 验证
6. 手动测试：开启 Canvas，多次触发保存，观察版本轮询日志稳定输出

#### 验收标准

```bash
# 依赖数组仅剩 projectId
grep -A1 "setInterval.*polling\|pollingInterval" src/hooks/canvas/useAutoSave.ts | grep "\[projectId\]"

# 无 saveStatus 依赖
grep "\[projectId, saveStatus\]" src/hooks/canvas/useAutoSave.ts  # 应无
```

---

### S1-6: lastSnapshotVersionRef 实例隔离 ✅

**文件**: `vibex-fronted/src/hooks/canvas/useAutoSave.ts`
**优先级**: P1 | **工时**: 0.25h | **状态**: ✅ DONE — 提交 8ddeb94d

#### 步骤

1. 在 `useAutoSave.ts` 顶部找到 `const lastSnapshotVersionRef = { current: 0 }`
2. 将其移入 `useAutoSave` hook 函数体内
3. 改为 `const lastSnapshotVersionRef = useRef(0)`
4. 确保 `useRef` 已从 React 导入
5. `tsc --noEmit` 验证
6. 手动双标签页测试

#### 验收标准

```bash
# 模块级单例不存在
grep "^const lastSnapshotVersionRef" src/hooks/canvas/useAutoSave.ts  # 应无

# useRef 声明存在
grep "lastSnapshotVersionRef = useRef" src/hooks/canvas/useAutoSave.ts  # 应有
```

---

### S1-7: renderContextTreeToolbar 记忆化 ✅

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`
**优先级**: P1 | **工时**: 0.25h | **状态**: ✅ DONE — 提交 63a4f939（含 S1-1 handleRegenerateContexts deps 修复）

#### 步骤

1. 在 `CanvasPage.tsx` 中找到 `renderContextTreeToolbar` 函数定义（约 line 342-363）
2. 用 `useCallback` 包裹
3. 分析其内部使用的变量，补全依赖数组
4. `tsc --noEmit` + `vitest run` 验证
5. React DevTools 手动验证：无关状态变化不触发重渲染

#### 验收标准

```bash
grep "renderContextTreeToolbar = useCallback" src/components/canvas/CanvasPage.tsx
```

---

### S1-8: projectName 从 store 初始化 ✅

**文件**: `vibex-fronted/src/hooks/canvas/useCanvasPanels.ts`
**优先级**: P1 | **工时**: 0.25h | **状态**: ✅ DONE — 提交 b7d725d3

#### 步骤

1. 在 `useCanvasPanels.ts` 中找到 `useState('我的项目')`
2. 导入 `useSessionStore`（如果未导入）
3. 改为 `const session = useSessionStore(); const [projectName, setProjectName] = useState(session.projectName || '我的项目')`
4. `tsc --noEmit` 验证
5. gstack: 打开已有项目页面，验证 projectName 不再显示"我的项目"

#### 验收标准

```bash
grep "useState('我的项目')" src/hooks/canvas/useCanvasPanels.ts  # 应无
grep "sessionStore" src/hooks/canvas/useCanvasPanels.ts  # 应有
```

---

### S1-9: Store 循环依赖修复 ✅

**文件**: `vibex-fronted/src/lib/canvas/stores/contextStore.ts`
**优先级**: P1 | **工时**: 0.5h | **状态**: ✅ DONE — 提交 e307ce2b

#### 步骤

1. 在 `contextStore.ts` 中找到 `import { useFlowStore } from './flowStore'`
2. 删除该 import
3. 在文件顶部添加延迟获取函数：
   ```typescript
   const getFlowStore = () => require('./flowStore').useFlowStore
   ```
4. 找到所有 `useFlowStore.getState()` 调用处
5. 改为 `getFlowStore().getState()`
6. `tsc --noEmit` 验证
7. 浏览器控制台验证无循环依赖警告

#### 验收标准

```bash
grep "import.*useFlowStore" src/lib/canvas/stores/contextStore.ts  # 应无
grep "getFlowStore().getState()" src/lib/canvas/stores/contextStore.ts  # 应有
```

---

## Sprint 1: Epic 2 — SSE 流式生成 (~2-3 days)

### 启动前置

- [x] OQ-2: Dev 验证 `/api/v1/canvas/stream` 后端可用（生产环境 https://api.vibex.top 可用）
- [x] OQ-3: PM 确认降级策略（fallbackToSyncGenerate）

### S2-1: SSE 流式接入

**文件**: `vibex-fronted/src/hooks/canvas/useAIController.ts`
**优先级**: P0 | **工时**: 2-3 days | **状态**: 🔄 Phase 1 完成 — 提交 cd1814a8

#### Phase 1: SSE 基础设施接入 (Day 1)

1. 导入 `canvasSseApi`
2. 定义 `GeneratingState` 类型
3. 用 `useState<GeneratingState>('idle')` 替换现有 generating boolean
4. 在 `handleRegenerateContexts` 中调用 `canvasSseApi.streamGenerate`
5. 实现所有回调：`onThinking`/`onStepContext`/`onStepModel`/`onStepFlow`/`onStepComponents`/`onDone`/`onError`
6. `tsc --noEmit` 验证

#### Phase 2: UI 状态联动 (Day 2)

1. 将 `GeneratingState` 暴露给 CanvasPage
2. 确认/新增 `data-testid="ai-thinking"` 的 AI Thinking 面板
3. 按钮状态根据 `generatingState` 控制 disabled
4. `done`/`error`/`fallback` 状态 UI 反馈
5. Vitest: 模拟 SSE 事件流

#### Phase 3: 降级策略 + 回归 (Day 3)

1. 实现 `fallbackToSyncGenerate` 函数（调用 `canvasApi.generateContexts`）
2. 在 `onError` 回调中触发降级
3. 降级时显示 "同步模式" 提示
4. gstack E2E: happy path + SSE 失败降级 path
5. 全量回归: CanvasPage 所有功能

#### 验收标准

```bash
# 类型安全
tsc --noEmit  # 退出码 0

# SSE 接入确认
grep "canvasSseApi.streamGenerate" src/hooks/canvas/useAIController.ts

# gstack E2E
# 1. Thinking 面板可见
# 2. 树节点流式填充 (timeout: 60s)
# 3. 完成状态显示
# 4. SSE 失败自动降级
```

---

## Sprint 2: Epic 3 — CSS 架构重构 (~1 day)

### S3-1: CSS 按组件拆分

**文件**: `vibex-fronted/src/components/canvas/canvas.module.css`
**优先级**: P2 | **工时**: ~1 day | **可执行**: ✅ 立即

#### 步骤

1. **拍基准截图** (gstack): Canvas 全页面 + 6 个区域组件截图，命名 `-baseline-` 前缀
2. **建立 11 个子文件**:
   ```
   canvas.base.module.css         (~200行: CSS变量、:root、全局布局)
   canvas.toolbar.module.css     (~300行: 工具栏按钮、图标)
   canvas.trees.module.css       (~500行: 三树通用节点样式)
   canvas.context.module.css     (~500行: ContextTree 专用)
   canvas.model.module.css       (~400行: ModelTree 专用)
   canvas.flow.module.css        (~600行: FlowTree 专用)
   canvas.components.module.css  (~500行: ComponentsTree 专用)
   canvas.panels.module.css       (~400行: 侧边面板、抽屉)
   canvas.thinking.module.css    (~200行: AI Thinking 动画)
   canvas.export.module.css      (~200行: 导出进度弹窗)
   canvas.misc.module.css        (~300行: Toast、错误、空状态)
   ```
3. **逐文件迁移**: 按上述顺序，每次迁移一个子文件的样式类到新文件
4. **在 canvas.module.css 顶部添加聚合**:
   ```css
   @use './canvas.base.module.css';
   @use './canvas.toolbar.module.css';
   /* ... */
   ```
5. **每次迁移后**: gstack 截图对比对应区域，确认无视觉差异
6. **清理 canvas.module.css**: 移至 < 500 行后，剩余样式归入 `canvas.misc.module.css`
7. **每个子文件独立 commit**

#### CSS 选择器归属规则

| 选择器前缀/特征 | 归属文件 |
|---------------|---------|
| `.canvas-root`, `.canvas-container`, `:root` 变量 | `canvas.base` |
| `.toolbar`, `.toolbar-btn`, `.icon-btn` | `canvas.toolbar` |
| `.tree-node`, `.tree-item`, `.tree-toggle` | `canvas.trees` |
| 含 `context`/`ctx` 的选择器 | `canvas.context` |
| 含 `model`/`mdl` 的选择器 | `canvas.model` |
| 含 `flow`/`process` 的选择器 | `canvas.flow` |
| 含 `component`/`comp` 的选择器 | `canvas.components` |
| `.panel`, `.drawer`, `.sidebar` | `canvas.panels` |
| `.thinking`, `.ai-thinking`, 打字动画 | `canvas.thinking` |
| `.export`, `.export-dialog`, `.export-progress` | `canvas.export` |
| `.toast`, `.error`, `.empty`, `.fallback` | `canvas.misc` |

#### 验收标准

```bash
# 主文件 < 500 行
wc -l src/components/canvas/canvas.module.css  # < 500

# 子文件数量
ls src/components/canvas/canvas.*.module.css | wc -l  # 12 (含主文件)

# 构建产物大小
# 打包后 canvas chunk CSS 增幅 < 5%

# gstack 截图对比
# 所有 baseline 截图与 refactored 截图像素差异 < 1%
```

---

## 依赖关系汇总

```
Epic 1 (Sprint 0)
├── S1-1 ── 独立
├── S1-2 ── 需 OQ-1 澄清
├── S1-3 ── 独立
├── S1-4 ── 独立
├── S1-5 ── 独立
├── S1-6 ── 独立
├── S1-7 ── 独立
├── S1-8 ── 独立
└── S1-9 ── 独立

Epic 2 (Sprint 1)
└── S2-1 ── 需 OQ-2 验证 + OQ-3 决策
            └── 依赖 S1-2 类型安全完成

Epic 3 (Sprint 2)
└── S3-1 ── 无外部依赖，可与 Epic 1/2 并行
```

---

## 工时汇总

| Epic | Story | 工时 |
|------|-------|------|
| Epic 1 | S1-1 handleRegenerateContexts | 0.5h |
| Epic 1 | S1-2 useCanvasRenderer 类型安全 | 1.0h |
| Epic 1 | S1-3 isExporting 响应式 | 0.25h |
| Epic 1 | S1-4 searchTimeMs 响应式 | 0.25h |
| Epic 1 | S1-5 版本轮询稳定性 | 0.5h |
| Epic 1 | S1-6 lastSnapshotVersionRef 隔离 | 0.25h |
| Epic 1 | S1-7 TreeToolbar 记忆化 | 0.25h |
| Epic 1 | S1-8 projectName 初始化 | 0.25h |
| Epic 1 | S1-9 Store 循环依赖 | 0.5h |
| **Epic 1 合计** | | **~3.5h** |
| Epic 2 | S2-1 SSE 流式接入 | ~2-3d |
| Epic 3 | S3-1 CSS 拆分 | ~1d |
