# AGENTS.md: Canvas Checkbox UX 修复

**项目**: canvas-checkbox-ux-fix
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### E1: BoundedContextTree

1. **Checkbox**
   - ✅ 删除 selectionCheckbox（绝对定位的那个）
   - ✅ 保留 confirmCheckbox 作为唯一 checkbox
   - ✅ checkbox 调用 toggleContextNode（双向）
   - ❌ 禁止保留 2 个 checkbox

2. **视觉元素**
   - ✅ 删除 nodeTypeBadge
   - ✅ 删除 confirmedBadge
   - ❌ 禁止新增任何 badge 元素

### E2: ComponentTree

1. **Checkbox 位置**
   - ✅ checkbox 在 nodeCardHeader 内，标题同一行
   - ✅ checkbox 使用 `styles.confirmCheckbox` class
   - ❌ 禁止保留 nodeTypeBadge

2. **视觉元素**
   - ✅ type 通过 border 颜色区分（core=橙色/supporting=蓝色/generic=灰色）
   - ❌ 禁止新增 badge

### E4: CSS

1. **删除样式**
   - ✅ 删除 `.nodeTypeBadge` 样式块
   - ✅ 删除 `.confirmedBadge` 样式块
   - ❌ 禁止删除 `.confirmCheckbox`（复用）
   - ❌ 禁止删除 `.nodeConfirmed`（表示确认状态）

---

## Reviewer 约束

### 审查重点

1. **BoundedContextTree**
   - [ ] 只有 1 个 checkbox
   - [ ] 无 nodeTypeBadge
   - [ ] 无 confirmedBadge
   - [ ] checkbox toggle 双向

2. **ComponentTree**
   - [ ] checkbox 在标题同一行
   - [ ] 无 nodeTypeBadge

3. **CSS**
   - [ ] `.nodeTypeBadge` 已删除
   - [ ] `.confirmedBadge` 已删除
   - [ ] `.confirmCheckbox` 保留

### 驳回条件

- ❌ BoundedContextTree 仍有 2 个 checkbox
- ❌ 存在 nodeTypeBadge 或 confirmedBadge
- ❌ 编译或测试失败

---

## Tester 约束

### 验收测试用例

| ID | 组件 | 条件 | 预期 |
|----|------|------|------|
| T1 | BoundedContextTree | 任意节点 | 只有 1 个 checkbox |
| T2 | BoundedContextTree | 任意节点 | 无 nodeTypeBadge |
| T3 | BoundedContextTree | 任意节点 | 无 confirmedBadge |
| T4 | ComponentTree | 任意节点 | checkbox 在标题同一行 |
| T5 | ComponentTree | 任意节点 | 无 nodeTypeBadge |

---

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `src/components/canvas/BoundedContextTree.tsx` | 修改 |
| `src/components/canvas/ComponentTree.tsx` | 修改 |
| `src/components/canvas/canvas.module.css` | 修改 |
| `src/components/canvas/BoundedContextTree.test.tsx` | 新增用例 |
| `src/components/canvas/ComponentTree.test.tsx` | 新增用例 |
