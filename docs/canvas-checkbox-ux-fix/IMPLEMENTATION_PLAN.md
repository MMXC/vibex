# Implementation Plan: Canvas Checkbox UX 修复

**项目**: canvas-checkbox-ux-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Sprint 排期

| Epic | 内容 | 工时 |
|------|------|------|
| E1 | BoundedContextTree 卡片修复 | 1h |
| E2 | ComponentTree checkbox 位置修正 | 0.5h |
| E4 | CSS 清理 | 0.5h |
| **总计** | | **2h** |

---

## E1: BoundedContextTree 卡片修复（1h）

### 步骤 1.1: 合并双 checkbox 为 toggle

**文件**: `src/components/canvas/BoundedContextTree.tsx`

```tsx
// Before: 2 checkboxes
<input type="checkbox" className={styles.selectionCheckbox} />
<input type="checkbox" className={styles.confirmCheckbox} />

// After: 1 checkbox toggle
<input
  type="checkbox"
  className={styles.confirmCheckbox}
  checked={node.status === 'confirmed'}
  onChange={() => toggleContextNode(node.nodeId)}
/>
```

### 步骤 1.2: 删除 nodeTypeBadge

删除 `<div className={styles.nodeTypeBadge} ... />`

### 步骤 1.3: 删除 confirmedBadge

删除 `{node.status === 'confirmed' && <span className={styles.confirmedBadge}>✓</span>}`

### 步骤 1.4: 添加 toggleContextNode 到 canvasStore

如果 toggleContextNode 不存在，添加到 canvasStore。

---

## E2: ComponentTree checkbox 位置修正（0.5h）

### 步骤 2.1: checkbox 前移到标题前

**文件**: `src/components/canvas/ComponentTree.tsx`

```tsx
// Before
<div className={styles.nodeCardHeader}>
  <div className={styles.nodeTypeBadge} />
  <input type="checkbox" />
  <span className={styles.nodeTitle} />
</div>

// After
<div className={styles.nodeCardHeader}>
  <input type="checkbox" className={styles.confirmCheckbox} />
  <span className={styles.nodeTitle} />
</div>
```

### 步骤 2.2: 删除 nodeTypeBadge

删除 `<div className={styles.nodeTypeBadge} ... />`

---

## E4: CSS 清理（0.5h）

### 步骤 4.1: 删除废弃样式

**文件**: `src/components/canvas/canvas.module.css`

删除：
- `.nodeTypeBadge` 样式块
- `.confirmedBadge` 样式块

保留：
- `.confirmCheckbox` 样式（复用）
- `.nodeConfirmed` / `.nodeError` / `.nodeUnconfirmed` border 颜色（表示确认/type 状态）

---

## 验收清单

- [ ] BoundedContextTree 只有 1 个 checkbox
- [ ] BoundedContextTree 无 nodeTypeBadge
- [ ] BoundedContextTree 无 confirmedBadge
- [ ] ComponentTree checkbox 在标题同一行
- [ ] ComponentTree 无 nodeTypeBadge
- [ ] `.nodeTypeBadge` / `.confirmedBadge` CSS 已删除
- [ ] `npm test` 通过
- [ ] `npm run build` 通过
