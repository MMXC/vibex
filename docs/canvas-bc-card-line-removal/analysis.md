# Analysis: Remove Bounded Context Card Lines

**Agent**: analyst
**日期**: 2026-04-01
**项目**: canvas-bc-card-line-removal

---

## 1. 问题定义

**Issue**: 删除限界上下文树（BoundedContextTree）卡片之间的连线（RelationshipConnector）。

**影响**: 简化 UI，减少视觉干扰。

---

## 2. 现状分析

### 2.1 当前实现

**RelationshipConnector.tsx**: SVG 贝塞尔曲线连线，表示领域间关系。

**使用位置**: `BoundedContextTree.tsx` (line 589)

```tsx
<RelationshipConnector
  nodes={contextNodes}
  containerRef={containerRef as React.RefObject<HTMLElement | null>}
/>
```

**功能**: 
- 在上下文树卡片列表上叠加 SVG 贝塞尔曲线
- 表示领域间关系（dependency/aggregate/calls）

---

## 3. 修复方案

### 方案 A：注释掉 RelationshipConnector（推荐）

**原理**: 直接注释掉 RelationshipConnector 组件引用。

**代码**:

```tsx
{/* S1.1: Remove RelationshipConnector — simplify UI
<RelationshipConnector
  nodes={contextNodes}
  containerRef={containerRef as React.RefObject<HTMLElement | null>}
/>
*/}
```

**优点**:
- 改动最小
- 随时可恢复

**工时**: 0.5h

---

### 方案 B：完全删除组件

**原理**: 删除 RelationshipConnector.tsx 文件和相关引用。

**缺点**: 无法恢复，改动大

**工时**: 1h

---

## 4. 推荐方案

**方案 A**（注释掉）。

**理由**:
1. 改动最小
2. 可随时恢复
3. 0.5h 可完成

---

## 5. 验收标准

| 场景 | 预期 |
|------|------|
| 打开上下文树 | 无连线 SVG 叠加 |
| 卡片拖拽 | 功能正常 |

---

## 6. 下一步

1. **派发开发**: `dev-canvas-bc-lines` → 注释掉 RelationshipConnector

**工时**: 0.5h