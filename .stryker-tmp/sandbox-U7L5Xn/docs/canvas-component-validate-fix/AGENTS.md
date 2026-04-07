# AGENTS.md: Canvas Component Validate Fix

**项目**: canvas-component-validate-fix
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

- ✅ Zod schema 与 API 返回值枚举对齐
- ✅ confidence 添加 `.default(1.0)`
- ✅ flowId 正确传递
- ❌ 禁止硬编码枚举值

---

## Reviewer 约束

- [x] ZodError = 0
- [x] API 调用成功
- [x] flowId 非 "unknown"
- ❌ 测试失败

---

## Tester 约束

- [ ] API 请求/响应验证通过
- [ ] confidence 默认值生效
- [ ] flowId 正确传递
