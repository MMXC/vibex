# 分析报告：VibeX Canvas 卡片 Checkbox 勾选逻辑统一

**项目**: vibex-canvas-checkbox-unify  
**任务**: analyze-requirements  
**分析人**: Analyst  
**日期**: 2026-03-30  
**状态**: ✅ 完成

---

## 1. 执行摘要

Canvas 页面存在 5 个 checkbox 相关问题，根因分为两类：**状态管理缺失**（问题 1、3）和**设计意图混淆**（问题 2、5）。问题 4 属于架构限制，需较大改动。推荐**方案 A（最小修复）**，修复 3 个核心问题，工时约 **4-6 小时**。

---

## 2. 问题定义与根因分析

### P0 — 问题 1：上下文树 checkbox 无法取消勾选

**现象**：限界上下文树（BoundedContextTree）中，卡片的确认 checkbox 只能勾选、无法取消。

**根因**：`canvasStore.ts` 中 `confirmContextNode` 函数只负责将 `confirmed` 设为 `true`，不存在逆向操作。

```typescript
// canvasStore.ts:557-561
confirmContextNode: (nodeId) => {
  set((s) => ({
    contextNodes: s.contextNodes.map(n =>
      n.nodeId === nodeId ? { ...n, confirmed: true, status: 'confirmed' } : n
    ),
  }));
  // ❌ 没有处理 confirmed: false 的逻辑
},
```

**涉及文件**：
- `src/lib/canvas/canvasStore.ts` — confirmContextNode 函数
- `src/components/canvas/BoundedContextTree.tsx` — ContextCard 组件

---

### P0 — 问题 2：流程卡片勾选后子步骤未联动勾选

**现象**：勾选流程卡片（FlowCard）的多选 checkbox 时，子步骤（FlowStep）仍为未确认状态。

**根因**：这是**设计意图混淆**。FlowCard 的 checkbox 负责**多选操作**（用于批量删除等），而非**步骤确认**。但用户期望"勾选流程卡片 = 确认整个流程"。

| 概念 | 字段 | 用途 |
|------|------|------|
| 多选 | `selectedNodeIds` | 批量操作（删除、导出） |
| 确认状态 | `node.confirmed` | 阶段推进条件 |

当前 `BusinessFlowTree` 的 FlowCard 同时有两套状态，互相独立。

**涉及文件**：
- `src/components/canvas/BusinessFlowTree.tsx` — FlowCard 组件
- `src/components/canvas/BusinessFlowTree.tsx` — SortableStepRow 组件

---

### P1 — 问题 3：虚线框分组内缺少统一勾选/取消逻辑

**现象**：组件树（ComponentTree）中，按 `flowId` 分组后，每组有虚线框包裹，但组内没有批量确认功能。

**根因**：多选功能（Ctrl+Click、框选）存在，但缺少"确认组内所有节点"的快捷操作。

```typescript
// ComponentTree.tsx — 组渲染逻辑
{groups.map((group) => (
  <div key={group.groupId} className={styles.componentGroup}>
    {/* 组标签 */}
    <div className={styles.componentGroupLabel}>{group.label}</div>
    {/* ❌ 没有"确认组内全部"按钮 */}
  </>
))}
```

**涉及文件**：
- `src/components/canvas/ComponentTree.tsx` — groupByFlowId 函数、组件组渲染

---

### P2 — 问题 4：卡片无法拖动为水平排列

**现象**：用户期望卡片能自由拖动到任意位置（水平排列），当前只能垂直排序。

**根因**：**架构限制**。当前布局使用 CSS Flexbox 垂直列表 + `@dnd-kit/sortable` 实现列表内排序，不支持自由定位。

| 当前方案 | 能力 |
|---------|------|
| CSS Flexbox 垂直列表 | ✅ 列表内排序 |
| @dnd-kit sortable | ✅ 列表内排序 |
| 自由定位画布 | ❌ 不支持 |

**评估**：如需支持自由定位，需引入 React Flow 或自定义定位系统，**改动范围约 2-3 周**。建议作为独立 Epic 延期处理。

**涉及文件**：
- `src/components/canvas/BoundedContextTree.tsx`
- `src/components/canvas/BusinessFlowTree.tsx`
- `src/components/canvas/ComponentTree.tsx`

---

### P1 — 问题 5：Checkbox 组件不统一，逻辑混乱

**现象**：三个树组件的 checkbox 行为不一致，用户困惑。

**根因**：Checkbox 承担了两种不同职责，在不同组件中实现不一致：

| 组件 | Checkbox 类型 | 绑定状态 | 视觉 |
|------|-------------|---------|------|
| ContextCard | 确认checkbox | `node.confirmed` | 绿色勾选图标 |
| FlowCard | 多选checkbox | `selectedNodeIds.flow` | 标准checkbox |
| ComponentCard | 多选checkbox | `selectedNodeIds.component` | 包裹在div中 |
| CardTreeNode | 子项checkbox | `item.checked` | 仅记录日志，无实际更新 |

```typescript
// CardTreeNode.tsx:77-80 — ❌ 只打日志，不更新状态
const handleCheckboxToggle = useCallback((childId: string, checked: boolean) => {
  console.debug(`[CardTreeNode] Toggle child ${childId}: ${checked}`);
  // 没有调用任何 store 方法
}, []);
```

**涉及文件**：
- `src/components/visualization/CardTreeNode/CardTreeNode.tsx`

---

## 3. 涉及组件树分析

| 树名称 | 组件文件 | 状态字段 | 多选字段 |
|--------|---------|---------|---------|
| 上下文树 | BoundedContextTree.tsx | `node.confirmed` | `selectedNodeIds.context` |
| 流程树 | BusinessFlowTree.tsx | `node.confirmed` + `step.confirmed` | `selectedNodeIds.flow` |
| 组件树 | ComponentTree.tsx | `node.confirmed` | `selectedNodeIds.component` |
| 可视化卡片树 | CardTreeNode.tsx | `item.checked`（只读） | 无 |

---

## 4. 修复范围与影响评估

### 4.1 直接修复（问题 1、3、5）

| 问题 | 修复范围 | 影响 |
|------|---------|------|
| 问题1 | `canvasStore.ts` — 添加 toggle 函数 | 低（仅 store） |
| 问题3 | `ComponentTree.tsx` — 添加组级别批量确认 | 低（仅 UI） |
| 问题5 | `CardTreeNode.tsx` — 实现状态更新回调 | 中（需连接 store） |

### 4.2 需要设计决策（问题 2）

问题 2 涉及**多选 vs 确认**的语义分离。需要确认产品意图：

- **选项 A**：保留现状，FlowCard checkbox 仅负责多选，步骤确认由单独按钮操作
- **选项 B**：FlowCard checkbox 点击时，弹出选项"多选"或"确认全部步骤"

### 4.3 延期处理（问题 4）

问题 4 需要架构重构，建议作为独立 Epic。

---

## 5. 推荐方案

### 方案 A：最小修复（推荐）

**目标**：修复 P0 问题，统一 checkbox 行为，最小化改动。

**改动点**：

1. **canvasStore.ts** — 将 `confirmContextNode` 改为 toggle 逻辑
   ```typescript
   confirmContextNode: (nodeId) => {
     set((s) => ({
       contextNodes: s.contextNodes.map(n =>
         n.nodeId === nodeId ? { ...n, confirmed: !n.confirmed, status: n.confirmed ? 'pending' : 'confirmed' } : n
       ),
     }));
   },
   ```

2. **ComponentTree.tsx** — 在每个分组标签旁添加"确认全部"按钮

3. **CardTreeNode.tsx** — 实现 `onCheckboxToggle` 回调实际更新父组件状态

4. **BusinessFlowTree.tsx** — 澄清 FlowCard checkbox 语义，添加工具提示说明用途

**工时**：约 4-6 小时  
**风险**：低  
**收益**：解决核心用户痛点，checkbox 行为可预测

### 方案 B：完整重构

**目标**：重新设计 checkbox 体系，明确区分"确认状态"和"多选状态"。

**改动点**：
- 移除所有卡片上的 checkbox，改用工具栏操作
- 统一使用 Ctrl+Click 进行多选
- 右键菜单提供"确认/取消确认"选项

**工时**：约 2 周  
**风险**：高（破坏性变更）  
**收益**：彻底解决语义混淆

---

## 6. 验收标准

### 问题 1 验收
- [ ] 上下文卡片 checkbox 第一次点击 → confirmed: true（绿色）
- [ ] 上下文卡片 checkbox 第二次点击 → confirmed: false（恢复原色）
- [ ] 状态变更后，上下文树进度正确更新

### 问题 2 验收
- [ ] FlowCard checkbox 点击时，工具提示显示"用于批量选择，非确认操作"
- [ ] 选中多个 FlowCard 后，工具栏出现"删除所选"按钮
- [ ] 步骤确认由独立的"确认"按钮操作，不受 FlowCard checkbox 影响

### 问题 3 验收
- [ ] 组件树每个分组标签旁显示"✓ 确认全部"按钮
- [ ] 点击后，组内所有 `confirmed: false` 的节点变为 `confirmed: true`
- [ ] 组内有子分组时，递归确认所有子节点

### 问题 5 验收
- [ ] CardTreeNode 的子项 checkbox 点击后，实际更新数据
- [ ] CheckboxIcon 组件在所有树中保持一致外观
- [ ] 状态变更有 undo/redo 支持

### 问题 4 验收（延期）
- [ ] 架构评估报告完成
- [ ] 独立 Epic 创建，列入 backlog

---

## 7. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| toggle 逻辑影响级联确认 | 中 | 添加单元测试覆盖 |
| CardTreeNode 状态回传破坏单向数据流 | 中 | 使用受控组件模式，通过回调更新 store |
| FlowCard 语义变更影响现有用户 | 低 | 保持向后兼容，仅添加提示 |

---

## 8. 下一步行动

1. **产品决策**：确认问题 2 的处理方式（方案 A 或 B）
2. **实现**：按方案 A 执行修复
3. **测试**：E2E 测试覆盖 checkbox 交互场景
4. **文档**：更新 SOUL.md 和组件规范，说明 checkbox 使用规范

---

## 附录：关键代码位置

```
src/lib/canvas/canvasStore.ts
  - confirmContextNode (L557)
  - confirmFlowNode (L620)
  - confirmComponentNode (L842)
  - toggleNodeSelect (L341)

src/components/canvas/BoundedContextTree.tsx
  - ContextCard (L97) — checkbox 实现
  - confirmContextNode 调用 (L246)

src/components/canvas/BusinessFlowTree.tsx
  - FlowCard (L363) — checkbox 实现
  - SortableStepRow (L133) — 步骤 checkbox

src/components/canvas/ComponentTree.tsx
  - ComponentCard (L380) — checkbox 实现
  - groupByFlowId (L157) — 分组逻辑

src/components/visualization/CardTreeNode/CardTreeNode.tsx
  - CheckboxItem (L58) — checkbox 实现
  - handleCheckboxToggle (L77) — 空实现，需修复
```
