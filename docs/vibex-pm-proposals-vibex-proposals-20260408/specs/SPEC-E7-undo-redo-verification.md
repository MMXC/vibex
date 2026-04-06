# SPEC: E7 — Undo/Redo 功能验证与修复

**Epic:** E7 — P2 架构优化：功能完整性  
**Stories:** S7.1, S7.2, S7.3, S7.4  
**Owner:** dev + tester（tester 主导验证）  
**Estimated:** 4h

---

## 1. 概述

`UndoBar.tsx` 存在大量 `as any`（vibex-ts-any-cleanup），`recordSnapshot` 已添加但未验证完整链路。本 Epic 验证 Undo/Redo 操作路径，修复断点，并确保快捷键支持。

---

## 2. 现状分析

**已有基础设施:**
- `snapshotStore`: 管理 `history[]` 数组和 `currentIndex`
- `recordSnapshot(action)`: 记录操作到 history
- `undo()` / `redo()`: 在 store 中实现
- `UndoBar.tsx`: UI 组件（但可能有类型问题）

**问题:**
- `recordSnapshot` 在哪些操作中被调用？（S7.1 验证）
- `undo()` / `redo()` 是否正确触发 UI 更新？（S7.2 验证）
- 快捷键未绑定（S7.3 实现）

---

## 3. Story S7.1: Snapshot 链路验证

### 3.1 验证任务

**检查文件:** `src/stores/snapshotStore.ts`

```typescript
interface SnapshotStore {
  history: Snapshot[];
  currentIndex: number;
  recordSnapshot: (action: SnapshotAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

**验证哪些操作触发 `recordSnapshot`:**
1. 节点添加（Context / Flow / Component）
2. 节点删除
3. 节点编辑（label 修改）
4. 节点移动/重排序

**搜索调用点:**
```bash
grep -rn "recordSnapshot" src/
```

### 3.2 验证结果

预期发现（基于 Git history `0c7c2bb6`）：
- ✅ 节点删除已调用
- ❓ 节点添加（需验证）
- ❓ 节点编辑（需验证）
- ❌ 节点移动（需补充）

### 3.3 实现方案（如需补充）

**文件:** `src/components/BoundedContextTree/index.tsx`

```typescript
const handleAddNode = (newNode: TreeNode) => {
  setNodes((prev) => [...prev, newNode]);
  useSnapshotStore.getState().recordSnapshot({
    type: 'node_add',
    treeType: 'context',
    nodeId: newNode.id,
    timestamp: Date.now(),
  });
};

const handleEditNode = (nodeId: string, newLabel: string) => {
  setNodes((prev) =>
    prev.map((n) => (n.id === nodeId ? { ...n, label: newLabel } : n))
  );
  useSnapshotStore.getState().recordSnapshot({
    type: 'node_edit',
    treeType: 'context',
    nodeId,
    before: { label: nodes.find((n) => n.id === nodeId)?.label },
    after: { label: newLabel },
    timestamp: Date.now(),
  });
};
```

### 3.4 验收标准

```typescript
// 单元测试验证 recordSnapshot 被调用
const snapshotStore = useSnapshotStore.getState();
const initialCount = snapshotStore.history.length;

act(() => {
  addNode({ id: 'test', label: 'Test' });
});

expect(useSnapshotStore.getState().history.length).toBe(initialCount + 1);
expect(useSnapshotStore.getState().history.at(-1)).toMatchObject({
  type: 'node_add',
  treeType: 'context',
});
```

---

## 4. Story S7.2: Undo/Redo UI 状态

### 4.1 实现方案

**文件:** `src/components/UndoBar/index.tsx`

```typescript
import { useSnapshotStore } from '@/stores/snapshotStore';

export function UndoBar() {
  const { undo, redo, canUndo, canRedo, history, currentIndex } = useSnapshotStore();

  if (history.length === 0) return null;

  const stepsFromStart = currentIndex + 1;
  const stepsFromEnd = history.length - currentIndex - 1;

  return (
    <div className="undo-bar" data-testid="undo-bar">
      <button
        data-testid="undo-btn"
        onClick={undo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
      >
        ↩ 撤销
      </button>
      <span className="undo-indicator" data-testid="undo-indicator">
        {stepsFromStart}/{history.length}
      </span>
      <button
        data-testid="redo-btn"
        onClick={redo}
        disabled={!canRedo}
        title="重做 (Ctrl+Shift+Z)"
      >
        重做 ↪
      </button>
    </div>
  );
}
```

### 4.2 验收标准

```typescript
// 有历史时显示
act(() => {
  addNode({ id: 'test', label: 'Test' });
});
expect(screen.getByTestId('undo-bar')).toBeVisible();
expect(screen.getByTestId('undo-btn')).not.toBeDisabled();
expect(screen.getByText('撤销')).toBeInTheDocument();

// 无历史时隐藏
expect(screen.queryByTestId('undo-bar')).toBeNull();
```

---

## 5. Story S7.3: 快捷键支持

### 5.1 实现方案

**文件:** `src/hooks/useUndoRedoShortcuts.ts`（新建）

```typescript
import { useEffect } from 'react';
import { useSnapshotStore } from '@/stores/snapshotStore';

export function useUndoRedoShortcuts() {
  const { undo, redo, canUndo, canRedo } = useSnapshotStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z 或 Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (!canUndo) return;
        // 防止 textarea 等原生撤销
        const target = e.target as HTMLElement;
        if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z 或 Cmd+Shift+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        if (!canRedo) return;
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}
```

**集成到 CanvasPage:**
```typescript
useUndoRedoShortcuts();
```

### 5.2 验收标准

```typescript
// Playwright 手动测试
test('keyboard shortcut: Ctrl+Z triggers undo', async ({ page }) => {
  await page.goto('/canvas');
  // 添加节点
  await addNode(page, 'TestNode');
  expect(await page.getByText('TestNode')).toBeVisible();
  // Ctrl+Z
  await page.keyboard.press('Control+z');
  await expect(page.getByText('TestNode')).not.toBeVisible();
});

test('keyboard shortcut: Ctrl+Shift+Z triggers redo', async ({ page }) => {
  await page.goto('/canvas');
  await addNode(page, 'TestNode');
  await page.keyboard.press('Control+z');
  await expect(page.getByText('TestNode')).not.toBeVisible();
  await page.keyboard.press('Control+Shift+z');
  await expect(page.getByText('TestNode')).toBeVisible();
});
```

---

## 6. Story S7.4: E2E Undo/Redo 测试

### 6.1 测试文件

**文件:** `e2e/canvas/undo-redo.spec.ts`

```typescript
test.describe('Undo/Redo functionality', () => {
  test('full undo-redo cycle', async ({ page }) => {
    await page.goto('/canvas');
    // 添加节点
    await addContextNode(page, 'Node A');
    await expect(page.getByText('Node A')).toBeVisible();
    await expect(page.getByTestId('undo-bar')).toBeVisible();
    await expect(page.getByTestId('undo-indicator')).toContainText('1/');

    // 撤销
    await page.click('[data-testid="undo-btn"]');
    await expect(page.getByText('Node A')).not.toBeVisible();
    await expect(page.getByTestId('undo-btn')).toBeDisabled();

    // 重做
    await page.click('[data-testid="redo-btn"]');
    await expect(page.getByText('Node A')).toBeVisible();
    await expect(page.getByTestId('redo-btn')).toBeDisabled();
  });

  test('undo via keyboard shortcut', async ({ page }) => {
    await page.goto('/canvas');
    await addContextNode(page, 'Node B');
    await page.keyboard.press('Control+z');
    await expect(page.getByText('Node B')).not.toBeVisible();
  });

  test('redo via keyboard shortcut', async ({ page }) => {
    await page.goto('/canvas');
    await addContextNode(page, 'Node C');
    await page.keyboard.press('Control+z');
    await expect(page.getByText('Node C')).not.toBeVisible();
    await page.keyboard.press('Control+Shift+z');
    await expect(page.getByText('Node C')).toBeVisible();
  });

  test('undo bar hidden when no history', async ({ page }) => {
    await page.goto('/canvas');
    await expect(page.queryByTestId('undo-bar')).toBeNull();
  });
});
```

### 6.2 Snapshot 测试覆盖率

```typescript
// 测试所有操作类型的 snapshot 记录
test('all operations trigger snapshot', () => {
  const { history } = useSnapshotStore.getState();
  const initialLen = history.length;

  // 添加
  act(() => addContextNode({ id: 'x', label: 'X' }));
  expect(useSnapshotStore.getState().history.length).toBe(initialLen + 1);

  // 编辑
  act(() => editContextNode('x', 'X-modified'));
  expect(useSnapshotStore.getState().history.length).toBe(initialLen + 2);

  // 删除
  act(() => deleteContextNode('x'));
  expect(useSnapshotStore.getState().history.length).toBe(initialLen + 3);
});
```

---

## 7. 依赖与风险

| 项目 | 说明 |
|------|------|
| 依赖 | `snapshotStore`（已有）；`UndoBar` 组件（需确认无破坏性类型问题）|
| 风险 | `Ctrl+Z` 与 textarea 默认行为冲突 → 使用 `e.preventDefault` 仅在 Canvas 场景生效 |
| 回滚方案 | 禁用 `useUndoRedoShortcuts`，回退到纯按钮操作 |
