# Vibex 流程树卡片显示 Bug 分析报告

**项目**: vibex-flow-tree-cards-fix-20260329  
**分析人**: Analyst Agent  
**日期**: 2026-03-29  
**目标**: 分析画布页流程树展开子节点卡片显示 bug 的根因

---

## 🐛 问题描述

> vibex 画布页流程树里面各流程展开子节点只能显示两张卡片，下面卡片操作不了（虚线框高度锁死了，没有自适应子流程卡片数量）

用户反馈展开流程卡片后，子步骤（Step）列表只能显示约 2 张卡片的内容，下方卡片无法操作。

---

## 🔍 问题定位

### 1. 组件代码定位

**主文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`

关键组件层次：
```
BusinessFlowTree
  └── .flowList (SortableContext > DndContext)
        └── SortableTreeItem
              └── FlowCard
                    ├── .flowCardHeader (展开/收起按钮)
                    └── {expanded && <div .stepsList>}  ← 展开区域
                          ├── SortableStepRow × N
                          └── btnAddStep
```

### 2. CSS 样式定位

**文件**: `vibex-fronted/src/components/canvas/canvas.module.css`

| CSS 类 | 行号 | 关键样式 | 说明 |
|--------|------|---------|------|
| `.flowCard` | ~1184 | `overflow: hidden` | 虚线框容器，overflow 截断 |
| `.flowCard` | ~1180 | `border: 2px dashed var(--color-border)` | 虚线框本体 |
| `.stepsList` | ~1294 | `max-height: 300px` | 子步骤列表最大高度 |
| `.stepsList` | ~1295 | `overflow-y: auto` | 步骤列表内部滚动 |
| `.flowList` | ~1171 | `overflow-y: auto` | 流程列表滚动容器 |

---

## 🧠 根因分析

### 直接根因：`.flowCard` 的 `overflow: hidden`

```css
/* canvas.module.css:1184 */
.flowCard {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  overflow: hidden;          /* ← 这里是罪魁祸首 */
  transition: border-color 0.2s ease;
  position: relative;
}
```

**机制**:

1. `.flowCard` 展开时，子元素 `.stepsList` 试图撑开父容器高度
2. `.stepsList` 有 `max-height: 300px` 和 `overflow-y: auto` → 内部可滚动
3. 当步骤数量超过 `max-height` 可容纳的数量时，**`.stepsList` 应该在内部滚动**，内容不溢出
4. **但** `.flowCard` 的 `overflow: hidden` 会截断超出父容器边界的**任何内容**
5. 如果 `.flowCard` 的父级（`.sortableTreeItem` → `.flowList`）有高度约束，`.flowCard` 无法向上撑开，导致内容被截断

### 高度约束链分析

```
.canvasContainer (height: 100vh, overflow: hidden)
  └── .treePanelsGrid (flex: 1)
        └── .treePanel (flex: 1, overflow: hidden)
              └── .treePanelBody (flex: 1, overflow-y: auto)
                    └── .flowTreePanel (height: 100%)
                          └── .flowList (overflow-y: auto)     ← 有自己的滚动
                                └── .sortableTreeItem
                                      └── .flowCard (overflow: hidden) ← 问题在这里
```

`.flowList` 有 `overflow-y: auto`，意味着它是一个滚动容器。如果 `.flowCard` 在 `.flowList` 内部展开，它应该能够自然扩展高度让 `.flowList` 滚动。但 `overflow: hidden` 阻止了这一行为。

### 为什么"只能显示两张卡片"

- 每个 `.stepRow` 高度约 `50-60px`（含 padding、边框、内边距）
- `.stepsList` 的 `max-height: 300px` → 理论上可容纳 5-6 个步骤
- 但加上 `.flowCardHeader`（约 50px）和展开按钮区域，容器实际可用高度有限
- `overflow: hidden` + 可能存在的父容器高度约束 → 内容被截断

### 次要因素

**`.stepsList` 的 `max-height: 300px` 是硬性上限**。即使修复了 `overflow: hidden`，超过 300px 的步骤仍无法直接显示，只能靠滚动。不过这是合理的设计（防止单个卡片无限扩展），**不需要修改**。

---

## 🔧 修复方向

### 方案：移除 `.flowCard` 的 `overflow: hidden`

**改动文件**: `vibex-fronted/src/components/canvas/canvas.module.css`

**改动位置**: `.flowCard` CSS 规则（约第 1184 行）

```css
/* 修改前 */
.flowCard {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  overflow: hidden;          /* ← 删除这行 */
  transition: border-color 0.2s ease;
  position: relative;
}

/* 修改后 */
.flowCard {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  /* overflow: hidden; 移除，允许子元素撑开容器高度 */
  transition: border-color 0.2s ease;
  position: relative;
}
```

**原理**:
- 移除 `overflow: hidden` 后，`.flowCard` 的高度由其内容（header + stepsList）自然决定
- 虚线框会自动随子步骤数量扩展
- 如果步骤数量多，用户可以通过滚动 `.flowList` 来查看全部内容

**验证方式**:
1. 添加 3+ 个步骤到任意流程卡片
2. 展开该卡片，确认所有步骤均可见且可交互
3. 确认虚线框高度随步骤数量扩展

### 备选方案（如果移除 `overflow: hidden` 引入了布局问题）

如果移除后出现其他布局问题，可以考虑将 `overflow: hidden` 改为 `overflow: visible`，但需要同时确保父级没有阻止可见内容显示：

```css
.flowCard {
  overflow: visible;
}
```

---

## ✅ 结论

| 项目 | 结论 |
|------|------|
| **根因** | `.flowCard` 设置了 `overflow: hidden`，阻止容器随展开内容扩展高度 |
| **影响** | 虚线框高度被截断，超过可见区域的内容无法操作 |
| **修复** | 删除 `.flowCard` 的 `overflow: hidden` |
| **副作用评估** | 风险低，`.flowCard` 内的子元素（header、stepsList）本身有 `overflow-y: auto`，不需要父级截断 |
| **其他设计** | `.stepsList` 的 `max-height: 300px` 是合理上限，保留不变 |

---

## 📋 修复任务清单

- [ ] 修改 `canvas.module.css`，移除 `.flowCard` 的 `overflow: hidden`
- [ ] 手动测试：添加 3+ 步骤，展开卡片，确认全部可交互
- [ ] E2E 测试覆盖此场景
