# AGENTS.md: vibex-canvas-bc-layout-20260328

## Dev 约束
- ❌ 不修改节点 CRUD 操作逻辑
- ❌ 不引入新依赖
- data-testid: `bounded-context-group`, `domain-label`

## Tester
- 验证分组虚线框在 375px~1440px 均无错位
- 验证 CRUD 操作不受分组影响
