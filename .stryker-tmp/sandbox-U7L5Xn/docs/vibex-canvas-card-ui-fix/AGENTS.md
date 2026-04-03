# AGENTS.md: Canvas 卡片 UI 修复

**项目**: vibex-canvas-card-ui-fix
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### E1: BoundedContextTree
- ✅ 删除 selectionCheckbox（绝对定位）
- ✅ 保留 confirmCheckbox 作为唯一 checkbox
- ✅ toggleContextNode 双向切换
- ❌ 禁止保留 2 个 checkbox
- ❌ 禁止 nodeTypeBadge / confirmedBadge

### E2: ComponentTree
- ✅ checkbox 在标题同行
- ✅ 无 nodeTypeBadge

### E4: CSS
- ✅ 删除废弃样式块
- ❌ 禁止删除 `.confirmCheckbox`

---

## Reviewer 约束

- [ ] BoundedContextTree 1 个 checkbox
- [ ] 无 nodeTypeBadge / confirmedBadge
- [ ] ComponentTree checkbox 同行
- [ ] 废弃 CSS 已删除
- ❌ 编译/测试失败

---

## Tester 约束

| ID | 预期 |
|----|------|
| T1 | BoundedContextTree 1 个 checkbox |
| T2 | toggle 双向切换 |
| T3 | 无 nodeTypeBadge/confirmedBadge |
| T4 | ComponentTree checkbox 同行 |
| T5 | 无 nodeTypeBadge |
