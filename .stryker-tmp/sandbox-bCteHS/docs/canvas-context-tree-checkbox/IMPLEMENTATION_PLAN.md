# Implementation Plan — canvas-context-tree-checkbox

**项目**: canvas-context-tree-checkbox  
**版本**: v1.0  
**日期**: 2026-04-01  
**作者**: Architect Agent  
**总工时**: 1h

---

## 1. Overview

恢复 BoundedContextTree 卡片 header 中的 checkbox，支持点击选中/取消，并与现有 Ctrl+Click 多选行为完全兼容。

**里程碑**:

```
00:00 ── F1.1 Checkbox 渲染 ────────────── 00:20
20:00 ── F1.2 点击切换选中状态 ─────────── 00:35
35:00 ── F1.3 Ctrl+Click 兼容 ──────────── 00:45
45:00 ── F1.4 选中样式高亮 ──────────────── 00:55
55:00 ── F1.5 Playwright E2E 覆盖 ──────── 01:00 ✅
```

---

## 2. Task Breakdown

### F1.1 — Checkbox 渲染（20min）

**目标**: 在 BoundedContextTree 卡片 header 左侧渲染 checkbox

**步骤**:
1. 找到 `BoundedContextTreeCard.tsx` 组件
2. 在 header div 中添加 `<input type="checkbox">`
3. 添加 `aria-label={`选择上下文 ${node.name}`}`
4. 添加 `onClick={(e) => e.stopPropagation()}` 防止冒泡
5. 样式对齐（垂直居中、margin-right）
6. 仅当 `onToggleSelect` prop 存在时渲染（条件渲染）

**验收**:
- [ ] checkbox 在卡片 header 左侧可见
- [ ] aria-label 正确描述节点名称
- [ ] stopPropagation 阻止点击冒泡到 CardBody

**产出**: `BoundedContextTreeCard.tsx` 修改

---

### F1.2 — 点击切换选中状态（15min）

**目标**: 点击 checkbox 切换选中状态

**步骤**:
1. 从 props 解构 `selected` 和 `onToggleSelect`
2. checkbox 添加 `checked={selected}`
3. checkbox 添加 `onChange={() => onToggleSelect?.(node.nodeId)}`
4. 父组件侧：找到持有 `selectedNodes` 的组件，传递 `onToggleSelect`
5. 验证类型定义已更新

**验收**:
- [ ] 点击选中 → `selected=true`
- [ ] 再次点击取消 → `selected=false`
- [ ] 类型检查通过

**产出**: Props 接口更新 + 父组件连接

---

### F1.3 — Ctrl+Click 兼容（10min）

**目标**: Ctrl+Click CardBody 仍可多选（向后兼容）

**步骤**:
1. 确认现有 CardBody 的 Ctrl+Click handler 已存在
2. 验证 checkbox 的 `stopPropagation` 不会阻断 Ctrl+Click（两者作用于不同元素）
3. 在 CardBody 的 click handler 中增加 `e.ctrlKey` 判断逻辑（如缺失）

**验收**:
- [ ] Ctrl+Click 卡片 body → 选中该卡片
- [ ] 点击 checkbox → 选中该卡片（不等效于 Ctrl+Click，但独立工作）
- [ ] 点击 checkbox 不触发 CardBody handler

**产出**: 无文件变更（验证现有逻辑）或 CardBody handler 补充

---

### F1.4 — 选中样式高亮（10min）

**目标**: 选中卡片显示 selected 样式

**步骤**:
1. 在 Card header/container 添加条件 class: `selected ? 'selected' : ''`
2. 在 `BoundedContextTreeCard.module.css` 中添加 `.selected` 样式
3. 参考 BusinessFlowTree 已有选中样式（颜色、边框等）

**验收**:
- [ ] 选中卡片有视觉区分（边框高亮或背景色）
- [ ] 取消选中样式移除

**产出**: `BoundedContextTreeCard.module.css` 修改

---

### F1.5 — Playwright E2E 覆盖（5min）

**目标**: 4 个 E2E 测试用例覆盖所有功能点

**步骤**:
1. 在 `e2e/canvas.spec.ts` 添加 4 个 test case（F1.1–F1.4）
2. 每个 card 使用 `data-testid="context-card"` 便于定位
3. 运行 `npx playwright test` 验证通过

**验收**:
- [ ] 4 个测试全部 PASS
- [ ] CI 环境中可重复执行

**产出**: `e2e/canvas.spec.ts` 新增用例

---

## 3. Dependencies

| 依赖 | 来源 | 阻塞 |
|------|------|------|
| BoundedContextTreeCard.tsx | 现有代码 | 否 |
| Playwright | 现有 E2E 基础设施 | 否 |
| data-testid 属性 | 需要前端配合添加 | F1.5 完成后解除 |

---

## 4. Rollback Plan

如 F1.1 引入视觉回归：
- 还原 `<input type="checkbox">` JSX
- 验收：checkbox 消失但 Ctrl+Click 仍工作

---

## 5. Verification Checklist

- [ ] F1.1 — Checkbox 可见于卡片 header
- [ ] F1.2 — 点击 checkbox 切换状态
- [ ] F1.3 — Ctrl+Click body 仍可多选
- [ ] F1.4 — 选中卡片有高亮样式
- [ ] F1.5 — Playwright 4 个测试全部 PASS
- [ ] 全局 DoD: 功能完整 + 向后兼容 + 测试覆盖

## 执行决策

- **决策**: 已采纳
- **执行项目**: canvas-context-tree-checkbox
- **执行日期**: 2026-04-01
