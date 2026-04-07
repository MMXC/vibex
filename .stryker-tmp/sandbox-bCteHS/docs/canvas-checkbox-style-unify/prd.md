# PRD: Canvas Checkbox 样式统一

**项目**: canvas-checkbox-style-unify
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
Canvas 页面存在 3 类树组件（BoundedContextTree / BusinessFlowTree / ComponentTree），checkbox 实现存在 3 类问题：
1. **ContextTree 有 2 个 checkbox**，语义重复且无确认状态反馈
2. **ComponentTree checkbox 位置不一致**（在 type badge 后而非前）
3. **未确认节点顶部的黄色边框视觉冗余**（`nodeUnconfirmed` 黄色描边 + 阴影）

### 目标
- 统一三树组件的 checkbox 位置（始终在 type badge 前）
- 删除 ContextTree 的冗余 checkbox，保留单一确认 checkbox
- 为确认状态添加视觉反馈（绿色 ✓ 标记）
- 移除未确认节点的黄色边框冗余视觉

### 成功指标
- [ ] ContextTree 卡片只有 1 个 checkbox，位置在 type badge 前，有绿色 ✓ 确认反馈
- [ ] ComponentTree checkbox 在 type badge 前（inline，非绝对定位）
- [ ] FlowTree checkbox 在 header 最前面（保持现状，已正确）
- [ ] 未确认节点无黄色边框/阴影，与已确认节点仅通过确认反馈图标区分
- [ ] 三树一致性：所有树卡片 checkbox 语义一致，视觉表现一致

---

## Epic 拆分

### Epic 1: ContextTree Checkbox 合并与确认反馈
**工时**: 1.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 删除 ContextTree 冗余 selectionCheckbox | 0.5h | expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(1) |
| E1-S2 | 保留 confirmCheckbox，重命名语义并前移 | 0.5h | expect(checkboxInput).toBeDefined() |
| E1-S3 | 添加确认状态绿色 ✓ 反馈 | 0.5h | expect(container.querySelector('.activeBadge, [class*="activeBadge"]')).not.toBeNull() |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 单 checkbox 展示 | ContextTree 卡片只有 1 个 checkbox | expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(1) | ✅ |
| F1.2 | checkbox 位置正确 | checkbox 在 nodeTypeBadge 前 | expect(checkbox.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING) | ✅ |
| F1.3 | 确认反馈图标 | 已确认节点显示绿色 ✓ | expect(container.querySelector('[class*="confirmed"], [class*="activeBadge"]')).not.toBeNull() | ✅ |
| F1.4 | 调用逻辑正确 | checkbox onChange 调用 confirmContextNode | expect(confirmContextNode).toHaveBeenCalledWith(node.nodeId) | ✅ |

---

### Epic 2: ComponentTree Checkbox 位置修正
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | checkbox 前移到 type badge 前 | 0.25h | expect(checkboxInput.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy() |
| E2-S2 | 移除 div 包裹，改用 inline input | 0.25h | expect(checkboxInput.tagName).toBe('INPUT') |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | checkbox 位置正确 | checkbox 在 nodeTypeBadge 前 | expect(checkbox.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING) | ✅ |
| F2.2 | input 直接渲染 | checkbox 为 `<input>` 非 div 包裹 | expect(checkboxInput.tagName).toBe('INPUT') | ✅ |
| F2.3 | 无绝对定位干扰 | checkbox 不使用绝对定位 | expect(checkboxInput.style.position).not.toBe('absolute') | ✅ |

---

### Epic 3: 未确认节点黄色边框移除
**工时**: 0.25h | **优先级**: P1

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | 移除 nodeUnconfirmed 黄色边框 | 0.25h | expect(container.querySelector('[class*="nodeUnconfirmed"]')?.style.borderColor).not.toBe('var(--color-warning)') |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 无黄色边框 | nodeUnconfirmed 无 border-color: var(--color-warning) | expect(container.querySelector('[class*="nodeUnconfirmed"]')?.style.borderColor).not.toBe('var(--color-warning)') | ✅ |
| F3.2 | 无阴影 | 无 box-shadow: 0 0 8px rgba(255, 170, 0, 0.2) | expect(container.querySelector('[class*="nodeUnconfirmed"]')?.style.boxShadow).not.toContain('170, 0') | ✅ |

---

### Epic 4: FlowTree 确认反馈一致性（可选）
**工时**: 0.5h | **优先级**: P2

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | FlowTree 添加确认状态绿色 ✓ 反馈 | 0.5h | expect(container.querySelector('[class*="confirmed"], [class*="activeBadge"]')).not.toBeNull() |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 确认反馈图标 | FlowCard 已确认节点显示绿色 ✓ | expect(container.querySelector('[class*="confirmed"], [class*="activeBadge"]')).not.toBeNull() | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 |
|------|------|------|
| E1 | ContextTree Checkbox 合并与确认反馈 | 1.5h |
| E2 | ComponentTree Checkbox 位置修正 | 0.5h |
| E3 | 未确认节点黄色边框移除 | 0.25h |
| E4 | FlowTree 确认反馈一致性（可选） | 0.5h |
| **总计** | | **2.75h (P0: 2h)** |

---

## 优先级矩阵

| 优先级 | Epic | 功能点 | 工时 |
|--------|------|--------|------|
| P0 | E1, E2 | ContextTree 双 checkbox 合并 + ComponentTree 位置修正 | 2h |
| P1 | E3 | 黄色边框移除 | 0.25h |
| P2 | E4 | FlowTree 确认反馈（可选） | 0.5h |

---

## Sprint 排期建议

**Sprint 1 (2h)**:
- E1: ContextTree Checkbox 合并与确认反馈（1.5h）
- E2: ComponentTree Checkbox 位置修正（0.5h）

**Sprint 2 (0.25h)**:
- E3: 未确认节点黄色边框移除（0.25h）

**Sprint 3 (0.5h, optional)**:
- E4: FlowTree 确认反馈一致性（0.5h）

---

## 关键代码位置索引

| 文件 | 行 | 问题 |
|------|-----|------|
| `BoundedContextTree.tsx` | 234-243 | selectionCheckbox（绝对定位，语义不清）|
| `BoundedContextTree.tsx` | 246-253 | confirmCheckbox（与 selection 重复）|
| `canvas.module.css` | 1058-1067 | `.selectionCheckbox` 绝对定位样式 |
| `canvas.module.css` | 899-901 | `.confirmCheckbox` 样式 |
| `ComponentTree.tsx` | 426-434 | selectionCheckbox 在 type badge 之后 |
| `canvas.module.css` | 629-632 | `.nodeUnconfirmed` 黄色边框 |
| `BoundedContextTree.tsx` | 141 | `nodeTypeBadge` — 紧随 checkbox 后 |

---

## 风险评估

| 风险 | 影响 | 缓解 |
|------|------|------|
| 删除 selectionCheckbox 影响多选功能 | 中 | 确认 `toggleNodeSelect` 有其他触发方式（Ctrl+Click） |
| 修改绝对定位可能影响拖选功能 | 低 | selectionCheckbox 改动仅影响 ContextTree，FlowTree/ComponentTree 已有其他选择机制 |
| 黄色边框移除后难以区分未确认节点 | 低 | 有 type badge 颜色 + 确认反馈图标双重指示 |

---

## 技术债务备注

- `activeBadge` class 在 `canvas.module.css` 中无定义，需确认是否已有 CSS 定义
- `confirmCheckbox` 和 `flowCardCheckbox` 使用原生 `<input type="checkbox">`，建议统一使用 `CheckboxIcon` 组件（`/components/common/CheckboxIcon.tsx`）以支持深色模式和一致性样式

---

## DoD (Definition of Done)

### Epic 1: ContextTree Checkbox 合并与确认反馈
- [ ] `BoundedContextTree.tsx` 中只保留 1 个 `<input type="checkbox">`
- [ ] checkbox 位置在 `nodeTypeBadge` 之前
- [ ] 已确认节点（`status === 'confirmed'`）渲染绿色 ✓ 确认反馈
- [ ] TypeScript 编译无错误
- [ ] 单元测试覆盖 checkbox onChange 逻辑

### Epic 2: ComponentTree Checkbox 位置修正
- [ ] `ComponentTree.tsx` 中 `<input type="checkbox">` 在 `nodeCardHeader` 内部、type badge 之前
- [ ] checkbox 不再被 div 包裹，直接 inline
- [ ] checkbox 无绝对定位样式
- [ ] TypeScript 编译无错误

### Epic 3: 未确认节点黄色边框移除
- [ ] `canvas.module.css` 中 `.nodeUnconfirmed` 无 `border-color: var(--color-warning)`
- [ ] 无 `box-shadow: 0 0 8px rgba(255, 170, 0, 0.2)`
- [ ] 视觉回归测试通过

### Epic 4: FlowTree 确认反馈一致性
- [ ] `BusinessFlowTree.tsx` FlowCard 添加确认状态绿色 ✓ 反馈
- [ ] 与 ContextTree/ComponentTree 确认反馈视觉一致
- [ ] TypeScript 编译无错误

---

## 验收标准汇总（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 渲染 BoundedContextTree 节点 | 节点 `status === 'confirmed'` | 只有 1 个 checkbox，显示绿色 ✓ 确认反馈 |
| AC1.2 | 渲染 BoundedContextTree 节点 | 节点 `status === 'pending'` | 只有 1 个 checkbox，无确认反馈 |
| AC2.1 | 渲染 ComponentTree 节点 | 节点有 selectionCheckbox | checkbox 在 type badge 前 |
| AC3.1 | 渲染 pending 节点 | 节点有 `nodeUnconfirmed` class | 无黄色边框，无橙色阴影 |
| AC4.1 | 渲染 FlowCard | 节点已确认 | 显示绿色 ✓ 确认反馈 |
