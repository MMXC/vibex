# AGENTS.md: BoundedContext Checkbox Confirm Style Fix

**项目**: bc-checkbox-confirm-style-fix
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

- ✅ 删除 selectionCheckbox（绝对定位的那个）
- ✅ 保留 confirmCheckbox 作为唯一 checkbox
- ✅ checked 绑定 `node.status === 'confirmed'`
- ✅ checkbox 与标题同一行（flex inline）
- ✅ toggleContextNode 双向切换
- ❌ 禁止保留 2 个 checkbox
- ❌ 禁止 position: absolute checkbox

---

## Reviewer 约束

- [x] 只有 1 个 checkbox
- [x] checkbox 与标题同行
- [x] 无 position: absolute
- [x] confirmed 绿色边框
- [x] npm test 通过
- ❌ 编译/测试失败

---

## Tester 约束

| ID | 预期 |
|----|------|
| T1 | 只有 1 个 checkbox |
| T2 | checkbox 与标题同行 |
| T3 | confirmed → 绿色边框 |
| T4 | toggle 双向切换 |
| T5 | 无绝对定位 checkbox |
