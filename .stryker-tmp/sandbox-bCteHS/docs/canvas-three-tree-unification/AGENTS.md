# AGENTS.md: canvas-three-tree-unification

## Dev
- Epic 1: TabBar 使用 CSS 控制显隐，不卸载 Panel
- Epic 3: isActive 默认 true，migration 测试必须覆盖
- Epic 4: cascade 手动触发后，旧数据可能有 orphaned flow/component，忽略即可

## Tester
- E2E 测试：任意 phase 操作任意树
- gstack screenshot 验证三树数据保留
- migration 回归测试

## Reviewer
- 检查 confirmed 完全移除（grep 搜索）
- 检查 cascadeContextChange 完全移除
- 检查 isActive 默认值兼容旧数据
