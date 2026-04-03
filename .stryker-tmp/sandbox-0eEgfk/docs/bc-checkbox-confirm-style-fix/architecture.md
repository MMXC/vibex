# Architecture: BoundedContext Checkbox Confirm Style Fix

**项目**: bc-checkbox-confirm-style-fix
**版本**: v1.0
**日期**: 2026-04-02
**架构师**: architect
**状态**: ✅ 设计完成

---

## 执行摘要

修复 BoundedContextTree 双 checkbox 问题：合并为单 checkbox，与标题同行，confirmed 后边框变绿。

**总工时**: 1.5h

---

## 1. Tech Stack

React + TypeScript + CSS Modules（无架构变更）

---

## 2. 问题根因

**Before**: 2 个 checkbox
- `selectionCheckbox` — 绝对定位，checked 绑定 `node.isActive !== false`（永远为 true）
- `confirmCheckbox` — inline，与 selectionCheckbox 逻辑不一致

**After**: 1 个 checkbox
- 保留 `confirmCheckbox`，修正 checked 绑定
- 与标题 `<h4>` 同一行

---

## 3. 代码变更

```tsx
// Before
<input type="checkbox" className={styles.selectionCheckbox} /> {/* 绝对定位，永远 true */}
<input type="checkbox" className={styles.confirmCheckbox} checked={...} />

// After
<input
  type="checkbox"
  className={styles.confirmCheckbox}
  checked={node.status === 'confirmed'}
  onChange={() => toggleContextNode(node.nodeId)}
/>
```

---

## 4. 性能影响

无性能风险，减少 DOM 节点。

---

## ADR-001: 单 checkbox 替代双 checkbox

**状态**: Accepted

**决策**: 删除 selectionCheckbox，保留 confirmCheckbox 作为唯一 toggle。

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: bc-checkbox-confirm-style-fix
- **执行日期**: 2026-04-02
