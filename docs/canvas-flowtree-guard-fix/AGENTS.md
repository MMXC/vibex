# AGENTS.md — FlowTree Guard Fix

## 开发约束
- guard 必须同时监听 TabBar 和 PhaseProgressBar
- Tab 选择优先级高于 phase

## 禁止事项
- ❌ guard 只监听单一 store
- ❌ Tab 切换不触发 guard 重新评估
