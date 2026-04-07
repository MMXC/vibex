# AGENTS.md: Canvas Checkbox Style Unify

**项目**: canvas-checkbox-style-unify
**版本**: v1.0
**日期**: 2026-04-02

---

## Dev 约束

### 代码修改约束

1. **BoundedContextTree.tsx**
   - ❌ 禁止删除 `confirmContextNode` 调用逻辑
   - ❌ 禁止修改 `confirmContextNode` 函数签名
   - ❌ 禁止删除 `nodeTypeBadge` 渲染
   - ✅ 可删除 `selectionCheckbox` 相关代码
   - ✅ 可添加确认反馈 SVG（绿色 ✓）

2. **ComponentTree.tsx**
   - ❌ 禁止修改 `onToggleSelect` props
   - ❌ 禁止删除 `activeBadge` 确认反馈
   - ✅ 可移动 checkbox 位置到 type badge 前
   - ✅ 可移除 div 包裹，改用 inline input

3. **canvas.module.css**
   - ❌ 禁止删除 `.confirmCheckbox` 样式（复用）
   - ❌ 禁止修改 `.nodeConfirmed`（确认状态边框）
   - ❌ 禁止修改 `.nodeError`
   - ✅ 必须补充 `.activeBadge` 和 `.confirmedBadge` CSS
   - ✅ 可修改 `.nodeUnconfirmed` 删除黄色边框

4. **BusinessFlowTree.tsx**（E4 可选）
   - ✅ 可添加确认反馈绿色 ✓ SVG（参考 ComponentTree activeBadge）

### 绝对禁止

- ❌ 禁止修改节点数据结构（BoundedContextNode / ComponentNode / BusinessFlowNode）
- ❌ 禁止删除 `nodeUnconfirmed` / `nodeConfirmed` / `nodeError` 类名逻辑
- ❌ 禁止新增 npm 依赖
- ❌ 禁止修改其他不相关组件（如 CanvasToolbar.tsx）

### 样式规范

- 确认反馈 SVG 使用内联 SVG（无外部依赖）
- 颜色使用 CSS 变量：`var(--color-success)` 绿色，`var(--color-warning)` 黄色
- 间距使用 `rem` 单位，保持一致性

### 测试规范

- 单元测试必须覆盖 checkbox onChange 逻辑
- 视觉测试使用 aria-label 定位元素（`aria-label="已确认"`, `aria-label="确认节点"`）
- DOM 位置验证使用 `compareDocumentPosition`

---

## Reviewer 约束

### 审查重点

1. **Checkbox 数量**: ContextTree 每个节点只能有 1 个 checkbox
2. **Checkbox 位置**: 必须在前（before）于 type badge
3. **确认反馈**: confirmed 状态节点必须显示绿色 ✓ SVG
4. **无黄色边框**: `nodeUnconfirmed` 不得有 `border-color: var(--color-warning)`
5. **编译通过**: `npm run build` 无错误
6. **测试通过**: `npm test` 全部通过，覆盖率 > 80%

### 驳回条件

- ❌ ContextTree 仍有 2 个 checkbox
- ❌ ComponentTree checkbox 仍在 type badge 后
- ❌ 未确认节点仍有黄色边框
- ❌ 编译或测试失败
- ❌ 覆盖率 < 80%

---

## Tester 约束

### 验收测试用例

| ID | 组件 | 条件 | 预期 |
|----|------|------|------|
| T1 | BoundedContextTree | status='confirmed' | 只有 1 个 checkbox，显示绿色 ✓ |
| T2 | BoundedContextTree | status='pending' | 只有 1 个 checkbox，无绿色 ✓ |
| T3 | BoundedContextTree | 任意节点 | checkbox 在 type badge 前 |
| T4 | ComponentTree | 任意节点 | checkbox 在 type badge 前，inline |
| T5 | ComponentTree | 任意节点 | checkbox 无 div 包裹 |
| T6 | BoundedContextTree | status='pending' | nodeUnconfirmed 无黄色边框 |

### 截图要求

- [ ] 修改前/修改后对比截图（3 类组件各 1 张）
- [ ] 未确认节点特写（无黄色边框）
- [ ] 确认节点特写（绿色 ✓ 反馈）

---

## 文件变更清单

| 文件 | 操作 | 关键约束 |
|------|------|----------|
| `src/components/canvas/BoundedContextTree.tsx` | 修改 | 删除 selectionCheckbox，保留 confirmCheckbox |
| `src/components/canvas/ComponentTree.tsx` | 修改 | checkbox 前移到 type badge 前 |
| `src/components/canvas/canvas.module.css` | 修改 | 补充 activeBadge/confirmedBadge CSS，移除 nodeUnconfirmed 黄色 |
| `src/components/canvas/BusinessFlowTree.tsx` | 修改（E4） | 添加确认反馈 SVG |
| `src/components/canvas/BoundedContextTree.test.tsx` | 新增用例 | E1 覆盖 |
| `src/components/canvas/ComponentTree.test.tsx` | 新增用例 | E2 覆盖 |
