# AGENTS.md: Component API Response Fix

**项目**: component-api-response-fix
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### E1: Defensive Parsing
- ✅ 所有 API 响应必须通过 defensive parsing
- ✅ 非法值使用 fallback，不抛错
- ✅ type/method/flowId/name/path 均有 fallback
- ❌ 禁止直接写入 raw API 响应到 store

### E2: 友好错误
- ✅ ZodError 时 toast 提示，不白屏
- ✅ generateComponentFromFlow re-throw 错误，CanvasPage.tsx catch + toast
- ❌ 禁止静默失败（无用户提示）

---

## Reviewer 约束

- [x] type fallback → 'page'
- [x] method fallback → 'GET'
- [x] flowId 'unknown' → ''
- [x] name fallback → '未命名组件'
- [x] ZodError 不白屏
- [x] store 不写入非法数据
- ❌ 测试失败

---

## Tester 约束

- [ ] 非法 type fallback
- [ ] 非法 method fallback
- [ ] confidence undefined → 0
- [ ] flowId 'unknown' → ''
- [ ] ZodError toast 提示
