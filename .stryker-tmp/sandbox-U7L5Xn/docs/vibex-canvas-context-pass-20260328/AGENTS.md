# AGENTS.md: vibex-canvas-context-pass-20260328

## dev 约束

### ✅ 必须做
- 确认 editor onChange → store.setContextTree 同步链路
- 确认「继续·流程树」按钮 API 调用包含 contextTree 参数
- 补充缺失的 store action 或 API 参数

### ❌ 禁止做
- ❌ 不要修改 contextTree 的数据结构
- ❌ 不要破坏其他 API 调用的参数
- ❌ 不要在 editor onChange 之外的地方修改 contextTree

## tester 约束
- ✅ network 监控验证 API body 包含 contextTree
- ✅ 端到端验证后端响应正确性

## reviewer 约束
- [ ] 确认 contextTree 同步链路完整
- [ ] 确认无副作用（其他功能未受影响）
