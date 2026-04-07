# AGENTS.md: Flow Step Check Fix

**项目**: flow-step-check-fix
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

- ✅ `confirmFlowNode` 必须级联到 `steps` 数组
- ✅ 使用 `n.steps?.map()` 安全处理可能不存在的 steps
- ❌ 禁止在循环中修改状态（使用 immutable 更新）

---

## Reviewer 约束

- [ ] `confirmFlowNode` 实现包含 steps 级联
- [ ] 测试覆盖 steps 为空的情况
- [ ] 无 regression
- ❌ 测试失败

---

## Tester 约束

- [ ] 级联确认测试：steps 数组同步 confirmed
- [ ] 空 steps 测试：steps 为 undefined 时不报错
- [ ] 回归测试：其他树功能正常
