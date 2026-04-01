# Analysis: Canvas Context Tree Checkbox Missing Bug

**Agent**: analyst
**日期**: 2026-04-01
**项目**: canvas-context-tree-checkbox

---

## 1. 问题定义

**Bug 描述**: Canvas 页上下文树（BoundedContextTree）卡片标题左侧的 checkbox 丢失，勾选逻辑缺失。

**影响**: 用户无法通过 checkbox 批量选择上下文卡片进行操作。

---

## 2. 现状分析

### 2.1 当前实现

**BoundedContextTree.tsx** (line 231):

```tsx
{/* S1.1: Removed selection checkbox — multi-select still works via Ctrl+click on card body */}
<div className={styles.nodeCardHeader}>
```

**状态**: Checkbox 已被**故意移除**。

### 2.2 状态变更历史

| 日期 | 变更 | 说明 |
|------|------|------|
| Epic 3 (2026-03-28) | `confirmed` → `isActive` | 字段重命名 |
| Epic 3 (2026-03-28) | Checkbox 移除 | 改用 Ctrl+Click 多选 |
| Epic 4 (2026-03-31) | Cascade 手动触发 | 移除自动级联 |

### 2.3 当前多选机制

**替代方案**:
- Ctrl+Click 点击卡片 body → 添加到 selectedNodeIds
- 框选（Drag Selection）→ 批量选择

**问题**: 用户习惯使用 checkbox，Ctrl+Click 对新用户不够直观。

---

## 3. 根因分析

### 3.1 直接原因

Checkbox 组件在 Epic 3 中被移除（Line 231 S1.1）。

### 3.2 设计决策

**移除 checkbox 的理由**:
1. 简化 UI，减少视觉干扰
2. Ctrl+Click 提供相同功能
3. 避免与确认状态混淆

**但存在的问题**:
1. 用户习惯 checkbox 操作
2. Ctrl+Click 对新用户不直观
3. 批量选择场景下效率低

---

## 4. 修复方案

### 方案 A：恢复 Checkbox（推荐）

**原理**: 在 BoundedContextTree 卡片 header 中恢复 checkbox。

**代码**:

```tsx
<div className={styles.nodeCardHeader}>
  {/* ✅ 恢复 Selection checkbox */}
  {onToggleSelect && (
    <input
      type="checkbox"
      className={styles.nodeCardCheckbox}
      checked={selected ?? false}
      onChange={() => onToggleSelect(node.nodeId)}
      aria-label={`选择上下文 ${node.name}`}
      onClick={(e) => e.stopPropagation()}
    />
  )}
  {/* Badge and name */}
</div>
```

**优点**:
- 用户习惯的操作方式
- 与 BusinessFlowTree 行为一致

**工时**: 1h

---

### 方案 B：保留现状 + 添加 Tooltip 引导

**原理**: 不恢复 checkbox，但添加引导提示。

```tsx
<div className={styles.nodeCardHeader} title="按住 Ctrl 点击卡片进行多选">
```

**优点**: 不改代码，最快

**缺点**: 用户仍需学习新操作

**工时**: 0.5h

---

### 方案 C：统一多选交互设计

**原理**: 设计统一的多选交互规范，在 ShortcutHintPanel 中说明。

**内容**:
- Ctrl+Click: 多选
- Shift+Click: 范围选
- Esc: 取消选择

**工时**: 1h

---

## 5. 推荐方案

**方案 A**（恢复 Checkbox）。

**理由**:
1. 与 BusinessFlowTree 行为一致
2. 用户体验更直观
3. 1h 可完成，风险低

---

## 6. 验收标准

| 场景 | 预期行为 |
|------|----------|
| 点击 checkbox | 选中/取消选中卡片 |
| Ctrl+Click 卡片 body | 仍可多选 |
| 选中卡片高亮 | 显示 selected 样式 |
| 批量选择 | 多个 checkbox 可同时选中 |

---

## 7. 下一步

1. **派发开发**: `dev-canvas-checkbox` → 实现方案 A
2. **测试验证**: E2E 测试覆盖 checkbox 交互

**工时**: 1h