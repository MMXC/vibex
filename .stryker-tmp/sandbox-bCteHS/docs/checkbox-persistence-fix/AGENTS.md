# AGENTS.md: Checkbox Persistence Fix

**项目**: checkbox-persistence-fix
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

- ✅ `confirmed` 同时映射到 `isActive` 和 `status: 'confirmed'`
- ❌ 禁止只设置 `isActive` 不设置 `status`

---

## Reviewer 约束

- [ ] Migration 后 status = 'confirmed'
- [ ] 刷新后 checkbox 状态一致
- ❌ 测试失败

---

## Tester 约束

- [ ] Migration 测试：confirmed → status: 'confirmed'
- [ ] 刷新后状态保留
