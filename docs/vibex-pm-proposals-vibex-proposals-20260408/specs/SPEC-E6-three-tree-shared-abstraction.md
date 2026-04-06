# SPEC: E6 — 三树共享抽象重构

**Epic:** E6 — P2 架构优化：代码质量  
**Stories:** S6.1, S6.2, S6.3, S6.4  
**Owner:** dev + architect（architect 指导设计）  
**Estimated:** 8h

---

## 1. 概述

三树组件（`BoundedContextTree` / `BusinessFlowTree` / `ComponentTree`）各自独立实现，大量逻辑重复（TreeToolbar、DedupeButton、状态管理），总计超过 3700 行。本 Epic 抽取共享抽象，减少重复代码。

---

## 2. 重构目标

| 抽象 | 目标 | 预计减少行数 |
|------|------|------------|
| `TreeToolbar` | 抽取为独立组件 | 每个树减少 ~80 行 |
| `DedupeButton` | 抽取为共享组件 | 每个树减少 ~50 行 |
| `useTreeState` Hook | 抽取共享状态管理逻辑 | 每个树减少 ~60 行 |
| **合计** | | **~570 行** |

---

## 3. Story S6.1: TreeToolbar 组件抽取

### 3.1 现状分析

三树各自有 `TreeToolbar` JSX 结构：

```typescript
// BusinessFlowTree 中（参考实现）
<div className="tree-toolbar">
  <span className="toolbar-title">{title}</span>
  <div className="toolbar-actions">
    <button onClick={onGenerate} disabled={disabled}>生成</button>
    <button onClick={onDelete} disabled={deleteDisabled}>删除</button>
    <button onClick={onReset}>重置</button>
  </div>
</div>
```

Context Tree 和 Component Tree 仅有部分绑定。

### 3.2 抽取方案

**文件:** `src/components/common/TreeToolbar/index.tsx`（新建）

```typescript
export interface TreeToolbarProps {
  title: string;
  treeType: 'context' | 'flow' | 'component';
  onGenerate?: () => void;
  onDelete?: () => void;
  onReset?: () => void;
  disabled?: boolean;
  deleteDisabled?: boolean;
  resetDisabled?: boolean;
  generateLoading?: boolean;
}

export function TreeToolbar({
  title,
  treeType,
  onGenerate,
  onDelete,
  onReset,
  disabled = false,
  deleteDisabled = false,
  resetDisabled = false,
  generateLoading = false,
}: TreeToolbarProps) {
  return (
    <div
      className="tree-toolbar"
      data-testid={`${treeType}-tree-toolbar`}
      data-tree-type={treeType}
    >
      <span className="toolbar-title">{title}</span>
      <div className="toolbar-actions">
        {onGenerate && (
          <button
            data-testid={`${treeType}-tree-toolbar-generate`}
            onClick={onGenerate}
            disabled={disabled || generateLoading}
          >
            {generateLoading ? '生成中...' : '生成'}
          </button>
        )}
        {onDelete && (
          <button
            data-testid={`${treeType}-tree-toolbar-delete`}
            onClick={onDelete}
            disabled={deleteDisabled}
          >
            删除
          </button>
        )}
        {onReset && (
          <button
            data-testid={`${treeType}-tree-toolbar-reset`}
            onClick={onReset}
            disabled={resetDisabled}
          >
            重置
          </button>
        )}
      </div>
    </div>
  );
}
```

### 3.3 三树迁移

**BoundedContextTree:**
```typescript
// 之前
<div className="tree-toolbar">...</div>

// 之后
import { TreeToolbar } from '@/components/common/TreeToolbar';

<TreeToolbar
  title="限界上下文"
  treeType="context"
  onGenerate={handleGenerate}
  onDelete={handleDelete}
  onReset={handleReset}
  disabled={isGenerating}
  deleteDisabled={selectedCount === 0}
/>
```

**BusinessFlowTree:** 替换 JSX（保持功能不变）

**ComponentTree:** 替换 JSX + 绑定缺失的 `onDelete`

### 3.4 验收标准

```typescript
// 所有三树使用同一组件
const toolbars = screen.getAllByTestId(/tree-toolbar/);
expect(toolbars.length).toBe(3);

// 组件文件存在
const toolbarFile = readFileSync('src/components/common/TreeToolbar/index.tsx');
expect(toolbarFile).toContain('treeType');
```

---

## 4. Story S6.2: DedupeButton 共享抽取

### 4.1 抽取方案

**文件:** `src/components/common/DedupeButton/index.tsx`（新建）

```typescript
interface DedupeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function DedupeButton({ onClick, disabled = false, className = '' }: DedupeButtonProps) {
  return (
    <button
      className={`dedupe-btn ${className}`}
      onClick={onClick}
      disabled={disabled}
      data-testid="dedupe-btn"
      title="去除重复节点"
    >
      去重
    </button>
  );
}
```

三树各自移除重复的 `<button>去重</button>` JSX，替换为：

```typescript
<DedupeButton onClick={handleDedupe} disabled={dedupeDisabled} />
```

### 4.2 验收标准

```typescript
const dedupeBtns = screen.getAllByTestId('dedupe-btn');
expect(dedupeBtns.length).toBe(3); // 三树共用
```

---

## 5. Story S6.3: useTreeState Hook 抽取

### 5.1 抽取方案

三树共享的状态管理逻辑：

```typescript
// src/hooks/useTreeState.ts
import { useState, useCallback } from 'react';

export interface TreeNode {
  id: string;
  label: string;
  // ... 公共字段
}

export interface UseTreeStateOptions {
  treeType: 'context' | 'flow' | 'component';
  initialNodes?: TreeNode[];
  onNodesChange?: (nodes: TreeNode[]) => void;
}

export function useTreeState({
  treeType,
  initialNodes = [],
  onNodesChange,
}: UseTreeStateOptions) {
  const [nodes, setNodes] = useState<TreeNode[]>(initialNodes);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSelection = useCallback((id: string, multi?: boolean) => {
    setSelectedIds((prev) => {
      if (multi) {
        return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      }
      return prev.includes(id) && prev.length === 1 ? [] : [id];
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const deleteSelectedNodes = useCallback(() => {
    setNodes((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
    setSelectedIds([]);
    onNodesChange?.(nodes.filter((n) => !selectedIds.includes(n.id)));
  }, [selectedIds, nodes, onNodesChange]);

  return {
    nodes,
    setNodes,
    selectedIds,
    expandedIds,
    isLoading,
    setIsLoading,
    toggleSelection,
    toggleExpand,
    deleteSelectedNodes,
  };
}
```

### 5.2 三树迁移

```typescript
// BoundedContextTree
const {
  nodes, selectedIds, isLoading, toggleSelection,
  deleteSelectedNodes, setNodes,
} = useTreeState({ treeType: 'context' });
```

### 5.3 验收标准

```typescript
// Hook 存在且类型正确
const hookFile = readFileSync('src/hooks/useTreeState.ts');
expect(hookFile).toContain('treeType');
expect(hookFile).toContain('deleteSelectedNodes');
```

---

## 6. Story S6.4: 回归测试验证

### 6.1 测试覆盖

**文件:** `e2e/canvas/tree-shared-abstraction.spec.ts`

```typescript
test('all three trees render TreeToolbar correctly', async ({ page }) => {
  await page.goto('/canvas');
  await expect(page.getByTestId('context-tree-toolbar')).toBeVisible();
  await expect(page.getByTestId('flow-tree-toolbar')).toBeVisible();
  await expect(page.getByTestId('component-tree-toolbar')).toBeVisible();
});

test('dedupe button works on all trees', async ({ page }) => {
  await page.goto('/canvas');
  const dedupeBtns = await page.getByTestId('dedupe-btn').all();
  expect(dedupeBtns.length).toBe(3);
  // 每个去重按钮可点击
  for (const btn of dedupeBtns) {
    await expect(btn).toBeEnabled();
  }
});
```

### 6.2 代码行数统计

```bash
# 重构前
wc -l src/components/BoundedContextTree/index.tsx \
       src/components/BusinessFlowTree/index.tsx \
       src/components/ComponentTree/index.tsx

# 重构后（目标各自减少 ≥30%）
# BoundedContextTree: ~370 → ~259 lines
# BusinessFlowTree: ~380 → ~266 lines
# ComponentTree: ~360 → ~252 lines
```

---

## 7. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 重构破坏现有功能 | 每步迁移后运行 E2E 测试 |
| Hook 类型不兼容 | TypeScript 严格模式 + 编译检查 |
| 三树行为略有差异 | Hook 提供 `options` 参数允许个性化 |

---

## 8. 架构决策记录 (ADR)

| ID | 决策 | 理由 |
|----|------|------|
| ADR-001 | Hook 而非 HOC | Hook 更灵活，避免嵌套地狱 |
| ADR-002 | TreeToolbar 用 `treeType` prop 而非多态 | 简化类型定义，便于扩展 |
| ADR-003 | DedupeButton 抽取但保持简单 | 避免过度抽象，保持可读性 |
