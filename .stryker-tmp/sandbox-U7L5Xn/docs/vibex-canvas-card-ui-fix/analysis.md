# 需求分析报告: vibex-canvas-card-ui-fix

**任务**: 修复 修复上下文卡片UI：移除多余badge、调整checkbox位置、修复toggle行为
**分析师**: analyst
**日期**: 2026-04-02

---

## 执行摘要

4 个 UX 问题，分布在 3 个树组件中：

| # | 问题 | 组件 | 根因 |
|---|------|------|------|
| 1 | nodeTypeBadge 多余 | BoundedContextTree / ComponentTree | type 信息已通过其他方式表达（border颜色/badge等）|
| 2 | checkbox 不与标题同行 | ComponentTree | checkbox 在独立 div 中，type badge 在后 |
| 3 | confirmedBadge 多余 | BoundedContextTree | border 颜色已表示确认状态 |
| 4 | checkbox 不是 toggle | BoundedContextTree | onChange 调用 `confirmContextNode()` 无反向操作 |

---

## 问题详细分析

### 问题 1: nodeTypeBadge 多余

**现状**:
- `BoundedContextTree`: 显示"核心/支撑/通用/外部"（彩色 badge，typeColor）
- `ComponentTree`: 显示"页面/列表/表单/详情/弹窗"（彩色 badge）

**分析**: type 信息已通过以下方式表达：
- BoundedContextTree border 颜色区分 confirmed/unconfirmed（绿色/黄色）
- ComponentTree 的 `isActive` 状态通过 `activeBadge` SVG ✓ 表示
- nodeTypeBadge 属于「元数据展示」，在卡片标题区显得拥挤

**建议**: 删除 nodeTypeBadge，type 信息通过颜色主题体现即可

### 问题 2: checkbox 不与标题同行

**现状**:
- `ComponentTree`: checkbox 在独立 `<div className={styles.selectionCheckbox}>`，type badge 在 `<div className={styles.nodeCardHeader}>` 之后
- `BoundedContextTree`: 两个 checkbox（selectionCheckbox 绝对定位左上角 + confirmCheckbox inline），type badge 在后
- `BusinessFlowTree`: checkbox 在 header 内 inline ✅ 正确

**对比**:
```
BusinessFlowTree ✅:  [checkbox] 流程名称  [展开按钮]
ComponentTree ❌:     [div>checkbox] [type badge] 组件名称  [展开按钮]
BoundedContextTree ❌: [checkbox1][checkbox2] [type badge] 上下文名称
```

**根因**: ComponentTree 的 `selectionCheckbox` 用 `<div>` 包裹，CSS 中 `.selectionCheckbox` 有 `position: absolute` 但被子元素覆盖；BoundedContextTree 的 `selectionCheckbox` 本身就是绝对定位。

### 问题 3: confirmedBadge 多余

**文件**: `BoundedContextTree.tsx` line 258

```tsx
<span className={styles.confirmedBadge} aria-label="已确认">
  <svg ...>...</svg>  {/* ✓ 绿色勾 */}
</span>
```

**分析**: BoundedContextTree 卡片已有 `statusClass` 决定 border 颜色：
- `nodeConfirmed`: `border-color: var(--color-success)` 绿色边框
- `nodeUnconfirmed`: `border-color: var(--color-warning)` 黄色边框

confirmedBadge ✓ 和绿色边框重复，选择其一即可。

### 问题 4: checkbox 不是 toggle

**文件**: `BoundedContextTree.tsx` lines 234-243

```tsx
<input
  type="checkbox"
  checked={node.isActive !== false && node.status !== 'pending'}
  onChange={() => { confirmContextNode(node.nodeId); }}
/>
```

**问题**:
- `confirmContextNode` 只设 `isActive = true`，无反向操作（取消确认）
- `checked` 条件判断：`node.isActive !== false && node.status !== 'pending'` — 这意味着只要 `isActive` 不是 `false` 就 checked，即使状态是 `pending`

**对比 ComponentTree**:
```tsx
checked={selected ?? false}
onChange={() => onToggleSelect(node.nodeId)}
```
ComponentTree 使用 `selected` prop 和 `toggleNodeSelect`，是真正的 toggle。✅

---

## 技术方案

### 方案 A: 最小修复（推荐）

**改动点**:

1. **删除 nodeTypeBadge**（BoundedContextTree + ComponentTree）
2. **统一 checkbox 位置**: 所有树的 checkbox + 标题在同一行（inline flex）
3. **删除 confirmedBadge**（BoundedContextTree line 258）
4. **修复 confirmContextNode**: 添加反向操作，或改为 `toggleNodeSelect` 语义

**修改文件**:
- `BoundedContextTree.tsx`: 删除 selectionCheckbox + confirmCheckbox 合并为一个，删除 nodeTypeBadge + confirmedBadge
- `ComponentTree.tsx`: checkbox 移到 nodeCardHeader 内、标题前
- `canvas.module.css`: 清理相关样式

### 方案 B: 完整重构

**改动点**: 同方案 A + 统一三树 card header 结构

建立统一的 CardHeader 组件，包含：
- checkbox（可选）
- 标题
- 展开/折叠按钮
- 操作按钮（编辑/删除）

---

## 工作量估算

| 任务 | 估算 | 风险 |
|------|------|------|
| BoundedContextTree: 合并 checkbox + 删除 badge | 1h | 低 |
| ComponentTree: checkbox 前移到标题前 | 0.5h | 低 |
| BusinessFlowTree: 保持现状（已正确）| 0h | - |
| CSS 清理 | 0.5h | 低 |
| **总计** | **2h** | |

---

## 验收标准

1. [ ] 所有树卡片：checkbox 在标题同一行（inline）
2. [ ] BoundedContextTree 卡片：只有 1 个 checkbox
3. [ ] 所有树卡片：无 nodeTypeBadge（type 信息通过颜色体现）
4. [ ] BoundedContextTree：无 confirmedBadge ✓
5. [ ] 所有 checkbox：点击切换 checked 状态（toggle 行为）
6. [ ] `git diff` 无 regression

---

## 风险评估

| 风险 | 影响 | 缓解 |
|------|------|------|
| 删除 nodeTypeBadge 后 type 信息丢失 | 低 | type 通过 border 颜色仍可区分 |
| 修改 checkbox 影响多选功能 | 中 | 保留 Ctrl+Click 多选机制 |
| 合并 checkbox 影响原有功能 | 低 | 先在小范围验证 |
