# AGENTS.md: Flow Checkbox Toggle Fix

**项目**: flow-checkbox-toggle-fix
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### E1: Toggle
- ✅ 添加 toggleFlowNode 到 canvasStore
- ✅ checkbox onChange 调用 toggleFlowNode
- ❌ 禁止单向操作

### E2: 过滤
- ✅ generateComponentFromFlow 只发送 confirmed 节点
- ❌ 禁止发送 pending 节点到 API

---

## Reviewer 约束

- [ ] toggleFlowNode 双向切换
- [ ] BusinessFlowTree checkbox toggle 正常
- [ ] generateComponentFromFlow 过滤 pending
- ❌ 测试失败

---

## Tester 约束

- [ ] toggleFlowNode confirmed → pending → confirmed
- [ ] API 请求只包含 confirmed 节点
- [ ] npm test 通过
