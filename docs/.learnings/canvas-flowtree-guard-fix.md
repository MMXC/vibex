# Learnings: canvas-flowtree-guard-fix

## 项目结果
- E1: ✅ TabBar phase guard（流程画布切换时 guard 隐藏问题修复）
- E2: ✅ TabBar 同步验证
- E3: ✅ E2E 验证

## 经验
1. **guard 与 TabBar 联动**：canvas 画布切换时 guard 条件需与 TabBar active 状态同步，否则切换画布后流程树被错误隐藏
2. **PhaseProgressBar wrapper**：额外 wrapper div 可能导致 TabBar 事件被拦截，E4 专门处理移除
3. **虚假触发模式**：coord-completed 依赖链中只要有 pending reviewer-push 任务就触发 READY，需要主动检查实际完成状态

## 时间线
- Phase1: 2026-04-05
- Phase2: 2026-04-05（E1-E3 完成，E4 进行中）
