# Epic 1: 三树选择模型统一 — Spec

**Epic ID**: E1
**优先级**: P0
**工时**: 8h
**页面集成**: ContextTree / FlowTree / ComponentTree

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E1-S1 | 定义节点状态枚举 | 创建 `NodeState` 枚举（idle/selected/confirmed/error），统一三树共享 | `expect(NodeState).toEqual({ idle: 'idle', selected: 'selected', confirmed: 'confirmed', error: 'error' })`；三树组件均可 import 此枚举 | src/types/NodeState.ts |
| E1-S2 | 统一 checkbox 位置与布局 | 三树 checkbox 均改为 inline 布局（非绝对定位），checkbox 在 badge **前** | `expect(checkboxDOM.compareDocumentPosition(badgeDOM) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()`；三树视觉一致 | ContextTree.tsx / FlowTree.tsx / ComponentTree.tsx |
| E1-S3 | 移除不一致样式 | 删除 `nodeUnconfirmed` 黄色边框样式；未确认节点不再触发视觉错误提示 | `expect(screen.queryByTestId('node-unconfirmed')).not.toBeVisible()`；所有节点无黄色边框 | 三树组件对应的 CSS Module |
| E1-S4 | 统一状态变更行为 | 三树节点状态变更（click / double-click / keyboard）行为一致：通过统一 `useTreeNodeState` hook | `expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({ state: NodeState.selected }))` | src/hooks/useTreeNodeState.ts |
| E1-S5 | E2E 验证三树交互 | 三树多选 + 确认 + 取消操作流程 E2E 测试 | `await expect(page.locator('.tree-node')).toHaveCount(10)`；`expect(await page.evaluate(() => document.querySelectorAll('.tree-node.confirmed').length)).toBe(5)` | journey-multi-select.spec.ts |

---

## 详细验收条件

### E1-S1: 定义节点状态枚举

- [ ] `src/types/NodeState.ts` 文件存在
- [ ] 枚举包含 4 个状态：`idle` / `selected` / `confirmed` / `error`
- [ ] ContextTree / FlowTree / ComponentTree 均从同一文件 import 枚举
- [ ] `expect(NodeState.confirmed).toBe('confirmed')`

### E1-S2: 统一 checkbox 布局

- [ ] 三树均使用 inline flex 布局（非 `position: absolute`）
- [ ] checkbox 元素在 badge 元素之前（DOM 顺序）
- [ ] 确认节点（confirmed 状态）显示绿色 ✓ 图标，✓ 在 badge **之后**
- [ ] `expect(checkbox.nextSibling).toBe(badgeElement)`（checkbox 在 badge 前）

### E1-S3: 移除 nodeUnconfirmed 样式

- [ ] 代码中无 `nodeUnconfirmed` 样式引用
- [ ] 未确认节点无黄色边框
- [ ] 未确认节点不显示错误图标

### E1-S4: 统一状态变更行为

- [ ] `src/hooks/useTreeNodeState.ts` 存在并导出
- [ ] click 节点：idle → selected
- [ ] double-click 节点：selected → confirmed
- [ ] keyboard Enter：idle → selected → confirmed（循环）
- [ ] keyboard Escape：任何状态 → idle
- [ ] 三树使用同一个 hook，行为一致

### E1-S5: E2E 测试

- [ ] `tests/e2e/journey-multi-select.spec.ts` 存在
- [ ] 测试覆盖：三树节点多选（3 个树各选 2 个节点）
- [ ] 测试覆盖：批量确认操作
- [ ] 测试覆盖：取消确认操作
- [ ] `expect(testResults.failures).toBe(0)`

---

## 实现注意事项

1. **向后兼容**：状态变更不应破坏现有数据持久化逻辑
2. **渐进迁移**：三树组件可逐个迁移，不要求同时完成
3. **样式隔离**：每个树的 CSS Module 独立，避免样式污染
