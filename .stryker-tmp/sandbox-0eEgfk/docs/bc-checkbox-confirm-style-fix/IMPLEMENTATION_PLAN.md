# Implementation Plan: BoundedContext Checkbox Confirm Style Fix

**项目**: bc-checkbox-confirm-style-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## E1: BoundedContextTree Checkbox 修复（1.5h）

### 步骤 1: 删除 selectionCheckbox

**文件**: `src/components/canvas/BoundedContextTree.tsx`

删除 `<input className={styles.selectionCheckbox} />` 和相关 SVG wrapper。

### 步骤 2: 修正 confirmCheckbox

```tsx
<input
  type="checkbox"
  className={styles.confirmCheckbox}
  checked={node.status === 'confirmed'}
  onChange={() => toggleContextNode(node.nodeId)}
/>
```

### 步骤 3: checkbox 移到标题同行

确保 `<h4 className={styles.nodeTitle}>` 与 checkbox 在同一 flex 行。

### 步骤 4: 验证边框变色

confirmed 状态 → `border-color: var(--color-success)` 绿色边框。

### 步骤 5: 测试

```bash
npm test -- --testPathPattern="BoundedContextTree"
```

---

## 验收清单

- [x] 只有 1 个 checkbox（commit 17719536, canvas-checkbox-ux-fix Epic1）
- [x] checkbox 与标题同一行（commit 17719536）
- [x] 无 position: absolute checkbox（旧的 selectionCheckbox 已删除）
- [x] confirmed → 绿色边框（.nodeConfirmed border-color: var(--color-success)）
- [x] pending → type-specific border colors（core=橙色/supporting=蓝色/generic=灰色/external=紫色）
- [x] toggle 双向切换（toggleContextNode 实现）
- [x] npm test 通过（8/8 tests pass, BoundedContextTree.test.tsx）
