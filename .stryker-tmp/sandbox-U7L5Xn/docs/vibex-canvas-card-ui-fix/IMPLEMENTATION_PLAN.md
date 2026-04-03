# Implementation Plan: Canvas 卡片 UI 修复

**项目**: vibex-canvas-card-ui-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Sprint 排期（2h）

| Epic | 内容 | 工时 |
|------|------|------|
| E1 | BoundedContextTree 修复 | 1h |
| E2 | ComponentTree 修正 | 0.5h |
| E4 | CSS 清理 | 0.5h |

---

## E1: BoundedContextTree（1h）

### 1.1 合并双 checkbox 为 toggle

```tsx
// Before: 2 checkboxes
// After: 1 checkbox toggle
<input
  type="checkbox"
  className={styles.confirmCheckbox}
  checked={node.status === 'confirmed'}
  onChange={() => toggleContextNode(node.nodeId)}
/>
```

### 1.2 删除 nodeTypeBadge / confirmedBadge

---

## E2: ComponentTree（0.5h）

### 2.1 checkbox 前移到标题前

```tsx
<div className={styles.nodeCardHeader}>
  <input type="checkbox" className={styles.confirmCheckbox} />
  <span className={styles.nodeTitle} />
</div>
```

### 2.2 删除 nodeTypeBadge

---

## E4: CSS 清理（0.5h）

删除 `.nodeTypeBadge`、`.confirmedBadge`、`.selectionCheckbox` 样式块。

---

## 验收清单

- [ ] BoundedContextTree 只有 1 个 checkbox
- [ ] BoundedContextTree 无 nodeTypeBadge/confirmedBadge
- [ ] ComponentTree checkbox 在标题同行
- [ ] ComponentTree 无 nodeTypeBadge
- [ ] 废弃 CSS 已删除
- [ ] npm test 通过
