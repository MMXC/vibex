# Canvas 阶段导航和工具栏问题分析（修订版）

**项目**: canvas-phase-nav-and-toolbar-issues
**角色**: analyst
**日期**: 2026-04-04
**状态**: ✅ 分析完成

**用户聚焦**: 统一工具栏（位置/大小/事件）+ 只保留 TabBar 作为阶段导航

---

## 执行摘要

| # | 问题 | 严重度 | 根因 |
|---|------|--------|------|
| 1 | 三栏按钮大小不一（28px vs 44px）| P1 | secondaryButton ~44px，toolbarButton ~28px |
| 2 | 流程树缺全选/清空/删除事件 | P1 | flowStore 无 selectAll/clear/delete 方法 |
| 3 | 三栏 TreePanel.actions 不统一 | P1 | context 有导航按钮，flow 有（但不完整），component 无 |
| 4 | 阶段导航 4 层冗余 | P1 | PhaseProgressBar + TabBar + PhaseIndicator + PhaseLabelBar |

---

## 问题 1: 三栏按钮大小不一

### 根因

**CSS 尺寸对比**：

| 元素 | CSS 类 | Padding | 预估高度 | 状态 |
|------|--------|---------|---------|------|
| TreePanel 导航按钮 | `.secondaryButton` | `0.625rem 1.5rem` | ~44px | ✅ 达标 |
| UndoBar/ShortcutBar | `.toolbarButton` | `0.25rem 0.5rem` | ~28px | ❌ 过小 |
| TabBar Tab | `.tab` | `6px 14px` | ~30px | ⚠️ 偏小 |
| TabBar count badge | `.tabCount` | `0 4px` | 18px | ✅ |

**代码位置**:
- `secondaryButton`: `canvas.module.css` L840 — TreePanel.actions 内的按钮
- `toolbarButton`: `canvas.module.css` L3377 — UndoBar/ShortcutBar 的浮动工具栏
- `tab`: `TabBar.module.css` L14 — TabBar 切换栏

### 修复方案

```css
/* canvas.module.css */
// 统一 toolbarButton 尺寸（匹配 secondaryButton）
.toolbarButton {
  padding: 0.5rem 1rem;  /* 从 0.25rem 0.5rem 改为匹配 secondaryButton */
  min-height: 40px;       /* 新增：iOS 可访问性下限 44px */
  font-size: 0.875rem;    /* 从 0.75rem 改为 13px */
}

/* TabBar.module.css */
// 增大 Tab 按钮
.tab {
  padding: 8px 16px;      /* 从 6px 14px 改为稍大 */
  min-height: 40px;       /* 新增 */
}
```

---

## 问题 2: 流程树缺全选/清空/删除事件

### 根因

Store 方法对比：

| 操作 | contextStore | flowStore | componentStore |
|------|-------------|----------|---------------|
| selectAll | ✅ `selectAllNodes('context')` | ❌ 不存在 | ✅ `selectAll()` |
| clearSelection | ✅ `clearNodeSelection('context')` | ❌ 不存在 | ✅ `clearNodeSelection()` |
| deleteSelected | ✅ `deleteSelectedNodes('context')` | ❌ 不存在 | ✅ `deleteSelected()` |
| setNodes | ✅ `setContextNodes()` | ✅ `setFlowNodes()` | ✅ `setComponentNodes()` |

**contextStore** (L109-127): selectAllNodes/clearNodeSelection 只处理 `tree === 'context'`，不支持 flow/component
**flowStore**: 完全没有 selectAll/clear/delete 方法

### 修复方案

**步骤 1**: 在 flowStore 添加缺失方法

```typescript
// flowStore.ts
selectAll: () => set((s) => ({
  selectedNodeIds: s.flowNodes.map((n) => n.nodeId),
})),
clearNodeSelection: () => set({ selectedNodeIds: [] }),
deleteSelected: () => {
  const { selectedNodeIds, flowNodes } = get();
  if (selectedNodeIds.length === 0) return;
  const toDelete = new Set(selectedNodeIds);
  set({
    flowNodes: flowNodes.filter((n) => !toDelete.has(n.nodeId)),
    selectedNodeIds: [],
  });
},
```

**步骤 2**: 统一三栏工具栏组件

```tsx
// components/canvas/TreeToolbar.tsx
interface TreeToolbarProps {
  tree: TreeType;
  nodes: TreeNode[];
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  onContinue?: () => void | null;
  continueLabel?: string;
  continueDisabled?: boolean;
  generating?: boolean;
}

export function TreeToolbar({
  nodes, selectedCount,
  onSelectAll, onClearSelection, onDelete,
  onContinue, continueLabel, continueDisabled, generating,
}: TreeToolbarProps) {
  return (
    <div className={styles.treeToolbar}>
      <button
        type="button"
        className={styles.treeToolbarBtn}
        onClick={onSelectAll}
        disabled={nodes.length === 0}
        aria-label="全选"
        title="全选"
      >
        ◻ 全选
      </button>
      <button
        type="button"
        className={styles.treeToolbarBtn}
        onClick={onClearSelection}
        disabled={selectedCount === 0}
        aria-label="取消全选"
        title="取消全选"
      >
        ◻ 取消
      </button>
      <button
        type="button"
        className={`${styles.treeToolbarBtn} ${styles.dangerBtn}`}
        onClick={onDelete}
        disabled={selectedCount === 0}
        aria-label={`删除 ${selectedCount} 个节点`}
        title={`删除 ${selectedCount} 个节点`}
      >
        🗑 删除
      </button>
      {onContinue && (
        <>
          <span className={styles.toolbarDivider} />
          <button
            type="button"
            className={styles.continueBtn}
            onClick={onContinue}
            disabled={continueDisabled || generating}
            aria-label={continueLabel}
          >
            {generating ? '◌ 生成中...' : continueLabel}
          </button>
        </>
      )}
    </div>
  );
}
```

**步骤 3**: 应用到三栏 TreePanel

```tsx
// CanvasPage.tsx — 上下文树
actions={
  <TreeToolbar
    tree="context"
    nodes={contextNodes}
    selectedCount={selectedNodeIds.context.length}
    onSelectAll={() => useContextStore.getState().selectAllNodes('context')}
    onClearSelection={() => useContextStore.getState().clearNodeSelection('context')}
    onDelete={() => useContextStore.getState().deleteSelectedNodes('context')}
    onContinue={contextNodes.length > 0 ? () => autoGenerateFlows(...) : null}
    continueLabel="→ 继续 → 流程树"
    generating={flowGenerating}
  />
}

// CanvasPage.tsx — 流程树
actions={
  <TreeToolbar
    tree="flow"
    nodes={flowNodes}
    selectedCount={selectedNodeIds.flow.length}
    onSelectAll={() => useFlowStore.getState().selectAll()}
    onClearSelection={() => useFlowStore.getState().clearNodeSelection()}
    onDelete={() => useFlowStore.getState().deleteSelected()}
    onContinue={flowNodes.length > 0 ? handleContinueToComponents : null}
    continueLabel="继续 → 组件树"
    generating={componentGenerating}
  />
}

// CanvasPage.tsx — 组件树
actions={
  <TreeToolbar
    tree="component"
    nodes={componentNodes}
    selectedCount={selectedNodeIds.component.length}
    onSelectAll={() => useComponentStore.getState().selectAll()}
    onClearSelection={() => useComponentStore.getState().clearNodeSelection()}
    onDelete={() => useComponentStore.getState().deleteSelected()}
  />
}
```

---

## 问题 3: 阶段导航 4 层冗余（聚焦 TabBar）

### 根因

| 元素 | CSS 类 | 作用 | 是否保留 |
|------|---------|------|---------|
| PhaseProgressBar | `.phaseProgressBarWrapper` | 5 步进度条 | ❌ 删除 |
| TabBar | `.tabBarWrapper` | 三树切换（**保留**）| ✅ 唯一导航 |
| ProjectBar | `.projectBarWrapper` | 项目名/缩放 | ✅ 保留 |
| PhaseIndicator | `.phaseIndicatorWrapper` | 左上角浮层 | ❌ 删除 |
| PhaseLabelBar | `.phaseLabelBar` | 阶段文字标签 | ❌ 删除 |

**保留** `canvas-module__dPY-eW__tabBarWrapper`（即 `.tabBarWrapper`）作为唯一阶段导航。

### 修复方案

```tsx
// CanvasPage.tsx

// 删除 PhaseProgressBar 包装（phase !== 'input' 时）
// {phase !== 'input' && (
//   <div className={styles.phaseProgressBarWrapper}>
//     <PhaseProgressBar currentPhase={phase} onPhaseClick={handlePhaseClick} />
//     {phase !== 'input' && <TreeStatus />}
//   </div>
// )}

// 保留 TabBar
{phase !== 'input' && (
  <div className={styles.tabBarWrapper}>
    <TabBar />
  </div>
)}

// 保留 ProjectBar
{phase !== 'input' && (
  <div className={styles.projectBarWrapper}>
    <ProjectBar ... />
  </div>
)}

// 删除 PhaseIndicator（完全冗余）
// {phase !== 'input' && (
//   <div className={styles.phaseIndicatorWrapper}>
//     <PhaseIndicator ... />
//   </div>
// )}

// 删除 PhaseLabelBar（完全冗余）
// <div className={styles.phaseLabelBar}>...</div>
```

---

## CSS 统一工具栏样式

```css
/* canvas.module.css */

/* 统一工具栏按钮 */
.treeToolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  flex-wrap: wrap;
}

.treeToolbarBtn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;           /* 统一高度 ~36-40px */
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 36px;             /* 统一最小高度 */
}

.treeToolbarBtn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-hover);
}

.treeToolbarBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dangerBtn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.continueBtn {
  composes: treeToolbarBtn;
  background: rgba(99, 179, 237, 0.1);
  color: rgba(99, 179, 237, 1);
  border-color: rgba(99, 179, 237, 0.3);
}

.continueBtn:hover:not(:disabled) {
  background: rgba(99, 179, 237, 0.2);
}

.toolbarDivider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 4px;
}
```

---

## 工时估算

| 修复项 | 工时 | 风险 | 依赖 |
|--------|------|------|------|
| 1: CSS 统一按钮尺寸 | 0.5h | 低 | 无 |
| 2: flowStore 添加 selectAll/clear/delete | 1h | 中 | 需测试验证 |
| 3: 创建 TreeToolbar 组件 | 1h | 低 | 无 |
| 4: 应用到三栏 TreePanel | 0.5h | 低 | 步骤 3 完成 |
| 5: 删除冗余导航层（保留 TabBar） | 0.5h | 低 | TabBar 已存在 |
| **总计** | **3.5h** | — | — |

---

## 验收标准

1. **大小统一**: 三栏 TreeToolbar 按钮高度一致（36-40px），TabBar tab 按钮 40px
2. **事件绑定**: 三栏都有全选/取消/删除按钮，点击有效（选中节点后点击删除）
3. **位置统一**: 三栏工具栏都位于 TreePanel 头部下方，样式一致
4. **导航统一**: 阶段导航只剩 TabBar（`.tabBarWrapper`），其他导航层全部移除
5. **工具栏按钮文字**: 全选 / 取消 / 删除 / 继续·xxx（如适用）

---

**分析完成时间**: 2026-04-04 18:40 GMT+8
**分析时长**: ~25min（包含用户聚焦补充分析）
